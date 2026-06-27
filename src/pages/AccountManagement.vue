<template>
  <div class="account-management space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100 mb-6">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span class="bg-gradient-to-r from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
          {{ $t('account.title') }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ $t('account.description') }}</p>
      </div>
      <el-button type="primary" @click="openModal()" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md transition-all duration-300">
        <el-icon class="mr-1"><Plus /></el-icon>
        {{ $t('common.add') }} {{ $t('menu.accounts') }}
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
          <el-button @click="resetSearch" class="hover:text-emerald-600 hover:border-emerald-200">
            <el-icon class="mr-1"><Refresh /></el-icon>
            {{ $t('common.reset') }}
          </el-button>
        </div>
      </div>
      
      <el-row :gutter="20" class="row-gap-4">
        <el-col :xs="24" :sm="12" :md="8" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('account.username') }}</div>
          <el-input v-model="searchFilters.username" :placeholder="$t('common.placeholder_input')" clearable @keyup.enter="handleSearch" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('account.role') }}</div>
          <el-select v-model="searchFilters.role" :placeholder="$t('common.placeholder_select')" clearable class="w-full">
            <el-option :label="$t('account.admin')" value="ADMIN" />
            <el-option :label="$t('account.staff')" value="STAFF" />
            <el-option :label="$t('account.teacher_role')" value="TEACHER" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('common.status') }}</div>
          <el-select v-model="searchFilters.isActive" :placeholder="$t('common.placeholder_select')" clearable class="w-full">
            <el-option :label="$t('common.active')" value="true" />
            <el-option :label="$t('common.inactive')" value="false" />
          </el-select>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="12" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('account.full_name') }}</div>
          <el-input v-model="searchFilters.fullName" :placeholder="$t('common.placeholder_input')" clearable @keyup.enter="handleSearch" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" class="mb-4">
          <div class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ $t('account.email') }}</div>
          <el-input v-model="searchFilters.email" :placeholder="$t('common.placeholder_input')" clearable @keyup.enter="handleSearch" />
        </el-col>
      </el-row>
    </el-card>

    <!-- Data Table Card -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden mb-6" :body-style="{ padding: '0px' }">
      <el-table :data="users" style="width: 100%" stripe class="premium-table">
        <el-table-column prop="username" :label="$t('account.username')" min-width="140">
          <template #default="{ row }">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {{ row.username }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="role" :label="$t('account.role')" min-width="130">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'warning' : row.role === 'STAFF' ? 'info' : 'success'" effect="light" class="font-bold rounded-lg">
              {{ row.role === 'ADMIN' ? $t('account.admin') : row.role === 'STAFF' ? $t('account.staff') : $t('account.teacher_role') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('account.full_name')" min-width="160">
          <template #default="{ row }">
            <span class="font-bold text-gray-900 hover:text-emerald-600 transition-colors duration-200">{{ row.fullName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('account.dob')" min-width="130">
          <template #default="{ row }">
            <span class="text-gray-600 font-medium">{{ row.dob ? formatDate(row.dob) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('account.email')" min-width="200">
          <template #default="{ row }">
            <span class="text-gray-600 font-medium">{{ row.email || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" effect="dark" class="font-bold rounded-md">
              {{ row.isActive ? $t('common.active') : $t('common.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip :content="$t('account.tooltip_detail')" placement="top">
                <el-button type="info" link @click="openModal(row, true)" class="hover:!text-blue-600">
                  <el-icon :size="16"><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('account.tooltip_delete')" placement="top">
                <el-button type="danger" link @click="deleteUser(row.id)" class="hover:!text-red-600">
                  <el-icon :size="16"><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.no_data')" />
        </template>
      </el-table>
      
      <!-- Pagination Footer -->
      <div class="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
        <div class="text-xs text-gray-500">{{ $t('common.show') }} {{ currentPage }} / {{ totalElements }}</div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="itemsPerPage"
          :page-sizes="[15, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalElements"
          @current-change="fetchData"
          @size-change="fetchData"
          class="premium-pagination"
        />
      </div>
    </el-card>

    <!-- Drawer Form -->
    <el-drawer
      v-model="showModal"
      :title="isViewOnly ? $t('account.view_detail') : (form.id ? $t('account.update') : $t('account.create'))"
      size="50%"
      @close="showModal = false"
      class="premium-drawer"
      custom-class="premium-drawer"
    >
      <el-form :model="form" label-position="top" :disabled="isViewOnly" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        <el-form-item :label="$t('account.username')" required class="col-span-2">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        
        <el-form-item :label="$t('account.password')" :required="!form.id">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>

        <el-form-item v-if="!form.id || form.password" :label="$t('account.confirm_password')" :required="!form.id || !!form.password">
          <el-input v-model="form.confirmPassword" type="password" show-password />
        </el-form-item>
        
        <el-form-item :label="$t('account.role')" required class="col-span-2">
          <el-select v-model="form.role" class="w-full">
            <el-option :label="$t('account.admin')" value="ADMIN" />
            <el-option :label="$t('account.staff')" value="STAFF" />
            <el-option :label="$t('account.teacher_role')" value="TEACHER" />
          </el-select>
        </el-form-item>

        <template v-if="form.role === 'ADMIN' || form.role === 'STAFF'">
          <el-form-item :label="$t('account.full_name')" required class="col-span-2">
            <el-input v-model="form.fullName" :placeholder="$t('common.placeholder_input')" />
          </el-form-item>
          
          <el-form-item :label="$t('account.gender')">
            <el-select v-model="form.gender" class="w-full">
              <el-option :label="$t('account.male')" value="Nam" />
              <el-option :label="$t('account.female')" value="Nữ" />
              <el-option :label="$t('account.other')" value="Khác" />
            </el-select>
          </el-form-item>
          
          <el-form-item :label="$t('account.dob')">
            <el-date-picker v-model="form.dob" type="date" class="w-full" :placeholder="$t('common.placeholder_select')" format="DD/MM/YYYY" value-format="YYYY-MM-DD" />
          </el-form-item>

          <el-form-item :label="$t('account.phone')">
            <el-input v-model="form.phone" />
          </el-form-item>

          <el-form-item :label="$t('account.email')">
            <el-input v-model="form.email" />
          </el-form-item>

          <el-form-item :label="$t('account.address')" class="col-span-2">
            <el-input v-model="form.address" type="textarea" :rows="2" />
          </el-form-item>
        </template>
        
        <el-form-item v-if="form.role === 'TEACHER'" :label="$t('account.teacher')" required class="col-span-2">
          <el-select
            v-model="form.teacherId"
            filterable
            :placeholder="$t('common.placeholder_input')"
            class="w-full"
          >
            <el-option
              v-for="t in teachers"
              :key="t.id"
              :label="`${t.fullName} (${t.email})`"
              :value="t.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item class="col-span-2">
          <el-checkbox v-model="form.active">{{ $t('account.active_account') }}</el-checkbox>
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
            <el-button @click="showModal = false">{{ $t('common.cancel') }}</el-button>
            <el-button type="primary" @click="saveUser" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
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
import { Plus, Search, Edit, Delete, View, Refresh } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
};

const users = ref<any[]>([]);
const teachers = ref<any[]>([]);

// Pagination and Search State
const currentPage = ref(1);
const itemsPerPage = ref(15);
const totalElements = ref(0);
const searchFilters = ref({
  username: '',
  role: '',
  isActive: '',
  fullName: '',
  email: ''
});

const showModal = ref(false);
const isViewOnly = ref(false);
const initialForm = { 
  id: null, 
  username: '', 
  password: '', 
  confirmPassword: '',
  role: 'STAFF', 
  teacherId: null, 
  active: true,
  fullName: '',
  gender: 'Nam',
  dob: '',
  address: '',
  phone: '',
  email: ''
};
const form = ref<any>({ ...initialForm });

const resetSearch = () => {
  searchFilters.value = { username: '', role: '', isActive: '', fullName: '', email: '' };
  currentPage.value = 1;
  fetchData();
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

const fetchData = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: itemsPerPage.value,
      username: searchFilters.value.username || undefined,
      role: searchFilters.value.role || undefined,
      isActive: searchFilters.value.isActive !== '' ? searchFilters.value.isActive : undefined,
      fullName: searchFilters.value.fullName || undefined,
      email: searchFilters.value.email || undefined
    };
    
    const [resU, resT]: any = await Promise.all([
      api.get('/accounts', { params }),
      api.get('/teachers', { params: { size: 1000 } }) // Get all teachers for the dropdown
    ]);
    if (resU.success) {
      users.value = resU.data.content;
      totalElements.value = resU.data.totalElements;
    }
    if (resT.success) {
      teachers.value = resT.data.content || resT.data;
    }
  } catch (err) {}
};

const openModal = (user?: any, viewOnly: boolean = false) => {
  isViewOnly.value = viewOnly;
  if (user) {
    form.value = { ...initialForm, ...user, password: '', confirmPassword: '' };
  } else {
    form.value = { ...initialForm };
  }
  showModal.value = true;
};

const saveUser = async () => {
  if (!form.value.username || !form.value.role) {
    ElMessage.error(t('common.required'));
    return;
  }

  if (!form.value.id && !form.value.password) {
    ElMessage.error(t('common.placeholder_input'));
    return;
  }

  if (form.value.password && form.value.password !== form.value.confirmPassword) {
    ElMessage.error(t('account.error_password_mismatch'));
    return;
  }

  if ((form.value.role === 'ADMIN' || form.value.role === 'STAFF') && !form.value.fullName) {
    ElMessage.error(t('common.required'));
    return;
  }

  if (form.value.role === 'TEACHER' && !form.value.teacherId) {
    ElMessage.error(t('account.select_teacher_warn'));
    return;
  }

  try {
    let res: any;
    if (form.value.id) {
      res = await api.put(`/accounts/${form.value.id}`, form.value);
    } else {
      res = await api.post('/accounts', form.value);
    }
    if (res.success) {
      ElMessage.success(res.message || t('account.save_success'));
      showModal.value = false;
      fetchData();
    }
  } catch (err: any) {}
};

const deleteUser = async (id: number) => {
  try {
    await ElMessageBox.confirm(t('account.delete_confirm'), t('common.confirm'), {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    });
    const res: any = await api.delete(`/accounts/${id}`);
    if (res.success) {
      ElMessage.success(t('common.success'));
      fetchData();
    }
  } catch (err) {
    // User canceled
  }
};

onMounted(fetchData);
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
</style>
