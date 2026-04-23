<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusPill from '@/components/StatusPill.vue'
import { api } from '@/lib/api'
import type { AuditLog, PageResult } from '@/types'

const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(15)
const filters = reactive<{ keyword: string; result: '' | AuditLog['result'] }>({ keyword: '', result: '' })
const result = ref<PageResult<AuditLog>>({ list: [], total: 0, page: 1, pageSize: 15 })
const totalPages = computed(() => Math.max(1, Math.ceil(result.value.total / pageSize.value)))

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

async function load(resetPage = false) {
  if (resetPage) page.value = 1
  loading.value = true
  error.value = ''
  try {
    result.value = await api.listAuditLogs({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword || undefined,
      result: filters.result || undefined,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '审计日志加载失败'
  } finally {
    loading.value = false
  }
}

function changePage(delta: number) {
  const next = Math.min(totalPages.value, Math.max(1, page.value + delta))
  if (next !== page.value) {
    page.value = next
    void load()
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="操作日志" description="追踪后台写操作、操作者、资源和执行结果。" />
    <section class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div class="grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <input v-model="filters.keyword" class="input" placeholder="管理员、路径、资源" @keyup.enter="load(true)">
        <select v-model="filters.result" class="input"><option value="">全部结果</option><option value="SUCCESS">成功</option><option value="FAILED">失败</option></select>
        <button class="btn-primary" @click="load(true)">筛选</button>
      </div>
      <p v-if="error" class="mt-3 text-sm text-rose-300">{{ error }}</p>
    </section>
    <div class="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
      <table class="w-full text-sm">
        <thead class="bg-white/[0.04] text-left text-white/50">
          <tr><th class="px-4 py-3">时间</th><th class="px-4 py-3">管理员</th><th class="px-4 py-3">动作</th><th class="px-4 py-3">资源</th><th class="px-4 py-3">路径</th><th class="px-4 py-3">结果</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in result.list" :key="log.id" class="border-t border-white/5 hover:bg-white/[0.03]">
            <td class="px-4 py-3 text-white/60">{{ formatTime(log.createdAt) }}</td>
            <td class="px-4 py-3">{{ log.adminName || log.adminId || '-' }}</td>
            <td class="px-4 py-3">{{ log.action }}</td>
            <td class="px-4 py-3">{{ log.resourceType || '-' }} <span class="text-white/35">{{ log.resourceId || '' }}</span></td>
            <td class="px-4 py-3 text-white/50">{{ log.requestPath }}</td>
            <td class="px-4 py-3"><StatusPill :status="log.result" /></td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-white/50">
        <span>共 {{ result.total }} 条，第 {{ page }} / {{ totalPages }} 页</span>
        <div class="flex gap-2"><button class="btn-ghost" :disabled="page <= 1" @click="changePage(-1)">上一页</button><button class="btn-ghost" :disabled="page >= totalPages" @click="changePage(1)">下一页</button></div>
      </div>
    </div>
  </div>
</template>
