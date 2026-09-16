import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, CalendarDays, Layers, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CLASSES, classLabel, formOf, TA_BY_FORM } from "@/lib/classes";
import {
  SCHOOL_NAME,
  SCHOOL_YEAR,
  STAGES,
  upcomingAssessments,
  weekdayLabel,
} from "@/lib/calendar";
import { fmtPct, isoToShort, signed } from "@/lib/format";
import { awardsLanguage, classStats, computeClass, isActive } from "@/lib/progress";
import { subjectShort } from "@/lib/subjects";
import { STREAM_GROUPS, groupShort, officialCount, type StreamId } from "@/lib/groups";
import { OFFICIAL_COUNT } from "@/lib/roster-2627";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

export function Home() {
  const roster = useAppStore((s) => s.roster);
  const loadDemo = useAppStore((s) => s.loadDemo);
  const loadOfficialRoster = useAppStore((s) => s.loadOfficialRoster);
  const settings = useAppStore((s) => s.settings);
  const all = useAssessments();
  const maxOf = useMaxOf();
  const upcoming = upcomingAssessments(all, undefined, 8);
  const filled = ALL_CLASSES.reduce(
    (n, c) => n + (roster[c] ?? []).filter(isActive).length,
    0,
  );

  const stats1 = classStats(
    ALL_CLASSES.filter((c) => formOf(c) === 1).flatMap((c) => roster[c] ?? []),
    all.filter((a) => a.form === 1),
    maxOf,
    settings.passPercent,
  );
  const stats2 = classStats(
    ALL_CLASSES.filter((c) => formOf(c) === 2).flatMap((c) => roster[c] ?? []),
    all.filter((a) => a.form === 2),
    maxOf,
    settings.passPercent,
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {SCHOOL_NAME}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
            {SCHOOL_YEAR} 課後進展性評估
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            對齊學與教事務委員會指引：中文、英文按上課分組分開輸入與分析；非核心科目按班別輸入測驗／考試相對階段進步。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => loadOfficialRoster()} variant="gold" className="max-sm:w-full">
            <Sparkles className="size-4" />
            載入分組名單
          </Button>
          <Button onClick={loadDemo} variant="outline">
            示範數據
          </Button>
          <Button asChild variant="outline">
            <Link to="/import">
              <Upload className="size-4" />
              匯入 CSV
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/all">全校總表</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/settings">安裝到主畫面</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="已建檔學生" value={String(filled)} hint={`本學年分組名單 ${OFFICIAL_COUNT} 人，資料只存在這部瀏覽器`} />
        <Stat
          label="中一達標率"
          value={stats1.passRate == null ? "—" : fmtPct(stats1.passRate * 100)}
          hint={`${TA_BY_FORM[1].name} 輸入 · 待重測 ${stats1.need} 人次`}
        />
        <Stat
          label="中二達標率"
          value={stats2.passRate == null ? "—" : fmtPct(stats2.passRate * 100)}
          hint={`${TA_BY_FORM[2].name} 輸入 · 待重測 ${stats2.need} 人次`}
        />
        <Stat
          label="及格線"
          value={`${settings.passPercent}%`}
          hint={`課後評估 ${settings.defaultMax} 分 · 測考 ${settings.examMax ?? 100} 分`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              即將舉行
            </CardTitle>
            <CardDescription>語文科逢星期一至三；非核心科目測考前一至兩週。</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">本學年評估已全部完結。</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((a) => (
                  <li key={`${a.id}-${a.form}`} className="flex items-center gap-3 py-2.5">
                    <span className="w-16 shrink-0 font-medium tabular-nums">
                      {isoToShort(a.date)}
                    </span>
                    <span className="w-12 shrink-0 text-xs text-muted-foreground">
                      {weekdayLabel(a.weekday)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      中{a.form === 1 ? "一" : "二"} · {subjectShort(a.subject)}
                    </span>
                    <Badge tone={a.group === "language" ? "primary" : "gold"}>
                      {a.group === "language" ? "語文" : "非核心"}
                    </Badge>
                    <Badge tone="muted">{STAGES[a.stage - 1]?.name}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-4" />
              早會頒獎預覽
            </CardTitle>
            <CardDescription>中文、英文分開計算進步指數。需連續兩次小測。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AwardPeek />
            <Button asChild variant="outline" size="sm">
              <Link to="/awards">查看完整頒獎名單</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="font-display text-lg">按上課分組輸入語文</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/groups">
              <Layers className="size-4" />
              全部分組
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {(["chi", "eng"] as StreamId[]).map((subject) => (
            <Card key={subject}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{subjectShort(subject)}</CardTitle>
                <CardDescription>
                  {subject === "chi" ? "中文抽離組 ABCD／CD" : "英文抽離組 ABCD／BCD"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {([1, 2] as const).map((form) => (
                  <div key={form}>
                    <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                      {form === 1 ? "中一" : "中二"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {STREAM_GROUPS[subject][form].map((id) => (
                        <Link
                          key={id}
                          to="/group/$subject/$code"
                          params={{ subject, code: id }}
                          className="rounded-md bg-muted px-2.5 py-1.5 text-xs hover:bg-secondary"
                        >
                          {groupShort(id)}
                          <span className="ml-1 tabular-nums text-muted-foreground">
                            {officialCount(subject, id)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">按班輸入非核心／查看原班</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ALL_CLASSES.map((c) => {
            const n = (roster[c] ?? []).filter(isActive).length;
            return (
              <Link
                key={c}
                to="/class/$code"
                params={{ code: c }}
                className="flex items-center justify-between rounded-lg bg-card px-4 py-3 text-sm shadow-[var(--shadow-card)] hover:bg-muted"
              >
                <span className="font-medium">{classLabel(c)}</span>
                <span className="tabular-nums text-muted-foreground">{n} 人</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-sans text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function AwardPeek() {
  const roster = useAppStore((s) => s.roster);
  const settings = useAppStore((s) => s.settings);
  const all = useAssessments();
  const maxOf = useMaxOf();

  const tracks: { label: string; subject: "chi" | "eng" }[] = [
    { label: "中文", subject: "chi" },
    { label: "英文", subject: "eng" },
  ];

  const byTrack = tracks.map(({ label, subject }) => {
    const rows = ALL_CLASSES.flatMap((code) => {
      const papers = all.filter((a) => a.form === formOf(code));
      const computed = computeClass(
        roster[code] ?? [],
        papers,
        maxOf,
        settings.passPercent,
        settings.progressMethod,
      );
      return awardsLanguage(computed, subject, undefined, 1).map((p) => ({
        code,
        name: p.student.chname,
        delta: p.langProgress[subject] as number,
      }));
    }).slice(0, 2);
    return { label, rows };
  });

  if (byTrack.every((t) => t.rows.length === 0)) {
    return (
      <p className="text-sm text-muted-foreground">
        尚未有連續兩次小測成績。可先載入示範數據，或到班別輸入分數。
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {byTrack.map((t) => (
        <div key={t.label}>
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">{t.label}</p>
          {t.rows.length === 0 ? (
            <p className="text-xs text-muted-foreground">尚欠成績</p>
          ) : (
            <ul className="space-y-1.5">
              {t.rows.map((r) => (
                <li key={`${t.label}-${r.code}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {r.code} {r.name}
                  </span>
                  <span className="tabular-nums text-up">{signed(r.delta)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
