<template>
  <div class="pattern-management space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('pattern.title') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ $t('pattern.desc') }}
        </p>
      </div>
      
      <el-button 
        type="primary" 
        @click="openAddDialog"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md flex items-center gap-1 font-bold"
      >
        <el-icon><Plus /></el-icon>
        {{ $t('pattern.btn_add') }}
      </el-button>
    </div>

    <!-- Filter & Search Bar -->
    <div class="bg-white p-4 rounded-2xl border border-gray-155 shadow-sm flex flex-wrap gap-4 items-center justify-between">
      <div class="flex flex-wrap gap-3 items-center">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('pattern.search_placeholder')"
          class="!w-60 search-input"
          clearable
          :prefix-icon="Search"
        />
        <el-select v-model="filterSlot" :placeholder="$t('pattern.filter_slot')" clearable class="!w-40">
          <el-option 
            v-for="opt in slotOptions" 
            :key="opt.value" 
            :label="opt.value.startsWith('C') ? $t('timetable.ca') + ' ' + opt.value.substring(1) : $t('timetable.ca') + ' ' + opt.value" 
            :value="opt.value" 
          />
        </el-select>
        <el-select v-model="filterSessions" :placeholder="$t('pattern.filter_sessions')" clearable class="!w-44">
          <el-option :label="$t('pattern.sessions_per_week_label', { count: 2 })" :value="2" />
          <el-option :label="$t('pattern.sessions_per_week_label', { count: 3 })" :value="3" />
          <el-option :label="$t('pattern.sessions_per_week_label', { count: 4 })" :value="4" />
        </el-select>
      </div>

      <el-button @click="resetFilters" plain class="hover:!bg-gray-50">
        <el-icon class="mr-1"><Refresh /></el-icon>
        {{ $t('pattern.btn_reset') }}
      </el-button>
    </div>

    <!-- Data Table -->
    <el-card class="border border-gray-155 rounded-2xl shadow-sm" v-loading="loading">
      <el-table :data="filteredPatterns" style="width: 100%" class="premium-table">
        <el-table-column prop="code" :label="$t('pattern.col_code')" width="110" align="center">
          <template #default="{ row }">
            <span class="font-bold text-gray-900">{{ row.code }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('pattern.col_study_days')" min-width="200">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1.5">
              <el-tag 
                v-for="day in parseStudyDays(row.studyDays)" 
                :key="day"
                size="small"
                :type="getDayTagType(day)"
                class="font-bold !px-2.5"
              >
                {{ getDayLabel(day) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="slotCode" :label="$t('pattern.col_slot')" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" class="!bg-teal-50 !text-teal-700 !border-teal-100 font-bold">
              {{ $t('timetable.ca') }} {{ row.slotCode.startsWith('C') ? row.slotCode.substring(1) : row.slotCode }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('pattern.col_time')" width="180" align="center">
          <template #default="{ row }">
            <span class="font-medium text-gray-700">{{ row.slotStart }} - {{ row.slotEnd }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="sessionsPerWeek" :label="$t('pattern.col_sessions')" width="150" align="center">
          <template #default="{ row }">
            <el-tag size="small" class="!bg-emerald-50 !text-emerald-700 !border-emerald-100 font-bold">
              {{ $t('pattern.col_sessions_val', { count: row.sessionsPerWeek }) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('pattern.col_status')" width="130" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              active-color="#10b981"
              inactive-color="#e2e8f0"
              @change="(val: any) => handleToggleActive(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column :label="$t('pattern.col_actions')" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <div class="flex justify-center gap-2">
              <el-tooltip :content="$t('pattern.tooltip_edit')" placement="top">
                <el-button type="primary" link @click="openEditDialog(row)" class="hover:!text-emerald-600">
                  <el-icon :size="16"><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('pattern.tooltip_delete')" placement="top">
                <el-button type="danger" link @click="handleDelete(row)" class="hover:!text-red-600">
                  <el-icon :size="16"><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog Thêm / Sửa -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? $t('pattern.dialog_title_edit') : $t('pattern.dialog_title_create')"
      width="500px"
      destroy-on-close
      custom-class="premium-dialog"
    >
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-position="top" 
        class="space-y-4"
      >
        <!-- Tự sinh mã code -->
        <div v-if="!isEdit" class="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex justify-between items-center mb-2">
          <span class="text-xs text-gray-500 font-medium">{{ $t('pattern.form_code_help') }}</span>
          <span class="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{{ nextCodeSuggestion }}</span>
        </div>

        <!-- Chọn các ngày học -->
        <el-form-item :label="$t('pattern.form_study_days')" prop="studyDaysList" required>
          <el-checkbox-group v-model="form.studyDaysList" class="flex flex-wrap gap-2.5 mt-1">
            <el-checkbox-button label="2">{{ $t('dashboard.mon') }}</el-checkbox-button>
            <el-checkbox-button label="3">{{ $t('dashboard.tue') }}</el-checkbox-button>
            <el-checkbox-button label="4">{{ $t('dashboard.wed') }}</el-checkbox-button>
            <el-checkbox-button label="5">{{ $t('dashboard.thu') }}</el-checkbox-button>
            <el-checkbox-button label="6">{{ $t('dashboard.fri') }}</el-checkbox-button>
            <el-checkbox-button label="7">{{ $t('dashboard.sat') }}</el-checkbox-button>
            <el-checkbox-button label="1">{{ $t('dashboard.sun') }}</el-checkbox-button>
          </el-checkbox-group>
        </el-form-item>

        <!-- Ca học -->
        <el-form-item :label="$t('pattern.form_slot')" prop="slotCode" required>
          <el-select 
            v-model="form.slotCode" 
            :placeholder="$t('pattern.form_slot_placeholder')" 
            class="w-full"
            @change="handleSlotChange"
          >
            <el-option 
              v-for="opt in slotOptions" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>

        <!-- Khung giờ bắt đầu & kết thúc -->
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('pattern.form_start')" prop="slotStart">
            <el-input
              v-model="form.slotStart"
              :placeholder="$t('pattern.form_start_placeholder')"
              disabled
            />
          </el-form-item>
          <el-form-item :label="$t('pattern.form_end')" prop="slotEnd">
            <el-input
              v-model="form.slotEnd"
              :placeholder="$t('pattern.form_end_placeholder')"
              disabled
            />
          </el-form-item>
        </div>

        <!-- Số buổi học trên tuần (Tự động tính theo số ngày đã chọn) -->
        <el-form-item :label="$t('pattern.form_sessions_week')">
          <div class="flex items-center gap-3">
            <el-tag size="large" type="success" class="font-extrabold !px-4">
              {{ $t('pattern.form_sessions_week_val', { count: form.studyDaysList.length }) }}
            </el-tag>
            <span class="text-xs text-gray-400">
              {{ $t('pattern.form_sessions_week_help') }}
            </span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <el-button @click="dialogVisible = false">{{ $t('pattern.form_cancel') }}</el-button>
          <el-button 
            type="primary" 
            @click="handleSubmit" 
            :loading="submitting"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 font-bold"
          >
            {{ $t('pattern.form_save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/axios';
import { Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const { t } = useI18n();

interface SchedulePattern {
  id: number;
  code: string;
  studyDays: string;
  slotCode: string;
  slotStart: string;
  slotEnd: string;
  sessionsPerWeek: number;
  active: boolean;
}

// Bộ lọc và tìm kiếm
const searchQuery = ref('');
const filterSlot = ref('');
const filterSessions = ref<number | null>(null);

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);
const patterns = ref<SchedulePattern[]>([]);
const nextCodeSuggestion = ref('P001');

// Danh sách ca học chuẩn động tải từ database
const timeslots = ref<any[]>([]);

const formRef = ref<FormInstance>();
const form = reactive({
  studyDaysList: [] as string[],
  slotCode: '',
  slotStart: '',
  slotEnd: '',
  sessionsPerWeek: 3,
  active: true
});

// Quy tắc Validate Form
const rules = computed<FormRules>(() => ({
  studyDaysList: [
    { type: 'array', required: true, message: t('pattern.rule_days_required'), trigger: 'change' }
  ],
  slotCode: [
    { required: true, message: t('pattern.rule_slot_required'), trigger: 'change' }
  ],
  slotStart: [
    { required: true, message: t('pattern.rule_start_required'), trigger: 'change' }
  ],
  slotEnd: [
    { required: true, message: t('pattern.rule_end_required'), trigger: 'change' }
  ]
}));

// Tải danh sách Timeslot từ database
const fetchTimeslots = async () => {
  try {
    const res: any = await api.get('/timeslots');
    timeslots.value = res.data || [];
  } catch (err) {
    ElMessage.error(t('pattern.error_load_slots'));
  }
};

// Trích xuất duy nhất các Ca học (Ca 1, Ca 2...) và khung giờ tương ứng từ danh sách timeslots thực tế
const slotOptions = computed(() => {
  const map = new Map<string, { label: string; value: string; startTime: string; endTime: string }>();
  
  timeslots.value.forEach(ts => {
    if (!ts.label) return;
    const match = ts.label.match(/Ca\s*(\d+)/i);
    if (match) {
      const caNum = match[1];
      const code = `C${caNum}`;
      const name = `Ca ${caNum}`;
      if (!map.has(code)) {
        map.set(code, {
          label: `${name} (${ts.startTime} - ${ts.endTime})`,
          value: code,
          startTime: ts.startTime,
          endTime: ts.endTime
        });
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const numA = parseInt(a.value.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.value.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
});

// Tự động điền khung giờ học khi thay đổi ca theo cấu hình thực tế trong DB
const handleSlotChange = (slotCode: string) => {
  const selectedOpt = slotOptions.value.find(opt => opt.value === slotCode);
  if (selectedOpt) {
    form.slotStart = selectedOpt.startTime;
    form.slotEnd = selectedOpt.endTime;
  } else {
    form.slotStart = '';
    form.slotEnd = '';
  }
};

// Phân tách ngày từ chuỗi DB (2,4,6 -> ['2', '4', '6'])
const parseStudyDays = (daysStr: string) => {
  if (!daysStr) return [];
  return daysStr.split(',').map(d => d.trim());
};

// Lấy kiểu nhãn Tag cho các ngày học
const getDayTagType = (day: string) => {
  switch (day) {
    case '1': return 'danger'; // Chủ Nhật nổi bật đỏ
    case '7': return 'warning'; // Thứ Bảy cam
    default: return 'success'; // Ngày thường lục bảo
  }
};

// Chuyển số sang chữ thứ thân thiện
const getDayLabel = (day: string) => {
  switch (day) {
    case '1': return t('dashboard.sun');
    case '2': return t('dashboard.mon');
    case '3': return t('dashboard.tue');
    case '4': return t('dashboard.wed');
    case '5': return t('dashboard.thu');
    case '6': return t('dashboard.fri');
    case '7': return t('dashboard.sat');
    default: return 'T' + day;
  }
};

// Tải danh sách
const fetchPatterns = async () => {
  loading.value = true;
  try {
    const res: any = await api.get('/class-planning/patterns/all');
    if (res.success) {
      patterns.value = res.data;
      calculateNextCodeSuggestion();
    }
  } catch (err) {
    ElMessage.error(t('pattern.error_load_patterns'));
  } finally {
    loading.value = false;
  }
};

// Tính toán mã mẫu đề xuất tự động
const calculateNextCodeSuggestion = () => {
  if (patterns.value.length === 0) {
    nextCodeSuggestion.value = 'P001';
    return;
  }
  const lastPattern = patterns.value[patterns.value.length - 1];
  const lastCode = lastPattern.code;
  if (lastCode.startsWith('P')) {
    const num = parseInt(lastCode.substring(1), 10);
    if (!isNaN(num)) {
      nextCodeSuggestion.value = `P${String(num + 1).padStart(3, '0')}`;
      return;
    }
  }
  nextCodeSuggestion.value = 'P001';
};

// Lọc dữ liệu hiển thị trên giao diện
const filteredPatterns = computed(() => {
  return patterns.value.filter(p => {
    const matchSearch = p.code.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchSlot = !filterSlot.value || p.slotCode === filterSlot.value;
    const matchSessions = filterSessions.value === null || p.sessionsPerWeek === filterSessions.value;
    return matchSearch && matchSlot && matchSessions;
  });
});

const resetFilters = () => {
  searchQuery.value = '';
  filterSlot.value = '';
  filterSessions.value = null;
};

// Mở Dialog thêm mới
const openAddDialog = () => {
  isEdit.value = false;
  editingId.value = null;
  form.studyDaysList = [];
  form.slotCode = '';
  form.slotStart = '';
  form.slotEnd = '';
  form.sessionsPerWeek = 3;
  form.active = true;
  dialogVisible.value = true;
};

// Mở Dialog sửa
const openEditDialog = (row: SchedulePattern) => {
  isEdit.value = true;
  editingId.value = row.id;
  form.studyDaysList = parseStudyDays(row.studyDays);
  form.slotCode = row.slotCode;
  form.slotStart = row.slotStart;
  form.slotEnd = row.slotEnd;
  form.sessionsPerWeek = row.sessionsPerWeek;
  form.active = row.active;
  dialogVisible.value = true;
};

// Xử lý gửi Form Thêm / Sửa
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // Sắp xếp thứ học tăng dần để hiển thị chuẩn chỉ (2,4,6 tốt hơn 6,2,4)
      const sortedDays = [...form.studyDaysList].sort((a, b) => {
        const numA = a === '1' ? 8 : parseInt(a, 10); // CN (1) xếp ở cuối tuần
        const numB = b === '1' ? 8 : parseInt(b, 10);
        return numA - numB;
      });

      const payload = {
        studyDays: sortedDays.join(','),
        slotCode: form.slotCode,
        slotStart: form.slotStart,
        slotEnd: form.slotEnd,
        sessionsPerWeek: form.studyDaysList.length,
        active: form.active
      };

      submitting.value = true;
      try {
        let res: any;
        if (isEdit.value && editingId.value) {
          res = await api.put(`/class-planning/patterns/${editingId.value}`, payload);
        } else {
          res = await api.post('/class-planning/patterns', payload);
        }

        if (res.success) {
          ElMessage.success(isEdit.value ? t('pattern.success_save_edit') : t('pattern.success_save_create'));
          dialogVisible.value = false;
          fetchPatterns();
        } else {
          ElMessage.error(res.message || t('pattern.error_save'));
        }
      } catch (err: any) {
        ElMessage.error(err.response?.data?.message || t('pattern.error_save_system'));
      } finally {
        submitting.value = false;
      }
    }
  });
};

// Tải lại để toggle active nhanh bằng switch
const handleToggleActive = async (row: SchedulePattern, val: boolean) => {
  try {
    const res: any = await api.put(`/class-planning/patterns/${row.id}/toggle?active=${val}`);
    if (res.success) {
      ElMessage.success(val ? t('pattern.success_status_active', { code: row.code }) : t('pattern.success_status_inactive', { code: row.code }));
    } else {
      row.active = !val; // revert if failed
      ElMessage.error(res.message || t('pattern.error_status'));
    }
  } catch (err: any) {
    row.active = !val; // revert on error
    ElMessage.error(err.response?.data?.message || t('pattern.error_status_system'));
  }
};

// Xóa mẫu lịch
const handleDelete = (row: SchedulePattern) => {
  ElMessageBox.confirm(
    t('pattern.delete_confirm_text', { code: row.code }),
    t('pattern.delete_confirm_title'),
    {
      confirmButtonText: t('pattern.delete_confirm_btn'),
      cancelButtonText: t('pattern.delete_confirm_cancel'),
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res: any = await api.delete(`/class-planning/patterns/${row.id}`);
      if (res.success) {
        ElMessage.success(t('pattern.success_delete', { code: row.code }));
        fetchPatterns();
      } else {
        ElMessage.error(res.message || t('pattern.error_delete'));
      }
    } catch (err: any) {
      ElMessage.error(err.response?.data?.message || t('pattern.error_delete_referenced'));
    }
  }).catch(() => {});
};

onMounted(() => {
  fetchPatterns();
  fetchTimeslots();
});
</script>

<style scoped>
.premium-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.premium-table :deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

.premium-table :deep(.el-table__row:hover) {
  background-color: #f9fafb !important;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
}
</style>
