<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-700">Hiển thị</span>
        <select
          :value="modelValue"
          @input="$emit('update:modelValue', Number(($event.target as HTMLSelectElement).value))"
          class="block w-full py-1.5 pl-3 pr-10 text-sm border-gray-300 rounded-md focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        >
          <option :value="15">15</option>
          <option :value="30">30</option>
          <option :value="50">50</option>
        </select>
        <span class="text-sm text-gray-700">bản ghi</span>
      </div>
      <div>
        <nav class="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-2 py-2 text-gray-400 rounded-l-md border border-gray-300 bg-white hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Previous</span>
            <ChevronLeftIcon class="w-5 h-5" aria-hidden="true" />
          </button>
          
          <template v-for="page in totalPages" :key="page">
            <button
              @click="goToPage(page)"
              :class="[
                page === currentPage
                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                'relative inline-flex items-center px-4 py-2 text-sm font-medium border focus:z-20'
              ]"
            >
              {{ page }}
            </button>
          </template>
          
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-2 py-2 text-gray-400 rounded-r-md border border-gray-300 bg-white hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Next</span>
            <ChevronRightIcon class="w-5 h-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
      <div class="text-sm text-gray-700">
        Tổng cộng <span class="font-medium">{{ total }}</span> bản ghi
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid';

const props = defineProps({
  total: { type: Number, required: true },
  currentPage: { type: Number, required: true },
  modelValue: { type: Number, required: true } // itemsPerPage
});

const emit = defineEmits(['update:modelValue', 'update:currentPage']);

const totalPages = computed(() => {
  return Math.ceil(props.total / props.modelValue) || 1;
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page);
  }
};
</script>
