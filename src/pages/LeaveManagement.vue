<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Đơn xin nghỉ</h1>
      <button v-if="authStore.isTeacher" @click="showModal = true" class="btn-primary">Nộp đơn mới</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã giáo viên</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Từ ngày</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đến ngày</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            <th v-if="authStore.isAdmin || !authStore.isTeacher" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="req in requests" :key="req.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">{{ req.teacherId }}</td>
            <td class="px-6 py-4">{{ req.fromDate }}</td>
            <td class="px-6 py-4">{{ req.toDate }}</td>
            <td class="px-6 py-4">{{ req.reason }}</td>
            <td class="px-6 py-4">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="{
                      'bg-yellow-100 text-yellow-800': req.status === 'PENDING',
                      'bg-green-100 text-green-800': req.status === 'APPROVED',
                      'bg-red-100 text-red-800': req.status === 'REJECTED'
                    }">
                {{ req.status }}
              </span>
            </td>
            <td v-if="authStore.isAdmin || !authStore.isTeacher" class="px-6 py-4 space-x-2">
              <button v-if="req.status === 'PENDING'" @click="approve(req.id!)" class="text-green-600 hover:text-green-900 font-medium">Duyệt</button>
              <button v-if="req.status === 'PENDING'" @click="reject(req.id!)" class="text-red-600 hover:text-red-900 font-medium">Từ chối</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Drawer Form for Teacher -->
    <Drawer :is-open="showModal" title="Nộp Đơn Xin Nghỉ" @close="showModal = false">
      <form @submit.prevent="submitRequest" id="leaveForm" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700">Từ ngày</label>
          <input v-model="form.fromDate" type="date" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Đến ngày</label>
          <input v-model="form.toDate" type="date" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Lý do nghỉ</label>
          <textarea v-model="form.reason" required class="input-field mt-1" rows="4" placeholder="VD: Nghỉ ốm, việc gia đình..."></textarea>
        </div>
      </form>
      <template #footer>
        <button type="button" @click="showModal = false" class="btn-secondary">Hủy</button>
        <button type="submit" form="leaveForm" class="btn-primary">Gửi đơn xin nghỉ</button>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import type { LeaveRequest } from '@/types';
import Drawer from '@/components/Drawer.vue';

const authStore = useAuthStore();
const requests = ref<LeaveRequest[]>([]);
const showModal = ref(false);
const form = ref({ fromDate: '', toDate: '', reason: '' });

const fetchRequests = async () => {
  try {
    const endpoint = authStore.isTeacher ? '/leave-requests/my-requests' : '/leave-requests';
    const res: any = await api.get(endpoint);
    if (res.success) requests.value = res.data;
  } catch (err) {}
};

const submitRequest = async () => {
  try {
    const res: any = await api.post('/leave-requests', form.value);
    if (res.success) {
      showModal.value = false;
      fetchRequests();
      alert('Nộp đơn thành công');
    }
  } catch (err: any) { alert(err.message || 'Lỗi nộp đơn'); }
};

const approve = async (id: number) => {
  if (confirm('Phê duyệt đơn này sẽ xóa lịch dạy của giáo viên. Tiếp tục?')) {
    try {
      const res: any = await api.put(`/leave-requests/${id}/approve`);
      if (res.success) fetchRequests();
    } catch (err) { alert('Lỗi xử lý'); }
  }
};

const reject = async (id: number) => {
  try {
    const res: any = await api.put(`/leave-requests/${id}/reject`);
    if (res.success) fetchRequests();
  } catch (err) { alert('Lỗi xử lý'); }
};

onMounted(fetchRequests);
</script>
