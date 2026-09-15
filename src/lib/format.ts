export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function fmt1(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return round1(n).toFixed(1);
}

export function fmt2(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return round2(n).toFixed(2);
}

export function fmtPct(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${round1(n)}%`;
}

export function signed(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const v = digits === 1 ? round1(n) : round2(n);
  const s = v.toFixed(digits);
  return v > 0 ? `+${s}` : s;
}

export function parseNum(v: string | number | undefined | null): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

export function isoToLabel(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const year = Number(y);
  const mm = Number(m);
  const dd = Number(d);
  return `${dd}/${mm}${year === 2027 ? "（下）" : ""}`;
}

export function isoToShort(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}`;
}

export function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
