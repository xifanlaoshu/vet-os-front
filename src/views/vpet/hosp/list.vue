<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.hospitalization.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.hospitalization.fields.status')">
          <a-select v-model:value="filters.status" allow-clear :options="hospitalizationStatusOptions" />
        </a-form-item>
        <a-form-item :label="t('page.hospitalization.fields.doctor')">
          <a-select v-model:value="filters.doctorId" allow-clear :options="doctorOptions" show-search option-filter-prop="label" />
        </a-form-item>
        <a-form-item :label="t('page.hospitalization.fields.keyword')">
          <a-input v-model:value="filters.keyword" allow-clear @pressEnter="loadData" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadData">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCreateModal">{{ t('page.hospitalization.create') }}</a-button>
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
            <a-tag :color="hospitalizationStatusColor(record.status)">{{ hospitalizationStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="router.push(`/vpet/hosp/nursing/${record.id}`)">{{ t('page.hospitalization.nursing') }}</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useFormModal } from '@/hooks/useModal';
import { vpetHospitalizationCreate, vpetHospitalizationList } from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetHospitalizationList' });

const { t, hospitalizationStatusColor, hospitalizationStatusOptions, hospitalizationStatusText } = useVpetLocale();
const {
  customerLabel,
  loadCustomers,
  loadDoctors,
  loadPets,
  loadVisits,
  loadDictOptions,
  getVisitRelation,
  optionLabel,
  petLabel,
} = useVpetReference();
const router = useRouter();
const [showModal] = useFormModal();
const loading = ref(false);
const records = ref<any[]>([]);
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const filters = ref({ status: undefined as number | undefined, doctorId: undefined as number | undefined, keyword: '' });
const customerOptions = ref<any[]>([]);
const petOptions = ref<any[]>([]);
const doctorOptions = ref<any[]>([]);
const visitOptions = ref<any[]>([]);
const nursingLevelOptions = ref<any[]>([]);

const visitMap = computed(() => {
  const map = new Map<number, any>();
  visitOptions.value.forEach((item: any) => {
    map.set(Number(item.value), item.raw);
  });
  return map;
});

const columns = [
  { title: t('page.hospitalization.fields.hospNo'), dataIndex: 'hospNo', width: 170 },
  { title: t('page.hospitalization.fields.pet'), key: 'petCustomer', width: 220 },
  { title: t('page.hospitalization.fields.cageCode'), dataIndex: 'cageCode', width: 120 },
  {
    title: t('page.hospitalization.fields.nursingLevel'),
    dataIndex: 'nursingLevel',
    width: 120,
    customRender: ({ text }: any) => optionLabel(nursingLevelOptions.value, text, text || '-'),
  },
  { title: t('page.hospitalization.fields.dailyFee'), dataIndex: 'dailyFee', width: 120 },
  { title: t('page.hospitalization.fields.admissionAt'), dataIndex: 'admissionAt', width: 180, customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-') },
  { title: t('page.hospitalization.fields.status'), key: 'status', width: 120 },
  { title: t('common.action'), key: 'action', width: 120 },
];

async function loadMasterData() {
  [customerOptions.value, doctorOptions.value, visitOptions.value, nursingLevelOptions.value] = await Promise.all([
    loadCustomers(),
    loadDoctors(),
    loadVisits(),
    loadDictOptions('vpet_nursing_level', 'number'),
  ]);
}

async function loadData() {
  loading.value = true;
  try {
    const data: any = await vpetHospitalizationList({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      status: filters.value.status,
      doctorId: filters.value.doctorId,
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
  filters.value = { status: undefined, doctorId: undefined, keyword: '' };
  pagination.value.current = 1;
  loadData();
}

async function openCreateModal() {
  if (!customerOptions.value.length || !doctorOptions.value.length || !visitOptions.value.length) {
    await loadMasterData();
  }

  const [formRef] = await showModal({
    modalProps: {
      title: t('page.hospitalization.create'),
      width: 820,
      onFinish: async (values: any) => {
        await vpetHospitalizationCreate(values);
        message.success(t('page.hospitalization.messages.created'));
        loadData();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'visitId', label: t('page.hospitalization.fields.visit'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: visitOptions.value, showSearch: true, optionFilterProp: 'label' } },
        { field: 'doctorId', label: t('page.hospitalization.fields.doctor'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: doctorOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
        { field: 'customerId', label: t('page.hospitalization.fields.customer'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: customerOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
        { field: 'petId', label: t('page.hospitalization.fields.pet'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: petOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
        { field: 'cageCode', label: t('page.hospitalization.fields.cageCode'), component: 'Input', colProps: { span: 12 } },
        { field: 'nursingLevel', label: t('page.hospitalization.fields.nursingLevel'), component: 'Select', colProps: { span: 12 }, componentProps: { options: nursingLevelOptions.value } },
        { field: 'dailyFee', label: t('page.hospitalization.fields.dailyFee'), component: 'InputNumber', colProps: { span: 12 } },
        { field: 'depositAmount', label: t('page.hospitalization.fields.depositAmount'), component: 'InputNumber', colProps: { span: 12 } },
        { field: 'admissionDiagnosis', label: t('page.hospitalization.fields.admissionDiagnosis'), component: 'InputTextArea', colProps: { span: 24 } },
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
            { field: 'doctorId', componentProps: { options: doctorOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
          ]);
          formRef?.setFieldsValue(relation);
        },
      },
    },
  ]);
}

onMounted(async () => {
  await loadMasterData();
  await loadData();
});
</script>
