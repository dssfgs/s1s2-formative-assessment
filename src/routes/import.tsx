import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CLASSES } from "@/lib/classes";
import {
  downloadText,
  exportClassCsv,
  parseRosterBackup,
  parseScoreCsv,
  rosterBackup,
} from "@/lib/csv";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";

export const Route = createFileRoute("/import")({ component: ImportPage });

export function ImportPage() {
  const roster = useAppStore((s) => s.roster);
  const importRows = useAppStore((s) => s.importRows);
  const replaceRoster = useAppStore((s) => s.replaceRoster);
  const loadDemo = useAppStore((s) => s.loadDemo);
  const loadOfficialRoster = useAppStore((s) => s.loadOfficialRoster);
  const resetAll = useAppStore((s) => s.resetAll);
  const all = useAssessments();
  const maxOf = useMaxOf();
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onCsv(text: string) {
    const rows = parseScoreCsv(text, all);
    const r = importRows(rows);
    setMsg(`已讀 ${rows.length} 列，更新 ${r.scores} 個分數格。`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-medium tracking-tight">匯入與匯出</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          資料只存在這部電腦的瀏覽器。交卷給 Ruby（中一）／Ann（中二）前，可匯出按班號排序的
          CSV。
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>匯入 CSV／Excel 貼上</CardTitle>
            <CardDescription>
              欄位建議：班別, 班號, 姓名, 學號, 科目, 日期, 分數
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <textarea
              className="min-h-40 w-full rounded-md border border-border bg-input p-3 font-mono text-xs"
              placeholder="1A,01,陳嘉樂,16A001,中文,14/9,16"
              onPaste={(e) => {
                const t = e.clipboardData.getData("text");
                if (t.includes("\t") || t.includes(",")) {
                  e.preventDefault();
                  onCsv(t);
                }
              }}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,.json,application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const text = await f.text();
                if (f.name.endsWith(".json")) {
                  const data = parseRosterBackup(text);
                  if (data) {
                    replaceRoster(data);
                    setMsg("已還原備份。");
                  } else setMsg("備份檔無法讀取。");
                } else onCsv(text);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => fileRef.current?.click()}>
                選擇檔案
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const el = document.querySelector("textarea");
                  if (el instanceof HTMLTextAreaElement) onCsv(el.value);
                }}
              >
                讀取文字框
              </Button>
            </div>
            {msg && <p className="text-sm text-up">{msg}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>匯出</CardTitle>
            <CardDescription>CSV 可供 Excel 開啟；JSON 作整份名冊備份。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const parts = ALL_CLASSES.map((c) =>
                  exportClassCsv(
                    roster[c] ?? [],
                    all.filter((a) => a.form === (c.startsWith("2") ? 2 : 1)),
                    maxOf,
                  ),
                );
                downloadText("課後評估_全部.csv", parts.join("\n"));
              }}
            >
              匯出全部班別 CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                downloadText(
                  "課後評估_備份.json",
                  rosterBackup(roster),
                  "application/json",
                )
              }
            >
              下載 JSON 備份
            </Button>
            <Button
              variant="gold"
              onClick={() => {
                const n = loadOfficialRoster();
                setMsg(`已載入本學年分組名單 ${n} 人（已有分數按姓名保留）。`);
              }}
            >
              載入 2026-2027 分組名單
            </Button>
            <Button variant="outline" onClick={loadDemo}>
              載入 1A／2A 示範
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("清空全部成績與名冊？此動作不能復原。")) {
                  resetAll();
                  setMsg("已清空。");
                }
              }}
            >
              清空全部資料
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
