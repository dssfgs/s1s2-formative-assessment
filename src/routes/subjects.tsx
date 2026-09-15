import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CLASSES, classLabel, formOf, type ClassCode } from "@/lib/classes";
import { FORMALS, FORMAL_BY_KIND, STAGES, type FormalKind, type StageId } from "@/lib/calendar";
import { fmtPct, signed } from "@/lib/format";
import { computeClass, formalDeltaKey, progressOf } from "@/lib/progress";
import { LANGUAGE_SUBJECTS, NONCORE_SUBJECTS, subjectShort, type SubjectId } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subjects")({ component: SubjectsPage });

type Track = "chi" | "eng" | "noncore";

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

  const classes = ALL_CLASSES.filter((c) => formOf(c) === form);
  const formal = FORMAL_BY_KIND[formalKind];
  const stageForFormal = formal.stage;

  const computedByClass = useMemo(() => {
    const map = new Map<ClassCode, ReturnType<typeof computeClass>>();
    for (const code of classes) {
      const papers = all.filter((a) => a.form === form);
      map.set(
        code,
        computeClass(
          roster[code] ?? [],
          papers,
          maxOf,
          settings.passPercent,
          settings.progressMethod,
        ),
      );
    }
    return map;
  }, [classes, all, form, roster, maxOf, settings]);

  const langRows = useMemo(() => {
    const subjects = track === "noncore" ? [] : LANGUAGE_SUBJECTS.filter((s) => s.id === track);
    return subjects.map((sub) => {
      const cells = classes.map((code) => {
        const computed = computedByClass.get(code)!;
        const k = langStage === "all" ? null : `${sub.id}-${langStage}`;
        const meta = k ? computed.stageMeta[k] : null;
        const deltas = [...computed.byStudent.values()]
          .map((p) => progressOf(p, sub.id, langStage))
          .filter((v): v is number => v !== null);
        const meanPct =
          langStage === "all"
            ? average(
                STAGES.flatMap((st) => {
                  const m = computed.stageMeta[`${sub.id}-${st.id}`]?.mean;
                  return m == null ? [] : [m];
                }),
              )
            : (meta?.mean ?? null);
        return {
          code,
          mean: meanPct,
          n: langStage === "all" ? [...computed.byStudent.values()].length : (meta?.n ?? 0),
          delta: average(deltas),
        };
      });
      return { sub, cells };
    });
  }, [track, classes, computedByClass, langStage]);

  const noncoreCells = useMemo(() => {
    if (track !== "noncore") return [];
    return classes.map((code) => {
      const computed = computedByClass.get(code)!;
      const k = `${noncoreSub}-${stageForFormal}`;
      const meta = computed.stageMeta[k];
      const deltas = [...computed.byStudent.values()]
        .map((p) => p.formalDelta[formalDeltaKey(noncoreSub, formalKind)])
        .filter((v): v is number => v !== null);
      const exams = [...computed.byStudent.values()]
        .map((p) => {
          const d = p.formalDelta[formalDeltaKey(noncoreSub, formalKind)];
          const stage = p.stages[k]?.pct;
          if (d == null || stage == null) return null;
          return stage + d;
        })
        .filter((v): v is number => v !== null);
      return {
        code,
        mean: meta?.mean ?? null,
        exam: average(exams),
        n: meta?.n ?? 0,
        delta: average(deltas),
      };
    });
  }, [track, classes, computedByClass, noncoreSub, formalKind, stageForFormal]);

  const chartData =
    track === "noncore"
      ? noncoreCells.map((c) => ({
          name: classLabel(c.code),
          課後評估: c.mean ?? 0,
          測考: c.exam ?? 0,
        }))
      : (langRows[0]?.cells ?? []).map((c) => ({
          name: classLabel(c.code),
          進步指數: c.delta ?? 0,
        }));

  const title =
    track === "chi"
      ? "中文小測進程"
      : track === "eng"
        ? "英文小測進程"
        : `${subjectShort(noncoreSub)}　${formal.short} 相對${STAGES[formal.stage - 1]?.name}`;

  const blurb =
    track === "chi" || track === "eng"
      ? "中文與英文分開分析。進步指數＝該科連續兩次課後小測百分率差的平均，不與其他科混合。"
      : `${formal.name}百分率 − ${STAGES[formal.stage - 1]?.name}課後評估百分率。每班顯示平均。`;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          課程發展組
        </p>
        <h1 className="font-display text-2xl font-medium tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Chip active={form === 1} onClick={() => setForm(1)}>
          中一
        </Chip>
        <Chip active={form === 2} onClick={() => setForm(2)}>
          中二
        </Chip>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={track === "chi"} onClick={() => setTrack("chi")}>
          中文小測
        </Chip>
        <Chip active={track === "eng"} onClick={() => setTrack("eng")}>
          英文小測
        </Chip>
        <Chip active={track === "noncore"} onClick={() => setTrack("noncore")}>
          非核心測考
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
        <>
          <div className="flex flex-wrap gap-2">
            {NONCORE_SUBJECTS.map((s) => (
              <Chip key={s.id} active={noncoreSub === s.id} onClick={() => setNoncoreSub(s.id)}>
                {s.short}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {FORMALS.map((f) => (
              <Chip
                key={f.kind}
                active={formalKind === f.kind}
                onClick={() => setFormalKind(f.kind)}
              >
                {f.short} vs {STAGES[f.stage - 1]?.name}
              </Chip>
            ))}
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {track === "noncore" ? "各班課後評估與測考百分率" : "各班進步指數"}
          </CardTitle>
          <CardDescription>
            {form === 1 ? "中一" : "中二"}
            {track === "noncore"
              ? ` · ${subjectShort(noncoreSub)} · ${formal.short}`
              : langStage === "all"
                ? " · 全年連續小測"
                : ` · ${STAGES[langStage - 1]?.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6cdb8" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              {track === "noncore" ? (
                <>
                  <Bar dataKey="課後評估" fill="#3d4f3a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="測考" fill="#b0893e" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <Bar dataKey="進步指數" fill="#3d4f3a" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="overflow-auto rounded-lg bg-card shadow-[var(--shadow-card)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">{track === "noncore" ? "班別" : "科目"}</th>
              {track === "noncore" ? (
                <>
                  <th className="px-3 py-2 text-center">課後評估%</th>
                  <th className="px-3 py-2 text-center">{formal.short}%</th>
                  <th className="px-3 py-2 text-center">進步</th>
                  <th className="px-3 py-2 text-center">人數</th>
                </>
              ) : (
                classes.map((c) => (
                  <th key={c} className="px-3 py-2 text-center">
                    {classLabel(c)}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {track === "noncore"
              ? noncoreCells.map((c) => (
                  <tr key={c.code} className="border-b border-border/70">
                    <td className="px-3 py-2 font-medium">{classLabel(c.code)}</td>
                    <td className="px-3 py-2 text-center tabular-nums">{fmtPct(c.mean)}</td>
                    <td className="px-3 py-2 text-center tabular-nums">{fmtPct(c.exam)}</td>
                    <td
                      className={cn(
                        "px-3 py-2 text-center tabular-nums font-medium",
                        c.delta != null && c.delta > 0 && "text-up",
                        c.delta != null && c.delta < 0 && "text-down",
                      )}
                    >
                      {signed(c.delta)}
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{c.n}</td>
                  </tr>
                ))
              : langRows.map(({ sub, cells }) => (
                  <tr key={sub.id} className="border-b border-border/70">
                    <td className="px-3 py-2 font-medium">{subjectShort(sub.id)}</td>
                    {cells.map((c) => (
                      <td key={c.code} className="px-3 py-2 text-center tabular-nums">
                        <div>{c.mean == null ? "—" : fmtPct(c.mean)}</div>
                        <div
                          className={cn(
                            "text-[11px]",
                            c.delta != null && c.delta > 0 && "text-up",
                            c.delta != null && c.delta < 0 && "text-down",
                          )}
                        >
                          {c.delta == null ? "" : `進步 ${signed(c.delta)}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{c.n} 人</div>
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function average(xs: number[]) {
  if (!xs.length) return null;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;
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
      onClick={onClick}
      className={cn(
        "h-9 rounded-md px-3 text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
