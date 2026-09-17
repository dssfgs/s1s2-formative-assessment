import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CLASSES, classLabel, formOf, S1_CLASSES, S2_CLASSES, type ClassCode } from "@/lib/classes";
import {
  FORMALS,
  FORMAL_BY_KIND,
  SCHOOL_NAME,
  SCHOOL_YEAR,
  STAGES,
  assessmentsFor,
  type FormalKind,
  type StageId,
} from "@/lib/calendar";
import { signed } from "@/lib/format";
import {
  awardsFormal,
  awardsLanguage,
  computeClass,
  formalDeltaKey,
  type StudentProgress,
} from "@/lib/progress";
import { NONCORE_SUBJECTS, subjectShort, type SubjectId } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/awards")({ component: AwardsPage });

type Track = "chi" | "eng" | "noncore";

type BoardRow = { student: StudentProgress["student"]; delta: number };

export function AwardsPage() {
  const roster = useAppStore((s) => s.roster);
  const settings = useAppStore((s) => s.settings);
  const all = useAssessments();
  const maxOf = useMaxOf();
  const [form, setForm] = useState<1 | 2 | "all">("all");
  const [track, setTrack] = useState<Track>("chi");
  const [langStage, setLangStage] = useState<StageId | "all">("all");
  const [noncoreSub, setNoncoreSub] = useState<SubjectId>("geo");
  const [formalKind, setFormalKind] = useState<FormalKind>("T1A1");

  const classes = form === "all" ? ALL_CLASSES : form === 1 ? S1_CLASSES : S2_CLASSES;
  const formal = FORMAL_BY_KIND[formalKind];

  const boards = useMemo(() => {
    return classes.map((code) => {
      const papers = assessmentsFor(all, { form: formOf(code), classCode: code });
      const computed = computeClass(
        roster[code] ?? [],
        papers,
        (id) => maxOf(id, code),
        settings.passPercent,
        settings.progressMethod,
      );
      const picked =
        track === "chi" || track === "eng"
          ? awardsLanguage(computed, track, langStage === "all" ? undefined : langStage, 3)
          : awardsFormal(computed, noncoreSub, formalKind, 3);
      const top: BoardRow[] = picked.map((p) => ({
        student: p.student,
        delta:
          track === "chi" || track === "eng"
            ? langStage === "all"
              ? (p.langProgress[track] as number)
              : (p.langStageProgress[`${track}-${langStage}`] as number)
            : (p.formalDelta[formalDeltaKey(noncoreSub, formalKind)] as number),
      }));
      return { code, top };
    });
  }, [classes, all, roster, maxOf, settings, track, langStage, noncoreSub, formalKind]);

  const title =
    track === "chi"
      ? "中文進步指數首三名"
      : track === "eng"
        ? "英文進步指數首三名"
        : `${subjectShort(noncoreSub)}　${formal.short} 相對${STAGES[formal.stage - 1]?.name}首三名`;

  const blurb =
    track === "chi" || track === "eng"
      ? "語文進步指數＝該科連續兩次課後小測百分率差的平均（中文、英文分開計算，不與其他科混合）。"
      : `${formal.name}（${formal.short}）百分率 − ${STAGES[formal.stage - 1]?.name}課後評估百分率。每科每班取進步最大的三名。`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            課程發展組 · 早會嘉許
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {SCHOOL_NAME} {SCHOOL_YEAR}。{blurb}
          </p>
        </div>
        <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
          列印頒獎名單
        </Button>
      </header>

      <div className="flex flex-wrap gap-2 print:hidden">
        <FilterChip active={form === "all"} onClick={() => setForm("all")}>
          全級
        </FilterChip>
        <FilterChip active={form === 1} onClick={() => setForm(1)}>
          中一
        </FilterChip>
        <FilterChip active={form === 2} onClick={() => setForm(2)}>
          中二
        </FilterChip>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <FilterChip active={track === "chi"} onClick={() => setTrack("chi")}>
          中文小測
        </FilterChip>
        <FilterChip active={track === "eng"} onClick={() => setTrack("eng")}>
          英文小測
        </FilterChip>
        <FilterChip active={track === "noncore"} onClick={() => setTrack("noncore")}>
          非核心測考
        </FilterChip>
      </div>

      {track !== "noncore" ? (
        <div className="flex flex-wrap gap-2 print:hidden">
          <FilterChip active={langStage === "all"} onClick={() => setLangStage("all")}>
            全部小測
          </FilterChip>
          {STAGES.map((s) => (
            <FilterChip
              key={s.id}
              active={langStage === s.id}
              onClick={() => setLangStage(s.id)}
            >
              {s.name}
            </FilterChip>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 print:hidden">
            {NONCORE_SUBJECTS.map((s) => (
              <FilterChip
                key={s.id}
                active={noncoreSub === s.id}
                onClick={() => setNoncoreSub(s.id)}
              >
                {s.short}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            {FORMALS.map((f) => (
              <FilterChip
                key={f.kind}
                active={formalKind === f.kind}
                onClick={() => setFormalKind(f.kind)}
              >
                {f.short} vs {STAGES[f.stage - 1]?.name}
              </FilterChip>
            ))}
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {boards.map(({ code, top }) => (
          <ClassPodium
            key={code}
            code={code}
            top={top}
            emptyHint={
              track === "noncore"
                ? `尚欠${STAGES[formal.stage - 1]?.name}課後評估或 ${formal.short} 成績`
                : "尚欠連續兩次小測成績"
            }
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
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
        "h-8 rounded-md px-3 text-xs",
        active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function ClassPodium({
  code,
  top,
  emptyHint,
}: {
  code: ClassCode;
  top: BoardRow[];
  emptyHint: string;
}) {
  const medals = ["金", "銀", "銅"] as const;
  const tones = ["gold", "muted", "muted"] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{classLabel(code)}</CardTitle>
        <CardDescription>
          {top.length ? `共 ${top.length} 名可頒獎` : emptyHint}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">輸入對應成績後會自動排名。</p>
        ) : (
          <ol className="space-y-3">
            {top.map((row, i) => (
              <li key={row.student.id} className="flex items-start gap-3">
                <Badge tone={tones[i] ?? "muted"} className="mt-0.5 w-8 justify-center">
                  {medals[i]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {row.student.classno} {row.student.chname}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums font-medium",
                        row.delta >= 0 ? "text-up" : "text-down",
                      )}
                    >
                      {signed(row.delta)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
