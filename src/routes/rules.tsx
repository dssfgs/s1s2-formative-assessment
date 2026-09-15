import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export function RulesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-medium tracking-tight">計分與進步指數</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          對齊《中一及中二級課後進展性評估指引》（2026-2027）。公式公開，方便課程發展組覆核。
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
          <p>達標學生 16:15 後離校；不達標須重測。重測形式不限（整份、部分、口頭、抽問）。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>百分率與達標</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>
            每次評估百分率 =（有效得分 ÷ 該卷滿分）× 100。若已填重測，有效得分取重測分數（反映重測後表現）。
          </p>
          <p>預設及格線 50%，預設滿分 20，均可在設定更改。</p>
          <p>
            語文科同一階段有多次小測：階段分 = 該階段已作答各次百分率的算術平均（空白不計）。
          </p>
          <p>非核心科目每階段一次，階段分即該次百分率。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>進步指數（預設：標準分差）</CardTitle>
          <CardDescription>用以比較不同難度的評估，避免「今次卷易所以人人進步」。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <ol className="list-decimal space-y-2 pl-5">
            <li>同一班、同一科、同一階段，取各生階段百分率，計算平均數 μ 與樣本標準差 σ。</li>
            <li>
              標準分 z = (x − μ) / σ。若只有一人或 σ = 0，則 z = 0。
            </li>
            <li>科進步指數 = 本階段 z − 上一階段 z（須兩階段都有成績）。</li>
            <li>學生總進步指數 = 各科科進步指數的算術平均。早會頒每班此值最高的三名。</li>
          </ol>
          <p className="text-muted-foreground">
            亦可在設定改用「百分率差」（本階段% − 上階段%）或「名次進步」（上階段名次 − 本階段名次，正數為進步）。
          </p>
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
