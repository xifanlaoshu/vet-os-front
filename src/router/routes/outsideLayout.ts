import type { RouteRecordRaw } from 'vue-router';
import { LOGIN_NAME, TENANT_CONTEXT_NAME } from '@/router/constant';

/**
 * layout布局之外的路由
 */
export const LoginRoute: RouteRecordRaw = {
  path: '/login',
  name: LOGIN_NAME,
  component: () => import('@/views/login/index.vue'),
  meta: {
    title: '登录',
  },
};

export const TenantContextRoute: RouteRecordRaw = {
  path: '/tenant-context',
  name: TENANT_CONTEXT_NAME,
  component: () => import('@/views/login/tenant-context.vue'),
  meta: {
    title: '选择租户院区',
  },
};

export default [LoginRoute, TenantContextRoute];
