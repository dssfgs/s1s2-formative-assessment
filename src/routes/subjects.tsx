import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CLASSES, classLabel, formOf, type ClassCode } from "@/lib/classes";
import {
  FORMALS,
  FORMAL_BY_KIND,
  STAGES,
  assessmentsFor,
  paperHeading,
  sortPapers,
  type FormalKind,
  type StageId,
} from "@/lib/calendar";
import { fmtPct, signed } from "@/lib/format";
import {
  STREAM_GROUPS,
  groupField,
  groupShort,
  type StreamId,
} from "@/lib/groups";
import {
  computeClass,
  formalDeltaKey,
  isActive,
  progressOf,
  quizResult,
  type Student,
} from "@/lib/progress";
import { NONCORE_SUBJECTS, subjectShort, type SubjectId } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subjects")({ component: SubjectsPage });

type Track = "chi" | "eng" | "noncore";
type ChartKind = "trend" | "delta" | "pass" | "bands" | "split";

type ClassSummary = {
  code: ClassCode;
  name: string;
  n: number;
  sat: number;
  mean: number | null;
  passRate: number | null;
  need: number;
  delta: number | null;
  bands: { 未達標: number; 達標: number; 良好: number; 優秀: number };
};

const CLASS_COLORS = [
  "var(--color-primary)",
  "var(--color-gold)",
  "var(--color-up)",
  "var(--color-destructive)",
] as const;

const BANDS = [
  { key: "未達標", fill: "var(--color-destructive)" },
  { key: "達標", fill: "var(--color-primary)" },
  { key: "良好", fill: "var(--color-up)" },
  { key: "優秀", fill: "var(--color-gold)" },
] as const;

function chartTabs(track: Track): { id: ChartKind; label: string; hint: string }[] {
  return [
    { id: "trend", label: "走勢", hint: "每次評估各班平均百分率" },
    { id: "delta", label: "進步", hint: track === "noncore" ? "測考相對階段的班平均" : "連續小測升幅的班平均" },
    { id: "pass", label: "達標", hint: "達標率與待重測人數" },
    { id: "bands", label: "分布", hint: "學生分數段（未達標／達標／良好／優秀）" },
    {
      id: "split",
      label: track === "noncore" ? "對照" : "分組",
      hint: track === "noncore" ? "課後評估與測驗／考試並排" : "原班與抽離組平均百分率",
    },
  ];
}

export function SubjectsPage() {
  const roster = useAppStore((s) => s.roster);
  const settings = useAppStore((s) => s.settings);
  const all = useAssessments();
  const maxOf = useMaxOf();
  const [form, setForm] = useState<1 | 2>(1);
  const [track, setTrack] = useState<Track>("chi");
  const [langStage, setLangStage] = useState<StageId | "all">("all");
  const [noncoreSub, setNoncoreSub] = useState<SubjectId>("geo");
  const [formalKind, setFormalKind] = useState<FormalKind>("T1A1");
  const [chart, setChart] = useState<ChartKind>("trend");

  const classes = ALL_CLASSES.filter((c) => formOf(c) === form);
  const formal = FORMAL_BY_KIND[formalKind];
  const subject: SubjectId = track === "noncore" ? noncoreSub : track;
  const pass = settings.passPercent;
  const tabs = chartTabs(track);
  const currentTab = tabs.find((t) => t.id === chart) ?? tabs[0]!;

  const papers = useMemo(() => {
    const list = sortPapers(
      assessmentsFor(all, {
        form,
        subject,
        stage: track === "noncore" ? undefined : langStage === "all" ? undefined : langStage,
      }),
    );
    if (track === "noncore") return list.filter((a) => a.group !== "language");
    return list.filter((a) => a.group !== "formal");
  }, [all, form, subject, track, langStage]);

  const quizzes = useMemo(() => papers.filter((a) => a.group !== "formal"), [papers]);

  const computedByClass = useMemo(() => {
    const map = new Map<ClassCode, ReturnType<typeof computeClass>>();
    for (const code of classes) {
      map.set(
        code,
        computeClass(
          roster[code] ?? [],
          all.filter((a) => a.form === form),
          maxOf,
          pass,
          settings.progressMethod,
        ),
      );
    }
    return map;
  }, [classes, all, form, roster, maxOf, pass, settings.progressMethod]);

  const classSummaries: ClassSummary[] = useMemo(() => {
    return classes.map((code) => {
      const students = (roster[code] ?? []).filter(isActive);
      const computed = computedByClass.get(code)!;
      const pcts: number[] = [];
      let sat = 0;
      let passed = 0;
      let need = 0;
      const bands = { 未達標: 0, 達標: 0, 良好: 0, 優秀: 0 };
      for (const s of students) {
        const studentPcts: number[] = [];
        for (const a of quizzes) {
          const r = quizResult(s, a, maxOf(a.id), pass);
          if (r.pct == null) continue;
          sat++;
          pcts.push(r.pct);
          studentPcts.push(r.pct);
          if (r.passed) passed++;
          if (r.needsRetake) need++;
        }
        if (studentPcts.length) {
          bands[bandOf(average(studentPcts)!, pass)]++;
        }
      }
      const deltas = [...computed.byStudent.values()]
        .map((p) =>
          track === "noncore"
            ? p.formalDelta[formalDeltaKey(noncoreSub, formalKind)]
            : progressOf(p, subject, langStage),
        )
        .filter((v): v is number => v != null);
      return {
        code,
        name: classLabel(code),
        n: students.length,
        sat,
        mean: average(pcts),
        passRate: sat ? (passed / sat) * 100 : null,
        need,
        delta: average(deltas),
        bands,
      };
    });
  }, [
    classes,
    roster,
    quizzes,
    computedByClass,
    maxOf,
    pass,
    track,
    noncoreSub,
    formalKind,
    subject,
    langStage,
  ]);

  const trendRows = useMemo(() => {
    const series = track === "noncore" ? papers.filter((a) => a.group !== "formal") : quizzes;
    return series.map((a) => {
      const row: Record<string, string | number | null> = {
        label: paperHeading(a),
        date: a.date,
      };
      const allPcts: number[] = [];
      for (const code of classes) {
        const pcts = (roster[code] ?? [])
          .filter(isActive)
          .map((s) => quizResult(s, a, maxOf(a.id), pass).pct)
          .filter((v): v is number => v != null);
        const m = average(pcts);
        row[classLabel(code)] = m;
        allPcts.push(...pcts);
      }
      row["全級"] = average(allPcts);
      return row;
    });
  }, [track, papers, quizzes, classes, roster, maxOf, pass]);

  const splitRows: Record<string, string | number | null>[] = useMemo(() => {
    if (track === "noncore") {
      return classSummaries.map((c) => {
        const computed = computedByClass.get(c.code)!;
        const exams = [...computed.byStudent.values()]
          .map((p) => {
            const d = p.formalDelta[formalDeltaKey(noncoreSub, formalKind)];
            const stage = p.stages[`${noncoreSub}-${formal.stage}`]?.pct;
            if (d == null || stage == null) return null;
            return stage + d;
          })
          .filter((v): v is number => v != null);
        const stage = computed.stageMeta[`${noncoreSub}-${formal.stage}`];
        return {
          name: c.name,
          課後評估: stage?.mean ?? null,
          測考: average(exams),
          n: stage?.n ?? 0,
          delta: c.delta,
        };
      });
    }
    const groups = STREAM_GROUPS[track][form];
    const formStudents = classes.flatMap((c) => roster[c] ?? []).filter(isActive);
    return groups.map((id) => {
      const members = formStudents.filter((s) => streamGroupOf(s, track) === id);
      const pcts: number[] = [];
      const deltas: number[] = [];
      for (const s of members) {
        const studentPcts: number[] = [];
        for (const a of quizzes) {
          const r = quizResult(s, a, maxOf(a.id), pass);
          if (r.pct != null) studentPcts.push(r.pct);
        }
        if (studentPcts.length) pcts.push(average(studentPcts)!);
        const prog = computedByClass.get(s.classcode)?.byStudent.get(s.id);
        const d = progressOf(prog, track, langStage);
        if (d != null) deltas.push(d);
      }
      return {
        name: groupShort(id),
        id,
        平均: average(pcts),
        進步: average(deltas),
        n: members.length,
      };
    });
  }, [
    track,
    classSummaries,
    computedByClass,
    noncoreSub,
    formalKind,
    formal.stage,
    form,
    classes,
    roster,
    quizzes,
    maxOf,
    pass,
    langStage,
  ]);

  const stats = useMemo(() => {
    const pcts = classSummaries.flatMap((c) => (c.mean == null ? [] : [c.mean]));
    const sat = classSummaries.reduce((n, c) => n + c.sat, 0);
    const need = classSummaries.reduce((n, c) => n + c.need, 0);
    const passedWeighted = classSummaries.reduce(
      (n, c) => n + (c.passRate == null ? 0 : (c.passRate / 100) * c.sat),
      0,
    );
    const deltas = classSummaries.flatMap((c) => (c.delta == null ? [] : [c.delta]));
    return {
      mean: average(pcts),
      passRate: sat ? (passedWeighted / sat) * 100 : null,
      need,
      delta: average(deltas),
      sat,
    };
  }, [classSummaries]);

  const hasData = useMemo(() => {
    if (chart === "trend") {
      return trendRows.some(
        (r) => classes.some((c) => num(r[classLabel(c)]) != null) || num(r["全級"]) != null,
      );
    }
    if (chart === "delta") return classSummaries.some((c) => c.delta != null);
    if (chart === "split") {
      if (track === "noncore") {
        return splitRows.some((r) => num(r.課後評估) != null || num(r.測考) != null);
      }
      return splitRows.some((r) => num(r.平均) != null);
    }
    return classSummaries.some((c) => c.sat > 0);
  }, [chart, trendRows, classes, classSummaries, splitRows, track]);

  const title =
    track === "chi" ? "中文小測進程" : track === "eng" ? "英文小測進程" : `${subjectShort(noncoreSub)} 測考進程`;

  const scopeNote =
    track === "noncore"
      ? `${formal.short}　${formal.name}`
      : langStage === "all"
        ? "全年連續小測"
        : STAGES[langStage - 1]?.name;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          課程發展組
        </p>
        <h1 className="font-display text-2xl font-medium tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {track === "noncore"
            ? "非核心以測考對照對應階段。選一種圖表看走勢、進步、達標或分布。"
            : "中文、英文分開分析。選一種圖表：走勢、進步指數、達標、分數分布、上課分組。"}
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Chip active={form === 1} onClick={() => setForm(1)}>
            中一
          </Chip>
          <Chip active={form === 2} onClick={() => setForm(2)}>
            中二
          </Chip>
          <span className="mx-1 hidden h-11 w-px bg-border sm:block" />
          <Chip active={track === "chi"} onClick={() => setTrack("chi")}>
            中文
          </Chip>
          <Chip active={track === "eng"} onClick={() => setTrack("eng")}>
            英文
          </Chip>
          <Chip active={track === "noncore"} onClick={() => setTrack("noncore")}>
            非核心
          </Chip>
        </div>

        {track !== "noncore" ? (
          <div className="flex flex-wrap gap-2">
            <Chip active={langStage === "all"} onClick={() => setLangStage("all")}>
              全部小測
            </Chip>
            {STAGES.map((s) => (
              <Chip key={s.id} active={langStage === s.id} onClick={() => setLangStage(s.id)}>
                {s.name}
              </Chip>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {NONCORE_SUBJECTS.map((s) => (
              <Chip key={s.id} active={noncoreSub === s.id} onClick={() => setNoncoreSub(s.id)}>
                {s.short}
              </Chip>
            ))}
            <span className="mx-1 hidden h-11 w-px bg-border sm:block" />
            {FORMALS.map((f) => (
              <Chip key={f.kind} active={formalKind === f.kind} onClick={() => setFormalKind(f.kind)}>
                {f.short}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div
        className="grid grid-cols-5 gap-1 rounded-lg bg-muted p-1"
        role="tablist"
        aria-label="圖表種類"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={chart === t.id}
            title={t.hint}
            onClick={() => setChart(t.id)}
            className={cn(
              "h-11 rounded-md text-xs font-medium sm:text-sm",
              chart === t.id
                ? "bg-card text-foreground shadow-[var(--shadow-sm)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Mini label="全級平均" value={fmtPct(stats.mean)} />
        <Mini label="達標率" value={stats.passRate == null ? "—" : fmtPct(stats.passRate)} />
        <Mini label="平均進步" value={signed(stats.delta)} />
        <Mini label="待重測" value={String(stats.need)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{currentTab.label}</CardTitle>
          <CardDescription>
            {form === 1 ? "中一" : "中二"} · {scopeNote} · {currentTab.hint}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72 sm:h-80">
          {!hasData ? (
            <p className="grid h-full place-items-center text-sm text-muted-foreground">
              尚未有小測分數。到分組或班別輸入後，圖表會更新。
            </p>
          ) : (
            <ChartPanel
              kind={chart}
              track={track}
              classes={classes}
              classSummaries={classSummaries}
              trendRows={trendRows}
              splitRows={splitRows}
              pass={pass}
            />
          )}
        </CardContent>
      </Card>

      {hasData ? (
        <div className="overflow-auto rounded-lg bg-card shadow-[var(--shadow-card)]">
          <DetailTable
            kind={chart}
            track={track}
            classes={classes}
            classSummaries={classSummaries}
            trendRows={trendRows}
            splitRows={splitRows}
            formalShort={formal.short}
          />
        </div>
      ) : null}
    </div>
  );
}

function ChartPanel({
  kind,
  track,
  classes,
  classSummaries,
  trendRows,
  splitRows,
  pass,
}: {
  kind: ChartKind;
  track: Track;
  classes: ClassCode[];
  classSummaries: ClassSummary[];
  trendRows: Record<string, string | number | null>[];
  splitRows: Record<string, string | number | null>[];
  pass: number;
}) {
  const names = classes.map(classLabel);
  if (kind === "trend") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={12} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
          <Tooltip content={<ChartTip suffix="%" />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            y={pass}
            stroke="var(--color-destructive)"
            strokeDasharray="4 4"
            label={{ value: `及格 ${pass}%`, fontSize: 10, fill: "var(--color-muted-foreground)" }}
          />
          {names.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={CLASS_COLORS[i % CLASS_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls={false}
            />
          ))}
          <Line
            type="monotone"
            dataKey="全級"
            stroke="var(--color-muted-foreground)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (kind === "delta") {
    const data = classSummaries.map((c) => ({ name: c.name, 進步: c.delta }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={<ChartTip />} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Bar dataKey="進步" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={d.name}
                fill={
                  (d.進步 ?? 0) >= 0
                    ? CLASS_COLORS[i % CLASS_COLORS.length]
                    : "var(--color-destructive)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (kind === "pass") {
    const data = classSummaries.map((c) => ({
      name: c.name,
      達標率: c.passRate,
      待重測: c.need,
    }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip content={<ChartTip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="left" dataKey="達標率" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="待重測" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (kind === "bands") {
    const data = classSummaries.map((c) => ({ name: c.name, ...c.bands }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip content={<ChartTip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {BANDS.map((b) => (
            <Bar key={b.key} dataKey={b.key} stackId="band" fill={b.fill} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (track === "noncore") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={splitRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
          <Tooltip content={<ChartTip suffix="%" />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="課後評估" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="測考" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={splitRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip content={<ChartTip suffix="%" />} />
        <ReferenceLine
          y={pass}
          stroke="var(--color-destructive)"
          strokeDasharray="4 4"
        />
        <Bar dataKey="平均" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DetailTable({
  kind,
  track,
  classes,
  classSummaries,
  trendRows,
  splitRows,
  formalShort,
}: {
  kind: ChartKind;
  track: Track;
  classes: ClassCode[];
  classSummaries: ClassSummary[];
  trendRows: Record<string, string | number | null>[];
  splitRows: Record<string, string | number | null>[];
  formalShort: string;
}) {
  if (kind === "trend") {
    return (
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
            <th className="sticky left-0 bg-muted/60 px-3 py-2">班別</th>
            {trendRows.map((r) => (
              <th key={String(r.date ?? r.label)} className="px-3 py-2 text-center">
                {r.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classes.map((code) => (
            <tr key={code} className="border-b border-border/70">
              <td className="sticky left-0 bg-card px-3 py-2 font-medium">{classLabel(code)}</td>
              {trendRows.map((r) => (
                <td
                  key={`${code}-${String(r.date ?? r.label)}`}
                  className="px-3 py-2 text-center tabular-nums"
                >
                  {fmtPct(num(r[classLabel(code)]))}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-b border-border/70 text-muted-foreground">
            <td className="sticky left-0 bg-card px-3 py-2 font-medium">全級</td>
            {trendRows.map((r) => (
              <td key={`all-${String(r.date ?? r.label)}`} className="px-3 py-2 text-center tabular-nums">
                {fmtPct(num(r["全級"]))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  }
  if (kind === "bands") {
    return (
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2">班別</th>
            {BANDS.map((b) => (
              <th key={b.key} className="px-3 py-2 text-center">
                {b.key}
              </th>
            ))}
            <th className="px-3 py-2 text-center">人數</th>
          </tr>
        </thead>
        <tbody>
          {classSummaries.map((c) => (
            <tr key={c.code} className="border-b border-border/70">
              <td className="px-3 py-2 font-medium">{c.name}</td>
              {BANDS.map((b) => (
                <td key={b.key} className="px-3 py-2 text-center tabular-nums">
                  {c.bands[b.key]}
                </td>
              ))}
              <td className="px-3 py-2 text-center text-muted-foreground">{c.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (kind === "split") {
    return (
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2">{track === "noncore" ? "班別" : "上課組"}</th>
            {track === "noncore" ? (
              <>
                <th className="px-3 py-2 text-center">課後評估%</th>
                <th className="px-3 py-2 text-center">{formalShort}%</th>
              </>
            ) : (
              <th className="px-3 py-2 text-center">平均%</th>
            )}
            <th className="px-3 py-2 text-center">進步</th>
            <th className="px-3 py-2 text-center">人數</th>
          </tr>
        </thead>
        <tbody>
          {splitRows.map((r) => (
            <tr key={String(r.name)} className="border-b border-border/70">
              <td className="px-3 py-2 font-medium">{r.name}</td>
              {track === "noncore" ? (
                <>
                  <td className="px-3 py-2 text-center tabular-nums">{fmtPct(num(r.課後評估))}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{fmtPct(num(r.測考))}</td>
                </>
              ) : (
                <td className="px-3 py-2 text-center tabular-nums">{fmtPct(num(r.平均))}</td>
              )}
              <td
                className={cn(
                  "px-3 py-2 text-center tabular-nums font-medium",
                  num(r.delta ?? r.進步) != null && num(r.delta ?? r.進步)! > 0 && "text-up",
                  num(r.delta ?? r.進步) != null && num(r.delta ?? r.進步)! < 0 && "text-down",
                )}
              >
                {signed(num(r.delta ?? r.進步))}
              </td>
              <td className="px-3 py-2 text-center text-muted-foreground">{r.n ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
          <th className="px-3 py-2">班別</th>
          <th className="px-3 py-2 text-center">平均%</th>
          <th className="px-3 py-2 text-center">進步</th>
          <th className="px-3 py-2 text-center">達標率</th>
          <th className="px-3 py-2 text-center">待重測</th>
          <th className="px-3 py-2 text-center">已作答</th>
          <th className="px-3 py-2 text-center">人數</th>
        </tr>
      </thead>
      <tbody>
        {classSummaries.map((c) => (
          <tr key={c.code} className="border-b border-border/70">
            <td className="px-3 py-2 font-medium">{c.name}</td>
            <td className="px-3 py-2 text-center tabular-nums">{fmtPct(c.mean)}</td>
            <td
              className={cn(
                "px-3 py-2 text-center tabular-nums font-medium",
                c.delta != null && c.delta > 0 && "text-up",
                c.delta != null && c.delta < 0 && "text-down",
              )}
            >
              {signed(c.delta)}
            </td>
            <td className="px-3 py-2 text-center tabular-nums">{fmtPct(c.passRate)}</td>
            <td className="px-3 py-2 text-center tabular-nums">{c.need}</td>
            <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">{c.sat}</td>
            <td className="px-3 py-2 text-center text-muted-foreground">{c.n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChartTip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: { name: string; value: number | null; color?: string }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="mb-1 font-medium">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={p.name} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{p.name}</span>
            <span className="tabular-nums">
              {p.value == null
                ? "—"
                : suffix === "%"
                  ? fmtPct(p.value)
                  : p.name.includes("率")
                    ? fmtPct(p.value)
                    : p.name === "進步"
                      ? signed(p.value)
                      : String(p.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card px-3 py-2 shadow-[var(--shadow-card)]">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-md px-3 text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function average(xs: number[]) {
  if (!xs.length) return null;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;
}

function bandOf(pct: number, pass: number): "未達標" | "達標" | "良好" | "優秀" {
  if (pct < pass) return "未達標";
  if (pct < 70) return "達標";
  if (pct < 85) return "良好";
  return "優秀";
}

function streamGroupOf(s: Student, subject: StreamId) {
  return groupField(s, subject) || s.classcode;
}

function num(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
