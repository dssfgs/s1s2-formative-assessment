import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ALL_CLASSES, classLabel, formOf, S1_CLASSES, S2_CLASSES, type ClassCode } from "@/lib/classes";
import { STAGES, assessmentsFor, type StageId } from "@/lib/calendar";
import { downloadText } from "@/lib/csv";
import { fmtPct, signed } from "@/lib/format";
import { computeClass, isActive, progressOf, quizResult, type Student } from "@/lib/progress";
import { LANGUAGE_SUBJECTS, NONCORE_SUBJECTS, type SubjectId } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/all")({ component: AllPage });

type SortKey = "class" | "pct" | "need" | "progress";

type Row = {
  code: ClassCode;
  student: Student;
  pct: number | null;
  passed: number;
  sat: number;
  need: number;
  overall: number | null;
};

export function AllPage() {
  const roster = useAppStore((s) => s.roster);
  const settings = useAppStore((s) => s.settings);
  const all = useAssessments();
  const maxOf = useMaxOf();

  const [form, setForm] = useState<1 | 2 | "all">("all");
  const [subject, setSubject] = useState<SubjectId | "all">("all");
  const [stage, setStage] = useState<StageId | "all">("all");
  const [onlyNeed, setOnlyNeed] = useState(false);
  const [sort, setSort] = useState<SortKey>("class");

  const classes = form === "all" ? ALL_CLASSES : form === 1 ? S1_CLASSES : S2_CLASSES;

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const code of classes) {
      const formN = formOf(code);
      const formPapers = assessmentsFor(all, { form: formN, classCode: code });
      const viewPapers = assessmentsFor(formPapers, {
        subject: subject === "all" ? undefined : subject,
        stage: stage === "all" ? undefined : stage,
      }).filter((a) => (onlyNeed ? a.group !== "formal" : true));
      const computed = computeClass(
        roster[code] ?? [],
        formPapers,
        maxOf,
        settings.passPercent,
        settings.progressMethod,
      );
      for (const s of roster[code] ?? []) {
        if (!isActive(s)) continue;
        let sat = 0;
        let passed = 0;
        let need = 0;
        const pcts: number[] = [];
        for (const a of viewPapers) {
          const r = quizResult(s, a, maxOf(a.id), settings.passPercent);
          if (r.pct == null) continue;
          sat++;
          pcts.push(r.pct);
          if (r.passed) passed++;
          if (r.needsRetake) need++;
        }
        const prog = computed.byStudent.get(s.id);
        const overall = progressOf(prog, subject, stage);
        out.push({
          code,
          student: s,
          pct: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null,
          passed,
          sat,
          need,
          overall,
        });
      }
    }
    const filtered = onlyNeed ? out.filter((r) => r.need > 0) : out;
    return filtered.sort((a, b) => {
      if (sort === "pct") return (b.pct ?? -1) - (a.pct ?? -1);
      if (sort === "need") return b.need - a.need;
      if (sort === "progress") return (b.overall ?? -999) - (a.overall ?? -999);
      const c = a.code.localeCompare(b.code);
      if (c !== 0) return c;
      return a.student.classno.localeCompare(b.student.classno, "zh-Hant", { numeric: true });
    });
  }, [classes, roster, all, maxOf, settings, subject, stage, onlyNeed, sort]);

  const summary = useMemo(() => {
    const n = rows.length;
    const pcts = rows.map((r) => r.pct).filter((x): x is number => x !== null);
    const need = rows.reduce((a, r) => a + r.need, 0);
    return {
      n,
      avg: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null,
      need,
    };
  }, [rows]);

  function exportCsv() {
    const header = ["班別", "班號", "姓名", "學號", "平均%", "已達標次數", "已交卷", "待重測", "進步指數"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.code,
          r.student.classno,
          r.student.chname,
          r.student.regno,
          r.pct == null ? "" : r.pct.toFixed(1),
          r.passed,
          r.sat,
          r.need,
          r.overall == null ? "" : r.overall.toFixed(2),
        ].join(","),
      ),
    ];
    downloadText("全校課後評估.csv", lines.join("\n"));
  }

  const progressHead =
    subject === "chi" || subject === "eng"
      ? "語文進步"
      : subject === "all"
        ? "語文進步"
        : "測考−階段";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            對齊 WEBSAMS 輸入習慣
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight">全校總表</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            八班同一畫面。中文、英文分開篩選；非核心可看測考相對階段。Ruby（中一）／Ann（中二）可按「待重測」篩選。
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            匯出 CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            列印
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Chip active={form === "all"} onClick={() => setForm("all")}>
          全級
        </Chip>
        <Chip active={form === 1} onClick={() => setForm(1)}>
          中一
        </Chip>
        <Chip active={form === 2} onClick={() => setForm(2)}>
          中二
        </Chip>
      </div>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Chip active={subject === "all"} onClick={() => setSubject("all")}>
          語文合計
        </Chip>
        {LANGUAGE_SUBJECTS.map((s) => (
          <Chip key={s.id} active={subject === s.id} onClick={() => setSubject(s.id)}>
            {s.short}
          </Chip>
        ))}
        <span className="mx-1 w-px self-stretch bg-border" />
        {NONCORE_SUBJECTS.map((s) => (
          <Chip key={s.id} active={subject === s.id} onClick={() => setSubject(s.id)}>
            {s.short}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Chip active={stage === "all"} onClick={() => setStage("all")}>
          全部階段
        </Chip>
        {STAGES.map((s) => (
          <Chip key={s.id} active={stage === s.id} onClick={() => setStage(s.id)}>
            {s.name}
          </Chip>
        ))}
        <label className="ml-auto flex h-8 items-center gap-2 rounded-md bg-card px-3 text-xs">
          <input
            type="checkbox"
            checked={onlyNeed}
            onChange={(e) => setOnlyNeed(e.target.checked)}
          />
          只看待重測
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:max-w-lg">
        <Mini label="人數" value={String(summary.n)} />
        <Mini label="平均" value={fmtPct(summary.avg)} />
        <Mini label="待重測人次" value={String(summary.need)} />
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <Th onClick={() => setSort("class")} active={sort === "class"}>
                班別
              </Th>
              <th className="px-2 py-2 text-left font-medium">班號</th>
              <th className="px-2 py-2 text-left font-medium">姓名</th>
              <th className="px-2 py-2 text-left font-medium">學號</th>
              <Th onClick={() => setSort("pct")} active={sort === "pct"}>
                平均%
              </Th>
              <th className="px-2 py-2 text-center font-medium">達標/交卷</th>
              <Th onClick={() => setSort("need")} active={sort === "need"}>
                待重測
              </Th>
              <Th onClick={() => setSort("progress")} active={sort === "progress"}>
                {progressHead}
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  尚未有名單。到班別貼上 WEBSAMS 名單，或在總覽載入示範數據。
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={`${r.code}-${r.student.id}`} className="border-b border-border/70 hover:bg-muted/40">
                  <td className="px-2 py-1.5">
                    <Link
                      to="/class/$code"
                      params={{ code: r.code }}
                      className="font-medium hover:underline"
                    >
                      {classLabel(r.code)}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">{r.student.classno}</td>
                  <td className="px-2 py-1.5">{r.student.chname}</td>
                  <td className="px-2 py-1.5 font-mono text-xs">{r.student.regno}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums">{fmtPct(r.pct)}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums">
                    {r.sat ? `${r.passed}/${r.sat}` : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {r.need ? <Badge tone="fail">{r.need}</Badge> : <span className="text-muted-foreground">0</span>}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-1.5 text-center tabular-nums font-medium",
                      (r.overall ?? 0) > 0 && "text-up",
                      (r.overall ?? 0) < 0 && "text-down",
                    )}
                  >
                    {signed(r.overall)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 rounded-md px-3 text-xs",
        active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Th({
  children,
  onClick,
  active,
}: {
  children: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <th className="px-2 py-2 text-center font-medium">
      <button onClick={onClick} className={cn("hover:underline", active && "underline")}>
        {children}
      </button>
    </th>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card px-3 py-2 shadow-[var(--shadow-card)]">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
