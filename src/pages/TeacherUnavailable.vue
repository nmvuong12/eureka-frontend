<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-b from-red-500 to-rose-600 w-2.5 h-8 rounded-full"></span>
          Đăng ký Lịch bận Cố định
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Thiết lập các ca học bận cố định trong tuần. Thuật toán xếp lịch tự động sẽ né chính xác các ca này để tránh trùng lịch.
        </p>
      </div>

      <!-- Save Button (Floating style on top right) -->
      <el-button
        v-if="selectedTeacherId"
        type="danger"
        :loading="saving"
        @click="handleSave"
        class="!bg-rose-600 hover:!bg-rose-700 !border-rose-600 shadow-md font-bold transition-all duration-300 transform hover:scale-105"
      >
        <el-icon class="mr-1.5"><DocumentChecked /></el-icon>
        Lưu lịch bận cố định
      </el-button>
    </div>

    <!-- Toolbar for Admin & Staff (Select Teacher) -->
    <el-card
      v-if="authStore.isAdmin || authStore.isStaff"
      shadow="never"
      class="border border-gray-100 rounded-2xl bg-gradient-to-r from-gray-50 to-slate-50"
      :body-style="{ padding: '16px 20px' }"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-gray-700">Chọn giáo viên cần thiết lập:</span>
        </div>
        <el-select
          v-model="selectedTeacherId"
          placeholder="Tìm kiếm hoặc chọn giáo viên..."
          filterable
          clearable
          class="min-w-[280px]"
          v-loading="teachersLoading"
          @change="onTeacherChange"
        >
          <el-option
            v-for="teacher in teachers"
            :key="teacher.id"
            :label="`${teacher.fullName} (${teacher.teacherCode} - ${teacher.teacherType})`"
            :value="teacher.id"
          />
        </el-select>
      </div>
    </el-card>

    <!-- Busy Grid Interface -->
    <div v-if="selectedTeacherId" class="space-y-6" v-loading="loading">
      <!-- Grid Legend & Guidelines -->
      <div class="flex flex-wrap items-center gap-6 text-sm bg-white p-4 border border-gray-100 rounded-xl">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded-md"></span>
          <span class="text-gray-600 font-medium">Sẵn sàng giảng dạy (Free)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-center text-rose-500 text-[10px] font-bold">✕</span>
          <span class="text-gray-600 font-medium">Bận cố định (Busy) - *Solver sẽ né ca này*</span>
        </div>
        <div class="text-xs text-slate-400 ml-auto flex items-center gap-1.5">
          <el-icon><InfoFilled /></el-icon>
          Click vào từng ô ca học bên dưới để bật/tắt (toggle) lịch bận
        </div>
      </div>

      <!-- Main Calendar Grid Card -->
      <el-card shadow="sm" class="border border-gray-100 rounded-3xl overflow-hidden" :body-style="{ padding: '24px' }">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px] border-collapse table-fixed">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="p-4 w-32 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Ca / Thứ
                </th>
                <th
                  v-for="day in daysOfWeek"
                  :key="day.code"
                  class="p-4 text-center text-sm font-bold text-slate-700 tracking-wide border-l border-slate-100"
                >
                  {{ day.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="slotIndex in 5"
                :key="slotIndex"
                class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                <!-- Row Header: Timeslot Index & Time -->
                <td class="p-3 text-center bg-slate-50/30">
                  <div class="font-bold text-gray-800 text-sm">Ca {{ slotIndex }}</div>
                  <div class="text-[11px] text-gray-400 font-semibold mt-0.5">
                    {{ getSlotTimeRange(slotIndex) }}
                  </div>
                </td>

                <!-- Grid Cells for each Day -->
                <td
                  v-for="day in daysOfWeek"
                  :key="day.code"
                  class="p-2 border-l border-slate-100 text-center align-middle"
                >
                  <!-- Active Interactive Cell -->
                  <div
                    v-if="getTimeslot(day.code, slotIndex)"
                    @click="toggleUnavailable(getTimeslot(day.code, slotIndex).id)"
                    class="group relative h-20 rounded-2xl flex flex-col items-center justify-center p-3 cursor-pointer select-none transition-all duration-300"
                    :class="[
                      isUnavailable(getTimeslot(day.code, slotIndex).id)
                        ? 'bg-rose-50 hover:bg-rose-100/80 border-2 border-rose-300 text-rose-700 shadow-sm'
                        : 'bg-emerald-50/40 hover:bg-emerald-50 border-2 border-dashed border-emerald-200 text-emerald-800'
                    ]"
                  >
                    <!-- Background Soft Glow Effect on Hover -->
                    <span
                      class="absolute inset-0 w-full h-full rounded-2xl scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 -z-10"
                      :class="[
                        isUnavailable(getTimeslot(day.code, slotIndex).id)
                          ? 'bg-rose-200/20'
                          : 'bg-emerald-100/30'
                      ]"
                    ></span>

                    <!-- Icon & State Text -->
                    <div class="flex items-center gap-1.5 font-bold text-sm tracking-wide">
                      <el-icon :size="16" class="transition-transform group-hover:scale-110">
                        <CircleCloseFilled v-if="isUnavailable(getTimeslot(day.code, slotIndex).id)" class="text-rose-600 animate-pulse" />
                        <CircleCheckFilled v-else class="text-emerald-500" />
                      </el-icon>
                      <span>{{ isUnavailable(getTimeslot(day.code, slotIndex).id) ? 'BẬN' : 'RẢNH' }}</span>
                    </div>

                    <!-- Short Label / Code -->
                    <div class="text-[10px] opacity-60 font-semibold mt-1 uppercase">
                      {{ day.label }} - Ca {{ slotIndex }}
                    </div>

                    <!-- Tooltip Indicator on hover -->
                    <div class="absolute bottom-1 right-2 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase text-slate-400">
                      Click để đổi
                    </div>
                  </div>

                  <!-- Empty/Undefined slot in DB -->
                  <div
                    v-else
                    class="h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-xs font-medium cursor-not-allowed"
                  >
                    Không có ca
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-card>

      <!-- Save Button (Centered at bottom) -->
      <div class="flex justify-center pt-2">
        <el-button
          type="danger"
          size="large"
          :loading="saving"
          @click="handleSave"
          class="!bg-rose-600 hover:!bg-rose-700 !border-rose-600 shadow-lg px-8 font-bold transition-all duration-300 transform hover:scale-105"
        >
          <el-icon class="mr-1.5"><DocumentChecked /></el-icon>
          Xác nhận & Lưu lịch bận cố định
        </el-button>
      </div>
    </div>

    <!-- Empty State when no teacher selected -->
    <div v-else class="flex flex-col items-center justify-center p-20 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
      <el-empty description="Vui lòng chọn giáo viên để đăng ký hoặc cấu hình lịch bận">
        <div class="text-sm text-slate-400 max-w-sm mt-2 leading-relaxed">
          Nếu đăng nhập bằng tài khoản Giáo viên, lịch bận cá nhân sẽ tự động hiển thị. Nếu là Admin hoặc Giáo vụ, vui lòng chọn một giáo viên từ ô chọn phía trên.
        </div>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/api/axios';
import { ElMessage } from 'element-plus';
import { DocumentChecked, InfoFilled, CircleCloseFilled, CircleCheckFilled } from '@element-plus/icons-vue';

// Auth store
const authStore = useAuthStore();

// UI States
const loading = ref(false);
const saving = ref(false);
const teachersLoading = ref(false);

// Core Data
const teachers = ref<any[]>([]);
const selectedTeacherId = ref<number | null>(null);
const timeslots = ref<any[]>([]);
const unavailableTimeslotIds = ref<number[]>([]);

// Week Days Definition
const daysOfWeek = [
  { code: 'MONDAY', label: 'Thứ 2' },
  { code: 'TUESDAY', label: 'Thứ 3' },
  { code: 'WEDNESDAY', label: 'Thứ 4' },
  { code: 'THURSDAY', label: 'Thứ 5' },
  { code: 'FRIDAY', label: 'Thứ 6' },
  { code: 'SATURDAY', label: 'Thứ 7' },
  { code: 'SUNDAY', label: 'Chủ Nhật' }
];

/** Ca học tiêu chuẩn theo số thứ tự (Slot Index) */
const getSlotTimeRange = (index: number) => {
  switch (index) {
    case 1: return '07:30 - 09:00';
    case 2: return '09:15 - 10:45';
    case 3: return '13:30 - 15:00';
    case 4: return '15:15 - 16:45';
    case 5: return '18:00 - 19:30';
    default: return '';
  }
};

/** Nhận diện slot ca học dựa trên giờ bắt đầu */
const getSlotIndex = (startTime: string) => {
  if (!startTime) return 0;
  if (startTime.startsWith('07:') || startTime.startsWith('08:')) return 1;
  if (startTime.startsWith('09:') || startTime.startsWith('10:')) return 2;
  if (startTime.startsWith('13:') || startTime.startsWith('14:')) return 3;
  if (startTime.startsWith('15:') || startTime.startsWith('16:') || startTime.startsWith('17:')) return 4;
  if (startTime.startsWith('18:') || startTime.startsWith('19:')) return 5;
  return 0;
};

/** Lấy ca học cụ thể trong mảng timeslots đã tải */
const getTimeslot = (dayOfWeek: string, slotIndex: number) => {
  return timeslots.value.find(
    (ts) => ts.dayOfWeek === dayOfWeek && getSlotIndex(ts.startTime) === slotIndex
  );
};

/** Kiểm tra xem timeslot có thuộc danh sách bận */
const isUnavailable = (timeslotId: number) => {
  return unavailableTimeslotIds.value.includes(timeslotId);
};

/** Bật/tắt trạng thái bận cố định */
const toggleUnavailable = (timeslotId: number) => {
  const index = unavailableTimeslotIds.value.indexOf(timeslotId);
  if (index > -1) {
    // Nếu có sẵn thì xóa đi (đánh dấu thành RẢNH)
    unavailableTimeslotIds.value.splice(index, 1);
  } else {
    // Nếu chưa có thì thêm vào (đánh dấu thành BẬN)
    unavailableTimeslotIds.value.push(timeslotId);
  }
};

/** Khi chọn giáo viên khác */
const onTeacherChange = (teacherId: number | null) => {
  if (teacherId) {
    fetchUnavailableTimeslots(teacherId);
  } else {
    unavailableTimeslotIds.value = [];
  }
};

/** Tải danh sách giáo viên (dành cho Admin/Staff) */
const fetchTeachers = async () => {
  teachersLoading.value = true;
  try {
    const res: any = await api.get('/teachers/all?status=ACTIVE');
    if (res.success) {
      teachers.value = res.data;
    }
  } catch (err) {
    ElMessage.error('Không thể lấy danh sách giáo viên');
  } finally {
    teachersLoading.value = false;
  }
};

/** Tải toàn bộ ca học chuẩn */
const fetchTimeslots = async () => {
  try {
    const res: any = await api.get('/timeslots');
    if (res.success) {
      timeslots.value = res.data;
    }
  } catch (err) {
    ElMessage.error('Không thể lấy cấu hình các ca học');
  }
};

/** Tải lịch bận cố định của giáo viên đang chọn */
const fetchUnavailableTimeslots = async (teacherId: number) => {
  loading.value = true;
  try {
    const res: any = await api.get(`/teachers/${teacherId}/unavailable`);
    if (res.success) {
      unavailableTimeslotIds.value = res.data;
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || 'Không thể lấy lịch bận cố định của giáo viên này');
  } finally {
    loading.value = false;
  }
};

/** Lưu lịch bận cố định lên Backend */
const handleSave = async () => {
  if (!selectedTeacherId.value) {
    ElMessage.warning('Vui lòng chọn giáo viên để thực hiện lưu.');
    return;
  }

  saving.value = true;
  try {
    const res: any = await api.post(`/teachers/${selectedTeacherId.value}/unavailable`, {
      timeslotIds: unavailableTimeslotIds.value
    });
    if (res.success) {
      ElMessage.success('Đã cập nhật lịch bận cố định của giáo viên thành công!');
      // Tải lại để đảm bảo dữ liệu hiển thị đồng bộ
      fetchUnavailableTimeslots(selectedTeacherId.value);
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || 'Lỗi khi cập nhật lịch bận cố định');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  // 1. Tải trước toàn bộ ca học của hệ thống
  await fetchTimeslots();

  // 2. Kiểm tra phân quyền để tải dữ liệu phù hợp
  if (authStore.isAdmin || authStore.isStaff) {
    // Với Admin và Staff: Tải danh sách tất cả giáo viên phục vụ ô chọn
    await fetchTeachers();
  } else if (authStore.isTeacher && authStore.user?.teacherId) {
    // Với Giáo viên: Tự động gán ID và tải thẳng lịch bận của họ
    selectedTeacherId.value = authStore.user.teacherId;
    await fetchUnavailableTimeslots(authStore.user.teacherId);
  }
  loading.value = false;
});
</script>

<style scoped>
/* Hiệu ứng mượt mà khi hover vào các ô trong bảng */
table th, table td {
  transition: all 0.2s ease-in-out;
}
</style>
