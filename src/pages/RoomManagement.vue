<template>
  <div class="space-y-8">
    <!-- Rooms Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">{{ $t('room.title') }}</h2>
        <button @click="openRoomModal()" class="btn-primary">{{ $t('room.create') }}</button>
      </div>
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('room.name') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('room.capacity') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('common.status') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="r in rooms" :key="r.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ r.name }}</td>
              <td class="px-6 py-4">{{ r.capacity }}</td>
              <td class="px-6 py-4">
                <span :class="r.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'" class="font-medium">
                  {{ r.status === 'ACTIVE' ? $t('room.status_active') : $t('room.status_inactive') }}
                </span>
              </td>
              <td class="px-6 py-4 space-x-2">
                <button @click="openRoomModal(r, true)" class="text-emerald-600 hover:text-emerald-900 font-medium">{{ $t('common.view') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Timeslots Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">{{ $t('timeslot.title') }}</h2>
      </div>
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('timeslot.day') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('timeslot.start') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('timeslot.end') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ $t('timeslot.label') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="ts in timeslots" :key="ts.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">{{ ts.dayOfWeek }}</td>
              <td class="px-6 py-4">{{ ts.startTime }}</td>
              <td class="px-6 py-4">{{ ts.endTime }}</td>
              <td class="px-6 py-4">{{ ts.label }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Room Drawer -->
    <Drawer
      :is-open="showRoomModal"
      :title="isViewOnly ? $t('room.view_detail') : (roomForm.id ? $t('common.edit') : $t('room.create'))"
      @close="showRoomModal = false"
    >
      <form @submit.prevent="saveRoom" id="roomForm" class="space-y-6">
        <fieldset :disabled="isViewOnly" class="space-y-6">
          <div>
            <label class="block text-sm font-medium">{{ $t('room.name') }}</label>
            <input v-model="roomForm.name" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium">{{ $t('room.capacity') }}</label>
            <input v-model.number="roomForm.capacity" type="number" required class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium">{{ $t('common.status') }}</label>
            <select v-model="roomForm.status" class="input-field mt-1">
              <option value="ACTIVE">{{ $t('room.status_active') }}</option>
              <option value="INACTIVE">{{ $t('room.status_inactive') }}</option>
            </select>
          </div>
        </fieldset>
      </form>
      <template #footer>
        <template v-if="isViewOnly">
          <button type="button" @click="isViewOnly = false" class="btn-primary">{{ $t('common.edit') }}</button>
        </template>
        <template v-else>
          <button type="button" @click="showRoomModal = false" class="btn-secondary">{{ $t('common.cancel') }}</button>
          <button type="submit" form="roomForm" class="btn-primary">{{ $t('common.save') }}</button>
        </template>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { Room, Timeslot } from '@/types';
import Drawer from '@/components/Drawer.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const rooms = ref<Room[]>([]);
const timeslots = ref<Timeslot[]>([]);

const showRoomModal = ref(false);
const isViewOnly = ref(false);
const roomForm = ref<Room>({ name: '', capacity: 20, status: 'ACTIVE' });

const fetchData = async () => {
  const [resRooms, resTimeslots] = await Promise.all([
    api.get('/rooms'),
    api.get('/timeslots')
  ]);
  rooms.value = (resRooms as any).data;
  timeslots.value = (resTimeslots as any).data;
};

const openRoomModal = (room?: Room, viewOnly: boolean = false) => {
  isViewOnly.value = viewOnly;
  if (room) {
    roomForm.value = { ...room };
  } else {
    roomForm.value = { name: '', capacity: 20, status: 'ACTIVE' };
  }
  showRoomModal.value = true;
};

const saveRoom = async () => {
  try {
    const res: any = await api.post('/rooms', roomForm.value);
    if (res.success) {
      showRoomModal.value = false;
      fetchData();
    }
  } catch (err) { alert(t('common.error')); }
};

onMounted(fetchData);
</script>
