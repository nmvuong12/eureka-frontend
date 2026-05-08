<template>
  <el-config-provider :locale="elLocale">
    <router-view />
    <ToastContainer />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import vi from 'element-plus/es/locale/lang/vi';
import en from 'element-plus/es/locale/lang/en';
import ToastContainer from '@/components/ToastContainer.vue';

const { locale, messages } = useI18n();
console.log('I18N Messages:', messages.value[locale.value]);
const elLocale = computed(() => (locale.value === 'vi' ? vi : en));
</script>
