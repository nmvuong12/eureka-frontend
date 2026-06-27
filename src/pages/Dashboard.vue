<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('menu.dashboard') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ $t('dashboard.desc') }}</p>
      </div>
      <el-button 
        type="info" 
        plain 
        @click="fetchStats" 
        :loading="loading"
        class="shadow-sm rounded-xl"
      >
        <el-icon class="mr-1"><Refresh /></el-icon> {{ $t('dashboard.refresh') }}
      </el-button>
    </div>

    <!-- Stats Cards -->
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="6" :xs="24" :sm="12" :md="6" v-for="stat in statsCards" :key="stat.key" class="mb-4">
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
      <el-col :span="16" :xs="24" :lg="16" class="mb-4">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" :body-style="{ padding: '24px' }" v-loading="loading">
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

      <el-col :span="8" :xs="24" :lg="8" class="mb-4">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" :body-style="{ padding: '24px' }" v-loading="loading">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-1.5 h-5 rounded-full"></span>
              <h3 class="text-base font-bold text-gray-800">{{ $t('dashboard.teacher_structure') }}</h3>
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
      <!-- Course Distribution List -->
      <el-col :span="12" :xs="24" :md="12" class="mb-4">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" :body-style="{ padding: '24px' }" v-loading="loading">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="bg-gradient-to-b from-indigo-500 to-purple-600 w-1.5 h-5 rounded-full"></span>
              <h3 class="text-base font-bold text-gray-800">{{ $t('dashboard.class_distribution') }}</h3>
            </div>
          </template>
          <div class="space-y-4 max-h-72 overflow-y-auto pr-1">
            <div v-for="(count, courseName) in data?.classStatusDistribution" :key="courseName" class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="font-semibold text-gray-700">{{ courseName }}</span>
                <span class="font-bold text-indigo-600">{{ $t('dashboard.class_count', { count }) }}</span>
              </div>
              <el-progress 
                :percentage="data?.activeClasses ? Math.min(100, Math.round((count / data.activeClasses) * 100)) : 0" 
                :show-text="false"
                stroke-width="8"
                status="success"
                class="premium-progress"
              />
            </div>
            <div v-if="!data?.classStatusDistribution || Object.keys(data.classStatusDistribution).length === 0" class="text-center text-gray-400 py-8">
              {{ $t('dashboard.no_class_data') }}
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Welcome & Shortcuts Card -->
      <el-col :span="12" :xs="24" :md="12" class="mb-4">
        <div class="flex flex-col gap-4 h-full">
          <!-- Welcome Card -->
          <el-card shadow="sm" class="welcome-card border-0 rounded-2xl" :body-style="{ padding: '28px' }">
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
            <p class="text-emerald-100 text-sm">{{ $t('dashboard.welcome_desc') }}</p>
          </el-card>

          <!-- Shortcuts Card -->
          <el-card shadow="sm" class="border border-gray-100 rounded-2xl flex-grow animate-fade-in" :body-style="{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }">
            <div>
              <h3 class="text-lg font-bold text-gray-800 mb-1">{{ $t('dashboard.shortcuts') }}</h3>
              <p class="text-sm text-gray-500 mb-4">{{ $t('dashboard.shortcuts_desc') }}</p>
            </div>
            <div class="flex gap-3">
              <el-button
                type="primary"
                size="large"
                @click="$router.push('/timetable')"
                class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md flex-grow"
              >
                <el-icon class="mr-1"><Calendar /></el-icon>
                {{ $t('dashboard.view_timetable') }}
              </el-button>
              <el-button size="large" @click="$router.push('/leave')" class="shadow-sm flex-grow">
                <el-icon class="mr-1"><Document /></el-icon>
                {{ $t('dashboard.manage_leave') }}
              </el-button>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { Avatar, Reading, Location, Calendar, Document, Refresh } from '@element-plus/icons-vue';
import { Bar, Doughnut } from 'vue-chartjs';
import { useI18n } from 'vue-i18n';
import api from '@/api/axios';
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
const data = ref<any>(null);
const loading = ref(false);

const chartDataReady = computed(() => !!data.value);

/** Danh sách thẻ thống kê số liệu */
const statsCards = computed(() => {
  const tCount = data.value?.totalTeachers || 0;
  const cCount = data.value?.activeClasses || 0;
  const rCount = data.value?.totalRooms || 0;
  const sCount = data.value?.todaySessions || 0;
  const lCount = data.value?.pendingLeaveRequests || 0;

  const baseStats = [
    {
      key: 'teachers',
      label: t('dashboard.total_teachers'),
      value: String(tCount),
      icon: Avatar,
      iconBg: 'bg-emerald-50 border border-emerald-100',
      iconColor: 'text-emerald-600',
      accentColor: 'bg-emerald-500',
    },
    {
      key: 'classes',
      label: t('dashboard.active_classes'),
      value: String(cCount),
      icon: Reading,
      iconBg: 'bg-teal-50 border border-teal-100',
      iconColor: 'text-teal-600',
      accentColor: 'bg-teal-500',
    },
    {
      key: 'rooms',
      label: t('dashboard.total_rooms'),
      value: String(rCount),
      icon: Location,
      iconBg: 'bg-cyan-50 border border-cyan-100',
      iconColor: 'text-cyan-600',
      accentColor: 'bg-cyan-500',
    },
  ];

  if (authStore.isAdmin || authStore.isStaff) {
    baseStats.push({
      key: 'leaves',
      label: t('dashboard.pending_leaves'),
      value: String(lCount),
      icon: Document,
      iconBg: lCount > 0 ? 'bg-amber-50 border border-amber-200 animate-pulse' : 'bg-slate-50 border border-slate-150',
      iconColor: lCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-500',
      accentColor: lCount > 0 ? 'bg-amber-500' : 'bg-slate-400',
    });
  } else {
    baseStats.push({
      key: 'sessions',
      label: t('dashboard.today_sessions'),
      value: String(sCount),
      icon: Calendar,
      iconBg: 'bg-green-50 border border-green-100',
      iconColor: 'text-green-600',
      accentColor: 'bg-green-500',
    });
  }

  return baseStats;
});

const barChartData = computed(() => {
  const sessions = data.value?.weeklySessions || [0, 0, 0, 0, 0, 0, 0];
  return {
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
        data: sessions
      }
    ]
  };
});

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

const pieChartData = computed(() => {
  const ftCount = data.value?.teacherTypeDistribution?.FULL_TIME || 0;
  const ptCount = data.value?.teacherTypeDistribution?.PART_TIME || 0;
  return {
    labels: [t('dashboard.teacher_fulltime'), t('dashboard.teacher_parttime')],
    datasets: [
      {
        backgroundColor: ['#10b981', '#06b6d4'],
        data: [ftCount, ptCount],
        borderWidth: 0
      }
    ]
  };
});

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

const fetchStats = async () => {
  loading.value = true;
  try {
    const res: any = await api.get('/dashboard/stats');
    if (res.success) {
      data.value = res.data;
    }
  } catch (err) {
    console.error('Lỗi khi tải số liệu dashboard:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
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

.premium-progress :deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%);
}
</style>
