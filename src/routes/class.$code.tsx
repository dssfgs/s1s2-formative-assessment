import { Link, useParams } from "@tanstack/react-router";
import { ClassSheet } from "@/components/class-sheet";
import { isClassCode } from "@/lib/classes";

export function ClassPage() {
  const { code } = useParams({ strict: false }) as { code: string };
  if (!isClassCode(code)) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">沒有這個班別。</p>
        <Link to="/" className="mt-3 inline-block text-sm text-primary underline">
          返回總覽
        </Link>
      </div>
    );
  }
  return <ClassSheet code={code} />;
}
