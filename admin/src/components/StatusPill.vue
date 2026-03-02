<script setup lang="ts">
import { cn } from '@/lib/utils'

type Variant = 'zinc' | 'blue' | 'green' | 'amber' | 'red'

const props = defineProps<{ label: string; variant?: Variant }>()

const classes: Record<Variant, string> = {
  zinc: 'bg-white/10 text-white/70 border-white/20',
  blue: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  green: 'bg-green-500/20 text-green-200 border-green-500/30',
  amber: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  red: 'bg-red-500/20 text-red-200 border-red-500/30',
}
</script>

<template>
  <span
    :class="cn(
      'glass-badge',
      classes[props.variant ?? 'zinc'],
    )"
  >
    {{ props.label }}
  </span>
</template>
