import { useEffect, useRef, type KeyboardEvent } from "react";
import { CellInput, focusCell } from "@/components/cell-input";
import { paperLabel, type AssessmentDef } from "@/lib/calendar";
import { quizResult, type Student } from "@/lib/progress";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card px-3 py-2 shadow-[var(--shadow-card)]">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}

export function MaxInput({
  id,
  max,
  col,
  label,
}: {
  id: string;
  max: number;
  col: number;
  label: string;
}) {
  const setPaperMax = useAppStore((s) => s.setPaperMax);
  const box = useRef<HTMLInputElement>(null);
  const display = String(max);

  useEffect(() => {
    if (document.activeElement === box.current) return;
    if (box.current && box.current.value !== display) box.current.value = display;
  }, [display, id]);

  function commit(raw: string) {
    const n = Number(raw.trim());
    if (Number.isFinite(n) && n > 0) {
      if (n !== max) setPaperMax(id, n);
      return;
    }
    if (box.current) box.current.value = display;
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      commit(e.currentTarget.value);
      focusCell(0, col);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      commit(e.currentTarget.value);
      const prev = document.querySelector<HTMLInputElement>(
        `input[data-r="-1"][data-c="${col - 1}"]`,
      );
      if (prev) {
        prev.focus();
        prev.select();
      }
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      commit(e.currentTarget.value);
      const next = document.querySelector<HTMLInputElement>(
        `input[data-r="-1"][data-c="${col + 1}"]`,
      );
      if (next) {
        next.focus();
        next.select();
      }
    }
  }

  return (
    <input
      ref={box}
      data-r={-1}
      data-c={col}
      className="sheet-input sheet-input-max"
      inputMode="numeric"
      defaultValue={display}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={onKey}
      onFocus={(e) => e.currentTarget.select()}
      aria-label={`${label} 滿分`}
    />
  );
}

export function ScorePair({
  student,
  paper,
  max,
  pass,
  row,
  rawCol,
  onPasteGrid,
  onChange,
}: {
  student: Student;
  paper: AssessmentDef;
  max: number;
  pass: number;
  row: number;
  rawCol: number;
  onPasteGrid: (grid: string[][], startRow: number, startCol: number) => void;
  onChange: (patch: { raw: string }) => void;
}) {
  const entry = student.scores[paper.id] ?? { raw: "", retake: "" };
  const r = quizResult(student, paper, max, pass);
  const formal = paper.group === "formal";
  const bg =
    r.pct == null
      ? formal
        ? "bg-gold/10"
        : ""
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
        aria-label={`${student.chname || "學生"} ${paperLabel(paper)} 分數`}
      />
    </td>
  );
}
