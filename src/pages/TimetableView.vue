<template>
  <div class="h-full flex flex-col space-y-6">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('timetable.title') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ $t('timetable.desc') }}</p>
      </div>

      <!-- Mode Selector Tabs -->
      <el-radio-group v-model="viewMode" size="large" class="shadow-sm rounded-xl overflow-hidden border border-gray-100" @change="handleModeChange">
        <el-radio-button value="recurring">
          <el-icon class="mr-1"><Calendar /></el-icon>
          {{ $t('timetable.mode_recurring') }}
        </el-radio-button>
        <el-radio-button value="calendar">
          <el-icon class="mr-1"><Clock /></el-icon>
          {{ $t('timetable.mode_calendar') }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- Toolbar: Filters + Navigation / Run Solver -->
    <el-card shadow="never" class="border border-gray-100 rounded-xl" :body-style="{ padding: '16px 20px' }">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Date Picker for Weekly Calendar Mode -->
        <div v-if="viewMode === 'calendar'" class="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50">
          <el-button size="default" circle @click="navigateWeek(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <div class="px-3 font-semibold text-sm text-gray-700 select-none min-w-[200px] text-center">
            {{ formattedWeekRange }}
          </div>
          <el-button size="default" circle @click="navigateWeek(1)">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button size="default" type="primary" plain @click="selectCurrentWeek" class="ml-1">
            {{ $t('timetable.week_current') }}
          </el-button>
        </div>

        <!-- Course Batch Filter -->
        <div v-if="authStore.isAdmin || !authStore.isTeacher" class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {{ $t('timetable.filter_batch') }}
          </label>
          <el-select
            v-model="filters.batchId"
            filterable
            clearable
            :placeholder="$t('timetable.filter_batch_placeholder')"
            class="w-52"
            @change="handleBatchChange"
          >
            <el-option :value="null" :label="$t('timetable.filter_batch_placeholder')" />
            <el-option v-for="b in batches" :key="b.id" :value="b.id" :label="b.batchName" />
          </el-select>
        </div>

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

        <!-- Class filter -->
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
            <el-option v-for="c in filteredClasses" :key="c.id" :value="c.id" :label="c.name" />
          </el-select>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 ml-auto items-end">
          <el-button
            type="primary"
            @click="fetchTimetable"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-sm"
          >
            <el-icon class="mr-1"><Search /></el-icon>
            {{ $t('common.search') }}
          </el-button>
          <el-button @click="resetFilters">{{ $t('common.reset') }}</el-button>

          <!-- Run Solver Button (only in recurring mode and admin/giáo vụ) -->
          <el-button
            v-if="viewMode === 'recurring' && (authStore.isAdmin || !authStore.isTeacher)"
            type="warning"
            @click="runSolver"
            :loading="solving"
            :disabled="!hasOpenClasses"
            class="shadow-md"
          >
            <el-icon v-if="!solving" class="mr-1"><Timer /></el-icon>
            {{ solving ? $t('timetable.solver_running') : $t('timetable.solver_run') }}
          </el-button>

          <!-- Lock Schedule Button (only in recurring mode and admin/giáo vụ) -->
          <el-button
            v-if="viewMode === 'recurring' && (authStore.isAdmin || !authStore.isTeacher)"
            type="danger"
            @click="lockSchedule"
            :loading="locking"
            :disabled="solving || !hasOpenClasses"
            class="!bg-amber-600 hover:!bg-amber-700 !border-amber-600 shadow-md text-white font-semibold"
          >
            <el-icon class="mr-1"><Lock /></el-icon>
            {{ $t('timetable.lock_btn') }}
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
              {{ formatDayHeader(day) }}
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
                class="p-2 min-h-[100px] border-r border-gray-100 last:border-r-0 bg-white hover:bg-gray-50/50 transition-colors duration-150"
              >
                <div
                  v-for="lesson in getLessons(day, timeGroup)"
                  :key="lesson.lessonId"
                  class="timetable-card mb-2 cursor-pointer relative"
                  @click="openLessonDetails(lesson)"
                >
                  <!-- Pinned indicator -->
                  <span v-if="lesson.pinned" class="absolute top-1.5 right-1.5 text-amber-500" title="Lịch đã được ghim điều phối">
                    <el-icon :size="12"><Lock /></el-icon>
                  </span>
                  
                  <div class="font-bold text-emerald-800 text-sm truncate pr-4">{{ lesson.className }}</div>
                  
                  <div class="text-gray-500 text-xs mt-1.5 flex items-center gap-1">
                    <el-icon :size="10"><Avatar /></el-icon>
                    <span class="truncate">{{ lesson.teacherName || $t('common.no_data') }}</span>
                  </div>
                  <div class="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                    <el-icon :size="10"><OfficeBuilding /></el-icon>
                    <span class="truncate">{{ lesson.roomName || $t('common.no_data') }}</span>
                  </div>
                  <div class="text-[10px] text-gray-400 mt-1 flex justify-between items-center">
                    <span>{{ $t('timetable.detail_lesson_val', { index: lesson.lessonIndex }) }}</span>
                    <span v-if="lesson.sessionDate" class="text-emerald-600 font-medium">{{ formatDateDDMM(lesson.sessionDate) }}</span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { TimetableEntry, Teacher, SchoolClass, CourseBatch } from '@/types';
import { Search, Avatar, OfficeBuilding, Timer, Calendar, Clock, ArrowLeft, ArrowRight, Lock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

// Chế độ xem: 'recurring' (chuẩn hàng tuần) hoặc 'calendar' (thực tế theo tuần dương lịch)
const viewMode = ref<'recurring' | 'calendar'>('recurring');

// State dữ liệu
const timetable = ref<TimetableEntry[]>([]);
const teachers = ref<Teacher[]>([]);
const classes = ref<SchoolClass[]>([]);
const batches = ref<CourseBatch[]>([]);

// Trạng thái khóa lịch
const locking = ref(false);

// Lịch dương lịch cho chế độ Calendar Mode
const currentDate = ref<Date>(new Date());
const currentWeekDates = ref<Date[]>([]);

// Bộ lọc
const filters = ref({
  batchId: null as number | null,
  teacherId: authStore.isTeacher ? authStore.user?.teacherId : null as number | null,
  classId: null as number | null,
});

const solving = ref(false);
const pollInterval = ref<any>(null);

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const timeGroups = ['Ca 1 (08:00 - 10:00)', 'Ca 2 (10:00 - 12:00)', 'Ca 3 (14:00 - 16:00)', 'Ca 4 (17:00 - 19:00)', 'Ca 5 (19:00 - 21:00)'];

// Dropdown classes được lọc theo đợt khai giảng (Batch) đã chọn
const filteredClasses = computed(() => {
  if (!filters.value.batchId) return classes.value;
  return classes.value.filter(c => c.batchId === filters.value.batchId);
});

// Kiểm tra xem đợt khai giảng được chọn có lớp học nào đang ở trạng thái OPEN (chưa khóa) hay không
const hasOpenClasses = computed(() => {
  const batchId = filters.value.batchId;
  const filtered = batchId 
    ? classes.value.filter(c => c.batchId === batchId)
    : classes.value;
  return filtered.some(c => c.status === 'OPEN');
});

// Khoảng thời gian tuần hiện tại định dạng để hiển thị
const formattedWeekRange = computed(() => {
  if (currentWeekDates.value.length === 0) return '';
  const monday = currentWeekDates.value[0];
  const sunday = currentWeekDates.value[6];
  return `${formatDateDDMMYYYY(monday)} - ${formatDateDDMMYYYY(sunday)}`;
});

// Chuyển đổi Mode xem
const handleModeChange = () => {
  fetchTimetable();
};

// Đặt lại bộ lọc của Class khi đổi Batch
const handleBatchChange = () => {
  filters.value.classId = null;
  fetchTimetable();
};

// Thuật toán lấy Thứ 2 của tuần chứa ngày d
const getMonday = (d: Date) => {
  const target = new Date(d);
  const day = target.getDay();
  const diff = target.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh nếu ngày hiện tại là Chủ Nhật (0)
  return new Date(target.setDate(diff));
};

// Khởi tạo danh sách các ngày từ Thứ 2 đến Chủ nhật của tuần hiện tại
const calculateWeekDates = (monday: Date) => {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    dates.push(nextDate);
  }
  currentWeekDates.value = dates;
};

// Điều hướng tuần trước/tuần sau
const navigateWeek = (weeks: number) => {
  const newDate = new Date(currentDate.value);
  newDate.setDate(currentDate.value.getDate() + weeks * 7);
  currentDate.value = newDate;
  calculateWeekDates(getMonday(newDate));
  fetchTimetable();
};

// Chọn tuần hiện tại
const selectCurrentWeek = () => {
  currentDate.value = new Date();
  calculateWeekDates(getMonday(new Date()));
  fetchTimetable();
};

// Định dạng ngày
const formatDateDDMM = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const formatDateDDMMYYYY = (d: Date) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Định dạng nhãn cột Thứ trong Grid
const formatDay = (day: string) => {
  const map: Record<string, string> = {
    MONDAY: t('timetable.mon'), TUESDAY: t('timetable.tue'), WEDNESDAY: t('timetable.wed'),
    THURSDAY: t('timetable.thu'), FRIDAY: t('timetable.fri'), SATURDAY: t('timetable.sat'), SUNDAY: t('timetable.sun')
  };
  return map[day];
};

const formatDayHeader = (day: string) => {
  const index = daysOfWeek.indexOf(day);
  if (viewMode.value === 'recurring' || currentWeekDates.value.length === 0 || !currentWeekDates.value[index]) {
    return formatDay(day);
  }
  const dateObj = currentWeekDates.value[index];
  const dayStr = String(dateObj.getDate()).padStart(2, '0');
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${formatDay(day)} (${dayStr}/${monthStr})`;
};

// Lọc danh sách card buổi học đổ vào từng ô Grid
const getLessons = (day: string, timeGroup: string) => {
  const groupShort = timeGroup.substring(0, 4); // "Ca 1", "Ca 2", ...
  
  if (viewMode.value === 'recurring') {
    // Chế độ lịch chuẩn: Lọc theo Thứ và Ca học
    return timetable.value.filter(l => 
      l.dayOfWeek === day && 
      l.timeslotLabel?.includes(groupShort)
    );
  } else {
    // Chế độ lịch thực tế: Lọc theo ngày dương lịch cụ thể tương ứng với cột Thứ
    const index = daysOfWeek.indexOf(day);
    if (currentWeekDates.value.length === 0 || !currentWeekDates.value[index]) return [];
    
    const targetDateStr = formatDateYYYYMMDD(currentWeekDates.value[index]);
    
    return timetable.value.filter(l => {
      if (!l.sessionDate) return false;
      const lessonDateStr = l.sessionDate.substring(0, 10);
      return lessonDateStr === targetDateStr && l.timeslotLabel?.includes(groupShort);
    });
  }
};

// Đặt lại bộ lọc
const resetFilters = () => {
  filters.value = {
    batchId: null,
    teacherId: authStore.isTeacher ? authStore.user?.teacherId : null,
    classId: null,
  };
  fetchTimetable();
};

// Tải dữ liệu thời khóa biểu từ backend dựa theo viewMode
const fetchTimetable = async () => {
  try {
    const params: any = {};
    if (filters.value.teacherId) params.teacherId = filters.value.teacherId;
    if (filters.value.classId) params.classId = filters.value.classId;
    if (filters.value.batchId) params.batchId = filters.value.batchId;

    let res: any;
    if (viewMode.value === 'recurring') {
      res = await api.get('/timetable', { params });
    } else {
      if (currentWeekDates.value.length === 0) return;
      params.startDate = formatDateYYYYMMDD(currentWeekDates.value[0]);
      params.endDate = formatDateYYYYMMDD(currentWeekDates.value[6]);
      res = await api.get('/timetable/weekly-calendar', { params });
    }

    if (res.success) timetable.value = res.data;
  } catch (err) {
    console.error('Lỗi tải thời khóa biểu', err);
  }
};

// Tải danh mục metadata cho bộ lọc
const loadMetadata = async () => {
  try {
    const [resT, resC, resB] = await Promise.all([
      api.get('/teachers/all'),
      api.get('/classes'),
      api.get('/course-batches')
    ]);
    teachers.value = (resT as any).data;
    classes.value = (resC as any).data;
    batches.value = (resB as any).data;
  } catch (err) {
    console.error('Lỗi tải metadata', err);
  }
};

// Chạy Timefold Solver
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

// Polling kiểm tra trạng thái Solver
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

// Thực hiện khóa cứng thời khóa biểu
const lockSchedule = async () => {
  const batchId = filters.value.batchId;
  const batchName = batchId 
    ? batches.value.find(b => b.id === batchId)?.batchName || `ID ${batchId}`
    : t('timetable.lock_all_center');

  try {
    await ElMessageBox.confirm(
      t('timetable.lock_confirm_text', { name: batchName }),
      t('timetable.lock_confirm_title'),
      {
        confirmButtonText: t('timetable.lock_confirm_btn'),
        cancelButtonText: t('timetable.lock_cancel_btn'),
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    );

    locking.value = true;
    const params: any = {};
    if (batchId) params.batchId = batchId;

    const res: any = await api.post('/timetable/lock', null, { params });
    if (res.success) {
      ElMessage({
        type: 'success',
        message: t('timetable.lock_success', { count: res.data.lockedSessions }),
        duration: 5000
      });
      // Tải lại dữ liệu thời khóa biểu và metadata
      await Promise.all([fetchTimetable(), loadMetadata()]);
    } else {
      ElMessage.error(res.message || t('timetable.lock_failed'));
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Lỗi khi khóa thời khóa biểu', err);
      ElMessage.error(t('timetable.lock_error'));
    }
  } finally {
    locking.value = false;
  }
};

// Hiển thị modal chi tiết buổi học
const openLessonDetails = (lesson: TimetableEntry) => {
  const dateInfo = lesson.sessionDate 
    ? `<p><strong>${t('timetable.detail_date_actual')}</strong> ${formatDateDDMMYYYY(new Date(lesson.sessionDate))} (${formatDay(lesson.dayOfWeek)})</p>` 
    : `<p><strong>${t('timetable.detail_date_standard')}</strong> ${formatDay(lesson.dayOfWeek)}</p>`;

  const showDispatchBtn = !!(lesson.sessionDate && (authStore.isAdmin || !authStore.isTeacher));

  ElMessageBox.confirm(
    `<div class="space-y-2 text-sm leading-relaxed">
      <p><strong>${t('class.name')}:</strong> <span class="font-semibold text-gray-800">${lesson.className}</span></p>
      <p><strong>${t('timetable.detail_lesson_no')}</strong> <span class="font-bold text-emerald-700">${t('timetable.detail_lesson_val', { index: lesson.lessonIndex })}</span></p>
      ${dateInfo}
      <p><strong>${t('timetable.ca')}:</strong> ${lesson.timeslotLabel}</p>
      <p><strong>${t('menu.teachers')}:</strong> ${lesson.teacherName || t('common.no_data')}</p>
      <p><strong>${t('room.title')}:</strong> ${lesson.roomName || t('common.no_data')}</p>
      <p><strong>${t('timetable.detail_status')}</strong> ${lesson.pinned ? `<span class="text-amber-600 font-semibold inline-flex items-center gap-1"><i class="el-icon-lock"></i> ${t('timetable.detail_status_pinned')}</span>` : `<span class="text-emerald-600">${t('timetable.detail_status_auto')}</span>`}</p>
    </div>`,
    t('timetable.lesson_detail') || 'Chi tiết buổi học',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: showDispatchBtn ? t('timetable.detail_btn_dispatch') : t('timetable.detail_btn_close'),
      cancelButtonText: showDispatchBtn ? t('timetable.detail_btn_close') : undefined,
      showCancelButton: showDispatchBtn,
      type: 'info'
    }
  ).then(() => {
    if (showDispatchBtn && lesson.sessionDate) {
      router.push({
        name: 'ClassDispatch',
        query: { date: lesson.sessionDate.toString().substring(0, 10) }
      });
    }
  }).catch(() => {});
};

onMounted(() => {
  // Khởi tạo ngày hiện tại và tuần hiện tại
  calculateWeekDates(getMonday(currentDate.value));

  if (authStore.isAdmin || !authStore.isTeacher) {
    loadMetadata();
  }
  fetchTimetable();
});

onUnmounted(() => {
  if (pollInterval.value) clearInterval(pollInterval.value);
});
</script>

<script lang="ts">
// Đăng ký tên component phục vụ router keep-alive nếu có
export default {
  name: 'TimetableView'
}
</script>

<style scoped>
.timetable-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 10px 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.timetable-card:hover {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #6ee7b7;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.15);
}
</style>
