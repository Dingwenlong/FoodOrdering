# 桌台管理UI优化计划

## 目标
将桌台管理页面UI改为参考菜品管理风格，并修复下拉筛选问题。

## 现状对比

### 菜品管理UI特点
1. **头部区域**：标题 + 筛选按钮 + 新增按钮
2. **搜索框**：独立一行，带搜索图标
3. **表格样式**：使用 `glass-table` 类，玻璃态效果
4. **弹窗**：使用 `GlassModal` 组件，统一风格
5. **按钮样式**：使用 `glass-btn` 和 `glass-btn-secondary` 类
6. **表单样式**：使用 `glass-input`、`glass-select` 类
7. **状态显示**：使用 `glass-badge` 标签

### 桌台管理需要修改的地方
1. **整体布局**：改为 space-y-6 间距
2. **头部**：移除 PageHeader，改用菜品管理的标题样式
3. **搜索区域**：简化，只保留状态筛选（移除区域筛选）
4. **表格样式**：改为 glass-table 风格
5. **弹窗**：改为使用 GlassModal 组件
6. **按钮样式**：统一改为 glass-btn 风格
7. **删除确认**：简化，使用 window.confirm 替代自定义弹窗

## 具体修改步骤

### 1. 修改导入部分
- 添加 GlassModal 导入
- 调整图标导入

### 2. 修改模板结构
- 头部改为菜品管理风格（标题 + 筛选按钮 + 新增按钮）
- 搜索框独立一行，只保留搜索和状态筛选
- 表格改为 glass-table
- 编辑弹窗改为 GlassModal
- 删除确认改为 window.confirm

### 3. 修改脚本部分
- 移除 areaFilter 相关代码
- 移除 areaOptions 计算属性
- 移除 showDeleteConfirm 和 deletingTable
- 简化 handleDelete 方法
- 添加 saving 状态

### 4. 修复下拉选项bug
- 确保 Select 组件正确传递 options
- 检查 statusOptions 格式

## 文件变更
- `admin/src/pages/TablesPage.vue` - 完全重写UI部分

## 验收标准
- [ ] 整体UI风格与菜品管理一致
- [ ] 只保留状态筛选，移除区域筛选
- [ ] 下拉筛选正常工作
- [ ] 弹窗使用 GlassModal 组件
- [ ] 表格使用 glass-table 样式
- [ ] 编译通过无错误
