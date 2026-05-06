<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Quản lý Giáo viên</h1>
      <button @click="openModal()" class="btn-primary">Thêm Giáo viên</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỹ năng</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="teacher in teachers" :key="teacher.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="font-medium text-gray-900">{{ teacher.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ teacher.email }}</div>
              <div class="text-sm text-gray-500">{{ teacher.phone }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span v-for="skill in teacher.skills" :key="skill" class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {{ skill }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                    :class="teacher.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ teacher.status === 'ACTIVE' ? 'Hoạt động' : 'Đã nghỉ' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button @click="openModal(teacher)" class="text-indigo-600 hover:text-indigo-900 mr-4">Sửa</button>
              <button @click="deleteTeacher(teacher.id!)" class="text-red-600 hover:text-red-900">Xóa</button>
            </td>
          </tr>
          <tr v-if="teachers.length === 0">
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">Không có dữ liệu</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Drawer Form -->
    <Drawer :is-open="showModal" :title="currentTeacher.id ? 'Sửa Giáo viên' : 'Thêm Giáo viên mới'" @close="closeModal">
      <form @submit.prevent="saveTeacher" id="teacherForm">
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Họ tên *</label>
            <input v-model="currentTeacher.name" type="text" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email *</label>
            <input v-model="currentTeacher.email" type="email" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input v-model="currentTeacher.phone" type="text" class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Kỹ năng (Căn cứ bằng dấu phẩy)</label>
            <input v-model="skillString" type="text" class="input-field mt-1" placeholder="IELTS, TOEIC, GIAO_TIEP" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Trạng thái</label>
            <select v-model="currentTeacher.status" class="input-field mt-1">
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Đã nghỉ</option>
            </select>
          </div>
        </div>
      </form>
      <template #footer>
        <button type="button" @click="closeModal" class="btn-secondary">Hủy</button>
        <button type="submit" form="teacherForm" class="btn-primary">Lưu thay đổi</button>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { Teacher } from '@/types';
import Drawer from '@/components/Drawer.vue';

const teachers = ref<Teacher[]>([]);
const showModal = ref(false);
const currentTeacher = ref<Teacher>({ name: '', email: '', phone: '', status: 'ACTIVE', skills: [] });
const skillString = ref('');

const fetchTeachers = async () => {
  try {
    const res: any = await api.get('/teachers');
    if (res.success) teachers.value = res.data;
  } catch (err) {
    alert('Lỗi tải danh sách giáo viên');
  }
};

const openModal = (teacher?: Teacher) => {
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
      closeModal();
      fetchTeachers();
    } else {
      alert(res.message);
    }
  } catch (err: any) {
    alert(err.message || 'Lỗi lưu thông tin');
  }
};

const deleteTeacher = async (id: number) => {
  if (confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
    try {
      const res: any = await api.delete(`/teachers/${id}`);
      if (res.success) fetchTeachers();
    } catch (err) {
      alert('Lỗi xóa giáo viên');
    }
  }
};

onMounted(() => {
  fetchTeachers();
});
</script>
