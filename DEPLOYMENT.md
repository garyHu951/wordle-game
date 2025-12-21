# Wordle 遊戲部署指南

## 🚀 部署概覽

- **前端**: GitHub Pages (靜態網站託管)
- **後端**: Render (Node.js 應用託管)
- **資料庫**: MongoDB Atlas (雲端資料庫)

## 📋 部署前準備

### 1. GitHub 倉庫設置
1. 將代碼推送到 GitHub 倉庫
2. 確保倉庫是公開的（GitHub Pages 免費版需要）

### 2. MongoDB Atlas 設置
1. 註冊 [MongoDB Atlas](https://www.mongodb.com/atlas) 帳號
2. 創建免費集群
3. 創建資料庫用戶
4. 獲取連接字符串（格式：`mongodb+srv://username:password@cluster.mongodb.net/wordle-game`）
5. 設置網絡訪問（允許所有 IP：0.0.0.0/0）

### 3. Render 帳號設置
1. 註冊 [Render](https://render.com) 帳號
2. 連接您的 GitHub 帳號

## 🔧 配置修改

### 前端配置
1. 修改 `frontend/src/App.jsx` 中的 API URL：
```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://your-render-app-name.onrender.com/api'  // 替換為您的 Render 應用名稱
  : 'http://localhost:3001/api';
```

2. 修改 `frontend/vite.config.js` 中的 base 路徑：
```javascript
base: '/your-repo-name/', // 替換為您的 GitHub 倉庫名稱
```

3. 修改 `frontend/.github/workflows/deploy.yml` 中的域名（可選）：
```yaml
cname: your-custom-domain.com  # 如果您有自定義域名
```

### 後端配置
1. 修改 `backend/server.js` 中的 CORS 設置：
```javascript
origin: NODE_ENV === 'production' 
  ? [FRONTEND_URL, 'https://your-username.github.io'] // 替換為您的 GitHub 用戶名
  : ['http://localhost:5173', 'http://127.0.0.1:5173'],
```

2. 修改 `backend/render.yaml` 中的前端 URL：
```yaml
- key: FRONTEND_URL
  value: https://your-username.github.io/your-repo-name  # 替換為您的實際 URL
```

## 🚀 部署步驟

### 步驟 1: 部署後端到 Render

1. **創建 Web Service**：
   - 登入 Render 控制台
   - 點擊 "New" → "Web Service"
   - 連接您的 GitHub 倉庫
   - 選擇 `backend` 資料夾作為根目錄

2. **配置環境變數**：
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wordle-game
   FRONTEND_URL=https://your-username.github.io/your-repo-name
   JWT_SECRET=your-super-secret-jwt-key
   ```

3. **部署設置**：
   - Build Command: `npm install`
   - Start Command: `npm start`
   - 選擇免費方案

4. **等待部署完成**，記下您的 Render URL（例如：`https://your-app-name.onrender.com`）

### 步驟 2: 更新前端 API URL

1. 使用步驟 1 獲得的 Render URL 更新前端配置
2. 提交並推送更改到 GitHub

### 步驟 3: 部署前端到 GitHub Pages

1. **啟用 GitHub Pages**：
   - 進入 GitHub 倉庫設置
   - 滾動到 "Pages" 部分
   - Source 選擇 "GitHub Actions"

2. **配置 GitHub Actions**：
   - GitHub Actions 工作流程已經在 `.github/workflows/deploy.yml` 中配置
   - 推送到 `main` 分支將自動觸發部署

3. **等待部署完成**：
   - 檢查 Actions 標籤頁查看部署狀態
   - 部署完成後，您的網站將在 `https://your-username.github.io/your-repo-name` 可用

## 🔍 驗證部署

### 後端驗證
訪問：`https://your-render-app-name.onrender.com/health`
應該返回：
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "mongodb": "connected"
}
```

### 前端驗證
1. 訪問您的 GitHub Pages URL
2. 測試單人模式和對戰模式功能
3. 檢查瀏覽器控制台是否有錯誤

## 🛠️ 故障排除

### 常見問題

1. **CORS 錯誤**：
   - 確保後端 CORS 配置包含正確的前端 URL
   - 檢查環境變數設置

2. **MongoDB 連接失敗**：
   - 驗證 MongoDB Atlas 連接字符串
   - 確保網絡訪問設置正確
   - 檢查用戶名和密碼

3. **GitHub Pages 404 錯誤**：
   - 檢查 `vite.config.js` 中的 base 路徑
   - 確保倉庫是公開的
   - 檢查 GitHub Actions 部署日誌

4. **Render 部署失敗**：
   - 檢查 `package.json` 中的 Node.js 版本
   - 查看 Render 部署日誌
   - 確保所有依賴項都已安裝

### 日誌檢查
- **Render 日誌**：Render 控制台 → 您的服務 → Logs
- **GitHub Actions 日誌**：GitHub 倉庫 → Actions 標籤頁
- **瀏覽器日誌**：F12 開發者工具 → Console

## 📝 環境變數清單

### Render 環境變數
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wordle-game
FRONTEND_URL=https://your-username.github.io/your-repo-name
JWT_SECRET=your-super-secret-jwt-key
```

### GitHub Secrets（如需要）
目前使用 GitHub Actions 的默認 token，無需額外設置。

## 🔄 更新部署

### 更新前端
1. 修改代碼
2. 提交並推送到 `main` 分支
3. GitHub Actions 將自動重新部署

### 更新後端
1. 修改代碼
2. 提交並推送到 GitHub
3. Render 將自動檢測更改並重新部署

## 💡 優化建議

1. **性能優化**：
   - 啟用 Render 的 CDN
   - 使用 MongoDB 索引優化查詢
   - 實施適當的緩存策略

2. **安全性**：
   - 使用強密碼和安全的 JWT 密鑰
   - 定期更新依賴項
   - 實施速率限制

3. **監控**：
   - 設置 Render 的健康檢查
   - 監控 MongoDB Atlas 使用情況
   - 使用 GitHub Actions 的通知功能

## 📞 支援

如果遇到問題，請檢查：
1. 官方文檔：[Render](https://render.com/docs)、[GitHub Pages](https://docs.github.com/pages)
2. 社區論壇和 Stack Overflow
3. 項目的 Issues 頁面