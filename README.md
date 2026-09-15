# 課後進展性評估計算器

香海正覺蓮社佛教梁植偉中學 · 2026-2027 中一及中二級

對齊《中一及中二級課後進展性評估指引》，操作習慣接近校本 **WEBSAMS 成績計算器**：Excel／WEBSAMS 名單貼上、格子輸入、方向鍵、CSV 匯出、列印學生報告。

**純前端、本機儲存，不經 Vercel、不經任何伺服器。** 以 GitHub Pages 上線。

## 開啟 GitHub Pages（只需一次）

倉庫 → **Settings → Pages**

1. **Build and deployment → Source** 選 **Deploy from a branch**
2. Branch 選 `main`，資料夾選 **`/docs`**
3. Save

約一分鐘後：

**https://dssfgs.github.io/s1s2-formative-assessment/**

學生姓名與分數只存在該瀏覽器（localStorage），**不會**上傳到 GitHub。

## 使用

1. 打開上面的網址（或本機 `npm run dev`）
2. 按「載入 1A／2A 示範數據」試用
3. 到班別從 WEBSAMS／Excel 貼上 `REGNO CLASSCODE CLASSNO ENNAME CHNAME`
4. 像試算表輸入分數（Enter 下一列、方向鍵、Ctrl+V 貼上整欄）
5. 教學助理模式：中一 Ruby、中二 Ann；達標綠／不達標紅，不達標須重測
6. 「全校總表」篩待重測；「進步頒獎」列印每班首三名

換電腦前請到「匯入匯出」下載 JSON 備份。

### 功能

- 中一／中二 八班成績表（1A–1D、2A–2D）
- 語文每週小測 + 非核心每階段一次（地理、公民、中史、歷史、佛化、科學）
- 達標（預設 50%）／重測欄；教學助理輸入模式
- 進步指數：班內標準分差（設定可改百分率差或名次進步）
- 早會頒獎名單：每班首三名，可列印
- 全校總表、各科進程圖、完整 2026-2027 日程
- 列印學生一人一頁報告
- CSV／JSON 備份

### 公式（標準分差）

1. 階段分 = 該階段已作答各次百分率平均
2. 同一班同一科算 μ、σ，z = (x − μ) / σ
3. 科進步 = z本階段 − z上一階段
4. 學生總進步 = 各科進步平均；每班取最高三名頒獎

## 本機開發

```bash
npm install
npm run dev
```

```bash
npm run build
# 輸出在 dist/；複製到 docs/ 即可更新 Pages
```
