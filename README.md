# FoodOrdering

扫码点餐系统仓库，包含三个子项目：

- `admin`：管理后台（Vue 3 + Vite + TypeScript）
- `backend`：后端服务（Spring Boot + MyBatis-Plus）
- `miniprogram`：微信小程序端（原生小程序 + TypeScript）

## 1. 项目结构

```text
FoodOrdering/
├─ admin/                # 管理后台
├─ backend/              # Java 单体后端
├─ miniprogram/          # 微信小程序
├─ docker-compose.yml    # MySQL / Redis / RabbitMQ
└─ .trae/documents/      # 需求与架构文档
```

## 2. 技术栈

- 管理端：`Vue 3`、`Vite`、`TypeScript`、`Pinia`、`Vue Router`、`Tailwind CSS`
- 后端：`Java 25`、`Spring Boot 2.7.18`、`MyBatis-Plus 3.5.3.1`
- 数据层：当前默认 `H2 内存库`（已预置 `schema.sql` + `data.sql`）
- 基础设施（可选）：`MySQL`、`Redis`、`RabbitMQ`（由 `docker-compose.yml` 提供）

## 3. API 约定（已统一）

- 统一前缀：
  - 后端服务统一网关前缀：`/api`
  - 业务 API 统一版本前缀：`/api/v1`
  - 管理端 API 前缀：`/api/v1/admin`
- 统一响应结构（真实接口）：

```json
{
  "code": 0,
  "message": "OK",
  "data": {},
  "timestamp": "2026-03-02T11:36:22.128053400Z"
}
```

- 兼容策略：
  - `admin` 与 `miniprogram` 请求层都已支持统一解包，业务页面仍可按原有 `data` 方式读取。
  - `GET /api/dish/list` 保留，同时新增 `GET /api/v1/dishes`。

## 4. 当前实现状态（重要）

- `admin` 默认走 Mock（`admin/.env.development` 中 `VITE_USE_MOCK=true`），可独立运行演示。
- `miniprogram` 也默认走 Mock（`wx.getStorageSync('MP_USE_MOCK') !== false` 时启用）。
- `backend` 已有完整点餐相关表结构（用户、分类、菜品、桌台、订单、订单明细、支付）。
- `backend` 已补齐管理端读取类接口（`/api/v1/admin/*`），可支撑管理端切换真实接口联调。
- `backend` 已补齐管理端核心写操作接口（公告、分类、菜品增删改，用户/留言/工单状态更新，订单状态更新）。
- `backend` 已启用管理端真实鉴权：登录签发 JWT，`/api/v1/admin/auth/login` 之外的管理接口统一校验 `Authorization: Bearer <token>`。
- `backend` 已补充管理端角色/资源授权：针对公告、用户状态、菜单、订单状态、留言状态、工单状态等写操作按角色进行权限校验。
- 管理员密码已支持 BCrypt 哈希校验，并兼容历史明文种子自动升级。
- `backend` 已补齐小程序真实接口：绑定桌台、菜单、创建订单、订单详情、微信支付预下单与支付确认。
- `miniprogram` 已补齐扫码解析/手动绑桌、菜单搜索与售罄态、购物车备注与清空、订单详情支付闭环。

## 5. 环境要求

- Node.js 18+
- npm 9+
- JDK 25
- Maven 3.9.12+（或直接使用 Maven Wrapper）
- 微信开发者工具（用于运行 `miniprogram`）

## 6. 快速启动

### 6.1 启动后端

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell 可使用：

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

启动后：

- 服务地址：`http://localhost:8080`
- 接口根路径：`/api`
- 示例接口：
  - `GET http://localhost:8080/api/dish/list`
  - `POST http://localhost:8080/api/v1/admin/auth/login`
- H2 控制台：`http://localhost:8080/api/h2-console`
  - JDBC URL：`jdbc:h2:mem:food_ordering;DB_CLOSE_DELAY=-1;MODE=MySQL`
  - 用户名：`sa`
  - 密码：空

可选鉴权配置（环境变量）：

- `ADMIN_JWT_SECRET`：JWT 签名密钥（建议 32 字节以上）
- `ADMIN_JWT_TTL_SECONDS`：token 有效期秒数（默认 `43200`）

### 6.2 启动管理端

```bash
cd admin
npm install
npm run dev
```

默认是 Mock 模式，可直接登录：

- 用户名：`admin`
- 密码：`admin123`

如果你要改成真实接口：

1. 把 `admin/.env.development` 改为 `VITE_USE_MOCK=false`
2. 在环境变量中配置 `VITE_API_BASE_URL`（例如 `http://localhost:8080`）
3. 启动 `backend` 后可直接联调 `admin/src/lib/api.ts` 定义的接口

### 6.3 运行小程序

1. 打开微信开发者工具
2. 导入目录：`miniprogram`
3. 编译运行

当前默认 Mock 数据，可走完整主流程：

- 扫码/手动绑定桌台
- 浏览菜单
- 加购下单
- 查看订单详情与模拟支付

说明：小程序请求层默认前缀已统一为 `http://localhost:8080/api/v1`，切换真实接口时无需改调用路径。
开发时如需切换真实接口：

1. 在小程序控制台执行：`wx.setStorageSync('MP_USE_MOCK', false)`
2. 如后端不在本机，可配置：`wx.setStorageSync('MP_API_BASE_URL', 'http://你的后端地址')`
3. 重新编译小程序

## 7. 可选：启动依赖中间件

如需切换到 MySQL/Redis/RabbitMQ：

```bash
docker compose up -d
```

`docker-compose.yml` 暴露端口：

- MySQL: `3306`
- Redis: `6379`
- RabbitMQ: `5672`
- RabbitMQ 管理台: `15672`

说明：当前 `backend/src/main/resources/application.yml` 默认排除了 Redis 与 RabbitMQ 自动配置，并使用 H2。切换到中间件前，需要同步调整该配置。

## 8. 关键源码位置

- 管理端 API 定义：`admin/src/lib/api.ts`
- 管理端路由：`admin/src/router/index.ts`
- 后端入口：`backend/src/main/java/com/foodordering/FoodOrderingApplication.java`
- 后端菜品接口：`backend/src/main/java/com/foodordering/controller/dish/DishController.java`
- 后端统一响应封装：`backend/src/main/java/com/foodordering/common/api/ApiResponse.java`
- 后端响应/异常处理：`backend/src/main/java/com/foodordering/config/ApiResponseAdvice.java`、`backend/src/main/java/com/foodordering/config/GlobalExceptionHandler.java`
- 后端管理端授权：`backend/src/main/java/com/foodordering/auth/AdminAuthorize.java`、`backend/src/main/java/com/foodordering/auth/AdminAuthorizationService.java`
- 后端配置：`backend/src/main/resources/application.yml`
- 后端建表脚本：`backend/src/main/resources/schema.sql`
- 小程序请求封装：`miniprogram/utils/request.ts`
- 小程序页面配置：`miniprogram/app.json`
- 需求/架构文档：`.trae/documents/`

## 9. 已实现管理端接口

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/profile`
- `GET /api/v1/admin/notices`
- `POST /api/v1/admin/notices`
- `PUT /api/v1/admin/notices/{noticeId}`
- `DELETE /api/v1/admin/notices/{noticeId}`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/{userId}/status`
- `GET /api/v1/admin/menu`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/{categoryId}`
- `DELETE /api/v1/admin/categories/{categoryId}`
- `POST /api/v1/admin/dishes`
- `PUT /api/v1/admin/dishes/{dishId}`
- `DELETE /api/v1/admin/dishes/{dishId}`
- `GET /api/v1/admin/orders?status=PAID`
- `POST /api/v1/admin/orders/{orderId}/status`
- `GET /api/v1/admin/stats/dish-sales`
- `GET /api/v1/admin/comments`
- `GET /api/v1/admin/feedbacks`
- `PATCH /api/v1/admin/feedbacks/{feedbackId}/status`
- `GET /api/v1/admin/support/tickets`
- `PATCH /api/v1/admin/support/tickets/{ticketId}/status`
- `POST /api/v1/session/bind-table`
- `GET /api/v1/menu?storeId=store_1`
- `POST /api/v1/orders`
- `GET /api/v1/orders/{orderId}`
- `POST /api/v1/pay/wechat/prepay`
- `POST /api/v1/pay/wechat/confirm`
- `POST /api/v1/orders/{orderId}/urge`

## 10. 后续建议

1. 为角色权限引入配置化来源（数据库或配置中心），减少硬编码并支持动态调整。
2. 在管理端页面按权限码做按钮级可见性控制，避免前端展示无权操作入口。
3. 增加授权失败审计日志与告警，便于追踪越权尝试。
