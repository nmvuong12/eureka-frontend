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
    </div>

    <!-- Bộ tìm kiếm nâng cao (Premium Advanced Search Panel) -->
    <el-card class="border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md" :body-style="{ padding: '24px' }">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <el-icon class="text-emerald-500"><Search /></el-icon>
          Bộ lọc nâng cao
        </h2>
        <div class="flex items-center gap-2">
          <el-button 
            v-if="selectedLessons.length > 0" 
            type="warning" 
            @click="openBatchAdjustmentDialog"
            class="!bg-amber-600 hover:!bg-amber-700 !border-amber-600 shadow-md transition-all duration-300 mr-2"
          >
            <el-icon class="mr-1"><Edit /></el-icon>
            Điều phối hàng loạt ({{ selectedLessons.length }})
          </el-button>
          <el-button type="primary" @click="fetchDailyDispatch" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
            <el-icon class="mr-1"><Search /></el-icon>
            Tìm kiếm
          </el-button>
          <el-button @click="resetSearch" class="hover:text-emerald-600 hover:border-emerald-200">
            <el-icon class="mr-1"><Refresh /></el-icon>
            Đặt lại
          </el-button>
        </div>
      </div>

      <el-form :model="searchForm" label-position="top" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Kế hoạch khai giảng -->
        <el-form-item label="Kế hoạch khai giảng" class="!mb-0 font-semibold text-gray-700">
          <el-select 
            v-model="searchForm.batchId" 
            placeholder="Tất cả kế hoạch..." 
            filterable 
            clearable 
            @change="onBatchChange"
            class="w-full premium-select"
          >
            <el-option
              v-for="bt in batches"
              :key="bt.id"
              :value="bt.id"
              :label="bt.batchName || bt.name"
            />
          </el-select>
        </el-form-item>

        <!-- Lớp học -->
        <el-form-item label="Lớp học" class="!mb-0 font-semibold text-gray-700">
          <el-select 
            v-model="searchForm.classId" 
            placeholder="Chọn lớp học..." 
            filterable 
            clearable 
            class="w-full premium-select"
          >
            <el-option
              v-for="cl in classes"
              :key="cl.id"
              :value="cl.id"
              :label="cl.name || cl.classCode"
            />
          </el-select>
        </el-form-item>

        <!-- Giáo viên -->
        <el-form-item label="Giáo viên" class="!mb-0 font-semibold text-gray-700">
          <el-select 
            v-model="searchForm.teacherId" 
            placeholder="Tất cả giáo viên..." 
            filterable 
            clearable 
            class="w-full premium-select"
          >
            <el-option
              v-for="tc in teachers"
              :key="tc.id"
              :value="tc.id"
              :label="tc.fullName"
            />
          </el-select>
        </el-form-item>

        <!-- Ngày học (từ ngày - đến ngày) -->
        <el-form-item label="Ngày học" class="!mb-0 font-semibold text-gray-700">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            :clearable="false"
            class="!w-full premium-date-range"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Danh sách buổi học trong ngày -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0px' }" v-loading="loading">
      <el-table
        :data="paginatedEntries"
        style="width: 100%"
        stripe
        class="premium-table"
        @selection-change="handleSelectionChange"
      >
        <!-- Checkbox Selection Column -->
        <el-table-column type="selection" width="55" align="center" />

        <!-- Ngày học -->
        <el-table-column label="Ngày học" min-width="125">
          <template #default="{ row }">
            <div class="font-bold text-gray-900">{{ formatDateLabel(row.sessionDate) }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ row.dayOfWeek }}</div>
          </template>
        </el-table-column>

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
          <el-empty :description="`Không tìm thấy buổi học nào phù hợp với bộ lọc trong khoảng thời gian ${formatDateRangeLabel(searchForm.dateRange)}`" />
        </template>
      </el-table>

      <!-- Pagination Footer -->
      <div class="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
        <div class="text-xs text-gray-500">Hiển thị {{ paginatedEntries.length }} / tổng số {{ dispatchEntries.length }} buổi học.</div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 15, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="dispatchEntries.length"
          class="premium-pagination"
        />
      </div>
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

        <el-form :model="adjustmentForm" label-position="top" v-loading="checkingValidation">
          <!-- 1. Hoãn / Thay đổi ngày học cụ thể -->
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

          <!-- 2. Thay đổi ca học cố định trong tuần -->
          <el-form-item label="Ca học (Timeslot)">
            <el-select v-model="adjustmentForm.timeslotId" placeholder="Chọn ca học cố định..." filterable clearable class="w-full">
              <el-option
                v-for="ts in optimizedTimeslots"
                :key="ts.id"
                :value="ts.id"
                :label="ts.label + ' (' + (ts.startTime ? ts.startTime.substring(0, 5) : '') + ' - ' + (ts.endTime ? ts.endTime.substring(0, 5) : '') + ')' + (ts.id === selectedEntry?.timeslotId ? ' (Hiện tại)' : (ts.isOccupied ? ' (Bận phòng/GV)' : ' (Trống)'))"
                :class="ts.isOccupied ? '!text-gray-400 italic' : '!text-emerald-700 !font-semibold'"
              />
            </el-select>
          </el-form-item>

          <!-- 3. Thay đổi phòng học -->
          <el-form-item label="Phòng học">
            <div class="flex flex-col gap-1.5 w-full">
              <el-select v-model="adjustmentForm.roomId" placeholder="Chọn phòng học mới..." filterable clearable class="w-full">
                <el-option
                  v-for="rm in optimizedRooms"
                  :key="rm.id"
                  :value="rm.id"
                  :label="rm.name + (rm.id === selectedEntry?.roomId ? ' (Hiện tại)' : (rm.isOccupied ? ' (Đã bị chiếm ca này)' : ' (Trống)'))"
                  :class="rm.isOccupied ? '!text-gray-400 italic' : '!text-emerald-700 !font-semibold'"
                />
              </el-select>
              <!-- Cảnh báo trùng phòng học (Real-time Solver Validation) -->
              <el-alert
                v-if="validationConflicts.roomConflict"
                :title="validationConflicts.roomConflict"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
            </div>
          </el-form-item>

          <!-- 4. Thay đổi giáo viên đứng lớp -->
          <el-form-item label="Giáo viên đứng lớp (Thay thế)">
            <div class="flex flex-col gap-1.5 w-full">
              <el-select
                v-model="adjustmentForm.teacherId"
                placeholder="Chọn giáo viên dạy thay..."
                filterable
                clearable
                class="w-full"
                v-loading="loadingSuggestions"
              >
                <el-option
                  v-for="tc in (showAllTeachersToggle ? teachers : suggestedTeachers)"
                  :key="tc.id"
                  :value="tc.id"
                  :label="tc.fullName + (tc.id === selectedEntry?.teacherId ? ' (Hiện tại)' : '')"
                />
              </el-select>
              
              <!-- Toggle switch hiển thị tất cả giáo viên -->
              <div class="flex items-center justify-between text-xs mt-1 select-none">
                <span v-if="!showAllTeachersToggle" class="text-emerald-600 font-semibold flex items-center gap-1">
                  <el-icon><Check /></el-icon>
                  Đang lọc giáo viên tối ưu (đủ trình độ & trống lịch)
                </span>
                <span v-else class="text-amber-600 font-semibold flex items-center gap-1">
                  <el-icon><Warning /></el-icon>
                  Đang hiển thị toàn bộ giáo viên
                </span>
                <el-checkbox v-model="showAllTeachersToggle" size="small">Hiển thị tất cả</el-checkbox>
              </div>

              <!-- Cảnh báo khi không tìm thấy giáo viên tối ưu -->
              <el-alert
                v-if="hasNoAlternativeSuggestions && !showAllTeachersToggle"
                title="Không tìm thấy giáo viên tối ưu nào trống lịch và có chuyên môn phù hợp trong ca này. Hãy chọn 'Hiển thị tất cả' để điều phối thủ công."
                type="warning"
                :closable="false"
                show-icon
                class="!py-1"
              />

              <!-- Cảnh báo trùng lịch giáo viên (Real-time Solver Validation) -->
              <el-alert
                v-if="validationConflicts.teacherConflict"
                :title="validationConflicts.teacherConflict"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
              <el-alert
                v-if="validationConflicts.teacherLeave"
                :title="validationConflicts.teacherLeave"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
              <el-alert
                v-if="validationConflicts.teacherUnavailable"
                :title="validationConflicts.teacherUnavailable"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
            </div>
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

    <!-- Dialog Điều phối Hàng loạt (Batch Adjustment Premium Dialog) -->
    <el-dialog
      v-model="showBatchAdjustDialog"
      title="Điều phối lịch giảng dạy hàng loạt"
      width="500px"
      destroy-on-close
      custom-class="premium-dialog"
    >
      <div v-if="selectedLessons.length > 0" class="space-y-4">
        <!-- Tóm tắt các buổi học đã chọn -->
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
          <div class="text-xs font-bold text-gray-500 flex justify-between items-center">
            <span>DANH SÁCH BUỔI HỌC ĐÃ CHỌN ({{ selectedLessons.length }} BUỔI)</span>
            <span class="text-emerald-600 font-extrabold">Đang chọn</span>
          </div>
          <div class="max-h-24 overflow-y-auto border border-gray-100 rounded bg-white p-2 text-xs space-y-1.5 scrollbar-thin">
            <div 
              v-for="lesson in selectedLessons" 
              :key="lesson.lessonId" 
              class="flex justify-between items-center text-gray-700 font-bold"
            >
              <span>{{ lesson.className }} - Buổi #{{ lesson.lessonIndex }}</span>
              <span class="text-gray-400 text-[10px]">Ca: {{ lesson.timeslotLabel ? lesson.timeslotLabel.split(' - ')[1] || lesson.timeslotLabel : '—' }} ({{ formatDateLabel(lesson.sessionDate) }})</span>
            </div>
          </div>
          <div class="text-[10px] text-amber-600 font-semibold italic mt-1">
            (*) Lưu ý: Các trường bên dưới nếu để trống (không chọn) thì hệ thống sẽ giữ nguyên giá trị gốc của từng buổi học tương ứng.
          </div>
        </div>

        <el-form :model="batchAdjustmentForm" label-position="top" v-loading="checkingBatchValidation">
          <!-- 1. Ngày học dương lịch cụ thể (Dịch ngày hàng loạt) -->
          <el-form-item label="Ngày học dương lịch mới">
            <el-date-picker
              v-model="batchAdjustmentForm.sessionDate"
              type="date"
              :placeholder="isSameClass ? 'Không thể đổi ngày cho cùng 1 lớp' : 'Giữ nguyên ngày cũ...'"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              class="!w-full"
              :disabled="isSameClass"
              clearable
            />
          </el-form-item>

          <!-- 2. Thay đổi ca học hàng loạt -->
          <el-form-item label="Ca học mới (Timeslot)">
            <el-select
              v-model="batchAdjustmentForm.timeslotId"
              :placeholder="isTimeslotDisabled ? (isSameClass ? 'Không thể đổi ca' : 'Chỉ đổi ca khi chọn ngày mới') : 'Giữ nguyên ca cũ...'"
              filterable
              clearable
              :disabled="isTimeslotDisabled"
              class="w-full"
            >
              <el-option
                v-for="ts in optimizedBatchTimeslots"
                :key="ts.id"
                :value="ts.id"
                :label="ts.label + ' (' + (ts.startTime ? ts.startTime.substring(0, 5) : '') + ' - ' + (ts.endTime ? ts.endTime.substring(0, 5) : '') + ')' + (ts.isOccupied ? ' (Bận phòng/GV)' : ' (Trống)')"
                :class="ts.isOccupied ? '!text-gray-400 italic' : '!text-emerald-700 !font-semibold'"
              />
            </el-select>
          </el-form-item>

          <!-- 3. Thay đổi phòng học hàng loạt -->
          <el-form-item label="Phòng học mới">
            <div class="flex flex-col gap-1.5 w-full">
              <el-select v-model="batchAdjustmentForm.roomId" placeholder="Giữ nguyên phòng cũ..." filterable clearable class="w-full">
                <el-option
                  v-for="rm in optimizedBatchRooms"
                  :key="rm.id"
                  :value="rm.id"
                  :label="rm.name + (rm.isOccupied ? ' (Đã bị chiếm ca này)' : ' (Trống)')"
                  :class="rm.isOccupied ? '!text-gray-400 italic' : '!text-emerald-700 !font-semibold'"
                />
              </el-select>
              <!-- Cảnh báo trùng phòng học -->
              <el-alert
                v-if="batchValidationConflicts.roomConflict"
                :title="batchValidationConflicts.roomConflict"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
              <el-alert
                v-if="batchValidationConflicts.batchRoomConflict"
                :title="batchValidationConflicts.batchRoomConflict"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
            </div>
          </el-form-item>

          <!-- 4. Thay đổi giáo viên đứng lớp hàng loạt -->
          <el-form-item label="Giáo viên mới">
            <div class="flex flex-col gap-1.5 w-full">
              <el-select
                v-model="batchAdjustmentForm.teacherId"
                placeholder="Giữ nguyên giáo viên cũ..."
                filterable
                clearable
                class="w-full"
                v-loading="loadingBatchSuggestions"
              >
                <el-option
                  v-for="tc in (showAllTeachersBatchToggle ? teachers : batchSuggestedTeachers)"
                  :key="tc.id"
                  :value="tc.id"
                  :label="tc.fullName"
                />
              </el-select>
              
              <!-- Toggle switch hiển thị tất cả giáo viên -->
              <div class="flex items-center justify-between text-xs mt-1 select-none">
                <span v-if="!showAllTeachersBatchToggle" class="text-emerald-600 font-semibold flex items-center gap-1">
                  <el-icon><Check /></el-icon>
                  Đang lọc giáo viên tối ưu cho tất cả buổi học
                </span>
                <span v-else class="text-amber-600 font-semibold flex items-center gap-1">
                  <el-icon><Warning /></el-icon>
                  Đang hiển thị toàn bộ giáo viên
                </span>
                <el-checkbox v-model="showAllTeachersBatchToggle" size="small">Hiển thị tất cả</el-checkbox>
              </div>

              <!-- Cảnh báo khi không tìm thấy giáo viên tối ưu -->
              <el-alert
                v-if="hasNoBatchAlternativeSuggestions && !showAllTeachersBatchToggle && batchAdjustmentForm.timeslotId"
                title="Không tìm thấy giáo viên tối ưu nào trống lịch và có chuyên môn giảng dạy tất cả lớp được chọn. Hãy chọn 'Hiển thị tất cả' để điều phối thủ công."
                type="warning"
                :closable="false"
                show-icon
                class="!py-1"
              />

              <!-- Cảnh báo trùng lịch giáo viên -->
              <el-alert
                v-if="batchValidationConflicts.teacherConflict"
                :title="batchValidationConflicts.teacherConflict"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
              <el-alert
                v-if="batchValidationConflicts.batchTeacherConflict"
                :title="batchValidationConflicts.batchTeacherConflict"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
              <el-alert
                v-if="batchValidationConflicts.teacherLeave"
                :title="batchValidationConflicts.teacherLeave"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
              <el-alert
                v-if="batchValidationConflicts.teacherUnavailable"
                :title="batchValidationConflicts.teacherUnavailable"
                type="error"
                :closable="false"
                show-icon
                class="!py-1.5 !mt-1"
              />
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2 p-2 border-t border-gray-100">
          <el-button @click="showBatchAdjustDialog = false">Hủy bỏ</el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="submitBatchAdjustment"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-sm"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            Lưu điều phối hàng loạt (Khóa lịch)
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api/axios';
import { Edit, Lock, Unlock, OfficeBuilding, Warning, Check, Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { format } from 'date-fns';

const route = useRoute();
const loading = ref(false);
const saving = ref(false);
const showAdjustDialog = ref(false);

const showBatchAdjustDialog = ref(false);
const selectedLessons = ref<any[]>([]);
const batchAdjustmentForm = ref({
  teacherId: null as number | null,
  roomId: null as number | null,
  timeslotId: null as number | null,
  sessionDate: ''
});

// Kiểm tra xem các buổi học được chọn có cùng lớp hay không
const isSameClass = computed(() => {
  if (selectedLessons.value.length === 0) return false;
  const firstClassId = selectedLessons.value[0].classId;
  return selectedLessons.value.every((l: any) => l.classId === firstClassId);
});

// Chỉ cho cập nhật ca học nếu:
// - Cùng lớp: luôn cho phép đổi ca học (ngày học bị khóa và giữ nguyên của từng buổi học)
// - Khác lớp: chỉ cho phép đổi ca học nếu đã chọn ngày học dương lịch mới
const isTimeslotDisabled = computed(() => {
  if (isSameClass.value) return false;
  return !batchAdjustmentForm.value.sessionDate;
});

// Trạng thái gợi ý giáo viên tối ưu hàng loạt
const batchSuggestedTeachers = ref<any[]>([]);
const loadingBatchSuggestions = ref(false);
const showAllTeachersBatchToggle = ref(false);

// Trạng thái xác thực xung đột trùng lịch hàng loạt
const batchValidationConflicts = ref<Record<string, string>>({});
const checkingBatchValidation = ref(false);
const isInitializingBatchDialog = ref(false);

const dispatchEntries = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(15);

// Phân trang Client-side mượt mà
const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return dispatchEntries.value.slice(start, end);
});
const teachers = ref<any[]>([]);
const rooms = ref<any[]>([]);
const timeslots = ref<any[]>([]);
const batches = ref<any[]>([]);
const classes = ref<any[]>([]);
const selectedEntry = ref<any>(null);

const searchForm = ref({
  batchId: null as number | null,
  classId: null as number | null,
  teacherId: null as number | null,
  dateRange: [format(new Date(), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd')] as [string, string]
});

const adjustmentForm = ref({
  teacherId: null as number | null,
  roomId: null as number | null,
  timeslotId: null as number | null,
  sessionDate: ''
});

// Trạng thái gợi ý giáo viên tối ưu
const suggestedTeachers = ref<any[]>([]);
const loadingSuggestions = ref(false);
const showAllTeachersToggle = ref(false);

// Trạng thái xác thực xung đột trùng lịch
const validationConflicts = ref<Record<string, string>>({});
const checkingValidation = ref(false);
const isInitializingDialog = ref(false);

// Kiểm tra xem có giáo viên thay thế tối ưu nào khác giáo viên hiện tại không
const hasNoAlternativeSuggestions = computed(() => {
  if (loadingSuggestions.value) return false;
  const currentId = selectedEntry.value?.teacherId;
  const alternatives = currentId
    ? suggestedTeachers.value.filter((t: any) => t.id !== currentId)
    : suggestedTeachers.value;
  return alternatives.length === 0;
});

const handleSelectionChange = (val: any[]) => {
  selectedLessons.value = val;
};

const hasNoBatchAlternativeSuggestions = computed(() => {
  if (loadingBatchSuggestions.value) return false;
  return batchSuggestedTeachers.value.length === 0;
});

const optimizedBatchRooms = computed(() => {
  const currentTimeslot = batchAdjustmentForm.value.timeslotId;
  const selectedIds = new Set(selectedLessons.value.map(l => l.lessonId));
  
  if (!currentTimeslot || dailyOccupations.value.length === 0) {
    return rooms.value.map(r => ({ ...r, isOccupied: false }));
  }

  const occupiedRoomIds = new Set(
    dailyOccupations.value
      .filter((entry: any) => entry.timeslotId === currentTimeslot && !selectedIds.has(entry.lessonId) && entry.roomId)
      .map((entry: any) => entry.roomId)
  );

  const freeRooms = rooms.value.filter(r => !occupiedRoomIds.has(r.id));
  const busyRooms = rooms.value.filter(r => occupiedRoomIds.has(r.id));

  return [
    ...freeRooms.map(r => ({ ...r, isOccupied: false })),
    ...busyRooms.map(r => ({ ...r, isOccupied: true }))
  ];
});

const optimizedBatchTimeslots = computed(() => {
  const currentRoomId = batchAdjustmentForm.value.roomId;
  const currentTeacherId = batchAdjustmentForm.value.teacherId;
  const selectedIds = new Set(selectedLessons.value.map(l => l.lessonId));
  const sessionDate = batchAdjustmentForm.value.sessionDate;

  if (!sessionDate) {
    return [];
  }

  const targetDay = getDayOfWeekString(sessionDate);
  const filteredSlots = timeslots.value.filter(
    ts => ts.dayOfWeek && ts.dayOfWeek.toUpperCase() === targetDay
  );

  const busyTimeslots = new Set<number>();
  
  if (dailyOccupations.value.length > 0) {
    dailyOccupations.value.forEach((entry: any) => {
      if (!selectedIds.has(entry.lessonId)) {
        if (currentRoomId && entry.roomId === currentRoomId) {
          busyTimeslots.add(entry.timeslotId);
        }
        if (currentTeacherId && entry.teacherId === currentTeacherId) {
          busyTimeslots.add(entry.timeslotId);
        }
      }
    });
  }

  const freeSlots = filteredSlots.filter(ts => !busyTimeslots.has(ts.id));
  const busySlots = filteredSlots.filter(ts => busyTimeslots.has(ts.id));

  return [
    ...freeSlots.map(ts => ({ ...ts, isOccupied: false })),
    ...busySlots.map(ts => ({ ...ts, isOccupied: true }))
  ];
});

const validateBatchAssignment = async () => {
  if (selectedLessons.value.length === 0) return;
  const { teacherId, roomId, timeslotId, sessionDate } = batchAdjustmentForm.value;
  
  if (!teacherId && !roomId && !timeslotId && !sessionDate) {
    batchValidationConflicts.value = {};
    return;
  }

  checkingBatchValidation.value = true;
  try {
    const res: any = await api.post('/timetable/validate-assignment/batch', {
      lessonIds: selectedLessons.value.map((l: any) => l.lessonId),
      teacherId: teacherId || null,
      roomId: roomId || null,
      timeslotId: timeslotId || null,
      sessionDate: sessionDate || null
    });
    if (res.success) {
      batchValidationConflicts.value = res.data || {};
    } else {
      batchValidationConflicts.value = {};
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra trùng lịch hàng loạt', err);
    batchValidationConflicts.value = {};
  } finally {
    checkingBatchValidation.value = false;
  }
};

const fetchBatchTeacherSuggestions = async () => {
  const timeslotId = batchAdjustmentForm.value.timeslotId;
  if (!timeslotId) {
    batchSuggestedTeachers.value = [];
    return;
  }
  loadingBatchSuggestions.value = true;
  batchSuggestedTeachers.value = [];
  try {
    const res: any = await api.post('/timetable/suggest-teacher/batch', {
      lessonIds: selectedLessons.value.map((l: any) => l.lessonId),
      timeslotId,
      sessionDate: batchAdjustmentForm.value.sessionDate || null
    });
    if (res.success) {
      batchSuggestedTeachers.value = res.data || [];
    }
  } catch (err) {
    console.error('Lỗi khi tải gợi ý giáo viên hàng loạt', err);
  } finally {
    loadingBatchSuggestions.value = false;
  }
};

// Trạng thái các ca bận/phòng bận trong ngày học đang chọn
const dailyOccupations = ref<any[]>([]);
const loadingOccupations = ref(false);

const fetchDailyOccupations = async (date: string) => {
  if (!date) {
    dailyOccupations.value = [];
    return;
  }
  loadingOccupations.value = true;
  try {
    const res: any = await api.get('/class-planning/dispatch', {
      params: { startDate: date, endDate: date }
    });
    if (res.success) {
      dailyOccupations.value = res.data || [];
    }
  } catch (err) {
    console.error('Lỗi khi tải lịch chiếm dụng trong ngày', err);
    dailyOccupations.value = [];
  } finally {
    loadingOccupations.value = false;
  }
};

// Danh sách phòng học sau khi đã lọc/sắp xếp tối ưu (Phòng rảnh lên đầu)
const optimizedRooms = computed(() => {
  const currentTimeslot = adjustmentForm.value.timeslotId;
  const currentLessonId = selectedEntry.value?.lessonId;
  
  if (!currentTimeslot || dailyOccupations.value.length === 0) {
    return rooms.value.map(r => ({ ...r, isOccupied: false }));
  }

  // Lấy danh sách các roomId đã bị chiếm trong ca này (trừ buổi hiện tại)
  const occupiedRoomIds = new Set(
    dailyOccupations.value
      .filter((entry: any) => entry.timeslotId === currentTimeslot && entry.lessonId !== currentLessonId && entry.roomId)
      .map((entry: any) => entry.roomId)
  );

  // Phân chia phòng rảnh và phòng bận
  const freeRooms = rooms.value.filter(r => !occupiedRoomIds.has(r.id));
  const busyRooms = rooms.value.filter(r => occupiedRoomIds.has(r.id));

  // Ghép lại và gắn cờ occupied
  return [
    ...freeRooms.map(r => ({ ...r, isOccupied: false })),
    ...busyRooms.map(r => ({ ...r, isOccupied: true }))
  ];
});

// Định nghĩa helper lấy thứ trong tuần bằng tiếng Anh từ ngày YYYY-MM-DD
const getDayOfWeekString = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
};

// Danh sách ca học sau khi đã phân tích tối ưu (Ca học trống phòng và giáo viên lên đầu)
const optimizedTimeslots = computed(() => {
  const currentRoomId = adjustmentForm.value.roomId;
  const currentTeacherId = adjustmentForm.value.teacherId;
  const currentLessonId = selectedEntry.value?.lessonId;
  const sessionDate = adjustmentForm.value.sessionDate;

  if (!sessionDate) {
    return [];
  }

  const targetDay = getDayOfWeekString(sessionDate);

  // 1. Chỉ lọc ra các ca học (timeslot) diễn ra vào ngày thứ này trong tuần dương lịch
  const filteredSlots = timeslots.value.filter(
    ts => ts.dayOfWeek && ts.dayOfWeek.toUpperCase() === targetDay
  );

  // 2. Tìm các ca học mà phòng học hoặc giáo viên bị bận
  const busyTimeslots = new Set<number>();
  
  if (dailyOccupations.value.length > 0) {
    dailyOccupations.value.forEach((entry: any) => {
      if (entry.lessonId !== currentLessonId) {
        if (currentRoomId && entry.roomId === currentRoomId) {
          busyTimeslots.add(entry.timeslotId);
        }
        if (currentTeacherId && entry.teacherId === currentTeacherId) {
          busyTimeslots.add(entry.timeslotId);
        }
      }
    });
  }

  const freeSlots = filteredSlots.filter(ts => !busyTimeslots.has(ts.id));
  const busySlots = filteredSlots.filter(ts => busyTimeslots.has(ts.id));

  return [
    ...freeSlots.map(ts => ({ ...ts, isOccupied: false })),
    ...busySlots.map(ts => ({ ...ts, isOccupied: true }))
  ];
});

// Xác thực xung đột trùng lịch giáo viên, phòng học bằng Timefold Solver Rules
const validateCurrentAssignment = async () => {
  if (!selectedEntry.value) return;
  const { teacherId, roomId, timeslotId, sessionDate } = adjustmentForm.value;
  if (!timeslotId || !sessionDate) {
    validationConflicts.value = {};
    return;
  }

  checkingValidation.value = true;
  try {
    const params: any = {
      lessonId: selectedEntry.value.lessonId,
      timeslotId,
      sessionDate
    };
    if (teacherId && teacherId > 0) params.teacherId = teacherId;
    if (roomId && roomId > 0) params.roomId = roomId;

    const res: any = await api.get('/timetable/validate-assignment', { params });
    if (res.success) {
      validationConflicts.value = res.data || {};
    } else {
      validationConflicts.value = {};
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra trùng lịch', err);
    validationConflicts.value = {};
  } finally {
    checkingValidation.value = false;
  }
};

// Tải danh sách lớp học theo batch
const fetchClassesForBatch = async (batchId: number | null) => {
  try {
    const res: any = await api.get('/class-planning/classes', {
      params: { batchId: batchId || 'all' }
    });
    classes.value = res.data;
  } catch (err) {
    console.error('Lỗi khi tải danh sách lớp học', err);
  }
};

// Khi thay đổi kế hoạch khai giảng
const onBatchChange = (val: number | null) => {
  searchForm.value.classId = null;
  fetchClassesForBatch(val);
};

// Đặt lại tìm kiếm
const resetSearch = () => {
  searchForm.value = {
    batchId: null,
    classId: null,
    teacherId: null,
    dateRange: [format(new Date(), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd')]
  };
  classes.value = [];
  currentPage.value = 1;
  fetchClassesForBatch(null);
  fetchDailyDispatch();
};

// Tải danh sách các buổi học điều phối của ngày/bộ lọc được chọn
const fetchDailyDispatch = async () => {
  loading.value = true;
  currentPage.value = 1;
  try {
    const params: any = {};
    if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
      params.startDate = searchForm.value.dateRange[0];
      params.endDate = searchForm.value.dateRange[1];
    }
    if (searchForm.value.batchId) {
      params.batchId = searchForm.value.batchId;
    }
    if (searchForm.value.classId) {
      params.classId = searchForm.value.classId;
    }
    if (searchForm.value.teacherId) {
      params.teacherId = searchForm.value.teacherId;
    }

    const res: any = await api.get('/class-planning/dispatch', { params });
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
    const [resT, resR, resTs, resB] = await Promise.all([
      api.get('/teachers/all'),
      api.get('/rooms'),
      api.get('/timeslots'),
      api.get('/course-batches')
    ]);
    teachers.value = (resT as any).data;
    rooms.value = (resR as any).data;
    timeslots.value = (resTs as any).data; // Lưu danh sách các ca học thực tế (Timeslot)
    batches.value = (resB as any).data;
  } catch (err) {
    console.error('Lỗi khi tải metadata điều phối', err);
  }
};

// Tải danh sách giáo viên tối ưu cho buổi học cụ thể
const fetchTeacherSuggestions = async (skillCode: string, timeslotId: number, excludeTeacherId: number, sessionDate: string, currentTeacherName?: string) => {
  if (!timeslotId || !skillCode) return;
  loadingSuggestions.value = true;
  suggestedTeachers.value = [];
  try {
    const res: any = await api.get('/timetable/suggest-teacher', {
      params: {
        skillCode,
        timeslotId,
        excludeTeacherId: excludeTeacherId || 0,
        sessionDate: sessionDate || ''
      }
    });
    if (res.success) {
      const list = [...res.data];
      // Nếu có giáo viên hiện tại của buổi học, tự động đưa vào danh sách để hiển thị tên thay vì ID thô
      if (excludeTeacherId && !list.some((t: any) => t.id === excludeTeacherId)) {
        list.unshift({
          id: excludeTeacherId,
          fullName: currentTeacherName || `Giáo viên hiện tại (ID ${excludeTeacherId})`
        });
      }
      suggestedTeachers.value = list;
    }
  } catch (err) {
    console.error('Lỗi khi tải gợi ý giáo viên tối ưu', err);
  } finally {
    loadingSuggestions.value = false;
  }
};

// Theo dõi sự thay đổi của sessionDate để lấy lịch chiếm dụng trong ngày (Daily Occupations)
watch(
  () => adjustmentForm.value.sessionDate,
  async (newDate) => {
    if (isInitializingDialog.value) return; // Bỏ qua nếu đang khởi tạo dialog
    if (showAdjustDialog.value && newDate) {
      await fetchDailyOccupations(newDate as string);
      
      // Sau khi lấy xong lịch chiếm dụng, tự động cập nhật gợi ý giáo viên và validate lại các giá trị hiện tại
      if (adjustmentForm.value.timeslotId && selectedEntry.value) {
        fetchTeacherSuggestions(
          selectedEntry.value.requiredSkill,
          adjustmentForm.value.timeslotId,
          selectedEntry.value.teacherId,
          newDate as string,
          selectedEntry.value.teacherName
        );
      }
      validateCurrentAssignment();
    }
  }
);

// Theo dõi sự thay đổi của Timeslot trong form điều phối để nạp lại gợi ý giáo viên tối ưu
watch(
  () => adjustmentForm.value.timeslotId,
  (newTimeslot) => {
    if (isInitializingDialog.value) return; // Bỏ qua nếu đang khởi tạo dialog
    if (showAdjustDialog.value && selectedEntry.value && newTimeslot) {
      fetchTeacherSuggestions(
        selectedEntry.value.requiredSkill,
        newTimeslot as number,
        selectedEntry.value.teacherId,
        adjustmentForm.value.sessionDate,
        selectedEntry.value.teacherName
      );
      validateCurrentAssignment();
    }
  }
);

// Theo dõi mọi sự thay đổi thông số Phòng/Giáo viên để tự động validate trùng lịch (Real-time Validation)
watch(
  () => [
    adjustmentForm.value.teacherId,
    adjustmentForm.value.roomId
  ],
  () => {
    if (isInitializingDialog.value) return; // Bỏ qua nếu đang khởi tạo dialog
    if (showAdjustDialog.value) {
      validateCurrentAssignment();
    }
  }
);

// --- WATCHERS BATCH ---

watch(
  () => batchAdjustmentForm.value.sessionDate,
  async (newDate) => {
    if (isInitializingBatchDialog.value) return;
    if (showBatchAdjustDialog.value) {
      if (newDate) {
        await fetchDailyOccupations(newDate as string);
        if (batchAdjustmentForm.value.timeslotId) {
          await fetchBatchTeacherSuggestions();
        }
      } else {
        // Nếu xóa Ngày học thì cũng xóa ca học và gợi ý giáo viên vì ca học bị disable
        batchAdjustmentForm.value.timeslotId = null;
        batchSuggestedTeachers.value = [];
      }
      validateBatchAssignment();
    }
  }
);

watch(
  () => batchAdjustmentForm.value.timeslotId,
  async (newTimeslot, oldTimeslot) => {
    if (isInitializingBatchDialog.value) return;
    if (showBatchAdjustDialog.value) {
      if (newTimeslot) {
        checkingBatchValidation.value = true;
        try {
          const res: any = await api.post('/timetable/validate-assignment/batch', {
            lessonIds: selectedLessons.value.map((l: any) => l.lessonId),
            teacherId: batchAdjustmentForm.value.teacherId || null,
            roomId: batchAdjustmentForm.value.roomId || null,
            timeslotId: newTimeslot,
            sessionDate: batchAdjustmentForm.value.sessionDate || null
          });

          if (res.success && res.data) {
            const hasRoomConflict = !!(res.data.roomConflict || res.data.batchRoomConflict);
            const hasTeacherConflict = !!(res.data.teacherConflict || res.data.batchTeacherConflict || res.data.teacherLeave || res.data.teacherUnavailable);

            if (hasRoomConflict || hasTeacherConflict) {
              let msg = 'Hành động thay đổi ca học sẽ gây ';
              if (hasRoomConflict && hasTeacherConflict) {
                msg += 'xung đột phòng học và giáo viên. Bạn sẽ phải lựa chọn phòng học và giáo viên mới.';
              } else if (hasRoomConflict) {
                msg += 'xung đột phòng học. Bạn sẽ phải lựa chọn phòng học mới.';
              } else {
                msg += 'xung đột giáo viên. Bạn sẽ phải lựa chọn giáo viên mới.';
              }
              msg += ' Bạn có đồng ý thay đổi ca học không?';

              try {
                await ElMessageBox.confirm(msg, 'Cảnh báo trùng lịch ca học', {
                  confirmButtonText: 'Đồng ý thay đổi',
                  cancelButtonText: 'Hủy bỏ',
                  type: 'warning',
                  customClass: 'premium-message-box'
                });

                // Nếu người dùng đồng ý:
                if (hasRoomConflict) {
                  batchAdjustmentForm.value.roomId = null;
                }
                if (hasTeacherConflict) {
                  batchAdjustmentForm.value.teacherId = null;
                }
                await fetchBatchTeacherSuggestions();
                validateBatchAssignment();
              } catch (err) {
                // Người dùng hủy bỏ: Revert về ca cũ
                isInitializingBatchDialog.value = true;
                batchAdjustmentForm.value.timeslotId = oldTimeslot || null;
                setTimeout(() => {
                  isInitializingBatchDialog.value = false;
                }, 50);
                validateBatchAssignment();
              }
              return;
            }
          }
        } catch (err) {
          console.error('Lỗi khi kiểm tra trùng lịch đổi ca', err);
        } finally {
          checkingBatchValidation.value = false;
        }

        await fetchBatchTeacherSuggestions();
        validateBatchAssignment();
      } else {
        batchSuggestedTeachers.value = [];
        validateBatchAssignment();
      }
    }
  }
);

watch(
  () => [
    batchAdjustmentForm.value.teacherId,
    batchAdjustmentForm.value.roomId
  ],
  () => {
    if (isInitializingBatchDialog.value) return;
    if (showBatchAdjustDialog.value) {
      validateBatchAssignment();
    }
  }
);

// Mở hộp thoại điều phối hàng loạt
const openBatchAdjustmentDialog = async () => {
  if (selectedLessons.value.length === 0) return;
  showAllTeachersBatchToggle.value = false;
  batchValidationConflicts.value = {};
  isInitializingBatchDialog.value = true;

  // Khi mở popup lên thì toàn bộ các trường phải để trống, trường nào thay đổi thì người dùng nhập vào
  batchAdjustmentForm.value = {
    teacherId: null,
    roomId: null,
    timeslotId: null,
    sessionDate: ''
  };

  dailyOccupations.value = [];

  showBatchAdjustDialog.value = true;

  setTimeout(() => {
    isInitializingBatchDialog.value = false;
  }, 100);
};

// Thực hiện gửi yêu cầu điều phối hàng loạt
const submitBatchAdjustment = async () => {
  if (selectedLessons.value.length === 0) return;

  const { teacherId, roomId, timeslotId, sessionDate } = batchAdjustmentForm.value;
  if (!teacherId && !roomId && !timeslotId && !sessionDate) {
    ElMessage.warning('Vui lòng chọn ít nhất một thông tin để thực hiện điều phối hàng loạt.');
    return;
  }

  const hasConflicts = Object.keys(batchValidationConflicts.value).length > 0;
  if (hasConflicts) {
    try {
      await ElMessageBox.confirm(
        'Hệ thống phát hiện có xung đột trùng lịch hoặc chuyên môn (Hard Constraint) trong danh sách hàng loạt. Bạn có chắc chắn muốn bỏ qua các cảnh báo này và tiếp tục lưu điều phối không?',
        'Cảnh báo trùng lịch học hàng loạt',
        {
          confirmButtonText: 'Bỏ qua & Tiếp tục lưu',
          cancelButtonText: 'Hủy bỏ',
          type: 'warning',
          customClass: 'premium-message-box'
        }
      );
    } catch (err) {
      return;
    }
  }

  saving.value = true;
  try {
    const res: any = await api.put('/class-planning/dispatch/batch', {
      lessonIds: selectedLessons.value.map(l => l.lessonId),
      teacherId: teacherId || null,
      roomId: roomId || null,
      timeslotId: timeslotId || null,
      sessionDate: sessionDate || null
    });
    if (res.success) {
      ElMessage.success(res.message || 'Điều phối lịch dạy hàng loạt thành công!');
      showBatchAdjustDialog.value = false;
      selectedLessons.value = [];
      fetchDailyDispatch();
    } else {
      ElMessage.error(res.message || 'Điều phối hàng loạt thất bại');
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || 'Có lỗi xảy ra khi điều phối hàng loạt lịch học');
  } finally {
    saving.value = false;
  }
};

// Mở hộp thoại điều chỉnh buổi học
const openAdjustmentDialog = async (row: any) => {
  selectedEntry.value = row;
  showAllTeachersToggle.value = false;
  validationConflicts.value = {}; // Reset các xung đột cũ
  isInitializingDialog.value = true; // Bật cờ chặn các cuộc gọi watcher trùng lặp

  adjustmentForm.value = {
    teacherId: row.teacherId,
    roomId: row.roomId,
    timeslotId: row.timeslotId,
    sessionDate: row.sessionDate
  };

  // Nạp lịch bận chiếm dụng trong ngày trước
  await fetchDailyOccupations(row.sessionDate);

  // Sau đó nạp gợi ý giáo viên tối ưu
  await fetchTeacherSuggestions(row.requiredSkill, row.timeslotId, row.teacherId, row.sessionDate, row.teacherName);
  
  showAdjustDialog.value = true;
  
  // Thực hiện validate ngay khi mở dialog dựa trên dữ liệu ban đầu
  await validateCurrentAssignment();

  // Reset cờ khởi tạo sau khi Vue đã render và áp dụng các thuộc tính reactive
  setTimeout(() => {
    isInitializingDialog.value = false;
  }, 100);
};

// Thực hiện gửi yêu cầu điều phối lịch buổi học
const submitAdjustment = async () => {
  if (!selectedEntry.value) return;

  // Kiểm tra nếu có xung đột trùng lịch (Hard Constraint)
  const hasConflicts = Object.keys(validationConflicts.value).length > 0;
  if (hasConflicts) {
    try {
      await ElMessageBox.confirm(
        'Hệ thống phát hiện có xung đột trùng lịch (Hard Constraint). Bạn có chắc chắn muốn bỏ qua các cảnh báo này và tiếp tục lưu điều phối không?',
        'Cảnh báo trùng lịch học',
        {
          confirmButtonText: 'Bỏ qua & Tiếp tục lưu',
          cancelButtonText: 'Hủy bỏ',
          type: 'warning',
          customClass: 'premium-message-box'
        }
      );
    } catch (err) {
      // Người dùng nhấn Hủy bỏ hoặc đóng thông báo
      return;
    }
  }

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

const formatDateRangeLabel = (range: [string, string]) => {
  if (!range || range.length !== 2) return '';
  const start = formatDateLabel(range[0]);
  const end = formatDateLabel(range[1]);
  return start === end ? start : `${start} - ${end}`;
};

onMounted(() => {
  if (route.query.date) {
    searchForm.value.dateRange = [route.query.date as string, route.query.date as string];
  }
  loadMetadata();
  fetchClassesForBatch(null);
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

.premium-search-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-search-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
}
</style>
