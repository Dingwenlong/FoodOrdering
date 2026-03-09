<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ title: string; subtitle?: string; class?: string }>()
</script>

<template>
  <div :class="cn('flex items-start justify-between gap-4', props.class)">
    <div class="min-w-0">
      <div class="text-lg font-semibold tracking-tight">
        {{ title }}
      </div>
      <div
        v-if="subtitle"
        class="mt-1 text-sm text-muted-foreground"
      >
        {{ subtitle }}
      </div>
    </div>
    <div class="shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
