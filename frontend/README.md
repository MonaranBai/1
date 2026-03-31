# 校易通前端（Vue 3 + Vite）

## 运行
- 安装依赖：`npm install`
- 开发启动：`npm run dev`
- 生产构建：`npm run build`

## 环境变量
请在 `frontend` 目录创建 `.env`（或 `.env.local`）：

```bash
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=http://localhost:3000
VITE_AMAP_KEY=你的高德Web端JSAPI Key
```

说明：`VITE_AMAP_KEY` 用于“搭子圈-地图模式”加载高德地图；未配置时会显示降级提示。
