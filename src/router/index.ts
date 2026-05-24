import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/pages/Dashboard.vue') },
      {
        path: 'accounts', name: 'Accounts',
        component: () => import('@/pages/AccountManagement.vue'),
        meta: { roles: ['ADMIN'] }
      },
      {
        path: 'teachers', name: 'Teachers',
        component: () => import('@/pages/TeacherManagement.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      // ---- Redirect tương thích ngược ----
      { path: 'courses', redirect: '/courses/catalog' },
      // ---- Quản lý Khóa học ----
      {
        path: 'courses/catalog', name: 'CourseCatalog',
        component: () => import('@/pages/CourseCatalog.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      {
        path: 'courses/batches', name: 'CourseBatches',
        component: () => import('@/pages/CourseBatchManagement.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      // ---- Quản lý Lớp học ----
      {
        path: 'classes/list', name: 'ClassList',
        component: () => import('@/pages/ClassList.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      {
        path: 'classes/planning', name: 'ClassPlanning',
        component: () => import('@/pages/ClassPlanningBoard.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      // ---- Các trang khác ----
      {
        path: 'rooms', name: 'Rooms',
        component: () => import('@/pages/RoomManagement.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      { path: 'timetable', name: 'Timetable', component: () => import('@/pages/TimetableView.vue') },
      { path: 'leave', name: 'Leave', component: () => import('@/pages/LeaveManagement.vue') },
      {
        path: 'skills', name: 'Skills',
        component: () => import('@/pages/SkillManagement.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    const requiredRoles = to.meta.roles as string[];
    if (requiredRoles && authStore.user && !requiredRoles.includes(authStore.user.role)) {
      next('/');
    } else {
      next();
    }
  }
});

export default router;
