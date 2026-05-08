<template>
  <div class="min-h-screen flex items-center justify-center bg-green-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
    <el-card class="max-w-md w-full !border-0 shadow-2xl rounded-2xl p-8 bg-white/95 backdrop-blur-sm z-10">
      <div class="text-center mb-8">
        <h2 class="mt-2 text-3xl font-extrabold text-gray-900">
          {{ $t('login.title') }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ $t('login.center_name') }}
        </p>
      </div>

      <el-form :model="form" @keyup.enter="handleSubmit" size="large">
        <el-form-item>
          <el-input 
            v-model="form.username" 
            :placeholder="$t('login.username')" 
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item class="mb-6">
          <el-input 
            v-model="form.password" 
            type="password" 
            :placeholder="$t('login.password')" 
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <div v-if="errorMsg" class="text-red-500 text-sm text-center mb-4">
          {{ errorMsg }}
        </div>

        <el-form-item>
          <el-button type="primary" class="w-full" :loading="loading" @click="handleSubmit">
            {{ $t('login.btn') }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="mt-6 text-xs text-gray-500 text-center border-t border-gray-100 pt-4">
        {{ $t('login.sample_accounts') }}<br/>
        Admin: <span class="font-semibold text-gray-700">admin</span> / <span class="font-semibold text-gray-700">Admin@123</span><br/>
        {{ $t('account.teacher_role') }}: <span class="font-semibold text-gray-700">mai.nguyen</span> / <span class="font-semibold text-gray-700">Teacher@123</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const router = useRouter();

const form = ref({ username: '', password: '' });
const errorMsg = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    errorMsg.value = t('login.error_required');
    return;
  }
  
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await authStore.login(form.value);
    if (res.success) {
      router.push('/');
    } else {
      errorMsg.value = res.message || t('login.error_failed');
    }
  } catch (error: any) {
    errorMsg.value = error.message || t('login.error_server');
  } finally {
    loading.value = false;
  }
};
</script>
