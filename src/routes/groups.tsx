import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { classLabel } from "@/lib/classes";
import {
  STREAM_GROUPS,
  classesInGroup,
  groupLabel,
  groupShort,
  isPullout,
  officialCount,
  rosterHasGroups,
  studentsInGroup,
  type StreamId,
} from "@/lib/groups";
import { OFFICIAL_COUNT } from "@/lib/roster-2627";
import { subjectShort } from "@/lib/subjects";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/groups")({ component: GroupsPage });

export function GroupsPage() {
  const roster = useAppStore((s) => s.roster);
  const loadOfficialRoster = useAppStore((s) => s.loadOfficialRoster);
  const loaded = rosterHasGroups(roster);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">語文分組輸入</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            按 2026-2027 分組上課名單排列。Ruby（中一）／Ann（中二）在所屬上課組輸入中文或英文分數，不必翻原班。非核心科目仍按班別輸入。
          </p>
        </div>
        <Button onClick={() => loadOfficialRoster()} variant={loaded ? "outline" : "gold"}>
          {loaded ? "重新套用分組名單" : `載入本學年名單（${OFFICIAL_COUNT}人）`}
        </Button>
      </header>

      <StreamBlock subject="chi" loaded={loaded} />
      <StreamBlock subject="eng" loaded={loaded} />
    </div>
  );
}

function StreamBlock({ subject, loaded }: { subject: StreamId; loaded: boolean }) {
  const roster = useAppStore((s) => s.roster);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg">{subjectShort(subject)}</h2>
      {([1, 2] as const).map((form) => (
        <Card key={`${subject}-${form}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{form === 1 ? "中一級" : "中二級"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STREAM_GROUPS[subject][form].map((id) => {
              const official = officialCount(subject, id);
              const n = loaded ? studentsInGroup(roster, subject, id).length : official;
              const homes = classesInGroup(subject, id);
              return (
                <Link
                  key={id}
                  to="/group/$subject/$code"
                  params={{ subject, code: id }}
                  className={cn(
                    "flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm hover:bg-muted",
                    isPullout(id) && "border-accent/40 bg-accent/5",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{groupShort(id)}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {groupLabel(id)} · {homes.map(classLabel).join("／")}
                    </span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">{n} 人</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
