import { t } from '@/hooks/useI18n';
import { RouterView } from 'vue-router';

export default [
  {
    path: '/vpet',
    name: 'VPet',
    component: RouterView,
    meta: { title: t('routes.vpet.root'), icon: 'ant-design:medicine-box-outlined' },
    children: [
      { path: 'dashboard', name: 'VPetDashboard', component: () => import('@/views/vpet/dashboard/index.vue'), meta: { title: t('routes.vpet.dashboard'), perm: 'vpet:dashboard' } },
      { path: 'customer', name: 'VPetCustomer', component: () => import('@/views/vpet/customer/list.vue'), meta: { title: t('routes.vpet.customer'), perm: 'vpet:customer:list' } },
      { path: 'customer/:id', name: 'VPetCustomerDetail', component: () => import('@/views/vpet/customer/detail.vue'), meta: { title: t('routes.vpet.customerDetail'), hideInMenu: true } },
      { path: 'pet', name: 'VPetPet', component: () => import('@/views/vpet/pet/list.vue'), meta: { title: t('routes.vpet.pet'), perm: 'vpet:pet:list' } },
      { path: 'pet/:id', name: 'VPetPetDetail', component: () => import('@/views/vpet/pet/detail.vue'), meta: { title: t('routes.vpet.petDetail'), hideInMenu: true } },
      { path: 'consultation', name: 'VPetConsultation', component: () => import('@/views/vpet/consultation/index.vue'), meta: { title: t('routes.vpet.consultation'), perm: 'vpet:consultation' } },
      { path: 'consultation/visit/:id', name: 'VPetConsultationDetail', component: () => import('@/views/vpet/consultation/detail.vue'), meta: { title: t('routes.vpet.consultationDetail'), hideInMenu: true } },
      { path: 'appointment', name: 'VPetAppointment', component: () => import('@/views/vpet/appointment/index.vue'), meta: { title: t('routes.vpet.appointment'), perm: 'vpet:appointment' } },
      { path: 'chronic', name: 'VPetChronic', component: () => import('@/views/vpet/chronic/index.vue'), meta: { title: t('routes.vpet.chronic'), perm: 'vpet:chronic:list' } },
      { path: 'lab/list', name: 'VPetLab', component: () => import('@/views/vpet/lab/list.vue'), meta: { title: t('routes.vpet.lab'), perm: 'vpet:lab:list' } },
      { path: 'lab/report/:id', name: 'VPetLabReport', component: () => import('@/views/vpet/lab/report.vue'), meta: { title: t('routes.vpet.labReport'), hideInMenu: true } },
      { path: 'prescription', name: 'VPetPrescription', component: () => import('@/views/vpet/prescription/index.vue'), meta: { title: t('routes.vpet.prescription'), perm: 'vpet:prescription:list' } },
      { path: 'billing', name: 'VPetBilling', component: () => import('@/views/vpet/billing/index.vue'), meta: { title: t('routes.vpet.billing'), perm: 'vpet:billing:list' } },
      { path: 'member', name: 'VPetMember', component: () => import('@/views/vpet/member/index.vue'), meta: { title: t('routes.vpet.member'), perm: 'vpet:member:list' } },
      { path: 'pharmacy', name: 'VPetPharmacy', component: () => import('@/views/vpet/pharmacy/index.vue'), meta: { title: t('routes.vpet.pharmacy'), perm: 'vpet:pharmacy:list' } },
      { path: 'service-item', name: 'VPetServiceItem', component: () => import('@/views/vpet/service-item/index.vue'), meta: { title: t('routes.vpet.serviceItem'), perm: 'vpet:service-item:list' } },
      { path: 'hosp/list', name: 'VPetHospitalization', component: () => import('@/views/vpet/hosp/list.vue'), meta: { title: t('routes.vpet.hosp'), perm: 'vpet:hosp:list' } },
      { path: 'hosp/nursing/:id', name: 'VPetHospitalizationNursing', component: () => import('@/views/vpet/hosp/nursing.vue'), meta: { title: t('routes.vpet.hospNursing'), hideInMenu: true } },
      { path: 'reminder/list', name: 'VPetReminder', component: () => import('@/views/vpet/reminder/list.vue'), meta: { title: t('routes.vpet.reminder'), perm: 'vpet:reminder:list' } },
      { path: 'report/daily', name: 'VPetReportDaily', component: () => import('@/views/vpet/report/daily.vue'), meta: { title: t('routes.vpet.report'), perm: 'vpet:report:daily' } },
      { path: 'insurance/list', name: 'VPetInsurance', component: () => import('@/views/vpet/insurance/list.vue'), meta: { title: t('routes.vpet.insurance'), perm: 'vpet:insurance:list' } },
      { path: 'store', name: 'VPetStore', component: () => import('@/views/vpet/store/index.vue'), meta: { title: t('routes.vpet.store'), perm: 'vpet:store:list' } },
      { path: 'ai', name: 'VPetAI', component: () => import('@/views/vpet/ai/index.vue'), meta: { title: t('routes.vpet.ai'), perm: 'vpet:ai' } },
      { path: 'doctor', name: 'VPetDoctor', component: () => import('@/views/vpet/doctor/index.vue'), meta: { title: t('routes.vpet.doctor'), perm: 'vpet:doctor:list' } },
      { path: 'queue', name: 'VPetQueueBoard', component: () => import('@/views/vpet/queue/board.vue'), meta: { title: t('routes.vpet.queue'), perm: 'vpet:queue:list' } },
    ],
  },
];
