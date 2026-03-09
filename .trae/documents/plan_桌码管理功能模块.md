# 桌码管理功能模块实施计划

## 一、项目现状分析

### 1.1 技术栈

* **后端**: Spring Boot 2.7.18 + MyBatis-Plus + MySQL + JWT认证

* **前端**: Vue 3 + TypeScript + Vite + TailwindCSS + Pinia + Vue Router

* **数据库**: 已存在 `tables` 表（桌台表）

### 1.2 现有数据结构

数据库中已存在 `tables` 表，结构如下：

```sql
CREATE TABLE IF NOT EXISTS tables (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_no VARCHAR(20) UNIQUE NOT NULL COMMENT '桌台编号',
    capacity INT NOT NULL COMMENT '容纳人数',
    status TINYINT DEFAULT 0 COMMENT '状态：0空闲，1占用，2预订',
    location VARCHAR(100) COMMENT '位置描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tables_status (status)
) COMMENT='桌台表';
```

### 1.3 现有代码分析

* **后端实体**: `com.foodordering.entity.Table` 已存在

* **后端Mapper**: `com.foodordering.mapper.TableMapper` 已存在

* **前端页面**: `TablesPage.vue` 已存在但功能简单（仅展示订单聚合数据）

* **API接口**: 当前桌台相关API尚未实现完整的CRUD功能

***

## 二、功能需求

### 2.1 核心功能

1. **桌码CRUD操作**: 创建、查询、编辑、删除桌码
2. **批量导入导出**: 支持Excel格式的批量导入和导出
3. **搜索筛选**: 按区域、状态等条件筛选
4. **分页展示**: 数据分页显示
5. **状态管理**: 空闲、占用、维护中等状态实时更新

### 2.2 扩展功能

1. **数据校验**: 输入数据合法性校验
2. **权限控制**: 基于注解的权限控制
3. **操作日志**: 关键操作记录日志

***

## 三、实施步骤

### 阶段一：后端API开发

#### 步骤1：扩展数据库表结构（如需）

**文件**: `backend/src/main/resources/schema.sql`

当前表结构基本满足需求，但建议增加 `area`（区域）字段以支持按区域筛选：

```sql
-- 如需支持区域筛选，可添加字段（可选）
ALTER TABLE tables ADD COLUMN area VARCHAR(50) COMMENT '所属区域' AFTER location;
```

#### 步骤2：更新实体类

**文件**: `backend/src/main/java/com/foodordering/entity/Table.java`

如添加区域字段，需同步更新实体类。

#### 步骤3：添加DTO和视图对象

**文件**: `backend/src/main/java/com/foodordering/dto/admin/AdminDtos.java`

添加以下记录类：

* `TableView` - 桌码列表视图

* `TableDetailView` - 桌码详情视图

* `TableUpsertRequest` - 创建/更新桌码请求

* `TableStatusUpdateRequest` - 更新桌码状态请求

* `TableImportRequest` - 批量导入请求

#### 步骤4：实现Service层方法

**文件**: `backend/src/main/java/com/foodordering/service/admin/AdminService.java`

添加以下方法：

* `listTablesPaged()` - 分页查询桌码列表

* `getTableDetail()` - 获取桌码详情

* `createTable()` - 创建桌码

* `updateTable()` - 更新桌码

* `deleteTable()` - 删除桌码

* `updateTableStatus()` - 更新桌码状态

* `importTables()` - 批量导入桌码

* `exportTables()` - 导出桌码数据

#### 步骤5：实现Controller层接口

**文件**: `backend/src/main/java/com/foodordering/controller/admin/AdminController.java`

添加以下API端点：

* `GET /v1/admin/tables` - 查询桌码列表（支持分页、筛选）

* `GET /v1/admin/tables/{tableId}` - 获取桌码详情

* `POST /v1/admin/tables` - 创建桌码

* `PUT /v1/admin/tables/{tableId}` - 更新桌码

* `DELETE /v1/admin/tables/{tableId}` - 删除桌码

* `PATCH /v1/admin/tables/{tableId}/status` - 更新桌码状态

* `POST /v1/admin/tables/import` - 批量导入桌码

* `GET /v1/admin/tables/export` - 导出桌码数据

#### 步骤6：添加权限常量

**文件**: `backend/src/main/java/com/foodordering/auth/AdminPermission.java`

添加桌码管理相关权限：

* `TABLE_MANAGE` - 桌码管理权限

***

### 阶段二：前端页面开发

#### 步骤1：更新类型定义

**文件**: `admin/src/types.ts`

添加桌码相关类型：

```typescript
export type TableStatus = 'IDLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'

export type Table = {
  id: ID
  tableNo: string
  capacity: number
  status: TableStatus
  location?: string
  area?: string
  createdAt: string
  updatedAt: string
}

export type TableDetail = Table & {
  // 扩展详情字段
}
```

#### 步骤2：实现API调用方法

**文件**: `admin/src/lib/api.ts`

在 `api` 对象中添加桌码相关方法：

* `listTablesPaged()` - 分页查询

* `getTableDetail()` - 获取详情

* `createTable()` - 创建桌码

* `updateTable()` - 更新桌码

* `deleteTable()` - 删除桌码

* `updateTableStatus()` - 更新状态

* `importTables()` - 批量导入

* `exportTables()` - 导出数据

#### 步骤3：重构TablesPage.vue

**文件**: `admin/src/pages/TablesPage.vue`

实现完整功能：

1. 桌码列表展示（表格形式）
2. 分页组件
3. 搜索筛选栏（按编号、区域、状态筛选）
4. 新增/编辑弹窗
5. 删除确认弹窗
6. 批量导入/导出按钮
7. 状态切换功能

#### 步骤4：添加侧边栏菜单

**文件**: `admin/src/components/AppSidebar.vue`

确认桌台管理菜单已存在（当前已存在）。

***

### 阶段三：冒烟测试

#### 测试清单

1. **后端测试**:

   * [ ] 编译通过无错误

   * [ ] 启动成功无异常

   * [ ] API文档可正常访问 (Swagger UI)

   * [ ] 各API端点响应正常

2. **前端测试**:

   * [ ] 编译通过无错误 (`npm run check`)

   * [ ] &#x20;lint检查通过 (`npm run lint`)

   * [ ] 页面正常加载

   * [ ] 各功能按钮可点击

   * [ ] 弹窗正常显示/关闭

3. **集成测试**:

   * [ ] 前后端联调正常

   * [ ] 数据展示正确

   * [ ] CRUD操作正常

***

## 四、详细代码实现参考

### 4.1 后端DTO定义

```java
// AdminDtos.java 中添加

@Schema(description = "桌码视图")
public record TableView(
        @Schema(description = "桌码ID") String id,
        @Schema(description = "桌台编号") String tableNo,
        @Schema(description = "容纳人数") int capacity,
        @Schema(description = "状态：IDLE/OCCUPIED/RESERVED/MAINTENANCE") String status,
        @Schema(description = "位置描述") String location,
        @Schema(description = "所属区域") String area,
        @Schema(description = "创建时间") String createdAt,
        @Schema(description = "更新时间") String updatedAt
) {}

@Schema(description = "桌码创建/更新请求")
public record TableUpsertRequest(
        @Schema(description = "桌台编号") String tableNo,
        @Schema(description = "容纳人数") Integer capacity,
        @Schema(description = "位置描述") String location,
        @Schema(description = "所属区域") String area
) {}

@Schema(description = "桌码状态更新请求")
public record TableStatusUpdateRequest(
        @Schema(description = "状态：IDLE/OCCUPIED/RESERVED/MAINTENANCE") String status
) {}
```

### 4.2 后端Controller接口

```java
// AdminController.java 中添加

@Operation(summary = "查询桌码列表", description = "支持分页、关键词搜索和状态过滤")
@GetMapping("/tables")
public AdminDtos.PageResult<AdminDtos.TableView> tables(
        @RequestParam(value = "page", required = false) Integer page,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "keyword", required = false) String keyword,
        @RequestParam(value = "status", required = false) String status,
        @RequestParam(value = "area", required = false) String area) {
    return adminService.listTablesPaged(
        page == null ? 1 : page,
        pageSize == null ? 20 : pageSize,
        keyword, status, area
    );
}

@Operation(summary = "获取桌码详情")
@GetMapping("/tables/{tableId}")
public AdminDtos.TableView tableDetail(@PathVariable("tableId") String tableId) {
    return adminService.getTableDetail(tableId);
}

@Operation(summary = "创建桌码")
@PostMapping("/tables")
@AdminAuthorize(AdminPermission.TABLE_MANAGE)
public AdminDtos.TableView createTable(@RequestBody AdminDtos.TableUpsertRequest request) {
    return adminService.createTable(request);
}

@Operation(summary = "更新桌码")
@PutMapping("/tables/{tableId}")
@AdminAuthorize(AdminPermission.TABLE_MANAGE)
public AdminDtos.TableView updateTable(
        @PathVariable("tableId") String tableId,
        @RequestBody AdminDtos.TableUpsertRequest request) {
    return adminService.updateTable(tableId, request);
}

@Operation(summary = "删除桌码")
@DeleteMapping("/tables/{tableId}")
@AdminAuthorize(AdminPermission.TABLE_MANAGE)
public void deleteTable(@PathVariable("tableId") String tableId) {
    adminService.deleteTable(tableId);
}

@Operation(summary = "更新桌码状态")
@PatchMapping("/tables/{tableId}/status")
@AdminAuthorize(AdminPermission.TABLE_MANAGE)
public AdminDtos.TableView updateTableStatus(
        @PathVariable("tableId") String tableId,
        @RequestBody AdminDtos.TableStatusUpdateRequest request) {
    return adminService.updateTableStatus(tableId, request);
}
```

### 4.3 前端页面结构

```vue
<!-- TablesPage.vue 结构 -->
<template>
  <div class="space-y-4">
    <PageHeader title="桌码管理" subtitle="管理桌台信息、二维码及状态">
      <!-- 操作按钮：新增、导入、导出 -->
    </PageHeader>
    
    <!-- 筛选栏 -->
    <Card>
      <div class="flex items-center gap-4">
        <Input v-model="keyword" placeholder="搜索桌台编号" />
        <Select v-model="statusFilter" :options="statusOptions" />
        <Select v-model="areaFilter" :options="areaOptions" />
        <Button @click="loadData">查询</Button>
      </div>
    </Card>
    
    <!-- 数据表格 -->
    <Card>
      <table>
        <!-- 表头：编号、区域、座位数、状态、操作 -->
        <!-- 表格行 -->
      </table>
      <!-- 分页组件 -->
    </Card>
    
    <!-- 新增/编辑弹窗 -->
    <Modal v-model="showModal">
      <!-- 表单：编号、区域、座位数、位置 -->
    </Modal>
  </div>
</template>
```

***

## 五、文件变更清单

### 后端文件

| 文件路径                                                                           | 操作   | 说明        |
| ------------------------------------------------------------------------------ | ---- | --------- |
| `backend/src/main/java/com/foodordering/dto/admin/AdminDtos.java`              | 修改   | 添加桌码相关DTO |
| `backend/src/main/java/com/foodordering/service/admin/AdminService.java`       | 修改   | 添加桌码业务逻辑  |
| `backend/src/main/java/com/foodordering/controller/admin/AdminController.java` | 修改   | 添加桌码API接口 |
| `backend/src/main/java/com/foodordering/auth/AdminPermission.java`             | 修改   | 添加桌码权限常量  |
| `backend/src/main/java/com/foodordering/entity/Table.java`                     | 可选修改 | 如添加area字段 |

### 前端文件

| 文件路径                             | 操作   | 说明         |
| -------------------------------- | ---- | ---------- |
| `admin/src/types.ts`             | 修改   | 添加桌码类型定义   |
| `admin/src/lib/api.ts`           | 修改   | 添加桌码API调用  |
| `admin/src/pages/TablesPage.vue` | 重写   | 实现完整桌码管理功能 |
| `admin/src/mocks/api.ts`         | 可选修改 | 添加桌码Mock数据 |

***

## 六、风险与注意事项

1. **数据库兼容性**: 如修改表结构需考虑现有数据迁移
2. **权限控制**: 确保敏感操作需要管理员权限
3. **数据校验**: 桌台编号需唯一，座位数需为正整数
4. **状态流转**: 考虑状态流转的合理性（如占用中不能直接删除）

***

## 七、验收标准

* [ ] 桌码列表正常分页展示

* [ ] 可按编号、区域、状态筛选

* [ ] 新增桌码功能正常

* [ ] 编辑桌码功能正常

* [ ] 删除桌码功能正常

* [ ] 状态切换功能正常

* [ ] 批量导入功能正常

* [ ] 批量导出功能正常

* [ ] 页面样式符合系统UI规范

* [ ] 冒烟测试通过

