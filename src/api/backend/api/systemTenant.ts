// @ts-ignore
/* eslint-disable */

import { request, type RequestOptions } from '@/utils/request';

export async function tenantList(params?: any, options?: RequestOptions) {
  return request<any>('/api/system/tenants', { method: 'GET', params, ...(options || {}) });
}

export async function tenantOptions(options?: RequestOptions) {
  return request<any[]>('/api/system/tenants/options', { method: 'GET', ...(options || {}) });
}

export async function tenantCreate(body: any, options?: RequestOptions) {
  return request<any>('/api/system/tenants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '创建成功' }),
  });
}

export async function tenantUpdate(id: number, body: any, options?: RequestOptions) {
  return request<any>(`/api/system/tenants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '更新成功' }),
  });
}

export async function tenantAreaList(params?: any, options?: RequestOptions) {
  return request<any>('/api/system/tenants/areas', { method: 'GET', params, ...(options || {}) });
}

export async function tenantAreaOptions(params?: any, options?: RequestOptions) {
  return request<any[]>('/api/system/tenants/areas/options', { method: 'GET', params, ...(options || {}) });
}

export async function tenantAreaCreate(body: any, options?: RequestOptions) {
  return request<any>('/api/system/tenants/areas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '创建成功' }),
  });
}

export async function tenantAreaUpdate(id: number, body: any, options?: RequestOptions) {
  return request<any>(`/api/system/tenants/areas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '更新成功' }),
  });
}

export async function userAreaGrants(userId: number, options?: RequestOptions) {
  return request<any[]>(`/api/system/users/${userId}/areas`, { method: 'GET', ...(options || {}) });
}

export async function userAreaGrantSave(userId: number, body: any, options?: RequestOptions) {
  return request<any[]>(`/api/system/users/${userId}/areas`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '保存成功' }),
  });
}
