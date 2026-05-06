<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Quản lý Tài khoản</h1>
      <button @click="openModal()" class="btn-primary">Thêm Tài khoản</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Giáo viên</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">{{ user.username }}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {{ user.role }}
              </span>
            </td>
            <td class="px-6 py-4">{{ user.teacherId || '-' }}</td>
            <td class="px-6 py-4">
              <span :class="user.isActive ? 'text-green-600' : 'text-red-600'">
                {{ user.isActive ? 'Đang hoạt động' : 'Đã khóa' }}
              </span>
            </td>
            <td class="px-6 py-4 space-x-2 text-sm">
              <button @click="openModal(user)" class="text-indigo-600 hover:text-indigo-900">Sửa</button>
              <button @click="deleteUser(user.id)" class="text-red-600 hover:text-red-900">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Drawer -->
    <Drawer :is-open="showModal" :title="form.id ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'" @close="showModal = false">
      <form @submit.prevent="saveUser" id="accountForm">
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Username</label>
            <input v-model="form.username" :disabled="!!form.id" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Mật khẩu {{ form.id ? '(Để trống nếu không đổi)' : '' }}</label>
            <input v-model="form.password" type="password" :required="!form.id" class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Vai trò</label>
            <select v-model="form.role" required class="input-field mt-1">
              <option value="ADMIN">Quản trị viên (Admin)</option>
              <option value="STAFF">Giáo vụ (Staff)</option>
              <option value="TEACHER">Giáo viên (Teacher)</option>
            </select>
          </div>
          <div v-if="form.role === 'TEACHER'">
            <label class="block text-sm font-medium text-gray-700">Chọn Giáo viên</label>
            <div class="relative mt-1">
              <input v-model="teacherSearch" placeholder="Tìm tên giáo viên..." class="input-field mb-2" />
              <select v-model="form.teacherId" required class="input-field">
                <option :value="null">-- Chọn giáo viên --</option>
                <option v-for="t in filteredTeachers" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.email }})
                </option>
              </select>
              <p v-if="filteredTeachers.length === 0 && teacherSearch" class="text-xs text-red-500 mt-1">Không tìm thấy giáo viên nào</p>
            </div>
          </div>
          <div class="flex items-center">
            <input v-model="form.active" type="checkbox" class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
            <label class="ml-2 block text-sm text-gray-900">Kích hoạt tài khoản</label>
          </div>
        </div>
      </form>
      <template #footer>
        <button type="button" @click="showModal = false" class="btn-secondary">Hủy</button>
        <button type="submit" form="accountForm" class="btn-primary">Lưu tài khoản</button>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/api/axios';
import Drawer from '@/components/Drawer.vue';
import { useToastStore } from '@/stores/toast';

const toastStore = useToastStore();
const users = ref<any[]>([]);
const teachers = ref<any[]>([]);
const teacherSearch = ref('');
const showModal = ref(false);
const form = ref<any>({ id: null, username: '', password: '', role: 'STAFF', teacherId: null, active: true });

const filteredTeachers = computed(() => {
  if (!teacherSearch.value) return teachers.value;
  const s = teacherSearch.value.toLowerCase();
  return teachers.value.filter(t => t.name.toLowerCase().includes(s) || t.email.toLowerCase().includes(s));
});

const fetchData = async () => {
  try {
    const [resU, resT]: any = await Promise.all([
      api.get('/accounts'),
      api.get('/teachers')
    ]);
    if (resU.success) users.value = resU.data;
    if (resT.success) teachers.value = resT.data;
  } catch (err) {}
};

const openModal = (user?: any) => {
  teacherSearch.value = '';
  if (user) {
    form.value = { ...user, password: '' };
  } else {
    form.value = { id: null, username: '', password: '', role: 'STAFF', teacherId: null, active: true };
  }
  showModal.value = true;
};

const saveUser = async () => {
  try {
    let res: any;
    if (form.value.id) {
      res = await api.put(`/accounts/${form.value.id}`, form.value);
    } else {
      res = await api.post('/accounts', form.value);
    }
    if (res.success) {
      toastStore.success(res.message || 'Lưu tài khoản thành công');
      showModal.value = false;
      fetchData();
    }
  } catch (err: any) {
    // Lỗi đã được xử lý bởi axios interceptor
  }
};

const deleteUser = async (id: number) => {
  if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
    try {
      const res: any = await api.delete(`/accounts/${id}`);
      if (res.success) {
        toastStore.success('Xóa tài khoản thành công');
        fetchData();
      }
    } catch (err) {}
  }
};

onMounted(fetchData);
</script>
