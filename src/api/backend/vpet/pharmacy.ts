import { request, type RequestOptions } from '@/utils/request';

export function vpetPharmacyList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/pharmacy', { method: 'GET', params, ...(options || {}) });
}

export function vpetPharmacySearch(keyword: string, options?: RequestOptions) {
  return request('/api/vpet/pharmacy/search', { method: 'GET', params: { keyword }, ...(options || {}) });
}

export function vpetPharmacyChargeableSearch(keyword: string, options?: RequestOptions) {
  return request('/api/vpet/pharmacy/chargeable-search', { method: 'GET', params: { keyword }, ...(options || {}) });
}

export function vpetChargeItemList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/pharmacy/charge-items', { method: 'GET', params, ...(options || {}) });
}

export function vpetChargeItemCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/pharmacy/charge-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetChargeItemUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/pharmacy/charge-items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetChargeItemDelete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/pharmacy/charge-items/${id}`, { method: 'DELETE', ...(options || {}) });
}

export function vpetPharmacyGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/pharmacy/${id}`, { method: 'GET', ...(options || {}) });
}

export function vpetPharmacyCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/pharmacy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPharmacyUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/pharmacy/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPharmacyStockIn(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/pharmacy/${id}/stock-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPharmacyLowStock(options?: RequestOptions) {
  return request('/api/vpet/pharmacy/low-stock', { method: 'GET', ...(options || {}) });
}

export function vpetPharmacyExpiring(days?: number, options?: RequestOptions) {
  return request('/api/vpet/pharmacy/expiring', { method: 'GET', params: { days }, ...(options || {}) });
}

export function vpetPharmacyGetBatches(drugId: number, options?: RequestOptions) {
  return request(`/api/vpet/pharmacy/${drugId}/batches`, { method: 'GET', ...(options || {}) });
}

export function vpetPharmacyBatchUpdate(batchId: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/pharmacy/batch/${batchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}
