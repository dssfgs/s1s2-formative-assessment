import { useEffect, useRef, type ClipboardEvent, type ComponentProps, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export function focusCell(row: number, col: number) {
  const el = document.querySelector<HTMLInputElement>(`input[data-r="${row}"][data-c="${col}"]`);
  if (!el) return;
  el.focus();
  el.select();
}

export function CellInput({
  value,
  onChange,
  row,
  col,
  className,
  onPasteGrid,
  ...props
}: Omit<ComponentProps<"input">, "onChange" | "value"> & {
  value: string;
  onChange: (v: string) => void;
  row: number;
  col: number;
  onPasteGrid?: (grid: string[][], startRow: number, startCol: number) => void;
}) {
  const live = useRef(value);
  const box = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement === box.current) return;
    live.current = value;
    if (box.current && box.current.value !== value) box.current.value = value;
  }, [value]);

  function commit(v: string) {
    if (v !== value) onChange(v);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    if (e.key === "ArrowLeft") {
      const atStart = (el.selectionStart ?? 0) === 0 && (el.selectionEnd ?? 0) === 0;
      if (atStart || el.value === "") {
        e.preventDefault();
        commit(el.value);
        focusCell(row, col - 1);
      }
      return;
    }
    if (e.key === "ArrowRight") {
      const atEnd =
        (el.selectionStart ?? 0) === el.value.length && (el.selectionEnd ?? 0) === el.value.length;
      if (atEnd || el.value === "") {
        e.preventDefault();
        commit(el.value);
        focusCell(row, col + 1);
      }
      return;
    }
    if (e.key !== "Enter" && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const atEdge =
        el.selectionStart === el.selectionEnd &&
        (el.selectionStart === 0 || el.selectionStart === el.value.length || el.value === "");
      if (e.key === "ArrowUp" && el.selectionStart !== 0 && !atEdge) return;
      if (e.key === "ArrowDown" && el.selectionStart !== el.value.length && !atEdge) return;
    }
    e.preventDefault();
    commit(el.value);
    const dir = e.key === "ArrowUp" || (e.key === "Enter" && e.shiftKey) ? -1 : 1;
    focusCell(row + dir, col);
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text/plain");
    if (!onPasteGrid) return;
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\uFEFF/, "");
    if (!normalized.includes("\t") && !normalized.includes("\n")) return;
    e.preventDefault();
    const grid = normalized
      .split("\n")
      .filter((line, i, arr) => line.length > 0 || i < arr.length - 1)
      .map((line) =>
        line.split("\t").map((c) => c.replace(/^["']|["']$/g, "").trim()),
      );
    while (grid.length && grid[grid.length - 1]!.every((c) => c === "")) grid.pop();
    if (!grid.length || (grid.length === 1 && grid[0]!.length === 1)) return;
    onPasteGrid(grid, row, col);
    const first = grid[0]?.[0];
    if (box.current && first !== undefined) {
      box.current.value = first;
      live.current = first;
    }
  }

  return (
    <input
      ref={box}
      data-r={row}
      data-c={col}
      defaultValue={value}
      onChange={(e) => {
        live.current = e.target.value;
      }}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={onKey}
      onPaste={onPaste}
      className={cn("sheet-input", className)}
      {...props}
    />
  );
}
