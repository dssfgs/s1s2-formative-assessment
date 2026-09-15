export const S1_CLASSES = ["1A", "1B", "1C", "1D"] as const;
export const S2_CLASSES = ["2A", "2B", "2C", "2D"] as const;
export const ALL_CLASSES = [...S1_CLASSES, ...S2_CLASSES] as const;

export type ClassCode = (typeof ALL_CLASSES)[number];
export type FormLevel = 1 | 2;

export const ROWS_PER_CLASS = 40;

export const TA_BY_FORM: Record<FormLevel, { name: string; note: string }> = {
  1: { name: "Ruby", note: "中一級教學助理，統一輸入分數" },
  2: { name: "Ann", note: "中二級教學助理，統一輸入分數" },
};

export function isClassCode(v: string): v is ClassCode {
  return (ALL_CLASSES as readonly string[]).includes(v);
}

export function formOf(code: string): FormLevel {
  return code.startsWith("2") ? 2 : 1;
}

export function classesOf(form: FormLevel): readonly ClassCode[] {
  return form === 1 ? S1_CLASSES : S2_CLASSES;
}

export function classLabel(code: string) {
  return `${code.startsWith("1") ? "中一" : "中二"}${code.slice(1)}`;
}
