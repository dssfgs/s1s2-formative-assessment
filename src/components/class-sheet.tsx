import { ClipboardPaste, Plus, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { CellInput } from "@/components/cell-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { classLabel, formOf, TA_BY_FORM, type ClassCode } from "@/lib/classes";
import {
  STAGES,
  SCHOOL_NAME,
  SCHOOL_YEAR,
  assessmentsFor,
  type AssessmentDef,
  type StageId,
} from "@/lib/calendar";
import { downloadText, exportClassCsv } from "@/lib/csv";
import { fmt1, fmtPct, isoToShort, signed } from "@/lib/format";
import { parseRoster } from "@/lib/paste";
import {
  computeClass,
  isActive,
  quizResult,
  type ClassCompute,
  type ScoreEntry,
  type Student,
} from "@/lib/progress";
import { LANGUAGE_SUBJECTS, NONCORE_SUBJECTS, SUBJECTS, subjectShort, type SubjectId } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf, type StudentPatch } from "@/lib/store";
import { cn } from "@/lib/utils";

type InputCol =
  | { kind: "classno" }
  | { kind: "regno" }
  | { kind: "chname" }
  | { kind: "raw"; id: string }
  | { kind: "retake"; id: string };

export function ClassSheet({ code }: { code: ClassCode }) {
  const form = formOf(code);
  const roster = useAppStore((s) => s.roster[code] ?? []);
  const settings = useAppStore((s) => s.settings);
  const setStudent = useAppStore((s) => s.setStudent);
  const setScore = useAppStore((s) => s.setScore);
  const setPaperMax = useAppStore((s) => s.setPaperMax);
  const applyRoster = useAppStore((s) => s.applyRoster);
  const applyStudentPatches = useAppStore((s) => s.applyStudentPatches);
  const addRows = useAppStore((s) => s.addRows);
  const all = useAssessments();
  const maxOf = useMaxOf();

  const [subject, setSubject] = useState<SubjectId>(form === 1 ? "chi" : "eng");
  const [stage, setStage] = useState<StageId | "all">(1);
  const [taMode, setTaMode] = useState(false);
  const [rosterText, setRosterText] = useState("");
  const [rosterMsg, setRosterMsg] = useState("");

  const papers = useMemo(() => {
    return assessmentsFor(all, {
      form,
      subject,
      stage: stage === "all" ? undefined : stage,
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [all, form, subject, stage]);

  const classPapers = useMemo(
    () => assessmentsFor(all, { form }),
    [all, form],
  );

  const computed = useMemo(
    () =>
      computeClass(
        roster,
        classPapers,
        maxOf,
        settings.passPercent,
        settings.progressMethod,
      ),
    [roster, classPapers, maxOf, settings.passPercent, settings.progressMethod],
  );

  const cols: InputCol[] = useMemo(() => {
    const out: InputCol[] = [{ kind: "classno" }, { kind: "chname" }, { kind: "regno" }];
    for (const a of papers) {
      out.push({ kind: "raw", id: a.id });
      if (!taMode) out.push({ kind: "retake", id: a.id });
    }
    return out;
  }, [papers, taMode]);

  const stats = useMemo(() => {
    const active = roster.filter(isActive);
    const pcts: number[] = [];
    let sat = 0;
    let passed = 0;
    let need = 0;
    for (const s of active) {
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
      n: active.length,
      avg: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null,
      passRate: sat ? passed / sat : null,
      need,
    };
  }, [roster, papers, maxOf, settings.passPercent]);

  const ta = TA_BY_FORM[form];

  function onPasteGrid(grid: string[][], startRow: number, startCol: number) {
    const patches: StudentPatch[] = [];
    for (let r = 0; r < grid.length; r++) {
      const student: StudentPatch["student"] = {};
      const scores: Record<string, Partial<ScoreEntry>> = {};
      let has = false;
      for (let c = 0; c < grid[r]!.length; c++) {
        const col = cols[startCol + c];
        if (!col) continue;
        const val = grid[r]![c] ?? "";
        has = true;
        if (col.kind === "classno") student.classno = val;
        else if (col.kind === "regno") student.regno = val;
        else if (col.kind === "chname") student.chname = val;
        else if (col.kind === "raw") {
          scores[col.id] = { ...scores[col.id], raw: val };
        } else {
          scores[col.id] = { ...scores[col.id], retake: val };
        }
      }
      if (has) {
        patches.push({
          index: startRow + r,
          student: Object.keys(student).length ? student : undefined,
          scores: Object.keys(scores).length ? scores : undefined,
        });
      }
    }
    if (patches.length) applyStudentPatches(code, patches);
  }

  function applyPastedRoster() {
    const rows = parseRoster(rosterText);
    if (!rows.length) {
      setRosterMsg("未能辨識名單。請複製 REGNO、CLASSCODE、CLASSNO、ENNAME、CHNAME（可含表頭）。");
      return;
    }
    const n = applyRoster(code, rows);
    setRosterMsg(`已套用 ${n} 名學生（只更新名單，分數保留）。`);
    setRosterText("");
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            班別成績表
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight">
            {classLabel(code)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            分數交{ta.name}輸入 · 答卷請按班號由小至大排列
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            variant={taMode ? "default" : "outline"}
            size="sm"
            onClick={() => setTaMode((v) => !v)}
          >
            {taMode ? "教學助理輸入中" : "教學助理輸入模式"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadText(
                `${code}_課後評估.csv`,
                exportClassCsv(roster, papers, maxOf),
              )
            }
          >
            匯出本表 CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            列印本表
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              document.body.classList.add("print-reports");
              window.print();
              window.setTimeout(() => document.body.classList.remove("print-reports"), 400);
            }}
          >
            列印學生報告
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="本班人數" value={String(stats.n)} />
        <MiniStat label="本表平均" value={fmtPct(stats.avg)} />
        <MiniStat
          label="達標率"
          value={stats.passRate == null ? "—" : fmtPct(stats.passRate * 100)}
        />
        <MiniStat label="待重測" value={String(stats.need)} />
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={cn(
              "h-9 rounded-md px-3 text-sm",
              subject === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {s.short}
          </button>
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

      <Card className="print:hidden">
        <CardContent className="space-y-3 pt-5">
          <div>
            <h2 className="font-display text-base font-medium">貼上 WEBSAMS 名單</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              從 Excel／WEBSAMS 複製{" "}
              <span className="font-medium text-foreground">
                REGNO、CLASSCODE、CLASSNO、ENNAME、CHNAME
              </span>
              （可含表頭），貼上後按套用。只更新名單，已輸入的分數不會被覆蓋。表內任一格亦可
              Ctrl+V 貼上多列分數。
            </p>
          </div>
          <textarea
            className="min-h-20 w-full rounded-md border border-border bg-input px-3 py-2 font-mono text-xs text-input-fg"
            placeholder={"REGNO\tCLASSCODE\tCLASSNO\tENNAME\tCHNAME\n16A001\t1A\t1\tCHAN KA LOK\t陳嘉樂"}
            value={rosterText}
            onChange={(e) => setRosterText(e.target.value)}
            onPaste={(e) => {
              const t = e.clipboardData.getData("text/plain");
              if (t.includes("\t") || t.includes("\n")) {
                e.preventDefault();
                setRosterText(t);
              }
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={applyPastedRoster}>
              <ClipboardPaste className="size-4" />
              套用名單
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => addRows(code, 10)}>
              <Plus className="size-4" />
              加 10 列
            </Button>
            {rosterMsg ? <p className="text-xs text-muted-foreground">{rosterMsg}</p> : null}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground print:hidden">
        輸入後按 <kbd className="rounded border border-border px-1">Enter</kbd> 跳到下一位同一欄；
        Shift+Enter 往上。從 Excel 複製一整欄分數，點本表該欄第一格再 Ctrl+V。
      </p>

      <div className="print-sheet overflow-auto rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="sticky left-0 z-10 bg-primary px-2 py-2 text-left font-medium">班號</th>
              <th className="sticky left-10 z-10 bg-primary px-2 py-2 text-left font-medium">姓名</th>
              <th className="px-2 py-2 text-left font-medium">學號</th>
              {papers.map((a) => (
                <th key={a.id} className="px-1 py-2 text-center font-medium">
                  <div>{isoToShort(a.date)}</div>
                  <div className="flex items-center justify-center gap-0.5 font-normal text-[11px] opacity-90">
                    <input
                      className="sheet-input sheet-input-on-primary w-10"
                      inputMode="numeric"
                      defaultValue={maxOf(a.id)}
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n > 0) setPaperMax(a.id, n);
                      }}
                      aria-label={`${isoToShort(a.date)} 滿分`}
                    />
                    分
                  </div>
                  {!taMode && <div className="font-normal text-[11px] opacity-80">重測</div>}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium">階段%</th>
              <th className="px-2 py-2 text-center font-medium">標準分</th>
              <th className="px-2 py-2 text-center font-medium">進步</th>
              <th className="px-2 py-2 text-center font-medium">達標</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s, row) => {
              if (taMode && !isActive(s) && row > 20) return null;
              const prog = computed.byStudent.get(s.id);
              const latestStage: StageId =
                stage === "all"
                  ? (papers.at(-1)?.stage ?? 1)
                  : stage;
              const sk = `${subject}-${latestStage}`;
              const sr = prog?.stages[sk];
              const delta = prog?.subjectDelta[subject] ?? null;
              return (
                <tr
                  key={s.id}
                  className="border-b border-border/70 hover:bg-muted/30"
                >
                  <td className="sticky left-0 bg-card px-1 py-0.5">
                    <CellInput
                      className="w-10"
                      value={s.classno}
                      row={row}
                      col={0}
                      onChange={(v) => setStudent(code, row, { classno: v })}
                      onPasteGrid={onPasteGrid}
                      aria-label="班號"
                    />
                  </td>
                  <td className="sticky left-10 bg-card px-1 py-0.5">
                    <CellInput
                      className="w-24 text-left"
                      value={s.chname}
                      row={row}
                      col={1}
                      onChange={(v) => setStudent(code, row, { chname: v })}
                      onPasteGrid={onPasteGrid}
                      aria-label="姓名"
                    />
                  </td>
                  <td className="px-1 py-0.5">
                    <CellInput
                      className="w-20 text-left"
                      value={s.regno}
                      row={row}
                      col={2}
                      onChange={(v) => setStudent(code, row, { regno: v })}
                      onPasteGrid={onPasteGrid}
                      aria-label="學號"
                    />
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
                      rawCol={cols.findIndex((c) => c.kind === "raw" && c.id === a.id)}
                      retakeCol={cols.findIndex((c) => c.kind === "retake" && c.id === a.id)}
                      onPasteGrid={onPasteGrid}
                      onChange={(patch) => setScore(code, s.id, a.id, patch)}
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
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground print:hidden">
        語文科（{LANGUAGE_SUBJECTS.map((s) => s.short).join("、")}
        ）每階段多次小測取平均百分率；非核心科目（
        {NONCORE_SUBJECTS.map((s) => s.short).join("、")}）每階段一次。空白格不計入平均。
      </p>

      <StudentReports
        code={code}
        roster={roster}
        papers={papers}
        computed={computed}
        maxOf={maxOf}
        pass={settings.passPercent}
      />
    </div>
  );
}

function StudentReports({
  code,
  roster,
  papers,
  computed,
  maxOf,
  pass,
}: {
  code: ClassCode;
  roster: Student[];
  papers: AssessmentDef[];
  computed: ClassCompute;
  maxOf: (id: string) => number;
  pass: number;
}) {
  const active = roster.filter(isActive);
  return (
    <div className="print-only-reports hidden">
      <p className="mb-4 text-center text-xs text-muted-foreground">
        {SCHOOL_NAME}　{SCHOOL_YEAR}　{classLabel(code)}　課後進展性評估學生報告
      </p>
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">此班尚未有學生。</p>
      ) : (
        active.map((s) => {
          const prog = computed.byStudent.get(s.id);
          return (
            <article
              key={s.id}
              className="mb-6 break-inside-avoid rounded-lg border border-border p-4"
            >
              <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                <h2 className="font-display text-lg">
                  {s.classno}　{s.chname || "（未填姓名）"}
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  {s.regno || "—"}　{classLabel(code)}
                </p>
              </header>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1">日期</th>
                    <th className="py-1">科目</th>
                    <th className="py-1 text-right">得分</th>
                    <th className="py-1 text-right">重測</th>
                    <th className="py-1 text-right">百分率</th>
                    <th className="py-1 text-center">結果</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map((a) => {
                    const r = quizResult(s, a, maxOf(a.id), pass);
                    return (
                      <tr key={a.id} className="border-t border-border/60">
                        <td className="py-1 tabular-nums">{isoToShort(a.date)}</td>
                        <td className="py-1">{subjectShort(a.subject)}</td>
                        <td className="py-1 text-right tabular-nums">
                          {r.raw == null ? "—" : `${r.raw}/${r.max}`}
                        </td>
                        <td className="py-1 text-right tabular-nums">
                          {r.retake == null ? "—" : r.retake}
                        </td>
                        <td className="py-1 text-right tabular-nums">{fmtPct(r.pct)}</td>
                        <td className="py-1 text-center">
                          {r.passed == null ? "—" : r.passed ? "達標" : "重測"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                進步指數 {signed(prog?.overall)}
                {prog
                  ? "　" +
                    SUBJECTS.filter((sub) => prog.subjectDelta[sub.id] != null)
                      .map((sub) => `${subjectShort(sub.id)} ${signed(prog.subjectDelta[sub.id])}`)
                      .join("　")
                  : ""}
              </p>
            </article>
          );
        })
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card px-3 py-2 shadow-[var(--shadow-card)]">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}

function ScorePair({
  student,
  paper,
  max,
  pass,
  taMode,
  row,
  rawCol,
  retakeCol,
  onPasteGrid,
  onChange,
}: {
  student: Student;
  paper: AssessmentDef;
  max: number;
  pass: number;
  taMode: boolean;
  row: number;
  rawCol: number;
  retakeCol: number;
  onPasteGrid: (grid: string[][], startRow: number, startCol: number) => void;
  onChange: (patch: { raw?: string; retake?: string }) => void;
}) {
  const entry = student.scores[paper.id] ?? { raw: "", retake: "" };
  const r = quizResult(student, paper, max, pass);
  const bg =
    r.pct == null
      ? ""
      : r.passed
        ? "bg-pass/70 text-pass-fg"
        : "bg-fail/80 text-fail-fg";
  return (
    <td className={cn("px-0.5 py-0.5 text-center", bg)}>
      <CellInput
        inputMode="decimal"
        value={entry.raw}
        row={row}
        col={rawCol}
        onChange={(v) => onChange({ raw: v })}
        onPasteGrid={onPasteGrid}
        aria-label={`${student.chname || "學生"} ${isoToShort(paper.date)} 分數`}
      />
      {!taMode && (
        <CellInput
          className="opacity-80"
          inputMode="decimal"
          value={entry.retake}
          row={row}
          col={retakeCol}
          onChange={(v) => onChange({ retake: v })}
          onPasteGrid={onPasteGrid}
          aria-label={`${student.chname || "學生"} ${isoToShort(paper.date)} 重測`}
        />
      )}
    </td>
  );
}
