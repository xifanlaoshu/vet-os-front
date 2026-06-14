<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.insurance.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.insurance.fields.status')">
          <a-select v-model:value="filters.status" allow-clear :options="insuranceStatusOptions" />
        </a-form-item>
        <a-form-item :label="t('page.insurance.fields.keyword')">
          <a-input v-model:value="filters.keyword" allow-clear @pressEnter="loadData" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadData">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCreateModal">{{ t('page.insurance.create') }}</a-button>
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
            <a-tag :color="insuranceStatusColor(record.status)">{{ insuranceStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openDetail(record)">{{ t('common.detail') }}</a-button>
              <a-button type="link" size="small" @click="submitClaim(record)">{{ t('page.insurance.submit') }}</a-button>
              <a-button type="link" size="small" @click="openSettleModal(record)">{{ t('page.insurance.settle') }}</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailVisible" :title="t('page.insurance.detail')" width="680" destroy-on-close>
      <a-descriptions :column="2" size="small" bordered>
        <a-descriptions-item :label="t('page.insurance.fields.claimNo')">{{ detailRecord?.claimNo || '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.status')">
          <a-tag :color="insuranceStatusColor(detailRecord?.status)">{{ insuranceStatusText(detailRecord?.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.providerName')">{{ detailRecord?.providerName || '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.policyNo')">{{ detailRecord?.policyNo || '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.customer')">{{ customerLabel(detailRecord?.customer, detailRecord?.customerSnapshot, detailRecord?.customerId) }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.pet')">{{ petLabel(detailRecord?.pet, detailRecord?.petSnapshot, detailRecord?.petId) }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.visit')">{{ detailRecord?.visit?.visitNo || detailRecord?.visitId || '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.billing')">{{ detailRecord?.billing?.billNo || detailRecord?.billingId || '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.claimAmount')">{{ Number(detailRecord?.claimAmount || 0).toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.approvedAmount')">{{ Number(detailRecord?.approvedAmount || 0).toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.submittedAt')">{{ detailRecord?.submittedAt ? formatToDateTime(detailRecord.submittedAt) : '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.settledAt')">{{ detailRecord?.settledAt ? formatToDateTime(detailRecord.settledAt) : '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.insurance.fields.remark')" :span="2">{{ detailRecord?.remark || '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useFormModal } from '@/hooks/useModal';
import {
  vpetInsuranceCreate,
  vpetInsuranceGet,
  vpetInsuranceList,
  vpetInsuranceSettle,
  vpetInsuranceSubmit,
} from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetInsuranceList' });

const { t, insuranceStatusColor, insuranceStatusOptions, insuranceStatusText } = useVpetLocale();
const { customerLabel, loadCustomers, loadPets, loadVisits, getVisitRelation, petLabel } = useVpetReference();
const [showModal] = useFormModal();
const loading = ref(false);
const records = ref<any[]>([]);
const detailVisible = ref(false);
const detailRecord = ref<any>(null);
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const filters = ref({ status: undefined as number | undefined, keyword: '' });
const customerOptions = ref<any[]>([]);
const petOptions = ref<any[]>([]);
const visitOptions = ref<any[]>([]);
const visitMap = computed(() => {
  const map = new Map<number, any>();
  visitOptions.value.forEach((item: any) => {
    map.set(Number(item.value), item.raw);
  });
  return map;
});

const columns = [
  { title: t('page.insurance.fields.claimNo'), dataIndex: 'claimNo', width: 170 },
  { title: t('page.insurance.fields.providerName'), dataIndex: 'providerName', width: 180 },
  { title: t('page.insurance.fields.pet'), key: 'petCustomer', width: 220 },
  { title: t('page.insurance.fields.claimAmount'), dataIndex: 'claimAmount', width: 120 },
  { title: t('page.insurance.fields.approvedAmount'), dataIndex: 'approvedAmount', width: 120 },
  { title: t('page.insurance.fields.status'), key: 'status', width: 120 },
  { title: t('common.action'), key: 'action', width: 220 },
];

async function loadMasterData() {
  [customerOptions.value, visitOptions.value] = await Promise.all([
    loadCustomers(),
    loadVisits(),
  ]);
}

async function loadData() {
  loading.value = true;
  try {
    const data: any = await vpetInsuranceList({
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

async function openDetail(record: any) {
  detailRecord.value = await vpetInsuranceGet(record.id);
  detailVisible.value = true;
}

async function openCreateModal() {
  if (!customerOptions.value.length || !visitOptions.value.length) await loadMasterData();
  const [formRef] = await showModal({
    modalProps: {
      title: t('page.insurance.create'),
      width: 760,
      onFinish: async (values: any) => {
        await vpetInsuranceCreate(values);
        message.success(t('page.insurance.messages.created'));
        loadData();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'visitId', label: t('page.insurance.fields.visit'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: visitOptions.value, showSearch: true, optionFilterProp: 'label' } },
        { field: 'customerId', label: t('page.insurance.fields.customer'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: customerOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
        { field: 'petId', label: t('page.insurance.fields.pet'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: petOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
        { field: 'providerName', label: t('page.insurance.fields.providerName'), component: 'Input', required: true, colProps: { span: 12 } },
        { field: 'policyNo', label: t('page.insurance.fields.policyNo'), component: 'Input', colProps: { span: 12 } },
        { field: 'claimAmount', label: t('page.insurance.fields.claimAmount'), component: 'InputNumber', required: true, colProps: { span: 12 } },
        { field: 'remark', label: t('page.insurance.fields.remark'), component: 'InputTextArea', colProps: { span: 24 } },
      ],
    },
  });

  formRef?.updateSchema([
    {
      field: 'visitId',
      componentProps: {
        options: visitOptions.value,
        showSearch: true,
        optionFilterProp: 'label',
        onChange: async (value: number) => {
          const visit = visitMap.value.get(Number(value));
          const relation = getVisitRelation(visit);
          petOptions.value = await loadPets(relation.customerId);
          formRef?.updateSchema([
            { field: 'petId', componentProps: { options: petOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
            { field: 'customerId', componentProps: { options: customerOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
          ]);
          formRef?.setFieldsValue(relation);
        },
      },
    },
  ]);
}

async function submitClaim(record: any) {
  await vpetInsuranceSubmit(record.id);
  message.success(t('page.insurance.messages.submitted'));
  loadData();
}

async function openSettleModal(record: any) {
  await showModal({
    modalProps: {
      title: t('page.insurance.settle'),
      onFinish: async (values: any) => {
        await vpetInsuranceSettle(record.id, values);
        message.success(t('page.insurance.messages.settled'));
        loadData();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'approvedAmount', label: t('page.insurance.fields.approvedAmount'), component: 'InputNumber', required: true, colProps: { span: 24 } },
        { field: 'remark', label: t('page.insurance.fields.remark'), component: 'InputTextArea', colProps: { span: 24 } },
      ],
    },
  });
}

onMounted(async () => {
  await loadMasterData();
  await loadData();
});
</script>
