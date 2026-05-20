<template>
  <div class="space-y-8">
    <!-- Main Title Section -->
    <div class="pb-4 border-b border-gray-100">
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
        Quản lý Lớp & Khóa học
      </h1>
      <p class="text-sm text-gray-500 mt-1">Quản lý toàn bộ danh mục khóa học, phân bố số bài học và điều phối danh sách các lớp học hiện tại.</p>
    </div>

    <!-- Courses Section -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '24px' }">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <el-icon class="text-emerald-500"><Reading /></el-icon>
          {{ $t('course.title') }}
        </h2>
        <el-button type="primary" @click="openCourseModal()" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300">
          <el-icon class="mr-1"><Plus /></el-icon>
          {{ $t('course.create') }}
        </el-button>
      </div>

      <el-table :data="courses" style="width: 100%" stripe class="premium-table">
        <el-table-column prop="name" :label="$t('course.name')" min-width="180">
          <template #default="{ row }">
            <span class="font-bold text-gray-900 hover:text-emerald-600 transition-colors duration-200">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalLessons" :label="$t('course.lessons')" width="160">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700">{{ row.totalLessons }} bài học</span>
          </template>
        </el-table-column>
        <el-table-column prop="defaultDuration" :label="$t('course.duration')" width="160">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700">{{ row.defaultDuration }} phút/ca</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="Xem chi tiết" placement="top">
              <el-button type="info" link @click="openCourseModal(row, true)" class="hover:!text-blue-600">
                <el-icon :size="16"><View /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="Không có dữ liệu khóa học" />
        </template>
      </el-table>
    </el-card>

    <!-- Classes Section -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '24px' }">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <el-icon class="text-emerald-500"><Notebook /></el-icon>
          {{ $t('class.title') }}
        </h2>
        <el-button type="primary" @click="openClassModal()" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300">
          <el-icon class="mr-1"><Plus /></el-icon>
          {{ $t('class.create') }}
        </el-button>
      </div>

      <el-table :data="classes" style="width: 100%" stripe class="premium-table">
        <el-table-column prop="name" :label="$t('class.name')" min-width="160">
          <template #default="{ row }">
            <span class="font-bold text-emerald-700">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="courseId" :label="`${$t('course.name')} (ID)`" min-width="180">
          <template #default="{ row }">
            <span class="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600">ID khóa học: #{{ row.courseId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="studentSize" :label="$t('class.student_size')" width="160">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700">{{ row.studentSize }} học viên</span>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" :label="$t('class.start_date')" width="160">
          <template #default="{ row }">
            <span class="text-gray-600 font-medium">{{ formatDate(row.startDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="130">
          <template #default="{ row }">
            <el-tag type="warning" effect="light" class="font-bold rounded-lg">
              {{ row.status || 'Chưa bắt đầu' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="Xem chi tiết" placement="top">
              <el-button type="info" link @click="openClassModal(row, true)" class="hover:!text-blue-600">
                <el-icon :size="16"><View /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="Không có dữ liệu lớp học" />
        </template>
      </el-table>
    </el-card>

    <!-- Course Drawer -->
    <el-drawer
      v-model="showCourseModal"
      :title="isViewOnlyCourse ? $t('course.view_detail') : (courseForm.id ? $t('common.edit') : $t('course.create'))"
      size="450px"
      @close="showCourseModal = false"
      class="premium-drawer"
      custom-class="premium-drawer"
    >
      <el-form :model="courseForm" label-position="top" :disabled="isViewOnlyCourse">
        <el-form-item :label="$t('course.name')" required>
          <el-input v-model="courseForm.name" placeholder="Nhập tên khóa học..." />
        </el-form-item>
        <el-form-item :label="$t('course.lessons')" required>
          <el-input-number v-model="courseForm.totalLessons" :min="1" class="w-full font-semibold" />
        </el-form-item>
        <el-form-item :label="$t('course.duration')" required>
          <el-input-number v-model="courseForm.defaultDuration" :min="1" class="w-full font-semibold" />
        </el-form-item>
        <el-form-item :label="$t('course.description')">
          <el-input v-model="courseForm.description" type="textarea" :rows="4" placeholder="Nhập mô tả chi tiết khóa học..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end space-x-2 p-4 border-t border-gray-100">
          <template v-if="isViewOnlyCourse">
            <el-button type="primary" @click="isViewOnlyCourse = false" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
              <el-icon class="mr-1"><Edit /></el-icon>
              {{ $t('common.edit') }}
            </el-button>
          </template>
          <template v-else>
            <el-button @click="showCourseModal = false">Hủy bỏ</el-button>
            <el-button type="primary" @click="saveCourse" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
              {{ $t('common.save') }}
            </el-button>
          </template>
        </div>
      </template>
    </el-drawer>

    <!-- Class Drawer -->
    <el-drawer
      v-model="showClassModal"
      :title="isViewOnlyClass ? $t('class.view_detail') : (classForm.id ? $t('common.edit') : $t('class.create'))"
      size="450px"
      @close="showClassModal = false"
      class="premium-drawer"
      custom-class="premium-drawer"
    >
      <el-form :model="classForm" label-position="top" :disabled="isViewOnlyClass">
        <el-form-item :label="$t('course.title')" required>
          <el-select v-model="classForm.courseId" :placeholder="$t('common.placeholder_select')" class="w-full">
            <el-option v-for="c in courses" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('class.name')" required>
          <el-input v-model="classForm.name" placeholder="Nhập tên lớp học..." />
        </el-form-item>
        <el-form-item :label="$t('class.student_size')" required>
          <el-input-number v-model="classForm.studentSize" :min="1" class="w-full font-semibold" />
        </el-form-item>
        <el-form-item :label="$t('class.start_date')" required>
          <el-date-picker v-model="classForm.startDate" type="date" class="w-full" placeholder="Chọn ngày khai giảng..." format="DD/MM/YYYY" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end space-x-2 p-4 border-t border-gray-100">
          <template v-if="isViewOnlyClass">
            <el-button type="primary" @click="isViewOnlyClass = false" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
              <el-icon class="mr-1"><Edit /></el-icon>
              {{ $t('common.edit') }}
            </el-button>
          </template>
          <template v-else>
            <el-button @click="showClassModal = false">Hủy bỏ</el-button>
            <el-button type="primary" @click="saveClass" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
              {{ $t('common.save') }}
            </el-button>
          </template>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { Course, SchoolClass } from '@/types';
import { Plus, Edit, View, Reading, Notebook } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
};

const courses = ref<Course[]>([]);
const classes = ref<SchoolClass[]>([]);

const showCourseModal = ref(false);
const isViewOnlyCourse = ref(false);
const courseForm = ref<Course>({ name: '', totalLessons: 20, defaultDuration: 90, description: '' });

const showClassModal = ref(false);
const isViewOnlyClass = ref(false);
const classForm = ref<any>({ courseId: '', name: '', studentSize: 20, startDate: '' });

const fetchData = async () => {
  try {
    const [resCourses, resClasses] = await Promise.all([
      api.get('/courses'),
      api.get('/classes')
    ]);
    courses.value = (resCourses as any).data;
    classes.value = (resClasses as any).data;
  } catch (err) {
    ElMessage.error(t('common.error') || 'Có lỗi xảy ra khi tải dữ liệu');
  }
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
  if (!courseForm.value.name) {
    ElMessage.warning('Tên khóa học không được bỏ trống');
    return;
  }
  try {
    const res: any = await api.post('/courses', courseForm.value);
    if (res.success) {
      showCourseModal.value = false;
      fetchData();
      ElMessage.success('Lưu thông tin khóa học thành công');
    } else {
      ElMessage.error(res.message || 'Lưu thất bại');
    }
  } catch (err) {
    ElMessage.error(t('common.error'));
  }
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
  if (!classForm.value.courseId) {
    ElMessage.warning('Vui lòng chọn khóa học');
    return;
  }
  if (!classForm.value.name) {
    ElMessage.warning('Tên lớp không được bỏ trống');
    return;
  }
  if (!classForm.value.startDate) {
    ElMessage.warning('Vui lòng chọn ngày khai giảng');
    return;
  }
  try {
    const res: any = await api.post('/classes', classForm.value);
    if (res.success) {
      showClassModal.value = false;
      fetchData();
      ElMessage.success(t('class.create_success') || 'Tạo lớp học thành công');
    } else {
      ElMessage.error(res.message || 'Lưu thất bại');
    }
  } catch (err) {
    ElMessage.error(t('common.error'));
  }
};

onMounted(fetchData);
</script>

<style scoped>
.premium-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  border-radius: 12px;
}

.premium-drawer :deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 800;
  color: #0f172a;
}
</style>
