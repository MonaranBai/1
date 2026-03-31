# 校易帮——校园任务协同与交换平台 开发文档（A1融合版）

## 1. 项目概述

### 1.1 项目定位
- 项目名称：校易帮
- 赛事命题：第十七届服务外包创新创业大赛 A类 A1（校园任务协同与交换平台）
- 目标用户：本校学生（移动端优先，管理员支持电脑端与手机端）

### 1.2 价值主张
- 基础交换：二手、拼车、租房、组队四大校园高频场景。
- 任务协同：新增悬赏任务闭环（发布、接单、流转、确认、评价）。
- 轻社交组队：新增“搭子圈”即时组队（跑步、学习、看展、饭搭子等），提升校园陪伴连接效率。
- 信任安全：信用分、学生认证、AI内容审核协同降低风险。
- 匹配效率：标签推荐 + 行为推荐，提升信息触达效率。

## 2. 当前系统模块（前端已接入）

### 2.1 用户端
- 分类信息流（搜索、分类、排序、详情）
- 二手图片上传与详情大图预览
- 互助任务中心（发布任务、接单、状态流转、评价）
- 搭子圈（即时组队发布、兴趣标签匹配、校内附近匹配、地图模式点位查看、组队互评）
- 个人中心（信用分、认证状态、信用日志）
- AI辅助发布（分类推荐 + 内容审核）

### 2.2 管理端（同一登录入口）
- 管理员登录（`/auth` 统一入口）
- 用户管理（禁用、恢复、删除）
- 认证审核（通过/驳回）
- 举报处理（待处理/已处理/忽略）
- 内容管理（删除信息）
- 任务管理（完成/取消）
- 信用管理（加分/扣分）
- AI审核日志查看

## 3. 技术栈
- 前端：Vue 3 + Vite + Vant 4
- 状态管理：Pinia
- 后端：Node.js + Express（后续联调）
- 数据库：MySQL（后续落库）
- 认证：JWT（后续联调）
- 地图：高德地图 JSAPI（搭子圈地图模式）
- AI能力（规划）：大模型分类推荐 + OCR + 内容审核API

## 4. 前端架构映射
- `src/api/httpClient.js`：Axios封装（支持 token 注入与超时）
- `src/api/endpoints.js`：统一接口地址常量
- `src/api/authApi.js / postsApi.js / tasksApi.js / buddiesApi.js / adminApi.js`：前端接口调用层（默认mock，可切真实）
- `src/store/auth.js`：用户、管理员、信用分、认证审核
- `src/store/posts.js`：信息发布、举报、AI审核日志
- `src/store/tasks.js`：任务状态机、评价、行为数据、推荐
- `src/store/buddies.js`：搭子需求、兴趣标签匹配、距离过滤、组队评价
- `src/views/Home.vue`：基础信息流 + 智能推荐任务
- `src/views/Publish.vue`：动态表单 + AI推荐分类 + AI内容审核
- `src/views/Tasks.vue`：互助任务中心
- `src/views/Buddies.vue`：搭子圈（附近搭子需求列表 + 发布 + 组队确认 + 互评）
- `src/views/BuddyDetail.vue`：搭子活动详情（成员、范围、状态、加入/结束/互评）
- `src/views/AdminDashboard.vue`：管理后台（移动端/电脑端双适配）

## 5. 核心业务设计

### 5.1 互助任务状态机
- 状态：`pending -> ongoing -> pending_confirm -> completed / cancelled`
- 关键动作：
   - 发布者发布任务
   - 用户接单（任务进入 `ongoing`）
   - 发布者提交待确认/确认完成
   - 完成后评价驱动信用分变化

### 5.2 信用分体系
- 初始分：100
- 评价映射：好评 +2，中评 0，差评 -2
- 范围限制：0~100（封顶100）
- 业务限制：信用分 < 60 禁止发布任务/接单

### 5.3 推荐引擎（前端演示版）
- 行为采集：浏览、发布、接单写入 `behaviors`
- 推荐策略：标签权重匹配，冷启动回退最新任务
- 展示位置：首页“智能推荐任务”模块

### 5.4 AI辅助发布（前端规则版）
- AI推荐分类：根据标题与描述关键字推荐分类
- AI内容审核：命中敏感词后阻断发布并记录日志
- 审核日志：写入 `moderationLogs`，管理端可查看

### 5.5 搭子圈业务闭环（新增）
- 场景：跑步搭子、学习搭子、看展搭子、饭搭子等即时组队。
- 发布字段：标题、活动类型、地点、时间、人数上限、兴趣标签、匹配半径。
- 发布增强：支持高德地图选点，发起时可直接在地图上点击选择活动坐标。
- 选点增强：支持关键词搜索POI与“一键使用当前位置”回填活动地点。
- 匹配规则：默认校内及周边500米，支持用户个性化调整半径；按兴趣标签优先匹配。
- 地图展示：支持高德地图点位展示活动位置，点击点位可进入活动详情。
- 安全约束：实名与认证用户方可发起/加入组队；定位信息以手机定位为主。
- 信用闭环：组队结束后双方互评，写入信用日志并影响后续匹配优先级。

## 6. 数据库设计建议（后端实现）

### 6.1 基础表
- `users`: id, phone, password, nickname, avatar, is_verified, credit_score, status, created_at
- `info_posts`: id, user_id, category, title, description, price, location, images, contact_type, contact_info, status, created_at
- `reports`: id, post_id, reporter_id, reason, status, admin_note, created_at

### 6.2 任务与信用表
- `task_posts`: id, user_id, title, description, location, reward, deadline, status, helper_id, created_at
- `task_applications`: id, task_id, helper_id, status, applied_at
- `evaluations`: id, task_id, from_user_id, to_user_id, rating, comment, created_at
- `credit_logs`: id, user_id, change_value, reason, created_at

### 6.3 推荐与审核表
- `user_behaviors`: id, user_id, target_type, target_id, action, tags, created_at
- `moderation_logs`: id, title, result, reason, operator_id, created_at

### 6.4 搭子圈建议表（新增）
- `buddy_posts`: id, user_id, title, activity_type, location, latitude, longitude, radius_meter, event_time, max_members, current_members, tags, status, created_at
- `buddy_members`: id, buddy_post_id, user_id, role, join_status, joined_at
- `buddy_evaluations`: id, buddy_post_id, from_user_id, to_user_id, rating, comment, created_at
- `buddy_reports`: id, buddy_post_id, reporter_id, reason, status, admin_note, created_at

## 6.5 联调接口骨架（已落地）
- 后端位置：`backend/src`
- 启动方式：`npm run dev`（backend目录）
- 已对齐路由：
   - `POST /api/auth/login`
   - `POST /api/auth/register`
   - `GET /api/auth/profile`
   - `GET/POST/GET/:id/DELETE /api/posts`
   - `POST /api/reports`
   - `GET /api/moderation/logs`
   - `GET/POST/GET/:id /api/tasks`
   - `POST /api/tasks/:id/apply`
   - `PATCH /api/tasks/:id/status`
   - `POST /api/tasks/:id/evaluate`
   - `GET/POST/GET/:id /api/buddies`
   - `POST /api/buddies/:id/join`
   - `PATCH /api/buddies/:id/status`
   - `POST /api/buddies/:id/evaluate`
   - `POST /api/buddies/:id/report`
   - `POST /api/admin/login`
   - `GET /api/admin/users`
   - `PATCH /api/admin/users/:id/status`
   - `PATCH /api/admin/users/:id/credit`
   - `PATCH /api/admin/users/:id/verify`
   - `GET /api/admin/reports`
   - `GET /api/admin/buddy-reports`
   - `PATCH /api/admin/buddy-reports/:id/status`
   - `GET /api/admin/buddies`
   - `PATCH /api/admin/buddies/:id/status`

前端切换真实接口方法：设置 `VITE_USE_MOCK_API=false` 并配置 `VITE_API_BASE_URL`。

地图能力配置：设置 `VITE_AMAP_KEY` 后可启用搭子圈高德地图模式。

## 7. 滚动交付计划（落地优先）
- 阶段A：先完成可演示闭环（基础交换 + 任务协同 + 搭子圈 + 管理后台）
- 阶段B：补齐信任安全（信用分、认证审核、举报处理、审核日志）
- 阶段C：接入真实API（按 `src/api/*` 模块逐项替换 mock，优先任务与搭子圈）
- 阶段D：联调与优化（推荐效果、AI API稳定性、部署验收）

说明：不强制按固定8周推进，按“功能可落地优先”原则持续迭代。

## 8. 开发规范
1. 接口响应统一：`{ code, message, data }`
2. Commit规范：`feat/fix/docs/refactor/style`
3. 安全约束：登录接口之外统一鉴权；敏感操作留操作日志

## 9. 风险与应对
- AI API不可用：规则引擎兜底（当前前端已采用）
- 推荐冷启动：按最新/热门回退
- 任务状态复杂：严格状态机 + 审核按钮权限控制
- 线下见面安全：默认校内+近距离匹配、实名认证门槛、异常行为可追踪日志
- 进度风险：优先任务闭环与信用闭环，AI高级能力后置

---
> 文档状态：已根据最新A1提案与当前前端实现同步更新，可直接作为阶段报告与答辩材料基础。
