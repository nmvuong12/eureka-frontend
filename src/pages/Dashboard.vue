<template>
  <div class="dashboard">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">{{ $t('menu.dashboard') }}</h1>
    
    <el-row :gutter="24" class="mb-8">
      <el-col :span="6" :xs="24" :sm="12" :md="6">
        <el-card shadow="sm" class="flex items-center p-2 border-0">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
              <el-icon :size="32"><Avatar /></el-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">{{ $t('dashboard.total_teachers') }}</p>
              <p class="text-2xl font-bold text-gray-900">42</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6" :xs="24" :sm="12" :md="6">
        <el-card shadow="sm" class="flex items-center p-2 border-0">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
              <el-icon :size="32"><Reading /></el-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">{{ $t('dashboard.active_classes') }}</p>
              <p class="text-2xl font-bold text-gray-900">18</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6" :xs="24" :sm="12" :md="6">
        <el-card shadow="sm" class="flex items-center p-2 border-0">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
              <el-icon :size="32"><Location /></el-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">{{ $t('dashboard.total_rooms') }}</p>
              <p class="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6" :xs="24" :sm="12" :md="6">
        <el-card shadow="sm" class="flex items-center p-2 border-0">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
              <el-icon :size="32"><Calendar /></el-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">{{ $t('dashboard.today_sessions') }}</p>
              <p class="text-2xl font-bold text-gray-900">36</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :span="16" :xs="24" :lg="16">
        <el-card shadow="sm" class="border-0 h-full">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ $t('dashboard.weekly_sessions') }}</h3>
          <div class="h-80 flex items-center justify-center">
            <Bar v-if="chartDataReady" :data="barChartData" :options="barChartOptions" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8" :xs="24" :lg="8">
        <el-card shadow="sm" class="border-0 h-full">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ $t('dashboard.teacher_levels') }}</h3>
          <div class="h-80 flex items-center justify-center">
            <Doughnut v-if="chartDataReady" :data="pieChartData" :options="pieChartOptions" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="mt-6">
      <el-col :span="8" :xs="24" :md="8">
        <el-card shadow="sm" class="bg-primary-50 border border-primary-100 h-full">
          <h3 class="text-lg font-semibold text-primary-800">{{ $t('dashboard.welcome') }}, {{ authStore.user?.username }}</h3>
          <p class="text-gray-600 mt-2">{{ $t('dashboard.role') }}: <el-tag size="small">{{ authStore.user?.role }}</el-tag></p>
        </el-card>
      </el-col>

      <el-col :span="16" :xs="24" :md="16" v-if="authStore.isAdmin || authStore.isTeacher">
        <el-card shadow="sm" class="border-0 h-full">
          <div class="flex items-center justify-between h-full">
            <div>
               <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ $t('dashboard.shortcuts') }}</h3>
               <p class="text-sm text-gray-500">{{ $t('dashboard.shortcuts_desc') }}</p>
            </div>
            <div class="flex space-x-4">
              <el-button type="primary" @click="$router.push('/timetable')">
                 {{ $t('dashboard.view_timetable') }}
              </el-button>
              <el-button @click="$router.push('/leave')">
                 {{ $t('dashboard.manage_leave') }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { Avatar, Reading, Location, Calendar } from '@element-plus/icons-vue';
import { Bar, Doughnut } from 'vue-chartjs';
import { useI18n } from 'vue-i18n';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const authStore = useAuthStore();
const { t } = useI18n();
const chartDataReady = ref(false);

const barChartData = computed(() => ({
  labels: [
    t('dashboard.mon'), t('dashboard.tue'), t('dashboard.wed'), 
    t('dashboard.thu'), t('dashboard.fri'), t('dashboard.sat'), t('dashboard.sun')
  ],
  datasets: [
    {
      label: t('dashboard.sessions_label'),
      backgroundColor: '#6366f1',
      borderRadius: 6,
      data: [42, 38, 45, 40, 39, 50, 20]
    }
  ]
}));

const barChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f3f4f6'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
});

const pieChartData = computed(() => ({
  labels: [
    t('dashboard.level_primary'), 
    t('dashboard.level_secondary'), 
    t('dashboard.level_high'), 
    t('dashboard.level_other')
  ],
  datasets: [
    {
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
      data: [30, 25, 40, 5],
      borderWidth: 0
    }
  ]
}));

const pieChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  },
  cutout: '70%'
});

onMounted(() => {
  chartDataReady.value = true;
});
</script>
