<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.lab.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.lab.fields.status')">
          <a-select v-model:value="filters.status" allow-clear :options="labStatusOptions" />
        </a-form-item>
        <a-form-item :label="t('page.lab.fields.keyword')">
          <a-input v-model:value="filters.keyword" allow-clear @pressEnter="loadData" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadData">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCreateModal">{{ t('page.lab.create') }}</a-button>
            <a-button @click="openTemplateModal">{{ t('page.lab.templateManager') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card class="vpet-panel-card vpet-list-card" :bordered="false">
      <a-table
        row-key="id"
        :loading="loading"
        :columns="columns"
        :data-source="records"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'petCustomer'">
            <div style="font-weight: 600">{{ petLabel(record.pet, record.petSnapshot, record.petId) }}</div>
            <div class="vpet-muted">{{ customerLabel(record.customer, record.customerSnapshot, record.customerId) }}</div>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="labStatusColor(record.status)">{{ labStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="router.push(`/vpet/lab/report/${record.id}`)">{{ t('page.lab.report') }}</a-button>
              <a-button type="link" size="small" @click="submitLis(record)">{{ t('page.lab.submitLis') }}</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="templateVisible"
      :title="t('page.lab.createTemplate')"
      width="900px"
      destroy-on-close
      @ok="submitTemplate"
    >
      <a-form layout="vertical">
        <a-row :gutter="15">
          <a-col :span="8">
            <a-form-item :label="t('page.lab.fields.templateCode')">
              <a-input v-model:value="templateForm.code" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.lab.fields.templateName')">
              <a-input v-model:value="templateForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.lab.fields.sampleType')">
              <a-select
                v-model:value="templateForm.sampleType"
                allow-clear
                show-search
                :options="sampleTypeOptions"
                :filter-option="filterByLabel"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.lab.fields.defaultChargeAmount')">
              <a-input-number v-model:value="templateForm.defaultChargeAmount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="16">
            <a-form-item :label="t('page.lab.fields.templateDescription')">
              <a-input v-model:value="templateForm.description" />
            </a-form-item>
          </a-col>
        </a-row>

        <div class="vpet-section-title">{{ t('page.lab.resultSchema') }}</div>
        <div v-for="(item, index) in templateForm.schemaItems" :key="`schema-${index}`" class="vpet-form-grid">
          <a-input v-model:value="item.itemCode" :placeholder="t('page.lab.fields.metricKey')" />
          <a-input v-model:value="item.itemName" :placeholder="t('page.lab.fields.itemName')" />
          <a-input v-model:value="item.unit" :placeholder="t('page.lab.fields.unit')" />
          <a-input-number v-model:value="item.refMin" :placeholder="t('page.lab.fields.refMin')" />
          <a-input-number v-model:value="item.refMax" :placeholder="t('page.lab.fields.refMax')" />
          <a-input v-model:value="item.flag" :placeholder="t('page.lab.fields.flag')" />
          <a-button danger @click="removeSchemaRow(index)">{{ t('common.delete') }}</a-button>
        </div>
        <a-button @click="addSchemaRow">{{ t('page.lab.addSchemaRow') }}</a-button>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useFormModal } from '@/hooks/useModal';
import {
  vpetLabCreate,
  vpetLabList,
  vpetLabSubmitLis,
  vpetLabTemplateCreate,
} from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetLabList' });

const { t, labStatusColor, labStatusOptions, labStatusText } = useVpetLocale();
const {
  customerLabel,
  loadCustomers,
  loadDoctors,
  loadPets: loadPetOptions,
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
const filters = ref({ status: undefined as number | undefined, keyword: '' });
const templateVisible = ref(false);

const customerOptions = ref<any[]>([]);
const petOptions = ref<any[]>([]);
const doctorOptions = ref<any[]>([]);
const visitOptions = ref<any[]>([]);
const sampleTypeOptions = ref<any[]>([]);
const templateForm = ref(createEmptyTemplateForm());

const visitMap = computed(() => {
  const map = new Map<number, any>();
  visitOptions.value.forEach((item: any) => {
    map.set(Number(item.value), item.raw);
  });
  return map;
});

const columns = [
  { title: t('page.lab.fields.orderNo'), dataIndex: 'orderNo', width: 170 },
  { title: t('page.lab.fields.testName'), dataIndex: 'testName', width: 180 },
  { title: t('page.lab.fields.pet'), key: 'petCustomer', width: 220 },
  {
    title: t('page.lab.fields.sampleType'),
    dataIndex: 'sampleType',
    width: 120,
    customRender: ({ text }: any) => optionLabel(sampleTypeOptions.value, text, text || '-'),
  },
  { title: t('page.lab.fields.abnormalCount'), dataIndex: 'abnormalCount', width: 120 },
  {
    title: t('page.lab.fields.requestedAt'),
    dataIndex: 'requestedAt',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  { title: t('page.lab.fields.status'), key: 'status', width: 120 },
  { title: t('common.action'), key: 'action', width: 180, fixed: 'right' as const },
];

function createEmptyTemplateForm() {
  return {
    code: '',
    name: '',
    sampleType: undefined as string | undefined,
    defaultChargeAmount: 0,
    description: '',
    schemaItems: [
      { itemCode: '', itemName: '', unit: '', refMin: undefined, refMax: undefined, flag: '' },
    ],
  };
}

async function loadMasterData() {
  [customerOptions.value, doctorOptions.value, visitOptions.value, sampleTypeOptions.value] = await Promise.all([
    loadCustomers(),
    loadDoctors(),
    loadVisits(),
    loadDictOptions('vpet_lab_sample_type'),
  ]);
}

async function syncPetOptions(customerId?: number) {
  if (!customerId) {
    petOptions.value = [];
    return;
  }
  petOptions.value = await loadPetOptions(customerId);
}

async function loadData() {
  loading.value = true;
  try {
    const data: any = await vpetLabList({
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

async function submitLis(record: any) {
  await vpetLabSubmitLis(record.id);
  message.success(t('page.lab.messages.lisSubmitted'));
  loadData();
}

async function openCreateModal() {
  if (!customerOptions.value.length || !doctorOptions.value.length || !visitOptions.value.length) {
    await loadMasterData();
  }

  const [formRef] = await showModal({
    modalProps: {
      title: t('page.lab.create'),
      width: 760,
      onFinish: async (values: any) => {
        await vpetLabCreate(values);
        message.success(t('page.lab.messages.created'));
        loadData();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'visitId', label: t('page.lab.fields.visit'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: visitOptions.value, showSearch: true, optionFilterProp: 'label' } },
        { field: 'doctorId', label: t('page.lab.fields.doctor'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: doctorOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
        { field: 'customerId', label: t('page.lab.fields.customer'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: customerOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
        { field: 'petId', label: t('page.lab.fields.pet'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: petOptions.value, showSearch: true, optionFilterProp: 'label', disabled: true } },
        { field: 'testName', label: t('page.lab.fields.testName'), component: 'Input', required: true, colProps: { span: 12 } },
        { field: 'sampleType', label: t('page.lab.fields.sampleType'), component: 'Select', colProps: { span: 12 }, componentProps: { options: sampleTypeOptions.value, showSearch: true, optionFilterProp: 'label' } },
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
          await syncPetOptions(relation.customerId);
          formRef?.updateSchema([
            {
              field: 'petId',
              componentProps: {
                options: petOptions.value,
                showSearch: true,
                optionFilterProp: 'label',
                disabled: true,
              },
            },
            {
              field: 'customerId',
              componentProps: {
                options: customerOptions.value,
                showSearch: true,
                optionFilterProp: 'label',
                disabled: true,
              },
            },
            {
              field: 'doctorId',
              componentProps: {
                options: doctorOptions.value,
                showSearch: true,
                optionFilterProp: 'label',
                disabled: true,
              },
            },
          ]);
          formRef?.setFieldsValue(relation);
        },
      },
    },
  ]);
}

function openTemplateModal() {
  templateForm.value = createEmptyTemplateForm();
  templateVisible.value = true;
}

function addSchemaRow() {
  templateForm.value.schemaItems.push({
    itemCode: '',
    itemName: '',
    unit: '',
    refMin: undefined,
    refMax: undefined,
    flag: '',
  });
}

function removeSchemaRow(index: number) {
  templateForm.value.schemaItems.splice(index, 1);
}

async function submitTemplate() {
  if (!templateForm.value.code || !templateForm.value.name) {
    message.error(t('page.lab.messages.templateRequired'));
    return;
  }

  await vpetLabTemplateCreate({
    code: templateForm.value.code,
    name: templateForm.value.name,
    sampleType: templateForm.value.sampleType,
    defaultChargeAmount: Number(templateForm.value.defaultChargeAmount || 0),
    description: templateForm.value.description || undefined,
    resultSchema: {
      items: templateForm.value.schemaItems.filter(item => item.itemName),
    },
  });
  message.success(t('page.lab.messages.templateCreated'));
  templateVisible.value = false;
}

onMounted(async () => {
  await loadMasterData();
  await loadData();
});
</script>
