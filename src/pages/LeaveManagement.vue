<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('leave.title') }}</h1>
      <button v-if="authStore.isTeacher" @click="openModal()" class="btn-primary">{{ $t('leave.create') }}</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('teacher.id') }}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('leave.from') }}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('leave.to') }}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('leave.reason') }}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('common.status') }}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="req in requests" :key="req.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">{{ req.teacherId }}</td>
            <td class="px-6 py-4">{{ req.fromDate }}</td>
            <td class="px-6 py-4">{{ req.toDate }}</td>
            <td class="px-6 py-4">{{ req.reason }}</td>
            <td class="px-6 py-4">
              <span
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="{
                  'bg-yellow-100 text-yellow-800': req.status === 'PENDING',
                  'bg-green-100 text-green-800': req.status === 'APPROVED',
                  'bg-red-100 text-red-800': req.status === 'REJECTED'
                }"
              >
                {{ req.status }}
              </span>
            </td>
            <td class="px-6 py-4 space-x-2 flex items-center">
              <button @click="openModal(req, true)" class="text-emerald-600 hover:text-emerald-900 font-medium">{{ $t('common.view') }}</button>
              <template v-if="authStore.isAdmin || !authStore.isTeacher">
                <button v-if="req.status === 'PENDING'" @click="approve(req.id!)" class="text-emerald-600 hover:text-emerald-900 font-medium">{{ $t('leave.approve') }}</button>
                <button v-if="req.status === 'PENDING'" @click="reject(req.id!)" class="text-red-600 hover:text-red-900 font-medium">{{ $t('leave.reject') }}</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Drawer Form -->
    <Drawer
      :is-open="showModal"
      :title="isViewOnly ? $t('leave.view_detail') : (formId ? $t('common.edit') : $t('leave.create'))"
      @close="showModal = false"
    >
      <form @submit.prevent="submitRequest" id="leaveForm" class="space-y-6">
        <fieldset :disabled="isViewOnly" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">{{ $t('leave.from') }}</label>
            <input v-model="form.fromDate" type="date" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">{{ $t('leave.to') }}</label>
            <input v-model="form.toDate" type="date" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">{{ $t('leave.reason') }}</label>
            <textarea v-model="form.reason" required class="input-field mt-1" rows="4"></textarea>
          </div>
        </fieldset>
      </form>
      <template #footer>
        <template v-if="isViewOnly">
          <button v-if="formId && currentStatus === 'PENDING'" type="button" @click="isViewOnly = false" class="btn-primary">{{ $t('common.edit') }}</button>
        </template>
        <template v-else>
          <button type="button" @click="showModal = false" class="btn-secondary">{{ $t('common.cancel') }}</button>
          <button type="submit" form="leaveForm" class="btn-primary">{{ formId ? $t('common.save') : $t('leave.create') }}</button>
        </template>
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
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const requests = ref<LeaveRequest[]>([]);
const showModal = ref(false);
const isViewOnly = ref(false);
const formId = ref<number | null>(null);
const currentStatus = ref<string | null>(null);
const form = ref({ fromDate: '', toDate: '', reason: '' });

const fetchRequests = async () => {
  try {
    const endpoint = authStore.isTeacher ? '/leave-requests/my-requests' : '/leave-requests';
    const res: any = await api.get(endpoint);
    if (res.success) requests.value = res.data;
  } catch (err) {}
};

const openModal = (req?: LeaveRequest, viewOnly: boolean = false) => {
  isViewOnly.value = viewOnly;
  if (req) {
    formId.value = req.id || null;
    currentStatus.value = req.status || null;
    form.value = { fromDate: req.fromDate, toDate: req.toDate, reason: req.reason };
  } else {
    formId.value = null;
    currentStatus.value = null;
    form.value = { fromDate: '', toDate: '', reason: '' };
  }
  showModal.value = true;
};

const submitRequest = async () => {
  try {
    let res: any;
    if (formId.value) {
      res = await api.put(`/leave-requests/${formId.value}`, form.value);
    } else {
      res = await api.post('/leave-requests', form.value);
    }
    if (res.success) {
      showModal.value = false;
      fetchRequests();
      alert(t('leave.success'));
    }
  } catch (err: any) { alert(err.message || t('common.error')); }
};

const approve = async (id: number) => {
  if (confirm(t('leave.confirm_approve'))) {
    try {
      const res: any = await api.put(`/leave-requests/${id}/approve`);
      if (res.success) fetchRequests();
    } catch (err) { alert(t('common.error')); }
  }
};

const reject = async (id: number) => {
  try {
    const res: any = await api.put(`/leave-requests/${id}/reject`);
    if (res.success) fetchRequests();
  } catch (err) { alert(t('common.error')); }
};

onMounted(fetchRequests);
</script>
