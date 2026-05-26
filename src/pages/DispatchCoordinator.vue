<template>
  <div class="dispatch-coordinator space-y-6">
    <!-- Page Header với thanh dọc emerald gradient -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          Điều phối Lịch giảng dạy
        </h1>
        <p class="text-sm text-gray-500 mt-1">Điều chỉnh lịch dạy, đổi phòng, đổi giáo viên đứng lớp hoặc hoãn buổi học theo ngày dương lịch cụ thể.</p>
      </div>

      <!-- Chọn ngày điều phối -->
      <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Chọn ngày:</span>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="Chọn ngày..."
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="fetchDailyDispatch"
          class="!w-44"
        />
      </div>
    </div>

    <!-- Danh sách buổi học trong ngày -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0px' }" v-loading="loading">
      <el-table
        :data="dispatchEntries"
        style="width: 100%"
        stripe
        class="premium-table"
      >
        <!-- Chỉ số buổi -->
        <el-table-column label="Buổi số" width="90" align="center">
          <template #default="{ row }">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
              #{{ row.lessonIndex }}
            </span>
          </template>
        </el-table-column>

        <!-- Tên lớp học -->
        <el-table-column label="Lớp học" min-width="180">
          <template #default="{ row }">
            <div class="font-extrabold text-gray-900 hover:text-emerald-600 transition-colors duration-200">{{ row.className }}</div>
            <div class="text-xs text-gray-400 mt-0.5">Yêu cầu trình độ: {{ row.requiredSkill }}</div>
          </template>
        </el-table-column>

        <!-- Ca học & Giờ học -->
        <el-table-column label="Ca học (Thời gian)" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-tag type="info" size="small" class="font-bold rounded bg-gray-50 text-gray-600 border border-gray-200">
                {{ row.timeslotLabel ? row.timeslotLabel.split(' - ')[1] || row.timeslotLabel : '—' }}
              </el-tag>
              <span class="text-sm font-semibold text-gray-700">
                ({{ row.startTime }} - {{ row.endTime }})
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- Giáo viên phụ trách -->
        <el-table-column label="Giáo viên đứng lớp" min-width="180">
          <template #default="{ row }">
            <div v-if="row.teacherName" class="flex items-center gap-2">
              <span class="font-bold text-gray-800">{{ row.teacherName }}</span>
            </div>
            <span v-else class="text-red-500 text-xs italic flex items-center gap-1">
              <el-icon><Warning /></el-icon> Chưa có giáo viên
            </span>
          </template>
        </el-table-column>

        <!-- Phòng học -->
        <el-table-column label="Phòng học" min-width="120">
          <template #default="{ row }">
            <div v-if="row.roomName" class="font-semibold text-gray-700 flex items-center gap-1">
              <el-icon class="text-teal-600"><OfficeBuilding /></el-icon>
              {{ row.roomName }}
            </div>
            <span v-else class="text-red-500 text-xs italic">Chưa xếp phòng</span>
          </template>
        </el-table-column>

        <!-- Khóa/Mở khóa lịch -->
        <el-table-column label="Khóa lịch" width="100" align="center">
          <template #default="{ row }">
            <el-tooltip :content="row.pinned ? 'Lịch đã bị khóa/ghim cố định' : 'Lịch tự do (có thể tối ưu lại khi chạy Solver)'" placement="top">
              <span class="inline-flex items-center justify-center p-1.5 rounded-lg transition-colors" :class="row.pinned ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'">
                <el-icon :size="16">
                  <Lock v-if="row.pinned" />
                  <Unlock v-else />
                </el-icon>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>

        <!-- Hành động điều phối -->
        <el-table-column label="Điều phối" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="openAdjustmentDialog(row)"
              class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-sm transition-all duration-200"
            >
              <el-icon class="mr-1"><Edit /></el-icon>
              Điều phối
            </el-button>
          </template>
        </el-table-column>

        <!-- Empty state -->
        <template #empty>
          <el-empty :description="`Không có buổi học nào được lên lịch trong ngày ${formatDateLabel(selectedDate)}`" />
        </template>
      </el-table>
    </el-card>

    <!-- Adjustment Premium Dialog -->
    <el-dialog
      v-model="showAdjustDialog"
      title="Điều phối lịch buổi học chi tiết"
      width="450px"
      destroy-on-close
      custom-class="premium-dialog"
    >
      <div v-if="selectedEntry" class="space-y-4">
        <!-- Thông tin buổi học hiện tại -->
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-1.5">
          <div><span class="font-bold text-gray-500">Lớp học:</span> <span class="font-extrabold text-gray-800">{{ selectedEntry.className }}</span></div>
          <div><span class="font-bold text-gray-500">Buổi số:</span> <span class="font-bold text-emerald-700">Buổi #{{ selectedEntry.lessonIndex }}</span></div>
          <div><span class="font-bold text-gray-500">Giờ học cũ:</span> <span class="font-semibold text-gray-700">{{ selectedEntry.timeslotLabel }} ({{ selectedEntry.startTime }} - {{ selectedEntry.endTime }})</span></div>
        </div>

        <el-form :model="adjustmentForm" label-position="top">
          <!-- Thay đổi giáo viên đứng lớp -->
          <el-form-item label="Giáo viên đứng lớp (Thay thế)">
            <el-select v-model="adjustmentForm.teacherId" placeholder="Chọn giáo viên dạy thay..." filterable clearable class="w-full">
              <el-option
                v-for="tc in teachers"
                :key="tc.id"
                :value="tc.id"
                :label="tc.fullName"
              />
            </el-select>
          </el-form-item>

          <!-- Thay đổi phòng học -->
          <el-form-item label="Phòng học">
            <el-select v-model="adjustmentForm.roomId" placeholder="Chọn phòng học mới..." filterable clearable class="w-full">
              <el-option
                v-for="rm in rooms"
                :key="rm.id"
                :value="rm.id"
                :label="rm.name"
              />
            </el-select>
          </el-form-item>

          <!-- Thay đổi ca học cố định trong tuần -->
          <el-form-item label="Ca học (Timeslot)">
            <el-select v-model="adjustmentForm.timeslotId" placeholder="Chọn ca học cố định..." filterable clearable class="w-full">
              <el-option
                v-for="ts in timeslots"
                :key="ts.id"
                :value="ts.id"
                :label="ts.label"
              />
            </el-select>
          </el-form-item>

          <!-- Hoãn / Thay đổi ngày học cụ thể -->
          <el-form-item label="Ngày học dương lịch cụ thể (Dịch ngày / Hoãn)">
            <el-date-picker
              v-model="adjustmentForm.sessionDate"
              type="date"
              placeholder="Chọn ngày học mới..."
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              class="!w-full"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2 p-2 border-t border-gray-100">
          <el-button @click="showAdjustDialog = false">Hủy bỏ</el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="submitAdjustment"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-sm"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            Lưu điều phối (Khóa lịch)
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api/axios';
import { Edit, Lock, Unlock, OfficeBuilding, Warning, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { format } from 'date-fns';

const route = useRoute();
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'));
const loading = ref(false);
const saving = ref(false);
const showAdjustDialog = ref(false);

const dispatchEntries = ref<any[]>([]);
const teachers = ref<any[]>([]);
const rooms = ref<any[]>([]);
const timeslots = ref<any[]>([]);
const selectedEntry = ref<any>(null);

const adjustmentForm = ref({
  teacherId: null as number | null,
  roomId: null as number | null,
  timeslotId: null as number | null,
  sessionDate: ''
});

// Tải danh sách các buổi học điều phối của ngày được chọn
const fetchDailyDispatch = async () => {
  loading.value = true;
  try {
    const res: any = await api.get('/class-planning/dispatch', {
      params: { date: selectedDate.value }
    });
    if (res.success) {
      dispatchEntries.value = res.data;
    }
  } catch (err) {
    ElMessage.error('Lỗi khi tải danh sách điều phối lịch dạy');
  } finally {
    loading.value = false;
  }
};

// Tải thông tin tài nguyên dropdown phục vụ điều phối
const loadMetadata = async () => {
  try {
    const [resT, resR, resTs] = await Promise.all([
      api.get('/teachers/all'),
      api.get('/rooms'),
      api.get('/class-planning/patterns')
    ]);
    teachers.value = (resT as any).data;
    rooms.value = (resR as any).data;
    // Map patterns thành timeslots tương ứng
    timeslots.value = (resTs as any).data.map((p: any) => ({
      id: p.id,
      label: p.displayLabel || `${p.code} (${p.studyDays} ca ${p.slotCode})`
    }));
  } catch (err) {
    console.error('Lỗi khi tải metadata điều phối', err);
  }
};

// Mở hộp thoại điều chỉnh buổi học
const openAdjustmentDialog = (row: any) => {
  selectedEntry.value = row;
  adjustmentForm.value = {
    teacherId: row.teacherId,
    roomId: row.roomId,
    timeslotId: row.timeslotId,
    sessionDate: row.sessionDate
  };
  showAdjustDialog.value = true;
};

// Thực hiện gửi yêu cầu điều phối lịch buổi học
const submitAdjustment = async () => {
  if (!selectedEntry.value) return;
  saving.value = true;
  try {
    const res: any = await api.put(`/class-planning/dispatch/${selectedEntry.value.lessonId}`, adjustmentForm.value);
    if (res.success) {
      ElMessage.success('Điều phối ca học và khóa lịch cố định thành công!');
      showAdjustDialog.value = false;
      fetchDailyDispatch();
    } else {
      ElMessage.error(res.message || 'Điều phối thất bại');
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || 'Có lỗi xảy ra khi điều phối ca học');
  } finally {
    saving.value = false;
  }
};

// Định dạng ngày hiển thị Tiếng Việt
const formatDateLabel = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

onMounted(() => {
  if (route.query.date) {
    selectedDate.value = route.query.date as string;
  }
  loadMetadata();
  fetchDailyDispatch();
});
</script>

<script lang="ts">
export default {
  name: 'DispatchCoordinator'
}
</script>

<style scoped>
.premium-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  border-radius: 12px;
}

:deep(.premium-dialog .el-dialog__header) {
  font-weight: 800;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 20px;
}

:deep(.premium-dialog .el-dialog__body) {
  padding: 20px 24px;
}
</style>
