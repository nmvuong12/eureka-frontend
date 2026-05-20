<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100">
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
        {{ $t('leave.title') }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">Quản lý đơn xin nghỉ phép của giáo viên, phê duyệt và theo dõi trạng thái.</p>
    </div>

    <!-- Action bar -->
    <div class="flex justify-between items-center">
      <div></div>
      <el-button
        v-if="authStore.isTeacher"
        type="primary"
        @click="openModal()"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md"
      >
        <el-icon class="mr-1"><Plus /></el-icon>
        {{ $t('leave.create') }}
      </el-button>
    </div>

    <!-- Table Card -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0' }">
      <el-table :data="requests" style="width: 100%" stripe class="premium-table" v-loading="loading">
        <el-table-column prop="teacherId" :label="$t('teacher.id')" width="120">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700">{{ row.teacherId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fromDate" :label="$t('leave.from')" width="150">
          <template #default="{ row }">
            <span class="text-gray-600 font-medium">{{ formatDate(row.fromDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="toDate" :label="$t('leave.to')" width="150">
          <template #default="{ row }">
            <span class="text-gray-600 font-medium">{{ formatDate(row.toDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" :label="$t('leave.reason')" min-width="200" show-overflow-tooltip />
        <el-table-column :label="$t('common.status')" width="140">
          <template #default="{ row }">
            <el-tag
              :type="statusTagType(row.status)"
              effect="light"
              class="font-bold rounded-lg"
            >
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip content="Xem chi tiết" placement="top">
                <el-button type="info" link @click="openModal(row, true)">
                  <el-icon :size="16"><View /></el-icon>
                </el-button>
              </el-tooltip>
              <template v-if="authStore.isAdmin || !authStore.isTeacher">
                <el-tooltip v-if="row.status === 'PENDING'" content="Phê duyệt" placement="top">
                  <el-button type="success" link @click="approve(row.id)">
                    <el-icon :size="16"><Check /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="row.status === 'PENDING'" content="Từ chối" placement="top">
                  <el-button type="danger" link @click="reject(row.id)">
                    <el-icon :size="16"><Close /></el-icon>
                  </el-button>
                </el-tooltip>
              </template>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="Không có đơn xin nghỉ nào" />
        </template>
      </el-table>
    </el-card>

    <!-- Drawer Form -->
    <el-drawer
      v-model="showModal"
      :title="isViewOnly ? $t('leave.view_detail') : (formId ? $t('common.edit') : $t('leave.create'))"
      size="480px"
      @close="showModal = false"
      class="premium-drawer"
      custom-class="premium-drawer"
    >
      <el-form :model="form" label-position="top" :disabled="isViewOnly" class="px-2">
        <el-form-item :label="$t('leave.from')" required>
          <el-date-picker
            v-model="form.fromDate"
            type="date"
            class="w-full"
            placeholder="Chọn ngày bắt đầu nghỉ"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item :label="$t('leave.to')" required>
          <el-date-picker
            v-model="form.toDate"
            type="date"
            class="w-full"
            placeholder="Chọn ngày kết thúc nghỉ"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item :label="$t('leave.reason')" required>
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="5"
            placeholder="Nhập lý do xin nghỉ phép..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2 p-4 border-t border-gray-100">
          <template v-if="isViewOnly">
            <el-button
              v-if="formId && currentStatus === 'PENDING'"
              type="primary"
              @click="isViewOnly = false"
              class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
            >
              <el-icon class="mr-1"><Edit /></el-icon>
              {{ $t('common.edit') }}
            </el-button>
          </template>
          <template v-else>
            <el-button @click="showModal = false">{{ $t('common.cancel') }}</el-button>
            <el-button
              type="primary"
              @click="submitRequest"
              :loading="saving"
              class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
            >
              {{ formId ? $t('common.save') : $t('leave.create') }}
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
import { useAuthStore } from '@/stores/auth';
import type { LeaveRequest } from '@/types';
import { Plus, View, Edit, Check, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const requests = ref<LeaveRequest[]>([]);
const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const isViewOnly = ref(false);
const formId = ref<number | null>(null);
const currentStatus = ref<string | null>(null);
const form = ref({ fromDate: '', toDate: '', reason: '' });

/** Format ngày về dạng DD/MM/YYYY */
const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN');
};

/** Trả về kiểu tag Element Plus theo trạng thái đơn */
const statusTagType = (status: string): 'warning' | 'success' | 'danger' | 'info' => {
  const map: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
  };
  return map[status] ?? 'info';
};

/** Trả về nhãn hiển thị theo trạng thái */
const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  };
  return map[status] ?? status;
};

/** Tải danh sách đơn nghỉ phép */
const fetchRequests = async () => {
  loading.value = true;
  try {
    const endpoint = authStore.isTeacher ? '/leave-requests/my-requests' : '/leave-requests';
    const res: any = await api.get(endpoint);
    if (res.success) requests.value = res.data;
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
};

/** Mở drawer tạo mới hoặc xem chi tiết đơn nghỉ */
const openModal = (req?: LeaveRequest, viewOnly: boolean = false) => {
  isViewOnly.value = viewOnly;
  if (req) {
    formId.value = req.id || null;
    currentStatus.value = req.status || null;
    form.value = { fromDate: req.fromDate, toDate: req.toDate, reason: req.reason };
  } else {
    formId.value = null;
    currentStatus.value = null;
    form.value = { fromDate: '', toDate: '', reason: '' };
  }
  showModal.value = true;
};

/** Gửi yêu cầu tạo mới hoặc cập nhật đơn nghỉ */
const submitRequest = async () => {
  if (!form.value.fromDate || !form.value.toDate || !form.value.reason) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin');
    return;
  }
  saving.value = true;
  try {
    let res: any;
    if (formId.value) {
      res = await api.put(`/leave-requests/${formId.value}`, form.value);
    } else {
      res = await api.post('/leave-requests', form.value);
    }
    if (res.success) {
      showModal.value = false;
      fetchRequests();
      ElMessage.success(t('leave.success') || 'Gửi đơn nghỉ phép thành công');
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('common.error'));
  } finally {
    saving.value = false;
  }
};

/** Phê duyệt đơn nghỉ (chỉ dành cho Admin/Giáo vụ) */
const approve = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      t('leave.confirm_approve') || 'Bạn có chắc chắn muốn phê duyệt đơn nghỉ này?',
      'Xác nhận phê duyệt',
      { type: 'warning', confirmButtonText: 'Phê duyệt', cancelButtonText: t('common.cancel') }
    );
    const res: any = await api.put(`/leave-requests/${id}/approve`);
    if (res.success) {
      fetchRequests();
      ElMessage.success('Đã phê duyệt đơn nghỉ phép');
    }
  } catch {
    // Người dùng hủy - không làm gì
  }
};

/** Từ chối đơn nghỉ (chỉ dành cho Admin/Giáo vụ) */
const reject = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn từ chối đơn nghỉ này?',
      'Xác nhận từ chối',
      { type: 'error', confirmButtonText: 'Từ chối', cancelButtonText: t('common.cancel') }
    );
    const res: any = await api.put(`/leave-requests/${id}/reject`);
    if (res.success) {
      fetchRequests();
      ElMessage.success('Đã từ chối đơn nghỉ phép');
    }
  } catch {
    // Người dùng hủy - không làm gì
  }
};

onMounted(fetchRequests);
</script>

<style scoped>
.premium-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  border-radius: 0;
}

:deep(.premium-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 800;
  font-size: 1.1rem;
  color: #0f172a;
}

:deep(.premium-drawer .el-drawer__body) {
  padding: 24px;
}
</style>
