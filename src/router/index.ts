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
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue')
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: () => import('@/pages/AccountManagement.vue'),
        meta: { roles: ['ADMIN'] }
      },
      {
        path: 'teachers',
        name: 'Teachers',
        component: () => import('@/pages/TeacherManagement.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/pages/CourseClassManagement.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      {
        path: 'rooms',
        name: 'Rooms',
        component: () => import('@/pages/RoomManagement.vue'),
        meta: { roles: ['ADMIN', 'STAFF'] }
      },
      {
        path: 'timetable',
        name: 'Timetable',
        component: () => import('@/pages/TimetableView.vue')
      },
      {
        path: 'leave',
        name: 'Leave',
        component: () => import('@/pages/LeaveManagement.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    // Basic role check
    const requiredRoles = to.meta.roles as string[];
    if (requiredRoles && authStore.user && !requiredRoles.includes(authStore.user.role)) {
      next('/'); // redirect to dashboard if not authorized
    } else {
      next();
    }
  }
});

export default router;
