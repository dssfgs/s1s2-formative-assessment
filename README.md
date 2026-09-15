# 課後進展性評估計算器

香海正覺蓮社佛教梁植偉中學 · 2026-2027 中一及中二級

對齊《中一及中二級課後進展性評估指引》，操作習慣接近校本 **WEBSAMS 成績計算器**：Excel／WEBSAMS 名單貼上、格子輸入、方向鍵、CSV 匯出、列印學生報告。

**純前端、本機儲存，不經 Vercel、不經任何伺服器。** 以 GitHub Pages 上線，並可安裝成主畫面 App（PWA）。

## 網址

**https://dssfgs.github.io/s1s2-formative-assessment/**

學生姓名與分數只存在該瀏覽器（localStorage），**不會**上傳到 GitHub。

## 安裝到主畫面（PWA）

| 裝置 | 做法 |
|---|---|
| Android / Windows Chrome | 開啟網址 → 右上選單「安裝應用程式」，或頁面底部「安裝」 |
| iPhone / iPad | 用 **Safari** 開啟 → 底部分享 → **加入主畫面** |
| 電腦 Edge | 網址列右側安裝圖示 |

安裝後可離線查看已輸入成績；第一次開啟仍需連網載入頁面。

## 開啟 GitHub Pages（只需一次）

GitHub **不會**允許 Action／API 代你開 Pages，必須由倉庫擁有者在網頁按一次。

**不要選 GitHub Actions**（那個來源會 404：`Failed to create deployment`）。請改用分支：

1. 打開 [Settings → Pages](https://github.com/dssfgs/s1s2-formative-assessment/settings/pages)
2. **Build and deployment → Source** 選 **Deploy from a branch**
3. Branch：**main**，資料夾：**/docs**
4. **Save**

約 1 分鐘後上面的網址會亮起。之後每次 push `main`，Actions 會自動把新版本寫進 `/docs`，不用再改設定。

若先前選過 **GitHub Actions**，請改回 **Deploy from a branch** → `main` / `/docs`，錯誤就會消失。

## 使用

1. 打開上面的網址（或本機 `npm run dev`）
2. 按「載入 1A／2A 示範數據」試用
3. 到班別從 WEBSAMS／Excel 貼上 `REGNO CLASSCODE CLASSNO ENNAME CHNAME`
4. 像試算表輸入分數（Enter 下一列、方向鍵、Ctrl+V 貼上整欄）
5. 教學助理模式：中一 Ruby、中二 Ann；達標綠／不達標紅，不達標須重測
6. 「全校總表」篩待重測；「進步頒獎」中文、英文、非核心測考分開列印每班首三名

換電腦前請到「匯入匯出」下載 JSON 備份。

### 功能

- 中一／中二 八班成績表（1A–1D、2A–2D）
- **中文、英文分開輸入、分開分析**
- 語文每週小測 + 非核心每階段一次課後評估 + **測驗／考試欄（T1A1–T2A2）**
- 達標（預設 50%）／重測欄（測考欄無重測）；教學助理輸入模式
- 進步指數：語文＝連續小測百分率差平均；非核心＝測考% − 對應階段課後評估%
- 早會頒獎名單：每班每軌首三名，可列印
- 全校總表、各科進程圖、完整 2026-2027 日程
- 列印學生一人一頁報告
- CSV／JSON 備份
- **PWA：安裝到主畫面、離線開啟、離線橫幅**

### 公式

**語文（中文、英文各算一次）**

1. 把該科課後小測按日期排列
2. 每對連續兩次已作答的百分率，計算差：後一次% − 前一次%
3. 進步指數 = 這些差值的算術平均（至少兩次有分）
4. 每班該科取最高三名頒獎

**非核心科目**

| 測考 | 對照階段 |
|---|---|
| T1A1 上學期測驗 | 第一階段課後評估 |
| T1A2 上學期考試 | 第二階段課後評估 |
| T2A1 下學期測驗 | 第三階段課後評估 |
| T2A2 下學期考試 | 第四階段課後評估 |

進步 = 測考百分率 − 對應階段課後評估百分率。每班每科取最高三名。

## 本機開發

```bash
npm install
npm run dev
```

```bash
npm run build
# 輸出在 dist/；GitHub Actions 會複製到 docs/ 供 Pages 發佈
```
