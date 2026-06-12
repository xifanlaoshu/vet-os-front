import { asyncRoutes } from '../asyncModules';
import type { RouteMeta, RouteRecordRaw } from 'vue-router';
import IFramePage from '@/components/basic/iframe-page';
import { warn } from '@/utils/log';
import { rootRoute } from '@/router/routes';
import router from '@/router';
import basic from '@/router/routes/basic';
import routeModules from '@/router/routes/modules';
import { uniqueSlash } from '@/utils/urlUtils';

const isRouteMenu = (route: RouteRecordRaw) => {
  const { type, status } = route.meta || {};
  return type !== 2 && status !== 0 && typeof route.path === 'string' && route.path.trim() !== '';
};

const resolveMissingComponent = (compPath: string) => {
  warn(`Cannot find src/views/${compPath}.vue or ${compPath}.tsx, please create it.`);
  return () => import('@/views/error/comp-not-found.vue');
};

const normalizeRoutePath = (route: RouteRecordRaw, parentRoute?: RouteRecordRaw) => {
  if (route.meta?.isExt) {
    return;
  }
  if (!route.path.startsWith('/')) {
    route.path = parentRoute?.path
      ? uniqueSlash(`${parentRoute.path}/${route.path}`)
      : `/${route.path}`;
  }
};

export const transformMenuToRoutes = (
  routeList: RouteRecordRaw[],
  parentRoute?: RouteRecordRaw,
) => {
  const validRoutes = routeList.filter(isRouteMenu);

  validRoutes.forEach((route) => {
    route.meta ||= {} as RouteMeta;
    const { show = 1, type, isExt, extOpenMode } = route.meta;
    const compPath = route.component as unknown as string;

    route.meta.hideInMenu ??= !show;
    normalizeRoutePath(route, parentRoute);
    route.name = route.path;

    if (route.children?.length) {
      route.children = transformMenuToRoutes(route.children, route);
      if (!route.children.length) {
        Reflect.deleteProperty(route, 'children');
      }
    }

    if (type === 0) {
      route.component = compPath ? asyncRoutes[compPath] : null;
      if (compPath && !route.component) {
        route.component = resolveMissingComponent(compPath);
      }

      const redirectChild = route.children?.find((n) => !n.meta?.isExt);
      if (redirectChild) {
        route.redirect ??= uniqueSlash(
          redirectChild.path.startsWith('/')
            ? redirectChild.path
            : `${route.path}/${redirectChild.path}`,
        );
      } else {
        Reflect.deleteProperty(route, 'redirect');
      }
    } else if (type === 1) {
      if (isExt && extOpenMode === 2) {
        route.component = <IFramePage src={route.path} />;
        route.path = route.path.replace(new RegExp('://'), '/');
        route.name = route.path;
      } else if (compPath) {
        route.component = asyncRoutes[compPath] || resolveMissingComponent(compPath);
      }
    }
  });
  return validRoutes;
};

export const generateDynamicRoutes = (menus: RouteRecordRaw[]) => {
  const routes = [...routeModules, ...transformMenuToRoutes(menus)];
  const allRoute = [...routes, ...basic];
  genNamePathForRoutes(allRoute);
  rootRoute.children = allRoute;
  router.addRoute(rootRoute);
  console.log('routes', router.getRoutes());
  return routes;
};

export const genNamePathForRoutes = (routes: RouteRecordRaw[], parentNamePath: string[] = []) => {
  routes.forEach((item) => {
    if (item.meta && typeof item.name === 'string') {
      item.meta.namePath = parentNamePath.concat(item.name);

      if (item.meta?.hideInMenu) {
        item.meta.activeMenu ||= parentNamePath.at(-1);
      }

      if (item.children?.length) {
        genNamePathForRoutes(item.children, item.meta.namePath);
      }
    }
  });
};
