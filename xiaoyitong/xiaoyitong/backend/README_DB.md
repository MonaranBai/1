# 数据库初始化说明（MySQL 8）

本目录提供了项目第一版数据库脚本，覆盖用户、帖子、任务、搭子、举报、审核日志、行为日志和管理操作日志等核心模型。

## 文件说明

- `sql/init_schema.sql`: 初始化数据库和所有核心表。
- `sql/seed_minimal.sql`: 插入一批最小可用数据，便于前后端联调。

## 环境要求

- MySQL 8.0+（建议）
- 命令行可用 `mysql`

## 快速执行（Windows PowerShell）

在 `backend` 目录下执行：

```powershell
mysql -u root -p < .\sql\init_schema.sql
mysql -u root -p < .\sql\seed_minimal.sql
```

如果你不是默认 `root` 或端口不是 `3306`，可带参数：

```powershell
mysql -h 127.0.0.1 -P 3306 -u your_user -p < .\sql\init_schema.sql
mysql -h 127.0.0.1 -P 3306 -u your_user -p < .\sql\seed_minimal.sql
```

## 后端环境变量

将 `backend/.env.example` 复制为 `backend/.env` 并填写数据库账号密码：

```powershell
Copy-Item .\.env.example .\.env
```

## 表与前端数据结构对应

- 用户与信用：`users`, `credit_logs`, `verification_requests`
- 信息发布与举报：`info_posts`, `post_reports`
- 任务广场与互评：`task_posts`, `task_evaluations`
- 搭子圈与互评：`buddy_posts`, `buddy_members`, `buddy_evaluations`, `buddy_reports`
- 管理与审计：`moderation_logs`, `admin_operation_logs`
- 行为推荐基础：`user_behaviors`

## 当前后端接库进度

1. 已新增数据库连接模块：`backend/src/db/mysql.js`。
2. 已将 `auth/posts/reports/tasks/buddies/admin/moderation` 路由改为 SQL 读写。

## 下一步建议

1. 在关键写操作（发帖、发起活动、举报）补充统一 `admin_operation_logs` 和 `moderation_logs` 记录策略。
2. 为高频列表接口增加分页参数和必要索引优化（任务、搭子、举报列表）。
3. 引入真正的鉴权（JWT）与管理员权限校验中间件。
