<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-in-out duration-300 transform"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition ease-in-out duration-300 transform"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div v-if="isOpen" class="fixed inset-0 overflow-hidden z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>
        
        <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div :style="{ width: width }">
            <div class="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <!-- Header -->
              <div class="px-4 py-6 bg-gray-50 sm:px-6 flex items-center justify-between border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900">{{ title }}</h2>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500">
                  <span class="sr-only">Close panel</span>
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Content -->
              <div class="relative flex-1 py-6 px-4 sm:px-6">
                <slot></slot>
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer" class="flex-shrink-0 px-4 py-4 flex justify-end space-x-3 bg-gray-50 border-t border-gray-200">
                <slot name="footer"></slot>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps({
  isOpen: Boolean,
  title: String,
  width: {
    type: String,
    default: '50vw'
  }
});
defineEmits(['close']);
</script>
