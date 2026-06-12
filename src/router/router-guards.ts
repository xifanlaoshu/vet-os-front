import { NavigationFailureType, isNavigationFailure } from 'vue-router';
import NProgress from 'nprogress';
import { Modal } from 'ant-design-vue';
import { LOGIN_NAME, REDIRECT_NAME, TENANT_CONTEXT_NAME } from './constant';
import type { WhiteNameList } from './constant';
import type { Router, RouteLocationNormalized } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { useKeepAliveStore } from '@/store/modules/keepAlive';
import { to as _to } from '@/utils/awaitTo';
import { transformI18n } from '@/hooks/useI18n';
import { devError, devWarn } from '@/utils/devLog';

NProgress.configure({ showSpinner: false });

function isLegacyDashboardPath(path?: string) {
  return !path || path === '/' || path.startsWith('/dashboard');
}

export function createRouterGuards(router: Router, whiteNameList: WhiteNameList) {
  router.beforeEach(async (to, from, next) => {
    if (!from.meta?.hideProgressBar || !to.meta?.hideProgressBar)
      NProgress.start();

    const userStore = useUserStore();

    if (userStore.token) {
      if (to.name === LOGIN_NAME) {
        if (!userStore.contextSelected) {
          const [contextErr] = await _to(userStore.loadContext());
          if (contextErr) {
            userStore.clearLoginStatus();
            Modal.destroyAll();
            return next({ name: LOGIN_NAME });
          }
          return next({ name: TENANT_CONTEXT_NAME, query: { redirect: to.query.redirect as string | undefined } });
        }
        if (userStore.menus.length === 0) {
          const [err] = await _to(userStore.afterLogin());
          if (err) {
            userStore.clearLoginStatus();
            Modal.destroyAll();
            return next({ name: LOGIN_NAME });
          }
        }
        next({ path: userStore.getHomePath() });
      }
      else if (to.name === TENANT_CONTEXT_NAME) {
        const [contextErr] = await _to(userStore.loadContext());
        if (contextErr) {
          userStore.clearLoginStatus();
          Modal.destroyAll();
          return next({ name: LOGIN_NAME, query: { redirect: to.fullPath }, replace: true });
        }
        next();
      }
      else {
        if (!userStore.contextSelected) {
          const [contextErr] = await _to(userStore.loadContext());
          if (contextErr) {
            userStore.clearLoginStatus();
            Modal.destroyAll();
            return next({ name: LOGIN_NAME, query: { redirect: to.fullPath }, replace: true });
          }
          return next({ name: TENANT_CONTEXT_NAME, query: { redirect: to.fullPath }, replace: true });
        }
        if (userStore.menus.length === 0) {
          const [err] = await _to(userStore.afterLogin());
          if (err) {
            userStore.clearLoginStatus();
            Modal.destroyAll();
            return next({ name: LOGIN_NAME });
          }
          if (isLegacyDashboardPath(to.path)) {
            next({ path: userStore.getHomePath(), replace: true });
          }
          else {
            next({ path: to.fullPath, replace: true });
          }
        }
        else if (isLegacyDashboardPath(to.path)) {
          next({ path: userStore.getHomePath(), replace: true });
        }
        else {
          next();
        }
      }
    }
    else if (whiteNameList.some((n) => n === to.name)) {
      next();
    }
    else {
      next({ name: LOGIN_NAME, query: { redirect: to.fullPath }, replace: true });
    }
  });

  const getComponentName = (route: RouteLocationNormalized): string[] => {
    return route.matched
      .map((n) => {
        if (!n.meta?.keepAlive)
          return;
        const comp = n.components?.default;
        return comp?.name ?? (comp as any)?.type?.name;
      })
      .filter(Boolean);
  };

  router.afterEach((to, from, failure) => {
    if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
      NProgress.done();
      return;
    }

    if (to.meta?.title)
      document.title = transformI18n(to.meta.title);

    const keepAliveStore = useKeepAliveStore();
    const toCompName = getComponentName(to);

    if (to.meta?.keepAlive) {
      if (toCompName) {
        keepAliveStore.add(toCompName);
      }
      else {
        devWarn(`${to.fullPath} has keepAlive enabled but no component name was found.`);
      }
    }
    else if (toCompName) {
      keepAliveStore.remove(toCompName);
    }

    if (to.name === REDIRECT_NAME) {
      const fromCompName = getComponentName(from);
      fromCompName && keepAliveStore.remove(fromCompName);
    }

    const userStore = useUserStore();
    if (!userStore.token)
      keepAliveStore.clear();

    NProgress.done();
  });

  router.onError((error) => {
    devError('Router error', error);
  });
}
