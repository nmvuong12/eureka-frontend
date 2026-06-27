<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('leave.title') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ $t('leave.desc') }}</p>
      </div>
      <el-button
        v-if="authStore.isTeacher"
        type="primary"
        @click="openModal()"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300"
      >
        <el-icon class="mr-1"><Plus /></el-icon>
        {{ $t('leave.create') }}
      </el-button>
    </div>

    <!-- Advanced Search Area -->
    <el-card class="border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md mb-6" :body-style="{ padding: '24px' }">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <el-icon class="text-emerald-500"><Search /></el-icon>
          {{ $t('common.filter_advanced') }}
        </h2>
        <div class="flex items-center gap-2">
          <el-button type="primary" @click="handleSearch" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
            <el-icon class="mr-1"><Search /></el-icon>
            {{ $t('common.search') }}
          </el-button>
          <el-button @click="handleReset" class="hover:text-emerald-600 hover:border-emerald-200">
            <el-icon class="mr-1"><RefreshRight /></el-icon>
            {{ $t('common.reset') }}
          </el-button>
        </div>
      </div>
      
      <el-row :gutter="20">
        <el-col v-if="!authStore.isTeacher" :xs="24" :sm="12" :md="8" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('account.teacher') }}</div>
          <el-input
            v-model="filterForm.teacherName"
            :placeholder="$t('teacher.placeholder_name')"
            clearable
            @keyup.enter="handleSearch"
            class="w-full"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="!authStore.isTeacher ? 8 : 12" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('leave.from') }}</div>
          <el-date-picker
            v-model="filterForm.fromDate"
            type="date"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            :placeholder="$t('leave.form_from_placeholder')"
            class="!w-full"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="!authStore.isTeacher ? 8 : 12" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('leave.to') }}</div>
          <el-date-picker
            v-model="filterForm.toDate"
            type="date"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            :placeholder="$t('leave.form_to_placeholder')"
            class="!w-full"
          />
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="12" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('leave.col_solution') }}</div>
          <el-select v-model="filterForm.makeupOption" clearable placeholder="Tất cả" class="w-full">
            <el-option label="Tất cả" value="" />
            <el-option :label="$t('leave.makeup')" value="MAKEUP" />
            <el-option :label="$t('leave.substitute')" value="NO_MAKEUP" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('common.status') }}</div>
          <el-select v-model="filterForm.status" clearable placeholder="Tất cả" class="w-full">
            <el-option label="Tất cả" value="" />
            <el-option :label="$t('leave.status_pending')" value="PENDING" />
            <el-option :label="$t('leave.status_approved')" value="APPROVED" />
            <el-option :label="$t('leave.status_rejected')" value="REJECTED" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Table Card -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0' }">
      <el-table :data="requests" style="width: 100%" stripe class="premium-table" v-loading="loading">
        <el-table-column prop="id" :label="$t('leave.col_id')" width="90">
          <template #default="{ row }">
            <span class="font-bold text-gray-500">#{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="teacherId" :label="$t('leave.col_teacher_id')" width="100">
          <template #default="{ row }">
            <span class="font-bold text-gray-700">GV{{ String(row.teacherId).padStart(4, '0') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('leave.col_period')" min-width="220">
          <template #default="{ row }">
            <div class="flex flex-col gap-0.5">
              <div class="text-sm font-semibold text-gray-700">
                {{ $t('batch.col_from') }} {{ formatDate(row.fromDate) }} {{ $t('batch.col_to').toLowerCase() }} {{ formatDate(row.toDate) }}
              </div>
              <div class="text-xs text-gray-400">
                {{ $t('leave.col_session') }} 
                <el-tag size="small" type="info" effect="plain" class="rounded-md">
                  {{ sessionTypeLabel(row.sessionType) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('leave.col_solution')" width="180">
          <template #default="{ row }">
            <div class="flex flex-col gap-1">
              <el-tag :type="row.makeupOption === 'MAKEUP' ? 'success' : 'warning'" effect="dark" class="font-bold rounded-lg w-fit">
                {{ row.makeupOption === 'MAKEUP' ? $t('leave.makeup') : $t('leave.substitute') }}
              </el-tag>
              <div v-if="row.makeupOption === 'MAKEUP' && row.makeupDate" class="text-xs text-gray-500">
                {{ $t('leave.makeup_schedule', { date: formatDate(row.makeupDate), slot: getTimeslotLabel(row.makeupTimeslotId) }) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" :label="$t('leave.reason')" min-width="180" show-overflow-tooltip />
        <el-table-column :label="$t('common.status')" width="130">
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
        <el-table-column :label="$t('common.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-button type="info" link @click="openModal(row, true)" class="hover:text-blue-600 flex items-center gap-0.5">
                <el-icon :size="16"><View /></el-icon> {{ $t('leave.btn_detail') }}
              </el-button>
              
              <template v-if="authStore.isTeacher && row.status === 'PENDING'">
                <el-button type="warning" link @click="openModal(row, false)" class="hover:text-yellow-600 flex items-center gap-0.5">
                  <el-icon :size="16"><Edit /></el-icon> {{ $t('leave.btn_edit') }}
                </el-button>
              </template>

              <template v-if="(authStore.isAdmin || authStore.isStaff) && row.status === 'PENDING'">
                <el-button type="danger" link @click="reject(row.id)">
                  <el-icon :size="16"><Close /></el-icon> {{ $t('leave.btn_reject') }}
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('leave.empty')" />
        </template>
      </el-table>
    </el-card>

    <!-- Drawer Form / Review -->
    <el-drawer
      v-model="showModal"
      :title="isViewOnly ? $t('leave.dialog_detail_title') : $t('leave.dialog_create_title')"
      size="650px"
      @close="showModal = false"
      class="premium-drawer"
      custom-class="premium-drawer"
    >
      <div class="space-y-6 px-1">
        <!-- Leaf request form for Teachers -->
        <el-form v-if="!isViewOnly" :model="form" label-position="top">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('leave.form_from')" required>
                <el-date-picker
                  v-model="form.fromDate"
                  type="date"
                  class="w-full"
                  :placeholder="$t('leave.form_from_placeholder')"
                  format="DD/MM/YYYY"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('leave.form_to')" required>
                <el-date-picker
                  v-model="form.toDate"
                  type="date"
                  class="w-full"
                  :placeholder="$t('leave.form_to_placeholder')"
                  format="DD/MM/YYYY"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('leave.form_session_global')" required>
            <el-select v-model="form.sessionType" @change="handleGlobalSessionTypeChange" class="w-full">
              <el-option :label="$t('leave.form_session_day')" value="ALL_DAY" />
              <el-option :label="$t('leave.form_session_morning')" value="MORNING" />
              <el-option :label="$t('leave.form_session_afternoon')" value="AFTERNOON" />
            </el-select>
          </el-form-item>

          <!-- Per-day configuration list -->
          <div v-if="form.dayConfigs && form.dayConfigs.length > 0" class="mb-5 bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-3">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <el-icon><Calendar /></el-icon>
              {{ $t('leave.form_detail_configs') }}
            </h3>
            <div class="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              <div v-for="day in form.dayConfigs" :key="day.date" class="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 shadow-sm">
                <span class="text-sm font-bold text-gray-700">
                  {{ formatDate(day.date) }} ({{ getDayOfWeekLabel(day.date) }})
                </span>
                <el-radio-group v-model="day.sessionType" size="small">
                  <el-radio-button value="ALL_DAY">{{ $t('leave.form_day_all_day') }}</el-radio-button>
                  <el-radio-button value="MORNING">{{ $t('leave.form_day_morning') }}</el-radio-button>
                  <el-radio-button value="AFTERNOON">{{ $t('leave.form_day_afternoon') }}</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </div>


          <!-- Affected lessons list & individual choices -->
          <div v-if="affectedLessonsPreview.length > 0" class="mb-5 bg-amber-50/30 p-4 rounded-xl border border-amber-100 space-y-3">
            <h3 class="text-sm font-bold text-amber-800 flex items-center gap-1.5">
              <el-icon><Calendar /></el-icon>
              {{ $t('leave.warn_affected', { count: affectedLessonsPreview.length }) }}
            </h3>
            
            <div class="space-y-4">
              <div v-for="lesson in affectedLessonsPreview" :key="lesson.id" class="p-3 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3">
                <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span class="font-bold text-gray-800 text-sm">
                    {{ $t('leave.affected_class', { class: lesson.classCode || ('Lớp ID ' + lesson.classId), index: lesson.lessonIndex }) }}
                  </span>
                  <el-tag size="small" type="info" effect="light" class="rounded">
                    {{ $t('leave.affected_original', { date: formatDate(lesson.sessionDate), slot: getTimeslotLabel(lesson.timeslotId) }) }}
                  </el-tag>
                </div>
                
                <div class="flex items-center justify-between gap-4">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('leave.affected_solution_label') }}</span>
                  <el-radio-group v-model="lesson.makeupOption" size="small" @change="triggerLessonFeasibilityCheck(lesson)">
                    <el-radio-button value="NO_MAKEUP">{{ $t('leave.affected_solution_sub') }}</el-radio-button>
                    <el-radio-button value="MAKEUP">{{ $t('leave.affected_solution_makeup') }}</el-radio-button>
                  </el-radio-group>
                </div>

                <transition name="el-fade-in">
                  <div v-if="lesson.makeupOption === 'MAKEUP'" class="grid grid-cols-2 gap-3 pt-2 bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/50">
                    <div>
                      <label class="text-[11px] font-semibold text-gray-500 block mb-1">{{ $t('leave.affected_makeup_date') }}</label>
                      <el-date-picker
                        v-model="lesson.makeupDate"
                        type="date"
                        :placeholder="$t('leave.affected_makeup_date_placeholder')"
                        format="DD/MM/YYYY"
                        value-format="YYYY-MM-DD"
                        size="small"
                        class="w-full"
                        @change="triggerLessonFeasibilityCheck(lesson)"
                      />
                    </div>
                    <div>
                      <label class="text-[11px] font-semibold text-gray-500 block mb-1">{{ $t('leave.affected_makeup_timeslot') }}</label>
                      <el-select v-model="lesson.makeupTimeslotId" :placeholder="$t('leave.affected_makeup_timeslot_placeholder')" size="small" class="w-full" @change="triggerLessonFeasibilityCheck(lesson)">
                        <el-option
                          v-for="ts in getFilteredTimeslotsForLesson(lesson.makeupDate)"
                          :key="ts.id"
                          :label="`${ts.label} (${ts.startTime.substring(0,5)} - ${ts.endTime.substring(0,5)})`"
                          :value="ts.id"
                        />
                      </el-select>
                    </div>
                    <div v-if="lesson.feasibilityNote" class="col-span-2 mt-1 flex justify-start">
                      <span :class="getFeasibilityClass(lesson.feasibilityNote)">
                        {{ $t('leave.affected_feasibility', { note: lesson.feasibilityNote }) }}
                      </span>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>

          <el-form-item :label="$t('leave.reason')" required>
            <el-input
              v-model="form.reason"
              type="textarea"
              :rows="4"
              :placeholder="$t('leave.form_reason_placeholder')"
            />
          </el-form-item>
        </el-form>

        <!-- Detailed view & Reviewer screen for Admin/Staff -->
        <div v-else class="space-y-6">
          <!-- Leave request overview card -->
          <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <div class="text-xs text-gray-400 uppercase tracking-wider">{{ $t('leave.detail_teacher_label') }}</div>
              <div class="font-bold text-gray-800 mt-0.5">GV{{ String(formTeacherId).padStart(4, '0') }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-400 uppercase tracking-wider">{{ $t('leave.detail_status_label') }}</div>
              <div class="mt-1">
                <el-tag :type="statusTagType(currentStatus || '')" effect="dark" size="small" class="font-bold rounded-md">
                  {{ statusLabel(currentStatus || '') }}
                </el-tag>
              </div>
            </div>
            <div class="col-span-2">
              <div class="text-xs text-gray-400 uppercase tracking-wider">{{ $t('leave.detail_period_label') }}</div>
              <div class="font-semibold text-gray-800 mt-0.5">
                {{ $t('leave.detail_period_val', { from: formatDate(form.fromDate), to: formatDate(form.toDate), session: sessionTypeLabel(form.sessionType) }) }}
              </div>
            </div>
            <!-- Per-day configs in detail view -->
            <div v-if="parsedDayConfigs && parsedDayConfigs.length > 0" class="col-span-2 border-t border-gray-200 pt-3">
              <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">{{ $t('leave.detail_configs_label') }}</div>
              <div class="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1">
                <div v-for="day in parsedDayConfigs" :key="day.date" class="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 text-xs">
                  <span class="font-semibold text-gray-600">{{ formatDate(day.date) }} ({{ getDayOfWeekLabel(day.date) }})</span>
                  <el-tag size="small" type="info" effect="plain" class="rounded">
                    {{ sessionTypeLabel(day.sessionType) }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="col-span-2 border-t border-gray-200 pt-3">

                  <div class="text-xs text-gray-400 uppercase tracking-wider">{{ $t('leave.detail_reason_label') }}</div>
              <div class="text-gray-700 mt-1 italic">" {{ form.reason }} "</div>
            </div>
          </div>

          <!-- Affected lessons list -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <el-icon class="text-emerald-500"><Cpu /></el-icon>
              {{ $t('leave.table_affected_title') }}
            </h3>
            <el-table :key="currentStatus" :data="affectedLessonsPreview" border stripe size="small" class="mini-table">
              <el-table-column prop="classCode" :label="$t('leave.table_col_class')" width="130">
                <template #default="{ row }">
                  {{ row.classCode || $t('leave.table_col_class_val', { class: row.classId }) }}
                </template>
              </el-table-column>
              <el-table-column prop="lessonIndex" :label="$t('leave.table_col_lesson')" width="70" align="center">
                <template #default="{ row }">
                  {{ $t('leave.table_col_lesson_val', { index: row.lessonIndex }) }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('leave.table_col_original')" min-width="140">
                <template #default="{ row }">
                  {{ formatDate(currentStatus === 'APPROVED' ? (row.originalSessionDate || row.sessionDate) : row.sessionDate) }} 
                  (Ca {{ getTimeslotLabel(currentStatus === 'APPROVED' ? (row.originalTimeslotId || row.timeslotId) : row.timeslotId) }})
                </template>
              </el-table-column>
              <el-table-column :label="$t('leave.table_col_solution')" min-width="160">
                <template #default="{ row }">
                  <div class="flex flex-col gap-0.5">
                    <el-tag :type="row.makeupOption === 'MAKEUP' ? 'success' : 'warning'" size="small" effect="plain" class="font-bold rounded w-fit">
                      {{ row.makeupOption === 'MAKEUP' ? $t('leave.table_col_solution_makeup') : $t('leave.table_col_solution_sub') }}
                    </el-tag>
                    <div v-if="row.makeupOption === 'MAKEUP' && row.makeupDate" class="text-[10px] text-gray-500">
                      {{ formatDate(row.makeupDate) }} (Ca {{ getTimeslotLabel(row.makeupTimeslotId) }})
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('leave.table_col_note')" min-width="180">
                <template #default="{ row }">
                  <span v-if="row.teacherId && row.teacherId !== formTeacherId" class="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <span class="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {{ $t('leave.table_col_note_claimed', { name: row.teacherName }) }}
                  </span>
                  <span v-else-if="row.makeupOption === 'MAKEUP'">
                    <span v-if="currentStatus === 'APPROVED'" class="text-xs font-bold text-emerald-600">
                      {{ $t('leave.table_col_note_room', { name: getRoomName(row.roomId) }) }}
                    </span>
                    <span v-else-if="currentStatus === 'PENDING' && reviewMakeupRoomId" class="text-xs font-semibold text-blue-600">
                      {{ $t('leave.table_col_note_room_expected', { name: getRoomName(reviewMakeupRoomId) }) }}
                      <span class="block text-[10px] font-normal text-gray-500">({{ row.feasibilityNote || $t('leave.table_col_note_checked') }})</span>
                    </span>
                    <span v-else :class="getFeasibilityClass(row.feasibilityNote)">
                      {{ row.feasibilityNote || $t('leave.table_col_note_checked') }}
                    </span>
                  </span>
                  <span v-else class="text-xs text-gray-400">
                    -
                  </span>
                </template>
              </el-table-column>
              <el-table-column v-if="currentStatus === 'PENDING'" :label="$t('leave.table_col_action')" width="120" align="center">
                <template #default="{ row }">
                  <span v-if="row.makeupOption === 'MAKEUP'" class="text-xs text-gray-400">{{ $t('leave.table_col_action_makeup') }}</span>
                  <el-button v-else type="warning" size="small" @click="openSubstituteDialog(row)">
                    <el-icon class="mr-0.5"><Message /></el-icon> {{ $t('leave.table_col_action_sub') }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Approval review form for Admin/Staff -->
          <div v-if="currentStatus === 'PENDING' && (authStore.isAdmin || authStore.isStaff)" class="border-t border-gray-100 pt-5 space-y-4">
            <h3 class="text-sm font-bold text-gray-800">{{ $t('leave.approve_section_title') }}</h3>
            
            <div v-if="hasMakeupLessons" class="space-y-4 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100">
              <el-form-item :label="$t('leave.approve_select_room')" required class="!mb-0">
                <el-alert
                  v-if="availableRooms.length === 0"
                  :title="$t('leave.approve_no_room_alert')"
                  type="error"
                  show-icon
                  :closable="false"
                  class="mb-3 rounded-lg"
                />
                <el-select v-model="reviewMakeupRoomId" :disabled="availableRooms.length === 0" :placeholder="$t('leave.approve_select_room_placeholder')" class="w-full">
                  <el-option v-for="r in availableRooms" :key="r.id" :label="$t('leave.approve_select_room_option', { name: r.name, capacity: r.capacity })" :value="r.id" />
                </el-select>
              </el-form-item>

              <div class="flex gap-2">
                <el-button type="info" plain @click="checkFeasibility" :loading="checkingFeasibility" class="flex-grow">
                  <el-icon class="mr-1"><Clock /></el-icon> {{ $t('leave.btn_check_feasibility') }}
                </el-button>
                <el-button type="success" @click="approve" :disabled="!reviewMakeupRoomId" class="flex-grow !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
                  <el-icon class="mr-1"><Check /></el-icon> {{ $t('leave.btn_approve_schedule') }}
                </el-button>
              </div>
            </div>

            <div v-else class="bg-amber-50/20 p-4 rounded-xl border border-amber-100 space-y-3">
              <p class="text-xs text-amber-800">
                {{ $t('leave.approve_sub_help') }}
              </p>
              <el-button type="success" @click="approve" class="w-full !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
                <el-icon class="mr-1"><Check /></el-icon> {{ $t('leave.btn_approve_sub') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer v-if="!isViewOnly">
        <div class="flex justify-end gap-2 p-4 border-t border-gray-100">
          <el-button @click="showModal = false">{{ $t('common.cancel') }}</el-button>          <el-button
            type="primary"
            @click="submitRequest"
            :loading="saving"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
          >
            {{ $t('leave.btn_submit_request') }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!-- Substitute Candidate Teachers Dialog -->
    <el-dialog
      v-model="showSubstituteDialog"
      :title="$t('leave.sub_dialog_title')"
      width="60%"
      destroy-on-close
      custom-class="premium-dialog"
    >
      <div v-loading="loadingSubstitutes" class="space-y-4">
        <div v-if="selectedLessonForSub" class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm space-y-1">
          <div><span class="text-gray-400">{{ $t('leave.sub_dialog_class') }}</span> <strong>{{ selectedLessonForSub.classCode || $t('leave.table_col_class_val', { class: selectedLessonForSub.classId }) }}</strong> (Buổi #{{ selectedLessonForSub.lessonIndex }})</div>
          <div><span class="text-gray-400">{{ $t('leave.sub_dialog_schedule') }}</span> <strong>{{ formatDate(selectedLessonForSub.sessionDate) }} (Ca {{ getTimeslotLabel(selectedLessonForSub.timeslotId) }})</strong></div>
          <div><span class="text-gray-400">{{ $t('leave.sub_dialog_skill') }}</span> <el-tag size="small" type="danger" effect="plain" class="font-bold">{{ selectedLessonForSub.requiredSkill }}</el-tag></div>
        </div>

        <el-alert
          v-if="substitutes.length === 0"
          :title="$t('leave.sub_dialog_no_teachers')"
          type="warning"
          show-icon
          :closable="false"
        />

        <div v-else class="space-y-3">
          <p class="text-xs text-gray-500">{{ $t('leave.sub_dialog_help') }}</p>
          <el-table
            :data="substitutes"
            border
            stripe
            class="mini-table"
            @selection-change="handleSubSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="teacherCode" :label="$t('leave.sub_dialog_col_code')" width="100">
              <template #default="{ row }">
                <span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{{ row.teacherCode }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="fullName" :label="$t('leave.sub_dialog_col_name')" min-width="150" />
            <el-table-column :label="$t('leave.sub_dialog_col_contact')" min-width="180">
              <template #default="{ row }">
                <div class="text-xs space-y-0.5">
                  <div>📧 {{ row.email }}</div>
                  <div>📞 {{ row.phone }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="skills" :label="$t('leave.sub_dialog_col_skills')" min-width="140" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showSubstituteDialog = false">{{ $t('common.cancel') }}</el-button>
          <el-button
            type="primary"
            @click="dispatchSubstituteOffers"
            :disabled="selectedSubTeacherIds.length === 0"
            :loading="dispatchingOffers"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
          >
            {{ $t('leave.btn_send_sub_offers', { count: selectedSubTeacherIds.length }) }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { LeaveRequest } from '@/types';
import { Plus, View, Check, Close, Calendar, Cpu, Clock, Message, Edit, Search, RefreshRight } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const requests = ref<LeaveRequest[]>([]);
const loading = ref(false);
const saving = ref(false);

const filterForm = ref({
  teacherName: '',
  teacherId: null as number | null,
  fromDate: '',
  toDate: '',
  makeupOption: '',
  status: ''
});

const handleSearch = () => {
  fetchRequests();
};

const handleReset = () => {
  filterForm.value = {
    teacherName: '',
    teacherId: null,
    fromDate: '',
    toDate: '',
    makeupOption: '',
    status: ''
  };
  fetchRequests();
};
const showModal = ref(false);
const isViewOnly = ref(false);
const formId = ref<number | null>(null);
const formTeacherId = ref<number | null>(null);
const currentStatus = ref<string | null>(null);

// Form schema matching backend DTO
const form = ref({
  fromDate: '',
  toDate: '',
  reason: '',
  sessionType: 'ALL_DAY',
  makeupOption: 'NO_MAKEUP',
  makeupDate: '',
  makeupTimeslotId: null as number | null,
  dayConfigs: [] as Array<{ date: string; sessionType: string }>
});


// Affected lessons states
const affectedLessonsPreview = ref<any[]>([]);
const rooms = ref<any[]>([]);
const availableRooms = ref<any[]>([]);
const timeslots = ref<any[]>([]);
const loadingRequestData = ref(false);

// Review fields
const reviewMakeupRoomId = ref<number | null>(null);
const checkingFeasibility = ref(false);

// Substitute states
const showSubstituteDialog = ref(false);
const loadingSubstitutes = ref(false);
const dispatchingOffers = ref(false);
const selectedLessonForSub = ref<any>(null);
const substitutes = ref<any[]>([]);
const selectedSubTeacherIds = ref<number[]>([]);

/** Format ngày về dạng DD/MM/YYYY */
const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN');
};

/** Lấy nhãn ca học */
const getTimeslotLabel = (id: number | null) => {
  if (!id) return '-';
  const ts = timeslots.value.find(t => t.id === id);
  return ts ? `${ts.label} (${ts.startTime.substring(0,5)} - ${ts.endTime.substring(0,5)})` : `Ca #${id}`;
};

/** Lấy tên phòng học */
const getRoomName = (id: number | null) => {
  if (!id) return '';
  const room = rooms.value.find(r => r.id === id);
  return room ? room.name : `Phòng #${id}`;
};

/** Nhãn vai trò buổi xin nghỉ */
const sessionTypeLabel = (session: string) => {
  const map: Record<string, string> = {
    ALL_DAY: t('leave.session_all_day'),
    MORNING: t('leave.session_morning'),
    AFTERNOON: t('leave.session_afternoon')
  };
  return map[session] ?? session;
};

const getDayOfWeekLabel = (dateStr: string) => {
  if (!dateStr) return '';
  const days = [
    t('leave.day_sunday'),
    t('leave.day_monday'),
    t('leave.day_tuesday'),
    t('leave.day_wednesday'),
    t('leave.day_thursday'),
    t('leave.day_friday'),
    t('leave.day_saturday')
  ];
  return days[new Date(dateStr).getDay()];
};

const parsedDayConfigs = computed(() => {
  if (!form.value.dayConfigs) return [];
  if (typeof form.value.dayConfigs === 'string') {
    try {
      return JSON.parse(form.value.dayConfigs);
    } catch {
      return [];
    }
  }
  return form.value.dayConfigs;
});

const handleGlobalSessionTypeChange = (val: string) => {
  if (form.value.dayConfigs && form.value.dayConfigs.length > 0) {
    form.value.dayConfigs.forEach(day => {
      day.sessionType = val;
    });
  }
};

const generateDayConfigs = () => {
  const from = form.value.fromDate;
  const to = form.value.toDate;
  if (!from || !to) {
    form.value.dayConfigs = [];
    return;
  }
  const start = new Date(from);
  const end = new Date(to);
  if (end < start) {
    form.value.dayConfigs = [];
    return;
  }

  const existingMap = new Map(form.value.dayConfigs.map(c => [c.date, c.sessionType]));
  const configs: Array<{ date: string; sessionType: string }> = [];
  let current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const existingType = existingMap.get(dateStr);
    configs.push({
      date: dateStr,
      sessionType: existingType || form.value.sessionType || 'ALL_DAY'
    });
    current.setDate(current.getDate() + 1);
  }
  form.value.dayConfigs = configs;
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
    PENDING: t('leave.status_pending'),
    APPROVED: t('leave.status_approved'),
    REJECTED: t('leave.status_rejected'),
  };
  return map[status] ?? status;
};

const fetchMetadata = async () => {
  try {
    const resRooms: any = await api.get('/rooms');
    if (resRooms.success) rooms.value = resRooms.data;
    const resTs: any = await api.get('/timeslots');
    if (resTs.success) timeslots.value = resTs.data;
  } catch (err) {
    console.error('Lỗi khi tải metadata:', err);
  }
};



const getFilteredTimeslotsForLesson = (dateStr: string) => {
  if (!dateStr) return timeslots.value;
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayName = days[new Date(dateStr).getDay()];
  return timeslots.value.filter(ts => ts.dayOfWeek === dayName);
};

const hasMakeupLessons = computed(() => {
  return affectedLessonsPreview.value.some(l => l.makeupOption === 'MAKEUP');
});

/** Theo dõi thay đổi khoảng ngày để sinh cấu hình ngày nghỉ */
watch(
  [() => form.value.fromDate, () => form.value.toDate],
  ([from, to]) => {
    if (!isViewOnly.value && !loadingRequestData.value && from && to) {
      generateDayConfigs();
    }
  }
);

/** Theo dõi cấu hình ngày chi tiết để tải danh sách lớp học bị ảnh hưởng */
watch(
  () => form.value.dayConfigs,
  async (newConfigs) => {
    if (!isViewOnly.value && newConfigs && newConfigs.length > 0 && !loadingRequestData.value) {
      try {
        const res: any = await api.post('/leave-requests/preview-affected', {
          fromDate: form.value.fromDate,
          toDate: form.value.toDate,
          sessionType: form.value.sessionType,
          dayConfigs: newConfigs
        });
        if (res.success) {
          // Khởi tạo phương án mặc định cho các tiết học mới, giữ nguyên tùy chọn cũ nếu trùng
          const existingOptionsMap = new Map(affectedLessonsPreview.value.map(l => [l.id, l]));
          affectedLessonsPreview.value = res.data.map((lesson: any) => {
            const existing = existingOptionsMap.get(lesson.id);
            return {
              ...lesson,
              makeupOption: existing ? existing.makeupOption : 'NO_MAKEUP',
              makeupDate: existing ? existing.makeupDate : '',
              makeupTimeslotId: existing ? existing.makeupTimeslotId : null,
              feasibilityNote: existing ? existing.feasibilityNote : ''
            };
          });
        }
      } catch (err) {
        console.error('Lỗi tải preview tiết học bị ảnh hưởng:', err);
      }
    } else if (newConfigs && newConfigs.length === 0) {
      affectedLessonsPreview.value = [];
    }
  },
  { deep: true }
);

const getFeasibilityClass = (note: string) => {
  if (!note) return 'text-xs text-gray-400';
  if (note === 'KHẢ THI') return 'text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200';
  return 'text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200';
};

const triggerLessonFeasibilityCheck = async (lesson: any) => {
  if (lesson.makeupOption !== 'MAKEUP') {
    lesson.feasibilityNote = '';
    return;
  }
  if (!lesson.makeupDate || !lesson.makeupTimeslotId) {
    lesson.feasibilityNote = '';
    return;
  }
  try {
    const res: any = await api.get('/leave-requests/check-feasibility-dynamic', {
      params: {
        date: lesson.makeupDate,
        timeslotId: lesson.makeupTimeslotId,
        classId: lesson.classId,
        teacherId: formTeacherId.value || undefined,
        excludeLessonId: lesson.id
      }
    });
    if (res.success) {
      lesson.feasibilityNote = res.data;
    }
  } catch (err) {
    lesson.feasibilityNote = 'Lỗi kiểm tra';
  }
};

const fetchAffectedLessons = async () => {
  if (!formId.value) return;
  try {
    const params: any = {};
    if (reviewMakeupRoomId.value) {
      params.makeupRoomId = reviewMakeupRoomId.value;
    }
    const res: any = await api.get(`/leave-requests/${formId.value}/affected-lessons`, { params });
    if (res.success) {
      affectedLessonsPreview.value = res.data;
    }
  } catch (err) {
    console.error('Lỗi tải danh sách lớp học ảnh hưởng của đơn:', err);
  }
};

watch(reviewMakeupRoomId, () => {
  fetchAffectedLessons();
});

/** Tải danh sách đơn nghỉ phép */
const fetchRequests = async () => {
  loading.value = true;
  try {
    const endpoint = authStore.isTeacher ? '/leave-requests/my-requests' : '/leave-requests';
    const params: any = {};
    if (filterForm.value.fromDate) params.fromDate = filterForm.value.fromDate;
    if (filterForm.value.toDate) params.toDate = filterForm.value.toDate;
    if (filterForm.value.makeupOption) params.makeupOption = filterForm.value.makeupOption;
    if (filterForm.value.status) params.status = filterForm.value.status;
    if (!authStore.isTeacher && filterForm.value.teacherName) {
      params.teacherName = filterForm.value.teacherName;
    }
    const res: any = await api.get(endpoint, { params });
    if (res.success) requests.value = res.data;
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
};

/** Mở drawer tạo mới hoặc xem chi tiết đơn nghỉ */
const openModal = async (req?: any, viewOnly: boolean = false) => {
  isViewOnly.value = viewOnly;
  reviewMakeupRoomId.value = null;
  affectedLessonsPreview.value = [];
  
  if (req) {
    loadingRequestData.value = true;
    formId.value = req.id || null;
    formTeacherId.value = req.teacherId || null;
    currentStatus.value = req.status || null;
    form.value = {
      fromDate: req.fromDate,
      toDate: req.toDate,
      reason: req.reason,
      sessionType: req.sessionType || 'ALL_DAY',
      makeupOption: req.makeupOption || 'NO_MAKEUP',
      makeupDate: req.makeupDate || '',
      makeupTimeslotId: req.makeupTimeslotId || null,
      dayConfigs: req.dayConfigs ? (typeof req.dayConfigs === 'string' ? JSON.parse(req.dayConfigs) : req.dayConfigs) : []
    };

    try {
      await fetchAffectedLessons();
      if (currentStatus.value === 'PENDING') {
        const resAvail: any = await api.get(`/leave-requests/${req.id}/available-rooms`);
        if (resAvail.success) {
          availableRooms.value = resAvail.data;
        } else {
          availableRooms.value = [];
        }
      }
    } finally {
      setTimeout(() => {
        loadingRequestData.value = false;
      }, 150);
    }
  } else {
    formId.value = null;
    formTeacherId.value = null;
    currentStatus.value = null;
    form.value = {
      fromDate: '',
      toDate: '',
      reason: '',
      sessionType: 'ALL_DAY',
      makeupOption: 'NO_MAKEUP',
      makeupDate: '',
      makeupTimeslotId: null,
      dayConfigs: []
    };
  }
  showModal.value = true;
};

/** Gửi yêu cầu tạo đơn nghỉ */
const submitRequest = async () => {
  if (!form.value.fromDate || !form.value.toDate || !form.value.reason) {
    ElMessage.warning(t('leave.warn_fill_info'));
    return;
  }
  
  // Kiểm tra và cấu trúc hóa phương án cho từng buổi học
  const lessonOptions = affectedLessonsPreview.value.map(lesson => ({
    lessonId: lesson.id,
    makeupOption: lesson.makeupOption,
    makeupDate: lesson.makeupOption === 'MAKEUP' ? lesson.makeupDate : null,
    makeupTimeslotId: lesson.makeupOption === 'MAKEUP' ? lesson.makeupTimeslotId : null
  }));

  for (const opt of lessonOptions) {
    if (opt.makeupOption === 'MAKEUP') {
      if (!opt.makeupDate || !opt.makeupTimeslotId) {
        const lessonInfo = affectedLessonsPreview.value.find(l => l.id === opt.lessonId);
        ElMessage.warning(t('leave.warn_select_makeup', { class: lessonInfo?.classCode || '', index: lessonInfo?.lessonIndex || '' }));
        return;
      }
    }
  }

  saving.value = true;
  try {
    const payload = {
      ...form.value,
      lessonOptions
    };
    
    let res: any;
    if (formId.value) {
      res = await api.put(`/leave-requests/${formId.value}`, payload);
    } else {
      res = await api.post('/leave-requests', payload);
    }

    if (res.success) {
      showModal.value = false;
      fetchRequests();
      ElMessage.success(formId.value ? t('leave.success_update') : t('leave.success_submit'));
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('common.error'));
  } finally {
    saving.value = false;
  }
};

/** Kiểm tra khả năng dạy bù (Feasibility check) trước khi duyệt đơn */
const checkFeasibility = async () => {
  const makeupLessons = affectedLessonsPreview.value.filter(l => l.makeupOption === 'MAKEUP');
  for (const lesson of makeupLessons) {
    if (!lesson.makeupDate || !lesson.makeupTimeslotId) {
      ElMessage.warning(t('leave.warn_select_makeup', { class: lesson.classCode, index: lesson.lessonIndex }));
      return;
    }
  }

  if (!reviewMakeupRoomId.value) {
    ElMessage.warning(t('leave.warn_check_room'));
    return;
  }

  checkingFeasibility.value = true;
  try {
    const res: any = await api.get(`/leave-requests/${formId.value}/check-feasibility`, {
      params: { makeupRoomId: reviewMakeupRoomId.value }
    });
    if (res.success) {
      ElMessage.success(t('leave.success_feasibility'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('leave.error_feasibility'));
  } finally {
    checkingFeasibility.value = false;
  }
};

/** Phê duyệt đơn xin nghỉ (cả dạy bù và không dạy bù) */
const approve = async () => {
  try {
    await ElMessageBox.confirm(
      t('leave.approve_confirm_text'),
      t('leave.approve_confirm_title'),
      { type: 'success', confirmButtonText: t('leave.approve_confirm_btn'), cancelButtonText: t('leave.approve_confirm_cancel') }
    );
    
    const params: any = {};
    if (hasMakeupLessons.value) {
      if (!reviewMakeupRoomId.value) {
        ElMessage.warning(t('leave.warn_approve_room'));
        return;
      }
      params.makeupRoomId = reviewMakeupRoomId.value;
    }

    const res: any = await api.put(`/leave-requests/${formId.value}/approve`, null, { params });
    if (res.success) {
      ElMessage.success(t('leave.success_approve'));
      showModal.value = false;
      fetchRequests();
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('leave.error_approve'));
    }
  }
};

/** Từ chối đơn nghỉ */
const reject = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      t('leave.reject_confirm_text'),
      t('leave.reject_confirm_title'),
      { type: 'error', confirmButtonText: t('leave.reject_confirm_btn'), cancelButtonText: t('leave.reject_confirm_cancel') }
    );
    const res: any = await api.put(`/leave-requests/${id}/reject`);
    if (res.success) {
      fetchRequests();
      ElMessage.success(t('leave.success_reject'));
      showModal.value = false;
    }
  } catch {
    // Hủy bỏ
  }
};

/** Mở dialog tìm giáo viên thay thế */
const openSubstituteDialog = async (lesson: any) => {
  selectedLessonForSub.value = lesson;
  substitutes.value = [];
  selectedSubTeacherIds.value = [];
  showSubstituteDialog.value = true;
  loadingSubstitutes.value = true;
  
  try {
    const res: any = await api.get('/leave-requests/substitute/candidates', {
      params: { lessonId: lesson.id }
    });
    if (res.success) {
      substitutes.value = res.data;
    }
  } catch (err) {
    ElMessage.error(t('leave.error_find_sub'));
  } finally {
    loadingSubstitutes.value = false;
  }
};

const handleSubSelectionChange = (selection: any[]) => {
  selectedSubTeacherIds.value = selection.map(s => s.id);
};

/** Gửi yêu cầu dạy thay FCFS qua Email */
const dispatchSubstituteOffers = async () => {
  if (selectedSubTeacherIds.value.length === 0) return;
  dispatchingOffers.value = true;
  
  try {
    const payload = {
      leaveRequestId: formId.value,
      lessonId: selectedLessonForSub.value.id,
      teacherIds: selectedSubTeacherIds.value
    };
    const res: any = await api.post('/leave-requests/substitute/dispatch', payload);
    if (res.success) {
      ElMessage.success(t('leave.success_send_sub'));
      showSubstituteDialog.value = false;
    }
  } catch (err) {
    ElMessage.error(t('leave.error_send_sub'));
  } finally {
    dispatchingOffers.value = false;
  }
};

onMounted(() => {
  fetchRequests();
  fetchMetadata();
});
</script>

<style scoped>
.premium-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  border-radius: 12px;
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

.mini-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-fade-in-enter-active, .el-fade-in-leave-active {
  transition: opacity 0.3s ease;
}
.el-fade-in-enter-from, .el-fade-in-leave-to {
  opacity: 0;
}
</style>
