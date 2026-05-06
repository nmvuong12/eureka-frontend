<template>
  <div class="space-y-8">
    <!-- Rooms Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">Phòng học</h2>
        <button @click="openRoomModal()" class="btn-primary">Thêm Phòng</button>
      </div>
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên phòng</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sức chứa</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="r in rooms" :key="r.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ r.name }}</td>
              <td class="px-6 py-4">{{ r.capacity }}</td>
              <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="r.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ r.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Timeslots Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">Ca học</h2>
      </div>
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thứ</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bắt đầu</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết thúc</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhãn</th>
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
    <Drawer :is-open="showRoomModal" title="Thêm Phòng Học" @close="showRoomModal = false">
      <form @submit.prevent="saveRoom" id="roomForm" class="space-y-6">
        <div>
          <label class="block text-sm font-medium">Tên phòng</label>
          <input v-model="roomForm.name" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium">Sức chứa</label>
          <input v-model.number="roomForm.capacity" type="number" required class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium">Trạng thái</label>
          <select v-model="roomForm.status" class="input-field mt-1">
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Bảo trì</option>
          </select>
        </div>
      </form>
      <template #footer>
        <button type="button" @click="showRoomModal = false" class="btn-secondary">Hủy</button>
        <button type="submit" form="roomForm" class="btn-primary">Lưu phòng</button>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import type { Room, Timeslot } from '@/types';
import Drawer from '@/components/Drawer.vue';

const rooms = ref<Room[]>([]);
const timeslots = ref<Timeslot[]>([]);

const showRoomModal = ref(false);
const roomForm = ref<Room>({ name: '', capacity: 20, status: 'ACTIVE' });

const fetchData = async () => {
  const [resRooms, resTimeslots] = await Promise.all([
    api.get('/rooms'),
    api.get('/timeslots')
  ]);
  rooms.value = (resRooms as any).data;
  timeslots.value = (resTimeslots as any).data;
};

const openRoomModal = () => {
  roomForm.value = { name: '', capacity: 20, status: 'ACTIVE' };
  showRoomModal.value = true;
};

const saveRoom = async () => {
  try {
    const res: any = await api.post('/rooms', roomForm.value);
    if (res.success) {
      showRoomModal.value = false;
      fetchData();
    }
  } catch (err) { alert('Lỗi tạo phòng'); }
};

onMounted(fetchData);
</script>
