<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { api } from '@/lib/api'
import type { Order } from '@/types'

type TableRow = {
  tableId: string
  tableName: string
  orderCount: number
  lastOrderAt: string
}

const loading = ref(false)
const errorMsg = ref<string | null>(null)
const keyword = ref('')
const rows = ref<TableRow[]>([])

const filtered = computed(() => {
  const q = keyword.value.trim()
  if (!q) return rows.value
  return rows.value.filter((r) => r.tableName.includes(q) || r.tableId.includes(q))
})

function buildRows(orders: Order[]): TableRow[] {
  const map = new Map<string, TableRow>()
  for (const o of orders) {
    const key = o.tableId
    const prev = map.get(key)
    if (!prev) {
      map.set(key, {
        tableId: o.tableId,
        tableName: o.tableName,
        orderCount: 1,
        lastOrderAt: o.createdAt,
      })
      continue
    }
    prev.orderCount += 1
    if (new Date(o.createdAt).getTime() > new Date(prev.lastOrderAt).getTime()) {
      prev.lastOrderAt = o.createdAt
      prev.tableName = o.tableName
    }
  }
  return Array.from(map.values()).sort((a, b) => b.orderCount - a.orderCount)
}

async function load() {
  loading.value = true
  errorMsg.value = null
  try {
    const orders = await api.listOrders()
    rows.value = buildRows(orders)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载桌台失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="桌台管理" subtitle="管理桌台与二维码下载（当前基于订单 Mock 聚合展示）">
      <template #actions>
        <div class="flex items-center gap-2">
          <Input v-model.trim="keyword" placeholder="搜索桌台" class="w-[220px]" />
          <Button variant="outline" :disabled="loading" @click="load">刷新</Button>
        </div>
      </template>
    </PageHeader>

    <div
      v-if="errorMsg"
      class="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {{ errorMsg }}
    </div>

    <Card class="overflow-hidden">
      <div class="overflow-auto">
        <table class="min-w-[860px] w-full text-left text-sm">
          <thead class="bg-muted/50 text-muted-foreground">
            <tr>
              <th class="px-4 py-3 font-medium">桌台</th>
              <th class="px-4 py-3 font-medium">桌台ID</th>
              <th class="px-4 py-3 font-medium">订单数</th>
              <th class="px-4 py-3 font-medium">最近下单</th>
              <th class="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="r in filtered" :key="r.tableId" class="hover:bg-muted/30">
              <td class="px-4 py-3 font-medium">{{ r.tableName }}</td>
              <td class="px-4 py-3 font-mono text-xs text-muted-foreground">{{ r.tableId }}</td>
              <td class="px-4 py-3">{{ r.orderCount }}</td>
              <td class="px-4 py-3 text-muted-foreground">{{ new Date(r.lastOrderAt).toLocaleString() }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>下载二维码（占位）</Button>
                  <Button variant="outline" size="sm" disabled>编辑（占位）</Button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && filtered.length === 0">
              <td colspan="5" class="px-4 py-10 text-center text-muted-foreground">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="loading" class="border-t border-border px-4 py-3 text-sm text-muted-foreground">加载中...</div>
    </Card>
  </div>
</template>

