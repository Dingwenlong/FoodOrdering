<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const items = computed(() => [
  { label: '账号', value: auth.user?.username ?? '-' },
  { label: '姓名', value: auth.user?.displayName ?? '-' },
  { label: '角色', value: auth.user?.roleName ?? '-' },
])

onMounted(async () => {
  await auth.ensureProfile()
})
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="个人中心" subtitle="查看当前登录管理员信息" />

    <Card class="p-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div v-for="it in items" :key="it.label" class="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <div class="text-xs text-zinc-500">{{ it.label }}</div>
          <div class="mt-1 text-sm font-semibold text-zinc-900">{{ it.value }}</div>
        </div>
      </div>
      <div class="mt-4 text-sm text-zinc-600">
        后续可在此扩展：修改密码、操作日志、店员账号管理等。
      </div>
    </Card>
  </div>
</template>
