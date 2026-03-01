<script setup lang="ts">
import { cn } from '@/lib/utils'

type Variant = 'zinc' | 'blue' | 'green' | 'amber' | 'red'

const props = defineProps<{ label: string; variant?: Variant }>()

const classes: Record<Variant, string> = {
  zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
}
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
      classes[props.variant ?? 'zinc'],
    )"
  >
    {{ props.label }}
  </span>
</template>
