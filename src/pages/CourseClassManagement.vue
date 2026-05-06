<template>
  <div class="space-y-8">
    <!-- Courses Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">Quản lý Khóa học</h2>
        <button @click="openCourseModal()" class="btn-primary">Thêm Khóa học</button>
      </div>
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên khóa học</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số buổi</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời lượng (phút)</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="c in courses" :key="c.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ c.name }}</td>
              <td class="px-6 py-4">{{ c.totalLessons }}</td>
              <td class="px-6 py-4">{{ c.defaultDuration }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Classes Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">Quản lý Lớp học</h2>
        <button @click="openClassModal()" class="btn-primary bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">Mở Lớp mới</button>
      </div>
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên lớp</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khóa học (ID)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sĩ số</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày khai giảng</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="cls in classes" :key="cls.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium text-indigo-600">{{ cls.name }}</td>
              <td class="px-6 py-4">{{ cls.courseId }}</td>
              <td class="px-6 py-4">{{ cls.studentSize }}</td>
              <td class="px-6 py-4">{{ cls.startDate }}</td>
              <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {{ cls.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <!-- Course Drawer -->
    <Drawer :is-open="showCourseModal" title="Thêm Khóa học" @close="showCourseModal = false">
      <form @submit.prevent="saveCourse" id="courseForm" class="space-y-6">
        <div>
          <label class="block text-sm font-medium">Tên khóa học</label>
          <input v-model="courseForm.name" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium">Tổng số buổi</label>
          <input v-model.number="courseForm.totalLessons" type="number" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium">Thời lượng (phút)</label>
          <input v-model.number="courseForm.defaultDuration" type="number" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium">Mô tả</label>
          <textarea v-model="courseForm.description" class="input-field mt-1" rows="3"></textarea>
        </div>
      </form>
      <template #footer>
        <button type="button" @click="showCourseModal = false" class="btn-secondary">Hủy</button>
        <button type="submit" form="courseForm" class="btn-primary">Lưu khóa học</button>
      </template>
    </Drawer>

    <!-- Class Drawer -->
    <Drawer :is-open="showClassModal" title="Mở Lớp Mới" @close="showClassModal = false">
      <form @submit.prevent="saveClass" id="classForm" class="space-y-6">
        <div>
          <label class="block text-sm font-medium">Khóa học</label>
          <select v-model="classForm.courseId" required class="input-field mt-1">
            <option value="">Chọn khóa học</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium">Tên lớp (vd: IELTS-K1)</label>
          <input v-model="classForm.name" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium">Sĩ số dự kiến</label>
          <input v-model.number="classForm.studentSize" type="number" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium">Ngày khai giảng</label>
          <input v-model="classForm.startDate" type="date" required class="input-field mt-1" />
        </div>
      </form>
      <template #footer>
        <button type="button" @click="showClassModal = false" class="btn-secondary">Hủy</button>
        <button type="submit" form="classForm" class="btn-primary">Lưu & Tạo Buổi Học</button>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { Course, SchoolClass } from '@/types';
import Drawer from '@/components/Drawer.vue';

const courses = ref<Course[]>([]);
const classes = ref<SchoolClass[]>([]);

const showCourseModal = ref(false);
const courseForm = ref<Course>({ name: '', totalLessons: 20, defaultDuration: 90, description: '' });

const showClassModal = ref(false);
const classForm = ref<any>({ courseId: '', name: '', studentSize: 20, startDate: '' });

const fetchData = async () => {
  const [resCourses, resClasses] = await Promise.all([
    api.get('/courses'),
    api.get('/classes')
  ]);
  courses.value = (resCourses as any).data;
  classes.value = (resClasses as any).data;
};

const openCourseModal = () => {
  courseForm.value = { name: '', totalLessons: 20, defaultDuration: 90, description: '' };
  showCourseModal.value = true;
};

const saveCourse = async () => {
  try {
    const res: any = await api.post('/courses', courseForm.value);
    if (res.success) {
      showCourseModal.value = false;
      fetchData();
    }
  } catch (err) { alert('Lỗi tạo khóa học'); }
};

const openClassModal = () => {
  classForm.value = { courseId: '', name: '', studentSize: 20, startDate: '' };
  showClassModal.value = true;
};

const saveClass = async () => {
  try {
    const res: any = await api.post('/classes', classForm.value);
    if (res.success) {
      showClassModal.value = false;
      fetchData();
      alert('Đã tạo lớp và tự động sinh các buổi học thành công!');
    }
  } catch (err) { alert('Lỗi tạo lớp học'); }
};

onMounted(fetchData);
</script>
