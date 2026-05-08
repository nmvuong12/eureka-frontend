<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('timetable.title') }}</h1>
      
      <div class="flex space-x-2">
        <button v-if="authStore.isAdmin || !authStore.isTeacher" @click="runSolver" :disabled="solving" class="btn-primary flex items-center">
          <svg v-if="solving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ solving ? $t('timetable.solver_running') : $t('timetable.solver_run') }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-6 flex flex-wrap gap-4 items-end">
      <div v-if="authStore.isAdmin || !authStore.isTeacher" class="w-64">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('menu.teachers') }}</label>
        <select v-model="filters.teacherId" @change="fetchTimetable" class="input-field">
          <option :value="null">{{ $t('timetable.all_teachers') }}</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <div v-if="authStore.isAdmin || !authStore.isTeacher" class="w-64">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('class.title') }}</label>
        <select v-model="filters.classId" @change="fetchTimetable" class="input-field">
          <option :value="null">{{ $t('timetable.all_classes') }}</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <button @click="fetchTimetable" class="btn-secondary">{{ $t('common.reset') }}</button>
      </div>
    </div>

    <!-- Timetable Grid -->
    <div class="card flex-1 overflow-auto bg-gray-50 p-0">
      <div class="min-w-[1000px] grid grid-cols-8 gap-px bg-gray-200">
        <!-- Headers -->
        <div class="bg-gray-100 p-3 text-center font-bold text-gray-700 border-b">{{ $t('timetable.ca') }}</div>
        <div v-for="day in daysOfWeek" :key="day" class="bg-gray-100 p-3 text-center font-bold text-gray-700 border-b">
          {{ formatDay(day) }}
        </div>

        <!-- Rows by Timeslot Group -->
        <template v-for="timeGroup in timeGroups" :key="timeGroup">
          <div class="bg-white p-3 font-medium text-gray-600 border-r flex items-center justify-center">
             {{ timeGroup }}
          </div>
          <div v-for="day in daysOfWeek" :key="day + timeGroup" class="bg-white p-2 min-h-[100px] border-r">
             <div v-for="lesson in getLessons(day, timeGroup)" :key="lesson.lessonId" 
                  class="bg-primary-100 border border-primary-200 rounded p-2 mb-2 text-sm shadow-sm cursor-pointer hover:bg-primary-200 transition-colors"
                  @click="openLessonDetails(lesson)">
               <div class="font-bold text-primary-800">{{ lesson.className }}</div>
               <div class="text-gray-700 flex justify-between mt-1">
                 <span>{{ $t('menu.teachers') }}:</span> 
                 <span class="font-medium text-right">{{ lesson.teacherName || $t('common.no_data') }}</span>
               </div>
               <div class="text-gray-700 flex justify-between">
                 <span>{{ $t('room.title') }}:</span> 
                 <span class="font-medium text-right">{{ lesson.roomName || $t('common.no_data') }}</span>
               </div>
             </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { TimetableEntry, Teacher, SchoolClass } from '@/types';
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

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
// Simple mapping logic for demo
const timeGroups = ['Ca 1 (07:30 - 09:00)', 'Ca 2 (09:15 - 10:45)', 'Ca 3 (13:30 - 15:00)', 'Ca 4 (15:15 - 16:45)', 'Ca 5 (18:00 - 19:30)'];

const formatDay = (day: string) => {
  const map: Record<string, string> = {
    MONDAY: t('timetable.mon'), TUESDAY: t('timetable.tue'), WEDNESDAY: t('timetable.wed'),
    THURSDAY: t('timetable.thu'), FRIDAY: t('timetable.fri'), SATURDAY: t('timetable.sat'), SUNDAY: t('timetable.sun')
  };
  return map[day];
};

const getLessons = (day: string, timeGroup: string) => {
  return timetable.value.filter(l => l.dayOfWeek === day && l.timeslotLabel?.includes(timeGroup.substring(0, 4)));
};

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

const loadMetadata = async () => {
  try {
    const [resT, resC] = await Promise.all([
      api.get('/teachers'),
      api.get('/classes')
    ]);
    teachers.value = (resT as any).data;
    classes.value = (resC as any).data;
  } catch (err) {}
};

const runSolver = async () => {
  try {
    solving.value = true;
    const res: any = await api.post('/timetable/solve');
    if (res.success) {
      pollStatus(res.data.jobId);
    }
  } catch (err) {
    solving.value = false;
    alert(t('common.error'));
  }
};

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
          alert(`${t('timetable.solver_success')} Score: ${status.split(':')[1]}`);
        } else if (status.startsWith('ERROR')) {
          clearInterval(pollInterval.value);
          solving.value = false;
          alert(`${t('timetable.solver_error')}: ` + status);
        }
      }
    } catch (err) {
      clearInterval(pollInterval.value);
      solving.value = false;
    }
  }, 2000);
};

const openLessonDetails = (lesson: TimetableEntry) => {
  // Demo function for click event
  alert(`${t('timetable.lesson_detail')}:\n${t('class.name')}: ${lesson.className}\n${t('menu.teachers')}: ${lesson.teacherName}\n${t('room.title')}: ${lesson.roomName}`);
};

onMounted(() => {
  if (authStore.isAdmin || !authStore.isTeacher) {
    loadMetadata();
  }
  fetchTimetable();
});
</script>
