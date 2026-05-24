<template>
  <div class="course-batch-management space-y-6">
    <!-- Page Header với thanh dọc màu emerald -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          Kế hoạch Khai giảng
        </h1>
        <p class="text-sm text-gray-500 mt-1">Quản lý kế hoạch khai giảng các khóa học theo từng đợt tuyển sinh.</p>
      </div>
      <el-button
        type="primary"
        @click="openDrawer()"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300"
      >
        <el-icon class="mr-1"><Plus /></el-icon>
        Tạo kế hoạch
      </el-button>
    </div>

    <!-- Toolbar: Lọc -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl" :body-style="{ padding: '16px 24px' }">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Lọc theo khóa học -->
        <el-select
          v-model="filterCourseId"
          placeholder="Lọc theo khóa học"
          clearable
          filterable
          class="w-60"
          @change="handleSearch"
        >
          <el-option
            v-for="course in allCourses"
            :key="course.id"
            :label="`[${course.code}] ${course.name}`"
            :value="course.id"
          />
        </el-select>

        <!-- Lọc theo trạng thái -->
        <el-select v-model="filterStatus" placeholder="Lọc trạng thái" clearable class="w-44" @change="handleSearch">
          <el-option label="Đang lập kế hoạch" value="PLANNING" />
          <el-option label="Đang tuyển sinh" value="ENROLLING" />
          <el-option label="Đã mở khóa" value="OPENED" />
          <el-option label="Đã đóng" value="CLOSED" />
          <el-option label="Đã hủy" value="CANCELLED" />
        </el-select>

        <!-- Lọc theo ngày khai giảng dự kiến -->
        <el-date-picker
          v-model="filterOpeningDate"
          type="date"
          placeholder="Lọc ngày khai giảng"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          class="!w-48"
          @change="handleSearch"
        />

        <el-button @click="resetSearch">
          <el-icon class="mr-1"><Refresh /></el-icon>
          Đặt lại
        </el-button>
      </div>
    </el-card>

    <!-- Bảng dữ liệu kế hoạch khai giảng -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0px' }">
      <el-table
        :data="batches"
        v-loading="loading"
        style="width: 100%"
        stripe
        class="premium-table"
      >
        <!-- Tên kế hoạch -->
        <el-table-column prop="batchName" label="Tên kế hoạch" min-width="160">
          <template #default="{ row }">
            <div class="font-bold text-gray-900 hover:text-emerald-600 transition-colors">
              {{ row.batchName }}
            </div>
          </template>
        </el-table-column>

        <!-- Khóa học -->
        <el-table-column label="Khóa học" min-width="180">
          <template #default="{ row }">
            <div class="flex flex-col gap-0.5">
              <span class="font-semibold text-gray-800">{{ row.courseName }}</span>
              <span
                v-if="row.courseCode"
                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit"
              >
                {{ row.courseCode }}
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- Thời gian tuyển sinh -->
        <el-table-column label="Thời gian tuyển sinh" width="200">
          <template #default="{ row }">
            <div class="text-sm text-gray-600">
              <div v-if="row.enrollmentStartDate">
                <span class="text-xs text-gray-400">Từ:</span> {{ formatDate(row.enrollmentStartDate) }}
              </div>
              <div v-if="row.enrollmentEndDate">
                <span class="text-xs text-gray-400">Đến:</span> {{ formatDate(row.enrollmentEndDate) }}
              </div>
              <span v-if="!row.enrollmentStartDate && !row.enrollmentEndDate" class="text-gray-400 text-xs">—</span>
            </div>
          </template>
        </el-table-column>

        <!-- Ngày khai giảng dự kiến -->
        <el-table-column label="Khai giảng dự kiến" width="160" align="center">
          <template #default="{ row }">
            <span v-if="row.expectedOpeningDate" class="text-sm font-semibold text-teal-700">
              {{ formatDate(row.expectedOpeningDate) }}
            </span>
            <span v-else class="text-gray-400 text-xs">Chưa xác định</span>
          </template>
        </el-table-column>

        <!-- Quy mô dự kiến -->
        <el-table-column prop="forecastScale" label="Quy mô" width="100" align="center">
          <template #default="{ row }">
            <span class="font-semibold">{{ row.forecastScale ?? '—' }}</span>
          </template>
        </el-table-column>

        <!-- Trạng thái -->
        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getBatchStatusType(row.status)" effect="dark" class="font-bold rounded-md">
              {{ getBatchStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Thao tác -->
        <el-table-column label="Thao tác" width="240" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1.5 flex-wrap">
              <!-- Nút xem chi tiết -->
              <el-tooltip content="Xem chi tiết" placement="top">
                <el-button type="info" link @click="viewDetails(row)">
                  <el-icon :size="15"><View /></el-icon>
                </el-button>
              </el-tooltip>

              <!-- Nút chỉnh sửa -->
              <el-tooltip content="Chỉnh sửa" placement="top">
                <el-button type="primary" link @click="openDrawer(row)">
                  <el-icon :size="15"><Edit /></el-icon>
                </el-button>
              </el-tooltip>

              <!-- Nút xóa -->
              <el-tooltip content="Xóa" placement="top">
                <el-button type="danger" link @click="deleteBatch(row)">
                  <el-icon :size="15"><Delete /></el-icon>
                </el-button>
              </el-tooltip>

              <!-- Transition actions theo status -->
              <el-button
                v-if="row.status === 'PLANNING'"
                size="small"
                type="primary"
                @click="transitionStatus(row, 'ENROLLING')"
                class="!text-xs"
              >
                Bắt đầu TS
              </el-button>
              <el-button
                v-if="row.status === 'ENROLLING'"
                size="small"
                type="success"
                @click="transitionStatus(row, 'OPENED')"
                class="!bg-emerald-600 !border-emerald-600 !text-xs"
              >
                Mở khóa
              </el-button>
              <el-button
                v-if="row.status === 'OPENED'"
                size="small"
                type="info"
                @click="transitionStatus(row, 'CLOSED')"
                class="!text-xs"
              >
                Đóng
              </el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="Chưa có kế hoạch khai giảng nào" />
        </template>
      </el-table>

      <!-- Phân trang -->
      <div class="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
        <div class="text-xs text-gray-500">Tổng cộng {{ batches.length }} kế hoạch</div>
      </div>
    </el-card>

    <!-- Drawer tạo/sửa kế hoạch -->
    <el-drawer
      v-model="showDrawer"
      :title="currentBatch.id ? 'Cập nhật Kế hoạch Khai giảng' : 'Tạo Kế hoạch Khai giảng mới'"
      size="50%"
      @close="closeDrawer"
      custom-class="premium-drawer"
    >
      <el-form
        :model="currentBatch"
        ref="formRef"
        label-position="top"
        class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1"
        :rules="formRules"
      >
        <!-- Tên kế hoạch -->
        <el-form-item label="Tên kế hoạch" prop="batchName" required class="col-span-2">
          <el-input v-model="currentBatch.batchName" placeholder="VD: IELTS T7/2025 - Lớp A" />
        </el-form-item>

        <!-- Khóa học -->
        <el-form-item label="Khóa học" prop="courseId" required class="col-span-2">
          <el-select
            v-model="currentBatch.courseId"
            placeholder="Chọn khóa học..."
            filterable
            class="w-full"
          >
            <el-option
              v-for="course in allCourses"
              :key="course.id"
              :label="`[${course.code}] ${course.name}`"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <!-- Ngày bắt đầu tuyển sinh -->
        <el-form-item label="Ngày bắt đầu tuyển sinh">
          <el-date-picker
            v-model="currentBatch.enrollmentStartDate"
            type="date"
            placeholder="Chọn ngày..."
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>

        <!-- Ngày kết thúc tuyển sinh -->
        <el-form-item label="Ngày kết thúc tuyển sinh">
          <el-date-picker
            v-model="currentBatch.enrollmentEndDate"
            type="date"
            placeholder="Chọn ngày..."
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>

        <!-- Ngày khai giảng dự kiến -->
        <el-form-item label="Ngày khai giảng dự kiến" class="col-span-2">
          <el-date-picker
            v-model="currentBatch.expectedOpeningDate"
            type="date"
            placeholder="Chọn ngày khai giảng dự kiến..."
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>

        <!-- Quy mô dự kiến -->
        <el-form-item label="Quy mô dự kiến (học viên)">
          <el-input-number v-model="currentBatch.forecastScale" :min="1" class="w-full" />
        </el-form-item>

        <!-- Ghi chú -->
        <el-form-item label="Ghi chú" class="col-span-2">
          <el-input
            v-model="currentBatch.note"
            type="textarea"
            :rows="3"
            placeholder="Nhập ghi chú cho kế hoạch khai giảng..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2 p-4 border-t border-gray-100">
          <el-button @click="closeDrawer">Hủy bỏ</el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="saveBatch"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            {{ currentBatch.id ? 'Cập nhật' : 'Tạo mới' }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!-- Dialog xem chi tiết kế hoạch -->
    <el-dialog
      v-model="showDetailsDialog"
      title="Chi tiết Kế hoạch Khai giảng"
      width="500px"
      destroy-on-close
      custom-class="premium-dialog"
    >
      <div v-if="selectedBatch" class="space-y-4">
        <div class="border-b pb-3">
          <h3 class="text-lg font-bold text-gray-900">{{ selectedBatch.batchName }}</h3>
          <div class="mt-1">
            <el-tag :type="getBatchStatusType(selectedBatch.status)" effect="dark" class="font-bold rounded-md">
              {{ getBatchStatusLabel(selectedBatch.status) }}
            </el-tag>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-y-3 text-sm">
          <div class="text-gray-500 font-medium">Khóa học:</div>
          <div class="col-span-2 text-gray-900 font-semibold">
            [{{ selectedBatch.courseCode }}] {{ selectedBatch.courseName }}
          </div>

          <div class="text-gray-500 font-medium">Quy mô tuyển sinh:</div>
          <div class="col-span-2 text-gray-900">{{ selectedBatch.forecastScale ?? '—' }} học viên</div>

          <div class="text-gray-500 font-medium">Số lớp đã sinh:</div>
          <div class="col-span-2 text-emerald-600 font-bold">
            {{ selectedBatch.generatedClassCount ?? 0 }} lớp
          </div>

          <div class="text-gray-500 font-medium">Thời gian tuyển sinh:</div>
          <div class="col-span-2 text-gray-900">
            <span v-if="selectedBatch.enrollmentStartDate">Từ: {{ formatDate(selectedBatch.enrollmentStartDate) }}</span>
            <span v-if="selectedBatch.enrollmentEndDate"><br />Đến: {{ formatDate(selectedBatch.enrollmentEndDate) }}</span>
            <span v-if="!selectedBatch.enrollmentStartDate && !selectedBatch.enrollmentEndDate">—</span>
          </div>

          <div class="text-gray-500 font-medium">Khai giảng dự kiến:</div>
          <div class="col-span-2 text-teal-700 font-semibold">
            {{ formatDate(selectedBatch.expectedOpeningDate) }}
          </div>

          <div class="text-gray-500 font-medium col-span-3">Ghi chú:</div>
          <div class="col-span-3 bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700 italic min-h-[60px] whitespace-pre-wrap">
            {{ selectedBatch.note || 'Không có ghi chú' }}
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="showDetailsDialog = false">Đóng</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { CourseBatch, Course } from '@/types';
import { Plus, Edit, Refresh, Check, View, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';

// ---- State ----
const batches = ref<CourseBatch[]>([]);
const loading = ref(false);
const saving = ref(false);
const showDrawer = ref(false);
const filterCourseId = ref<number | null>(null);
const filterStatus = ref('');
const filterOpeningDate = ref<string | null>(null);
const showDetailsDialog = ref(false);
const selectedBatch = ref<CourseBatch | null>(null);
const allCourses = ref<Course[]>([]);
const formRef = ref<FormInstance>();

const currentBatch = ref<CourseBatch>({
  courseId: 0,
  batchName: '',
  enrollmentStartDate: '',
  enrollmentEndDate: '',
  expectedOpeningDate: '',
  forecastScale: undefined,
  status: 'PLANNING',
  note: ''
});

const formRules = {
  batchName: [{ required: true, message: 'Tên kế hoạch không được để trống', trigger: 'blur' }],
  courseId: [{ required: true, message: 'Vui lòng chọn khóa học', trigger: 'change' }]
};

// ---- API ----

/** Tải danh sách kế hoạch khai giảng */
const fetchBatches = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterCourseId.value) params.courseId = filterCourseId.value;
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterOpeningDate.value) params.expectedOpeningDate = filterOpeningDate.value;

    const res: any = await api.get('/course-batches', { params });
    if (res.success) {
      batches.value = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
    }
  } catch (err) {
    ElMessage.error('Lỗi khi tải danh sách kế hoạch khai giảng');
  } finally {
    loading.value = false;
  }
};

/** Tải tất cả khóa học cho dropdown */
const fetchAllCourses = async () => {
  try {
    const res: any = await api.get('/courses/all');
    if (res.success) {
      allCourses.value = res.data;
    }
  } catch (err) {
    console.error('Lỗi khi tải khóa học:', err);
  }
};

// ---- Handlers ----

const handleSearch = () => {
  fetchBatches();
};

const resetSearch = () => {
  filterCourseId.value = null;
  filterStatus.value = '';
  filterOpeningDate.value = null;
  fetchBatches();
};

const openDrawer = (batch?: CourseBatch) => {
  if (batch) {
    currentBatch.value = { ...batch };
  } else {
    currentBatch.value = {
      courseId: 0,
      batchName: '',
      enrollmentStartDate: '',
      enrollmentEndDate: '',
      expectedOpeningDate: '',
      forecastScale: undefined,
      status: 'PLANNING',
      note: ''
    };
  }
  showDrawer.value = true;
};

const viewDetails = (batch: CourseBatch) => {
  selectedBatch.value = batch;
  showDetailsDialog.value = true;
};

const deleteBatch = async (batch: CourseBatch) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa kế hoạch khai giảng "${batch.batchName}" không? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa kế hoạch',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    );

    const res: any = await api.delete(`/course-batches/${batch.id}`);
    if (res.success) {
      ElMessage.success('Xóa kế hoạch khai giảng thành công');
      fetchBatches();
    } else {
      ElMessage.error(res.message || 'Xóa thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa kế hoạch khai giảng');
    }
  }
};

const closeDrawer = () => {
  showDrawer.value = false;
};

/** Lưu kế hoạch khai giảng */
const saveBatch = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      let res: any;
      if (currentBatch.value.id) {
        res = await api.put(`/course-batches/${currentBatch.value.id}`, currentBatch.value);
      } else {
        res = await api.post('/course-batches', currentBatch.value);
      }

      if (res.success) {
        ElMessage.success(currentBatch.value.id ? 'Cập nhật thành công' : 'Tạo kế hoạch thành công');
        closeDrawer();
        fetchBatches();
      } else {
        ElMessage.error(res.message || 'Lưu thất bại');
      }
    } catch (err: any) {
      ElMessage.error(err.response?.data?.message || 'Lỗi máy chủ');
    } finally {
      saving.value = false;
    }
  });
};

/** Chuyển trạng thái kế hoạch */
const transitionStatus = async (batch: CourseBatch, newStatus: string) => {
  const actionLabels: Record<string, string> = {
    ENROLLING: 'bắt đầu tuyển sinh',
    OPENED: 'mở khóa học',
    CLOSED: 'đóng kế hoạch'
  };
  const label = actionLabels[newStatus] || 'thay đổi trạng thái';

  try {
    await ElMessageBox.confirm(
      `Xác nhận ${label} kế hoạch "${batch.batchName}"?`,
      'Xác nhận chuyển trạng thái',
      {
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    );

    const res: any = await api.patch(`/course-batches/${batch.id}/status`, { status: newStatus });
    if (res.success) {
      ElMessage.success(`Đã ${label} thành công`);
      fetchBatches();
    } else {
      ElMessage.error(res.message || 'Thao tác thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || 'Lỗi khi chuyển trạng thái');
    }
  }
};

// ---- Helpers ----

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
};

const getBatchStatusType = (status?: string) => {
  const map: Record<string, any> = {
    PLANNING: 'info',
    ENROLLING: 'primary',
    OPENED: 'success',
    CLOSED: '',
    CANCELLED: 'danger'
  };
  return map[status ?? ''] ?? 'info';
};

const getBatchStatusLabel = (status?: string) => {
  const map: Record<string, string> = {
    PLANNING: 'Lập kế hoạch',
    ENROLLING: 'Tuyển sinh',
    OPENED: 'Đã mở',
    CLOSED: 'Đã đóng',
    CANCELLED: 'Đã hủy'
  };
  return map[status ?? ''] ?? status ?? '—';
};

onMounted(() => {
  fetchBatches();
  fetchAllCourses();
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
