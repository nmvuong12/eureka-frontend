<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Đăng nhập hệ thống
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Trung tâm Anh ngữ Eureka
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div class="mb-4">
            <label for="username" class="sr-only">Tên đăng nhập</label>
            <input id="username" v-model="form.username" name="username" type="text" required class="input-field" placeholder="Tên đăng nhập" />
          </div>
          <div>
            <label for="password" class="sr-only">Mật khẩu</label>
            <input id="password" v-model="form.password" name="password" type="password" required class="input-field" placeholder="Mật khẩu" />
          </div>
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm text-center">
          {{ errorMsg }}
        </div>

        <div>
          <button type="submit" class="w-full btn-primary" :disabled="loading">
            <span v-if="loading">Đang xử lý...</span>
            <span v-else>Đăng nhập</span>
          </button>
        </div>
      </form>
      
      <div class="mt-4 text-xs text-gray-500 text-center">
        Tài khoản mẫu:<br/>
        Admin: admin / Admin@123<br/>
        Giáo viên: mai.nguyen / Teacher@123
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const form = ref({ username: '', password: '' });
const errorMsg = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await authStore.login(form.value);
    if (res.success) {
      router.push('/');
    } else {
      errorMsg.value = res.message || 'Đăng nhập thất bại';
    }
  } catch (error: any) {
    errorMsg.value = error.message || 'Lỗi kết nối server';
  } finally {
    loading.value = false;
  }
};
</script>
