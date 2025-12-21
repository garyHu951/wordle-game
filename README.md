# 🎮 Wordle+ 像素版遊戲

一個現代化的 Wordle 遊戲，具有像素風格設計、音效系統和多人對戰功能。

## ✨ 功能特色

### 🎯 遊戲模式
- **單人模式**: 經典 Wordle 體驗，支援 4-7 字母單字
- **對戰模式**: 即時多人對戰，先達到 30 分獲勝

### 🎨 視覺設計
- 復古像素風格界面
- 流暢的動畫效果
- 自定義像素風格滑鼠游標
- 響應式設計，支援手機和桌面

### 🔊 音效系統
- 沉浸式背景音樂
- 互動音效反饋
- 可調節音量控制
- 智能音效優先級系統

### 🎮 遊戲功能
- 字母狀態追蹤顯示
- 重複輸入防護
- 勝利/失敗動畫彈窗
- 統一 6 次猜測挑戰
- 即時遊戲狀態同步

## 🚀 線上體驗

- **遊戲網址**: [https://garyHu951.github.io/wordle-game](https://garyHu951.github.io/wordle-game)
- **API 服務**: [https://wordle-game-57ta.onrender.com](https://wordle-game-57ta.onrender.com)

## 🛠️ 技術架構

### 前端
- **框架**: React 18 + Vite
- **樣式**: Tailwind CSS + 自定義像素風格
- **圖標**: Lucide React
- **部署**: GitHub Pages

### 後端
- **運行環境**: Node.js + Express
- **即時通訊**: Socket.IO
- **資料庫**: MongoDB Atlas
- **部署**: Render

### 開發工具
- **熱重載**: Vite HMR
- **代碼檢查**: ESLint
- **自動部署**: GitHub Actions

## 📦 本地開發

### 環境要求
- Node.js 18+
- npm 或 yarn
- MongoDB (可選，開發時使用內存存儲)

### 安裝步驟

1. **克隆倉庫**
```bash
git clone https://github.com/garyHu951/wordle-game.git
cd wordle-game
```

2. **安裝後端依賴**
```bash
cd backend
npm install
```

3. **安裝前端依賴**
```bash
cd ../frontend
npm install
```

4. **配置環境變數**
```bash
# 在 backend 目錄下
cp .env.example .env
# 編輯 .env 文件設置您的配置
```

5. **啟動開發服務器**

後端：
```bash
cd backend
npm run dev
```

前端：
```bash
cd frontend
npm run dev
```

6. **訪問應用**
- 前端: http://localhost:5173
- 後端 API: http://localhost:3001

## 🚀 部署指南

詳細的部署說明請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署
1. **後端部署到 Render**
2. **前端部署到 GitHub Pages**
3. **資料庫使用 MongoDB Atlas**

## 🎮 遊戲規則

### 單人模式
- 猜測隨機生成的單字（4-7 字母）
- 每個單字有 6 次猜測機會
- 綠色：字母正確且位置正確
- 黃色：字母存在但位置錯誤
- 灰色：字母不存在於答案中

### 對戰模式
- 兩人即時對戰
- 每輪勝利獲得 5 分
- 先達到 30 分的玩家獲勝
- 支援房間創建和加入

## 🔧 自定義配置

### 音效設置
- 支援音量調節
- 一鍵靜音功能
- 背景音樂自動切換

### 視覺設置
- 像素風格動畫
- 自適應佈局
- 深色主題設計

## 📱 瀏覽器支援

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 貢獻指南

1. Fork 本倉庫
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權協議

本項目採用 MIT 授權協議 - 查看 [LICENSE](LICENSE) 文件了解詳情

## 🙏 致謝

- 原始 Wordle 遊戲靈感來自 Josh Wardle
- 像素風格設計靈感
- 音效素材來源
- 開源社區的支持

## 📞 聯繫方式

- 項目連結: [https://github.com/garyHu951/wordle-game](https://github.com/garyHu951/wordle-game)
- 問題回報: [Issues](https://github.com/garyHu951/wordle-game/issues)

---

⭐ 如果這個項目對您有幫助，請給它一個星星！