import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/rules")({ component: RulesPage });

export function RulesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-medium tracking-tight">計分與進步指數</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          對齊《中一及中二級課後進展性評估指引》（2026-2027）。中文、英文分開輸入、分開分析；非核心科目另計測驗／考試相對階段進步。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>評估設計（指引 2）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>語文科以促進學習的評估為主，範圍為評估前一至兩週課文、詞彙、修辭與文法。</p>
          <p>
            非核心科目（地理、公民經濟與社會、中史、歷史、佛化教育、科學）以作為學習的評估為主，對齊即將到來的測驗／考試重點。
          </p>
          <p>時間 20 分鐘；題量約為測驗一半。選擇／填充／配對不超過總分 30%。避免開放題以便互評。</p>
          <p>達標學生 16:15 後離校；不達標須重測。重測形式不限（整份、部分、口頭、抽問）。測驗／考試本身不設重測欄。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>百分率與達標</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>
            每次評估百分率 =（有效得分 ÷ 該卷滿分）× 100。課後評估若已填重測，有效得分取重測分數。
          </p>
          <p>預設及格線 50%。課後評估預設滿分 20；測驗／考試預設滿分 100。均可在設定或成績表「滿分」列更改。</p>
          <p>
            中文、英文按上課分組輸入（原班或 ABCD／CD／BCD 抽離組）。非核心科目按原班輸入課後評估與對應測驗／考試。
          </p>
          <p>
            語文科同一階段有多次小測：階段分 = 該階段已作答各次百分率的算術平均（空白不計）。
          </p>
          <p>非核心科目每階段一次課後評估，階段分即該次百分率。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>語文進步指數（中文、英文分開）</CardTitle>
          <CardDescription>早會頒獎：每班每科取進步指數最高的三名。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <ol className="list-decimal space-y-2 pl-5">
            <li>把該科課後小測按日期排列（中文一條序列、英文另一條，互不混合）。</li>
            <li>每對連續兩次已作答的百分率，計算差：後一次% − 前一次%。</li>
            <li>進步指數 = 這些差值的算術平均。至少兩次有分才計算。</li>
            <li>可改看單一階段：只取該階段內連續小測的平均升幅。</li>
          </ol>
          <p className="text-muted-foreground">
            成績表另顯示該階段標準分（z）作參考，不作為頒獎依據。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>非核心：測驗／考試相對階段</CardTitle>
          <CardDescription>每科每班取進步最大的三名。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <ol className="list-decimal space-y-2 pl-5">
            <li>T1A1 上學期測驗 對照 第一階段課後評估</li>
            <li>T1A2 上學期考試 對照 第二階段課後評估</li>
            <li>T2A1 下學期測驗 對照 第三階段課後評估</li>
            <li>T2A2 下學期考試 對照 第四階段課後評估</li>
          </ol>
          <p>進步 = 測考百分率 − 對應階段課後評估百分率。兩邊都有分才計算。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>流程備忘</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>試題最少三天前草擬，並存放評分參考於指定資料夾。文件名：級別／班別_科目_評估日期_試題或評分參考。</p>
          <p>互評用綠色原子筆，分數寫在答卷封面右上角。收集答卷（不用收試題）交校務處收集箱，按學號由小至大排。</p>
          <p>中一由 Ruby 輸入、中二由 Ann 輸入後交回科任派發。</p>
        </CardContent>
      </Card>
    </div>
  );
}
