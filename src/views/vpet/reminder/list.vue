<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.reminder.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.reminder.fields.status')">
          <a-select v-model:value="filters.status" allow-clear :options="reminderStatusOptions" />
        </a-form-item>
        <a-form-item :label="t('page.reminder.fields.keyword')">
          <a-input v-model:value="filters.keyword" allow-clear @pressEnter="loadData" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadData">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCreateModal">{{ t('page.reminder.create') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card class="vpet-panel-card vpet-list-card" :bordered="false">
      <a-table row-key="id" :loading="loading" :columns="columns" :data-source="records" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'petCustomer'">
            <div style="font-weight: 600">{{ petLabel(record.pet, record.petSnapshot, record.petId) }}</div>
            <div class="vpet-muted">{{ customerLabel(record.customer, record.customerSnapshot, record.customerId) }}</div>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="reminderStatusColor(record.status)">{{ reminderStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="markComplete(record)">{{ t('page.reminder.complete') }}</a-button>
              <a-button type="link" size="small" danger @click="cancelReminder(record)">{{ t('page.reminder.cancel') }}</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useFormModal } from '@/hooks/useModal';
import { vpetReminderCancel, vpetReminderComplete, vpetReminderCreate, vpetReminderList } from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetReminderList' });

const { t, reminderStatusColor, reminderStatusOptions, reminderStatusText } = useVpetLocale();
const {
  customerLabel,
  loadCustomers: loadCustomerOptions,
  loadPets: loadPetOptions,
  loadVisits,
  loadDictOptions,
  getVisitRelation,
  optionLabel,
  petLabel,
} = useVpetReference();
const [showModal] = useFormModal();
const loading = ref(false);
const records = ref<any[]>([]);
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const filters = ref({ status: undefined as number | undefined, keyword: '' });
const customerOptions = ref<any[]>([]);
const petOptions = ref<any[]>([]);
const visitOptions = ref<any[]>([]);
const reminderTypeOptions = ref<any[]>([]);
const reminderChannelOptions = ref<any[]>([]);

const visitMap = computed(() => {
  const map = new Map<number, any>();
  visitOptions.value.forEach((item: any) => {
    map.set(Number(item.value), item.raw);
  });
  return map;
});

const columns = [
  { title: t('page.reminder.fields.reminderName'), dataIndex: 'reminderName' },
  { title: t('page.reminder.fields.pet'), key: 'petCustomer', width: 220 },
  {
    title: t('page.reminder.fields.type'),
    dataIndex: 'type',
    width: 100,
    customRender: ({ text }: any) => optionLabel(reminderTypeOptions.value, text, text || '-'),
  },
  {
    title: t('page.reminder.fields.channel'),
    dataIndex: 'channel',
    width: 100,
    customRender: ({ text }: any) => optionLabel(reminderChannelOptions.value, text, text || '-'),
  },
  { title: t('page.reminder.fields.dueDate'), dataIndex: 'dueDate', width: 160, customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-') },
  { title: t('page.reminder.fields.status'), key: 'status', width: 120 },
  { title: t('common.action'), key: 'action', width: 160 },
];

async function loadMasterData() {
  [customerOptions.value, visitOptions.value, reminderTypeOptions.value, reminderChannelOptions.value] = await Promise.all([
    loadCustomerOptions(),
    loadVisits(),
    loadDictOptions('vpet_reminder_type', 'number'),
    loadDictOptions('vpet_reminder_channel'),
  ]);
}

async function loadData() {
  loading.value = true;
  try {
    const data: any = await vpetReminderList({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      status: filters.value.status,
      keyword: filters.value.keyword || undefined,
    });
    records.value = data?.items || [];
    pagination.value.total = data?.meta?.totalItems || 0;
  } finally {
    loading.value = false;
  }
}

function handleTableChange(page: any) {
  pagination.value.current = page.current;
  pagination.value.pageSize = page.pageSize;
  loadData();
}

function resetFilters() {
  filters.value = { status: undefined, keyword: '' };
  pagination.value.current = 1;
  loadData();
}

async function openCreateModal() {
  if (!customerOptions.value.length) await loadMasterData();
  const [formRef] = await showModal({
    modalProps: {
      title: t('page.reminder.create'),
      width: 760,
      onFinish: async (values: any) => {
        const body = {
          ...values,
          dueDate: values.dueDate?.format ? values.dueDate.format('YYYY-MM-DD') : values.dueDate,
        };
        await vpetReminderCreate(body);
        message.success(t('page.reminder.messages.created'));
        loadData();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'visitId', label: t('page.reminder.fields.visit'), component: 'Select', colProps: { span: 12 }, componentProps: { options: visitOptions.value, showSearch: true, optionFilterProp: 'label', allowClear: true } },
        { field: 'customerId', label: t('page.reminder.fields.customer'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: customerOptions.value, showSearch: true, optionFilterProp: 'label' } },
        { field: 'petId', label: t('page.reminder.fields.pet'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: petOptions.value, showSearch: true, optionFilterProp: 'label' } },
        { field: 'type', label: t('page.reminder.fields.type'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: reminderTypeOptions.value } },
        { field: 'channel', label: t('page.reminder.fields.channel'), component: 'Select', colProps: { span: 12 }, componentProps: { options: reminderChannelOptions.value, allowClear: true } },
        { field: 'reminderName', label: t('page.reminder.fields.reminderName'), component: 'Input', required: true, colProps: { span: 12 } },
        { field: 'dueDate', label: t('page.reminder.fields.dueDate'), component: 'DatePicker', required: true, colProps: { span: 12 }, componentProps: { style: { width: '100%' } } },
        { field: 'remark', label: t('page.reminder.fields.remark'), component: 'InputTextArea', colProps: { span: 24 } },
      ],
    },
  });

  formRef?.updateSchema([
    {
      field: 'customerId',
      componentProps: {
        options: customerOptions.value,
        showSearch: true,
        optionFilterProp: 'label',
        onChange: async (value: number) => {
          formRef?.setFieldsValue({ petId: undefined });
          petOptions.value = await loadPetOptions(value);
          formRef?.updateSchema([{ field: 'petId', componentProps: { options: petOptions.value, showSearch: true, optionFilterProp: 'label' } }]);
        },
      },
    },
    {
      field: 'visitId',
      componentProps: {
        options: visitOptions.value,
        showSearch: true,
        optionFilterProp: 'label',
        allowClear: true,
        onChange: async (value?: number) => {
          if (!value) return;
          const visit = visitMap.value.get(Number(value));
          const relation = getVisitRelation(visit);
          petOptions.value = await loadPetOptions(relation.customerId);
          formRef?.updateSchema([{ field: 'petId', componentProps: { options: petOptions.value, showSearch: true, optionFilterProp: 'label' } }]);
          formRef?.setFieldsValue({ customerId: relation.customerId, petId: relation.petId });
        },
      },
    },
  ]);
}

async function markComplete(record: any) {
  await vpetReminderComplete(record.id);
  message.success(t('page.reminder.messages.completed'));
  loadData();
}

async function cancelReminder(record: any) {
  await vpetReminderCancel(record.id);
  message.success(t('page.reminder.messages.cancelled'));
  loadData();
}

onMounted(async () => {
  await loadMasterData();
  await loadData();
});
</script>
