<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card bg-primary-50 border border-primary-100">
        <h3 class="text-lg font-semibold text-primary-800">Xin chào, {{ authStore.user?.username }}</h3>
        <p class="text-gray-600 mt-2">Vai trò: {{ authStore.user?.role }}</p>
      </div>

      <div v-if="authStore.isAdmin || authStore.isTeacher" class="card col-span-2">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Lối tắt</h3>
        <div class="flex space-x-4">
          <router-link to="/timetable" class="btn-primary inline-flex items-center">
             Xem thời khóa biểu
          </router-link>
          <router-link to="/leave" class="btn-secondary inline-flex items-center">
             Quản lý đơn xin nghỉ
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>
