<template>
  <div class="class-list space-y-6">
    <!-- Page Header với thanh dọc màu emerald -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          Danh sách Lớp học
        </h1>
        <p class="text-sm text-gray-500 mt-1">Theo dõi toàn bộ lớp học, trạng thái và lịch sử thay đổi.</p>
      </div>
    </div>

    <!-- Toolbar: Bộ lọc -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl" :body-style="{ padding: '16px 24px' }">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Tìm kiếm tự do -->
        <el-input
          v-model="searchQuery"
          placeholder="Tìm mã lớp, tên lớp..."
          clearable
          class="w-56"
          @keyup.enter="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <!-- Lọc kế hoạch khai giảng -->
        <el-select
          v-model="filterBatchId"
          placeholder="Kế hoạch khai giảng"
          clearable
          filterable
          class="w-56"
          @change="handleSearch"
        >
          <el-option
            v-for="batch in allBatches"
            :key="batch.id"
            :label="batch.batchName"
            :value="batch.id"
          />
        </el-select>

        <!-- Lọc lịch học (pattern) -->
        <el-select
          v-model="filterPatternId"
          placeholder="Lịch học (Pattern)"
          clearable
          filterable
          class="w-48"
          @change="handleSearch"
        >
          <el-option
            v-for="pattern in allPatterns"
            :key="pattern.id"
            :label="pattern.displayLabel || pattern.code"
            :value="pattern.id"
          />
        </el-select>

        <!-- Lọc trạng thái -->
        <el-select v-model="filterStatus" placeholder="Trạng thái" clearable class="w-40" @change="handleSearch">
          <el-option label="Bản nháp" value="DRAFT" />
          <el-option label="Đang tuyển sinh" value="ENROLLING" />
          <el-option label="Cân bằng sĩ số" value="REBALANCING" />
          <el-option label="Đã mở lớp" value="OPEN" />
          <el-option label="Đang học" value="STUDYING" />
          <el-option label="Hoàn thành" value="FINISHED" />
          <el-option label="Đã hủy" value="CANCELLED" />
        </el-select>

        <el-button type="primary" @click="handleSearch" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
          <el-icon class="mr-1"><Search /></el-icon>
          Tìm kiếm
        </el-button>
        <el-button @click="resetSearch">
          <el-icon class="mr-1"><Refresh /></el-icon>
          Đặt lại
        </el-button>
      </div>
    </el-card>

    <!-- Bảng danh sách lớp học -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0px' }">
      <el-table
        :data="classes"
        v-loading="loading"
        style="width: 100%"
        stripe
        class="premium-table"
      >
        <!-- Mã lớp -->
        <el-table-column prop="classCode" label="Mã lớp" width="150">
          <template #default="{ row }">
            <div class="flex items-center gap-1.5">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {{ row.classCode || `#${row.id}` }}
              </span>
              <el-tooltip v-if="row.note" :content="row.note" placement="top" effect="dark">
                <el-icon class="text-amber-500 cursor-help" :size="14"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <!-- Kế hoạch / Khóa học -->
        <el-table-column label="Kế hoạch / Khóa học" min-width="180">
          <template #default="{ row }">
            <div class="font-semibold text-gray-800">{{ row.batchName || '—' }}</div>
            <div class="text-xs text-gray-500 mt-0.5">{{ row.courseName || '—' }}</div>
          </template>
        </el-table-column>

        <!-- Lịch học -->
        <el-table-column label="Lịch học" width="160">
          <template #default="{ row }">
            <span v-if="row.patternLabel || row.patternCode" class="text-sm text-teal-700 font-semibold">
              {{ row.patternLabel || row.patternCode }}
            </span>
            <span v-else class="text-gray-400 text-xs">Chưa phân</span>
          </template>
        </el-table-column>

        <!-- Giáo viên -->
        <el-table-column label="Giáo viên" width="160">
          <template #default="{ row }">
            <span v-if="row.teacherName" class="text-sm text-gray-700">{{ row.teacherName }}</span>
            <span v-else class="text-gray-400 text-xs italic">Chưa phân công</span>
          </template>
        </el-table-column>

        <!-- Sĩ số -->
        <el-table-column label="Sĩ số" width="100" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1 font-semibold text-gray-700">
              <span class="text-emerald-600">{{ row.studentCount ?? 0 }}</span>
              <span class="text-gray-300">/</span>
              <span class="text-gray-500">{{ row.studentSize ?? 0 }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- Trạng thái -->
        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getClassStatusType(row.status)"
              :class="getClassStatusClass(row.status)"
              effect="dark"
              class="font-bold rounded-md"
            >
              {{ getClassStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Ngày khai giảng -->
        <el-table-column label="Ngày khai giảng" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.actualOpeningDate || row.startDate" class="text-sm text-gray-700">
              {{ formatDate(row.actualOpeningDate || row.startDate) }}
            </span>
            <span v-else class="text-gray-400 text-xs">—</span>
          </template>
        </el-table-column>

        <!-- Thao tác -->
        <el-table-column label="Thao tác" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1">
              <el-tooltip content="Chỉnh sửa thông tin" placement="top">
                <el-button type="primary" link @click="openEditDialog(row)">
                  <el-icon :size="16"><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Xem lịch sử thay đổi" placement="top">
                <el-button type="info" link @click="openLogDialog(row)">
                  <el-icon :size="16"><Document /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Xóa lớp học" placement="top">
                <el-button type="danger" link @click="handleDeleteClass(row)">
                  <el-icon :size="16"><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="Không tìm thấy lớp học nào" />
        </template>
      </el-table>

      <!-- Footer info -->
      <div class="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
        <div class="text-xs text-gray-500">Hiển thị {{ classes.length }} lớp học</div>
      </div>
    </el-card>

    <!-- Dialog xem audit log -->
    <el-dialog
      v-model="showLogDialog"
      :title="`Lịch sử thay đổi - Lớp ${selectedClass?.classCode || '#' + selectedClass?.id}`"
      width="60%"
      destroy-on-close
    >
      <div v-loading="logLoading">
        <el-table :data="classLogs" stripe class="w-full">
          <!-- Thời gian -->
          <el-table-column label="Thời gian" width="160">
            <template #default="{ row }">
              <span class="text-xs text-gray-500">{{ formatDateTime(row.createdAt) }}</span>
            </template>
          </el-table-column>

          <!-- Hành động -->
          <el-table-column prop="action" label="Hành động" width="140">
            <template #default="{ row }">
              <span class="font-semibold text-teal-700">{{ row.action }}</span>
            </template>
          </el-table-column>

          <!-- Thay đổi trạng thái -->
          <el-table-column label="Trạng thái" width="200">
            <template #default="{ row }">
              <div v-if="row.oldStatus || row.newStatus" class="flex items-center gap-2 text-xs">
                <el-tag v-if="row.oldStatus" size="small" type="info">{{ row.oldStatus }}</el-tag>
                <span v-if="row.oldStatus && row.newStatus">→</span>
                <el-tag v-if="row.newStatus" size="small" type="success">{{ row.newStatus }}</el-tag>
              </div>
            </template>
          </el-table-column>

          <!-- Ghi chú -->
          <el-table-column prop="note" label="Ghi chú" min-width="150">
            <template #default="{ row }">
              <span class="text-gray-600 text-sm">{{ row.note || '—' }}</span>
            </template>
          </el-table-column>

          <!-- Người thực hiện -->
          <el-table-column prop="createdBy" label="Thực hiện bởi" width="130">
            <template #default="{ row }">
              <span class="text-gray-500 text-xs">{{ row.createdBy || 'System' }}</span>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="Chưa có lịch sử thay đổi" :image-size="60" />
          </template>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="showLogDialog = false">Đóng</el-button>
      </template>
    </el-dialog>

    <!-- Dialog chỉnh sửa lớp học -->
    <el-dialog
      v-model="editDialogVisible"
      title="Cập nhật chi tiết Lớp học"
      width="500px"
      destroy-on-close
      class="premium-dialog"
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Tên lớp học / Mã lớp" required>
          <el-input v-model="editForm.name" placeholder="Nhập tên hoặc mã lớp (VD: IELTS_A)" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Sĩ số tối đa">
              <el-input-number
                v-model="editForm.studentSize"
                :min="0"
                class="w-full"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Giáo viên phụ trách">
              <el-select
                v-model="editForm.teacherId"
                placeholder="Chọn giáo viên"
                clearable
                filterable
                class="w-full"
              >
                <el-option
                  v-for="teacher in teachersList"
                  :key="teacher.id"
                  :label="`${teacher.fullName} (${teacher.teacherCode})`"
                  :value="teacher.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Ghi chú">
          <el-input
            v-model="editForm.note"
            type="textarea"
            :rows="3"
            placeholder="Nhập ghi chú lớp học..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="editDialogVisible = false">Hủy</el-button>
          <el-button
            type="primary"
            :loading="submittingEdit"
            @click="submitEditForm"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
          >
            Lưu thay đổi
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { SchoolClass, ClassPlanningLog, CourseBatch, SchedulePattern } from '@/types';
import { Search, Refresh, Document, Edit, Delete, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// ---- State ----
const classes = ref<SchoolClass[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const filterBatchId = ref<number | null>(null);
const filterPatternId = ref<number | null>(null);
const filterStatus = ref('');
const allBatches = ref<CourseBatch[]>([]);
const allPatterns = ref<SchedulePattern[]>([]);

// Audit log dialog
const showLogDialog = ref(false);
const logLoading = ref(false);
const classLogs = ref<ClassPlanningLog[]>([]);
const selectedClass = ref<SchoolClass | null>(null);

// Edit class dialog
const editDialogVisible = ref(false);
const submittingEdit = ref(false);
const teachersList = ref<any[]>([]);
const editForm = ref({
  id: null as number | null,
  name: '',
  studentSize: 0,
  teacherId: null as number | null,
  note: ''
});

// ---- API ----

/** Tải danh sách lớp học */
const fetchClasses = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterBatchId.value) params.batchId = filterBatchId.value;
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterPatternId.value) params.patternId = filterPatternId.value;
    if (searchQuery.value) params.search = searchQuery.value;

    const res: any = await api.get('/class-planning/classes', { params });
    if (res.success) {
      classes.value = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
    }
  } catch (err) {
    ElMessage.error('Lỗi khi tải danh sách lớp học');
  } finally {
    loading.value = false;
  }
};

/** Tải danh sách kế hoạch khai giảng cho dropdown lọc */
const fetchAllBatches = async () => {
  try {
    const res: any = await api.get('/course-batches');
    if (res.success) {
      allBatches.value = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
    }
  } catch (err) {
    console.error('Lỗi khi tải kế hoạch:', err);
  }
};

/** Tải danh sách pattern lịch học cho dropdown lọc */
const fetchAllPatterns = async () => {
  try {
    const res: any = await api.get('/class-planning/patterns');
    if (res.success) {
      allPatterns.value = Array.isArray(res.data) ? res.data : [];
    }
  } catch (err) {
    console.error('Lỗi khi tải patterns:', err);
  }
};

/** Tải audit log của lớp học */
const fetchClassLog = async (classId: number) => {
  logLoading.value = true;
  try {
    const res: any = await api.get(`/class-planning/classes/${classId}/log`);
    if (res.success) {
      classLogs.value = Array.isArray(res.data) ? res.data : [];
    }
  } catch (err) {
    ElMessage.error('Lỗi khi tải lịch sử thay đổi');
    classLogs.value = [];
  } finally {
    logLoading.value = false;
  }
};

// ---- Handlers ----

const handleSearch = () => {
  fetchClasses();
};

const resetSearch = () => {
  searchQuery.value = '';
  filterBatchId.value = null;
  filterPatternId.value = null;
  filterStatus.value = '';
  fetchClasses();
};

/** Mở dialog xem audit log */
const openLogDialog = async (classItem: SchoolClass) => {
  selectedClass.value = classItem;
  classLogs.value = [];
  showLogDialog.value = true;
  if (classItem.id) {
    await fetchClassLog(classItem.id);
  }
};

// ---- Helpers ----

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN');
};

/** Lấy loại tag theo trạng thái lớp (7 trạng thái) */
const getClassStatusType = (status?: string) => {
  const map: Record<string, any> = {
    DRAFT: 'info',
    ENROLLING: 'primary',
    REBALANCING: 'warning',
    OPEN: 'success',
    STUDYING: '',
    FINISHED: '',
    CANCELLED: 'danger'
  };
  return map[status ?? ''] ?? '';
};

/** Thêm class tùy chỉnh cho trạng thái đặc biệt */
const getClassStatusClass = (status?: string) => {
  if (status === 'STUDYING') return 'status-studying';
  if (status === 'FINISHED') return 'status-finished';
  return '';
};

/** Lấy nhãn hiển thị theo trạng thái lớp */
const getClassStatusLabel = (status?: string) => {
  const map: Record<string, string> = {
    DRAFT: 'Bản nháp',
    ENROLLING: 'Tuyển sinh',
    REBALANCING: 'Cân bằng SS',
    OPEN: 'Đã mở',
    STUDYING: 'Đang học',
    FINISHED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
  };
  return map[status ?? ''] ?? status ?? '—';
};

/** Tải danh sách giáo viên */
const fetchTeachersList = async () => {
  try {
    const res: any = await api.get('/teachers/all');
    if (res.success) {
      teachersList.value = res.data || [];
    }
  } catch (err) {
    console.error('Lỗi khi tải danh sách giáo viên:', err);
  }
};

/** Mở dialog chỉnh sửa */
const openEditDialog = (row: SchoolClass) => {
  editForm.value = {
    id: row.id || null,
    name: row.name || row.classCode || '',
    studentSize: row.studentSize ?? 0,
    teacherId: row.teacherId || null,
    note: row.note || ''
  };
  editDialogVisible.value = true;
};

/** Gửi form cập nhật */
const submitEditForm = async () => {
  if (!editForm.value.id) return;
  if (!editForm.value.name.trim()) {
    ElMessage.warning('Tên lớp học không được bỏ trống');
    return;
  }
  submittingEdit.value = true;
  try {
    const res: any = await api.put(`/class-planning/classes/${editForm.value.id}`, {
      name: editForm.value.name.trim(),
      studentSize: editForm.value.studentSize,
      teacherId: editForm.value.teacherId,
      note: editForm.value.note.trim()
    });
    if (res.success) {
      ElMessage.success('Cập nhật thông tin lớp học thành công');
      editDialogVisible.value = false;
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Cập nhật thất bại');
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật lớp học';
    ElMessage.error(errorMsg);
  } finally {
    submittingEdit.value = false;
  }
};

/** Xử lý xóa lớp học */
const handleDeleteClass = async (row: SchoolClass) => {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa lớp học "${row.classCode || row.name}" không?`,
      'Xác nhận xóa lớp học',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
        buttonSize: 'default'
      }
    );

    const res: any = await api.delete(`/class-planning/classes/${row.id}`);
    if (res.success) {
      ElMessage.success('Xóa lớp học thành công');
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Xóa lớp học thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xóa lớp học';
      ElMessage.error(errorMsg);
    }
  }
};

onMounted(() => {
  fetchClasses();
  fetchAllBatches();
  fetchAllPatterns();
  fetchTeachersList();
});
</script>

<style scoped>
.premium-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  border-radius: 12px;
}

/* Trạng thái STUDYING - màu teal tùy chỉnh */
:deep(.status-studying) {
  background-color: #0d9488 !important;
  border-color: #0d9488 !important;
  color: white !important;
}

/* Trạng thái FINISHED - màu xám */
:deep(.status-finished) {
  background-color: #64748b !important;
  border-color: #64748b !important;
  color: white !important;
}
</style>
