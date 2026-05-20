<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="pb-4 border-b border-gray-100">
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
        <span class="bg-gradient-to-b from-emerald-500 to-teal-600 w-2.5 h-8 rounded-full"></span>
        {{ $t('skill.title') }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">Quản lý danh mục kỹ năng chuyên môn dùng để phân công và tìm kiếm giáo viên phù hợp.</p>
    </div>

    <!-- Toolbar -->
    <div class="flex justify-between items-center">
      <el-card shadow="never" class="border border-gray-100 rounded-xl flex-1 mr-4" :body-style="{ padding: '12px 16px' }">
        <div class="flex items-center gap-3">
          <el-input
            v-model="searchQuery"
            :placeholder="$t('common.placeholder_input')"
            class="max-w-sm"
            clearable
            @keyup.enter="handleSearch"
            @clear="resetSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
            {{ $t('common.search') }}
          </el-button>
          <el-button @click="resetSearch">{{ $t('common.reset') }}</el-button>
        </div>
      </el-card>
      <el-button
        type="primary"
        @click="openModal()"
        class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md"
      >
        <el-icon class="mr-1"><Plus /></el-icon>
        {{ $t('common.add') }} {{ $t('menu.skills') }}
      </el-button>
    </div>

    <!-- Table Card -->
    <el-card shadow="sm" class="border border-gray-100 rounded-2xl overflow-hidden" :body-style="{ padding: '0' }">
      <el-table :data="skills" style="width: 100%" stripe class="premium-table" v-loading="loading">
        <el-table-column prop="skillCode" :label="$t('skill.code')" width="180">
          <template #default="{ row }">
            <span class="font-bold text-emerald-700">{{ row.skillCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="skillName" :label="$t('skill.name')" min-width="200">
          <template #default="{ row }">
            <span class="font-semibold text-gray-800">{{ row.skillName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="$t('skill.description')" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-gray-500 text-sm">{{ row.description || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-tooltip content="Xem chi tiết" placement="top">
                <el-button type="info" link @click="openModal(row, true)" class="hover:!text-blue-600">
                  <el-icon :size="16"><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Xóa kỹ năng" placement="top">
                <el-button type="danger" link @click="handleDelete(row.id)" class="hover:!text-red-600">
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

      <div class="flex justify-end p-4 border-t border-gray-100 bg-gray-50">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[15, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalElements"
          @size-change="fetchSkills"
          @current-change="fetchSkills"
        />
      </div>
    </el-card>

    <!-- Drawer Form -->
    <el-drawer
      v-model="showDrawer"
      :title="isViewOnly ? $t('skill.view_detail') : (form.id ? $t('skill.update') : $t('skill.create'))"
      size="450px"
      class="premium-drawer"
      custom-class="premium-drawer"
    >
      <el-form :model="form" label-position="top" :disabled="isViewOnly" class="px-2">
        <el-form-item :label="$t('skill.code')" required>
          <el-input
            v-model="form.skillCode"
            :disabled="!!form.id"
            placeholder="VD: IELTS, TOEIC, SPEAKING..."
          />
        </el-form-item>
        <el-form-item :label="$t('skill.name')" required>
          <el-input
            v-model="form.skillName"
            placeholder="VD: IELTS 7.5+, TOEIC 900..."
          />
        </el-form-item>
        <el-form-item :label="$t('skill.description')">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="Mô tả chi tiết về kỹ năng này..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2 p-4 border-t border-gray-100">
          <template v-if="isViewOnly">
            <el-button
              type="primary"
              @click="isViewOnly = false"
              class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
            >
              <el-icon class="mr-1"><Edit /></el-icon>
              {{ $t('common.edit') }}
            </el-button>
          </template>
          <template v-else>
            <el-button @click="showDrawer = false">{{ $t('common.cancel') }}</el-button>
            <el-button
              type="primary"
              @click="handleSave"
              :loading="saving"
              class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
            >
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
import { Plus, Search, View, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const loading = ref(false);
const saving = ref(false);
const skills = ref<any[]>([]);
const totalElements = ref(0);
const currentPage = ref(1);
const pageSize = ref(15);
const searchQuery = ref('');

const showDrawer = ref(false);
const isViewOnly = ref(false);
const form = ref<any>({
  id: null,
  skillCode: '',
  skillName: '',
  description: ''
});

/** Tải danh sách kỹ năng có phân trang và tìm kiếm */
const fetchSkills = async () => {
  loading.value = true;
  try {
    const res: any = await api.get('/skills', {
      params: {
        query: searchQuery.value,
        page: currentPage.value,
        size: pageSize.value
      }
    });
    if (res.success) {
      skills.value = res.data.content;
      totalElements.value = res.data.totalElements;
    }
  } catch (err) {
    ElMessage.error(t('common.error'));
  } finally {
    loading.value = false;
  }
};

/** Tìm kiếm kỹ năng theo từ khóa */
const handleSearch = () => {
  currentPage.value = 1;
  fetchSkills();
};

/** Xóa điều kiện tìm kiếm và tải lại dữ liệu */
const resetSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  fetchSkills();
};

/** Mở drawer thêm mới hoặc xem chi tiết kỹ năng */
const openModal = (skill?: any, viewOnly = false) => {
  isViewOnly.value = viewOnly;
  if (skill) {
    form.value = { ...skill };
  } else {
    form.value = { id: null, skillCode: '', skillName: '', description: '' };
  }
  showDrawer.value = true;
};

/** Lưu thông tin kỹ năng mới hoặc cập nhật */
const handleSave = async () => {
  if (!form.value.skillCode || !form.value.skillName) {
    ElMessage.warning(t('common.required') || 'Vui lòng điền đầy đủ thông tin bắt buộc');
    return;
  }
  saving.value = true;
  try {
    let res: any;
    if (form.value.id) {
      res = await api.put(`/skills/${form.value.id}`, form.value);
    } else {
      res = await api.post('/skills', form.value);
    }
    if (res.success) {
      ElMessage.success(res.message || t('common.success'));
      showDrawer.value = false;
      fetchSkills();
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('common.error'));
  } finally {
    saving.value = false;
  }
};

/** Xóa kỹ năng với yêu cầu xác nhận */
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      t('skill.delete_confirm') || 'Bạn có chắc chắn muốn xóa kỹ năng này?',
      t('common.confirm') || 'Xác nhận xóa',
      {
        type: 'warning',
        confirmButtonText: t('common.delete') || 'Xóa',
        cancelButtonText: t('common.cancel') || 'Hủy'
      }
    );
    const res: any = await api.delete(`/skills/${id}`);
    if (res.success) {
      ElMessage.success(res.message || 'Đã xóa kỹ năng thành công');
      fetchSkills();
    }
  } catch {
    // Người dùng hủy - không làm gì
  }
};

onMounted(fetchSkills);
</script>

<style scoped>
.premium-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  border-radius: 0;
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
</style>
