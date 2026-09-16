import { Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { MaxInput, MiniStat, ScorePair } from "@/components/sheet-cells";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formOf, TA_BY_FORM, classLabel, type ClassCode } from "@/lib/classes";
import {
  STAGES,
  assessmentsFor,
  paperHeading,
  paperLabel,
  paperSubheading,
  sortPapers,
  type StageId,
} from "@/lib/calendar";
import { downloadText, exportClassCsv } from "@/lib/csv";
import { fmt1, fmtPct, signed } from "@/lib/format";
import {
  STREAM_GROUPS,
  classesInGroup,
  formOfGroup,
  groupLabel,
  groupShort,
  isPullout,
  rosterHasGroups,
  studentsInGroup,
  type StreamId,
} from "@/lib/groups";
import { computeClass, progressOf, quizResult, type ScoreEntry } from "@/lib/progress";
import { subjectShort } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";
import { cn } from "@/lib/utils";

type InputCol = { kind: "raw"; id: string } | { kind: "retake"; id: string };

export function GroupSheet({ subject, groupId }: { subject: StreamId; groupId: string }) {
  const form = formOfGroup(groupId);
  const roster = useAppStore((s) => s.roster);
  const settings = useAppStore((s) => s.settings);
  const setScore = useAppStore((s) => s.setScore);
  const applyScoresByStudent = useAppStore((s) => s.applyScoresByStudent);
  const loadOfficialRoster = useAppStore((s) => s.loadOfficialRoster);
  const all = useAssessments();
  const maxOf = useMaxOf();

  const [stage, setStage] = useState<StageId | "all">(1);
  const [taMode, setTaMode] = useState(true);

  const students = useMemo(
    () => studentsInGroup(roster, subject, groupId),
    [roster, subject, groupId],
  );
  const hasGroups = rosterHasGroups(roster);
  const homeClasses = classesInGroup(subject, groupId);
  const ta = TA_BY_FORM[form];

  const papers = useMemo(
    () =>
      sortPapers(
        assessmentsFor(all, {
          form,
          subject,
          stage: stage === "all" ? undefined : stage,
        }),
      ),
    [all, form, subject, stage],
  );

  const computed = useMemo(() => {
    const byClass = {} as Record<ClassCode, ReturnType<typeof computeClass>>;
    for (const code of homeClasses) {
      byClass[code] = computeClass(
        roster[code] ?? [],
        assessmentsFor(all, { form: formOf(code) }),
        maxOf,
        settings.passPercent,
        settings.progressMethod,
      );
    }
    return byClass;
  }, [homeClasses, roster, all, maxOf, settings.passPercent, settings.progressMethod]);

  const cols: InputCol[] = useMemo(() => {
    const out: InputCol[] = [];
    for (const a of papers) {
      out.push({ kind: "raw", id: a.id });
      if (!taMode && a.group !== "formal") out.push({ kind: "retake", id: a.id });
    }
    return out;
  }, [papers, taMode]);

  const identityCols = 3;

  const stats = useMemo(() => {
    const pcts: number[] = [];
    let sat = 0;
    let passed = 0;
    let need = 0;
    for (const s of students) {
      for (const a of papers) {
        const r = quizResult(s, a, maxOf(a.id), settings.passPercent);
        if (r.pct == null) continue;
        sat++;
        pcts.push(r.pct);
        if (r.passed) passed++;
        if (r.needsRetake) need++;
      }
    }
    return {
      n: students.length,
      avg: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null,
      passRate: sat ? passed / sat : null,
      need,
    };
  }, [students, papers, maxOf, settings.passPercent]);

  function onPasteGrid(grid: string[][], startRow: number, startCol: number) {
    const items: { studentId: string; scores: Record<string, Partial<ScoreEntry>> }[] = [];
    const scoreStart = startCol - identityCols;
    for (let r = 0; r < grid.length; r++) {
      const student = students[startRow + r];
      if (!student) continue;
      const scores: Record<string, Partial<ScoreEntry>> = {};
      let has = false;
      for (let c = 0; c < grid[r]!.length; c++) {
        const col = cols[scoreStart + c];
        if (!col) continue;
        const val = grid[r]![c] ?? "";
        has = true;
        if (col.kind === "raw") scores[col.id] = { ...scores[col.id], raw: val };
        else scores[col.id] = { ...scores[col.id], retake: val };
      }
      if (has) items.push({ studentId: student.id, scores });
    }
    if (items.length) applyScoresByStudent(items);
  }

  const progressLabel = stage === "all" ? "進步指數" : "階段進步";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {subject === "chi" ? "中文" : "英文"}上課分組
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight">{groupLabel(groupId)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPullout(groupId) ? "抽離組" : "原班"} · 來自{" "}
            {homeClasses.map(classLabel).join("、")} · 分數交{ta.name}按本表班號由小至大輸入
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant={taMode ? "default" : "outline"} size="sm" onClick={() => setTaMode((v) => !v)}>
            {taMode ? "教學助理輸入中" : "教學助理輸入模式"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadText(
                `${subjectShort(subject)}_${groupId}_課後評估.csv`,
                exportClassCsv(students, papers, maxOf),
              )
            }
          >
            匯出本表 CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            列印本表
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="本組人數" value={String(stats.n)} />
        <MiniStat label="本表平均" value={fmtPct(stats.avg)} />
        <MiniStat
          label="達標率"
          value={stats.passRate == null ? "—" : fmtPct(stats.passRate * 100)}
        />
        <MiniStat label="待重測" value={String(stats.need)} />
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Link
          to="/groups"
          className="h-9 rounded-md bg-card px-3 text-sm leading-9 text-muted-foreground hover:bg-muted"
        >
          全部分組
        </Link>
        {STREAM_GROUPS[subject][form].map((id) => (
          <Link
            key={id}
            to="/group/$subject/$code"
            params={{ subject, code: id }}
            className={cn(
              "h-9 rounded-md px-3 text-sm leading-9",
              id === groupId
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {groupShort(id)}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          onClick={() => setStage("all")}
          className={cn(
            "h-8 rounded-md px-3 text-xs",
            stage === "all" ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
          )}
        >
          全部階段
        </button>
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStage(s.id)}
            className={cn(
              "h-8 rounded-md px-3 text-xs",
              stage === s.id ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground print:hidden">
        名單已按班別、班號排列，與分組上課名單相同。中文、英文分開輸入。進步指數＝該科連續兩次課後小測百分率差的平均。
      </p>

      {!hasGroups ? (
        <div className="rounded-lg border border-border bg-card p-4 print:hidden">
          <p className="text-sm">尚未載入本學年分組名單。載入後此表會列出本組學生，已輸入分數會按中文姓名保留。</p>
          <Button className="mt-3" size="sm" onClick={() => loadOfficialRoster()}>
            載入 2026-2027 分組名單
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground print:hidden">
        表頂「滿分」列可改每一次評估的滿分。輸入分數後按{" "}
        <kbd className="rounded border border-border px-1">Enter</kbd> 跳到下一位同一欄。從 Excel
        複製一整欄分數，點本表該欄第一格再 Ctrl+V。
      </p>

      <div className="print-sheet overflow-auto rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="sticky left-0 z-10 bg-primary px-2 py-2 text-left font-medium">班別</th>
              <th className="sticky left-12 z-10 bg-primary px-2 py-2 text-left font-medium">班號</th>
              <th className="px-2 py-2 text-left font-medium">姓名</th>
              {papers.map((a) => {
                const formal = a.group === "formal";
                return (
                  <th
                    key={a.id}
                    className={cn("px-1 py-2 text-center font-medium", formal && "bg-gold text-gold-fg")}
                  >
                    <div>{paperHeading(a)}</div>
                    <div className="font-normal text-[10px] opacity-80">{paperSubheading(a)}</div>
                    <div className="font-normal text-[11px] opacity-90">滿分 {maxOf(a.id)}</div>
                    {!taMode && !formal && (
                      <div className="font-normal text-[11px] opacity-80">重測</div>
                    )}
                  </th>
                );
              })}
              <th className="px-2 py-2 text-center font-medium">階段%</th>
              <th className="px-2 py-2 text-center font-medium">標準分</th>
              <th className="px-2 py-2 text-center font-medium">{progressLabel}</th>
              <th className="px-2 py-2 text-center font-medium">達標</th>
            </tr>
            <tr className="bg-secondary text-secondary-foreground">
              <th className="sticky left-0 z-10 bg-secondary px-2 py-1.5 text-left text-xs font-medium">
                滿分
              </th>
              <th className="sticky left-12 z-10 bg-secondary px-2 py-1.5" />
              <th className="px-2 py-1.5" />
              {papers.map((a) => (
                <td
                  key={a.id}
                  className={cn("px-0.5 py-1 text-center", a.group === "formal" && "bg-gold/20")}
                >
                  <MaxInput
                    id={a.id}
                    max={maxOf(a.id)}
                    col={identityCols + cols.findIndex((c) => c.kind === "raw" && c.id === a.id)}
                    label={paperLabel(a)}
                  />
                </td>
              ))}
              <td colSpan={4} className="px-2 py-1 text-left text-[11px] font-normal text-muted-foreground">
                同級同一份卷共用滿分
              </td>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={7 + papers.length} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  此組尚未有學生。請先載入本學年分組名單。
                </td>
              </tr>
            ) : (
              students.map((s, row) => {
                const prog = computed[s.classcode]?.byStudent.get(s.id);
                const latestStage: StageId =
                  stage === "all"
                    ? (papers.filter((a) => a.group !== "formal").at(-1)?.stage ?? 1)
                    : stage;
                const sk = `${subject}-${latestStage}`;
                const sr = prog?.stages[sk];
                const delta = progressOf(prog, subject, stage);
                return (
                  <tr key={s.id} className="border-b border-border/70 hover:bg-muted/30">
                    <td className="sticky left-0 bg-card px-2 py-1.5 font-medium tabular-nums">
                      {s.classcode}
                    </td>
                    <td className="sticky left-12 bg-card px-2 py-1.5 tabular-nums">{s.classno}</td>
                    <td className="px-2 py-1.5">
                      {s.chname || "（未填姓名）"}
                      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                        {s.enname}
                      </span>
                    </td>
                    {papers.map((a) => (
                      <ScorePair
                        key={a.id}
                        student={s}
                        paper={a}
                        max={maxOf(a.id)}
                        pass={settings.passPercent}
                        taMode={taMode}
                        row={row}
                        rawCol={
                          identityCols + cols.findIndex((c) => c.kind === "raw" && c.id === a.id)
                        }
                        retakeCol={
                          identityCols + cols.findIndex((c) => c.kind === "retake" && c.id === a.id)
                        }
                        onPasteGrid={onPasteGrid}
                        onChange={(patch) => setScore(s.classcode, s.id, a.id, patch)}
                      />
                    ))}
                    <td className="px-2 text-center tabular-nums">{fmtPct(sr?.pct)}</td>
                    <td className="px-2 text-center tabular-nums">{sr?.z == null ? "—" : fmt1(sr.z)}</td>
                    <td
                      className={cn(
                        "px-2 text-center tabular-nums font-medium",
                        delta != null && delta > 0 && "text-up",
                        delta != null && delta < 0 && "text-down",
                      )}
                    >
                      {signed(delta)}
                    </td>
                    <td className="px-2 text-center">
                      {sr?.passedAll == null ? (
                        "—"
                      ) : (
                        <Badge tone={sr.passedAll ? "pass" : "fail"}>
                          {sr.passedAll ? "達標" : "重測"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

