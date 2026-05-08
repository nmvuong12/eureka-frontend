<template>
  <div class="account-management">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('account.title') }}</h1>
      <el-button type="primary" @click="openModal()">
        <el-icon class="mr-1"><Plus /></el-icon>
        {{ $t('common.add') }} {{ $t('menu.accounts') }}
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
      <el-row :gutter="20" class="mb-4">
        <el-col :span="8">
          <div class="mb-2 text-sm font-medium text-gray-700">{{ $t('account.username') }}</div>
          <el-input v-model="searchFilters.username" :placeholder="$t('common.placeholder_input')" clearable />
        </el-col>
        <el-col :span="8">
          <div class="mb-2 text-sm font-medium text-gray-700">{{ $t('account.role') }}</div>
          <el-select v-model="searchFilters.role" :placeholder="$t('common.placeholder_select')" clearable class="w-full">
            <el-option :label="$t('account.admin')" value="ADMIN" />
            <el-option :label="$t('account.staff')" value="STAFF" />
            <el-option :label="$t('account.teacher_role')" value="TEACHER" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <div class="mb-2 text-sm font-medium text-gray-700">{{ $t('common.status') }}</div>
          <el-select v-model="searchFilters.isActive" :placeholder="$t('common.placeholder_select')" clearable class="w-full">
            <el-option :label="$t('common.active')" value="true" />
            <el-option :label="$t('common.inactive')" value="false" />
          </el-select>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="mb-2 text-sm font-medium text-gray-700">{{ $t('account.full_name') }}</div>
          <el-input v-model="searchFilters.fullName" :placeholder="$t('common.placeholder_input')" clearable />
        </el-col>
        <el-col :span="12">
          <div class="mb-2 text-sm font-medium text-gray-700">{{ $t('account.email') }}</div>
          <el-input v-model="searchFilters.email" :placeholder="$t('common.placeholder_input')" clearable />
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="sm" class="mb-6" :body-style="{ padding: '0px' }">
      <el-table :data="users" style="width: 100%" stripe>
        <el-table-column prop="username" :label="$t('account.username')" min-width="140" />
        <el-table-column prop="role" :label="$t('account.role')" min-width="130">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'warning' : row.role === 'STAFF' ? 'info' : 'success'">
              {{ row.role === 'ADMIN' ? $t('account.admin') : row.role === 'STAFF' ? $t('account.staff') : $t('account.teacher_role') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('account.full_name')" min-width="160">
          <template #default="{ row }">
            <span class="font-medium text-gray-800">{{ row.fullName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('account.dob')" min-width="130">
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.dob ? formatDate(row.dob) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('account.email')" min-width="200">
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.email || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" effect="dark">
              {{ row.isActive ? $t('common.active') : $t('common.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="info" link @click="openModal(row, true)">
              <el-icon><View /></el-icon>
            </el-button>
            <el-button type="danger" link @click="deleteUser(row.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.no_data')" />
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

    <!-- Drawer -->
    <el-drawer
      v-model="showModal"
      :title="isViewOnly ? $t('account.view_detail') : (form.id ? $t('account.update') : $t('account.create'))"
      size="50%"
    >
      <el-form :model="form" label-position="top" :disabled="isViewOnly">
        <el-form-item :label="$t('account.username')" required>
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        
        <el-form-item :label="$t('account.password')" :required="!form.id">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>

        <el-form-item v-if="!form.id || form.password" :label="$t('account.confirm_password')" :required="!form.id || !!form.password">
          <el-input v-model="form.confirmPassword" type="password" show-password />
        </el-form-item>
        
        <el-form-item :label="$t('account.role')" required>
          <el-select v-model="form.role" class="w-full">
            <el-option :label="$t('account.admin')" value="ADMIN" />
            <el-option :label="$t('account.staff')" value="STAFF" />
            <el-option :label="$t('account.teacher_role')" value="TEACHER" />
          </el-select>
        </el-form-item>

        <template v-if="form.role === 'ADMIN' || form.role === 'STAFF'">
          <el-form-item :label="$t('account.full_name')" required>
            <el-input v-model="form.fullName" :placeholder="$t('common.placeholder_input')" />
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('account.gender')">
                <el-select v-model="form.gender" class="w-full">
                  <el-option :label="$t('account.male')" value="Nam" />
                  <el-option :label="$t('account.female')" value="Nữ" />
                  <el-option :label="$t('account.other')" value="Khác" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('account.dob')">
                <el-date-picker v-model="form.dob" type="date" class="w-full" :placeholder="$t('common.placeholder_select')" format="DD/MM/YYYY" value-format="YYYY-MM-DD" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('account.phone')">
            <el-input v-model="form.phone" />
          </el-form-item>

          <el-form-item :label="$t('account.email')">
            <el-input v-model="form.email" />
          </el-form-item>

          <el-form-item :label="$t('account.address')">
            <el-input v-model="form.address" type="textarea" :rows="2" />
          </el-form-item>
        </template>
        
        <el-form-item v-if="form.role === 'TEACHER'" :label="$t('account.teacher')" required>
          <el-select
            v-model="form.teacherId"
            filterable
            :placeholder="$t('common.placeholder_input')"
            class="w-full"
          >
            <el-option
              v-for="t in teachers"
              :key="t.id"
              :label="`${t.name} (${t.email})`"
              :value="t.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="form.active">{{ $t('account.active_account') }}</el-checkbox>
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
            <el-button @click="showModal = false">{{ $t('common.cancel') }}</el-button>
            <el-button type="primary" @click="saveUser">{{ $t('common.save') }}</el-button>
          </template>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '@/api/axios';
import { useToastStore } from '@/stores/toast';
import { Plus, Search, Edit, Delete, View } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
};

const toastStore = useToastStore();
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
      // Assuming teachers API also returns a page response now, we need to extract content
      teachers.value = resT.data.content || resT.data;
    }
  } catch (err) {}
};

watch([currentPage, itemsPerPage], () => {
  fetchData();
});

// Debounce search input for server side filtering
let timeoutId: any;
watch(searchFilters, () => {
  currentPage.value = 1;
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => fetchData(), 500);
}, { deep: true });

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
    ElMessage.error('Vui lòng chọn giáo viên');
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
      ElMessage.success(res.message || 'Lưu tài khoản thành công');
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
