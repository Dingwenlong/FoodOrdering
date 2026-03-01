<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
defineOptions({ inheritAttrs: false })
</script>

<template>
  <select
    v-bind="$attrs"
    :class="
      cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ring-offset-background',
        props.class,
      )
    "
  >
    <slot />
  </select>
</template>

