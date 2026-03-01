<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { cn } from '@/lib/utils'

type Side = 'left' | 'right'

const props = withDefaults(
  defineProps<{
    open: boolean
    side?: Side
    class?: string
  }>(),
  { side: 'left' },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const panelClass = computed(() => {
  const base =
    'fixed inset-y-0 z-50 w-80 max-w-[90vw] bg-background shadow-lg ring-1 ring-border focus:outline-none'
  const side = props.side === 'right' ? 'right-0' : 'left-0'
  return cn(base, side, props.class)
})

function close() {
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="props.open" class="fixed inset-0 z-40" @keydown.esc="close">
        <button
          type="button"
          aria-label="Close"
          class="absolute inset-0 bg-black/40"
          @click="close"
        />
        <Transition :name="props.side === 'right' ? 'slide-in-right' : 'slide-in-left'">
          <div v-if="props.open" :class="panelClass" role="dialog" aria-modal="true">
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-in-left-enter-active,
.slide-in-left-leave-active,
.slide-in-right-enter-active,
.slide-in-right-leave-active {
  transition: transform 0.2s ease;
}

.slide-in-left-enter-from,
.slide-in-left-leave-to {
  transform: translateX(-100%);
}

.slide-in-right-enter-from,
.slide-in-right-leave-to {
  transform: translateX(100%);
}
</style>
