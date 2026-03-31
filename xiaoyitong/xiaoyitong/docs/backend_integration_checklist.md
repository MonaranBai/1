# 校易通前后端接口核对清单（基于当前前端代码）

> 如需查看“从 Demo 到完整可用 APP（真实数据库 + AI + 安全测试运维）”的全量差距，请同时阅读：`docs/production_readiness_full_gap_checklist.md`

更新时间：2026-03-18  
核对范围：`frontend/src/api/*`、`frontend/src/views/*`、`backend/src/routes/*`

---

## 1. 核对结论（先看这个）

### 1.1 当前“前端已实际调用”的接口匹配情况
- 结论：**已调用接口与后端路由基本匹配，核心演示链路可联调。**
- 已调用接口共 33 处（含多页面重复调用），关键链路（登录、发布、举报、任务、搭子、管理员操作）都有对应路由。

### 1.2 与目标清单相比的主要缺口
- 缺口1：`GET /api/tasks/recommendation` 前端 `endpoints` 已定义，但后端未实现、前端也未接入调用。
- 缺口2：`/api/moderation/logs` 已有后端路由、前端 `endpoints` 已定义，但前端 API 封装与页面未接真实请求（当前是本地 store 日志）。
- 缺口3：管理员举报处理目前通过前端本地 store 改状态，缺少统一后端状态更新接口（例如 `PATCH /api/admin/reports/:id/status`）。
- 缺口4：用户资料编辑、学生认证申请、信用日志等仍是前端本地状态，缺少真实后端写接口。

### 1.3 实际状态判断
- **“满足演示版”**：是。
- **“满足完整落库联调版”**：否（还需补充一批读写接口与状态一致性接口）。

---

## 2. 前端接口总览（定义层）

来源：`frontend/src/api/endpoints.js`

### 2.1 端点定义统计
- `auth`：4
- `posts`：6
- `tasks`：7
- `buddies`：7
- `admin`：9
- **合计：33 个 endpoint 常量**

### 2.2 API 封装统计
- `authApi`：4
- `postsApi`：5
- `tasksApi`：6
- `buddiesApi`：7
- `adminApi`：9
- **合计：31 个 API 方法**

### 2.3 定义了 endpoint 但无 API 封装的方法
- `ENDPOINTS.posts.moderationLogs`（`/api/moderation/logs`）
- `ENDPOINTS.tasks.recommendation`（`/api/tasks/recommendation`）

---

## 3. 前端“实际调用”接口核对（页面行为层）

> 说明：仅统计 `views/*.vue` 中真正调用到的 API 方法。

### 3.1 认证与管理员登录
- `POST /api/auth/login`（Auth.vue）✅ 后端已实现
- `POST /api/auth/register`（Auth.vue）✅ 后端已实现
- `POST /api/admin/login`（Auth.vue）✅ 后端已实现

### 3.2 信息流
- `POST /api/posts`（Publish.vue）✅ 后端已实现
- `POST /api/reports`（Detail.vue）✅ 后端已实现
- （注）`GET /api/posts`、`GET /api/posts/:id`、`DELETE /api/posts/:id` 虽有 API 封装，但当前页面主流程依赖前端 store，未走真实请求。

### 3.3 任务
- `POST /api/tasks`（Tasks.vue）✅ 后端已实现
- `POST /api/tasks/:id/apply`（Tasks.vue、TaskDetail.vue）✅ 后端已实现
- `PATCH /api/tasks/:id/status`（Tasks.vue、TaskDetail.vue）✅ 后端已实现
- `POST /api/tasks/:id/evaluate`（Tasks.vue）✅ 后端已实现

### 3.4 搭子圈
- `POST /api/buddies`（Buddies.vue）✅ 后端已实现
- `POST /api/buddies/:id/join`（Buddies.vue、BuddyDetail.vue）✅ 后端已实现
- `PATCH /api/buddies/:id/status`（Buddies.vue、BuddyDetail.vue）✅ 后端已实现
- `POST /api/buddies/:id/evaluate`（Buddies.vue、BuddyDetail.vue）✅ 后端已实现
- `POST /api/buddies/:id/report`（Buddies.vue、BuddyDetail.vue）✅ 后端已实现

### 3.5 管理端
- `PATCH /api/admin/users/:id/verify`（AdminDashboard.vue）✅ 后端已实现
- `PATCH /api/admin/users/:id/status`（AdminDashboard.vue）✅ 后端已实现
- `PATCH /api/admin/users/:id/credit`（AdminDashboard.vue）✅ 后端已实现
- `GET /api/admin/reports`（AdminDashboard.vue）✅ 后端已实现
- `GET /api/admin/buddy-reports`（AdminDashboard.vue）✅ 后端已实现
- `PATCH /api/admin/buddy-reports/:id/status`（AdminDashboard.vue）✅ 后端已实现
- `PATCH /api/admin/buddies/:id/status`（AdminDashboard.vue）✅ 后端已实现

---

## 4. 后端路由现状核对（实现层）

来源：`backend/src/routes/*.js`

### 4.1 已实现路由
- Auth：`/api/auth/login`、`/api/auth/register`、`/api/auth/profile`
- Posts：`GET/POST /api/posts`、`GET/DELETE /api/posts/:id`
- Reports：`POST /api/reports`
- Moderation：`GET /api/moderation/logs`
- Tasks：`GET/POST /api/tasks`、`GET /api/tasks/:id`、`POST /api/tasks/:id/apply`、`PATCH /api/tasks/:id/status`、`POST /api/tasks/:id/evaluate`
- Buddies：`GET/POST /api/buddies`、`GET /api/buddies/:id`、`POST /api/buddies/:id/join`、`PATCH /api/buddies/:id/status`、`POST /api/buddies/:id/evaluate`、`POST /api/buddies/:id/report`
- Admin：`POST /api/admin/login`、`GET /api/admin/users`、`PATCH /api/admin/users/:id/status`、`PATCH /api/admin/users/:id/credit`、`PATCH /api/admin/users/:id/verify`、`GET /api/admin/reports`、`GET /api/admin/buddy-reports`、`PATCH /api/admin/buddy-reports/:id/status`、`GET /api/admin/buddies`、`PATCH /api/admin/buddies/:id/status`

### 4.2 缺失路由（按目标清单）
- `GET /api/tasks/recommendation`（建议补）
- `PATCH /api/admin/reports/:id/status`（建议补，避免只在前端本地改状态）

---

## 5. 给后端同学的“必须补齐”清单（按优先级）

## P0（本周必须）
- [ ] `PATCH /api/admin/reports/:id/status`
- [ ] 所有已存在接口统一鉴权中间件（登录/注册/管理员登录除外）
- [ ] 任务与搭子状态流转后端校验（禁止非法状态跳转）
- [ ] 任务/搭子评价后端改信用分并写 `credit_logs`
- [ ] 举报处理状态枚举统一（`pending/resolved/ignored`）

## P1（联调必须）
- [ ] `GET /api/tasks/recommendation`
- [ ] `GET /api/posts`、`GET /api/posts/:id`、`DELETE /api/posts/:id` 真正接数据库（当前多为演示）
- [ ] `GET /api/buddies` 支持筛选参数：`activityType, keyword, maxDistance, status`
- [ ] `GET /api/admin/users`、`GET /api/admin/buddies`、`GET /api/admin/reports` 支持分页

## P2（完善体验）
- [ ] 用户资料编辑接口：`PATCH /api/auth/profile`
- [ ] 学生认证提交接口：`POST /api/auth/verification`
- [ ] 信用日志接口：`GET /api/auth/credit-logs`

---

## 6. 给数据库同学的落地清单（与当前前端行为对齐）

- [ ] `users`（含 `verification_status`, `is_verified`, `credit_score`, `status`）
- [ ] `credit_logs`
- [ ] `info_posts`
- [ ] `post_reports`
- [ ] `task_posts`
- [ ] `task_applications`（可选，若做多人申请）
- [ ] `task_evaluations`
- [ ] `buddy_posts`（含经纬度、半径、人数、状态）
- [ ] `buddy_members`
- [ ] `buddy_evaluations`
- [ ] `buddy_reports`
- [ ] `moderation_logs`
- [ ] `user_behaviors`（推荐行为采集）
- [ ] `admin_operation_logs`

关键约束：
- [ ] `credit_score` 限制 `0~100`
- [ ] 任务/搭子状态字段做枚举约束
- [ ] 举报状态字段做枚举约束
- [ ] `users.phone` 唯一
- [ ] 搭子/任务加入操作事务化（避免并发超限）

---

## 7. 给AI同学的落地清单（替换前端规则版）

当前前端 AI 逻辑在 `Publish.vue` 是本地规则，后续需服务化：

- [ ] `POST /api/ai/category/recommend`（标题+描述 -> 推荐分类）
- [ ] `POST /api/ai/content/moderate`（文本/图片 -> passed/blocked + reason）
- [ ] `GET /api/moderation/logs` 分页筛选（管理端展示）

联调要求：
- [ ] 审核结果必须落 `moderation_logs`
- [ ] 审核失败可追溯（对象ID、原因、模型版本、时间）

---

## 8. 最终判定（可直接汇报）

- 前端当前“已调用接口”与后端路由：**基本一致（可演示）**。
- 距离“完整真实联调”：**仍需补齐 2 个关键接口 + 一批持久化读写接口**。
- 三方分工建议：
  - 后端先补 P0/P1 接口与状态机校验；
  - 数据库先按第6节建表和约束；
  - AI按第7节提供服务化接口并落日志。
