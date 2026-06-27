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

          <!-- Quản lý Khóa học (sub-menu) -->
          <el-sub-menu index="courses-group">
            <template #title>
              <el-icon><Reading /></el-icon>
              <span>{{ $t('menu.courses_group') }}</span>
            </template>
            <el-menu-item index="/courses/catalog">
              <el-icon><Collection /></el-icon>
              <template #title>{{ $t('menu.courses_catalog') }}</template>
            </el-menu-item>
            <el-menu-item index="/courses/batches">
              <el-icon><Calendar /></el-icon>
              <template #title>{{ $t('menu.courses_batches') }}</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- Quản lý Lớp học (sub-menu) -->
          <el-sub-menu index="classes-group">
            <template #title>
              <el-icon><Notebook /></el-icon>
              <span>{{ $t('menu.classes_group') }}</span>
            </template>
            <el-menu-item index="/classes/list">
              <el-icon><List /></el-icon>
              <template #title>{{ $t('menu.classes_list') }}</template>
            </el-menu-item>
            <el-menu-item index="/classes/planning">
              <el-icon><SetUp /></el-icon>
              <template #title>{{ $t('menu.classes_planning') }}</template>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/patterns">
            <el-icon><Calendar /></el-icon>
            <template #title>{{ $t('menu.patterns') }}</template>
          </el-menu-item>

          <el-menu-item index="/rooms">
            <el-icon><Location /></el-icon>
            <template #title>{{ $t('menu.rooms') }}</template>
          </el-menu-item>
          <el-menu-item index="/skills">
            <el-icon><Medal /></el-icon>
            <template #title>{{ $t('menu.skills') }}</template>
          </el-menu-item>
          <el-menu-item index="/algorithm-config">
            <el-icon><SetUp /></el-icon>
            <template #title>{{ $t('menu.algorithm_config') }}</template>
          </el-menu-item>
        </template>

        <!-- Quản lý lịch giảng dạy -->
        <el-sub-menu index="schedule-group">
          <template #title>
            <el-icon><Calendar /></el-icon>
            <span>{{ $t('menu.schedule_group') }}</span>
          </template>
          <el-menu-item index="/timetable">
            <el-icon><Grid /></el-icon>
            <template #title>{{ $t('menu.timetable') }}</template>
          </el-menu-item>
          <el-menu-item index="/classes/dispatch">
            <el-icon><Clock /></el-icon>
            <template #title>{{ $t('menu.schedule_dispatch') }}</template>
          </el-menu-item>
        </el-sub-menu>

        <!-- Quản lý Giáo viên (Hiển thị cho tất cả nhưng phân quyền bên trong) -->
        <el-sub-menu index="teachers-group">
          <template #title>
            <el-icon><Avatar /></el-icon>
            <span>{{ $t('menu.teachers_group') }}</span>
          </template>
          <el-menu-item v-if="authStore.isAdmin || authStore.isStaff" index="/teachers">
            <el-icon><List /></el-icon>
            <template #title>{{ $t('menu.teachers_list') }}</template>
          </el-menu-item>
          <el-menu-item index="/teacher-unavailable">
            <el-icon><CircleClose /></el-icon>
            <template #title>{{ $t('menu.teachers_unavailable') }}</template>
          </el-menu-item>
        </el-sub-menu>

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
          <template v-if="authStore.isAdmin || authStore.isStaff">
            <el-popover
              placement="bottom-end"
              :width="380"
              trigger="click"
              popper-class="notification-popover !p-0 !rounded-xl !shadow-2xl border-0"
            >
              <template #reference>
                <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" class="mt-1 mr-4 cursor-pointer">
                  <el-icon :size="24" class="text-gray-400 hover:text-emerald-600 transition-colors"><Bell /></el-icon>
                </el-badge>
              </template>
              
              <div class="flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-emerald-50/50 rounded-t-xl">
                  <span class="font-bold text-gray-800 flex items-center gap-1.5">
                    <el-icon class="text-emerald-500"><Bell /></el-icon>
                    {{ $t('notification.title') }}
                  </span>
                  <el-button 
                    v-if="unreadCount > 0" 
                    type="primary" 
                    link 
                    size="small" 
                    class="!text-emerald-600 hover:!text-emerald-700 font-semibold"
                    @click="handleReadAll"
                  >
                    {{ $t('notification.read_all') }}
                  </el-button>
                </div>
                
                <!-- Notification list -->
                <el-scrollbar max-height="350px">
                  <div v-if="notifications.length > 0" class="py-1">
                    <div 
                      v-for="item in notifications" 
                      :key="item.id" 
                      class="px-4 py-3 hover:bg-gray-50 transition-all duration-200 flex gap-3 items-start border-b border-gray-50 last:border-b-0 cursor-pointer relative group"
                      :class="{'bg-emerald-50/20 font-medium': !item.isRead}"
                      @click="handleReadOne(item)"
                    >
                      <!-- Unread indicator dot -->
                      <div class="mt-1.5 flex-shrink-0">
                        <div 
                          class="w-2 h-2 rounded-full transition-all duration-350" 
                          :class="item.isRead ? 'bg-transparent' : 'bg-emerald-500 ring-4 ring-emerald-100'"
                        ></div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm leading-snug text-gray-700" :class="{'text-gray-900 font-semibold': !item.isRead}">
                          {{ item.message }}
                        </p>
                        <span class="text-xs text-gray-400 mt-1 block font-normal">
                          {{ formatTime(item.createdAt) }}
                        </span>
                      </div>
                      
                      <!-- Inline mark as read button on hover -->
                      <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 absolute right-4 top-1/2 -translate-y-1/2" v-if="!item.isRead">
                        <el-button 
                          type="success" 
                          circle
                          size="small"
                          class="!bg-emerald-500 !border-emerald-500 hover:!bg-emerald-600 hover:!border-emerald-600 !p-1 shadow-sm"
                          @click.stop="handleReadOne(item)"
                        >
                          <el-icon class="text-white"><Check /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="py-12 flex flex-col items-center justify-center text-gray-400">
                    <el-avatar :size="64" class="bg-gray-50 text-gray-300 mb-3">
                      <el-icon :size="32"><Message /></el-icon>
                    </el-avatar>
                    <span class="text-sm font-medium">{{ $t('notification.empty') }}</span>
                    <span class="text-xs text-gray-400 mt-1 text-center px-6">{{ $t('notification.empty_desc') }}</span>
                  </div>
                </el-scrollbar>
              </div>
            </el-popover>
          </template>

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
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { 
  HomeFilled, User, Avatar, Reading, Location, Calendar, Document, SwitchButton, Fold, Expand, Bell, Refresh, ArrowDown, Lock,
  Notebook, Collection, List, SetUp, Medal, Grid, Check, Message
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/axios';
import { ElMessage, ElNotification } from 'element-plus';

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

// State cho thông báo Web (SSE)
const unreadCount = ref(0);
const notifications = ref<any[]>([]);
const sseInstance = ref<EventSource | null>(null);

// Hàm phát tiếng beep thông báo nhẹ nhàng và chuyên nghiệp bằng Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Nốt nhạc thứ nhất (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);
    
    // Nốt nhạc thứ hai (E5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (err) {
    console.warn('Không thể phát âm thanh thông báo:', err);
  }
};

// Lấy số lượng thông báo chưa đọc
const fetchUnreadCount = async () => {
  if (!authStore.isAuthenticated || (!authStore.isAdmin && !authStore.isStaff)) return;
  try {
    const res: any = await api.get('/notifications/unread-count');
    if (res.success) {
      unreadCount.value = res.data;
    }
  } catch (err) {
    console.error('Lỗi lấy số lượng thông báo chưa đọc:', err);
  }
};

// Lấy danh sách thông báo
const fetchNotifications = async () => {
  if (!authStore.isAuthenticated || (!authStore.isAdmin && !authStore.isStaff)) return;
  try {
    const res: any = await api.get('/notifications');
    if (res.success) {
      notifications.value = res.data;
    }
  } catch (err) {
    console.error('Lỗi lấy danh sách thông báo:', err);
  }
};

// Đọc toàn bộ thông báo
const handleReadAll = async () => {
  try {
    const res: any = await api.post('/notifications/read-all');
    if (res.success) {
      notifications.value.forEach(item => item.isRead = true);
      unreadCount.value = 0;
      ElMessage.success(t('notification.marked_read'));
    }
  } catch (err) {
    console.error('Lỗi khi đọc toàn bộ thông báo:', err);
  }
};

// Đọc một thông báo cụ thể
const handleReadOne = async (item: any) => {
  if (item.isRead) return;
  try {
    const res: any = await api.post(`/notifications/${item.id}/read`);
    if (res.success) {
      item.isRead = true;
      if (unreadCount.value > 0) {
        unreadCount.value--;
      }
    }
  } catch (err) {
    console.error('Lỗi khi đọc thông báo:', err);
  }
};

// Định dạng thời gian tương đối
const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return t('notification.just_now');
    if (diffMins < 60) return t('notification.mins_ago', { n: diffMins });
    if (diffHours < 24) return t('notification.hours_ago', { n: diffHours });
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return timeStr;
  }
};

// Khởi tạo kết nối SSE
const initSse = () => {
  if (!authStore.token || (!authStore.isAdmin && !authStore.isStaff)) return;
  
  if (sseInstance.value) {
    sseInstance.value.close();
  }
  
  const token = authStore.token;
  const sseUrl = `/api/notifications/subscribe?token=${encodeURIComponent(token)}`;
  const sse = new EventSource(sseUrl);
  sseInstance.value = sse;
  
  sse.addEventListener('NOTIFICATION', (e) => {
    const message = e.data;
    
    // Phát âm thanh và thông báo Toast góc màn hình
    playNotificationSound();
    
    ElNotification({
      title: t('notification.title'),
      message: message,
      type: 'success',
      duration: 8000,
      position: 'bottom-right'
    });
    
    // Cập nhật lại số lượng và danh sách thông báo
    fetchUnreadCount();
    fetchNotifications();
  });
  
  sse.addEventListener('INIT', (e) => {
    console.log('SSE connection initialized:', e.data);
  });
  
  sse.onerror = (err) => {
    console.warn('SSE connection error, retrying in 10 seconds...', err);
    sse.close();
    setTimeout(() => {
      if (authStore.isAuthenticated && (authStore.isAdmin || authStore.isStaff)) {
        initSse();
      }
    }, 10000);
  };
};

onMounted(() => {
  if (authStore.isAdmin || authStore.isStaff) {
    fetchUnreadCount();
    fetchNotifications();
    initSse();
  }
});

onBeforeUnmount(() => {
  if (sseInstance.value) {
    sseInstance.value.close();
  }
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
:deep(.el-sub-menu__title) {
  border-radius: 8px;
  margin: 4px 8px;
  width: auto;
}
:deep(.el-sub-menu__title:hover) {
  background-color: var(--el-color-primary-light-9);
}
:deep(.el-menu--inline .el-menu-item) {
  padding-left: 40px !important;
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
