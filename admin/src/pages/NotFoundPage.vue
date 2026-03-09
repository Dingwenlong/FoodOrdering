<script setup lang="ts">
import Card from '@/components/Card.vue'
</script>

<template>
  <div class="mx-auto max-w-xl py-10">
    <Card class="p-6">
      <div class="text-lg font-semibold text-zinc-900">
        页面不存在
      </div>
      <div class="mt-2 text-sm text-zinc-600">
        你访问的页面未找到。
      </div>
      <router-link
        to="/orders"
        class="mt-4 inline-flex h-9 items-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
      >
        返回订单管理
      </router-link>
    </Card>
  </div>
</template>
