<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.consultation.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item v-if="activeTab === 'appointments'" :label="t('page.consultation.fields.date')">
          <a-date-picker v-model:value="appointmentDate" />
        </a-form-item>
        <a-form-item v-else class="vpet-query-item-wide" :label="t('page.visitHistory.fields.dateRange')">
          <a-range-picker
            v-model:value="visitDateRange"
            :placeholder="[t('page.visitHistory.placeholders.startDate'), t('page.visitHistory.placeholders.endDate')]"
          />
        </a-form-item>
        <a-form-item :label="t('page.consultation.fields.status')">
          <a-select
            v-model:value="filters.status"
            allow-clear
            :placeholder="t('page.appointment.statusPlaceholder')"
            :options="activeStatusOptions"
          />
        </a-form-item>
        <a-form-item :label="t('page.consultation.fields.keyword')">
          <a-input
            v-model:value="filters.keyword"
            allow-clear
            :placeholder="t('page.consultation.keywordPlaceholder')"
            @pressEnter="reloadActiveTab"
          />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadActiveTab">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-row :gutter="[16, 16]" class="vpet-grid-row">
      <a-col :span="6">
        <a-card class="vpet-stat-card"><a-statistic :title="t('page.consultation.stats.total')" :value="appointmentStats.total" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card"><a-statistic :title="t('page.consultation.stats.booked')" :value="appointmentStats.booked" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card"><a-statistic :title="t('page.consultation.stats.checkedIn')" :value="appointmentStats.checkedIn" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card"><a-statistic :title="t('page.consultation.stats.completed')" :value="appointmentStats.completed" /></a-card>
      </a-col>
    </a-row>

    <a-card class="vpet-panel-card vpet-list-card" :bordered="false">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="appointments" :tab="t('page.consultation.todayAppointments')">
          <a-table
            row-key="id"
            :loading="appointmentLoading"
            :columns="appointmentColumns"
            :data-source="appointments"
            :pagination="appointmentPagination"
            @change="handleAppointmentTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'petCustomer'">
                <div style="font-weight: 600">{{ petLabel(record.pet, record.petSnapshot, record.petId) }}</div>
                <div style="color: #8c8c8c; font-size: 12px">{{ customerLabel(record.customer, record.customerSnapshot, record.customerId) }}</div>
              </template>
              <template v-else-if="column.key === 'doctor'">
                {{ doctorText(record.doctor) }}
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="appointmentStatusColor(record.status)">
                  {{ appointmentStatusText(record.status) }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="openConsultation(record)">
                    {{ record.status === 1 ? t('page.consultation.table.checkInAndConsult') : t('page.consultation.table.enterRecord') }}
                  </a-button>
                  <a-button v-if="record.status === 1" type="link" size="small" @click="editAppointment(record)">
                    {{ t('page.consultation.table.edit') }}
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="visits" :tab="t('page.consultation.historyVisits')">
          <a-table
            row-key="id"
            :loading="visitLoading"
            :columns="visitColumns"
            :data-source="visits"
            :pagination="visitPagination"
            @change="handleVisitTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'petCustomer'">
                <div style="font-weight: 600">{{ petLabel(record.pet, record.petSnapshot, record.petId) }}</div>
                <div style="color: #8c8c8c; font-size: 12px">{{ customerLabel(record.customer, record.customerSnapshot, record.customerId) }}</div>
              </template>
              <template v-else-if="column.key === 'doctor'">
                {{ doctorNameById(record.doctorId) }}
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="visitStatusColor(record.status)">
                  {{ visitStatusText(record.status) }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'diagnosis'">
                {{ diagnosisText(record) }}
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="openVisit(record.id)">
                    {{ t('common.viewMedicalRecord') }}
                  </a-button>
                  <a-button type="link" size="small" @click="openVisitPrint(record.id)">
                    {{ t('page.consultation.print.printButton') }}
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="tsx">
import dayjs, { type Dayjs } from 'dayjs';
import { computed, onMounted, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { formatToDateTime } from '@/utils/dateUtil';
import { vpetAppointmentCheckIn, vpetAppointmentList, vpetVisitList } from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetConsultationWorkbench' });

type DoctorOption = {
  value: number;
  label: string;
};

const {
  t,
  appointmentStatusColor,
  appointmentStatusOptions,
  appointmentStatusText,
  visitStatusColor,
  visitStatusOptions,
  visitStatusText,
} = useVpetLocale();
const {
  customerLabel,
  doctorLabel,
  loadDoctors: loadDoctorOptions,
  petLabel,
} = useVpetReference();
const router = useRouter();
const currentStaffScope = 'currentStaff';

const doctorOptions = ref<DoctorOption[]>([]);
const activeTab = ref<'appointments' | 'visits'>('appointments');
const appointmentDate = ref<Dayjs>(dayjs());
const visitDateRange = ref<[Dayjs, Dayjs]>([dayjs(), dayjs()]);
const filters = ref({
  status: undefined as number | undefined,
  keyword: '',
});

const appointmentLoading = ref(false);
const visitLoading = ref(false);
const appointments = ref<any[]>([]);
const visits = ref<any[]>([]);
const appointmentPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});
const visitPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

const activeStatusOptions = computed(() =>
  activeTab.value === 'appointments' ? appointmentStatusOptions.value : visitStatusOptions.value,
);

function doctorText(doctor?: any) {
  return doctorLabel(doctor);
}

function doctorNameById(doctorId?: number) {
  return doctorLabel(undefined, doctorId, undefined, doctorOptions.value);
}

function diagnosisText(record: any) {
  let items = Array.isArray(record.diagnoses) ? record.diagnoses : record.diagnosis;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  items = Array.isArray(items) ? items : [];
  return items.map((item: any) => item.name || item.code).filter(Boolean).join(' / ') || '-';
}

const appointmentColumns = [
  {
    title: t('page.appointment.fields.appointmentTime'),
    dataIndex: 'appointmentTime',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('page.consultation.table.appointmentPet'),
    key: 'petCustomer',
    width: 220,
  },
  {
    title: t('page.consultation.fields.reason'),
    dataIndex: 'reason',
    ellipsis: true,
    customRender: ({ text }: any) => text || '-',
  },
  {
    title: t('page.consultation.fields.doctor'),
    key: 'doctor',
    width: 220,
  },
  {
    title: t('page.consultation.fields.status'),
    key: 'status',
    width: 120,
  },
  {
    title: t('page.consultation.table.action'),
    key: 'action',
    width: 180,
    fixed: 'right' as const,
  },
];

const visitColumns = [
  { title: t('page.consultation.fields.visitNo'), dataIndex: 'visitNo', width: 160 },
  {
    title: t('page.consultation.table.visitPet'),
    key: 'petCustomer',
    width: 220,
  },
  {
    title: t('page.consultation.fields.chiefComplaint'),
    dataIndex: 'chiefComplaint',
    ellipsis: true,
    customRender: ({ text }: any) => text || '-',
  },
  {
    title: t('page.consultation.fields.diagnosis'),
    key: 'diagnosis',
    ellipsis: true,
  },
  {
    title: t('page.consultation.fields.doctor'),
    key: 'doctor',
    width: 220,
  },
  {
    title: t('page.consultation.fields.visitStatus'),
    key: 'status',
    width: 120,
  },
  {
    title: t('page.consultation.fields.endTime'),
    dataIndex: 'endTime',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('page.consultation.table.action'),
    key: 'action',
    width: 170,
    fixed: 'right' as const,
  },
];

const appointmentStats = computed(() => ({
  total: appointments.value.length,
  booked: appointments.value.filter(item => item.status === 1).length,
  checkedIn: appointments.value.filter(item => item.status === 2).length,
  completed: appointments.value.filter(item => item.status === 3).length,
}));

async function loadDoctors() {
  try {
    doctorOptions.value = await loadDoctorOptions();
  } catch {
    doctorOptions.value = [];
  }
}

async function loadAppointments() {
  appointmentLoading.value = true;
  try {
    const params: any = {
      page: appointmentPagination.value.current,
      pageSize: appointmentPagination.value.pageSize,
      date: appointmentDate.value.format('YYYY-MM-DD'),
      scope: currentStaffScope,
    };
    if (filters.value.status !== undefined) params.status = filters.value.status;
    if (filters.value.keyword) params.keyword = filters.value.keyword;
    const data: any = await vpetAppointmentList(params);
    appointments.value = sortAppointmentsByTime(data?.items || []);
    appointmentPagination.value.total = data?.meta?.totalItems || 0;
  } finally {
    appointmentLoading.value = false;
  }
}

function sortAppointmentsByTime(items: any[]) {
  return items.slice().sort((a, b) => dayjs(a.appointmentTime).valueOf() - dayjs(b.appointmentTime).valueOf());
}

async function loadVisits() {
  visitLoading.value = true;
  try {
    const [startDate, endDate] = visitDateRange.value;
    const params: any = {
      page: visitPagination.value.current,
      pageSize: visitPagination.value.pageSize,
      keyword: filters.value.keyword || undefined,
      status: filters.value.status,
      scope: currentStaffScope,
    };
    if (startDate) params.dateFrom = startDate.startOf('day').format('YYYY-MM-DD HH:mm:ss');
    if (endDate) params.dateTo = endDate.endOf('day').format('YYYY-MM-DD HH:mm:ss');
    const data: any = await vpetVisitList(params);
    visits.value = data?.items || [];
    visitPagination.value.total = data?.meta?.totalItems || 0;
  } finally {
    visitLoading.value = false;
  }
}

async function reloadActiveTab() {
  if (activeTab.value === 'appointments') {
    appointmentPagination.value.current = 1;
    await loadAppointments();
    return;
  }
  visitPagination.value.current = 1;
  await loadVisits();
}

function resetFilters() {
  if (activeTab.value === 'appointments') {
    appointmentDate.value = dayjs();
  } else {
    visitDateRange.value = [dayjs(), dayjs()];
  }
  filters.value = {
    status: undefined,
    keyword: '',
  };
  reloadActiveTab();
}

function openVisit(id: number) {
  router.push({
    path: `/vpet/consultation/visit/${id}`,
    query: { scope: currentStaffScope },
  });
}

function openVisitPrint(id: number) {
  router.push(`/vpet/consultation/visit/${id}/print`);
}

async function openConsultation(record: any) {
  try {
    if (record.status === 1) {
      const visit: any = await vpetAppointmentCheckIn(record.id, { params: { scope: currentStaffScope } });
      openVisit(visit.id);
      return;
    }

    const data: any = await vpetVisitList({
      appointmentId: record.id,
      page: 1,
      pageSize: 1,
      scope: currentStaffScope,
    });
    const visit = data?.items?.[0];
    if (!visit?.id) {
      message.error(t('page.consultation.messages.visitNotFound'));
      return;
    }
    openVisit(visit.id);
  } catch {}
}

function editAppointment(record: any) {
  router.push('/vpet/appointment');
  message.info(
    t('page.consultation.messages.redirectToAppointmentEdit', {
      name: record.pet?.name || record.id,
    }),
  );
}

function handleAppointmentTableChange(pagination: any) {
  appointmentPagination.value.current = pagination.current;
  appointmentPagination.value.pageSize = pagination.pageSize;
  loadAppointments();
}

function handleVisitTableChange(pagination: any) {
  visitPagination.value.current = pagination.current;
  visitPagination.value.pageSize = pagination.pageSize;
  loadVisits();
}

watch(activeTab, () => {
  filters.value.status = undefined;
  reloadActiveTab();
});

onMounted(async () => {
  await loadDoctors();
  await Promise.all([loadAppointments(), loadVisits()]);
});
</script>
