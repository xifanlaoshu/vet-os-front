import { request, type RequestOptions } from '@/utils/request';

/** 瀹㈡埛鍒楄〃 GET /api/vpet/customer */
export function vpetCustomerList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/customer', { method: 'GET', params, ...(options || {}) });
}

/** 鍒涘缓瀹㈡埛 POST /api/vpet/customer */
export function vpetCustomerCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/customer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 瀹㈡埛璇︽儏 GET /api/vpet/customer/:id */
export function vpetCustomerGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/customer/${id}`, { method: 'GET', ...(options || {}) });
}

/** 鏇存柊瀹㈡埛 PUT /api/vpet/customer/:id */
export function vpetCustomerUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/customer/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 瀹犵墿鍒楄〃 GET /api/vpet/pet */
export function vpetPetList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/pet', { method: 'GET', params, ...(options || {}) });
}

/** 鍒涘缓瀹犵墿 POST /api/vpet/pet */
export function vpetPetCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/pet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 瀹犵墿璇︽儏 GET /api/vpet/pet/:id */
export function vpetPetGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/pet/${id}`, { method: 'GET', ...(options || {}) });
}

/** 鏇存柊瀹犵墿 PUT /api/vpet/pet/:id */
export function vpetPetUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/pet/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 鍋ュ悍鏃堕棿绾?GET /api/vpet/pet/:id/timeline */
export function vpetPetTimeline(id: number, options?: RequestOptions) {
  return request(`/api/vpet/pet/${id}/timeline`, { method: 'GET', ...(options || {}) });
}

/** 鍒涘缓灏辫瘖(鎸傚彿) POST /api/vpet/visit */
export function vpetVisitCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetAppointmentList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/appointment', { method: 'GET', params, ...(options || {}) });
}

export function vpetAppointmentCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/appointment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetAppointmentUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/appointment/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetAppointmentCheckIn(id: number, options?: RequestOptions) {
  return request(`/api/vpet/appointment/${id}/checkin`, { method: 'POST', ...(options || {}) });
}

export function vpetAppointmentCancel(id: number, options?: RequestOptions) {
  return request(`/api/vpet/appointment/${id}/cancel`, { method: 'POST', ...(options || {}) });
}

/** 灏辫瘖鍒楄〃 GET /api/vpet/visit */
export function vpetVisitList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/visit', { method: 'GET', params, ...(options || {}) });
}

/** 浠婃棩鍊欒瘖闃熷垪 GET /api/vpet/visit/queue */
export function vpetVisitQueue(params?: { doctorId?: number }, options?: RequestOptions) {
  return request('/api/vpet/visit/queue', { method: 'GET', params, ...(options || {}) });
}

/** 璇婃柇缂栫爜涓绘暟鎹?GET /api/vpet/visit/diagnosis-codes */
export function vpetVisitDiagnosisCodes(
  params?: { keyword?: string; species?: string },
  options?: RequestOptions,
) {
  return request('/api/vpet/visit/diagnosis-codes', { method: 'GET', params, ...(options || {}) });
}

/** 灏辫瘖璇︽儏 GET /api/vpet/visit/:id */
export function vpetVisitGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}`, { method: 'GET', ...(options || {}) });
}

export function vpetVisitPrintAudit(id: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/print-audit`, { method: 'POST', ...(options || {}) });
}

export function vpetVisitCareFollowups(id: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/care-followups`, { method: 'GET', ...(options || {}) });
}

export function vpetVisitCareFollowupCreate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/care-followups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 慢病档案列表 GET /api/vpet/visit/chronic/cases */
export function vpetVisitMediaBatches(id: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/media-batches`, { method: 'GET', ...(options || {}) });
}

export function vpetVisitMediaBatchCreate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/media-batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export function vpetVisitMediaFileCreate(id: number, batchId: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/media-batches/${batchId}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export function vpetVisitMediaFileDelete(id: number, batchId: number, fileId: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/media-batches/${batchId}/files/${fileId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

export function vpetChronicCaseList(
  params?: { petId?: number; customerId?: number; status?: number; keyword?: string },
  options?: RequestOptions,
) {
  return request('/api/vpet/visit/chronic/cases', { method: 'GET', params, ...(options || {}) });
}

/** 新建慢病档案 POST /api/vpet/visit/chronic/cases */
export function vpetChronicCaseCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/visit/chronic/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 慢病档案详情 GET /api/vpet/visit/chronic/cases/:id */
function assertVpetId(id: number, fieldName = 'id') {
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0)
    throw new Error(`${fieldName} 格式不正确`);
  return Number(id);
}

export function vpetChronicCaseGet(id: number, options?: RequestOptions) {
  const caseId = assertVpetId(id, '慢病档案ID');
  return request(`/api/vpet/visit/chronic/cases/${caseId}`, { method: 'GET', ...(options || {}) });
}

/** 新增慢病复查 POST /api/vpet/visit/chronic/cases/:id/followups */
export function vpetChronicFollowupCreate(id: number, body: any, options?: RequestOptions) {
  const caseId = assertVpetId(id, '慢病档案ID');
  return request(`/api/vpet/visit/chronic/cases/${caseId}/followups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 慢病追踪报告 GET /api/vpet/visit/chronic/cases/:id/report */
export function vpetChronicReportGet(id: number, options?: RequestOptions) {
  const caseId = assertVpetId(id, '慢病档案ID');
  return request(`/api/vpet/visit/chronic/cases/${caseId}/report`, { method: 'GET', ...(options || {}) });
}

/** 鏇存柊灏辫瘖(淇濆瓨SOAP) PUT /api/vpet/visit/:id */
export function vpetVisitUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 寮€濮嬫帴璇?POST /api/vpet/visit/:id/start */
export function vpetVisitLockEmr(id: number, body?: any, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/lock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body || {}, ...(options || {}) });
}

export function vpetVisitRequestUnlock(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/unlock-request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetVisitSignEmr(id: number, body?: any, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/sign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body || {}, ...(options || {}) });
}

export function vpetVisitAuditLogs(id: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/audit-logs`, { method: 'GET', ...(options || {}) });
}

export function vpetVisitSignatures(id: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/signatures`, { method: 'GET', ...(options || {}) });
}

export function vpetVisitStart(id: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/start`, { method: 'POST', ...(options || {}) });
}

/** 缁撴潫灏辫瘖 POST /api/vpet/visit/:id/end */
export function vpetVisitEnd(id: number, options?: RequestOptions) {
  return request(`/api/vpet/visit/${id}/end`, { method: 'POST', ...(options || {}) });
}

/** 鍒涘缓澶勬柟 POST /api/vpet/prescription */
export function vpetPrescriptionCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/prescription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 澶勬柟鍒楄〃 GET /api/vpet/prescription */
export function vpetPrescriptionList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/prescription', { method: 'GET', params, ...(options || {}) });
}

/** 鎸夊氨璇婃煡璇㈠鏂?GET /api/vpet/prescription/visit/:visitId */
export function vpetPrescriptionByVisit(visitId: number, options?: RequestOptions) {
  return request(`/api/vpet/prescription/visit/${visitId}`, { method: 'GET', ...(options || {}) });
}

export function vpetPrescriptionDispense(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/prescription/${id}/dispense`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPrescriptionStockTxns(id: number, options?: RequestOptions) {
  return request(`/api/vpet/prescription/${id}/stock-txns`, { method: 'GET', ...(options || {}) });
}

export function vpetPrescriptionGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/prescription/${id}`, { method: 'GET', ...(options || {}) });
}

export function vpetPrescriptionTemplateList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/prescription/templates', { method: 'GET', params, ...(options || {}) });
}

export function vpetPrescriptionTemplateGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/prescription/templates/${id}`, { method: 'GET', ...(options || {}) });
}

export function vpetPrescriptionTemplateCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/prescription/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPrescriptionTemplateUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/prescription/templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPrescriptionTemplateDelete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/prescription/templates/${id}/delete`, { method: 'POST', ...(options || {}) });
}

/** 鍒涘缓璐﹀崟 POST /api/vpet/billing */
export function vpetBillingCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 新建化验申请 POST /api/vpet/lab */
export function vpetLabCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/lab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export function vpetLabList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/lab', { method: 'GET', params, ...(options || {}) });
}

/** 化验模板 GET /api/vpet/lab/templates */
export function vpetLabTemplateList(options?: RequestOptions) {
  return request('/api/vpet/lab/templates', { method: 'GET', ...(options || {}) });
}

/** 鎸夊氨璇婃煡璇㈣处鍗?GET /api/vpet/billing/visit/:visitId */
export function vpetBillingByVisit(visitId: number, options?: RequestOptions) {
  return request(`/api/vpet/billing/visit/${visitId}`, { method: 'GET', ...(options || {}) });
}

export function vpetBillingSyncVisit(visitId: number, options?: RequestOptions) {
  return request(`/api/vpet/billing/visit/${visitId}/sync`, { method: 'POST', ...(options || {}) });
}

/** 鏀粯 POST /api/vpet/billing/:id/pay */
export function vpetBillingPay(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/billing/${id}/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetBillingRefund(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/billing/${id}/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetBillingGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/billing/${id}`, { method: 'GET', ...(options || {}) });
}

export function vpetPrintTemplateList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/print-templates', { method: 'GET', params, ...(options || {}) });
}

export function vpetPrintTemplateActive(params?: { templateType?: string }, options?: RequestOptions) {
  return request('/api/vpet/print-templates/active', { method: 'GET', params, ...(options || {}) });
}

export function vpetPrintTemplateCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/print-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPrintTemplateUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/print-templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPrintTemplateDelete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/print-templates/${id}`, { method: 'DELETE', ...(options || {}) });
}

/** 鏀惰垂鍒楄〃 GET /api/vpet/billing */
export function vpetBillingAll(params?: any, options?: RequestOptions) {
  return request('/api/vpet/billing', { method: 'GET', params, ...(options || {}) });
}

/** 浠婃棩钀ユ敹缁熻 GET /api/vpet/billing/stats/today */
export function vpetBillingTodayStats(options?: RequestOptions) {
  return request('/api/vpet/billing/stats/today', { method: 'GET', ...(options || {}) });
}

/** 慢病管理总览 GET /api/vpet/report/chronic */
export function vpetChronicSummary(options?: RequestOptions) {
  return request('/api/vpet/report/chronic', { method: 'GET', ...(options || {}) });
}

export function vpetReportDaily(params?: any, options?: RequestOptions) {
  return request('/api/vpet/report/daily', { method: 'GET', params, ...(options || {}) });
}

/** 鑾峰彇鍖荤敓闃熷垪 GET /api/vpet/queue/:doctorId */
export function vpetAiLogs(params?: any, options?: RequestOptions) {
  return request('/api/vpet/ai/logs', { method: 'GET', params, ...(options || {}) });
}

export function vpetAiSoapDraft(body: any, options?: RequestOptions) {
  return request('/api/vpet/ai/soap-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetAiPrescriptionReview(id: number, options?: RequestOptions) {
  return request(`/api/vpet/ai/prescription-review/${id}`, { method: 'POST', ...(options || {}) });
}

export function vpetAiLabInterpret(body: any, options?: RequestOptions) {
  return request('/api/vpet/ai/lab-interpret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetQueueGet(doctorId: number, options?: RequestOptions) {
  return request(`/api/vpet/queue/${doctorId}`, { method: 'GET', ...(options || {}) });
}

/** 鍖荤敓涓绘暟鎹?GET /api/vpet/appointment/doctors/all */
export function vpetDoctorAll(params?: { bookableOnly?: boolean }, options?: RequestOptions) {
  return request('/api/vpet/appointment/doctors/all', { method: 'GET', params, ...(options || {}) });
}

export function vpetDoctorList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/appointment/doctors', { method: 'GET', params, ...(options || {}) });
}

export function vpetDoctorCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/appointment/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetDoctorUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/appointment/doctors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetDoctorDelete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/appointment/doctors/${id}`, { method: 'DELETE', ...(options || {}) });
}

export function vpetShiftList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/appointment/shifts', { method: 'GET', params, ...(options || {}) });
}

export function vpetShiftActive(options?: RequestOptions) {
  return request('/api/vpet/appointment/shifts/active', { method: 'GET', ...(options || {}) });
}

export function vpetShiftCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/appointment/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetShiftUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/appointment/shifts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetShiftDelete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/appointment/shifts/${id}`, { method: 'DELETE', ...(options || {}) });
}

export function vpetScheduleMonth(params: { month: string }, options?: RequestOptions) {
  return request('/api/vpet/appointment/schedules/month', { method: 'GET', params, ...(options || {}) });
}

export function vpetScheduleSave(body: any, options?: RequestOptions) {
  return request('/api/vpet/appointment/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 鍙彿 POST /api/vpet/queue/call */
export function vpetQueueCall(body: { doctorId: number; visitId?: number }, options?: RequestOptions) {
  return request('/api/vpet/queue/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetPharmacyList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/pharmacy', { method: 'GET', params, ...(options || {}) });
}

export function vpetStoreList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/store', { method: 'GET', params, ...(options || {}) });
}

export function vpetStoreCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetStoreStockList(storeId: number, options?: RequestOptions) {
  return request(`/api/vpet/store/${storeId}/stock`, { method: 'GET', ...(options || {}) });
}

export function vpetStoreStockSet(storeId: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/store/${storeId}/stock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetStoreTransferList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/store/transfer/list', { method: 'GET', params, ...(options || {}) });
}

export function vpetStoreTransferCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/store/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetStoreTransferApprove(id: number, options?: RequestOptions) {
  return request(`/api/vpet/store/transfer/${id}/approve`, { method: 'POST', data: {}, ...(options || {}) });
}

export function vpetStoreTransferComplete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/store/transfer/${id}/complete`, { method: 'POST', ...(options || {}) });
}

export function vpetHospitalizationList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/hosp', { method: 'GET', params, ...(options || {}) });
}

export function vpetHospitalizationCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/hosp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetHospitalizationGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/hosp/${id}`, { method: 'GET', ...(options || {}) });
}

export function vpetHospitalizationNursingList(id: number, options?: RequestOptions) {
  return request(`/api/vpet/hosp/${id}/nursing`, { method: 'GET', ...(options || {}) });
}

export function vpetHospitalizationNursingCreate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/hosp/${id}/nursing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetHospitalizationNursingExecute(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/hosp/nursing/${id}/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetHospitalizationDischarge(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/hosp/${id}/discharge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetInsuranceList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/insurance', { method: 'GET', params, ...(options || {}) });
}

export function vpetInsuranceCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/insurance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetInsuranceSubmit(id: number, options?: RequestOptions) {
  return request(`/api/vpet/insurance/${id}/submit`, { method: 'POST', ...(options || {}) });
}

export function vpetInsuranceSettle(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/insurance/${id}/settle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetReminderList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/reminder', { method: 'GET', params, ...(options || {}) });
}

export function vpetReminderCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetReminderComplete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/reminder/${id}/complete`, { method: 'POST', ...(options || {}) });
}

export function vpetReminderCancel(id: number, options?: RequestOptions) {
  return request(`/api/vpet/reminder/${id}/cancel`, { method: 'POST', ...(options || {}) });
}

export function vpetConsentTemplateList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/consent/templates', { method: 'GET', params, ...(options || {}) });
}

export function vpetConsentTemplateActive(options?: RequestOptions) {
  return request('/api/vpet/consent/templates/active', { method: 'GET', ...(options || {}) });
}

export function vpetConsentTemplateCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/consent/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetConsentTemplateUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/consent/templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetConsentTemplateDelete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/consent/templates/${id}`, { method: 'DELETE', ...(options || {}) });
}

export function vpetConsentRecordList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/consent/records', { method: 'GET', params, ...(options || {}) });
}

export function vpetConsentRecordGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/consent/records/${id}`, { method: 'GET', ...(options || {}) });
}

export function vpetConsentRecordCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/consent/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetConsentRecordSign(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/consent/records/${id}/sign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetConsentRecordVoid(id: number, options?: RequestOptions) {
  return request(`/api/vpet/consent/records/${id}/void`, { method: 'POST', ...(options || {}) });
}

export function vpetLabGet(id: number, options?: RequestOptions) {
  return request(`/api/vpet/lab/${id}`, { method: 'GET', ...(options || {}) });
}

export function vpetLabSubmitLis(id: number, options?: RequestOptions) {
  return request(`/api/vpet/lab/${id}/lis`, { method: 'POST', data: {}, ...(options || {}) });
}

export function vpetLabSaveReport(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/lab/${id}/report`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetLabTemplateCreate(body: any, options?: RequestOptions) {
  return request('/api/vpet/lab/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetLabTemplateUpdate(id: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/lab/templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetLabTemplateDelete(id: number, options?: RequestOptions) {
  return request(`/api/vpet/lab/templates/${id}`, { method: 'DELETE', ...(options || {}) });
}

/** 浼氬憳鍗″紑鍗?POST /api/vpet/member/card */
export function vpetMemberOpenCard(body: any, options?: RequestOptions) {
  return request('/api/vpet/member/card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

/** 鏌ヤ細鍛樺崱 GET /api/vpet/member/card/customer/:customerId */
export function vpetMemberGetCard(customerId: number, options?: RequestOptions) {
  return request(`/api/vpet/member/card/customer/${customerId}`, { method: 'GET', ...(options || {}) });
}

/** 鏌ヤ綑棰?GET /api/vpet/member/balance/:customerId */
export function vpetMemberBalance(customerId: number, options?: RequestOptions) {
  return request(`/api/vpet/member/balance/${customerId}`, { method: 'GET', ...(options || {}) });
}

export function vpetMemberCardList(params?: any, options?: RequestOptions) {
  return request('/api/vpet/member/card', { method: 'GET', params, ...(options || {}) });
}

export function vpetMemberRecharge(cardId: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/member/card/${cardId}/recharge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetMemberDeduct(cardId: number, body: any, options?: RequestOptions) {
  return request(`/api/vpet/member/card/${cardId}/deduct`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) });
}

export function vpetMemberCardLogs(cardId: number, params?: any, options?: RequestOptions) {
  return request(`/api/vpet/member/card/${cardId}/logs`, { method: 'GET', params, ...(options || {}) });
}

export function vpetAuditEvents(params?: any, options?: RequestOptions) {
  return request('/api/vpet/audit/events', { method: 'GET', params, ...(options || {}) });
}
