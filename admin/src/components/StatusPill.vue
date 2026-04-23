<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

type Variant = 'zinc' | 'blue' | 'green' | 'amber' | 'red'

const props = defineProps<{ label?: string; status?: string; variant?: Variant }>()

const classes: Record<Variant, string> = {
  zinc: 'bg-white/10 text-white/70 border-white/20',
  blue: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  green: 'bg-green-500/20 text-green-200 border-green-500/30',
  amber: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  red: 'bg-red-500/20 text-red-200 border-red-500/30',
}

const statusMeta: Record<string, { label: string; variant: Variant }> = {
  PENDING_PAY: { label: '待支付', variant: 'amber' },
  PAID: { label: '已支付', variant: 'blue' },
  COOKING: { label: '制作中', variant: 'amber' },
  DONE: { label: '已完成', variant: 'green' },
  CANCELED: { label: '已取消', variant: 'red' },
  IDLE: { label: '空闲', variant: 'green' },
  OCCUPIED: { label: '占用', variant: 'amber' },
  RESERVED: { label: '预订', variant: 'blue' },
  MAINTENANCE: { label: '维护', variant: 'red' },
  ACTIVE: { label: '启用', variant: 'green' },
  INACTIVE: { label: '停用', variant: 'zinc' },
  SOLD_OUT: { label: '售罄', variant: 'red' },
  OPEN: { label: '打开', variant: 'amber' },
  CLOSED: { label: '关闭', variant: 'zinc' },
  SUCCESS: { label: '成功', variant: 'green' },
  FAILED: { label: '失败', variant: 'red' },
}

const meta = computed(() => {
  if (props.label) return { label: props.label, variant: props.variant ?? 'zinc' }
  const status = props.status ?? ''
  return statusMeta[status] ?? { label: status || '-', variant: props.variant ?? 'zinc' }
})
</script>

<template>
  <span
    :class="cn(
      'glass-badge',
      classes[props.variant ?? meta.variant],
    )"
  >
    {{ meta.label }}
  </span>
</template>
