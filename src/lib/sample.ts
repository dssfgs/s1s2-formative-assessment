import { ALL_CLASSES, ROWS_PER_CLASS, type ClassCode } from "./classes";
import { allAssessments, paperAppliesTo } from "./calendar";
import { emptyStudent, type Student } from "./progress";
import { OFFICIAL_ROSTER } from "./roster-2627";

const NAMES_1: [string, string][] = [
  ["陳嘉樂", "Chan Ka Lok"],
  ["黃詠詩", "Wong Wing Sze"],
  ["李浩然", "Lee Ho Yin"],
  ["張美琪", "Cheung Mei Kei"],
  ["林子軒", "Lam Tsz Hin"],
  ["吳曉彤", "Ng Hiu Tung"],
  ["周俊傑", "Chow Chun Kit"],
  ["鄭雅文", "Cheng Nga Man"],
  ["馬志偉", "Ma Chi Wai"],
  ["何嘉欣", "Ho Ka Yan"],
  ["梁梓豪", "Leung Tsz Ho"],
  ["葉詩婷", "Yip Sze Ting"],
  ["羅啟明", "Lo Kai Ming"],
  ["蔡曉琳", "Choi Hiu Lam"],
];

const NAMES_2: [string, string][] = [
  ["鄧子傑", "Tang Tsz Kit"],
  ["馮凱晴", "Fung Hoi Ching"],
  ["謝浩東", "Tse Ho Tung"],
  ["蘇雅琳", "So Nga Lam"],
  ["潘俊宇", "Poon Chun Yu"],
  ["楊曉欣", "Yeung Hiu Yan"],
  ["朱文傑", "Chu Man Kit"],
  ["韓詩韻", "Hon Sze Wan"],
  ["袁志豪", "Yuen Chi Ho"],
  ["關詠芝", "Kwan Wing Chi"],
  ["盧家輝", "Lo Ka Fai"],
  ["施美玲", "Sze Mei Ling"],
  ["區子軒", "Au Tsz Hin"],
  ["江曉彤", "Kong Hiu Tung"],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function unit(seed: number) {
  const x = Math.sin(seed + 0.13) * 10000;
  return x - Math.floor(x);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function makeEmptyRoster(): Record<ClassCode, Student[]> {
  const out = {} as Record<ClassCode, Student[]>;
  for (const code of ALL_CLASSES) {
    out[code] = Array.from({ length: ROWS_PER_CLASS }, (_, i) =>
      emptyStudent(code, i),
    );
  }
  return out;
}

function padNo(v: string) {
  const t = v.replace(/\s/g, "");
  if (!t) return t;
  return /^\d+$/.test(t) ? t.padStart(2, "0") : t;
}

/** 2026-2027 分組上課名單。prev 有同名學生時保留分數與學號。 */
export function makeOfficialRoster(
  prev?: Record<ClassCode, Student[]>,
): Record<ClassCode, Student[]> {
  const next = makeEmptyRoster();
  const prevAll = prev
    ? ALL_CLASSES.flatMap((c) =>
        (prev[c] ?? []).map((s) => ({ ...s, scores: { ...s.scores } })),
      )
    : [];
  for (const row of OFFICIAL_ROSTER) {
    const idx = Number(row.classno) - 1;
    if (!Number.isFinite(idx) || idx < 0) continue;
    const list = next[row.classcode];
    while (list.length <= idx) list.push(emptyStudent(row.classcode, list.length));
    const matched = prevAll.find(
      (s) =>
        s.classcode === row.classcode &&
        (s.chname === row.chname ||
          (!!s.enname &&
            s.enname.replace(/\s+/g, "").toUpperCase() ===
              row.enname.replace(/\s+/g, "").toUpperCase())),
    );
    const cur = emptyStudent(row.classcode, idx);
    cur.classno = padNo(row.classno);
    cur.chname = row.chname;
    cur.enname = row.enname;
    cur.sex = row.sex;
    cur.chiGroup = row.chiGroup;
    cur.engGroup = row.engGroup;
    cur.mathGroup = row.mathGroup;
    if (matched) {
      cur.scores = matched.scores;
      if (matched.regno) cur.regno = matched.regno;
    }
    list[idx] = cur;
  }
  return next;
}

/** 示範班：1A、2A 填入姓名與兩階段分數，方便試進步指數與頒獎。 */
export function makeDemoRoster(): Record<ClassCode, Student[]> {
  const roster = makeEmptyRoster();
  fillClass(roster, "1A", NAMES_1);
  fillClass(roster, "2A", NAMES_2);
  return roster;
}

function fillClass(
  roster: Record<ClassCode, Student[]>,
  code: ClassCode,
  names: [string, string][],
) {
  const form = code.startsWith("2") ? 2 : 1;
  const assessments = allAssessments().filter((a) => a.form === form && paperAppliesTo(a, code));

  names.forEach(([ch, en], i) => {
    const s = emptyStudent(code, i);
    s.classno = String(i + 1).padStart(2, "0");
    s.regno = `${form}6${code.slice(1)}${String(i + 1).padStart(3, "0")}`;
    s.chname = ch;
    s.enname = en;

    const talent = 48 + unit(hash(ch)) * 38;
    const grit = (unit(hash(ch + "g")) - 0.35) * 18;
    const langSeq: Record<string, number> = {};

    for (const a of assessments) {
      const stageBoost = (a.stage - 1) * grit;
      const jitter = (unit(hash(a.id + ch)) - 0.5) * 16;
      const langBump = a.group === "language" ? 2 : 0;
      let seq = 0;
      if (a.group === "language") {
        seq = langSeq[a.subject] ?? 0;
        langSeq[a.subject] = seq + 1;
      }
      let pct = clamp(
        talent + stageBoost + jitter + langBump + seq * (0.55 + Math.max(0, grit) * 0.12),
        18,
        98,
      );
      if (i % 7 === 0 && a.stage === 1) pct = clamp(pct - 22, 12, 70);
      if (i % 5 === 1 && a.stage === 2) pct = clamp(pct + 14, 30, 99);
      if (a.group === "formal") {
        pct = clamp(pct + grit * 0.8 + (i % 3 === 0 ? 12 : 3), 22, 99);
      }

      const max = a.group === "formal" ? 100 : 20;
      const raw = Math.round((pct / 100) * max * 2) / 2;
      const entry = { raw: String(raw), retake: "" };
      s.scores[a.id] = entry;
    }
    roster[code][i] = s;
  });
}
