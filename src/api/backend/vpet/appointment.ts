import { request, type RequestOptions } from '@/utils/request';

export function vpetAppointmentList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/appointment', { method: 'GET', params, ...(options || {}) });
}

export function vpetAppointmentCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/appointment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetAppointmentCheckin(id: number, options?: RequestOptions) {
  return request(`/api/vpet/appointment/${id}/checkin`, { method: 'POST', ...(options || {}) });
}

export function vpetAppointmentCancel(id: number, options?: RequestOptions) {
  return request(`/api/vpet/appointment/${id}/cancel`, { method: 'POST', ...(options || {}) });
}

export function vpetDoctorList(options?: RequestOptions) {
  return request('/api/vpet/appointment/doctors', { method: 'GET', ...(options || {}) });
}
