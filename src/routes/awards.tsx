import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CLASSES, classLabel, formOf, S1_CLASSES, S2_CLASSES, type ClassCode } from "@/lib/classes";
import { SCHOOL_NAME, SCHOOL_YEAR } from "@/lib/calendar";
import { signed } from "@/lib/format";
import { awardsForClass, computeClass } from "@/lib/progress";
import { SUBJECTS, subjectShort } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";
import { cn } from "@/lib/utils";


export function AwardsPage() {
  const roster = useAppStore((s) => s.roster);
  const settings = useAppStore((s) => s.settings);
  const all = useAssessments();
  const maxOf = useMaxOf();
  const [form, setForm] = useState<1 | 2 | "all">("all");

  const classes = form === "all" ? ALL_CLASSES : form === 1 ? S1_CLASSES : S2_CLASSES;

  const boards = useMemo(() => {
    return classes.map((code) => {
      const papers = all.filter((a) => a.form === formOf(code));
      const computed = computeClass(
        roster[code] ?? [],
        papers,
        maxOf,
        settings.passPercent,
        settings.progressMethod,
      );
      return { code, top: awardsForClass(computed, 3) };
    });
  }, [classes, all, roster, maxOf, settings]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            課程發展組 · 早會嘉許
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight">每班進步指數首三名</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {SCHOOL_NAME} {SCHOOL_YEAR}。表揚勤勞和堅毅。進步指數為各科標準分差的平均（可在設定改為百分率或名次）。
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <FilterChip active={form === "all"} onClick={() => setForm("all")}>
            全級
          </FilterChip>
          <FilterChip active={form === 1} onClick={() => setForm(1)}>
            中一
          </FilterChip>
          <FilterChip active={form === 2} onClick={() => setForm(2)}>
            中二
          </FilterChip>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            列印頒獎名單
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {boards.map(({ code, top }) => (
          <ClassPodium key={code} code={code} top={top} />
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

function ClassPodium({
  code,
  top,
}: {
  code: ClassCode;
  top: ReturnType<typeof awardsForClass>;
}) {
  const medals = ["金", "銀", "銅"] as const;
  const tones = ["gold", "muted", "muted"] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{classLabel(code)}</CardTitle>
        <CardDescription>
          {top.length ? `共 ${top.length} 名可頒獎` : "尚欠連續兩階段成績"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">輸入至少兩個階段後會自動排名。</p>
        ) : (
          <ol className="space-y-3">
            {top.map((p, i) => (
              <li key={p.student.id} className="flex items-start gap-3">
                <Badge tone={tones[i] ?? "muted"} className="mt-0.5 w-8 justify-center">
                  {medals[i]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {p.student.classno} {p.student.chname}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums font-medium",
                        (p.overall ?? 0) >= 0 ? "text-up" : "text-down",
                      )}
                    >
                      {signed(p.overall)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {SUBJECTS.filter((s) => p.subjectDelta[s.id] != null)
                      .map((s) => `${subjectShort(s.id)} ${signed(p.subjectDelta[s.id])}`)
                      .join(" · ") || "—"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
