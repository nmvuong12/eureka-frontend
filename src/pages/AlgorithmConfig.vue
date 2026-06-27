<template>
  <div class="algorithm-config space-y-6">
    <!-- Page Header với thanh dọc emerald gradient -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('algorithm.title') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ $t('algorithm.desc') }}
        </p>
      </div>
      
      <div class="flex gap-2">
        <el-button 
          type="info" 
          plain
          @click="fetchConstraints"
          :loading="loading"
          class="hover:!bg-gray-50"
        >
          <el-icon class="mr-1"><Refresh /></el-icon>
          {{ $t('algorithm.reload') }}
        </el-button>
        <el-button 
          type="primary" 
          @click="saveConfigurations" 
          :loading="saving"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md flex items-center gap-1 font-bold"
        >
          <el-icon><Check /></el-icon>
          {{ $t('algorithm.save') }}
        </el-button>
      </div>
    </div>

    <!-- Phân loại nhóm ràng buộc -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-loading="loading">
      
      <!-- Nhóm 1: Tối ưu cho Giáo viên -->
      <div class="space-y-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span class="p-1 bg-teal-50 text-teal-600 rounded border border-teal-100 flex items-center justify-center">
            <el-icon><User /></el-icon>
          </span>
          {{ $t('algorithm.teacher_group') }}
        </h2>
        
        <div v-for="config in teacherConstraints" :key="config.id" class="premium-constraint-card">
          <el-card class="border border-gray-150 rounded-2xl transition-all duration-300 hover:shadow-md hover:border-gray-300">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1 flex-grow">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-900">{{ config.constraintName }}</span>
                  <el-tag size="small" type="info" class="!text-teal-700 !bg-teal-50 !border-teal-100 font-bold uppercase text-[10px]">
                    {{ config.constraintKey }}
                  </el-tag>
                </div>
                <p class="text-xs text-gray-500 leading-relaxed max-w-md">{{ config.description }}</p>
              </div>
              <el-switch 
                v-model="config.enabled" 
                active-color="#10b981" 
                inactive-color="#e2e8f0" 
              />
            </div>
            
            <!-- Bộ chỉnh trọng số xuất hiện khi bật -->
            <transition name="fade-slide">
              <div v-if="config.enabled" class="mt-4 pt-3 border-t border-gray-50 flex items-center gap-6">
                <span class="text-xs font-semibold text-gray-500 w-24">{{ $t('algorithm.penalty_weight') }}</span>
                <el-slider 
                  v-model="config.weight" 
                  :min="1" 
                  :max="100" 
                  show-input 
                  class="flex-grow premium-slider"
                  :marks="{ 10: $t('algorithm.weight_light'), 50: $t('algorithm.weight_medium'), 90: $t('algorithm.weight_hard') }"
                />
              </div>
            </transition>
          </el-card>
        </div>
      </div>

      <!-- Nhóm 2: Tối ưu cho Lớp học & Học viên -->
      <div class="space-y-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span class="p-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 flex items-center justify-center">
            <el-icon><School /></el-icon>
          </span>
          {{ $t('algorithm.class_room_group') }}
        </h2>
        
        <div v-for="config in classConstraints" :key="config.id" class="premium-constraint-card">
          <el-card class="border border-gray-150 rounded-2xl transition-all duration-300 hover:shadow-md hover:border-gray-300">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1 flex-grow">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-900">{{ config.constraintName }}</span>
                  <el-tag size="small" type="info" class="!text-emerald-700 !bg-emerald-50 !border-emerald-100 font-bold uppercase text-[10px]">
                    {{ config.constraintKey }}
                  </el-tag>
                </div>
                <p class="text-xs text-gray-500 leading-relaxed max-w-md">{{ config.description }}</p>
              </div>
              <el-switch 
                v-model="config.enabled" 
                active-color="#10b981" 
                inactive-color="#e2e8f0" 
              />
            </div>
            
            <!-- Bộ chỉnh trọng số xuất hiện khi bật -->
            <transition name="fade-slide">
              <div v-if="config.enabled" class="mt-4 pt-3 border-t border-gray-50 flex items-center gap-6">
                <span class="text-xs font-semibold text-gray-500 w-24">{{ $t('algorithm.penalty_weight') }}</span>
                <el-slider 
                  v-model="config.weight" 
                  :min="1" 
                  :max="100" 
                  show-input 
                  class="flex-grow premium-slider"
                  :marks="{ 10: $t('algorithm.weight_light'), 50: $t('algorithm.weight_medium'), 90: $t('algorithm.weight_hard') }"
                />
              </div>
            </transition>
          </el-card>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { Check, Refresh, User, School } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

interface ConstraintConfig {
  id: number;
  constraintKey: string;
  constraintName: string;
  description: string;
  enabled: boolean;
  weight: number;
}

const loading = ref(false);
const saving = ref(false);
const constraints = ref<ConstraintConfig[]>([]);
const { t } = useI18n();

// Tách nhóm ràng buộc
const teacherKeys = [
  'teacher_room_stability', 
  'teacher_max_consecutive', 
  'teacher_max_daily_load', 
  'teacher_gap', 
  'teacher_type_preference', 
  'teacher_load_balance'
];

const teacherConstraints = computed(() => {
  return constraints.value.filter(c => teacherKeys.includes(c.constraintKey));
});

const classConstraints = computed(() => {
  return constraints.value.filter(c => !teacherKeys.includes(c.constraintKey));
});

// Tải dữ liệu từ API
const fetchConstraints = async () => {
  loading.value = true;
  try {
    const res: any = await api.get('/constraints');
    if (res.success) {
      constraints.value = res.data;
    }
  } catch (err) {
    ElMessage.error(t('algorithm.error_load'));
  } finally {
    loading.value = false;
  }
};

// Gửi cập nhật lên API
const saveConfigurations = async () => {
  saving.value = true;
  try {
    const res: any = await api.put('/constraints', constraints.value);
    if (res.success) {
      ElMessage.success(t('algorithm.save_success'));
      fetchConstraints();
    } else {
      ElMessage.error(res.message || t('algorithm.save_failed'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('algorithm.save_failed'));
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchConstraints();
});
</script>

<script lang="ts">
export default {
  name: 'AlgorithmConfig'
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.premium-slider :deep(.el-slider__runway) {
  margin-right: 12px;
}

.premium-constraint-card {
  animation: slideUp 0.4s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
