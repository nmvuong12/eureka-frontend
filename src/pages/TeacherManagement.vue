<template>
  <div class="teacher-management">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('teacher.title') }}</h1>
      <el-button type="primary" @click="openModal()">
        <el-icon class="mr-1"><Plus /></el-icon>
        {{ $t('common.add') }} {{ $t('menu.teachers') }}
      </el-button>
    </div>

    <!-- Advanced Search Area -->
    <el-card class="mb-6" shadow="sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-gray-800 flex items-center gap-2">
          <el-icon><Search /></el-icon>
          {{ $t('common.search') }}
        </h2>
        <el-button link type="primary" @click="resetSearch">{{ $t('common.reset') }}</el-button>
      </div>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="mb-2 text-sm font-medium text-gray-700">{{ $t('teacher.name') }}</div>
          <el-input v-model="searchFilters.name" :placeholder="$t('common.placeholder_input')" clearable />
        </el-col>
        <el-col :span="6">
          <div class="mb-2 text-sm font-medium text-gray-700">Email / SĐT</div>
          <el-input v-model="searchFilters.contact" placeholder="Nhập email hoặc SĐT..." clearable />
        </el-col>
        <el-col :span="6">
          <div class="mb-2 text-sm font-medium text-gray-700">{{ $t('teacher.skills') }}</div>
          <el-input v-model="searchFilters.skill" placeholder="VD: IELTS" clearable />
        </el-col>
        <el-col :span="6">
          <div class="mb-2 text-sm font-medium text-gray-700">{{ $t('common.status') }}</div>
          <el-select v-model="searchFilters.status" :placeholder="$t('common.placeholder_select')" clearable class="w-full">
            <el-option :label="$t('common.active')" value="ACTIVE" />
            <el-option :label="$t('common.inactive')" value="INACTIVE" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="sm" class="mb-6" :body-style="{ padding: '0px' }">
      <el-table :data="teachers" style="width: 100%" stripe>
        <el-table-column prop="name" :label="$t('teacher.name')" min-width="180">
          <template #default="{ row }">
            <div class="font-medium text-gray-900">{{ row.name }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.details')" min-width="200">
          <template #default="{ row }">
            <div class="text-sm text-gray-500">{{ row.email }}</div>
            <div class="text-sm text-gray-500">{{ row.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('teacher.skills')" min-width="220">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <el-tag v-for="skill in row.skills" :key="skill" size="small" effect="plain" type="info">
                {{ skill }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ row.status === 'ACTIVE' ? $t('common.active') : $t('common.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="info" link @click="openModal(row, true)">
              <el-icon><View /></el-icon>
            </el-button>
            <el-button type="danger" link @click="deleteTeacher(row.id!)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="Không tìm thấy dữ liệu phù hợp" />
        </template>
      </el-table>

      <div class="flex justify-end p-4 border-t border-gray-100">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="itemsPerPage"
          :page-sizes="[15, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalElements"
        />
      </div>
    </el-card>

    <!-- Drawer Form -->
    <el-drawer
      v-model="showModal"
      :title="isViewOnly ? $t('teacher.view_detail') : (currentTeacher.id ? $t('teacher.update') : $t('teacher.create'))"
      size="50%"
      @close="closeModal"
    >
      <el-form :model="currentTeacher" label-position="top" :disabled="isViewOnly">
        <el-form-item :label="$t('teacher.name')" required>
          <el-input v-model="currentTeacher.name" />
        </el-form-item>
        <el-form-item :label="$t('teacher.email')" required>
          <el-input v-model="currentTeacher.email" type="email" />
        </el-form-item>
        <el-form-item :label="$t('teacher.phone')">
          <el-input v-model="currentTeacher.phone" />
        </el-form-item>
        <el-form-item :label="$t('teacher.skills_help')">
          <el-input v-model="skillString" :placeholder="$t('teacher.skills_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('common.status')">
          <el-select v-model="currentTeacher.status" class="w-full">
            <el-option :label="$t('common.active')" value="ACTIVE" />
            <el-option :label="$t('common.inactive')" value="INACTIVE" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="flex justify-end space-x-2">
          <template v-if="isViewOnly">
            <el-button type="primary" @click="isViewOnly = false">
              <el-icon class="mr-1"><Edit /></el-icon>
              {{ $t('common.edit') }}
            </el-button>
          </template>
          <template v-else>
            <el-button @click="closeModal">{{ $t('common.cancel') }}</el-button>
            <el-button type="primary" @click="saveTeacher">{{ $t('common.save') }}</el-button>
          </template>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '@/api/axios';
import type { Teacher } from '@/types';
import { Plus, Search, Edit, Delete, View } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const teachers = ref<Teacher[]>([]);

// Pagination and Search State
const currentPage = ref(1);
const itemsPerPage = ref(15);
const totalElements = ref(0);
const searchFilters = ref({
  name: '',
  contact: '',
  skill: '',
  status: ''
});

const showModal = ref(false);
const isViewOnly = ref(false);
const currentTeacher = ref<Teacher>({ name: '', email: '', phone: '', status: 'ACTIVE', skills: [] });
const skillString = ref('');

const resetSearch = () => {
  searchFilters.value = { name: '', contact: '', skill: '', status: '' };
  currentPage.value = 1;
};

const fetchTeachers = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: itemsPerPage.value,
      name: searchFilters.value.name || undefined,
      contact: searchFilters.value.contact || undefined,
      skill: searchFilters.value.skill || undefined,
      status: searchFilters.value.status || undefined
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

watch([currentPage, itemsPerPage], () => {
  fetchTeachers();
});

let timeoutId: any;
watch(searchFilters, () => {
  currentPage.value = 1;
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => fetchTeachers(), 500);
}, { deep: true });

const openModal = (teacher?: Teacher, viewOnly: boolean = false) => {
  isViewOnly.value = viewOnly;
  if (teacher) {
    currentTeacher.value = { ...teacher };
    skillString.value = teacher.skills ? teacher.skills.join(', ') : '';
  } else {
    currentTeacher.value = { name: '', email: '', phone: '', status: 'ACTIVE', skills: [] };
    skillString.value = '';
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveTeacher = async () => {
  try {
    const payload = {
      ...currentTeacher.value,
      skills: skillString.value.split(',').map(s => s.trim()).filter(s => s)
    };
    
    let res: any;
    if (currentTeacher.value.id) {
      res = await api.put(`/teachers/${currentTeacher.value.id}`, payload);
    } else {
      res = await api.post('/teachers', payload);
    }
    
    if (res.success) {
      ElMessage.success(t('common.success'));
      closeModal();
      fetchTeachers();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch (err: any) {
    ElMessage.error(err.message || t('common.error'));
  }
};

const deleteTeacher = async (id: number) => {
  try {
    await ElMessageBox.confirm(t('teacher.delete_confirm'), t('common.confirm'), {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    });
    const res: any = await api.delete(`/teachers/${id}`);
    if (res.success) {
      ElMessage.success(t('common.success'));
      fetchTeachers();
    }
  } catch (err) {
    // Canceled
  }
};

onMounted(() => {
  fetchTeachers();
});
</script>
