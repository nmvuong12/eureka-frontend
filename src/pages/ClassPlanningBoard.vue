<template>
  <div class="class-planning-board space-y-6">
    <!-- Page Header với thanh dọc màu emerald -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          Lập kế hoạch mở lớp
        </h1>
        <p class="text-sm text-gray-500 mt-1">Lập kế hoạch mở lớp học, kiểm tra công suất tối đa thực tế và cân bằng sĩ số tuyển sinh.</p>
      </div>
    </div>

    <!-- Hàng trên: Chọn Batch + Capacity Dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Cột trái: Chọn kế hoạch mở lớp -->
      <div class="lg:col-span-4 space-y-4">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" header="Kế hoạch tuyển sinh & khai giảng">
          <div class="space-y-4">
            <el-form label-position="top">
              <el-form-item label="Chọn kế hoạch khai giảng">
                <el-select
                  v-model="selectedBatchId"
                  placeholder="Chọn kế hoạch..."
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
                  <span class="text-xs text-emerald-800 font-bold uppercase tracking-wider">Thông tin chi tiết</span>
                  <el-tag size="small" :type="getBatchStatusType(selectedBatch.status)" effect="dark">
                    {{ getBatchStatusLabel(selectedBatch.status) }}
                  </el-tag>
                </div>
                <div class="text-sm space-y-2 text-gray-700">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Khóa học:</span>
                    <span class="font-bold text-gray-800">{{ selectedBatch.courseName }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Mã khóa học:</span>
                    <span class="font-semibold text-emerald-700">{{ selectedBatch.courseCode }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Thời gian tuyển sinh:</span>
                    <span class="font-medium">
                      {{ formatDate(selectedBatch.enrollmentStartDate) }} - {{ formatDate(selectedBatch.enrollmentEndDate) }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Khai giảng dự kiến:</span>
                    <span class="font-semibold text-teal-700">{{ formatDate(selectedBatch.expectedOpeningDate) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Quy mô tuyển sinh:</span>
                    <span class="font-bold">{{ selectedBatch.forecastScale ?? 0 }} học viên</span>
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
                    Lập kế hoạch Tự động
                  </el-button>
                  <p class="text-[10px] text-indigo-600 text-center leading-relaxed font-semibold">
                    (Phù hợp nhất dựa trên phòng và giáo viên rảnh)
                  </p>
                </div>
              </div>
            </transition>
          </div>
        </el-card>
      </div>

      <!-- Cột phải: Capacity Dashboard -->
      <div class="lg:col-span-8">
        <el-card shadow="sm" class="border border-gray-100 rounded-2xl h-full" header="Bảng công suất lớp học tối đa (Capacity Dashboard)">
          <div v-if="!selectedBatchId" class="h-48 flex flex-col justify-center items-center text-gray-400">
            <el-icon :size="40" class="mb-2"><Calendar /></el-icon>
            <span>Vui lòng chọn một kế hoạch khai giảng ở bên trái để xem công suất nguồn lực thực tế</span>
          </div>

          <div v-else v-loading="capacityLoading" class="space-y-4">
            <el-table :data="capacityDashboard" style="width: 100%" height="220" stripe class="premium-table">
              <el-table-column prop="patternCode" label="Mã" width="70" align="center" />
              <el-table-column prop="displayLabel" label="Lịch học & Ca" min-width="170" />
              <el-table-column prop="capacity" label="Tối đa" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="success" effect="plain" class="font-bold">{{ row.capacity }} lớp</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="occupied" label="Đang học" width="90" align="center" />
              <el-table-column prop="remaining" label="Còn rảnh" width="90" align="center">
                <template #default="{ row }">
                  <span :class="row.remaining > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'">
                    {{ row.remaining }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="availableTeachers" label="GV rảnh" width="90" align="center" />
              <el-table-column prop="availableRooms" label="Phòng trống" width="110" align="center" />
              <el-table-column label="Hành động" width="90" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    :disabled="row.remaining <= 0"
                    @click="selectPattern(row)"
                    class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
                  >
                    Chọn
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- Dialog / Form phụ khi đã chọn pattern -->
            <transition name="fade">
              <div v-if="selectedPatternItem" class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div class="space-y-1">
                  <div class="text-sm font-bold text-gray-800">
                    Đã chọn: Pattern <span class="text-emerald-600">{{ selectedPatternItem.patternCode }}</span> - {{ selectedPatternItem.displayLabel }}
                  </div>
                  <div class="text-xs text-gray-500">
                    Năng lực đáp ứng tối đa còn lại: <span class="font-bold text-emerald-600">{{ selectedPatternItem.remaining }}</span> lớp.
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-gray-600">Số lớp muốn mở:</span>
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
                    Tạo lớp DRAFT
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
          Quy trình quản lý & Mở lớp học
        </h3>

        <!-- Nút thao tác nhanh của Batch -->
        <div class="flex gap-2">
          <el-button
            v-if="hasStatus('DRAFT')"
            type="primary"
            @click="activateEnrollment"
            class="!bg-blue-600 hover:!bg-blue-700 !border-blue-600"
          >
            Kích hoạt tất cả DRAFT tuyển sinh
          </el-button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        <!-- Cột 1: DRAFT (Bản nháp) -->
        <div class="bg-gray-100/70 border border-gray-200 rounded-2xl p-4 flex flex-col h-[520px]">
          <div class="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            <span class="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
              BẢN NHÁP (DRAFT)
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
                <el-tag size="small" type="info">Draft</el-tag>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div><span class="font-medium text-teal-700">{{ c.patternLabel || c.patternCode }}</span></div>
                <div>Sĩ số: <span class="font-semibold text-gray-700">{{ c.studentCount ?? 0 }}</span> học viên</div>
              </div>
              <div class="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
                <el-button type="danger" link size="small" @click="cancelClass(c)">Hủy</el-button>
              </div>
            </div>
            <div v-if="getCountByStatus('DRAFT') === 0" class="h-32 flex justify-center items-center text-xs text-gray-400 italic">
              Không có lớp nháp nào
            </div>
          </div>
        </div>

        <!-- Cột 2: ENROLLING (Tuyển sinh) -->
        <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col h-[520px]">
          <div class="flex justify-between items-center pb-3 border-b border-blue-200 mb-4">
            <span class="text-sm font-bold text-blue-700 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              TUYỂN SINH (ENROLLING)
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
                <el-tag size="small" type="primary">Tuyển sinh</el-tag>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div><span class="font-medium text-teal-700">{{ c.patternLabel || c.patternCode }}</span></div>
                <div>Sĩ số thực tế: <span class="font-bold text-blue-600 text-sm">{{ c.studentCount ?? 0 }}</span> học viên</div>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                <el-button type="danger" link size="small" @click="cancelClass(c)">Hủy</el-button>
                <div class="flex gap-1">
                  <el-button type="primary" size="small" @click="openStudentCountDialog(c)">
                    Nhập sĩ số
                  </el-button>
                </div>
              </div>
            </div>
            <div v-if="getCountByStatus('ENROLLING') === 0" class="h-32 flex justify-center items-center text-xs text-gray-400 italic">
              Không có lớp nào đang tuyển sinh
            </div>
          </div>
        </div>

        <!-- Cột 3: REBALANCING (Cân bằng sĩ số) -->
        <div class="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col h-[520px]">
          <div class="flex justify-between items-center pb-3 border-b border-orange-200 mb-4">
            <span class="text-sm font-bold text-orange-700 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              CÂN BẰNG (REBALANCING)
            </span>
            <el-tag size="small" type="warning" class="font-bold">{{ getCountByStatus('REBALANCING') }}</el-tag>
          </div>
          <div class="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            <!-- Nút Cân bằng theo Pattern nhóm -->
            <div v-if="getUniquePatternsForRebalance().length > 0" class="pb-2 border-b border-orange-100 mb-2">
              <el-dropdown trigger="click" @command="handleRebalanceCommand" class="w-full">
                <el-button type="warning" class="w-full justify-center">
                  Bắt đầu Cân bằng Sĩ số...
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="pid in getUniquePatternsForRebalance()"
                      :key="pid"
                      :command="pid"
                    >
                      Cân bằng Pattern {{ getPatternCodeById(pid) }}
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
                <el-tag size="small" type="warning">Cân bằng</el-tag>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div><span class="font-medium text-teal-700">{{ c.patternLabel || c.patternCode }}</span></div>
                <div>Sĩ số hiện tại: <span class="font-bold text-orange-600 text-sm">{{ c.studentCount ?? 0 }}</span> học viên</div>
                <div v-if="selectedBatch" class="text-[10px] text-gray-400">
                  (Min chuẩn khóa: {{ selectedBatchForecastMin }} học viên)
                </div>
              </div>
              <div class="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                <div class="flex justify-between items-center w-full">
                  <el-button type="danger" link size="small" @click="cancelClass(c)">Hủy</el-button>
                  <el-button type="info" link size="small" @click="openMergeDialog(c)">Gộp lớp</el-button>
                </div>
                <div class="flex justify-between gap-1 w-full mt-1">
                  <el-button
                    type="success"
                    size="small"
                    :disabled="(c.studentCount ?? 0) < selectedBatchForecastMin"
                    @click="openClass(c)"
                    class="flex-1 !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-xs !px-1.5"
                  >
                    Mở lớp
                  </el-button>
                  <el-button
                    type="warning"
                    size="small"
                    @click="forceOpenClass(c)"
                    class="flex-1 !text-xs !px-1.5"
                  >
                    Buộc mở
                  </el-button>
                </div>
              </div>
            </div>
            <div v-if="getCountByStatus('REBALANCING') === 0" class="h-32 flex justify-center items-center text-xs text-gray-400 italic">
              Không có lớp nào cần cân bằng
            </div>
          </div>
        </div>

        <!-- Cột 4: OPEN (Đã mở lớp - Chờ solver xếp lịch) -->
        <div class="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col h-[520px]">
          <div class="flex justify-between items-center pb-3 border-b border-emerald-200 mb-4">
            <span class="text-sm font-bold text-emerald-700 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              ĐÃ MỞ LỚP (OPEN)
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
                <el-tag size="small" type="success">Đã mở</el-tag>
              </div>
              <div class="text-xs text-gray-500 space-y-1">
                <div><span class="font-medium text-teal-700">{{ c.patternLabel || c.patternCode }}</span></div>
                <div>Sĩ số chính thức: <span class="font-bold text-emerald-600">{{ c.studentCount ?? 0 }}</span> học viên</div>
              </div>
              <div class="bg-emerald-50 border border-emerald-100 rounded p-2 text-[10px] text-emerald-800 font-medium text-center">
                Đang chờ chạy Timefold Solver xếp phòng & giáo viên
              </div>
            </div>
            <div v-if="getCountByStatus('OPEN') === 0" class="h-32 flex justify-center items-center text-xs text-gray-400 italic">
              Không có lớp nào đã được mở
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog Nhập sĩ số thực tế -->
    <el-dialog v-model="studentCountDialogVisible" title="Nhập sĩ số thực tế sau tuyển sinh" width="400px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item :label="`Nhập sĩ số lớp ${selectedClass?.classCode}`" required>
          <el-input-number v-model="studentCountInput" :min="0" :max="100" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="studentCountDialogVisible = false">Hủy</el-button>
          <el-button type="primary" :loading="updatingCount" @click="saveStudentCount" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
            Xác nhận
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog Gộp lớp -->
    <el-dialog v-model="mergeDialogVisible" title="Gộp lớp học học viên ít" width="500px" destroy-on-close>
      <div v-if="selectedClass" class="space-y-4">
        <div class="bg-orange-50 border border-orange-100 rounded-xl p-4 text-xs text-orange-800 space-y-1">
          <div>Lớp hiện tại: <span class="font-bold">{{ selectedClass.classCode }}</span> đang có <span class="font-bold">{{ selectedClass.studentCount }}</span> học viên.</div>
          <div>Bạn muốn gộp (chuyển) tất cả học viên của lớp này sang lớp nào khác thuộc cùng một lịch học?</div>
        </div>

        <el-form label-position="top">
          <el-form-item label="Chọn lớp đích để gộp vào" required>
            <el-select v-model="mergeTargetClassId" placeholder="Chọn lớp đích..." class="w-full">
              <el-option
                v-for="c in getAvailableMergeTargets(selectedClass)"
                :key="c.id"
                :label="`${c.classCode} (${c.studentCount ?? 0} học viên)`"
                :value="c.id!"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="mergeDialogVisible = false">Hủy</el-button>
          <el-button type="primary" :loading="merging" @click="executeMerge" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
            Xác nhận gộp lớp
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
    ElMessage.error('Lỗi khi tải danh sách kế hoạch khai giảng');
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
    ElMessage.error('Lỗi khi tải bảng công suất rảnh thực tế');
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
    ElMessage.error('Lỗi khi tải danh sách lớp học');
  } finally {
    classesLoading.value = false;
  }
};

// ---- Handlers & Actions ----

const handleSmartGenerate = async () => {
  if (!selectedBatchId.value) return;

  try {
    await ElMessageBox.confirm(
      'Hệ thống sẽ tự động tính toán số lượng lớp cần mở dựa trên quy mô và phân bổ vào các ca học phù hợp nhất dựa trên phòng học và giáo viên rảnh thực tế. Bạn có chắc chắn muốn thực hiện?',
      'Lập kế hoạch tự động (Phù hợp nhất)',
      {
        confirmButtonText: 'Bắt đầu lập kế hoạch',
        cancelButtonText: 'Hủy',
        type: 'success'
      }
    );

    smartGenerating.value = true;
    const res: any = await api.post('/class-planning/smart-generate', null, {
      params: { batchId: selectedBatchId.value }
    });

    if (res.success) {
      ElMessage.success(`Tự động lập kế hoạch mở lớp thành công! Đã tạo ${res.data?.length ?? 0} lớp bản nháp (DRAFT).`);
      
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
      ElMessage.error(res.message || 'Lập kế hoạch tự động thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || 'Có lỗi hệ thống khi lập kế hoạch tự động');
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
      ElMessage.success(`Đã tạo thành công ${classesToGenerate.value} lớp bản nháp (DRAFT)`);
      selectedPatternItem.value = null;
      classesToGenerate.value = 1;
      
      // Load lại dashboard capacity và danh sách lớp
      if (selectedBatch.value) {
        await fetchCapacityDashboard(selectedBatch.value.courseId);
      }
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Lỗi khi tạo lớp học nháp');
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || 'Có lỗi hệ thống khi tạo lớp nháp');
  } finally {
    generating.value = false;
  }
};

/** Bật trạng thái tuyển sinh cho toàn bộ lớp Draft của Batch */
const activateEnrollment = async () => {
  if (!selectedBatchId.value) return;

  try {
    await ElMessageBox.confirm(
      'Xác nhận kích hoạt tuyển sinh cho toàn bộ lớp DRAFT? Trạng thái các lớp này sẽ chuyển sang ENROLLING.',
      'Xác nhận kích hoạt tuyển sinh',
      {
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        type: 'info'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/batches/${selectedBatchId.value}/activate-enrollment`);
    if (res.success) {
      ElMessage.success('Kích hoạt tuyển sinh thành công');
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Thao tác thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || 'Lỗi khi kích hoạt tuyển sinh');
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
      ElMessage.success('Cập nhật sĩ số thành công');
      studentCountDialogVisible.value = false;
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Thao tác thất bại');
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || 'Lỗi khi cập nhật sĩ số');
  } finally {
    updatingCount.value = false;
  }
};

/** Nhận trigger cân bằng sĩ số (Rebalance) cho từng pattern */
const handleRebalanceCommand = async (patternId: number) => {
  if (!selectedBatchId.value) return;

  try {
    await ElMessageBox.confirm(
      `Xác nhận thực hiện thuật toán cân bằng và phân bổ sĩ số cho các lớp học có lịch học này?`,
      'Cân bằng sĩ số',
      {
        confirmButtonText: 'Bắt đầu',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/batches/${selectedBatchId.value}/rebalance`, null, {
      params: { patternId }
    });

    if (res.success) {
      ElMessage.success(res.data?.message || 'Cân bằng sĩ số thành công');
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Thao tác thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || 'Lỗi cân bằng sĩ số');
    }
  } finally {
    classesLoading.value = false;
  }
};

/** Xác nhận mở lớp bình thường */
const openClass = async (classItem: SchoolClass) => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận mở lớp học chính thức "${classItem.classCode}"? Lớp sẽ được gửi sang Solver xếp lịch.`,
      'Xác nhận mở lớp',
      {
        confirmButtonText: 'Xác nhận mở',
        cancelButtonText: 'Hủy',
        type: 'success'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/classes/${classItem.id}/open`);
    if (res.success) {
      ElMessage.success('Đã mở lớp học thành công');
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Thao tác mở lớp thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || 'Lỗi mở lớp');
    }
  } finally {
    classesLoading.value = false;
  }
};

/** Buộc mở lớp khi sĩ số ít */
const forceOpenClass = async (classItem: SchoolClass) => {
  try {
    await ElMessageBox.confirm(
      `Sĩ số của lớp (${classItem.studentCount}) hiện đang thấp hơn mức chuẩn tối thiểu (${selectedBatchForecastMin.value}). Bạn có chắc chắn muốn BUỘC mở lớp học này?`,
      'Buộc mở lớp (Force Open)',
      {
        confirmButtonText: 'Chấp nhận buộc mở',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/classes/${classItem.id}/force-open`);
    if (res.success) {
      ElMessage.success('Buộc mở lớp học thành công');
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Thao tác buộc mở lớp thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || 'Lỗi buộc mở lớp');
    }
  } finally {
    classesLoading.value = false;
  }
};

/** Hủy lớp */
const cancelClass = async (classItem: SchoolClass) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `Bạn có chắc chắn muốn hủy bỏ lớp học "${classItem.classCode}"? Hãy nhập lý do hủy lớp.`,
      'Hủy lớp học',
      {
        confirmButtonText: 'Xác nhận hủy lớp',
        cancelButtonText: 'Quay lại',
        inputPlaceholder: 'Lý do hủy (ví dụ: sĩ số quá ít không gộp được lớp)...',
        type: 'error'
      }
    );

    classesLoading.value = true;
    const res: any = await api.post(`/class-planning/classes/${classItem.id}/cancel`, {
      reason: reason || 'Hủy do yêu cầu của quản lý'
    });

    if (res.success) {
      ElMessage.success('Đã hủy lớp học thành công');
      if (selectedBatch.value) {
        await fetchCapacityDashboard(selectedBatch.value.courseId);
      }
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Hủy lớp học thất bại');
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || 'Lỗi hủy lớp');
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
      ElMessage.success('Gộp lớp thành công! Toàn bộ học viên đã được gom vào lớp mới.');
      mergeDialogVisible.value = false;
      await fetchClasses();
    } else {
      ElMessage.error(res.message || 'Thao tác gộp lớp thất bại');
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || 'Lỗi hệ thống khi gộp lớp');
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
    PLANNING: 'Đang lên kế hoạch',
    ENROLLING: 'Đang tuyển sinh',
    OPENED: 'Đã mở khóa học',
    CLOSED: 'Đã đóng kế hoạch',
    CANCELLED: 'Đã hủy'
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
