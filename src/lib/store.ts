import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALL_CLASSES, ROWS_PER_CLASS, type ClassCode } from "./classes";
import {
  DEFAULT_NONCORE_ORDER,
  allAssessments,
  type StageId,
} from "./calendar";
import { emptyStudent, type ProgressMethod, type ScoreEntry, type Student } from "./progress";
import { makeDemoRoster, makeEmptyRoster } from "./sample";
import type { SubjectId } from "./subjects";
import type { ImportRow } from "./csv";

export type AppSettings = {
  passPercent: number;
  defaultMax: number;
  paperMax: Record<string, number>;
  noncoreOrder: Record<StageId, SubjectId[]>;
  progressMethod: ProgressMethod;
};

const defaultSettings = (): AppSettings => ({
  passPercent: 50,
  defaultMax: 20,
  paperMax: {},
  noncoreOrder: {
    1: [...DEFAULT_NONCORE_ORDER],
    2: [...DEFAULT_NONCORE_ORDER],
    3: [...DEFAULT_NONCORE_ORDER],
    4: [...DEFAULT_NONCORE_ORDER],
  },
  progressMethod: "z",
});

type State = {
  roster: Record<ClassCode, Student[]>;
  settings: AppSettings;
  hydrated: boolean;
  setStudent: (code: ClassCode, index: number, patch: Partial<Student>) => void;
  setScore: (code: ClassCode, studentId: string, assessmentId: string, patch: Partial<ScoreEntry>) => void;
  setPaperMax: (assessmentId: string, max: number) => void;
  setSettings: (patch: Partial<AppSettings>) => void;
  setNoncoreOrder: (stage: StageId, order: SubjectId[]) => void;
  loadDemo: () => void;
  resetAll: () => void;
  importRows: (rows: ImportRow[]) => { students: number; scores: number };
  replaceRoster: (roster: Record<ClassCode, Student[]>) => void;
};

function ensureRow(list: Student[], index: number, code: ClassCode) {
  const next = list.slice();
  while (next.length <= index) next.push(emptyStudent(code, next.length));
  return next;
}

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      roster: makeEmptyRoster(),
      settings: defaultSettings(),
      hydrated: false,
      setStudent: (code, index, patch) =>
        set((st) => {
          const list = ensureRow(st.roster[code] ?? [], index, code);
          const cur = list[index] ?? emptyStudent(code, index);
          list[index] = { ...cur, ...patch, scores: patch.scores ?? cur.scores };
          return { roster: { ...st.roster, [code]: list } };
        }),
      setScore: (code, studentId, assessmentId, patch) =>
        set((st) => {
          const list = (st.roster[code] ?? []).map((s) => {
            if (s.id !== studentId) return s;
            const prev = s.scores[assessmentId] ?? { raw: "", retake: "" };
            return {
              ...s,
              scores: { ...s.scores, [assessmentId]: { ...prev, ...patch } },
            };
          });
          return { roster: { ...st.roster, [code]: list } };
        }),
      setPaperMax: (assessmentId, max) =>
        set((st) => ({
          settings: {
            ...st.settings,
            paperMax: { ...st.settings.paperMax, [assessmentId]: max },
          },
        })),
      setSettings: (patch) =>
        set((st) => ({ settings: { ...st.settings, ...patch } })),
      setNoncoreOrder: (stage, order) =>
        set((st) => ({
          settings: {
            ...st.settings,
            noncoreOrder: { ...st.settings.noncoreOrder, [stage]: order },
          },
        })),
      loadDemo: () => set({ roster: makeDemoRoster() }),
      resetAll: () => set({ roster: makeEmptyRoster(), settings: defaultSettings() }),
      importRows: (rows) => {
        let students = 0;
        let scores = 0;
        set((st) => {
          const roster = { ...st.roster };
          for (const row of rows) {
            const list = (roster[row.classcode] ?? []).map((s) => ({ ...s, scores: { ...s.scores } }));
            let idx = list.findIndex(
              (s) =>
                s.classno.replace(/^0+/, "") === row.classno.replace(/^0+/, "") &&
                (row.classno ? true : false),
            );
            if (idx < 0) {
              idx = list.findIndex((s) => !s.chname && !s.classno);
              if (idx < 0) {
                idx = list.length;
                list.push(emptyStudent(row.classcode, idx));
              }
              students++;
            }
            const cur = list[idx]!;
            if (row.chname) cur.chname = row.chname;
            if (row.regno) cur.regno = row.regno;
            cur.classno = row.classno.padStart(2, "0");
            if (row.assessmentId && (row.raw !== undefined || row.retake !== undefined)) {
              const prev = cur.scores[row.assessmentId] ?? { raw: "", retake: "" };
              cur.scores[row.assessmentId] = {
                raw: row.raw ?? prev.raw,
                retake: row.retake ?? prev.retake,
              };
              scores++;
            }
            list[idx] = cur;
            roster[row.classcode] = list;
          }
          return { roster };
        });
        return { students, scores };
      },
      replaceRoster: (roster) => set({ roster }),
    }),
    {
      name: "s1s2-formative-2026-27",
      partialize: (s) => ({ roster: s.roster, settings: s.settings }),
      skipHydration: true,
    },
  ),
);

export function useAssessments() {
  const order = useAppStore((s) => s.settings.noncoreOrder);
  return allAssessments(order);
}

export function useMaxOf() {
  const settings = useAppStore((s) => s.settings);
  return (id: string) => settings.paperMax[id] ?? settings.defaultMax;
}

export function padClass(code: ClassCode): Student[] {
  const list = useAppStore.getState().roster[code] ?? [];
  if (list.length >= ROWS_PER_CLASS) return list;
  const extra = Array.from({ length: ROWS_PER_CLASS - list.length }, (_, i) =>
    emptyStudent(code, list.length + i),
  );
  return [...list, ...extra];
}

export function studentsInForm(form: 1 | 2) {
  const roster = useAppStore.getState().roster;
  return ALL_CLASSES.filter((c) => (form === 2 ? c.startsWith("2") : c.startsWith("1"))).flatMap(
    (c) => roster[c] ?? [],
  );
}
