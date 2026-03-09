<script setup lang="ts">
defineProps<{
  title?: string
  noPadding?: boolean
}>()
</script>

<template>
  <div class="glass-card flex flex-col h-full overflow-hidden">
    <div
      v-if="title"
      class="px-6 py-4 border-b border-white/5 flex items-center justify-between"
    >
      <h3 class="text-lg font-semibold text-white/90 tracking-wide">
        {{ title }}
      </h3>
      <slot name="action" />
    </div>
    
    <div :class="{'p-6': !noPadding, 'flex-1': true}">
      <slot />
    </div>
  </div>
</template>
