<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusPill from '@/components/StatusPill.vue'
import { api } from '@/lib/api'
import type { Feedback } from '@/types'

const loading = ref(false)
const errorMsg = ref<string | null>(null)
const list = ref<Feedback[]>([])

function statusVariant(s: Feedback['status']) {
  if (s === 'OPEN') return 'amber'
  if (s === 'IN_PROGRESS') return 'blue'
  return 'green'
}

function statusLabel(s: Feedback['status']) {
  if (s === 'OPEN') return '待处理'
  if (s === 'IN_PROGRESS') return '处理中'
  return '已解决'
}

async function load() {
  loading.value = true
  errorMsg.value = null
  try {
    list.value = await api.listFeedbacks()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载留言失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="留言建议管理" subtitle="查看用户留言并跟踪处理状态（当前为Mock展示）">
      <template #actions>
        <button
          type="button"
          class="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50"
          :disabled="loading"
          @click="load"
        >
          刷新
        </button>
      </template>
    </PageHeader>

    <div v-if="errorMsg" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ errorMsg }}
    </div>

    <Card class="divide-y divide-zinc-100 overflow-hidden">
      <div v-for="fb in list" :key="fb.id" class="p-4 hover:bg-zinc-50">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <div class="text-sm font-semibold text-zinc-900">{{ fb.nickname }}</div>
              <StatusPill :label="statusLabel(fb.status)" :variant="statusVariant(fb.status)" />
            </div>
            <div class="mt-2 text-sm text-zinc-700">{{ fb.content }}</div>
            <div class="mt-2 text-xs text-zinc-500">{{ new Date(fb.createdAt).toLocaleString() }}</div>
          </div>
          <button
            type="button"
            class="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 hover:bg-zinc-50"
            disabled
          >
            更新状态（占位）
          </button>
        </div>
      </div>
      <div v-if="!loading && list.length === 0" class="px-4 py-10 text-center text-zinc-500">暂无数据</div>
      <div v-if="loading" class="px-4 py-3 text-sm text-zinc-600">加载中...</div>
    </Card>
  </div>
</template>
