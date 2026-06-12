export const LOGIN_NAME = 'Login';

export const TENANT_CONTEXT_NAME = 'TenantContextSelect';

export const REDIRECT_NAME = 'Redirect';

export const PARENT_LAYOUT_NAME = 'ParentLayout';

export const PAGE_NOT_FOUND_NAME = 'PageNotFound';

// 路由白名单
export const whiteNameList = [LOGIN_NAME, 'icons', 'error', 'error-404'] as const; // no redirect whitelist

export type WhiteNameList = typeof whiteNameList;

export type WhiteName = (typeof whiteNameList)[number];

// 基础路由保留名单：用于 resetRouter，不能等同于免登录白名单。
export const fixedRouteNameList = [LOGIN_NAME, TENANT_CONTEXT_NAME, REDIRECT_NAME, 'icons', 'error', 'error-404'] as const;
