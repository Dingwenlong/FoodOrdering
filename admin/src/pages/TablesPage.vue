<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import QRCode from 'qrcode'
import PageHeader from '@/components/PageHeader.vue'
import StatusPill from '@/components/StatusPill.vue'
import { api } from '@/lib/api'
import type { PageResult, Table, TableStatus } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(10)
const result = ref<PageResult<Table>>({ list: [], total: 0, page: 1, pageSize: 10 })
const filters = reactive<{ keyword: string; status: '' | TableStatus; area: string }>({ keyword: '', status: '', area: '' })
const editing = ref<Table | null>(null)
const form = reactive({ tableNo: '', capacity: 4, location: '', area: '' })

const totalPages = computed(() => Math.max(1, Math.ceil(result.value.total / pageSize.value)))
const areas = computed(() => Array.from(new Set(result.value.list.map((t) => t.area).filter(Boolean))) as string[])
const statuses: Array<{ label: string; value: '' | TableStatus }> = [
  { label: '全部状态', value: '' },
  { label: '空闲', value: 'IDLE' },
  { label: '占用', value: 'OCCUPIED' },
  { label: '预订', value: 'RESERVED' },
  { label: '维护', value: 'MAINTENANCE' },
]

async function loadTables(resetPage = false) {
  if (resetPage) page.value = 1
  loading.value = true
  error.value = ''
  try {
    result.value = await api.listTablesPaged({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      area: filters.area || undefined,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '桌台加载失败'
  } finally {
    loading.value = false
  }
}

function startCreate() {
  editing.value = null
  Object.assign(form, { tableNo: '', capacity: 4, location: '', area: '' })
}

function startEdit(table: Table) {
  editing.value = table
  Object.assign(form, {
    tableNo: table.tableNo,
    capacity: table.capacity,
    location: table.location ?? '',
    area: table.area ?? '',
  })
}

async function saveTable() {
  if (!form.tableNo.trim() || form.capacity <= 0) {
    error.value = '桌台编号不能为空，容纳人数必须大于 0'
    return
  }
  saving.value = true
  error.value = ''
  try {
    if (editing.value) {
      await api.updateTable({ tableId: editing.value.id, ...form })
    } else {
      await api.createTable({ ...form })
    }
    startCreate()
    await loadTables()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '桌台保存失败'
  } finally {
    saving.value = false
  }
}

async function changeStatus(table: Table, status: TableStatus) {
  await api.updateTableStatus({ tableId: table.id, status })
  await loadTables()
}

async function deleteTable(table: Table) {
  if (!window.confirm(`确认删除 ${table.tableNo}？`)) return
  await api.deleteTable(table.id)
  await loadTables()
}

async function downloadQr(table: Table) {
  const qr = await api.getTableQrPayload(table.id)
  const dataUrl = await QRCode.toDataURL(qr.payload, { width: 320, margin: 2 })
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${qr.tableNo}-桌码.png`
  link.click()
}

function changePage(delta: number) {
  const next = Math.min(totalPages.value, Math.max(1, page.value + delta))
  if (next !== page.value) {
    page.value = next
    void loadTables()
  }
}

onMounted(loadTables)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="桌台管理" description="维护桌台区域、状态和小程序扫码桌码。" />

    <section class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div class="grid gap-3 md:grid-cols-[1.3fr_150px_150px_auto]">
        <input v-model="filters.keyword" class="input" placeholder="搜索桌号、位置" @keyup.enter="loadTables(true)">
        <select v-model="filters.status" class="input">
          <option v-for="item in statuses" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <input v-model="filters.area" class="input" list="area-options" placeholder="区域">
        <datalist id="area-options">
          <option v-for="area in areas" :key="area" :value="area" />
        </datalist>
        <button class="btn-primary" @click="loadTables(true)">筛选</button>
      </div>
      <p v-if="error" class="mt-3 text-sm text-rose-300">{{ error }}</p>
    </section>

    <section class="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div class="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
        <table class="w-full text-sm">
          <thead class="bg-white/[0.04] text-left text-white/50">
            <tr>
              <th class="px-4 py-3">桌台</th>
              <th class="px-4 py-3">区域</th>
              <th class="px-4 py-3">人数</th>
              <th class="px-4 py-3">状态</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="table in result.list" :key="table.id" class="border-t border-white/5 hover:bg-white/[0.03]">
              <td class="px-4 py-3">
                <div class="font-medium">{{ table.tableNo }}</div>
                <div class="text-xs text-white/40">{{ table.location || '-' }}</div>
              </td>
              <td class="px-4 py-3">{{ table.area || '-' }}</td>
              <td class="px-4 py-3">{{ table.capacity }}</td>
              <td class="px-4 py-3"><StatusPill :status="table.status" /></td>
              <td class="px-4 py-3 text-right">
                <button class="btn-ghost mr-2" @click="downloadQr(table)">二维码</button>
                <button class="btn-ghost mr-2" @click="startEdit(table)">编辑</button>
                <button class="btn-ghost" @click="deleteTable(table)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-white/50">
          <span>共 {{ result.total }} 条，第 {{ page }} / {{ totalPages }} 页</span>
          <div class="flex gap-2">
            <button class="btn-ghost" :disabled="page <= 1" @click="changePage(-1)">上一页</button>
            <button class="btn-ghost" :disabled="page >= totalPages" @click="changePage(1)">下一页</button>
          </div>
        </div>
      </div>

      <aside class="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">{{ editing ? '编辑桌台' : '新增桌台' }}</h2>
          <button class="btn-ghost" @click="startCreate">清空</button>
        </div>
        <form class="space-y-4" @submit.prevent="saveTable">
          <input v-model.trim="form.tableNo" class="input" placeholder="桌台编号，如 A01">
          <input v-model.number="form.capacity" class="input" type="number" min="1" placeholder="容纳人数">
          <input v-model.trim="form.area" class="input" placeholder="区域，如 一楼大厅">
          <input v-model.trim="form.location" class="input" placeholder="位置描述">
          <button class="btn-primary w-full" :disabled="saving" type="submit">{{ saving ? '保存中...' : '保存' }}</button>
        </form>
        <div v-if="editing" class="mt-5 grid grid-cols-2 gap-2">
          <button class="btn-ghost" @click="changeStatus(editing, 'IDLE')">设为空闲</button>
          <button class="btn-ghost" @click="changeStatus(editing, 'OCCUPIED')">设为占用</button>
          <button class="btn-ghost" @click="changeStatus(editing, 'RESERVED')">设为预订</button>
          <button class="btn-ghost" @click="changeStatus(editing, 'MAINTENANCE')">设为维护</button>
        </div>
      </aside>
    </section>
  </div>
</template>
