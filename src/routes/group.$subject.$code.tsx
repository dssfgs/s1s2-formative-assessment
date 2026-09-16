import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { GroupSheet } from "@/components/group-sheet";
import { isGroupId, isStreamId } from "@/lib/groups";

export const Route = createFileRoute("/group/$subject/$code")({
  component: GroupPage,
});

export function GroupPage() {
  const { subject, code } = useParams({ strict: false }) as { subject: string; code: string };
  if (!isStreamId(subject) || !isGroupId(subject, code)) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">沒有這個上課分組。</p>
        <Link to="/groups" className="mt-3 inline-block text-sm text-primary underline">
          返回分組一覽
        </Link>
      </div>
    );
  }
  return <GroupSheet subject={subject} groupId={code} />;
}
