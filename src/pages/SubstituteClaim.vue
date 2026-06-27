<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <el-card class="max-w-md w-full border border-gray-100 rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl overflow-hidden relative" :body-style="{ padding: '32px' }">
      <!-- Decorative background blur -->
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
      <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-12 space-y-4" v-loading="true">
        <p class="text-sm text-gray-500">{{ $t('substitute.checking') }}</p>
      </div>

      <!-- Result States (Success / Already Claimed / Expired) -->
      <div v-else-if="claimSuccess" class="text-center py-6 space-y-6">
        <el-result
          icon="success"
          :title="$t('substitute.success_title')"
          :sub-title="$t('substitute.success_subtitle')"
        >
          <template #extra>
            <div class="space-y-4">
              <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-sm text-emerald-800 font-semibold">
                {{ $t('substitute.info_label', { class: offer?.classCode, slot: offer?.timeslotLabel, date: formatDate(offer?.sessionDate) }) }}
              </div>
              <el-button type="success" @click="goToDashboard" class="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 w-full rounded-xl">
                {{ $t('substitute.back_home') }}
              </el-button>
            </div>
          </template>
        </el-result>
      </div>

      <div v-else-if="offer && offer.status !== 'PENDING'" class="text-center py-6 space-y-4">
        <el-result
          icon="warning"
          :title="$t('substitute.claimed_title')"
          :sub-title="$t('substitute.claimed_subtitle')"
        >
          <template #extra>
            <p class="text-xs text-gray-400 mb-4">{{ $t('substitute.claimed_thanks') }}</p>
            <el-button @click="goToDashboard" class="w-full rounded-xl">{{ $t('substitute.back_home') }}</el-button>
          </template>
        </el-result>
      </div>

      <!-- Active Claim Offer Form -->
      <div v-else-if="offer" class="space-y-6">
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 mb-2">
            <el-icon :size="28"><Clock /></el-icon>
          </div>
          <h2 class="text-xl font-black text-gray-900">{{ $t('substitute.confirm_title') }}</h2>
          <p class="text-xs text-gray-500">{{ $t('substitute.confirm_subtitle') }}</p>
        </div>

        <div class="border-t border-b border-gray-100 py-4 space-y-3.5 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">{{ $t('substitute.class') }}</span>
            <span class="font-bold text-gray-800">{{ offer.classCode }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">{{ $t('substitute.lesson') }}</span>
            <span class="font-bold text-gray-800">{{ $t('substitute.lesson_index', { index: offer.lessonIndex }) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">{{ $t('substitute.date') }}</span>
            <span class="font-bold text-gray-800 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{{ formatDate(offer.sessionDate) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">{{ $t('substitute.timeslot') }}</span>
            <span class="font-bold text-gray-800">{{ offer.timeslotLabel }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">{{ $t('substitute.skill') }}</span>
            <el-tag size="small" type="danger" effect="plain" class="font-bold rounded">{{ offer.requiredSkill }}</el-tag>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">{{ $t('substitute.original_teacher') }}</span>
            <span class="text-gray-600 font-medium">{{ offer.originalTeacherName }}</span>
          </div>
        </div>

        <el-alert
          :title="$t('substitute.help_text')"
          type="info"
          :closable="false"
          class="rounded-xl border border-blue-100"
        />

        <div class="space-y-3 pt-2">
          <el-button
            type="success"
            @click="claimOffer"
            :loading="claiming"
            class="w-full !py-6 !bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 !border-0 text-base font-bold shadow-lg shadow-emerald-500/20 transition-all duration-300 rounded-xl"
          >
            {{ $t('substitute.accept_btn') }}
          </el-button>
          <el-button @click="goToDashboard" class="w-full !py-6 rounded-xl hover:text-gray-700">
            {{ $t('substitute.reject_btn') }}
          </el-button>
        </div>
      </div>

      <!-- Error / Not Found States -->
      <div v-else class="text-center py-6 space-y-4">
        <el-result
          icon="error"
          :title="$t('substitute.not_found_title')"
          :sub-title="$t('substitute.not_found_subtitle')"
        >
          <template #extra>
            <el-button @click="goToDashboard" class="w-full rounded-xl">{{ $t('substitute.back_home') }}</el-button>
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/axios';
import { Clock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const claiming = ref(false);
const claimSuccess = ref(false);
const offer = ref<any>(null);

const token = ref<string>((route.query.token as string) || '');

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN');
};

const fetchOfferDetails = async () => {
  if (!token.value) {
    loading.value = false;
    return;
  }
  try {
    const res: any = await api.get('/timetable/substitute/offer', {
      params: { token: token.value }
    });
    if (res.success) {
      offer.value = res.data;
    }
  } catch (err: any) {
    console.error('Lỗi khi tải thông tin dạy thay:', err);
  } finally {
    loading.value = false;
  }
};

const claimOffer = async () => {
  claiming.value = true;
  try {
    const res: any = await api.post(`/timetable/substitute/claim?token=${token.value}`);
    if (res.success) {
      claimSuccess.value = true;
      ElMessage.success(t('common.success'));
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('common.error'));
  } finally {
    claiming.value = false;
  }
};

const goToDashboard = () => {
  router.push('/');
};

onMounted(fetchOfferDetails);
</script>

<style scoped>
:deep(.el-result) {
  padding: 0;
}
</style>
