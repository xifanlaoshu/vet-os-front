// @ts-ignore
/* eslint-disable */

import { request, type RequestOptions } from '@/utils/request';

export async function profile(options?: RequestOptions) {
  return request<any>('/api/tenant-admin/profile', { method: 'GET', ...(options || {}) });
}

export async function areaList(params?: any, options?: RequestOptions) {
  return request<any>('/api/tenant-admin/areas', { method: 'GET', params, ...(options || {}) });
}

export async function areaOptions(options?: RequestOptions) {
  return request<any[]>('/api/tenant-admin/areas/options', { method: 'GET', ...(options || {}) });
}

export async function areaCreate(body: any, options?: RequestOptions) {
  return request<any>('/api/tenant-admin/areas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '创建成功' }),
  });
}

export async function areaUpdate(id: number, body: any, options?: RequestOptions) {
  return request<any>(`/api/tenant-admin/areas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '更新成功' }),
  });
}

export async function userList(params?: any, options?: RequestOptions) {
  return request<any>('/api/tenant-admin/users', { method: 'GET', params, ...(options || {}) });
}

export async function userRead(id: number, options?: RequestOptions) {
  return request<any>(`/api/tenant-admin/users/${id}`, { method: 'GET', ...(options || {}) });
}

export async function userCreate(body: any, options?: RequestOptions) {
  return request<any>('/api/tenant-admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '创建成功' }),
  });
}

export async function userUpdate(id: number, body: any, options?: RequestOptions) {
  return request<any>(`/api/tenant-admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '更新成功' }),
  });
}

export async function roleOptions(options?: RequestOptions) {
  return request<any[]>('/api/tenant-admin/users/role-options', { method: 'GET', ...(options || {}) });
}
