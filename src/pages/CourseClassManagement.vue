<template>
  <div class="space-y-8">
    <!-- Courses Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">{{ $t('course.title') }}</h2>
        <button @click="openCourseModal()" class="btn-primary">{{ $t('course.create') }}</button>
      </div>
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('course.name') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('course.lessons') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('course.duration') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="c in courses" :key="c.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ c.name }}</td>
              <td class="px-6 py-4">{{ c.totalLessons }}</td>
              <td class="px-6 py-4">{{ c.defaultDuration }}</td>
              <td class="px-6 py-4">
                <button @click="openCourseModal(c, true)" class="text-emerald-600 hover:text-emerald-900 font-medium">{{ $t('common.view') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Classes Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">{{ $t('class.title') }}</h2>
        <button @click="openClassModal()" class="btn-primary">{{ $t('class.create') }}</button>
      </div>
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('class.name') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('course.name') }} (ID)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('class.student_size') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('class.start_date') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('common.status') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="cls in classes" :key="cls.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium text-emerald-600">{{ cls.name }}</td>
              <td class="px-6 py-4">{{ cls.courseId }}</td>
              <td class="px-6 py-4">{{ cls.studentSize }}</td>
              <td class="px-6 py-4">{{ cls.startDate }}</td>
              <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {{ cls.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button @click="openClassModal(cls, true)" class="text-emerald-600 hover:text-emerald-900 font-medium">{{ $t('common.view') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Course Drawer -->
    <Drawer
      :is-open="showCourseModal"
      :title="isViewOnlyCourse ? $t('course.view_detail') : (courseForm.id ? $t('common.edit') : $t('course.create'))"
      @close="showCourseModal = false"
    >
      <form @submit.prevent="saveCourse" id="courseForm" class="space-y-6">
        <fieldset :disabled="isViewOnlyCourse" class="space-y-6">
          <div>
            <label class="block text-sm font-medium">{{ $t('course.name') }}</label>
            <input v-model="courseForm.name" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium">{{ $t('course.lessons') }}</label>
            <input v-model.number="courseForm.totalLessons" type="number" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium">{{ $t('course.duration') }}</label>
            <input v-model.number="courseForm.defaultDuration" type="number" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium">{{ $t('course.description') }}</label>
            <textarea v-model="courseForm.description" class="input-field mt-1" rows="3"></textarea>
          </div>
        </fieldset>
      </form>
      <template #footer>
        <template v-if="isViewOnlyCourse">
          <button type="button" @click="isViewOnlyCourse = false" class="btn-primary">{{ $t('common.edit') }}</button>
        </template>
        <template v-else>
          <button type="button" @click="showCourseModal = false" class="btn-secondary">{{ $t('common.cancel') }}</button>
          <button type="submit" form="courseForm" class="btn-primary">{{ $t('common.save') }}</button>
        </template>
      </template>
    </Drawer>

    <!-- Class Drawer -->
    <Drawer
      :is-open="showClassModal"
      :title="isViewOnlyClass ? $t('class.view_detail') : (classForm.id ? $t('common.edit') : $t('class.create'))"
      @close="showClassModal = false"
    >
      <form @submit.prevent="saveClass" id="classForm" class="space-y-6">
        <fieldset :disabled="isViewOnlyClass" class="space-y-6">
          <div>
            <label class="block text-sm font-medium">{{ $t('course.title') }}</label>
            <select v-model="classForm.courseId" required class="input-field mt-1">
              <option value="">{{ $t('common.placeholder_select') }}</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium">{{ $t('class.name') }}</label>
            <input v-model="classForm.name" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium">{{ $t('class.student_size') }}</label>
            <input v-model.number="classForm.studentSize" type="number" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium">{{ $t('class.start_date') }}</label>
            <input v-model="classForm.startDate" type="date" required class="input-field mt-1" />
          </div>
        </fieldset>
      </form>
      <template #footer>
        <template v-if="isViewOnlyClass">
          <button type="button" @click="isViewOnlyClass = false" class="btn-primary">{{ $t('common.edit') }}</button>
        </template>
        <template v-else>
          <button type="button" @click="showClassModal = false" class="btn-secondary">{{ $t('common.cancel') }}</button>
          <button type="submit" form="classForm" class="btn-primary">{{ $t('common.save') }}</button>
        </template>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { Course, SchoolClass } from '@/types';
import Drawer from '@/components/Drawer.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const courses = ref<Course[]>([]);
const classes = ref<SchoolClass[]>([]);

const showCourseModal = ref(false);
const isViewOnlyCourse = ref(false);
const courseForm = ref<Course>({ name: '', totalLessons: 20, defaultDuration: 90, description: '' });

const showClassModal = ref(false);
const isViewOnlyClass = ref(false);
const classForm = ref<any>({ courseId: '', name: '', studentSize: 20, startDate: '' });

const fetchData = async () => {
  const [resCourses, resClasses] = await Promise.all([
    api.get('/courses'),
    api.get('/classes')
  ]);
  courses.value = (resCourses as any).data;
  classes.value = (resClasses as any).data;
};

const openCourseModal = (course?: Course, viewOnly: boolean = false) => {
  isViewOnlyCourse.value = viewOnly;
  if (course) {
    courseForm.value = { ...course };
  } else {
    courseForm.value = { name: '', totalLessons: 20, defaultDuration: 90, description: '' };
  }
  showCourseModal.value = true;
};

const saveCourse = async () => {
  try {
    const res: any = await api.post('/courses', courseForm.value);
    if (res.success) {
      showCourseModal.value = false;
      fetchData();
    }
  } catch (err) { alert(t('common.error')); }
};

const openClassModal = (cls?: SchoolClass, viewOnly: boolean = false) => {
  isViewOnlyClass.value = viewOnly;
  if (cls) {
    classForm.value = { ...cls };
  } else {
    classForm.value = { courseId: '', name: '', studentSize: 20, startDate: '' };
  }
  showClassModal.value = true;
};

const saveClass = async () => {
  try {
    const res: any = await api.post('/classes', classForm.value);
    if (res.success) {
      showClassModal.value = false;
      fetchData();
      alert(t('class.create_success'));
    }
  } catch (err) { alert(t('common.error')); }
};

onMounted(fetchData);
</script>
