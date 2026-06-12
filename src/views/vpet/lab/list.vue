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
      width="1280px"
      :body-style="{ padding: '18px 20px' }"
      destroy-on-close
      @ok="submitTemplate"
    >
      <div class="vpet-lab-template-manager">
        <aside class="vpet-lab-template-sidebar">
          <div class="vpet-lab-template-sidebar-head">
            <div>
              <div class="vpet-lab-template-sidebar-title">{{ t('page.lab.templateManager') }}</div>
              <div class="vpet-muted">{{ t('page.lab.fields.keyword') }} / {{ t('page.lab.fields.sampleType') }}</div>
            </div>
            <a-tag color="blue">{{ filteredTemplates.length }}</a-tag>
          </div>
          <a-input
            v-model:value="templateKeyword"
            class="vpet-lab-template-search"
            allow-clear
            :placeholder="t('page.lab.fields.keyword')"
          />
          <a-button block type="primary" @click="resetTemplateForm">{{ t('page.lab.createTemplate') }}</a-button>
          <div class="vpet-lab-template-list">
            <div
              v-for="record in filteredTemplates"
              :key="record.id"
              class="vpet-lab-template-item"
              :class="{ 'is-active': Number(templateForm.id) === Number(record.id) }"
              role="button"
              tabindex="0"
              @click="editTemplate(record)"
              @keydown.enter="editTemplate(record)"
            >
              <div class="vpet-lab-template-item-main">
                <div class="vpet-lab-template-name">{{ record.name }}</div>
                <div class="vpet-lab-template-code">{{ record.code }}</div>
              </div>
              <div class="vpet-lab-template-meta">
                <a-tag>{{ templateSampleLabel(record) }}</a-tag>
                <a-tag color="green">{{ getTemplateFieldCount(record) }} {{ t('page.lab.fields.itemName') }}</a-tag>
              </div>
              <div class="vpet-lab-template-actions">
                <a-button type="link" size="small" @click.stop="editTemplate(record)">{{ t('common.edit') }}</a-button>
                <a-button type="link" danger size="small" @click.stop="deleteTemplate(record)">{{ t('common.delete') }}</a-button>
              </div>
            </div>
          </div>
        </aside>

        <section class="vpet-lab-template-editor">
          <a-form layout="vertical">
            <a-card class="vpet-lab-template-editor-card" :bordered="false">
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
                <a-col :span="12">
                  <a-form-item :label="t('page.lab.fields.templateHeader')">
                    <a-textarea v-model:value="templateForm.templateHeader" :rows="3" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="t('page.lab.fields.templateFooter')">
                    <a-textarea v-model:value="templateForm.templateFooter" :rows="3" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>

            <div class="vpet-section-title">{{ t('page.lab.fieldDefinitions') }}</div>
            <div
              v-for="(item, index) in templateForm.schemaItems"
              :key="`schema-${index}`"
              class="vpet-panel-card vpet-block-bottom vpet-lab-schema-card"
            >
              <a-row :gutter="15">
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.metricKey')">
                    <a-input v-model:value="item.itemCode" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.itemName')">
                    <a-input v-model:value="item.itemName" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.englishAbbr')">
                    <a-input v-model:value="item.englishAbbr" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.unit')">
                    <a-input v-model:value="item.unit" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.valueType')">
                    <a-select v-model:value="item.valueType" :options="valueTypeOptions" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.required')">
                    <a-select v-model:value="item.required" :options="yesNoOptions" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.refMin')">
                    <a-input-number v-model:value="item.refMin" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.refMax')">
                    <a-input-number v-model:value="item.refMax" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.referenceText')">
                    <a-input v-model:value="item.referenceText" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.defaultValue')">
                    <a-input v-model:value="item.defaultValue" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.displayOrder')">
                    <a-input-number v-model:value="item.displayOrder" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('common.action')">
                    <a-button danger @click="removeSchemaRow(index)">{{ t('common.delete') }}</a-button>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item :label="t('page.lab.fields.method')">
                    <a-input v-model:value="item.method" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item :label="t('page.lab.fields.specimenRequirement')">
                    <a-input v-model:value="item.specimenRequirement" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item :label="t('page.lab.fields.resultOptions')">
                    <a-input v-model:value="item.resultOptions" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="t('page.lab.fields.fieldExplanation')">
                    <a-textarea v-model:value="item.explanation" :rows="2" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="t('page.lab.fields.clinicalSignificance')">
                    <a-textarea v-model:value="item.clinicalSignificance" :rows="2" />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
            <a-button @click="addSchemaRow">{{ t('page.lab.addSchemaRow') }}</a-button>

            <div class="vpet-section-title vpet-section-spaced">{{ t('page.lab.printSettings') }}</div>
            <a-card class="vpet-lab-template-editor-card" :bordered="false">
              <a-row :gutter="15">
                <a-col :span="6">
                  <a-form-item :label="t('page.lab.fields.printTitle')">
                    <a-input v-model:value="templateForm.printConfig.title" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.paperSize')">
                    <a-select v-model:value="templateForm.printConfig.paperSize" :options="paperSizeOptions" />
                  </a-form-item>
                </a-col>
                <a-col :span="4">
                  <a-form-item :label="t('page.lab.fields.fontSize')">
                    <a-input-number v-model:value="templateForm.printConfig.fontSize" :min="10" :max="18" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="5">
                  <a-form-item :label="t('page.lab.fields.showReferenceRange')">
                    <a-select v-model:value="templateForm.printConfig.showReferenceRange" :options="yesNoOptions" />
                  </a-form-item>
                </a-col>
                <a-col :span="5">
                  <a-form-item :label="t('page.lab.fields.showExplanation')">
                    <a-select v-model:value="templateForm.printConfig.showExplanation" :options="yesNoOptions" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-card>

            <a-card class="vpet-block-spaced" :title="t('page.lab.printPreview')" :bordered="false">
              <div class="vpet-lab-print-preview" :style="{ fontSize: `${templateForm.printConfig.fontSize || 12}px` }">
                <h2>{{ templateForm.printConfig.title || templateForm.name || t('page.lab.reportTitle') }}</h2>
                <div v-if="templateForm.templateHeader" class="vpet-pre-wrap">{{ templateForm.templateHeader }}</div>
                <table>
                  <thead>
                    <tr>
                      <th>{{ t('page.lab.fields.itemName') }}</th>
                      <th>{{ t('page.lab.fields.englishAbbr') }}</th>
                      <th>{{ t('page.lab.fields.resultValue') }}</th>
                      <th>{{ t('page.lab.fields.unit') }}</th>
                      <th v-if="templateForm.printConfig.showReferenceRange">{{ t('page.lab.fields.referenceRange') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in previewSchemaItems" :key="item.itemCode || item.itemName">
                      <td>{{ item.itemName }}</td>
                      <td>{{ item.englishAbbr || '-' }}</td>
                      <td>{{ item.defaultValue || '-' }}</td>
                      <td>{{ item.unit || '-' }}</td>
                      <td v-if="templateForm.printConfig.showReferenceRange">{{ formatReferenceRange(item) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="templateForm.printConfig.showExplanation" class="vpet-block-top">
                  <div v-for="item in previewSchemaItems.filter(row => row.explanation || row.clinicalSignificance)" :key="`explain-${item.itemCode || item.itemName}`">
                    <strong>{{ item.itemName }}&#65306;</strong>
                    {{ [item.explanation, item.clinicalSignificance].filter(Boolean).join(' / ') }}
                  </div>
                </div>
                <div v-if="templateForm.templateFooter" class="vpet-pre-wrap vpet-block-top">{{ templateForm.templateFooter }}</div>
              </div>
            </a-card>
          </a-form>
        </section>
      </div>
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
  vpetLabTemplateDelete,
  vpetLabTemplateList,
  vpetLabTemplateUpdate,
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
const templates = ref<any[]>([]);
const templateKeyword = ref('');
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

const valueTypeOptions = [
  { value: 'number', label: t('page.lab.valueTypes.number') },
  { value: 'text', label: t('page.lab.valueTypes.text') },
  { value: 'enum', label: t('page.lab.valueTypes.enum') },
  { value: 'boolean', label: t('page.lab.valueTypes.boolean') },
];

const yesNoOptions = [
  { value: true, label: t('page.lab.boolean.yes') },
  { value: false, label: t('page.lab.boolean.no') },
];

const paperSizeOptions = [
  { value: 'A4', label: 'A4' },
  { value: 'A5', label: 'A5' },
  { value: 'thermal', label: t('page.lab.paperSizes.thermal') },
];

const previewSchemaItems = computed(() =>
  templateForm.value.schemaItems
    .filter(item => item.itemName)
    .slice()
    .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
);

const filteredTemplates = computed(() => {
  const keyword = templateKeyword.value.trim().toLowerCase();
  if (!keyword) return templates.value;
  return templates.value.filter((item: any) =>
    [item.code, item.name, item.description, item.sampleType]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(keyword)),
  );
});

function createEmptySchemaItem() {
  return {
    itemCode: '',
    itemName: '',
    englishAbbr: '',
    unit: '',
    valueType: 'number',
    required: true,
    refMin: undefined as number | undefined,
    refMax: undefined as number | undefined,
    referenceText: '',
    defaultValue: '',
    displayOrder: undefined as number | undefined,
    method: '',
    specimenRequirement: '',
    resultOptions: '',
    explanation: '',
    clinicalSignificance: '',
    flag: '',
  };
}

function createDefaultPrintConfig() {
  return {
    title: '',
    paperSize: 'A4',
    fontSize: 12,
    showReferenceRange: true,
    showExplanation: true,
  };
}

function createEmptyTemplateForm() {
  return {
    id: undefined as number | undefined,
    code: '',
    name: '',
    sampleType: undefined as string | undefined,
    defaultChargeAmount: 0,
    description: '',
    templateHeader: '',
    templateFooter: '',
    printConfig: createDefaultPrintConfig(),
    schemaItems: [createEmptySchemaItem()],
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
  templateKeyword.value = '';
  templateVisible.value = true;
  loadTemplates();
}

function resetTemplateForm() {
  templateForm.value = createEmptyTemplateForm();
}

function addSchemaRow() {
  templateForm.value.schemaItems.push({
    ...createEmptySchemaItem(),
    displayOrder: templateForm.value.schemaItems.length + 1,
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

  const payload = {
    code: templateForm.value.code,
    name: templateForm.value.name,
    sampleType: templateForm.value.sampleType,
    defaultChargeAmount: Number(templateForm.value.defaultChargeAmount || 0),
    description: templateForm.value.description || undefined,
    templateHeader: templateForm.value.templateHeader || undefined,
    templateFooter: templateForm.value.templateFooter || undefined,
    printConfig: templateForm.value.printConfig,
    resultSchema: {
      items: templateForm.value.schemaItems
        .filter(item => item.itemName)
        .map((item, index) => ({
          ...item,
          displayOrder: item.displayOrder ?? index + 1,
          resultOptions: parseOptionsText(item.resultOptions),
        })),
    },
  };

  if (templateForm.value.id) {
    await vpetLabTemplateUpdate(templateForm.value.id, payload);
    message.success(t('page.lab.messages.templateUpdated'));
  } else {
    await vpetLabTemplateCreate(payload);
    message.success(t('page.lab.messages.templateCreated'));
  }
  templateForm.value = createEmptyTemplateForm();
  await loadTemplates();
}

async function loadTemplates() {
  templates.value = await vpetLabTemplateList() as any[];
}

function getTemplateFieldCount(record: any) {
  return Array.isArray(record?.resultSchema?.items) ? record.resultSchema.items.length : 0;
}

function templateSampleLabel(record: any) {
  return optionLabel(sampleTypeOptions.value, record?.sampleType, record?.sampleType || '-');
}

function editTemplate(record: any) {
  const schemaItems = Array.isArray(record.resultSchema?.items)
    ? record.resultSchema.items
    : [];
  templateForm.value = {
    ...createEmptyTemplateForm(),
    ...record,
    templateHeader: record.templateHeader || '',
    templateFooter: record.templateFooter || '',
    printConfig: {
      ...createDefaultPrintConfig(),
      ...(record.printConfig || {}),
    },
    schemaItems: schemaItems.length
      ? schemaItems.map((item: any) => ({
          itemCode: item.itemCode || item.code || '',
          itemName: item.itemName || item.name || '',
          englishAbbr: item.englishAbbr || item.abbr || '',
          unit: item.unit || '',
          valueType: item.valueType || 'number',
          required: item.required !== undefined ? item.required : true,
          refMin: item.refMin,
          refMax: item.refMax,
          referenceText: item.referenceText || '',
          defaultValue: item.defaultValue ?? item.resultValue ?? '',
          displayOrder: item.displayOrder,
          method: item.method || '',
          specimenRequirement: item.specimenRequirement || '',
          resultOptions: Array.isArray(item.resultOptions) ? item.resultOptions.join(',') : (item.resultOptions || ''),
          explanation: item.explanation || '',
          clinicalSignificance: item.clinicalSignificance || '',
          flag: item.flag || '',
        }))
      : createEmptyTemplateForm().schemaItems,
  };
}

function parseOptionsText(value?: string | string[]) {
  if (Array.isArray(value))
    return value
  return String(value || '')
    .split(/[,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function formatReferenceRange(item: any) {
  if (item.referenceText)
    return item.referenceText
  if (item.refMin !== undefined && item.refMax !== undefined)
    return `${item.refMin} - ${item.refMax}`
  if (item.refMin !== undefined)
    return `>= ${item.refMin}`
  if (item.refMax !== undefined)
    return `<= ${item.refMax}`
  return '-'
}

async function deleteTemplate(record: any) {
  await vpetLabTemplateDelete(record.id);
  message.success(t('page.lab.messages.templateDeleted'));
  await loadTemplates();
  if (templateForm.value.id === record.id)
    templateForm.value = createEmptyTemplateForm();
}

onMounted(async () => {
  await loadMasterData();
  await loadData();
});
</script>

<style scoped>
.vpet-lab-template-manager {
  align-items: stretch;
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  grid-template-columns: 310px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 15px;
  height: clamp(560px, calc(100vh - 210px), 720px);
  overflow: hidden;
}

.vpet-lab-template-manager > * {
  min-height: 0;
}

.vpet-lab-template-sidebar {
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
  border: 1px solid #e6edf5;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
}

.vpet-lab-template-sidebar-head {
  align-items: flex-start;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.vpet-lab-template-sidebar-title {
  color: #1f2937;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.vpet-lab-template-search {
  flex: 0 0 auto;
}

.vpet-lab-template-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.vpet-lab-template-item {
  background: #fff;
  border: 1px solid #e7edf4;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgb(31 41 55 / 5%);
  cursor: pointer;
  outline: none;
  padding: 12px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.vpet-lab-template-item:hover,
.vpet-lab-template-item:focus {
  border-color: #8bb8ff;
  box-shadow: 0 10px 22px rgb(36 99 235 / 12%);
  transform: translateY(-1px);
}

.vpet-lab-template-item.is-active {
  background: #f0f7ff;
  border-color: #2f7de1;
  box-shadow: 0 10px 24px rgb(47 125 225 / 16%);
}

.vpet-lab-template-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vpet-lab-template-name {
  color: #142033;
  font-weight: 700;
  line-height: 1.45;
}

.vpet-lab-template-code {
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.vpet-lab-template-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.vpet-lab-template-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.vpet-lab-template-editor {
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.vpet-lab-template-editor-card,
.vpet-lab-schema-card {
  background: #fff;
  border: 1px solid #edf1f7;
  border-radius: 12px;
}

.vpet-lab-template-editor-card :deep(.ant-card-body) {
  padding: 15px;
}

.vpet-lab-schema-card {
  padding: 15px;
}

.vpet-lab-print-preview {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  color: #1f2933;
  line-height: 1.6;
  padding: 20px;
}

.vpet-lab-print-preview h2 {
  margin: 0 0 12px;
  text-align: center;
}

.vpet-lab-print-preview table {
  border-collapse: collapse;
  margin-top: 12px;
  width: 100%;
}

.vpet-lab-print-preview th,
.vpet-lab-print-preview td {
  border: 1px solid #d9d9d9;
  padding: 8px;
  text-align: left;
}

@media (max-width: 1180px) {
  .vpet-lab-template-manager {
    grid-template-columns: 1fr;
    max-height: none;
  }

  .vpet-lab-template-sidebar,
  .vpet-lab-template-editor {
    max-height: none;
  }

  .vpet-lab-template-list {
    max-height: 320px;
  }
}
</style>
