<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100">
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
        Quản lý Phòng học & Ca học
      </h1>
      <p class="text-sm text-gray-500 mt-1">Quản lý danh sách phòng học, sức chứa và danh mục ca học theo thời khóa biểu.</p>
    </div>

    <!-- Rooms Section -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '24px' }">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <el-icon class="text-emerald-500"><OfficeBuilding /></el-icon>
          {{ $t('room.title') }}
        </h2>
        <el-button
          type="primary"
          @click="openRoomModal()"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300"
        >
          <el-icon class="mr-1"><Plus /></el-icon>
          {{ $t('room.create') }}
        </el-button>
      </div>

      <el-table :data="rooms" style="width: 100%" stripe class="premium-table" v-loading="loading">
        <el-table-column prop="name" :label="$t('room.name')" min-width="180">
          <template #default="{ row }">
            <span class="font-bold text-gray-900 hover:text-emerald-600 transition-colors duration-200">
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" :label="$t('room.capacity')" width="160">
          <template #default="{ row }">
            <span class="font-semibold text-gray-700">{{ row.capacity }} chỗ ngồi</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="150">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'ACTIVE' ? 'success' : 'danger'"
              effect="light"
              class="font-bold rounded-lg"
            >
              {{ row.status === 'ACTIVE' ? $t('room.status_active') : $t('room.status_inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="Xem chi tiết" placement="top">
              <el-button type="info" link @click="openRoomModal(row, true)" class="hover:!text-blue-600">
                <el-icon :size="16"><View /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="Không có dữ liệu phòng học" />
        </template>
      </el-table>
    </el-card>

    <!-- Timeslots Section -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '24px' }">
      <div class="flex items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <el-icon class="text-emerald-500"><Clock /></el-icon>
          {{ $t('timeslot.title') }}
        </h2>
      </div>

      <el-table :data="timeslots" style="width: 100%" stripe class="premium-table">
        <el-table-column prop="dayOfWeek" :label="$t('timeslot.day')" width="160">
          <template #default="{ row }">
            <span class="font-semibold text-emerald-700">{{ formatDay(row.dayOfWeek) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" :label="$t('timeslot.start')" width="140">
          <template #default="{ row }">
            <span class="font-medium text-gray-700">{{ row.startTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="endTime" :label="$t('timeslot.end')" width="140">
          <template #default="{ row }">
            <span class="font-medium text-gray-700">{{ row.endTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="label" :label="$t('timeslot.label')" min-width="200">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" class="rounded-lg">{{ row.label }}</el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="Không có dữ liệu ca học" />
        </template>
      </el-table>
    </el-card>

    <!-- Room Drawer -->
    <el-drawer
      v-model="showRoomModal"
      :title="isViewOnly ? $t('room.view_detail') : (roomForm.id ? $t('common.edit') : $t('room.create'))"
      size="450px"
      @close="showRoomModal = false"
      class="premium-drawer"
      custom-class="premium-drawer"
    >
      <el-form :model="roomForm" label-position="top" :disabled="isViewOnly" class="px-2">
        <el-form-item :label="$t('room.name')" required>
          <el-input v-model="roomForm.name" placeholder="Nhập tên phòng học (VD: P101)..." />
        </el-form-item>
        <el-form-item :label="$t('room.capacity')" required>
          <el-input-number v-model="roomForm.capacity" :min="1" :max="500" class="w-full" />
        </el-form-item>
        <el-form-item :label="$t('common.status')" required>
          <el-select v-model="roomForm.status" class="w-full" :placeholder="$t('common.placeholder_select')">
            <el-option value="ACTIVE" :label="$t('room.status_active')" />
            <el-option value="INACTIVE" :label="$t('room.status_inactive')" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2 p-4 border-t border-gray-100">
          <template v-if="isViewOnly">
            <el-button
              type="primary"
              @click="isViewOnly = false"
              class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
            >
              <el-icon class="mr-1"><Edit /></el-icon>
              {{ $t('common.edit') }}
            </el-button>
          </template>
          <template v-else>
            <el-button @click="showRoomModal = false">{{ $t('common.cancel') }}</el-button>
            <el-button
              type="primary"
              @click="saveRoom"
              :loading="saving"
              class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
            >
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
import type { Room, Timeslot } from '@/types';
import { Plus, View, Edit, OfficeBuilding, Clock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const rooms = ref<Room[]>([]);
const timeslots = ref<Timeslot[]>([]);
const loading = ref(false);
const saving = ref(false);

const showRoomModal = ref(false);
const isViewOnly = ref(false);
const roomForm = ref<Room>({ name: '', capacity: 20, status: 'ACTIVE' });

/** Map tên ngày từ tiếng Anh sang tiếng Việt */
const formatDay = (day: string) => {
  const map: Record<string, string> = {
    MONDAY: 'Thứ Hai', TUESDAY: 'Thứ Ba', WEDNESDAY: 'Thứ Tư',
    THURSDAY: 'Thứ Năm', FRIDAY: 'Thứ Sáu', SATURDAY: 'Thứ Bảy', SUNDAY: 'Chủ Nhật',
  };
  return map[day] ?? day;
};

/** Tải dữ liệu phòng học và ca học */
const fetchData = async () => {
  loading.value = true;
  try {
    const [resRooms, resTimeslots] = await Promise.all([
      api.get('/rooms'),
      api.get('/timeslots')
    ]);
    rooms.value = (resRooms as any).data;
    timeslots.value = (resTimeslots as any).data;
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
};

/** Mở drawer tạo mới hoặc xem chi tiết phòng học */
const openRoomModal = (room?: Room, viewOnly: boolean = false) => {
  isViewOnly.value = viewOnly;
  if (room) {
    roomForm.value = { ...room };
  } else {
    roomForm.value = { name: '', capacity: 20, status: 'ACTIVE' };
  }
  showRoomModal.value = true;
};

/** Lưu thông tin phòng học mới hoặc cập nhật */
const saveRoom = async () => {
  if (!roomForm.value.name) {
    ElMessage.warning('Tên phòng học không được bỏ trống');
    return;
  }
  saving.value = true;
  try {
    const res: any = await api.post('/rooms', roomForm.value);
    if (res.success) {
      showRoomModal.value = false;
      fetchData();
      ElMessage.success('Lưu thông tin phòng học thành công');
    } else {
      ElMessage.error(res.message || 'Lưu thất bại');
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('common.error'));
  } finally {
    saving.value = false;
  }
};

onMounted(fetchData);
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
