<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.appointment.title')" :bordered="false">
      <a-form class="vpet-query-form vpet-appointment-query" layout="horizontal">
        <div class="appointment-query-fields">
          <a-form-item :label="t('page.appointment.fields.date')">
            <a-date-picker v-model:value="filters.date" />
          </a-form-item>
          <a-form-item :label="t('page.appointment.fields.doctor')">
            <a-select
              v-model:value="filters.doctorId"
              allow-clear
              show-search
              :placeholder="t('page.appointment.doctorPlaceholder')"
              :options="doctorOptions"
              :filter-option="filterByLabel"
            />
          </a-form-item>
          <a-form-item :label="t('page.appointment.fields.status')">
            <a-select
              v-model:value="filters.status"
              allow-clear
              :placeholder="t('page.appointment.statusPlaceholder')"
              :options="appointmentStatusOptions"
            />
          </a-form-item>
          <a-form-item :label="t('page.appointment.fields.keyword')">
            <a-input
              v-model:value="filters.keyword"
              allow-clear
              :placeholder="t('page.appointment.keywordPlaceholder')"
              @pressEnter="reloadAppointments"
            />
          </a-form-item>
        </div>
        <div class="vpet-query-actions">
          <a-space>
            <a-radio-group v-model:value="viewMode" button-style="solid" @change="handleViewModeChange">
              <a-radio-button value="grid">{{ t('page.appointment.viewModes.grid') }}</a-radio-button>
              <a-radio-button value="list">{{ t('page.appointment.viewModes.list') }}</a-radio-button>
            </a-radio-group>
            <a-button type="primary" @click="reloadAppointments">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCreateModal()">
              <Icon icon="ant-design:plus-outlined" />
              {{ t('page.appointment.create') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card v-if="viewMode === 'grid'" class="vpet-panel-card vpet-appointment-board" :bordered="false">
      <a-spin :spinning="scheduleLoading">
        <div class="appointment-night-toggle">
          <a-button
            size="small"
            :disabled="hasNightAppointments"
            @click="nightExpandedManually = !nightExpandedManually"
          >
            {{ nightRangeExpanded ? t('page.appointment.collapseNightRange') : t('page.appointment.expandNightRange') }}
          </a-button>
          <span class="appointment-night-toggle__hint">
            {{ hasNightAppointments ? t('page.appointment.nightRangeHasAppointments') : t('page.appointment.nightRangeHint') }}
          </span>
        </div>
        <div class="appointment-sticky-header" aria-hidden="true">
          <div class="appointment-sticky-header__grid" :style="scheduleStickyHeaderStyle">
            <div class="appointment-grid__head appointment-grid__time-head">{{ t('page.appointment.fields.appointmentTime') }}</div>
            <div
              v-for="doctor in visibleDoctorOptions"
              :key="doctor.value"
              class="appointment-grid__head appointment-grid__doctor-head"
            >
              {{ doctor.label }}
            </div>
          </div>
        </div>
        <div ref="scheduleScrollRef" class="appointment-grid-scroll" @scroll="handleScheduleScroll">
          <div class="appointment-grid" :style="scheduleGridStyle">
            <template v-for="slot in visibleTimeSlots" :key="slot.key">
              <div
                class="appointment-grid__time"
                :class="{ 'is-compact': !slotHasAppointments(slot.key), 'is-night-collapsed': slot.isNightCollapsed }"
                @click="slot.isNightCollapsed && (nightExpandedManually = true)"
              >
                <span>{{ slot.label }}</span>
                <a-button v-if="slot.isNightCollapsed" type="link" size="small">
                  {{ t('page.appointment.expandNightRangeShort') }}
                </a-button>
              </div>
              <div
                v-for="doctor in visibleDoctorOptions"
                :key="`${slot.key}-${doctor.value}`"
                class="appointment-grid__cell"
                :class="{ 'is-compact': !slotHasAppointments(slot.key), 'is-night-collapsed': slot.isNightCollapsed }"
              >
                <button
                  v-if="slot.isNightCollapsed"
                  type="button"
                  class="appointment-grid__night-action"
                  @click="nightExpandedManually = true"
                >
                  {{ t('page.appointment.expandNightRangeAction') }}
                </button>
                <div v-else-if="appointmentsInCell(slot.key, doctor.value).length" class="appointment-grid__cards">
                  <div v-for="record in appointmentsInCell(slot.key, doctor.value)" :key="record.id" class="appointment-card">
                    <div class="appointment-card__top">
                      <strong>{{ appointmentTimeText(record.appointmentTime) }}</strong>
                      <a-tag :color="appointmentStatusColor(record.status)">{{ appointmentStatusText(record.status) }}</a-tag>
                    </div>
                    <div class="appointment-card__pet">{{ petLabel(record.pet, record.petSnapshot, record.petId) }}</div>
                    <div class="appointment-card__customer">{{ customerLabel(record.customer, record.customerSnapshot, record.customerId) }}</div>
                    <div class="appointment-card__reason">{{ record.reason || '-' }}</div>
                    <a-space size="small" class="appointment-card__actions">
                      <a-button size="small" type="link" @click="openVisit(record)">{{ t('page.appointment.table.openRecord') }}</a-button>
                      <a-button v-if="record.status === 1" size="small" type="link" @click="checkIn(record)">{{ t('page.appointment.table.checkIn') }}</a-button>
                      <a-button v-if="record.status === 1" size="small" type="link" @click="openCreateModal(record)">{{ t('common.edit') }}</a-button>
                      <a-button v-if="record.status === 1" size="small" type="link" danger @click="cancelAppointment(record)">{{ t('page.appointment.table.cancel') }}</a-button>
                    </a-space>
                  </div>
                </div>
                <button
                  v-else
                  type="button"
                  class="appointment-grid__add"
                  :title="t('page.appointment.addInSlot')"
                  @click="openCreateModal({}, { doctorId: Number(doctor.value), appointmentTime: slot.dateTime })"
                >
                  <Icon icon="ant-design:plus-outlined" />
                </button>
              </div>
            </template>
          </div>
        </div>
      </a-spin>
    </a-card>

    <DynamicTable
      v-if="viewMode === 'list'"
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.appointment.list')"
      show-index
      :data-request="loadTableData"
      :columns="columns"
      :search="false"
    />
  </div>
</template>

<script setup lang="tsx">
import dayjs, { type Dayjs } from 'dayjs';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { Tag, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useTable } from '@/components/core/dynamic-table';
import { useFormModal } from '@/hooks/useModal';
import Icon from '@/components/basic/icon/Icon.vue';
import {
  vpetAppointmentCancel,
  vpetAppointmentCheckIn,
  vpetAppointmentCreate,
  vpetAppointmentList,
  vpetAppointmentUpdate,
  vpetVisitList,
} from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetAppointment' });

type SelectOption = {
  value: number | string;
  label: string;
};

type AppointmentViewMode = 'grid' | 'list';

const { t, appointmentStatusColor, appointmentStatusOptions, appointmentStatusText } = useVpetLocale();
const {
  customerLabel,
  doctorLabel,
  filterByLabel,
  loadCustomers,
  loadDoctors,
  loadPets,
  loadDictOptions,
  petLabel,
} = useVpetReference();
const router = useRouter();
const [DynamicTable, dynamicTableInstance] = useTable();
const [showModal] = useFormModal();

const viewMode = ref<AppointmentViewMode>('grid');
const scheduleLoading = ref(false);
const scheduleAppointments = ref<any[]>([]);
const scheduleScrollRef = ref<HTMLElement>();
const scheduleScrollLeft = ref(0);
const nightExpandedManually = ref(false);
const filters = ref({
  date: dayjs() as Dayjs,
  doctorId: undefined as number | undefined,
  status: undefined as number | undefined,
  keyword: '',
});

const customerOptions = ref<SelectOption[]>([]);
const petOptions = ref<SelectOption[]>([]);
const doctorOptions = ref<SelectOption[]>([]);

const visibleDoctorOptions = computed(() => {
  if (!filters.value.doctorId) return doctorOptions.value;
  return doctorOptions.value.filter(item => Number(item.value) === Number(filters.value.doctorId));
});

const scheduleGridStyle = computed(() => {
  const doctorCount = visibleDoctorOptions.value.length || 1;
  return {
    '--doctor-count': doctorCount,
    minWidth: `${82 + doctorCount * 240}px`,
  };
});

const scheduleStickyHeaderStyle = computed(() => ({
  ...scheduleGridStyle.value,
  transform: `translateX(-${scheduleScrollLeft.value}px)`,
}));

const timeSlots = computed(() => {
  const baseDate = filters.value.date || dayjs();
  return Array.from({ length: 48 }, (_, index) => {
    const slotTime = baseDate.startOf('day').add(index * 30, 'minute');
    return {
      key: slotTime.format('HH:mm'),
      label: slotTime.format('HH:mm'),
      dateTime: slotTime,
    };
  });
});

const nightEndHour = 9;
const nightSlotKeys = computed(() => timeSlots.value
  .filter(slot => dayjs(slot.dateTime).hour() < nightEndHour)
  .map(slot => slot.key));
const hasNightAppointments = computed(() =>
  scheduleAppointments.value.some(record => nightSlotKeys.value.includes(slotKeyOf(record.appointmentTime))),
);
const nightRangeExpanded = computed(() => hasNightAppointments.value || nightExpandedManually.value);
const visibleTimeSlots = computed(() => {
  if (nightRangeExpanded.value)
    return timeSlots.value;
  return [
    {
      key: 'night-collapsed',
      label: '00:00-09:00',
      dateTime: (filters.value.date || dayjs()).startOf('day'),
      isNightCollapsed: true,
    },
    ...timeSlots.value.filter(slot => !nightSlotKeys.value.includes(slot.key)),
  ];
});

function handleScheduleScroll(event: Event) {
  scheduleScrollLeft.value = (event.currentTarget as HTMLElement).scrollLeft;
}

function resetScheduleScroll() {
  scheduleScrollLeft.value = 0;
  if (scheduleScrollRef.value) scheduleScrollRef.value.scrollLeft = 0;
}

async function syncPetField(formRef: any, customerId?: number) {
  petOptions.value = await loadPets(customerId);
  formRef?.updateSchema([
    {
      field: 'petId',
      componentProps: {
        options: petOptions.value,
        disabled: !customerId,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: customerId
          ? t('page.appointment.placeholders.pet')
          : t('page.appointment.placeholders.selectCustomerFirst'),
        style: { width: '100%' },
      },
    },
  ]);
}

const loadTableData = async (params: any) => {
  const query: any = {
    page: params.page || 1,
    pageSize: 100,
    date: filters.value.date.format('YYYY-MM-DD'),
  };
  if (filters.value.status !== undefined) query.status = filters.value.status;
  if (filters.value.doctorId) query.doctorId = filters.value.doctorId;
  if (filters.value.keyword) query.keyword = filters.value.keyword;
  const data: any = await vpetAppointmentList(query);
  if (Array.isArray(data?.items)) {
    data.items = sortAppointmentsByTime(data.items);
  }
  return data || { items: [], meta: {} };
};

function buildAppointmentQuery() {
  const query: any = {
    page: 1,
    pageSize: 100,
    date: filters.value.date.format('YYYY-MM-DD'),
  };
  if (filters.value.status !== undefined) query.status = filters.value.status;
  if (filters.value.doctorId) query.doctorId = filters.value.doctorId;
  if (filters.value.keyword) query.keyword = filters.value.keyword;
  return query;
}

async function loadScheduleAppointments() {
  resetScheduleScroll();
  scheduleLoading.value = true;
  try {
    const data: any = await vpetAppointmentList(buildAppointmentQuery());
    scheduleAppointments.value = sortAppointmentsByTime(data?.items || []);
  } finally {
    scheduleLoading.value = false;
  }
}

function sortAppointmentsByTime(items: any[]) {
  return items.slice().sort((a, b) => dayjs(a.appointmentTime).valueOf() - dayjs(b.appointmentTime).valueOf());
}

function reloadTable() {
  if (viewMode.value === 'list') dynamicTableInstance?.reload();
}

async function handleViewModeChange() {
  await nextTick();
  await reloadAppointments();
}

async function reloadAppointments() {
  if (viewMode.value === 'grid') {
    await loadScheduleAppointments();
    return;
  }
  reloadTable();
}

function resetFilters() {
  nightExpandedManually.value = false;
  filters.value = {
    date: dayjs(),
    doctorId: undefined,
    status: undefined,
    keyword: '',
  };
  reloadAppointments();
}

function slotKeyOf(appointmentTime?: string) {
  const value = appointmentTime ? dayjs(appointmentTime) : dayjs();
  const flooredMinute = value.minute() < 30 ? 0 : 30;
  return value.minute(flooredMinute).second(0).format('HH:mm');
}

function appointmentsInCell(slotKey: string, doctorId: number | string) {
  return scheduleAppointments.value.filter(record =>
    slotKeyOf(record.appointmentTime) === slotKey
    && Number(record.doctorId) === Number(doctorId),
  );
}

function slotHasAppointments(slotKey: string) {
  if (slotKey === 'night-collapsed')
    return false;
  return scheduleAppointments.value.some(record => slotKeyOf(record.appointmentTime) === slotKey);
}

function appointmentTimeText(value?: string) {
  return value ? dayjs(value).format('HH:mm') : '-';
}

async function openCreateModal(record: any = {}, preset: { doctorId?: number; appointmentTime?: Dayjs } = {}) {
  const isUpdate = Boolean(record.id);
  if (!customerOptions.value.length) customerOptions.value = await loadCustomers();
  if (!doctorOptions.value.length) doctorOptions.value = await loadDoctors({ bookableOnly: true });
  const visitTypeOptions = await loadDictOptions('pet_visit_type');

  const schemas: any[] = [
    {
      field: 'customerId',
      label: t('page.appointment.fields.customer'),
      component: 'Select',
      required: true,
      colProps: { span: 12 },
      componentProps: {
        options: customerOptions.value,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: t('page.appointment.placeholders.customer'),
        style: { width: '100%' },
      },
    },
    {
      field: 'petId',
      label: t('page.appointment.fields.pet'),
      component: 'Select',
      required: true,
      colProps: { span: 12 },
      componentProps: {
        options: petOptions.value,
        disabled: true,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: t('page.appointment.placeholders.selectCustomerFirst'),
        style: { width: '100%' },
      },
    },
    {
      field: 'doctorId',
      label: t('page.appointment.fields.doctor'),
      component: 'Select',
      colProps: { span: 12 },
      componentProps: {
        options: doctorOptions.value,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: t('page.appointment.placeholders.doctor'),
        style: { width: '100%' },
      },
    },
    {
      field: 'appointmentTime',
      label: t('page.appointment.fields.appointmentTime'),
      component: 'DatePicker',
      required: true,
      colProps: { span: 12 },
      componentProps: {
        showTime: true,
        style: { width: '100%' },
      },
    },
    {
      field: 'visitType',
      label: t('page.appointment.fields.visitType'),
      component: 'Select',
      colProps: { span: 12 },
      componentProps: {
        options: visitTypeOptions,
        placeholder: t('page.appointment.placeholders.visitType'),
        style: { width: '100%' },
      },
    },
    {
      field: 'reason',
      label: t('page.appointment.fields.reason'),
      component: 'Input',
      colProps: { span: 12 },
    },
    {
      field: 'remark',
      label: t('page.appointment.fields.remark'),
      component: 'InputTextArea',
      colProps: { span: 24 },
    },
  ];

  const [formRef] = await showModal({
    modalProps: {
      title: isUpdate ? t('page.appointment.edit') : t('page.appointment.create'),
      width: 760,
      onFinish: async (values: any) => {
        const body = {
          ...values,
          appointmentTime: values.appointmentTime?.format
            ? values.appointmentTime.format('YYYY-MM-DD HH:mm:ss')
            : values.appointmentTime,
        };
        if (isUpdate) {
          await vpetAppointmentUpdate(record.id, body);
        } else {
          await vpetAppointmentCreate(body);
        }
        message.success(t(isUpdate ? 'page.appointment.messages.updated' : 'page.appointment.messages.created'));
        await reloadAppointments();
      },
    },
    formProps: { labelWidth: 110, schemas, autoSubmitOnEnter: true },
  });

  formRef?.updateSchema([
    {
      field: 'customerId',
      componentProps: {
        options: customerOptions.value,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: t('page.appointment.placeholders.customer'),
        style: { width: '100%' },
        onChange: async (customerId: number) => {
          formRef?.setFieldsValue({ petId: undefined });
          await syncPetField(formRef, customerId);
        },
      },
    },
  ]);

  if (isUpdate) {
    await syncPetField(formRef, record.customerId);
    formRef?.setFieldsValue({
      ...record,
      appointmentTime: record.appointmentTime ? dayjs(record.appointmentTime) : undefined,
    });
  } else {
    await syncPetField(formRef);
    formRef?.setFieldsValue({
      doctorId: preset.doctorId,
      appointmentTime: preset.appointmentTime || filters.value.date.hour(9).minute(0).second(0),
    });
  }
}

async function checkIn(record: any) {
  const visit: any = await vpetAppointmentCheckIn(record.id);
  message.success(t('page.appointment.messages.checkedIn', { queueNumber: visit?.queueNumber || '-' }));
  await reloadAppointments();
}

async function openVisit(record: any) {
  if (record.status === 1) {
    const visit: any = await vpetAppointmentCheckIn(record.id);
    router.push(`/vpet/consultation/visit/${visit.id}`);
    return;
  }

  const data: any = await vpetVisitList({ appointmentId: record.id, page: 1, pageSize: 1 });
  const visit = data?.items?.[0];
  if (!visit?.id) {
    message.error(t('page.appointment.messages.notFoundVisit'));
    return;
  }
  router.push(`/vpet/consultation/visit/${visit.id}`);
}

async function cancelAppointment(record: any) {
  await vpetAppointmentCancel(record.id);
  message.success(t('page.appointment.messages.cancelled'));
  await reloadAppointments();
}

function doctorText(record: any) {
  return doctorLabel(record.doctor, record.doctorId, record.doctorName, doctorOptions.value);
}

function statusRender(status?: number) {
  return <Tag color={appointmentStatusColor(status)}>{appointmentStatusText(status)}</Tag>;
}

const columns = [
  {
    title: t('page.appointment.fields.appointmentTime'),
    dataIndex: 'appointmentTime',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('page.appointment.fields.customer'),
    dataIndex: 'customerId',
    width: 180,
    customRender: ({ record }: any) => customerLabel(record.customer, record.customerSnapshot, record.customerId),
  },
  {
    title: t('page.appointment.fields.pet'),
    dataIndex: 'petId',
    width: 220,
    customRender: ({ record }: any) => petLabel(record.pet, record.petSnapshot, record.petId),
  },
  {
    title: t('page.appointment.fields.reason'),
    dataIndex: 'reason',
    customRender: ({ text }: any) => text || '-',
  },
  {
    title: t('page.appointment.table.doctor'),
    dataIndex: 'doctorId',
    width: 220,
    customRender: ({ record }: any) => doctorText(record),
  },
  {
    title: t('page.appointment.fields.status'),
    dataIndex: 'status',
    width: 120,
    customRender: ({ record }: any) => statusRender(record.status),
  },
  {
    title: t('page.appointment.table.action'),
    width: 220,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:file-search-outlined' as const,
        tooltip: t('page.appointment.table.openRecord'),
        onClick: () => openVisit(record),
      },
      ...(record.status === 1
        ? [
            {
              icon: 'ant-design:check-circle-outlined' as const,
              tooltip: t('page.appointment.table.checkIn'),
              onClick: () => checkIn(record),
            },
            {
              icon: 'ant-design:edit-outlined' as const,
              tooltip: t('common.edit'),
              onClick: () => openCreateModal(record),
            },
            {
              icon: 'ant-design:close-circle-outlined' as const,
              tooltip: t('page.appointment.table.cancel'),
              onClick: () => cancelAppointment(record),
            },
          ]
        : []),
    ],
  },
];

onMounted(async () => {
  [customerOptions.value, doctorOptions.value] = await Promise.all([loadCustomers(), loadDoctors({ bookableOnly: true })]);
  await loadScheduleAppointments();
});

watch(
  () => filters.value.date?.format('YYYY-MM-DD'),
  () => {
    nightExpandedManually.value = false;
  },
);
</script>

<style scoped lang="less">
.vpet-appointment-query {
  display: block;

  :deep(.ant-form-item) {
    grid-column: auto;
    min-width: 0;
  }

  :deep(.ant-form-item-row) {
    grid-template-columns: 76px minmax(0, 1fr);
    column-gap: 8px;
  }

  :deep(.ant-form-item-label > label) {
    height: 34px;
    font-size: 12px;
  }

  :deep(.ant-form-item-control-input) {
    min-height: 34px;
  }
}

.appointment-query-fields {
  display: grid;
  grid-template-columns: minmax(132px, 0.85fr) minmax(188px, 1.15fr) minmax(132px, 0.85fr) minmax(210px, 1.35fr);
  gap: 10px 14px;
  align-items: center;
}

.vpet-appointment-query .vpet-query-actions {
  margin-top: 10px;
  padding-top: 0;
}

.vpet-appointment-board {
  overflow: visible;

  :deep(.ant-card-body),
  :deep(.ant-spin-nested-loading),
  :deep(.ant-spin-container) {
    min-width: 0;
  }

  :deep(.ant-card-body) {
    overflow: visible;
  }
}

.appointment-night-toggle {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  color: #667085;
  font-size: 12px;
}

.appointment-night-toggle__hint {
  line-height: 1.6;
}

.appointment-grid-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
}

.appointment-sticky-header {
  position: sticky;
  top: -20px;
  z-index: 20;
  overflow: hidden;
  border: 1px solid #edf0f5;
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  background: #f8fafc;
  box-shadow: 0 8px 18px rgb(15 23 42 / 8%);
}

.appointment-sticky-header__grid {
  display: grid;
  grid-template-columns: 82px repeat(var(--doctor-count), minmax(220px, 1fr));
  min-width: 100%;
  will-change: transform;
}

.appointment-grid {
  display: grid;
  grid-template-columns: 82px repeat(var(--doctor-count), minmax(220px, 1fr));
  min-width: 100%;
  border: 1px solid #edf0f5;
  border-radius: 0 0 12px 12px;
  background: #fff;
}

.appointment-grid__head,
.appointment-grid__time,
.appointment-grid__cell {
  border-right: 1px solid #edf0f5;
  border-bottom: 1px solid #edf0f5;
}

.appointment-grid__head {
  min-height: 44px;
  padding: 10px 12px;
  background: #f8fafc;
  color: #24324b;
  font-weight: 600;
}

.appointment-grid__time-head {
  box-shadow: 1px 0 0 #edf0f5;
}

.appointment-grid__doctor-head {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appointment-grid__time {
  position: sticky;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 116px;
  padding-top: 12px;
  background: #fbfcfe;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}

.appointment-grid__time.is-compact {
  min-height: 38px;
  padding-top: 9px;
}

.appointment-grid__time.is-night-collapsed {
  min-height: 44px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding-top: 6px;
  color: #344054;
  background: #f8fafc;
}

.appointment-grid__cell {
  display: flex;
  min-height: 116px;
  padding: 8px;
  background: #fff;
}

.appointment-grid__cell.is-compact {
  min-height: 38px;
  padding: 5px 8px;
}

.appointment-grid__cell.is-night-collapsed {
  min-height: 44px;
  align-items: center;
}

.appointment-grid__night-action {
  display: flex;
  width: 100%;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d8e1ee;
  border-radius: 8px;
  background: #fbfdff;
  color: #667085;
  cursor: pointer;
  font-size: 12px;
}

.appointment-grid__night-action:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.appointment-grid__cards {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
}

.appointment-grid__add {
  display: flex;
  width: 100%;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px dashed #c9d4e5;
  border-radius: 8px;
  background: #fbfdff;
  color: #6b7a90;
  cursor: pointer;
  transition: all 0.18s ease;
}

.appointment-grid__add:hover {
  border-color: #1677ff;
  color: #1677ff;
  background: #f0f7ff;
}

.appointment-card {
  width: 100%;
  padding: 10px;
  border: 1px solid #dbe7f6;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
  box-shadow: 0 4px 12px rgb(27 57 106 / 6%);
}

.appointment-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.appointment-card__pet {
  margin-top: 6px;
  color: #1f2a44;
  font-weight: 600;
}

.appointment-card__customer,
.appointment-card__reason {
  margin-top: 3px;
  color: #667085;
  font-size: 12px;
}

.appointment-card__reason {
  color: #344054;
}

.appointment-card__actions {
  margin-top: 6px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .appointment-query-fields {
    grid-template-columns: 1fr;
  }
}
</style>
