<template>
  <el-container class="h-screen bg-gray-50">
    <!-- Sidebar -->
    <el-aside :width="isCollapsed ? '64px' : '260px'" class="bg-white shadow-xl transition-all duration-300 flex flex-col z-20">
      <div class="h-16 flex items-center justify-center border-b border-gray-100 bg-green-gradient">
        <h1 v-if="!isCollapsed" class="text-xl font-bold text-white truncate transition-opacity duration-300">
          Eureka Center
        </h1>
        <div v-else class="text-xl font-bold text-white">E</div>
      </div>

      <el-menu
        :default-active="route.path"
        class="flex-1 border-r-0 overflow-y-auto scrollbar-thin el-menu-vertical"
        :collapse="isCollapsed"
        router
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>{{ $t('menu.dashboard') }}</template>
        </el-menu-item>

        <template v-if="authStore.isAdmin">
          <el-menu-item index="/accounts">
            <el-icon><User /></el-icon>
            <template #title>{{ $t('menu.accounts') }}</template>
          </el-menu-item>
        </template>

        <template v-if="authStore.isAdmin || !authStore.isTeacher">
          <el-menu-item index="/teachers">
            <el-icon><Avatar /></el-icon>
            <template #title>{{ $t('menu.teachers') }}</template>
          </el-menu-item>
          <el-menu-item index="/courses">
            <el-icon><Reading /></el-icon>
            <template #title>{{ $t('menu.courses') }}</template>
          </el-menu-item>
          <el-menu-item index="/rooms">
            <el-icon><Location /></el-icon>
            <template #title>{{ $t('menu.rooms') }}</template>
          </el-menu-item>
          <el-menu-item index="/skills">
            <el-icon><Reading /></el-icon>
            <template #title>{{ $t('menu.skills') }}</template>
          </el-menu-item>
        </template>

        <el-menu-item index="/timetable">
          <el-icon><Calendar /></el-icon>
          <template #title>{{ $t('menu.timetable') }}</template>
        </el-menu-item>

        <el-menu-item index="/leave">
          <el-icon><Document /></el-icon>
          <template #title>{{ $t('menu.leaves') }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- Main Wrapper -->
    <el-container class="flex-col min-w-0 overflow-hidden bg-gray-50">
      <!-- Top Header -->
      <el-header class="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
        <div class="flex items-center gap-4">
          <el-button text @click="toggleSidebar" class="!p-2 -ml-2 text-gray-500 hover:bg-gray-100">
            <el-icon :size="24"><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
          </el-button>
          
          <!-- Breadcrumbs -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(matched, index) in route.matched" :key="matched.path" :to="index < route.matched.length - 1 ? { path: matched.path } : undefined">
              {{ matched.name || 'Home' }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="flex items-center gap-4">
            <el-badge is-dot class="mt-1 mr-4">
              <el-icon :size="24" class="text-gray-400 hover:text-primary-600 cursor-pointer"><Bell /></el-icon>
            </el-badge>

            <el-dropdown @command="changeLanguage" trigger="click">
              <span class="el-dropdown-link cursor-pointer flex items-center gap-1 text-gray-600 hover:text-primary-600">
                <el-icon :size="20"><Refresh /></el-icon>
                {{ locale === 'vi' ? 'Tiếng Việt' : 'English' }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="vi">🇻🇳 Tiếng Việt</el-dropdown-item>
                  <el-dropdown-item command="en">🇬🇧 English</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-dropdown @command="handleProfileCommand" trigger="click">
              <span class="el-dropdown-link cursor-pointer flex items-center gap-2 text-gray-600 hover:text-emerald-600 ml-2">
                <el-avatar class="bg-green-gradient text-white font-bold" :size="32">
                  {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="text-sm font-medium">{{ authStore.user?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon> {{ $t('profile.title') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="password">
                    <el-icon><Lock /></el-icon> {{ $t('profile.change_password') }}
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon> {{ $t('common.logout') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
        </div>
      </el-header>

      <!-- Profile Info Drawer -->
      <el-drawer v-model="showProfileDrawer" :title="$t('profile.title')" size="400px">
        <div v-if="currentUser" class="space-y-6">
          <div class="flex flex-col items-center pb-6 border-b border-gray-100">
            <el-avatar :size="80" class="bg-green-gradient text-white text-2xl font-bold mb-3 shadow-lg">
              {{ currentUser.username?.charAt(0).toUpperCase() }}
            </el-avatar>
            <h3 class="text-lg font-bold">{{ currentUser.fullName || currentUser.username }}</h3>
            <el-tag size="small" type="success" class="mt-1 bg-emerald-100 text-emerald-800 border-emerald-200">{{ currentUser.role }}</el-tag>
          </div>
          
          <div class="space-y-4 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">{{ $t('account.username') }}:</span>
              <span class="font-medium">{{ currentUser.username }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ $t('account.email') }}:</span>
              <span class="font-medium">{{ currentUser.email || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ $t('account.phone') }}:</span>
              <span class="font-medium">{{ currentUser.phone || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ $t('account.dob') }}:</span>
              <span class="font-medium">{{ currentUser.dob || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ $t('account.address') }}:</span>
              <span class="font-medium">{{ currentUser.address || '-' }}</span>
            </div>
          </div>
        </div>
      </el-drawer>

      <!-- Change Password Drawer -->
      <el-drawer v-model="showPasswordDrawer" :title="$t('profile.change_password')" size="400px">
        <el-form :model="passwordForm" label-position="top" @submit.prevent="handleChangePassword">
          <el-form-item :label="$t('profile.old_password')" required>
            <el-input v-model="passwordForm.oldPassword" type="password" show-password />
          </el-form-item>
          <el-form-item :label="$t('profile.new_password')" required>
            <el-input v-model="passwordForm.newPassword" type="password" show-password />
          </el-form-item>
          <el-form-item :label="$t('profile.confirm_new_password')" required>
            <el-input v-model="passwordForm.confirmNewPassword" type="password" show-password />
          </el-form-item>
          <div class="mt-8">
            <el-button type="primary" native-type="submit" class="w-full" :loading="passwordLoading">
              {{ $t('profile.change_password') }}
            </el-button>
          </div>
        </el-form>
      </el-drawer>

      <!-- Main Content -->
      <el-main class="overflow-auto p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { 
  HomeFilled, User, Avatar, Reading, Location, Calendar, Document, SwitchButton, Fold, Expand, Bell, Refresh, ArrowDown, Lock
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/axios';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { locale, t } = useI18n();

const isCollapsed = ref(false);
const showProfileDrawer = ref(false);
const showPasswordDrawer = ref(false);
const currentUser = ref<any>(null);
const passwordLoading = ref(false);

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: ''
});

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const changeLanguage = (lang: string) => {
  locale.value = lang;
  localStorage.setItem('app-locale', lang);
};

const handleProfileCommand = (command: string) => {
  if (command === 'profile') {
    fetchProfile();
    showProfileDrawer.value = true;
  } else if (command === 'password') {
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmNewPassword = '';
    showPasswordDrawer.value = true;
  } else if (command === 'logout') {
    handleLogout();
  }
};

const fetchProfile = async () => {
  try {
    const res: any = await api.get('/auth/me');
    if (res.success) {
      currentUser.value = res.data;
    }
  } catch (err) {
    ElMessage.error(t('common.error'));
  }
};

const handleChangePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
    ElMessage.error(t('account.error_password_mismatch'));
    return;
  }

  passwordLoading.value = true;
  try {
    const res: any = await api.post('/auth/change-password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
    if (res.success) {
      ElMessage.success(t('profile.password_change_success'));
      showPasswordDrawer.value = false;
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('common.error'));
  } finally {
    passwordLoading.value = false;
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.el-menu-vertical:not(.el-menu--collapse) {
  width: 260px;
}
.el-menu {
  background-color: transparent;
}
.el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  border-radius: 8px;
  margin: 0 8px;
  width: auto;
}
.el-menu-item {
  border-radius: 8px;
  margin: 4px 8px;
  width: auto;
}
.el-menu-item:hover {
  background-color: var(--el-color-primary-light-9);
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}
</style>
