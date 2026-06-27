<template>
  <div class="course-catalog space-y-6">
    <!-- Page Header với thanh dọc màu emerald -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('course.catalog_title') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ $t('course.catalog_desc') }}</p>
      </div>
      <el-button
        type="primary"
        @click="openDrawer()"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300"
      >
        <el-icon class="mr-1"><Plus /></el-icon>
        {{ $t('course.btn_add') }}
      </el-button>
    </div>

    <!-- Toolbar: Tìm kiếm + Lọc -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl" :body-style="{ padding: '16px 24px' }">
      <div class="flex flex-wrap items-center gap-3">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('course.search_placeholder')"
          clearable
          class="w-72"
          @keyup.enter="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select v-model="filterStatus" :placeholder="$t('course.filter_status')" clearable class="w-44" @change="handleSearch">
          <el-option :label="$t('course.status_active')" value="ACTIVE" />
          <el-option :label="$t('course.status_inactive')" value="INACTIVE" />
          <el-option :label="$t('course.status_discontinued')" value="DISCONTINUED" />
        </el-select>

        <el-button type="primary" @click="handleSearch" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
          <el-icon class="mr-1"><Search /></el-icon>
          {{ $t('common.search_btn') }}
        </el-button>
        <el-button @click="resetSearch">
          <el-icon class="mr-1"><Refresh /></el-icon>
          {{ $t('common.reset_btn') }}
        </el-button>
      </div>
    </el-card>

    <!-- Bảng dữ liệu khóa học -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0px' }">
      <el-table
        :data="courses"
        v-loading="loading"
        style="width: 100%"
        stripe
        class="premium-table"
      >
        <!-- Mã khóa học -->
        <el-table-column prop="code" :label="$t('course.col_code')" width="140">
          <template #default="{ row }">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {{ row.code || '—' }}
            </span>
          </template>
        </el-table-column>

        <!-- Tên khóa học -->
        <el-table-column prop="name" :label="$t('course.col_name')" min-width="180">
          <template #default="{ row }">
            <div class="font-bold text-gray-900">{{ row.name }}</div>
            <div v-if="row.description" class="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]" :title="row.description">
              {{ row.description }}
            </div>
          </template>
        </el-table-column>

        <!-- Buổi/tuần -->
        <el-table-column prop="sessionsPerWeek" :label="$t('course.col_sessions_week')" width="100" align="center">
          <template #default="{ row }">
            <span class="font-semibold text-teal-600">{{ row.sessionsPerWeek ?? '—' }}</span>
          </template>
        </el-table-column>

        <!-- Tổng buổi -->
        <el-table-column prop="totalSessions" :label="$t('course.col_sessions_total')" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.totalSessions ?? '—' }}</span>
          </template>
        </el-table-column>

        <!-- Min-Max học viên -->
        <el-table-column :label="$t('course.col_students')" width="140" align="center">
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.minStudents ?? '?' }} – {{ row.maxStudents ?? '?' }}</span>
          </template>
        </el-table-column>

        <!-- Kỹ năng yêu cầu -->
        <el-table-column prop="requiredSkillCode" :label="$t('course.col_skill')" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.requiredSkillCode" size="small" effect="plain" type="info">
              {{ row.requiredSkillCode }}
            </el-tag>
            <span v-else class="text-gray-400 text-xs">—</span>
          </template>
        </el-table-column>

        <!-- Trạng thái -->
        <el-table-column :label="$t('course.col_status')" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="dark" class="font-bold rounded-md">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Thao tác -->
        <el-table-column :label="$t('course.col_actions')" width="160" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip :content="$t('common.edit')" placement="top">
                <el-button type="primary" link @click="openDrawer(row)">
                  <el-icon :size="16"><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip :content="row.status === 'ACTIVE' ? $t('course.action_deactivate') : $t('course.action_activate')" placement="top">
                <el-button
                  :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                  link
                  @click="toggleStatus(row)"
                >
                  <el-icon :size="16">
                    <VideoPause v-if="row.status === 'ACTIVE'" />
                    <VideoPlay v-else />
                  </el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="$t('course.empty')" />
        </template>
      </el-table>

      <!-- Phân trang -->
      <div class="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
        <div class="text-xs text-gray-500">{{ $t('course.total_count', { count: totalElements }) }}</div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalElements"
          @current-change="fetchCourses"
          @size-change="() => { currentPage = 1; fetchCourses(); }"
          class="premium-pagination"
        />
      </div>
    </el-card>

    <!-- Drawer tạo/sửa khóa học -->
    <el-drawer
      v-model="showDrawer"
      :title="currentCourse.id ? $t('course.edit_title') : $t('course.create_title')"
      size="50%"
      @close="closeDrawer"
      custom-class="premium-drawer"
    >
      <el-form
        :model="currentCourse"
        ref="formRef"
        label-position="top"
        class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1"
        :rules="formRules"
      >
        <!-- Mã khóa học -->
        <el-form-item :label="$t('course.form_code')" prop="code">
          <el-input v-model="currentCourse.code" :placeholder="$t('course.form_code_placeholder')" />
        </el-form-item>

        <!-- Tên khóa học -->
        <el-form-item :label="$t('course.form_name')" prop="name" required>
          <el-input v-model="currentCourse.name" :placeholder="$t('course.form_name_placeholder')" />
        </el-form-item>

        <!-- Mô tả -->
        <el-form-item :label="$t('course.form_desc')" class="col-span-2">
          <el-input
            v-model="currentCourse.description"
            type="textarea"
            :rows="3"
            :placeholder="$t('course.form_desc_placeholder')"
          />
        </el-form-item>

        <!-- Buổi/tuần -->
        <el-form-item :label="$t('course.form_sessions_week')">
          <el-input-number v-model="currentCourse.sessionsPerWeek" :min="1" :max="7" class="w-full" />
        </el-form-item>

        <!-- Tổng buổi -->
        <el-form-item :label="$t('course.form_sessions_total')">
          <el-input-number v-model="currentCourse.totalSessions" :min="1" class="w-full" />
        </el-form-item>

        <!-- Số tuần -->
        <el-form-item :label="$t('course.form_duration_weeks')">
          <el-input-number v-model="currentCourse.durationWeeks" :min="1" class="w-full" />
        </el-form-item>

        <!-- Số học viên tối thiểu -->
        <el-form-item :label="$t('course.form_min_students')">
          <el-input-number v-model="currentCourse.minStudents" :min="1" class="w-full" />
        </el-form-item>

        <!-- Số học viên tối đa -->
        <el-form-item :label="$t('course.form_max_students')">
          <el-input-number v-model="currentCourse.maxStudents" :min="1" class="w-full" />
        </el-form-item>

        <!-- Kỹ năng yêu cầu giáo viên -->
        <el-form-item :label="$t('course.form_required_skill')" class="col-span-2">
          <el-select
            v-model="currentCourse.requiredSkillCode"
            :placeholder="$t('course.form_required_skill_placeholder')"
            clearable
            filterable
            class="w-full"
          >
            <el-option
              v-for="skill in allSkills"
              :key="skill.skillCode"
              :label="`${skill.skillName} (${skill.skillCode})`"
              :value="skill.skillCode"
              :disabled="isSkillDisabled(skill)"
            />
          </el-select>
        </el-form-item>

        <!-- Trạng thái -->
        <el-form-item :label="$t('course.form_status')">
          <el-select v-model="currentCourse.status" class="w-full">
            <el-option :label="$t('course.status_active')" value="ACTIVE" />
            <el-option :label="$t('course.status_inactive')" value="INACTIVE" />
            <el-option :label="$t('course.status_discontinued')" value="DISCONTINUED" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2 p-4 border-t border-gray-100">
          <el-button @click="closeDrawer">{{ $t('common.cancel') }}</el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="saveCourse"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            {{ currentCourse.id ? $t('common.edit') : $t('common.add') }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { Course } from '@/types';
import { Plus, Search, Edit, Refresh, Check, VideoPause, VideoPlay } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// ---- State ----
const courses = ref<Course[]>([]);
const loading = ref(false);
const saving = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const totalElements = ref(0);
const searchQuery = ref('');
const filterStatus = ref('');
const showDrawer = ref(false);
const allSkills = ref<any[]>([]);
const formRef = ref<FormInstance>();

// Form hiện tại đang tạo/sửa
const currentCourse = ref<Course>({
  code: '',
  name: '',
  description: '',
  totalSessions: undefined,
  sessionsPerWeek: undefined,
  durationWeeks: undefined,
  minStudents: undefined,
  maxStudents: undefined,
  requiredSkillCode: '',
  status: 'ACTIVE'
});

// Validation rules
const formRules = {
  name: [{ required: true, message: t('course.rule_name_required'), trigger: 'blur' }]
};

// ---- API calls ----

/** Tải danh sách khóa học từ backend */
const fetchCourses = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    };
    if (searchQuery.value) params.query = searchQuery.value;
    if (filterStatus.value) params.status = filterStatus.value;

    const res: any = await api.get('/courses', { params });
    if (res.success) {
      courses.value = res.data.content;
      totalElements.value = res.data.totalElements;
    }
  } catch (err) {
    ElMessage.error(t('course.error_load'));
  } finally {
    loading.value = false;
  }
};

/** Tải danh sách kỹ năng cho dropdown */
const fetchAllSkills = async () => {
  try {
    const res: any = await api.get('/skills/all');
    if (res.success) {
      allSkills.value = res.data;
    }
  } catch (err) {
    console.error('Lỗi khi tải kỹ năng:', err);
  }
};

// ---- Handlers ----

const handleSearch = () => {
  currentPage.value = 1;
  fetchCourses();
};

const resetSearch = () => {
  searchQuery.value = '';
  filterStatus.value = '';
  currentPage.value = 1;
  fetchCourses();
};

/** Mở drawer để tạo mới hoặc chỉnh sửa khóa học */
const openDrawer = (course?: Course) => {
  if (course) {
    currentCourse.value = { ...course };
  } else {
    currentCourse.value = {
      code: '',
      name: '',
      description: '',
      totalSessions: undefined,
      sessionsPerWeek: undefined,
      durationWeeks: undefined,
      minStudents: undefined,
      maxStudents: undefined,
      requiredSkillCode: '',
      status: 'ACTIVE'
    };
  }
  showDrawer.value = true;
};

const closeDrawer = () => {
  showDrawer.value = false;
};

/** Lưu khóa học (tạo mới hoặc cập nhật) */
const saveCourse = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      let res: any;
      if (currentCourse.value.id) {
        // Cập nhật khóa học đã có
        res = await api.put(`/courses/${currentCourse.value.id}`, currentCourse.value);
      } else {
        // Tạo khóa học mới
        res = await api.post('/courses', currentCourse.value);
      }

      if (res.success) {
        ElMessage.success(currentCourse.value.id ? t('course.save_success_edit') : t('course.save_success_create'));
        closeDrawer();
        fetchCourses();
      } else {
        ElMessage.error(res.message || t('common.error'));
      }
    } catch (err: any) {
      ElMessage.error(err.response?.data?.message || t('common.error'));
    } finally {
      saving.value = false;
    }
  });
};

/** Toggle trạng thái ACTIVE ↔ INACTIVE với confirm */
const toggleStatus = async (course: Course) => {
  const newStatus = course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const label = newStatus === 'ACTIVE' ? t('course.action_activate') : t('course.action_deactivate');

  try {
    await ElMessageBox.confirm(
      t('course.toggle_confirm_text', { action: label, name: course.name }),
      t('course.toggle_confirm_title'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    );

    const res: any = await api.patch(`/courses/${course.id}/status`, { status: newStatus });
    if (res.success) {
      ElMessage.success(t('course.toggle_success', { action: label }));
      fetchCourses();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('common.error'));
    }
  }
};

// ---- Helpers ----

/** Lấy loại tag theo trạng thái */
const getStatusTagType = (status?: string) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'INACTIVE') return 'warning';
  if (status === 'DISCONTINUED') return 'danger';
  return 'info';
};

/** Lấy nhãn hiển thị theo trạng thái */
const getStatusLabel = (status?: string) => {
  if (status === 'ACTIVE') return t('course.status_active');
  if (status === 'INACTIVE') return t('course.status_inactive');
  if (status === 'DISCONTINUED') return t('course.status_discontinued_short');
  return status || '—';
};

/** Kiểm tra kỹ năng có bị vô hiệu hóa không */
const isSkillDisabled = (_skill: any) => {
  // Đối với trường hợp chọn 1 kỹ năng (Single-Select) tại Danh mục khóa học,
  // người dùng có thể chọn đổi sang bất kỳ cấp độ nào tùy ý.
  // Thiết kế sẵn sàng ở đây cho trường hợp mở rộng chọn nhiều kỹ năng.
  return false;
};

onMounted(() => {
  fetchCourses();
  fetchAllSkills();
});
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
