<template>
  <div class="teacher-management space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('teacher.title') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ $t('teacher.desc_page') }}</p>
      </div>
      <el-button type="primary" @click="openModal()" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300">
        <el-icon class="mr-1"><Plus /></el-icon>
        {{ $t('teacher.create') }}
      </el-button>
    </div>

    <!-- Advanced Search Area -->
    <el-card class="border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md" :body-style="{ padding: '24px' }">
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
          <el-button @click="resetSearch" class="hover:text-emerald-600 hover:border-emerald-200">
            <el-icon class="mr-1"><Refresh /></el-icon>
            {{ $t('common.reset') }}
          </el-button>
        </div>
      </div>
      
      <el-row :gutter="20" class="row-gap-4">
        <el-col :xs="24" :sm="12" :md="6" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('teacher.id') }}</div>
          <el-input v-model="searchFilters.teacherCode" :placeholder="$t('teacher.placeholder_code')" clearable @keyup.enter="handleSearch" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('teacher.name') }}</div>
          <el-input v-model="searchFilters.fullName" :placeholder="$t('teacher.placeholder_name')" clearable @keyup.enter="handleSearch" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('teacher.skills') }}</div>
          <el-input v-model="searchFilters.skill" :placeholder="$t('teacher.placeholder_skills')" clearable @keyup.enter="handleSearch" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('teacher.type') }}</div>
          <el-select v-model="searchFilters.teacherType" :placeholder="$t('common.all')" clearable class="w-full">
            <el-option :label="$t('dashboard.teacher_fulltime')" value="FULL_TIME" />
            <el-option :label="$t('dashboard.teacher_parttime')" value="PART_TIME" />
          </el-select>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('common.status') }}</div>
          <el-select v-model="searchFilters.workingStatus" :placeholder="$t('common.all')" clearable class="w-full">
            <el-option :label="$t('teacher.status_active')" value="ACTIVE" />
            <el-option :label="$t('teacher.status_inactive')" value="INACTIVE" />
            <el-option :label="$t('teacher.status_on_leave')" value="ON_LEAVE" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Data Table Card -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0px' }">
      <el-table :data="teachers" style="width: 100%" stripe class="premium-table">
        <!-- Mã GV Column -->
        <el-table-column prop="teacherCode" :label="$t('teacher.id')" width="110">
          <template #default="{ row }">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {{ row.teacherCode }}
            </span>
          </template>
        </el-table-column>

        <!-- Họ và Tên Column -->
        <el-table-column prop="fullName" :label="$t('teacher.name')" min-width="180">
          <template #default="{ row }">
            <div class="font-bold text-gray-900 hover:text-emerald-600 transition-colors duration-200">{{ row.fullName }}</div>
            <div class="text-xs text-gray-400 mt-0.5">ID: #{{ row.id }}</div>
          </template>
        </el-table-column>

        <!-- Loại Hợp Đồng Column -->
        <el-table-column :label="$t('teacher.contract_type')" width="130">
          <template #default="{ row }">
            <el-tag :type="row.teacherType === 'FULL_TIME' ? 'success' : 'warning'" effect="light" class="font-bold rounded-lg">
              {{ row.teacherType === 'FULL_TIME' ? $t('dashboard.teacher_fulltime') : $t('dashboard.teacher_parttime') }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Liên Hệ & Thông Tin Khác Column -->
        <el-table-column :label="$t('teacher.contact_info')" min-width="220">
          <template #default="{ row }">
            <div class="flex flex-col gap-1 text-xs">
              <div class="flex items-center gap-1.5 text-gray-600">
                <el-icon class="text-gray-400"><Message /></el-icon>
                <span>{{ row.email }}</span>
              </div>
              <div class="flex items-center gap-1.5 text-gray-600">
                <el-icon class="text-gray-400"><Phone /></el-icon>
                <span>{{ row.phone }}</span>
              </div>
              <div v-if="row.address" class="flex items-center gap-1.5 text-gray-400 truncate max-w-[200px]" :title="row.address">
                <el-icon><Location /></el-icon>
                <span>{{ row.address }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Kỹ Năng Chuyên Môn Column -->
        <el-table-column :label="$t('teacher.skills')" min-width="200">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <el-tag v-for="skill in getSkillList(row.skills)" :key="skill" size="small" effect="plain" type="info" class="!border-gray-200 !text-gray-600 bg-gray-50 rounded-md">
                {{ skill }}
              </el-tag>
              <span v-if="!row.skills" class="text-gray-400 text-xs italic">{{ $t('common.none') }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- Trạng Thái Column -->
        <el-table-column :label="$t('common.status')" width="130">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.workingStatus)" effect="dark" class="font-bold rounded-md">
              {{ getStatusLabel(row.workingStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Thao Tác Column -->
        <el-table-column :label="$t('common.actions')" width="150" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip :content="$t('account.tooltip_detail')" placement="top">
                <el-button type="info" link @click="openModal(row, true)" class="hover:!text-blue-600">
                  <el-icon :size="16"><View /></el-icon>
                </el-button>
              </el-tooltip>
              

              
              <el-tooltip :content="$t('common.edit')" placement="top">
                <el-button type="primary" link @click="openModal(row, false)" class="hover:!text-emerald-600">
                  <el-icon :size="16"><Edit /></el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip :content="$t('teacher.tooltip_delete')" placement="top">
                <el-button type="danger" link @click="deleteTeacher(row.id!)" class="hover:!text-red-600">
                  <el-icon :size="16"><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <template #empty>
          <el-empty :description="$t('teacher.empty')" />
        </template>
      </el-table>

      <!-- Pagination Footer -->
      <div class="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
        <div class="text-xs text-gray-500">{{ $t('teacher.page_info', { current: currentPage, total: totalElements }) }}</div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="itemsPerPage"
          :page-sizes="[10, 15, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalElements"
          @current-change="fetchTeachers"
          @size-change="fetchTeachers"
          class="premium-pagination"
        />
      </div>
    </el-card>

    <!-- Detail / Create / Edit Drawer -->
    <el-drawer
      v-model="showModal"
      :title="isViewOnly ? $t('teacher.view_detail') : (currentTeacher.id ? $t('teacher.update') : $t('teacher.create'))"
      size="50%"
      @close="closeModal"
      custom-class="premium-drawer"
    >
      <el-form :model="currentTeacher" label-position="top" :disabled="isViewOnly" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        
        <el-form-item :label="$t('teacher.name')" required class="col-span-2">
          <el-input v-model="currentTeacher.fullName" :placeholder="$t('teacher.placeholder_name_full')" />
        </el-form-item>

        <el-form-item :label="$t('teacher.email')" required>
          <el-input v-model="currentTeacher.email" type="email" :placeholder="$t('teacher.placeholder_email')" />
        </el-form-item>

        <el-form-item :label="$t('teacher.phone')" required>
          <el-input v-model="currentTeacher.phone" :placeholder="$t('teacher.placeholder_phone')" />
        </el-form-item>

        <el-form-item :label="$t('teacher.contract_type')" required>
          <el-select v-model="currentTeacher.teacherType" class="w-full">
            <el-option :label="$t('dashboard.teacher_fulltime')" value="FULL_TIME" />
            <el-option :label="$t('dashboard.teacher_parttime')" value="PART_TIME" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('account.gender')" required>
          <el-select v-model="currentTeacher.gender" class="w-full">
            <el-option :label="$t('account.male')" value="MALE" />
            <el-option :label="$t('account.female')" value="FEMALE" />
            <el-option :label="$t('account.other')" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('account.dob')">
          <el-date-picker v-model="currentTeacher.dateOfBirth" type="date" class="w-full" :placeholder="$t('teacher.placeholder_dob')" format="DD/MM/YYYY" value-format="YYYY-MM-DD" />
        </el-form-item>

        <el-form-item :label="$t('common.status')">
          <el-select v-model="currentTeacher.workingStatus" class="w-full">
            <el-option :label="$t('teacher.status_active')" value="ACTIVE" />
            <el-option :label="$t('teacher.status_inactive')" value="INACTIVE" />
            <el-option :label="$t('teacher.status_on_leave')" value="ON_LEAVE" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('account.address')" class="col-span-2">
          <el-input v-model="currentTeacher.address" :placeholder="$t('teacher.placeholder_address')" />
        </el-form-item>

        <el-form-item :label="$t('teacher.skills')" class="col-span-2">
          <el-select
            v-model="selectedSkillsArray"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :placeholder="$t('teacher.skills_placeholder')"
            class="w-full"
            @change="handleSkillsChange"
          >
            <el-option
              v-for="skill in allSkills"
              :key="skill.id"
              :label="`${skill.skillName} (${skill.skillCode})`"
              :value="skill.skillCode"
              :disabled="isSkillDisabled(skill)"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('teacher.profile_file')" class="col-span-2">
          <div class="flex items-center gap-3 w-full">
            <el-input v-model="currentTeacher.profileFile" :placeholder="$t('teacher.placeholder_file')" disabled class="flex-grow" />
            <el-upload
              action=""
              :http-request="(options: any) => handleFileUpload(options, 'profileFile')"
              :show-file-list="false"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <el-button type="success" plain :loading="uploadingProfile" class="flex items-center">
                <el-icon class="mr-1"><Upload /></el-icon>
                {{ $t('teacher.btn_upload') }}
              </el-button>
            </el-upload>
            <el-button v-if="currentTeacher.profileFile" type="primary" link @click="downloadFile(currentTeacher.profileFile)" class="flex items-center">
              <el-icon class="mr-1"><Download /></el-icon>
              {{ $t('teacher.btn_view') }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item :label="$t('teacher.certificate_file')" class="col-span-2">
          <div class="flex items-center gap-3 w-full">
            <el-input v-model="currentTeacher.certificateFile" :placeholder="$t('teacher.placeholder_file')" disabled class="flex-grow" />
            <el-upload
              action=""
              :http-request="(options: any) => handleFileUpload(options, 'certificateFile')"
              :show-file-list="false"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <el-button type="success" plain :loading="uploadingCertificate" class="flex items-center">
                <el-icon class="mr-1"><Upload /></el-icon>
                {{ $t('teacher.btn_upload') }}
              </el-button>
            </el-upload>
            <el-button v-if="currentTeacher.certificateFile" type="primary" link @click="downloadFile(currentTeacher.certificateFile)" class="flex items-center">
              <el-icon class="mr-1"><Download /></el-icon>
              {{ $t('teacher.btn_view') }}
            </el-button>
          </div>
        </el-form-item>

      </el-form>
      
      <template #footer>
        <div class="flex justify-end space-x-2 p-4 border-t border-gray-100">
          <template v-if="isViewOnly">
            <el-button type="primary" @click="isViewOnly = false" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
              <el-icon class="mr-1"><Edit /></el-icon>
              {{ $t('common.edit') }}
            </el-button>
          </template>
          <template v-else>
            <el-button @click="closeModal">{{ $t('common.cancel') }}</el-button>
            <el-button type="primary" @click="saveTeacher" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
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
import type { Teacher } from '@/types';
import { Plus, Search, Edit, Delete, View, Refresh, Phone, Message, Location, Upload, Download } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Component States
const teachers = ref<Teacher[]>([]);
const currentPage = ref(1);
const itemsPerPage = ref(15);
const totalElements = ref(0);

// Unified Search Filters matching backend
const searchFilters = ref({
  teacherCode: '',
  fullName: '',
  skill: '',
  teacherType: '',
  workingStatus: ''
});

// Modal control
const showModal = ref(false);
const isViewOnly = ref(false);

// Schema matches backend exact DTO
const currentTeacher = ref<any>({
  id: null,
  teacherCode: '',
  teacherType: 'FULL_TIME',
  fullName: '',
  dateOfBirth: '',
  gender: 'MALE',
  address: '',
  email: '',
  phone: '',
  skills: '',
  certificateFile: '',
  profileFile: '',
  workingStatus: 'ACTIVE'
});



// Professional Skills and File Upload States
const allSkills = ref<any[]>([]);
const selectedSkillsArray = ref<string[]>([]);
const uploadingProfile = ref(false);
const uploadingCertificate = ref(false);

const fetchAllSkills = async () => {
  try {
    const res: any = await api.get('/skills/all');
    if (res.success) {
      allSkills.value = res.data;
    }
  } catch (err) {
    console.error('Lỗi khi tải danh sách kỹ năng:', err);
  }
};

const handleFileUpload = async (options: any, fieldName: 'profileFile' | 'certificateFile') => {
  const file = options.file;
  const formData = new FormData();
  formData.append('file', file);

  if (fieldName === 'profileFile') {
    uploadingProfile.value = true;
  } else {
    uploadingCertificate.value = true;
  }

  try {
    const res: any = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.success) {
      currentTeacher.value[fieldName] = res.data;
      ElMessage.success(t('teacher.success_upload'));
    } else {
      ElMessage.error(res.message || t('teacher.error_upload'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('teacher.error_upload_system'));
  } finally {
    if (fieldName === 'profileFile') {
      uploadingProfile.value = false;
    } else {
      uploadingCertificate.value = false;
    }
  }
};

const downloadFile = (filename: string) => {
  if (!filename) return;
  window.open(`/api/files/download/${filename}`, '_blank');
};

// Load metadata and teachers list
const fetchTeachers = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: itemsPerPage.value,
      teacherCode: searchFilters.value.teacherCode || undefined,
      fullName: searchFilters.value.fullName || undefined,
      skill: searchFilters.value.skill || undefined,
      teacherType: searchFilters.value.teacherType || undefined,
      workingStatus: searchFilters.value.workingStatus || undefined
    };

    const res: any = await api.get('/teachers', { params });
    if (res.success) {
      teachers.value = res.data.content;
      totalElements.value = res.data.totalElements;
    }
  } catch (err) {
    ElMessage.error(t('teacher.error_load'));
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchTeachers();
};

const resetSearch = () => {
  searchFilters.value = {
    teacherCode: '',
    fullName: '',
    skill: '',
    teacherType: '',
    workingStatus: ''
  };
  currentPage.value = 1;
  fetchTeachers();
};

// Form Open/Close Operations
const openModal = (teacher?: any, viewOnly: boolean = false) => {
  isViewOnly.value = viewOnly;
  if (teacher) {
    currentTeacher.value = { ...teacher };
    selectedSkillsArray.value = teacher.skills
      ? teacher.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      : [];
    handleSkillsChange(selectedSkillsArray.value);
  } else {
    currentTeacher.value = {
      id: null,
      teacherCode: '',
      teacherType: 'FULL_TIME',
      fullName: '',
      dateOfBirth: '',
      gender: 'MALE',
      address: '',
      email: '',
      phone: '',
      skills: '',
      certificateFile: '',
      profileFile: '',
      workingStatus: 'ACTIVE'
    };
    selectedSkillsArray.value = [];
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveTeacher = async () => {
  // Input validations
  if (!currentTeacher.value.fullName) {
    ElMessage.warning(t('teacher.warn_name_empty'));
    return;
  }
  if (!currentTeacher.value.email) {
    ElMessage.warning(t('teacher.warn_email_empty'));
    return;
  }
  if (!currentTeacher.value.phone) {
    ElMessage.warning(t('teacher.warn_phone_empty'));
    return;
  }

  // Convert selected skills array back to comma-separated string
  currentTeacher.value.skills = selectedSkillsArray.value.join(', ');

  try {
    let res: any;
    if (currentTeacher.value.id) {
      res = await api.put(`/teachers/${currentTeacher.value.id}`, currentTeacher.value);
    } else {
      res = await api.post('/teachers', currentTeacher.value);
    }

    if (res.success) {
      ElMessage.success(t('teacher.success_save'));
      closeModal();
      fetchTeachers();
    } else {
      ElMessage.error(res.message || t('teacher.success_save_failed'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || err.message || t('teacher.error_server'));
  }
};

const deleteTeacher = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      t('teacher.confirm_delete_text'),
      t('teacher.confirm_delete_title'),
      {
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    
    const res: any = await api.delete(`/teachers/${id}`);
    if (res.success) {
      ElMessage.success(t('teacher.success_delete'));
      fetchTeachers();
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || t('teacher.error_delete_referenced'));
    }
  }
};



// Helper Formatters
const getSkillList = (skillsString: string) => {
  if (!skillsString) return [];
  return skillsString.split(',').map(s => s.trim()).filter(s => s);
};

const isSkillDisabled = (skill: any) => {
  if (!skill || !skill.skillGroup || !skill.levelRank) return false;
  return selectedSkillsArray.value.some(code => {
    if (code === skill.skillCode) return false;
    const s = allSkills.value.find(item => item.skillCode === code);
    return s && s.skillGroup === skill.skillGroup && s.levelRank > skill.levelRank;
  });
};

const handleSkillsChange = (newVal: string[]) => {
  if (!newVal || newVal.length <= 1) return;
  const filtered = [...newVal];
  for (let i = filtered.length - 1; i >= 0; i--) {
    const code = filtered[i];
    const skill = allSkills.value.find(s => s.skillCode === code);
    if (skill && skill.skillGroup && skill.levelRank) {
      const hasHigher = filtered.some(otherCode => {
        if (otherCode === code) return false;
        const otherSkill = allSkills.value.find(s => s.skillCode === otherCode);
        return otherSkill && otherSkill.skillGroup === skill.skillGroup && otherSkill.levelRank > skill.levelRank;
      });
      if (hasHigher) {
        filtered.splice(i, 1);
      }
    }
  }
  selectedSkillsArray.value = filtered;
};

const getStatusType = (status: string) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'ON_LEAVE') return 'warning';
  return 'danger';
};

const getStatusLabel = (status: string) => {
  if (status === 'ACTIVE') return t('teacher.status_active');
  if (status === 'ON_LEAVE') return t('teacher.status_on_leave');
  return t('teacher.status_inactive');
};



onMounted(() => {
  fetchTeachers();
  fetchAllSkills();
});
</script>

<style scoped>
.premium-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  border-radius: 12px;
}

.premium-drawer :deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 800;
  color: #0f172a;
}

.premium-dialog :deep(.el-dialog__header) {
  font-weight: 800;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 20px;
}

.mini-table {
  border-radius: 8px;
  overflow: hidden;
}
</style>
