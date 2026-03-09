<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Table, TableStatus } from '@/types'
import { api } from '@/lib/api'
import Card from '../components/Card.vue'
import GlassModal from '../components/GlassModal.vue'
import { Search, Plus, Edit2, Trash2, Filter, QrCode } from 'lucide-vue-next'

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const tables = ref<Table[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const keyword = ref('')
const statusFilter = ref<TableStatus | ''>('')

const showModal = ref(false)
const isEdit = ref(false)
const form = ref({
  tableId: '',
  tableNo: '',
  capacity: 4,
  location: '',
  area: '',
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'IDLE', label: '空闲' },
  { value: 'OCCUPIED', label: '占用' },
  { value: 'RESERVED', label: '预订' },
  { value: 'MAINTENANCE', label: '维护中' },
]

const filteredTables = computed(() => {
  let result = tables.value
  
  // 关键词筛选
  const q = keyword.value.trim().toLowerCase()
  if (q) {
    result = result.filter(t => 
      t.tableNo.toLowerCase().includes(q) || 
      (t.location && t.location.toLowerCase().includes(q))
    )
  }
  
  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(t => t.status === statusFilter.value)
  }
  
  return result
})

const pagedTables = computed(() => {
  const start = (page.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTables.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredTables.value.length / pageSize.value))

function getStatusLabel(status: TableStatus): string {
  const map: Record<TableStatus, string> = {
    IDLE: '空闲',
    OCCUPIED: '占用',
    RESERVED: '预订',
    MAINTENANCE: '维护中',
  }
  return map[status] || status
}

function getStatusClass(status: TableStatus): string {
  const map: Record<TableStatus, string> = {
    IDLE: 'bg-green-500/20 text-green-200 border-green-500/30',
    OCCUPIED: 'bg-red-500/20 text-red-200 border-red-500/30',
    RESERVED: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
    MAINTENANCE: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
  }
  return map[status] || ''
}

function resetForm() {
  form.value = {
    tableId: '',
    tableNo: '',
    capacity: 4,
    location: '',
    area: '',
  }
}

async function loadData() {
  loading.value = true
  errorMsg.value = null
  try {
    const result = await api.listTablesPaged({
      page: 1,
      pageSize: 1000,
    })
    tables.value = result.list
    total.value = result.total
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载桌码失败'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
}

function handleReset() {
  keyword.value = ''
  statusFilter.value = ''
  page.value = 1
}

function openAdd() {
  isEdit.value = false
  resetForm()
  showModal.value = true
}

function openEdit(table: Table) {
  isEdit.value = true
  form.value = {
    tableId: table.id,
    tableNo: table.tableNo,
    capacity: table.capacity,
    location: table.location || '',
    area: table.area || '',
  }
  showModal.value = true
}

async function saveTable() {
  if (!form.value.tableNo.trim()) {
    errorMsg.value = '桌台编号不能为空'
    return
  }
  if (!Number.isFinite(form.value.capacity) || form.value.capacity <= 0) {
    errorMsg.value = '容纳人数必须大于0'
    return
  }

  saving.value = true
  errorMsg.value = null
  try {
    const payload = {
      tableNo: form.value.tableNo.trim(),
      capacity: Number(form.value.capacity),
      location: form.value.location.trim() || undefined,
      area: form.value.area.trim() || undefined,
    }
    if (isEdit.value) {
      await api.updateTable({ tableId: form.value.tableId, ...payload })
    } else {
      await api.createTable(payload)
    }
    showModal.value = false
    resetForm()
    await loadData()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '保存桌码失败'
  } finally {
    saving.value = false
  }
}

async function handleDelete(tableId: string) {
  if (!window.confirm('确认删除该桌台？')) return
  deletingId.value = tableId
  errorMsg.value = null
  try {
    await api.deleteTable(tableId)
    await loadData()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '删除桌台失败'
  } finally {
    deletingId.value = null
  }
}

async function handleStatusChange(table: Table, newStatus: TableStatus) {
  try {
    await api.updateTableStatus({ tableId: table.id, status: newStatus })
    await loadData()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '状态更新失败'
  }
}

function handleDownloadQR(table: Table) {
  errorMsg.value = `桌台 ${table.tableNo} 的二维码下载功能开发中`
}

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold text-white tracking-tight">
        桌台管理
      </h1>
      <div class="flex gap-3">
        <button
          class="glass-btn-secondary flex items-center gap-2"
          :disabled="loading"
          @click="loadData"
        >
          <Filter class="w-4 h-4" /> 刷新
        </button>
        <button
          class="glass-btn flex items-center gap-2"
          @click="openAdd"
        >
          <Plus class="w-5 h-5" /> 新增桌台
        </button>
      </div>
    </div>

    <div
      v-if="errorMsg"
      class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
    >
      {{ errorMsg }}
    </div>

    <!-- Search -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
        <input 
          v-model.trim="keyword"
          type="text" 
          placeholder="搜索桌台编号..." 
          class="glass-input pl-10"
          @keyup.enter="handleSearch"
        >
      </div>
      <select
        v-model="statusFilter"
        class="glass-select w-[140px]"
        @change="handleSearch"
      >
        <option
          v-for="opt in statusOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <button
        class="glass-btn-secondary text-sm"
        @click="handleReset"
      >
        重置
      </button>
    </div>

    <!-- Table -->
    <Card
      no-padding
      class="overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="glass-table">
          <thead>
            <tr>
              <th>桌台编号</th>
              <th>容纳人数</th>
              <th>状态</th>
              <th>位置</th>
              <th>创建时间</th>
              <th class="text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td
                colspan="6"
                class="py-8 text-center text-white/40"
              >
                加载中...
              </td>
            </tr>
            <tr v-else-if="pagedTables.length === 0">
              <td
                colspan="6"
                class="py-8 text-center text-white/40"
              >
                暂无桌台
              </td>
            </tr>
            <tr
              v-for="table in pagedTables"
              :key="table.id"
              class="group"
            >
              <td class="font-bold text-white">
                {{ table.tableNo }}
              </td>
              <td class="text-white/70">
                {{ table.capacity }} 人
              </td>
              <td>
                <select
                  :value="table.status"
                  class="glass-select text-xs py-1 px-2"
                  @change="handleStatusChange(table, ($event.target as HTMLSelectElement).value as TableStatus)"
                >
                  <option
                    v-for="opt in statusOptions.filter(o => o.value)"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </td>
              <td class="text-white/70">
                {{ table.location || '-' }}
              </td>
              <td class="text-white/50 text-xs">
                {{ new Date(table.createdAt).toLocaleString() }}
              </td>
              <td class="text-right space-x-2">
                <button
                  class="p-2 hover:bg-white/10 rounded-lg text-purple-400 transition-colors"
                  title="下载二维码"
                  @click="handleDownloadQR(table)"
                >
                  <QrCode class="w-4 h-4" />
                </button>
                <button
                  class="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors"
                  title="编辑"
                  @click="openEdit(table)"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  class="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors disabled:opacity-40"
                  title="删除"
                  :disabled="deletingId === table.id"
                  @click="handleDelete(table.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="border-t border-white/10 px-4 py-3 flex items-center justify-between"
      >
        <div class="text-sm text-white/50">
          共 {{ filteredTables.length }} 条，第 {{ page }} / {{ totalPages }} 页
        </div>
        <div class="flex items-center gap-1">
          <button
            class="glass-btn-secondary text-sm py-1 px-2"
            :disabled="page <= 1"
            @click="goToPage(page - 1)"
          >
            上一页
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="text-sm py-1 px-3 rounded transition-colors"
            :class="p === page ? 'bg-cyan-500/30 text-cyan-300' : 'text-white/60 hover:bg-white/10'"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>
          <button
            class="glass-btn-secondary text-sm py-1 px-2"
            :disabled="page >= totalPages"
            @click="goToPage(page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </Card>

    <!-- Edit Modal -->
    <GlassModal
      v-model="showModal"
      :title="isEdit ? '编辑桌台' : '新增桌台'"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">桌台编号</label>
          <input
            v-model="form.tableNo"
            type="text"
            class="glass-input"
            placeholder="如：A01"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">容纳人数</label>
          <input
            v-model.number="form.capacity"
            type="number"
            min="1"
            class="glass-input"
            placeholder="请输入容纳人数"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">位置描述</label>
          <input
            v-model="form.location"
            type="text"
            class="glass-input"
            placeholder="如：一楼大厅"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">所属区域</label>
          <input
            v-model="form.area"
            type="text"
            class="glass-input"
            placeholder="如：大厅/包间"
          >
        </div>
      </div>
      <template #footer>
        <button
          class="glass-btn-secondary"
          :disabled="saving"
          @click="showModal = false"
        >
          取消
        </button>
        <button
          class="glass-btn"
          :disabled="saving"
          @click="saveTable"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </template>
    </GlassModal>
  </div>
</template>
