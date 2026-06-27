<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100">
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
        {{ $t('room.title_page') }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">{{ $t('room.desc') }}</p>
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
            <span class="font-semibold text-gray-700">{{ $t('room.col_capacity_val', { count: row.capacity }) }}</span>
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
            <el-tooltip :content="$t('account.tooltip_detail')" placement="top">
              <el-button type="info" link @click="openRoomModal(row, true)" class="hover:!text-blue-600">
                <el-icon :size="16"><View /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('room.empty')" />
        </template>
      </el-table>
    </el-card>

    <!-- Timeslots Section (Giao diện gom nhóm Ca học thông minh) -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '24px' }">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <el-icon class="text-emerald-500"><Clock /></el-icon>
            {{ $t('room.title_timeslots') }}
          </h2>
          <p class="text-xs text-gray-400 mt-1">{{ $t('room.desc_timeslots') }}</p>
        </div>
        <el-button
          type="primary"
          @click="openAddTimeslotDrawer()"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300"
        >
          <el-icon class="mr-1"><Plus /></el-icon>
          {{ $t('room.btn_add_timeslot') }}
        </el-button>
      </div>

      <el-table :data="groupedTimeslots" style="width: 100%" stripe class="premium-table" v-loading="loading">
        <el-table-column prop="caName" :label="$t('room.col_timeslot')" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" class="!bg-teal-50 !text-teal-700 !border-teal-100 font-extrabold text-[12px]">
              {{ row.caName.startsWith('Ca') ? $t('timetable.ca') + ' ' + row.caName.substring(3) : row.caName }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('room.col_time_range')" width="180" align="center">
          <template #default="{ row }">
            <span class="font-extrabold text-gray-700">{{ row.startTime }} - {{ row.endTime }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('room.col_active_days')" min-width="320">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="(_, dayKey) in weekDays"
                :key="dayKey"
                :type="row.dayMap[dayKey].active ? getDayTagType(dayKey) : 'info'"
                :effect="row.dayMap[dayKey].active ? 'dark' : 'plain'"
                class="cursor-pointer font-bold !px-3.5 hover:scale-105 transition-all duration-200 select-none"
                @click="toggleDay(row.caName, dayKey, row.dayMap[dayKey], row.startTime, row.endTime)"
              >
                {{ $t('dashboard.' + dayKey.substring(0, 3).toLowerCase()) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('common.actions')" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <div class="flex justify-center gap-2">
              <el-tooltip :content="$t('room.tooltip_edit_time')" placement="top">
                <el-button type="primary" link @click="openEditTimeDialog(row)" class="hover:!text-emerald-600">
                  <el-icon :size="16"><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('room.tooltip_delete_ca')" placement="top">
                <el-button type="danger" link @click="handleDeleteCaRow(row)" class="hover:!text-rose-600">
                  <el-icon :size="16"><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('room.empty_timeslots')" />
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
          <el-input v-model="roomForm.name" :placeholder="$t('room.placeholder_name')" />
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

    <!-- Dialog chỉnh sửa KHUNG GIỜ ca học đồng bộ -->
    <el-dialog
      v-model="showEditTimeDialog"
      :title="$t('room.dialog_edit_time_title')"
      width="450px"
      destroy-on-close
    >
      <el-form :model="editTimeForm" label-position="top" class="space-y-4">
        <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-2">
          <p class="text-sm text-emerald-800 font-bold flex items-center gap-1.5">
            <el-icon><InfoFilled /></el-icon>
            {{ $t('room.dialog_edit_time_sync', { ca: editTimeForm.caName.startsWith('Ca') ? $t('timetable.ca') + ' ' + editTimeForm.caName.substring(3) : editTimeForm.caName }) }}
          </p>
          <p class="text-xs text-emerald-700 mt-1.5 leading-relaxed">
            {{ $t('room.dialog_edit_time_desc') }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('room.form_start')" required>
            <el-time-picker
              v-model="editTimeForm.startTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="08:00"
              class="w-full"
            />
          </el-form-item>
          <el-form-item :label="$t('room.form_end')" required>
            <el-time-picker
              v-model="editTimeForm.endTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="10:00"
              class="w-full"
            />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <el-button @click="showEditTimeDialog = false">{{ $t('room.btn_cancel') }}</el-button>
          <el-button
            type="primary"
            @click="saveTimeChange"
            :loading="savingTimeslot"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-bold"
          >
            {{ $t('room.btn_update_time') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Drawer thêm mới ca học custom hoàn toàn (Ca 6, Ca 7...) -->
    <el-drawer
      v-model="showAddTimeslotDrawer"
      :title="$t('room.dialog_create_timeslot')"
      size="450px"
      class="premium-drawer"
      custom-class="premium-drawer"
    >
      <el-form :model="addTimeslotForm" label-position="top" class="px-2">
        <el-form-item :label="$t('room.form_ca_num')" required>
          <el-input-number v-model="addTimeslotForm.caNumber" :min="1" :max="20" class="w-full" />
        </el-form-item>
        <el-form-item :label="$t('room.form_active_days')" required>
          <el-checkbox-group v-model="addTimeslotForm.selectedDays" class="flex flex-wrap gap-2 mt-1">
            <el-checkbox-button label="MONDAY">{{ $t('dashboard.mon') }}</el-checkbox-button>
            <el-checkbox-button label="TUESDAY">{{ $t('dashboard.tue') }}</el-checkbox-button>
            <el-checkbox-button label="WEDNESDAY">{{ $t('dashboard.wed') }}</el-checkbox-button>
            <el-checkbox-button label="THURSDAY">{{ $t('dashboard.thu') }}</el-checkbox-button>
            <el-checkbox-button label="FRIDAY">{{ $t('dashboard.fri') }}</el-checkbox-button>
            <el-checkbox-button label="SATURDAY">{{ $t('dashboard.sat') }}</el-checkbox-button>
            <el-checkbox-button label="SUNDAY">{{ $t('dashboard.sun') }}</el-checkbox-button>
          </el-checkbox-group>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('room.form_start')" required>
            <el-time-picker
              v-model="addTimeslotForm.startTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="21:15"
              class="w-full"
            />
          </el-form-item>
          <el-form-item :label="$t('room.form_end')" required>
            <el-time-picker
              v-model="addTimeslotForm.endTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="22:45"
              class="w-full"
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2 p-4 border-t border-gray-100">
          <el-button @click="showAddTimeslotDrawer = false">{{ $t('common.cancel') }}</el-button>
          <el-button
            type="primary"
            @click="saveNewTimeslot"
            :loading="savingTimeslot"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-bold"
          >
            {{ $t('room.btn_create_timeslot') }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/api/axios';
import type { Room, Timeslot } from '@/types';
import { Plus, View, Edit, Clock, OfficeBuilding, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const rooms = ref<Room[]>([]);
const timeslots = ref<Timeslot[]>([]);
const loading = ref(false);
const saving = ref(false);

const showRoomModal = ref(false);
const isViewOnly = ref(false);
const roomForm = ref<Room>({ name: '', capacity: 20, status: 'ACTIVE' });

// Tần suất các ngày trong tuần
const weekDays = {
  MONDAY: 'T2',
  TUESDAY: 'T3',
  WEDNESDAY: 'T4',
  THURSDAY: 'T5',
  FRIDAY: 'T6',
  SATURDAY: 'T7',
  SUNDAY: 'CN'
};

// Drawer/Dialog controls
const showEditTimeDialog = ref(false);
const showAddTimeslotDrawer = ref(false);
const savingTimeslot = ref(false);

const editTimeForm = ref({
  caName: '',
  startTime: '',
  endTime: '',
  activeDayIds: [] as number[]
});

const addTimeslotForm = ref({
  caNumber: 6,
  selectedDays: [] as string[],
  startTime: '',
  endTime: ''
});

/** Map tên ngày từ tiếng Anh sang tiếng Việt/Anh thông qua i18n */
const formatDay = (day: string) => {
  return t(`leave.day_${day.toLowerCase()}`);
};

// Loại nhãn Tag màu theo ngày học
const getDayTagType = (day: string) => {
  switch (day) {
    case 'SUNDAY': return 'danger';
    case 'SATURDAY': return 'warning';
    default: return 'success';
  }
};

// Hàm phân tích tên ca học từ nhãn (VD: "Thứ 2 - Ca 1" -> "Ca 1")
const getCaName = (label: string) => {
  if (!label) return t('common.none');
  const match = label.match(/Ca\s*(\d+)/i);
  return match ? `Ca ${match[1]}` : label;
};

// Gom nhóm danh sách ca học từ DB thành các ca học tổng quát Ca 1 - Ca 5
const groupedTimeslots = computed(() => {
  const groups: Record<string, { startTime: string, endTime: string, dayMap: Record<string, { active: boolean, id?: number }> }> = {};
  
  // Khởi tạo sẵn Ca 1 - Ca 5 để luôn hiển thị mặc định trên bảng
  for (let i = 1; i <= 5; i++) {
    const caName = `Ca ${i}`;
    let defStart = '07:30';
    let defEnd = '09:00';
    if (i === 2) { defStart = '09:15'; defEnd = '10:45'; }
    else if (i === 3) { defStart = '13:30'; defEnd = '15:00'; }
    else if (i === 4) { defStart = '15:15'; defEnd = '16:45'; }
    else if (i === 5) { defStart = '18:00'; defEnd = '19:30'; }

    groups[caName] = {
      startTime: defStart,
      endTime: defEnd,
      dayMap: {
        MONDAY: { active: false },
        TUESDAY: { active: false },
        WEDNESDAY: { active: false },
        THURSDAY: { active: false },
        FRIDAY: { active: false },
        SATURDAY: { active: false },
        SUNDAY: { active: false }
      }
    };
  }

  // Đè dữ liệu thực tế từ database vào
  timeslots.value.forEach(ts => {
    const caName = getCaName(ts.label);
    if (!groups[caName]) {
      groups[caName] = {
        startTime: ts.startTime,
        endTime: ts.endTime,
        dayMap: {
          MONDAY: { active: false },
          TUESDAY: { active: false },
          WEDNESDAY: { active: false },
          THURSDAY: { active: false },
          FRIDAY: { active: false },
          SATURDAY: { active: false },
          SUNDAY: { active: false }
        }
      };
    }
    groups[caName].startTime = ts.startTime;
    groups[caName].endTime = ts.endTime;
    groups[caName].dayMap[ts.dayOfWeek] = { active: true, id: ts.id };
  });

  return Object.keys(groups).map(key => ({
    caName: key,
    startTime: groups[key].startTime,
    endTime: groups[key].endTime,
    dayMap: groups[key].dayMap
  })).sort((a, b) => {
    // Sắp xếp tăng dần theo mã ca học Ca 1 -> Ca 5
    const numA = parseInt(a.caName.replace(/\D/g, ''), 10) || 99;
    const numB = parseInt(b.caName.replace(/\D/g, ''), 10) || 99;
    return numA - numB;
  });
});

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
    ElMessage.error(t('room.error_load'));
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
    ElMessage.warning(t('room.warn_empty_name'));
    return;
  }
  saving.value = true;
  try {
    const res: any = await api.post('/rooms', roomForm.value);
    if (res.success) {
      showRoomModal.value = false;
      fetchData();
      ElMessage.success(t('room.success_save_room'));
    } else {
      ElMessage.error(res.message || t('room.success_save_room_failed'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('room.error_load'));
  } finally {
    saving.value = false;
  }
};

// Toggle Bật / Tắt ngày học của Ca đó trực tiếp từ Tag click
const toggleDay = async (caName: string, dayOfWeek: string, current: { active: boolean, id?: number }, startTime: string, endTime: string) => {
  const dayLabelMap: Record<string, string> = {
    MONDAY: 'Thứ 2', TUESDAY: 'Thứ 3', WEDNESDAY: 'Thứ 4',
    THURSDAY: 'Thứ 5', FRIDAY: 'Thứ 6', SATURDAY: 'Thứ 7', SUNDAY: 'CN'
  };
  const dayLabel = dayLabelMap[dayOfWeek] || dayOfWeek;
  const label = `${dayLabel} - ${caName}`;

  const displayCaName = caName.startsWith('Ca') ? t('timetable.ca') + ' ' + caName.substring(3) : caName;

  if (current.active && current.id) {
    // Đã kích hoạt -> Click để TẮT (Gửi lệnh Xóa ca học khỏi Database)
    ElMessageBox.confirm(
      t('room.confirm_deactivate_text', { caName: displayCaName, day: formatDay(dayOfWeek) }),
      t('room.confirm_deactivate_title'),
      {
        confirmButtonText: t('room.btn_deactivate_confirm'),
        cancelButtonText: t('room.btn_deactivate_cancel'),
        type: 'warning'
      }
    ).then(async () => {
      loading.value = true;
      try {
        const res: any = await api.delete(`/timeslots/${current.id}`);
        if (res.success) {
          ElMessage.success(t('room.success_deactivate', { caName: displayCaName, day: formatDay(dayOfWeek) }));
          fetchData();
        } else {
          ElMessage.error(res.message || t('room.success_save_room_failed'));
        }
      } catch (err: any) {
        ElMessage.error(err.response?.data?.message || t('room.error_deactivate_referenced'));
      } finally {
        loading.value = false;
      }
    }).catch(() => {});
  } else {
    // Đang xám tắt -> Click để BẬT (Gửi lệnh Tạo mới ca học lên Database)
    loading.value = true;
    try {
      const payload = {
        dayOfWeek,
        startTime,
        endTime,
        label
      };
      const res: any = await api.post('/timeslots', payload);
      if (res.success) {
        ElMessage.success(t('room.success_activate', { caName: displayCaName, day: formatDay(dayOfWeek) }));
        fetchData();
      } else {
        ElMessage.error(res.message || t('room.success_save_room_failed'));
      }
    } catch (err) {
      ElMessage.error(t('room.error_activate_failed'));
    } finally {
      loading.value = false;
    }
  }
};

// Mở Dialog sửa giờ ca học đồng bộ
const openEditTimeDialog = (row: any) => {
  editTimeForm.value.caName = row.caName;
  editTimeForm.value.startTime = row.startTime;
  editTimeForm.value.endTime = row.endTime;

  // Thu thập ID của tất cả các ngày trong tuần đang được kích hoạt của ca này
  const ids: number[] = [];
  Object.keys(row.dayMap).forEach(key => {
    const dayData = row.dayMap[key];
    if (dayData.active && dayData.id) {
      ids.push(dayData.id);
    }
  });
  editTimeForm.value.activeDayIds = ids;
  showEditTimeDialog.value = true;
};

// Lưu giờ học mới đồng bộ
const saveTimeChange = async () => {
  const f = editTimeForm.value;
  if (!f.startTime || !f.endTime) {
    ElMessage.warning(t('room.warn_fill_timeslot'));
    return;
  }

  savingTimeslot.value = true;
  try {
    // Nếu có các ngày đang hoạt động, gửi các request PUT đồng bộ cập nhật giờ
    if (f.activeDayIds.length > 0) {
      await Promise.all(f.activeDayIds.map(id => {
        const originalTs = timeslots.value.find(ts => ts.id === id);
        if (originalTs) {
          return api.put(`/timeslots/${id}`, {
            dayOfWeek: originalTs.dayOfWeek,
            startTime: f.startTime,
            endTime: f.endTime,
            label: originalTs.label
          });
        }
        return Promise.resolve();
      }));
    }

    const displayCaName = f.caName.startsWith('Ca') ? t('timetable.ca') + ' ' + f.caName.substring(3) : f.caName;
    ElMessage.success(t('room.success_update_sync', { caName: displayCaName }));
    showEditTimeDialog.value = false;
    fetchData();
  } catch (err) {
    ElMessage.error(t('room.error_update_sync'));
  } finally {
    savingTimeslot.value = false;
  }
};

// Xóa toàn bộ các ngày đã kích hoạt của Ca học này
const handleDeleteCaRow = (row: any) => {
  // Gom tất cả ID của các ngày học đang được kích hoạt cho ca này
  const ids: number[] = [];
  Object.keys(row.dayMap).forEach(key => {
    const dayData = row.dayMap[key];
    if (dayData.active && dayData.id) {
      ids.push(dayData.id);
    }
  });

  const displayCaName = row.caName.startsWith('Ca') ? t('timetable.ca') + ' ' + row.caName.substring(3) : row.caName;

  if (ids.length === 0) {
    ElMessage.info(t('room.info_ca_not_active', { caName: displayCaName }));
    return;
  }

  ElMessageBox.confirm(
    t('room.confirm_delete_ca_text', { caName: displayCaName, start: row.startTime, end: row.endTime }),
    t('room.confirm_delete_ca_title'),
    {
      confirmButtonText: t('room.btn_delete_confirm'),
      cancelButtonText: t('room.btn_delete_cancel'),
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true;
    try {
      // Gọi API xóa song song toàn bộ các ca học của các ngày đã chọn
      await Promise.all(ids.map(id => api.delete(`/timeslots/${id}`)));
      ElMessage.success(t('room.success_delete_ca', { caName: displayCaName }));
      fetchData();
    } catch (err: any) {
      ElMessage.error(err.response?.data?.message || t('room.error_delete_ca_referenced'));
      fetchData();
    } finally {
      loading.value = false;
    }
  }).catch(() => {});
};

// Mở Drawer thêm ca học custom mới
const openAddTimeslotDrawer = () => {
  addTimeslotForm.value = {
    caNumber: 6,
    selectedDays: [] as string[],
    startTime: '',
    endTime: ''
  };
  showAddTimeslotDrawer.value = true;
};

// Lưu ca học custom mới tạo (cho phép kích hoạt nhiều ngày)
const saveNewTimeslot = async () => {
  const f = addTimeslotForm.value;
  if (f.selectedDays.length === 0 || !f.startTime || !f.endTime) {
    ElMessage.warning(t('room.warn_add_timeslot_fill'));
    return;
  }

  const caName = `Ca ${f.caNumber}`;
  const dayLabelMap: Record<string, string> = {
    MONDAY: 'Thứ 2', TUESDAY: 'Thứ 3', WEDNESDAY: 'Thứ 4',
    THURSDAY: 'Thứ 5', FRIDAY: 'Thứ 6', SATURDAY: 'Thứ 7', SUNDAY: 'CN'
  };

  savingTimeslot.value = true;
  try {
    await Promise.all(f.selectedDays.map(dayOfWeek => {
      const dayLabel = dayLabelMap[dayOfWeek] || dayOfWeek;
      const label = `${dayLabel} - ${caName}`;
      return api.post('/timeslots', {
        dayOfWeek,
        startTime: f.startTime,
        endTime: f.endTime,
        label
      });
    }));

    const displayCaName = caName.startsWith('Ca') ? t('timetable.ca') + ' ' + caName.substring(3) : caName;
    showAddTimeslotDrawer.value = false;
    fetchData();
    ElMessage.success(t('room.success_create_timeslot', { caName: displayCaName, count: f.selectedDays.length }));
  } catch (err) {
    ElMessage.error(t('room.error_update_sync'));
  } finally {
    savingTimeslot.value = false;
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
