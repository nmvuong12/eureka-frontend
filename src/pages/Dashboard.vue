<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100">
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
        {{ $t('menu.dashboard') }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">Tổng quan hệ thống xếp lịch dạy học tại Eureka English Center.</p>
    </div>

    <!-- Stats Cards -->
    <el-row :gutter="20">
      <el-col :span="6" :xs="24" :sm="12" :md="6" v-for="stat in statsCards" :key="stat.key">
        <div class="stat-card group">
          <div class="stat-icon-wrap" :class="stat.iconBg">
            <el-icon :size="28" :class="stat.iconColor">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">{{ stat.label }}</p>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
          <div class="stat-accent" :class="stat.accentColor"></div>
        </div>
      </el-col>
    </el-row>

    <!-- Charts Row -->
    <el-row :gutter="20">
      <el-col :span="16" :xs="24" :lg="16">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" :body-style="{ padding: '24px' }">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-1.5 h-5 rounded-full"></span>
              <h3 class="text-base font-bold text-gray-800">{{ $t('dashboard.weekly_sessions') }}</h3>
            </div>
          </template>
          <div class="h-72 flex items-center justify-center">
            <Bar v-if="chartDataReady" :data="barChartData" :options="barChartOptions" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8" :xs="24" :lg="8">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" :body-style="{ padding: '24px' }">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-1.5 h-5 rounded-full"></span>
              <h3 class="text-base font-bold text-gray-800">{{ $t('dashboard.teacher_levels') }}</h3>
            </div>
          </template>
          <div class="h-72 flex items-center justify-center">
            <Doughnut v-if="chartDataReady" :data="pieChartData" :options="pieChartOptions" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Bottom Row -->
    <el-row :gutter="20">
      <!-- Welcome Card -->
      <el-col :span="8" :xs="24" :md="8">
        <el-card shadow="sm" class="welcome-card border-0 rounded-2xl h-full" :body-style="{ padding: '28px' }">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <el-icon :size="24" class="text-white"><Avatar /></el-icon>
            </div>
            <div>
              <h3 class="text-white font-bold text-lg leading-tight">
                {{ $t('dashboard.welcome') }}, {{ authStore.user?.username }}!
              </h3>
              <el-tag size="small" type="success" effect="light" class="mt-1">
                {{ authStore.user?.role }}
              </el-tag>
            </div>
          </div>
          <p class="text-emerald-100 text-sm">Chào mừng bạn đến với hệ thống quản lý xếp lịch Eureka English Center.</p>
        </el-card>
      </el-col>

      <!-- Shortcuts Card -->
      <el-col :span="16" :xs="24" :md="16" v-if="authStore.isAdmin || authStore.isTeacher">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" :body-style="{ padding: '28px' }">
          <div class="flex items-center justify-between h-full">
            <div>
              <h3 class="text-lg font-bold text-gray-800 mb-1">{{ $t('dashboard.shortcuts') }}</h3>
              <p class="text-sm text-gray-500">{{ $t('dashboard.shortcuts_desc') }}</p>
            </div>
            <div class="flex gap-3">
              <el-button
                type="primary"
                size="large"
                @click="$router.push('/timetable')"
                class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md"
              >
                <el-icon class="mr-1"><Calendar /></el-icon>
                {{ $t('dashboard.view_timetable') }}
              </el-button>
              <el-button size="large" @click="$router.push('/leave')" class="shadow-sm">
                <el-icon class="mr-1"><Document /></el-icon>
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
import { Avatar, Reading, Location, Calendar, Document } from '@element-plus/icons-vue';
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

/** Danh sách thẻ thống kê số liệu */
const statsCards = computed(() => [
  {
    key: 'teachers',
    label: t('dashboard.total_teachers'),
    value: '42',
    icon: Avatar,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accentColor: 'bg-emerald-500',
  },
  {
    key: 'classes',
    label: t('dashboard.active_classes'),
    value: '18',
    icon: Reading,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    accentColor: 'bg-teal-500',
  },
  {
    key: 'rooms',
    label: t('dashboard.total_rooms'),
    value: '24',
    icon: Location,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    accentColor: 'bg-cyan-500',
  },
  {
    key: 'sessions',
    label: t('dashboard.today_sessions'),
    value: '36',
    icon: Calendar,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    accentColor: 'bg-green-500',
  },
]);

const barChartData = computed(() => ({
  labels: [
    t('dashboard.mon'), t('dashboard.tue'), t('dashboard.wed'),
    t('dashboard.thu'), t('dashboard.fri'), t('dashboard.sat'), t('dashboard.sun')
  ],
  datasets: [
    {
      label: t('dashboard.sessions_label'),
      backgroundColor: '#10b981',
      hoverBackgroundColor: '#059669',
      borderRadius: 8,
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
      grid: { color: '#f1f5f9' },
      ticks: { color: '#94a3b8', font: { size: 11 } }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 11 } }
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
      backgroundColor: ['#10b981', '#0d9488', '#06b6d4', '#64748b'],
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
      position: 'bottom' as const,
      labels: { color: '#475569', font: { size: 11 } }
    }
  },
  cutout: '72%'
});

onMounted(() => {
  chartDataReady.value = true;
});
</script>

<style scoped>
/* Stat Card */
.stat-card {
  position: relative;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  cursor: default;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
  transform: translateY(-2px);
  border-color: #d1fae5;
}

.stat-icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.stat-accent {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  border-radius: 0 16px 16px 0;
}

/* Welcome Card */
.welcome-card {
  background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
}
</style>
