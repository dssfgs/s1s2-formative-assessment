import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classLabel, formOf, TA_BY_FORM, type ClassCode } from "@/lib/classes";
import {
  STAGES,
  assessmentsFor,
  type AssessmentDef,
  type StageId,
} from "@/lib/calendar";
import { downloadText, exportClassCsv } from "@/lib/csv";
import { fmt1, fmtPct, isoToShort, signed } from "@/lib/format";
import {
  computeClass,
  isActive,
  quizResult,
  type Student,
} from "@/lib/progress";
import { LANGUAGE_SUBJECTS, NONCORE_SUBJECTS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ClassSheet({ code }: { code: ClassCode }) {
  const form = formOf(code);
  const roster = useAppStore((s) => s.roster[code] ?? []);
  const settings = useAppStore((s) => s.settings);
  const setStudent = useAppStore((s) => s.setStudent);
  const setScore = useAppStore((s) => s.setScore);
  const setPaperMax = useAppStore((s) => s.setPaperMax);
  const all = useAssessments();
  const maxOf = useMaxOf();

  const [subject, setSubject] = useState<SubjectId>(form === 1 ? "chi" : "eng");
  const [stage, setStage] = useState<StageId | "all">(1);
  const [taMode, setTaMode] = useState(false);

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

  const ta = TA_BY_FORM[form];

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
            分數交{ta.name}輸入 · 請按班號由小至大排列
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
            列印
          </Button>
        </div>
      </header>

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

      <div className="overflow-auto rounded-lg bg-card shadow-[var(--shadow-card)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
              <th className="sticky left-0 z-10 bg-muted/80 px-2 py-2 font-medium">班號</th>
              <th className="sticky left-10 z-10 bg-muted/80 px-2 py-2 font-medium">姓名</th>
              {papers.map((a) => (
                <th key={a.id} className="px-1 py-2 text-center font-medium">
                  <div>{isoToShort(a.date)}</div>
                  <div className="flex items-center justify-center gap-0.5 font-normal text-[10px]">
                    <input
                      className="sheet-input w-10"
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
                  {!taMode && <div className="font-normal text-[10px]">重測</div>}
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
                    <input
                      className="sheet-input w-10"
                      value={s.classno}
                      onChange={(e) =>
                        setStudent(code, row, { classno: e.target.value })
                      }
                      aria-label="班號"
                    />
                  </td>
                  <td className="sticky left-10 bg-card px-1 py-0.5">
                    <input
                      className="sheet-input w-24 text-left"
                      value={s.chname}
                      onChange={(e) =>
                        setStudent(code, row, { chname: e.target.value })
                      }
                      aria-label="姓名"
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

      <p className="text-xs text-muted-foreground">
        語文科（{LANGUAGE_SUBJECTS.map((s) => s.short).join("、")}
        ）每階段多次小測取平均百分率；非核心科目（
        {NONCORE_SUBJECTS.map((s) => s.short).join("、")}）每階段一次。空白格不計入平均。
      </p>
    </div>
  );
}

function ScorePair({
  student,
  paper,
  max,
  pass,
  taMode,
  onChange,
}: {
  student: Student;
  paper: AssessmentDef;
  max: number;
  pass: number;
  taMode: boolean;
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
      <input
        className="sheet-input"
        inputMode="decimal"
        value={entry.raw}
        placeholder=""
        onChange={(e) => onChange({ raw: e.target.value })}
        aria-label={`${student.chname || "學生"} ${isoToShort(paper.date)} 分數`}
      />
      {!taMode && (
        <input
          className="sheet-input opacity-80"
          inputMode="decimal"
          value={entry.retake}
          placeholder="重測"
          onChange={(e) => onChange({ retake: e.target.value })}
          aria-label={`${student.chname || "學生"} ${isoToShort(paper.date)} 重測`}
        />
      )}
    </td>
  );
}
