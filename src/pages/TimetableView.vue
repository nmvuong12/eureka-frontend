<template>
  <div class="h-full flex flex-col space-y-6">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100">
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
        {{ $t('timetable.title') }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">Xem và quản lý thời khóa biểu xếp lịch tự động cho toàn bộ lớp học và giáo viên.</p>
    </div>

    <!-- Toolbar: Filters + Run Solver -->
    <el-card shadow="never" class="border border-gray-100 rounded-xl" :body-style="{ padding: '16px 20px' }">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Teacher filter (Admin/Giáo vụ only) -->
        <div v-if="authStore.isAdmin || !authStore.isTeacher" class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {{ $t('menu.teachers') }}
          </label>
          <el-select
            v-model="filters.teacherId"
            filterable
            clearable
            :placeholder="$t('timetable.all_teachers')"
            class="w-52"
          >
            <el-option :value="null" :label="$t('timetable.all_teachers')" />
            <el-option v-for="tc in teachers" :key="tc.id" :value="tc.id" :label="tc.fullName || tc.name" />
          </el-select>
        </div>

        <!-- Class filter (Admin/Giáo vụ only) -->
        <div v-if="authStore.isAdmin || !authStore.isTeacher" class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {{ $t('class.title') }}
          </label>
          <el-select
            v-model="filters.classId"
            filterable
            clearable
            :placeholder="$t('timetable.all_classes')"
            class="w-52"
          >
            <el-option :value="null" :label="$t('timetable.all_classes')" />
            <el-option v-for="c in classes" :key="c.id" :value="c.id" :label="c.name" />
          </el-select>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 ml-auto items-end">
          <el-button
            type="primary"
            @click="fetchTimetable"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
          >
            <el-icon class="mr-1"><Search /></el-icon>
            {{ $t('common.search') }}
          </el-button>
          <el-button @click="resetFilters">{{ $t('common.reset') }}</el-button>
          <el-button
            v-if="authStore.isAdmin || !authStore.isTeacher"
            type="warning"
            @click="runSolver"
            :loading="solving"
            class="shadow-md"
          >
            <el-icon v-if="!solving" class="mr-1"><Timer /></el-icon>
            {{ solving ? $t('timetable.solver_running') : $t('timetable.solver_run') }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Timetable Grid -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl flex-1 overflow-hidden" :body-style="{ padding: '0', height: '100%' }">
      <div class="overflow-auto h-full p-4">
        <div class="min-w-[1000px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <!-- Grid Header Row -->
          <div class="grid grid-cols-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
            <div class="p-3 text-center font-bold text-xs uppercase tracking-wider text-gray-500 border-r border-gray-200">
              {{ $t('timetable.ca') }}
            </div>
            <div
              v-for="day in daysOfWeek"
              :key="day"
              class="p-3 text-center font-bold text-xs uppercase tracking-wider text-emerald-700 border-r border-gray-200 last:border-r-0"
            >
              {{ formatDay(day) }}
            </div>
          </div>

          <!-- Grid Body Rows -->
          <template v-for="timeGroup in timeGroups" :key="timeGroup">
            <div class="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
              <!-- Time Label -->
              <div class="bg-gray-50 p-3 font-semibold text-xs text-gray-600 flex items-center justify-center text-center border-r border-gray-200 leading-relaxed">
                {{ timeGroup }}
              </div>
              <!-- Day Cells -->
              <div
                v-for="day in daysOfWeek"
                :key="day + timeGroup"
                class="p-2 min-h-[90px] border-r border-gray-100 last:border-r-0 bg-white hover:bg-gray-50 transition-colors duration-150"
              >
                <div
                  v-for="lesson in getLessons(day, timeGroup)"
                  :key="lesson.lessonId"
                  class="timetable-card mb-2 cursor-pointer"
                  @click="openLessonDetails(lesson)"
                >
                  <div class="font-bold text-emerald-800 text-sm truncate">{{ lesson.className }}</div>
                  <div class="text-gray-600 text-xs mt-1 flex items-center gap-1">
                    <el-icon :size="10"><Avatar /></el-icon>
                    <span class="truncate">{{ lesson.teacherName || $t('common.no_data') }}</span>
                  </div>
                  <div class="text-gray-600 text-xs mt-0.5 flex items-center gap-1">
                    <el-icon :size="10"><OfficeBuilding /></el-icon>
                    <span class="truncate">{{ lesson.roomName || $t('common.no_data') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { TimetableEntry, Teacher, SchoolClass } from '@/types';
import { Search, Avatar, OfficeBuilding, Timer } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const timetable = ref<TimetableEntry[]>([]);
const teachers = ref<Teacher[]>([]);
const classes = ref<SchoolClass[]>([]);

const solving = ref(false);
const pollInterval = ref<any>(null);

const filters = ref({
  teacherId: authStore.isTeacher ? authStore.user?.teacherId : null,
  classId: null,
});

/** Nhãn các ca học cố định */
const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const timeGroups = ['Ca 1 (07:30 - 09:00)', 'Ca 2 (09:15 - 10:45)', 'Ca 3 (13:30 - 15:00)', 'Ca 4 (15:15 - 16:45)', 'Ca 5 (18:00 - 19:30)'];

/** Map tên ngày tiếng Anh sang tiếng Việt */
const formatDay = (day: string) => {
  const map: Record<string, string> = {
    MONDAY: t('timetable.mon'), TUESDAY: t('timetable.tue'), WEDNESDAY: t('timetable.wed'),
    THURSDAY: t('timetable.thu'), FRIDAY: t('timetable.fri'), SATURDAY: t('timetable.sat'), SUNDAY: t('timetable.sun')
  };
  return map[day];
};

/** Lọc danh sách buổi học theo ngày và ca học */
const getLessons = (day: string, timeGroup: string) => {
  return timetable.value.filter(l => l.dayOfWeek === day && l.timeslotLabel?.includes(timeGroup.substring(0, 4)));
};

/** Đặt lại bộ lọc và tải lại thời khóa biểu */
const resetFilters = () => {
  filters.value = {
    teacherId: authStore.isTeacher ? authStore.user?.teacherId : null,
    classId: null,
  };
  fetchTimetable();
};

/** Tải dữ liệu thời khóa biểu từ backend */
const fetchTimetable = async () => {
  try {
    const params: any = {};
    if (filters.value.teacherId) params.teacherId = filters.value.teacherId;
    if (filters.value.classId) params.classId = filters.value.classId;
    const res: any = await api.get('/timetable', { params });
    if (res.success) timetable.value = res.data;
  } catch (err) {
    console.error('Lỗi tải thời khóa biểu', err);
  }
};

/** Tải danh sách giáo viên và lớp học cho bộ lọc */
const loadMetadata = async () => {
  try {
    const [resT, resC] = await Promise.all([
      api.get('/teachers/all'),
      api.get('/classes')
    ]);
    teachers.value = (resT as any).data;
    classes.value = (resC as any).data;
  } catch (err) {}
};

/** Kích hoạt thuật toán xếp lịch tự động */
const runSolver = async () => {
  try {
    solving.value = true;
    const res: any = await api.post('/timetable/solve');
    if (res.success) {
      pollStatus(res.data.jobId);
    }
  } catch (err) {
    solving.value = false;
    ElMessage.error(t('common.error'));
  }
};

/** Theo dõi trạng thái tiến trình xếp lịch */
const pollStatus = (jobId: string) => {
  pollInterval.value = setInterval(async () => {
    try {
      const res: any = await api.get(`/timetable/solve/status/${jobId}`);
      if (res.success) {
        const status = res.data.status;
        if (status.startsWith('DONE')) {
          clearInterval(pollInterval.value);
          solving.value = false;
          fetchTimetable();
          ElMessage.success(`${t('timetable.solver_success')} Score: ${status.split(':')[1]}`);
        } else if (status.startsWith('ERROR')) {
          clearInterval(pollInterval.value);
          solving.value = false;
          ElMessage.error(`${t('timetable.solver_error')}: ` + status);
        }
      }
    } catch (err) {
      clearInterval(pollInterval.value);
      solving.value = false;
    }
  }, 2000);
};

/** Hiển thị popup chi tiết buổi học khi click vào ô */
const openLessonDetails = (lesson: TimetableEntry) => {
  ElMessageBox.alert(
    `<div class="space-y-2">
      <p><strong>${t('class.name')}:</strong> ${lesson.className}</p>
      <p><strong>${t('menu.teachers')}:</strong> ${lesson.teacherName || t('common.no_data')}</p>
      <p><strong>${t('room.title')}:</strong> ${lesson.roomName || t('common.no_data')}</p>
    </div>`,
    t('timetable.lesson_detail') || 'Chi tiết buổi học',
    { dangerouslyUseHTMLString: true, confirmButtonText: 'Đóng' }
  );
};

onMounted(() => {
  if (authStore.isAdmin || !authStore.isTeacher) {
    loadMetadata();
  }
  fetchTimetable();
});

onUnmounted(() => {
  if (pollInterval.value) clearInterval(pollInterval.value);
});
</script>

<style scoped>
.timetable-card {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  padding: 8px 10px;
  transition: all 0.2s ease;
}

.timetable-card:hover {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #6ee7b7;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}
</style>
