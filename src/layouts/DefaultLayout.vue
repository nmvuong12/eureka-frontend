<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-md">
      <div class="p-6 border-b border-gray-200">
        <h1 class="text-2xl font-bold text-primary-600">Eureka Center</h1>
      </div>
      <nav class="p-4 space-y-2">
        <router-link to="/" class="block px-4 py-2 rounded-md hover:bg-primary-50 text-gray-700" active-class="bg-primary-100 text-primary-700 font-medium">
          Dashboard
        </router-link>
        <template v-if="authStore.isAdmin">
          <router-link to="/accounts" class="block px-4 py-2 rounded-md hover:bg-primary-50 text-gray-700" active-class="bg-primary-100 text-primary-700 font-medium">
            Quản lý Tài khoản
          </router-link>
        </template>
        <template v-if="authStore.isAdmin || !authStore.isTeacher">
          <router-link to="/teachers" class="block px-4 py-2 rounded-md hover:bg-primary-50 text-gray-700" active-class="bg-primary-100 text-primary-700 font-medium">
            Quản lý Giáo viên
          </router-link>
          <router-link to="/courses" class="block px-4 py-2 rounded-md hover:bg-primary-50 text-gray-700" active-class="bg-primary-100 text-primary-700 font-medium">
            Lớp học & Khóa học
          </router-link>
          <router-link to="/rooms" class="block px-4 py-2 rounded-md hover:bg-primary-50 text-gray-700" active-class="bg-primary-100 text-primary-700 font-medium">
            Phòng & Ca học
          </router-link>
        </template>
        <router-link to="/timetable" class="block px-4 py-2 rounded-md hover:bg-primary-50 text-gray-700" active-class="bg-primary-100 text-primary-700 font-medium">
          Thời khóa biểu
        </router-link>
        <router-link to="/leave" class="block px-4 py-2 rounded-md hover:bg-primary-50 text-gray-700" active-class="bg-primary-100 text-primary-700 font-medium">
          Đơn xin nghỉ
        </router-link>
      </nav>
      <div class="p-4 mt-auto border-t border-gray-200">
        <div class="text-sm text-gray-600 mb-2">Xin chào, {{ authStore.user?.username }}</div>
        <button @click="handleLogout" class="w-full btn-secondary text-sm">Đăng xuất</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
