import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useLockscreenStore } from './lockscreen';
import { useSSEStore } from './sse';
import { useKeepAliveStore } from './keepAlive';
import type { RouteRecordRaw } from 'vue-router';
import { store } from '@/store';
import Api from '@/api/';
import { resetRouter } from '@/router';
import { generateDynamicRoutes } from '@/router/helper/routeHelper';

const FALLBACK_HOME_PATH = '/vpet/consultation';
export const USER_PERSIST_KEY = '__persisted__user';

export interface TenantAreaOption {
  tenantId: number;
  tenantName: string;
  areaId: number;
  areaName: string;
  defaultArea?: boolean;
}

function isLegacyDashboardPath(path?: string) {
  return !path || path === '/' || path.startsWith('/dashboard');
}

function findFirstMenuPath(routes: RouteRecordRaw[] = []): string | undefined {
  for (const route of routes) {
    if (route.meta?.hideInMenu) continue;
    if (typeof route.redirect === 'string' && !isLegacyDashboardPath(route.redirect)) {
      return route.redirect;
    }
    const childPath = findFirstMenuPath(route.children || []);
    if (childPath) return childPath;
    if (typeof route.path === 'string' && !isLegacyDashboardPath(route.path) && route.meta?.type !== 0) {
      return route.path;
    }
  }
  return undefined;
}

export const useUserStore = defineStore(
  'user',
  () => {
    const sseStore = useSSEStore();
    const lockscreenStore = useLockscreenStore();
    const keepAliveStore = useKeepAliveStore();
    const token = ref<string>();
    const perms = ref<string[]>([]);
    const menus = ref<RouteRecordRaw[]>([]);
    const userInfo = ref<Partial<API.UserEntity>>({});
    const tenantId = ref<number>();
    const tenantName = ref<string>('');
    const areaId = ref<number>();
    const areaName = ref<string>('');
    const areaOptions = ref<TenantAreaOption[]>([]);
    const contextSelected = ref(false);

    const sortMenus = (menus: RouteRecordRaw[] = []) => {
      return menus
        .filter((n) => {
          const flag = !n.meta?.hideInMenu;
          if (flag && n.children?.length) {
            n.children = sortMenus(n.children);
          }
          return flag;
        })
        .sort((a, b) => ~~Number(a.meta?.orderNo) - ~~Number(b.meta?.orderNo));
    };

    /** 清空登录态(token、userInfo...) */
    const clearLoginStatus = () => {
      token.value = '';
      perms.value = [];
      menus.value = [];
      userInfo.value = {};
      tenantId.value = undefined;
      tenantName.value = '';
      areaId.value = undefined;
      areaName.value = '';
      areaOptions.value = [];
      contextSelected.value = false;
      resetRouter();
      setTimeout(() => {
        sessionStorage.removeItem(USER_PERSIST_KEY);
      });
    };
    /** 登录成功保存token */
    const setToken = (_token: string) => {
      token.value = _token;
    };
    const applyContext = (context: any = {}) => {
      tenantId.value = context.tenantId;
      tenantName.value = context.tenantName || '';
      areaId.value = context.areaId;
      areaName.value = context.areaName || '';
      areaOptions.value = context.areaOptions || [];
      contextSelected.value = Boolean(context.contextSelected);
    };
    const loadContext = async () => {
      const context = await Api.account.accountContext();
      applyContext(context);
      return context;
    };
    /** 登录 */
    const login = async (params: API.LoginDto) => {
      try {
        const data = await Api.auth.authLogin(params);
        setToken(data.token);
        await loadContext();
        lockscreenStore.setLock(false);
        lockscreenStore.saveLoginPwd(params.password);
      } catch (error) {
        return Promise.reject(error);
      }
    };
    /** 登录成功之后, 获取用户信息以及生成权限路由 */
    const afterLogin = async () => {
      try {
        const { accountProfile } = Api.account;
        // const wsStore = useWsStore();
        const userInfoData = await accountProfile();

        userInfo.value = userInfoData;
        await loadContext();
        if (!contextSelected.value) {
          return;
        }
        await fetchPermsAndMenus();
        sseStore.initServerMsgListener();
      } catch (error) {
        return Promise.reject(error);
        // return logout();
      }
    };
    /** 获取权限及菜单 */
    const fetchPermsAndMenus = async () => {
      const { accountPermissions, accountMenu } = Api.account;
      // const wsStore = useWsStore();
      const [menusData, permsData] = await Promise.all([accountMenu(), accountPermissions()]);
      perms.value = permsData;
      resetRouter();
      keepAliveStore.clear();
      const result = generateDynamicRoutes(menusData as unknown as RouteRecordRaw[]);
      menus.value = sortMenus(result);
    };
    const getHomePath = (preferredPath?: string) => {
      if (preferredPath && !isLegacyDashboardPath(preferredPath)) {
        return preferredPath;
      }
      return findFirstMenuPath(menus.value) || FALLBACK_HOME_PATH;
    };
    /** 登出 */
    const logout = async () => {
      await Api.account.accountLogout();
      sseStore.closeEventSource();
      clearLoginStatus();
    };
    const switchArea = async (targetAreaId: number) => {
      if (!targetAreaId || targetAreaId === areaId.value) return;
      const context = await Api.account.accountSwitchArea({ areaId: targetAreaId });
      if (context.token) {
        setToken(context.token);
      }
      applyContext(context);
      contextSelected.value = true;
      await fetchPermsAndMenus();
    };
    const selectContext = async (targetTenantId: number, targetAreaId: number) => {
      const context = await Api.account.accountSelectContext({
        tenantId: targetTenantId,
        areaId: targetAreaId,
      });
      if (context.token) {
        setToken(context.token);
      }
      applyContext({ ...context, contextSelected: true });
      await fetchPermsAndMenus();
      return context;
    };

    return {
      token,
      perms,
      menus,
      userInfo,
      tenantId,
      tenantName,
      areaId,
      areaName,
      areaOptions,
      contextSelected,
      login,
      afterLogin,
      logout,
      clearLoginStatus,
      loadContext,
      switchArea,
      selectContext,
      fetchPermsAndMenus,
      getHomePath,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      pick: ['token', 'tenantId', 'tenantName', 'areaId', 'areaName', 'areaOptions', 'contextSelected'],
    },
  },
);

// 在组件setup函数外使用
export function useUserStoreWithOut() {
  return useUserStore(store);
}
