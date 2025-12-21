# 🔧 部署故障排除指南

## 當前狀態
✅ GitHub Pages 已配置為使用 GitHub Actions  
🔄 剛剛觸發了新的部署  
⏳ 等待 GitHub Actions 完成部署  

## 📋 檢查步驟

### 1. 檢查 GitHub Actions 狀態
1. 前往: https://github.com/garyHu951/wordle-game/actions
2. 查看是否有正在運行的工作流程
3. 如果有失敗的工作流程，點擊查看錯誤詳情

### 2. 等待部署完成
- GitHub Actions 通常需要 2-5 分鐘完成
- 第一次部署可能需要更長時間
- 請耐心等待綠色勾號出現

### 3. 檢查 Pages 部署狀態
1. 前往: https://github.com/garyHu951/wordle-game/settings/pages
2. 查看是否顯示 "Your site is published at..."
3. 確認 URL 是否正確

### 4. 測試網站訪問
嘗試訪問: https://garyHu951.github.io/wordle-game

## 🚨 常見問題及解決方案

### 問題 1: Actions 沒有運行
**症狀**: Actions 標籤頁空白或沒有新的工作流程
**解決方案**:
1. 確認 Actions 已啟用 (Settings > Actions > General)
2. 檢查工作流程文件是否在正確位置 (`.github/workflows/deploy.yml`)

### 問題 2: 部署失敗
**症狀**: Actions 顯示紅色 X 或失敗狀態
**解決方案**:
1. 點擊失敗的工作流程查看錯誤日誌
2. 常見錯誤：
   - 權限問題：確認 Pages 設置正確
   - 構建錯誤：檢查 package.json 和依賴

### 問題 3: 404 錯誤持續存在
**症狀**: 網站仍顯示 404 頁面
**可能原因**:
1. DNS 傳播延遲 (最多 24 小時)
2. 瀏覽器緩存問題
3. 部署尚未完成

**解決方案**:
1. 清除瀏覽器緩存 (Ctrl+F5)
2. 嘗試無痕模式訪問
3. 等待更長時間

### 問題 4: 資源載入失敗
**症狀**: 頁面載入但樣式或 JS 文件 404
**解決方案**:
1. 檢查 `vite.config.js` 中的 `base: '/wordle-game/'`
2. 確認所有資源路徑都是相對路徑

## ⏰ 預期時間線

- **0-2 分鐘**: GitHub Actions 開始運行
- **2-5 分鐘**: 構建和部署完成
- **5-10 分鐘**: DNS 更新和緩存清理
- **最多 24 小時**: 完全的 DNS 傳播

## 🎯 成功指標

當部署成功時，你應該看到：
1. ✅ GitHub Actions 顯示綠色勾號
2. ✅ Pages 設置顯示 "Your site is published"
3. ✅ 網站 https://garyHu951.github.io/wordle-game 可正常訪問
4. ✅ 遊戲功能正常運作

## 📞 下一步行動

**立即執行**:
1. 訪問 https://github.com/garyHu951/wordle-game/actions
2. 查看最新的工作流程狀態
3. 等待 5 分鐘後重新測試網站

**如果 10 分鐘後仍有問題**:
1. 檢查 Actions 日誌中的錯誤信息
2. 確認 Pages 設置沒有被重置
3. 嘗試手動重新運行 Actions

---
*最後更新: 剛剛觸發了新的部署*