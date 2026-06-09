<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.appointment.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.appointment.fields.date')">
          <a-date-picker v-model:value="filters.date" />
        </a-form-item>
        <a-form-item :label="t('page.appointment.fields.doctor')">
          <a-select
            v-model:value="filters.doctorId"
            allow-clear
            show-search
            style="width: 220px"
            :placeholder="t('page.appointment.doctorPlaceholder')"
            :options="doctorOptions"
            :filter-option="filterByLabel"
          />
        </a-form-item>
        <a-form-item :label="t('page.appointment.fields.status')">
          <a-select
            v-model:value="filters.status"
            allow-clear
            style="width: 180px"
            :placeholder="t('page.appointment.statusPlaceholder')"
            :options="appointmentStatusOptions"
          />
        </a-form-item>
        <a-form-item :label="t('page.appointment.fields.keyword')">
          <a-input
            v-model:value="filters.keyword"
            allow-clear
            :placeholder="t('page.appointment.keywordPlaceholder')"
            @pressEnter="reloadTable"
          />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCreateModal()">
              <Icon icon="ant-design:plus-outlined" />
              {{ t('page.appointment.create') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <DynamicTable
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
import { computed, onMounted, ref } from 'vue';
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

const filters = ref({
  date: dayjs() as Dayjs,
  doctorId: undefined as number | undefined,
  status: undefined as number | undefined,
  keyword: '',
});

const customerOptions = ref<SelectOption[]>([]);
const petOptions = ref<SelectOption[]>([]);
const doctorOptions = ref<SelectOption[]>([]);

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
    page: params.page,
    pageSize: params.pageSize,
    date: filters.value.date.format('YYYY-MM-DD'),
  };
  if (filters.value.status !== undefined) query.status = filters.value.status;
  if (filters.value.doctorId) query.doctorId = filters.value.doctorId;
  if (filters.value.keyword) query.keyword = filters.value.keyword;
  const data: any = await vpetAppointmentList(query);
  return data || { items: [], meta: {} };
};

function reloadTable() {
  dynamicTableInstance?.reload();
}

function resetFilters() {
  filters.value = {
    date: dayjs(),
    doctorId: undefined,
    status: undefined,
    keyword: '',
  };
  reloadTable();
}

async function openCreateModal(record: any = {}) {
  const isUpdate = Boolean(record.id);
  if (!customerOptions.value.length) customerOptions.value = await loadCustomers();
  if (!doctorOptions.value.length) doctorOptions.value = await loadDoctors();
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
        reloadTable();
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
      appointmentTime: filters.value.date.hour(9).minute(0).second(0),
    });
  }
}

async function checkIn(record: any) {
  const visit: any = await vpetAppointmentCheckIn(record.id);
  message.success(t('page.appointment.messages.checkedIn', { queueNumber: visit?.queueNumber || '-' }));
  reloadTable();
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
  reloadTable();
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
  [customerOptions.value, doctorOptions.value] = await Promise.all([loadCustomers(), loadDoctors()]);
});
</script>
