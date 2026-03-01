# 管理端 UI 优化与重构 - 页面设计（Desktop-first）

## 0. 全局设计规范（适用于所有管理端页面）

### Layout
- 框架：左侧 Sidebar（固定宽度，可折叠）+ 顶部 Topbar（固定高度）+ 主内容区（可滚动）。
- 实现：Flexbox 为主（外层容器与左右结构），内容区内部列表采用 CSS Grid（指标卡片/表单分组）。
- 响应式：桌面优先；在 <1024px 时 Sidebar 自动折叠为 Sheet（抽屉），表格优先横向滚动并保留关键列。

### Meta Information（默认）
- title：{页面名} - 扫码点餐管理端
- description：用于门店订单、菜品与桌台管理的后台系统
- Open Graph：og:title/og:description 与 title/description 同步；og:type=website

### Global Styles（Tailwind + shadcn-ui tokens）
- 背景：`bg-background`；卡片：`bg-card`；分割线：`border-border`
- 文本：主文 `text-foreground`；次级 `text-muted-foreground`
- 强调色：`primary`（按钮/高亮）；危险：`destructive`；提示：`secondary`
- 圆角/阴影：统一使用 shadcn 的 `rounded-lg`、`shadow-sm`
- 字体层级：
  - H1 20/24（页面标题）
  - H2 16/20（区块标题）
  - Body 14/20（正文/表格）
  - Caption 12/16（辅助说明）
- 按钮：统一 variants（default/secondary/outline/ghost/destructive）；禁用态降低不透明度；loading 显示 Spinner。
- 表单：Input/Select/Textarea 统一 focus ring；错误提示放在控件下方（FormMessage）。
- 反馈：Toast（成功/失败），空态（图标+主文案+操作按钮），错误态（可重试）。

### 通用组件清单（shadcn-ui）
- 导航：Sidebar（自定义+Button）、Breadcrumb、DropdownMenu、Sheet
- 基础：Button、Input、Textarea、Select、Switch、Badge、Separator
- 容器：Card、Tabs
- 数据：Table、Pagination（自定义封装）、Skeleton
- 弹层：Dialog、AlertDialog、Popover、Tooltip
- 反馈：Toast/Sonner、EmptyState（自定义）

---

## 1) 登录页（/admin/login）

### Layout
- 居中单列布局：页面垂直水平居中，Card 承载表单。

### Page Structure
1. 顶部品牌区：Logo +「扫码点餐管理端」
2. 登录表单 Card
3. 页脚：版权/帮助链接（可选）

### Sections & Components
- 表单：Input（账号）、Input（密码）、Button（登录）
- 状态：
  - 校验错误：FormMessage
  - 登录失败：Toast + 可读错误文案
  - 登录中：Button loading

---

## 2) 控制台总览（/admin）

### Layout
- 内容区上方为标题与筛选（可选），下方指标卡片 Grid + 快捷入口 Card。

### Page Structure
1. PageHeader：标题、时间范围（可选）
2. 指标区：4~6 张 Stat Cards
3. 快捷入口：订单/菜品/桌台/设置

### Sections & Components
- Stat Cards：Card + 指标数字（强调）+ 辅助说明；Skeleton 作为加载态
- 快捷入口：Button（outline/secondary）成组展示

---

## 3) 订单管理页（/admin/orders）

### Layout
- 顶部工具栏 + 中部 Table + 底部分页；详情使用右侧 Sheet（信息密度高）。

### Page Structure
1. Toolbar：状态 Tabs、时间选择（可选）、关键词搜索、刷新
2. Table：订单列表（固定表头）
3. Pagination：页码、总数、每页数量
4. Order Detail Sheet：订单明细与操作按钮

### Sections & Components
- Toolbar：Tabs、Input（search）、Button（刷新）
- Table 列建议：下单时间、订单号、桌台、金额、状态、操作
- 操作：
  - 主要流转按钮：Button（primary）
  - 取消/作废：AlertDialog 二次确认 + destructive
- 反馈：成功/失败 Toast；操作后列表刷新或局部更新

---

## 4) 菜品与分类管理页（/admin/menu）

### Layout
- 左右两栏：左侧分类列表（窄），右侧菜品列表与编辑；新增/编辑使用 Dialog。

### Page Structure
1. 左栏：分类列表（可新增/编辑/排序入口）
2. 右栏：菜品 Toolbar + 菜品 Table
3. Dialog：分类编辑、菜品编辑

### Sections & Components
- 分类：List（自定义）+ Button（新增）+ DropdownMenu（编辑/禁用）
- 菜品表格：图片缩略图、名称、价格、状态、操作
- 菜品编辑 Dialog：
  - 基本信息表单（Input/Select/Textarea）
  - 图片上传入口（Button + 预览区域）
  - 上下架 Switch

---

## 5) 桌台/二维码管理页（/admin/tables）

### Layout
- 单列列表页：Toolbar + Table；二维码预览与下载使用 Dialog。

### Page Structure
1. Toolbar：搜索、新增桌台、批量下载
2. Table：桌台列表
3. Dialog：二维码预览/下载

### Sections & Components
- 新增/编辑桌台：Dialog + 表单（名称/编号/状态）
- 二维码：
  - 预览：Dialog 内展示二维码图
  - 下载：Button（下载 PNG/SVG 其一即可，取决于现有实现）

---

## 6) 系统设置页（/admin/settings）

### Layout
- 竖向分组表单：多个 Card 分区；敏感配置用 AlertDialog 二次确认。

### Page Structure
1. 门店信息 Card
2. 营业设置 Card
3. 集成配置入口 Card（打印/支付等）
4. 账号与权限入口 Card

### Sections & Components
- 门店信息：Input（门店名/电话）、Textarea（地址）+ 保存 Button
- 营业设置：Select/Time 输入（如已有）+ 保存
- 集成配置入口：Button 跳转或打开子面板（按现有信息架构对齐）
- 账号与权限入口：Button 跳转到账号管理（若现有路由），或在本页用 Table 展示（按现有实现取其一）

---

## 交互与一致性补充（全局）
- 列表页统一三态：Skeleton（加载）、EmptyState（无数据）、ErrorState（失败可重试）。
- 所有危险操作：必须 AlertDialog 确认；确认按钮使用 destructive。
- 表单提交：禁用重复提交；成功 Toast；失败 Toast + 字段级错误优先显示。
