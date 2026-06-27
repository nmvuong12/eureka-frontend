<template>
  <div class="class-planning-board space-y-6">
    <!-- Page Header với thanh dọc màu emerald -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('planning.title') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ $t('planning.desc') }}</p>
      </div>
    </div>

    <!-- Hàng trên: Chọn Batch + Capacity Dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Cột trái: Chọn kế hoạch mở lớp -->
      <div class="lg:col-span-4 space-y-4">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" :header="$t('planning.card_batch')">
          <div class="space-y-4">
            <el-form label-position="top">
              <el-form-item :label="$t('planning.select_batch')">
                <el-select
                  v-model="selectedBatchId"
                  :placeholder="$t('planning.select_batch_placeholder')"
                  filterable
                  class="w-full"
                  @change="handleBatchChange"
                >
                  <el-option
                    v-for="batch in activeBatches"
                    :key="batch.id"
                    :label="`${batch.batchName} (${batch.courseCode})`"
                    :value="batch.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>

            <!-- Chi tiết kế hoạch đã chọn -->
            <transition name="fade">
              <div v-if="selectedBatch" class="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span class="text-xs text-emerald-800 font-bold uppercase tracking-wider">{{ $t('planning.detail_title') }}</span>
                  <el-tag size="small" :type="getBatchStatusType(selectedBatch.status)" effect="dark">
                    {{ getBatchStatusLabel(selectedBatch.status) }}
                  </el-tag>
                </div>
                <div class="text-sm space-y-2 text-gray-700">
                  <div class="flex justify-between">
                    <span class="text-gray-400">{{ $t('planning.detail_course') }}</span>
                    <span class="font-bold text-gray-800">{{ selectedBatch.courseName }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">{{ $t('planning.detail_code') }}</span>
                    <span class="font-semibold text-emerald-700">{{ selectedBatch.courseCode }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">{{ $t('planning.detail_enroll_time') }}</span>
                    <span class="font-medium">
                      {{ formatDate(selectedBatch.enrollmentStartDate) }} - {{ formatDate(selectedBatch.enrollmentEndDate) }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">{{ $t('planning.detail_expected_open') }}</span>
                    <span class="font-semibold text-teal-700">{{ formatDate(selectedBatch.expectedOpeningDate) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">{{ $t('planning.detail_forecast_scale') }}</span>
                    <span class="font-bold">{{ $t('planning.detail_students', { count: selectedBatch.forecastScale ?? 0 }) }}</span>
                  </div>
                </div>

                <!-- Nút Lập kế hoạch Tự động (Phù hợp nhất) -->
                <div v-if="selectedBatch.status === 'PLANNING'" class="pt-4 border-t border-emerald-100 mt-2 space-y-2">
                  <el-button
                    type="primary"
                    :loading="smartGenerating"
                    class="w-full !bg-gradient-to-r !from-indigo-600 !to-violet-700 hover:!from-indigo-700 hover:!to-violet-800 !border-none !rounded-xl !py-5 flex items-center justify-center gap-2 font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                    @click="handleSmartGenerate"
                  >
                    <el-icon><Cpu /></el-icon>
                    {{ $t('planning.btn_auto_plan') }}
                  </el-button>
                  <p class="text-[10px] text-indigo-600 text-center leading-relaxed font-semibold">
                    {{ $t('planning.auto_plan_help') }}
                  </p>
                </div>
              </div>
            </transition>
          </div>
        </el-card>
      </div>

      <!-- Cột phải: Capacity Dashboard -->
      <div class="lg:col-span-8">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" :header="$t('planning.card_capacity')">
          <div v-if="!selectedBatchId" class="h-48 flex flex-col justify-center items-center text-gray-400">
            <el-icon :size="40" class="mb-2"><Calendar /></el-icon>
            <span>{{ $t('planning.capacity_select_batch') }}</span>
          </div>

          <div v-else v-loading="capacityLoading" class="space-y-4">
            <el-table :data="capacityDashboard" style="width: 100%" height="220" stripe class="premium-table">
              <el-table-column prop="patternCode" :label="$t('planning.col_code')" width="70" align="center" />
              <el-table-column prop="displayLabel" :label="$t('planning.col_pattern')" min-width="170" />
              <el-table-column prop="capacity" :label="$t('planning.col_max')" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="success" effect="plain" class="font-bold">{{ $t('planning.col_max_val', { count: row.capacity }) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="occupied" :label="$t('planning.col_studying')" width="90" align="center" />
              <el-table-column prop="remaining" :label="$t('planning.col_free')" width="90" align="center">
                <template #default="{ row }">
                  <span :class="row.remaining > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'">
                    {{ row.remaining }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="availableTeachers" :label="$t('planning.col_free_teachers')" width="90" align="center" />
              <el-table-column prop="availableRooms" :label="$t('planning.col_free_rooms')" width="110" align="center" />
              <el-table-column :label="$t('planning.col_action')" width="90" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    :disabled="row.remaining <= 0"
                    @click="selectPattern(row)"
                    class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
                  >
                    {{ $t('planning.btn_select') }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- Dialog / Form phụ khi đã chọn pattern -->
            <transition name="fade">
              <div v-if="selectedPatternItem" class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div class="space-y-1">
                  <div class="text-sm font-bold text-gray-800" v-html="$t('planning.selected_pattern', { code: '<span class=\'text-emerald-600\'>' + selectedPatternItem.patternCode + '</span>', label: selectedPatternItem.displayLabel })">
                  </div>
                  <div class="text-xs text-gray-500" v-html="$t('planning.remaining_capacity', { count: '<span class=\'font-bold text-emerald-600\'>' + selectedPatternItem.remaining + '</span>' })">
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-gray-600">{{ $t('planning.classes_to_open') }}</span>
                  <el-input-number
                    v-model="classesToGenerate"
                    :min="1"
                    :max="selectedPatternItem.remaining"
                    size="default"
                    class="w-28"
                  />
                  <el-button
                    type="primary"
                    :loading="generating"
                    @click="generateDraftClasses"
                    class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
                  >
                    {{ $t('planning.btn_generate_draft') }}
                  </el-button>
                </div>
              </div>
            </transition>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Kanban Board các trạng thái lớp học -->
    <div v-if="selectedBatchId" v-loading="classesLoading" class="space-y-4">
      <div class="flex items-center justify-between pb-2">
        <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <el-icon class="text-emerald-600"><SetUp /></el-icon>
          {{ $t('planning.workflow_title') }}
        </h3>

        <!-- Nút thao tác nhanh của Batch -->
        <div class="flex gap-2">
          <el-button
            v-if="hasStatus('DRAFT')"
            type="primary"
            @click="activateEnrollment"
            class="!bg-blue-600 hover:!bg-blue-700 !border-blue-600"
          >
            {{ $t('planning.btn_activate_drafts') }}
          </el-button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        <!-- Cột 1: DRAFT (Bản nháp) -->
        <div class="bg-gray-100/70 border border-gray-200 rounded-2xl p-4 flex flex-col h-[520px]">
          <div class="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            <span class="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
              {{ $t('planning.step_draft') }}
            </span>
            <el-tag size="small" type="info" class="font-bold">{{ getCountByStatus('DRAFT') }}</el-tag>
          </div>
          <div class="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            <div
              v-for="c in getClassesByStatus('DRAFT')"
              :key="c.id"
              class="planning-card bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3"
            >
              <div class="flex justify-between items-start">
                <span class="font-bold text-gray-800 text-sm">{{ c.classCode }}</span>
                <el-tag size="small" type="info">{{ $t('planning.step_draft') }}</el-tag>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div><span class="font-medium text-teal-700">{{ c.patternLabel || c.patternCode }}</span></div>
                <div v-html="$t('planning.student_count_label', { count: '<span class=\'font-semibold text-gray-700\'>' + (c.studentCount ?? 0) + '</span>' })"></div>
              </div>
              <div class="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
                <el-button type="danger" link size="small" @click="cancelClass(c)">{{ $t('planning.btn_cancel') }}</el-button>
              </div>
            </div>
            <div v-if="getCountByStatus('DRAFT') === 0" class="h-32 flex justify-center items-center text-xs text-gray-400 italic">
              {{ $t('planning.no_draft_classes') }}
            </div>
          </div>
        </div>

        <!-- Cột 2: ENROLLING (Tuyển sinh) -->
        <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col h-[520px]">
          <div class="flex justify-between items-center pb-3 border-b border-blue-200 mb-4">
            <span class="text-sm font-bold text-blue-700 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              {{ $t('planning.step_enrolling') }}
            </span>
            <el-tag size="small" type="primary" class="font-bold">{{ getCountByStatus('ENROLLING') }}</el-tag>
          </div>
          <div class="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            <div
              v-for="c in getClassesByStatus('ENROLLING')"
              :key="c.id"
              class="planning-card bg-white border border-blue-100 rounded-xl p-4 shadow-sm space-y-3"
            >
              <div class="flex justify-between items-start">
                <span class="font-bold text-gray-800 text-sm">{{ c.classCode }}</span>
                <el-tag size="small" type="primary">{{ $t('planning.enrolling_tag') }}</el-tag>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div><span class="font-medium text-teal-700">{{ c.patternLabel || c.patternCode }}</span></div>
                <div v-html="$t('planning.student_count_actual', { count: '<span class=\'font-bold text-blue-600 text-sm\'>' + (c.studentCount ?? 0) + '</span>' })"></div>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                <el-button type="danger" link size="small" @click="cancelClass(c)">{{ $t('planning.btn_cancel') }}</el-button>
                <div class="flex gap-1">
                  <el-button type="primary" size="small" @click="openStudentCountDialog(c)">
                    {{ $t('planning.btn_input_count') }}
                  </el-button>
                </div>
              </div>
            </div>
            <div v-if="getCountByStatus('ENROLLING') === 0" class="h-32 flex justify-center items-center text-xs text-gray-400 italic">
              {{ $t('planning.no_enrolling_classes') }}
            </div>
          </div>
        </div>

        <!-- Cột 3: REBALANCING (Cân bằng sĩ số) -->
        <div class="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col h-[520px]">
          <div class="flex justify-between items-center pb-3 border-b border-orange-200 mb-4">
            <span class="text-sm font-bold text-orange-700 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              {{ $t('planning.step_rebalancing') }}
            </span>
            <el-tag size="small" type="warning" class="font-bold">{{ getCountByStatus('REBALANCING') }}</el-tag>
          </div>
          <div class="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            <!-- Nút Cân bằng theo Pattern nhóm -->
            <div v-if="getUniquePatternsForRebalance().length > 0" class="pb-2 border-b border-orange-100 mb-2">
              <el-dropdown trigger="click" @command="handleRebalanceCommand" class="w-full">
                <el-button type="warning" class="w-full justify-center">
                  {{ $t('planning.btn_start_rebalance') }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="pid in getUniquePatternsForRebalance()"
                      :key="pid"
                      :command="pid"
                    >
                      {{ $t('planning.btn_rebalance_pattern', { code: getPatternCodeById(pid) }) }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div
              v-for="c in getClassesByStatus('REBALANCING')"
              :key="c.id"
              class="planning-card bg-white border border-orange-100 rounded-xl p-4 shadow-sm space-y-3"
            >
              <div class="flex justify-between items-start">
                <span class="font-bold text-gray-800 text-sm">{{ c.classCode }}</span>
                <el-tag size="small" type="warning">{{ $t('planning.rebalancing_tag') }}</el-tag>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div><span class="font-medium text-teal-700">{{ c.patternLabel || c.patternCode }}</span></div>
                <div v-html="$t('planning.student_count_current', { count: '<span class=\'font-bold text-orange-600 text-sm\'>' + (c.studentCount ?? 0) + '</span>' })"></div>
                <div v-if="selectedBatch" class="text-[10px] text-gray-400">
                  {{ $t('planning.min_course_standard', { count: selectedBatchForecastMin }) }}
                </div>
              </div>
              <div class="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                <div class="flex justify-between items-center w-full">
                  <el-button type="danger" link size="small" @click="cancelClass(c)">{{ $t('planning.btn_cancel') }}</el-button>
                  <el-button type="info" link size="small" @click="openMergeDialog(c)">{{ $t('planning.btn_merge') }}</el-button>
                </div>
                <div class="flex justify-between gap-1 w-full mt-1">
                  <el-button
                    type="success"
                    size="small"
                    :disabled="(c.studentCount ?? 0) < selectedBatchForecastMin"
                    @click="openClass(c)"
                    class="flex-1 !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-xs !px-1.5"
                  >
                    {{ $t('planning.btn_open') }}
                  </el-button>
                  <el-button
                    type="warning"
                    size="small"
                    @click="forceOpenClass(c)"
                    class="flex-1 !text-xs !px-1.5"
                  >
                    {{ $t('planning.btn_force_open') }}
                  </el-button>
                </div>
              </div>
            </div>
            <div v-if="getCountByStatus('REBALANCING') === 0" class="h-32 flex justify-center items-center text-xs text-gray-400 italic">
              {{ $t('planning.no_rebalancing_classes') }}
            </div>
          </div>
        </div>

        <!-- Cột 4: OPEN (Đã mở lớp - Chờ solver xếp lịch) -->
        <div class="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col h-[520px]">
          <div class="flex justify-between items-center pb-3 border-b border-emerald-200 mb-4">
            <span class="text-sm font-bold text-emerald-700 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {{ $t('planning.step_opened') }}
            </span>
            <el-tag size="small" type="success" class="font-bold">{{ getCountByStatus('OPEN') }}</el-tag>
          </div>
          <div class="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            <div
              v-for="c in getClassesByStatus('OPEN')"
              :key="c.id"
              class="planning-card bg-white border border-emerald-200 rounded-xl p-4 shadow-md space-y-3 relative overflow-hidden"
            >
              <div class="absolute right-0 top-0 w-8 h-8 bg-emerald-500 text-white rounded-bl-xl flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div class="flex justify-between items-start pr-6">
                <span class="font-bold text-gray-800 text-sm">{{ c.classCode }}</span>
                <el-tag size="small" type="success">{{ $t('planning.opened_tag') }}</el-tag>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div><span class="font-medium text-teal-700">{{ c.patternLabel || c.patternCode }}</span></div>
                <div v-html="$t('planning.student_count_official', { count: '<span class=\'font-bold text-emerald-600\'>' + (c.studentCount ?? 0) + '</span>' })"></div>
              </div>
              <div class="bg-emerald-50 border border-emerald-100 rounded p-2 text-[10px] text-emerald-800 font-medium text-center">
                {{ $t('planning.waiting_solver') }}
              </div>
            </div>
            <div v-if="getCountByStatus('OPEN') === 0" class="h-32 flex justify-center items-center text-xs text-gray-400 italic">
              {{ $t('planning.no_opened_classes') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog Nhập sĩ số thực tế -->
    <el-dialog v-model="studentCountDialogVisible" :title="$t('planning.dialog_input_title')" width="400px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item :label="$t('planning.dialog_input_label', { code: selectedClass?.classCode })" required>
          <el-input-number v-model="studentCountInput" :min="0" :max="100" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="studentCountDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="updatingCount" @click="saveStudentCount" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
            {{ $t('common.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog Gộp lớp -->
    <el-dialog v-model="mergeDialogVisible" :title="$t('planning.dialog_merge_title')" width="500px" destroy-on-close>
      <div v-if="selectedClass" class="space-y-4">
        <div class="bg-orange-50 border border-orange-100 rounded-xl p-4 text-xs text-orange-800 space-y-1" v-html="$t('planning.dialog_merge_desc', { code: '<span class=\'font-bold\'>' + selectedClass.classCode + '</span>', count: '<span class=\'font-bold\'>' + selectedClass.studentCount + '</span>' })">
        </div>

        <el-form label-position="top">
          <el-form-item :label="$t('planning.dialog_merge_label')" required>
            <el-select v-model="mergeTargetClassId" :placeholder="$t('planning.dialog_merge_placeholder')" class="w-full">
              <el-option
                v-for="c in getAvailableMergeTargets(selectedClass)"
                :key="c.id"
                :label="$t('planning.dialog_merge_option', { code: c.classCode, count: c.studentCount ?? 0 })"
                :value="c.id!"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="mergeDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="merging" @click="executeMerge" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
            {{ $t('planning.btn_confirm_merge') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import type { CourseBatch, CapacityDashboardItem, SchoolClass } from '@/types';
import { Calendar, SetUp, ArrowDown, Cpu } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();


// ---- State ----
const activeBatches = ref<CourseBatch[]>([]);
const selectedBatchId = ref<number | null>(null);
const selectedBatch = ref<CourseBatch | null>(null);

const capacityDashboard = ref<CapacityDashboardItem[]>([]);
const capacityLoading = ref(false);
const selectedPatternItem = ref<CapacityDashboardItem | null>(null);
const classesToGenerate = ref(1);
const generating = ref(false);
const smartGenerating = ref(false);

const classes = ref<SchoolClass[]>([]);
const classesLoading = ref(false);

// Dialog Nhập sĩ số
const studentCountDialogVisible = ref(false);
const selectedClass = ref<SchoolClass | null>(null);
const studentCountInput = ref(0);
const updatingCount = ref(false);

// Dialog Gộp lớp
const mergeDialogVisible = ref(false);
const mergeTargetClassId = ref<number | null>(null);
const merging = ref(false);

// ---- Computeds ----
const selectedBatchForecastMin = computed(() => {
  // Lấy min_students tương ứng của khóa học từ config hoặc tạm lấy mặc định 15 học viên nếu không có
  return 15;
});

// ---- Fetching Data ----
const fetchActiveBatches = async () => {
  try {
    // Chỉ tải kế hoạch đang lập kế hoạch PLANNING hoặc đang tuyển sinh ENROLLING
    const res: any = await api.get('/course-batches');
    if (res.success) {
      const all: CourseBatch[] = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
      activeBatches.value = all.filter(
        b => b.status === 'PLANNING' || b.status === 'ENROLLING' || b.status === 'OPENED'
      );
    }
  } catch (err) {
    ElMessage.error(t('planning.error_load_batches'));
  }
};

const handleBatchChange = async (batchId: number) => {
  selectedBatch.value = activeBatches.value.find(b => b.id === batchId) || null;
  selectedPatternItem.value = null;
  classesToGenerate.value = 1;

  if (selectedBatch.value) {
    await fetchCapacityDashboard(selectedBatch.value.courseId);
    await fetchClasses();
  }
};

const fetchCapacityDashboard = async (courseId: number) => {
  capacityLoading.value = true;
  try {
    const res: any = await api.get('/class-planning/capacity', { params: { courseId } });
    if (res.success) {
      capacityDashboard.value = Array.isArray(res.data) ? res.data : [];
    }
  } catch (err) {
    ElMessage.error(t('planning.error_load_capacity'));
  } finally {
    capacityLoading.value = false;
  }
};

const fetchClasses = async () => {
  if (!selectedBatchId.value) return;
  classesLoading.value = true;
  try {
    const res: any = await api.get('/class-planning/classes', {
      params: { batchId: selectedBatchId.value }
    });
    if (res.success) {
      classes.value = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
    }
  } catch (err) {
    ElMessage.error(t('planning.error_load_classes'));
  } finally {
    classesLoading.value = false;
  }
};

// ---- Handlers & Actions ----

const handleSmartGenerate = async () => {
  if (!selectedBatchId.value) return;

  try {
    await ElMessageBox.confirm(
      t('planning.auto_plan_confirm_text'),
      t('planning.auto_plan_confirm_title'),
      {
        confirmButtonText: t('planning.auto_plan_confirm_btn'),
        cancelButtonText: t('common.cancel'),
        type: 'success'
      }
    );

    smartGenerating.value = true;
    const res: any = await api.post('/class-planning/smart-generate', null, {
      params: { batchId: selectedBatchId.value }
    });

    if (res.success) {
      ElMessage.success(t('planning.auto_plan_success', { count: res.data?.length ?? 0 }));
      
      // Load lại dashboard capacity và danh sách lớp
      if (selectedBatch.value) {
        await fetchCapacityDashboard(selectedBatch.value.courseId);
        // Refresh batch details to reflect any changes (like status change to GENERATED)
        await fetchActiveBatches();
        // Update selectedBatch reference from the refreshed list
        selectedBatch.value = activeBatches.value.find(b => b.id === selectedBatchId.value) || null;
      }
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('planning.auto_plan_failed'));
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('planning.auto_plan_failed'));
    }
  } finally {
    smartGenerating.value = false;
  }
};

const selectPattern = (row: CapacityDashboardItem) => {
  selectedPatternItem.value = row;
  classesToGenerate.value = 1;
};

/** Tạo các lớp DRAFT từ pattern được chọn */
const generateDraftClasses = async () => {
  if (!selectedBatchId.value || !selectedPatternItem.value) return;
  
  generating.value = true;
  try {
    const res: any = await api.post('/class-planning/generate', {
      batchId: selectedBatchId.value,
      patternId: selectedPatternItem.value.patternId,
      count: classesToGenerate.value
    });

    if (res.success) {
      ElMessage.success(t('planning.draft_create_success', { count: classesToGenerate.value }));
      selectedPatternItem.value = null;
      classesToGenerate.value = 1;
      
      // Load lại dashboard capacity và danh sách lớp
      if (selectedBatch.value) {
        await fetchCapacityDashboard(selectedBatch.value.courseId);
      }
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('planning.draft_create_failed'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('planning.draft_create_failed'));
  } finally {
    generating.value = false;
  }
};

/** Bật trạng thái tuyển sinh cho toàn bộ lớp Draft của Batch */
const activateEnrollment = async () => {
  if (!selectedBatchId.value) return;

  try {
    await ElMessageBox.confirm(
      t('planning.activate_confirm_text'),
      t('planning.activate_confirm_title'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'info'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/batches/${selectedBatchId.value}/activate-enrollment`);
    if (res.success) {
      ElMessage.success(t('planning.activate_success'));
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('common.error'));
    }
  } finally {
    classesLoading.value = false;
  }
};

/** Nhập sĩ số cho lớp Enrolling */
const openStudentCountDialog = (classItem: SchoolClass) => {
  selectedClass.value = classItem;
  studentCountInput.value = classItem.studentCount ?? 0;
  studentCountDialogVisible.value = true;
};

const saveStudentCount = async () => {
  if (!selectedClass.value || !selectedClass.value.id) return;

  updatingCount.value = true;
  try {
    const res: any = await api.put(`/class-planning/classes/${selectedClass.value.id}/student-count`, {
      studentCount: studentCountInput.value
    });

    if (res.success) {
      ElMessage.success(t('planning.student_count_success'));
      studentCountDialogVisible.value = false;
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('common.error'));
  } finally {
    updatingCount.value = false;
  }
};

/** Nhận trigger cân bằng sĩ số (Rebalance) cho từng pattern */
const handleRebalanceCommand = async (patternId: number) => {
  if (!selectedBatchId.value) return;

  try {
    await ElMessageBox.confirm(
      t('planning.rebalance_confirm_text'),
      t('planning.rebalance_confirm_title'),
      {
        confirmButtonText: t('planning.rebalance_confirm_btn'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/batches/${selectedBatchId.value}/rebalance`, null, {
      params: { patternId }
    });

    if (res.success) {
      ElMessage.success(res.data?.message || t('planning.rebalance_confirm_title') + ' ' + t('common.success'));
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('common.error'));
    }
  } finally {
    classesLoading.value = false;
  }
};

/** Xác nhận mở lớp bình thường */
const openClass = async (classItem: SchoolClass) => {
  try {
    await ElMessageBox.confirm(
      t('planning.open_confirm_text', { code: classItem.classCode }),
      t('planning.open_confirm_title'),
      {
        confirmButtonText: t('planning.open_confirm_btn'),
        cancelButtonText: t('common.cancel'),
        type: 'success'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/classes/${classItem.id}/open`);
    if (res.success) {
      ElMessage.success(t('planning.open_success'));
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('planning.open_failed'));
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('planning.open_failed'));
    }
  } finally {
    classesLoading.value = false;
  }
};

/** Buộc mở lớp khi sĩ số ít */
const forceOpenClass = async (classItem: SchoolClass) => {
  try {
    await ElMessageBox.confirm(
      t('planning.force_open_confirm_text', { count: classItem.studentCount, min: selectedBatchForecastMin.value }),
      t('planning.force_open_confirm_title'),
      {
        confirmButtonText: t('planning.force_open_confirm_btn'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/classes/${classItem.id}/force-open`);
    if (res.success) {
      ElMessage.success(t('planning.force_open_success'));
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('planning.force_open_failed'));
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('planning.force_open_failed'));
    }
  } finally {
    classesLoading.value = false;
  }
};

/** Hủy lớp */
const cancelClass = async (classItem: SchoolClass) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      t('planning.cancel_confirm_text', { code: classItem.classCode }),
      t('planning.cancel_confirm_title'),
      {
        confirmButtonText: t('planning.cancel_confirm_btn'),
        cancelButtonText: t('planning.cancel_confirm_back'),
        inputPlaceholder: t('planning.cancel_placeholder'),
        type: 'error'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/classes/${classItem.id}/cancel`, {
      reason: reason || t('planning.cancel_default_reason')
    });

    if (res.success) {
      ElMessage.success(t('planning.cancel_success'));
      if (selectedBatch.value) {
        await fetchCapacityDashboard(selectedBatch.value.courseId);
      }
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('planning.cancel_failed'));
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('planning.cancel_failed'));
    }
  } finally {
    classesLoading.value = false;
  }
};

/** Mở dialog gộp lớp */
const openMergeDialog = (classItem: SchoolClass) => {
  selectedClass.value = classItem;
  mergeTargetClassId.value = null;
  mergeDialogVisible.value = true;
};

const executeMerge = async () => {
  if (!selectedClass.value || !mergeTargetClassId.value) return;

  merging.value = true;
  try {
    const res: any = await api.post('/class-planning/merge', {
      sourceClassIds: [selectedClass.value.id],
      targetClassId: mergeTargetClassId.value
    });

    if (res.success) {
      ElMessage.success(t('planning.merge_success'));
      mergeDialogVisible.value = false;
      await fetchClasses();
    } else {
      ElMessage.error(res.message || t('planning.merge_failed'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('planning.merge_failed'));
  } finally {
    merging.value = false;
  }
};


// ---- Helpers ----

const getClassesByStatus = (status: string) => {
  return classes.value.filter(c => c.status === status);
};

const getCountByStatus = (status: string) => {
  return getClassesByStatus(status).length;
};

const hasStatus = (status: string) => {
  return getCountByStatus(status) > 0;
};

const getUniquePatternsForRebalance = () => {
  const activeClasses = classes.value.filter(c => c.status === 'ENROLLING' || c.status === 'REBALANCING');
  const ids = activeClasses
    .map(c => c.schedulePatternId)
    .filter((id): id is number => id !== undefined && id !== null);
  return Array.from(new Set(ids));
};

const getPatternCodeById = (id: number) => {
  const c = classes.value.find(item => item.schedulePatternId === id);
  return c?.patternCode || `Pattern #${id}`;
};

const getAvailableMergeTargets = (sourceClass: SchoolClass) => {
  // Lớp đích phải cùng batch, cùng schedule_pattern_id và ở trạng thái ENROLLING hoặc REBALANCING, và khác chính lớp nguồn
  return classes.value.filter(
    c => c.id !== sourceClass.id &&
         c.batchId === sourceClass.batchId &&
         c.schedulePatternId === sourceClass.schedulePatternId &&
         (c.status === 'ENROLLING' || c.status === 'REBALANCING')
  );
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
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
    PLANNING: t('batch.status_planning'),
    ENROLLING: t('batch.status_enrolling'),
    OPENED: t('batch.status_opened'),
    CLOSED: t('batch.status_closed'),
    CANCELLED: t('batch.status_cancelled')
  };
  return map[status ?? ''] ?? status ?? '—';
};

onMounted(() => {
  fetchActiveBatches();
});
</script>

<style scoped>
.premium-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  border-radius: 12px;
}

.planning-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.planning-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
