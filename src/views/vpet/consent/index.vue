<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.consent.title')" :bordered="false">
      <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
        <a-tab-pane key="records" :tab="t('page.consent.records')" />
        <a-tab-pane key="templates" :tab="t('page.consent.templates')" />
      </a-tabs>

      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.consent.fields.category')">
          <a-select v-model:value="filters.category" allow-clear :options="consentCategoryOptions" />
        </a-form-item>
        <a-form-item v-if="activeTab === 'records'" :label="t('page.consent.fields.status')">
          <a-select v-model:value="filters.status" allow-clear :options="consentRecordStatusOptions" />
        </a-form-item>
        <a-form-item :label="t('page.consent.fields.keyword')">
          <a-input v-model:value="filters.keyword" allow-clear @pressEnter="loadCurrentTab" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadCurrentTab">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button v-if="activeTab === 'records'" type="primary" @click="openRecordModal">{{ t('page.consent.createRecord') }}</a-button>
            <a-button v-else type="primary" @click="openTemplateModal()">{{ t('page.consent.createTemplate') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card class="vpet-panel-card vpet-list-card" :bordered="false">
      <a-table
        v-if="activeTab === 'records'"
        row-key="id"
        :loading="loading"
        :columns="recordColumns"
        :data-source="records"
        :pagination="recordPagination"
        @change="handleRecordTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'petCustomer'">
            <div style="font-weight: 600">{{ petLabel(record.pet, record.petSnapshot, record.petId) }}</div>
            <div class="vpet-muted">{{ customerLabel(record.customer, record.customerSnapshot, record.customerId) }}</div>
          </template>
          <template v-else-if="column.key === 'category'">
            {{ consentCategoryText(record.category) }}
          </template>
          <template v-else-if="column.key === 'riskLevel'">
            <a-tag :color="consentRiskLevelColor(record.riskLevel)">{{ consentRiskLevelText(record.riskLevel) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="consentRecordStatusColor(record.status)">{{ consentRecordStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openPreview(record)">{{ t('page.consent.preview') }}</a-button>
              <a-button v-if="record.status === 1" type="link" size="small" @click="openSignModal(record)">{{ t('page.consent.sign') }}</a-button>
              <a-button v-if="record.status !== 3" type="link" size="small" danger @click="voidRecord(record)">{{ t('page.consent.void') }}</a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <a-table
        v-else
        row-key="id"
        :loading="loading"
        :columns="templateColumns"
        :data-source="templates"
        :pagination="templatePagination"
        @change="handleTemplateTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'category'">
            {{ consentCategoryText(record.category) }}
          </template>
          <template v-else-if="column.key === 'riskLevel'">
            <a-tag :color="consentRiskLevelColor(record.riskLevel)">{{ consentRiskLevelText(record.riskLevel) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'isActive'">
            <a-tag :color="record.isActive === 1 ? 'green' : 'default'">{{ record.isActive === 1 ? t('common.all') : t('common.none') }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openTemplateModal(record)">{{ t('common.edit') }}</a-button>
              <a-button type="link" size="small" @click="openPreview(record, true)">{{ t('page.consent.preview') }}</a-button>
              <a-button v-if="record.isActive === 1" type="link" size="small" danger @click="disableTemplate(record)">{{ t('common.delete') }}</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="templateModalOpen" :title="editingTemplate?.id ? t('page.consent.editTemplate') : t('page.consent.createTemplate')" width="860px" @ok="saveTemplate">
      <a-alert class="consent-help" type="info" show-icon :message="t('page.consent.variablesHelp')" />
      <a-form :model="templateForm" layout="vertical">
        <a-row :gutter="15">
          <a-col :span="8">
            <a-form-item :label="t('page.consent.fields.code')" required>
              <a-input v-model:value="templateForm.code" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.consent.fields.name')" required>
              <a-input v-model:value="templateForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.consent.fields.category')" required>
              <a-select v-model:value="templateForm.category" :options="consentCategoryOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.consent.fields.riskLevel')">
              <a-select v-model:value="templateForm.riskLevel" :options="consentRiskLevelOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.consent.fields.speciesScope')">
              <a-select v-model:value="templateForm.speciesScope" allow-clear :options="speciesOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.consent.fields.isActive')">
              <a-switch v-model:checked="templateActive" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.consent.fields.description')">
              <a-input v-model:value="templateForm.description" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.consent.fields.content')" required>
              <a-textarea v-model:value="templateForm.content" :rows="10" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-modal v-model:open="recordModalOpen" :title="t('page.consent.createRecord')" width="760px" @ok="saveRecord">
      <a-form :model="recordForm" layout="vertical">
        <a-row :gutter="15">
          <a-col :span="12">
            <a-form-item :label="t('page.consent.fields.visit')">
              <a-select v-model:value="recordForm.visitId" show-search allow-clear option-filter-prop="label" :options="visitOptions" @change="handleVisitChange" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.consent.fields.name')" required>
              <a-select v-model:value="recordForm.templateId" show-search option-filter-prop="label" :options="activeTemplateOptions" @change="handleTemplateChange" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.consent.fields.customer')" required>
              <a-select v-model:value="recordForm.customerId" show-search option-filter-prop="label" :options="customerOptions" @change="handleCustomerChange" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.consent.fields.pet')" required>
              <a-select v-model:value="recordForm.petId" show-search option-filter-prop="label" :options="petOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.consent.fields.doctor')">
              <a-select v-model:value="recordForm.doctorId" show-search allow-clear option-filter-prop="label" :options="doctorOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.consent.fields.guardianName')">
              <a-input v-model:value="recordForm.guardianName" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.consent.fields.guardianPhone')">
              <a-input v-model:value="recordForm.guardianPhone" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.consent.fields.remark')">
              <a-textarea v-model:value="recordForm.remark" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-modal v-model:open="signModalOpen" :title="t('page.consent.sign')" width="520px" @ok="saveSignature">
      <a-form :model="signForm" layout="vertical">
        <a-form-item :label="t('page.consent.fields.guardianName')" required>
          <a-input v-model:value="signForm.guardianName" />
        </a-form-item>
        <a-form-item :label="t('page.consent.fields.guardianPhone')">
          <a-input v-model:value="signForm.guardianPhone" />
        </a-form-item>
        <a-form-item :label="t('page.consent.fields.remark')">
          <a-textarea v-model:value="signForm.signatureData" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="previewOpen" :title="previewTitle" width="760px" :footer="null">
      <article class="consent-preview">
        <h2>{{ previewTitle }}</h2>
        <div class="consent-preview-meta">
          <span>{{ consentCategoryText(previewItem?.category) }}</span>
          <a-tag :color="consentRiskLevelColor(previewItem?.riskLevel)">{{ consentRiskLevelText(previewItem?.riskLevel) }}</a-tag>
        </div>
        <pre>{{ previewContent }}</pre>
        <div v-if="previewItem?.guardianName" class="consent-signature">
          {{ t('page.consent.fields.guardianName') }}：{{ previewItem.guardianName }}
          <span v-if="previewItem.signedAt"> / {{ t('page.consent.fields.signedAt') }}：{{ formatToDateTime(previewItem.signedAt) }}</span>
        </div>
      </article>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  vpetConsentRecordCreate,
  vpetConsentRecordList,
  vpetConsentRecordSign,
  vpetConsentRecordVoid,
  vpetConsentTemplateActive,
  vpetConsentTemplateCreate,
  vpetConsentTemplateDelete,
  vpetConsentTemplateList,
  vpetConsentTemplateUpdate,
} from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetConsentIndex' });

type TabKey = 'records' | 'templates';

const {
  t,
  speciesOptions,
  consentCategoryOptions,
  consentCategoryText,
  consentRecordStatusColor,
  consentRecordStatusOptions,
  consentRecordStatusText,
  consentRiskLevelColor,
  consentRiskLevelOptions,
  consentRiskLevelText,
} = useVpetLocale();
const {
  customerLabel,
  loadCustomers,
  loadDoctors,
  loadPets,
  loadVisits,
  getVisitRelation,
  petLabel,
} = useVpetReference();

const activeTab = ref<TabKey>('records');
const loading = ref(false);
const records = ref<any[]>([]);
const templates = ref<any[]>([]);
const activeTemplates = ref<any[]>([]);
const recordPagination = ref({ current: 1, pageSize: 10, total: 0 });
const templatePagination = ref({ current: 1, pageSize: 10, total: 0 });
const filters = ref({ category: undefined as string | undefined, status: undefined as number | undefined, keyword: '' });
const customerOptions = ref<any[]>([]);
const petOptions = ref<any[]>([]);
const doctorOptions = ref<any[]>([]);
const visitOptions = ref<any[]>([]);
const templateModalOpen = ref(false);
const recordModalOpen = ref(false);
const signModalOpen = ref(false);
const previewOpen = ref(false);
const editingTemplate = ref<any>(null);
const signingRecord = ref<any>(null);
const previewItem = ref<any>(null);

const templateForm = ref(emptyTemplateForm());
const recordForm = ref<any>(emptyRecordForm());
const signForm = ref({ guardianName: '', guardianPhone: '', signatureData: '' });

const templateActive = computed({
  get: () => templateForm.value.isActive === 1,
  set: value => templateForm.value.isActive = value ? 1 : 0,
});

const activeTemplateOptions = computed(() => activeTemplates.value.map(item => ({
  value: item.id,
  label: `${item.name} / ${consentCategoryText(item.category)}`,
  raw: item,
})));

const visitMap = computed(() => {
  const map = new Map<number, any>();
  visitOptions.value.forEach((item: any) => map.set(Number(item.value), item.raw));
  return map;
});

const templateMap = computed(() => {
  const map = new Map<number, any>();
  activeTemplates.value.forEach((item: any) => map.set(Number(item.id), item));
  return map;
});

const previewTitle = computed(() => previewItem.value?.title || previewItem.value?.name || '-');
const previewContent = computed(() => previewItem.value?.contentSnapshot || previewItem.value?.content || '');

const recordColumns = [
  { title: t('page.consent.fields.recordNo'), dataIndex: 'recordNo', width: 170 },
  { title: t('page.consent.fields.title'), dataIndex: 'title', ellipsis: true },
  { title: t('page.consent.fields.pet'), key: 'petCustomer', width: 220 },
  { title: t('page.consent.fields.category'), key: 'category', width: 120 },
  { title: t('page.consent.fields.riskLevel'), key: 'riskLevel', width: 110 },
  { title: t('page.consent.fields.status'), key: 'status', width: 110 },
  { title: t('page.consent.fields.signedAt'), dataIndex: 'signedAt', width: 170, customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-') },
  { title: t('common.action'), key: 'action', width: 180 },
];

const templateColumns = [
  { title: t('page.consent.fields.code'), dataIndex: 'code', width: 180 },
  { title: t('page.consent.fields.name'), dataIndex: 'name', ellipsis: true },
  { title: t('page.consent.fields.category'), key: 'category', width: 120 },
  { title: t('page.consent.fields.riskLevel'), key: 'riskLevel', width: 110 },
  { title: t('page.consent.fields.isActive'), key: 'isActive', width: 110 },
  { title: t('common.action'), key: 'action', width: 190 },
];

function emptyTemplateForm() {
  return {
    code: '',
    name: '',
    category: 'treatment',
    speciesScope: undefined as string | undefined,
    riskLevel: 'medium',
    content: '',
    description: '',
    isActive: 1,
  };
}

function emptyRecordForm() {
  return {
    templateId: undefined,
    visitId: undefined,
    customerId: undefined,
    petId: undefined,
    doctorId: undefined,
    guardianName: '',
    guardianPhone: '',
    remark: '',
  };
}

async function loadMasterData() {
  [customerOptions.value, doctorOptions.value, visitOptions.value, activeTemplates.value] = await Promise.all([
    loadCustomers(),
    loadDoctors(),
    loadVisits(),
    vpetConsentTemplateActive(),
  ]);
}

async function loadRecords() {
  loading.value = true;
  try {
    const data: any = await vpetConsentRecordList({
      page: recordPagination.value.current,
      pageSize: recordPagination.value.pageSize,
      category: filters.value.category,
      status: filters.value.status,
      keyword: filters.value.keyword || undefined,
    });
    records.value = data?.items || [];
    recordPagination.value.total = data?.meta?.totalItems || 0;
  } finally {
    loading.value = false;
  }
}

async function loadTemplates() {
  loading.value = true;
  try {
    const data: any = await vpetConsentTemplateList({
      page: templatePagination.value.current,
      pageSize: templatePagination.value.pageSize,
      category: filters.value.category,
      keyword: filters.value.keyword || undefined,
    });
    templates.value = data?.items || [];
    templatePagination.value.total = data?.meta?.totalItems || 0;
  } finally {
    loading.value = false;
  }
}

function loadCurrentTab() {
  if (activeTab.value === 'records') return loadRecords();
  return loadTemplates();
}

function handleTabChange() {
  filters.value.status = undefined;
  loadCurrentTab();
}

function resetFilters() {
  filters.value = { category: undefined, status: undefined, keyword: '' };
  recordPagination.value.current = 1;
  templatePagination.value.current = 1;
  loadCurrentTab();
}

function handleRecordTableChange(page: any) {
  recordPagination.value.current = page.current;
  recordPagination.value.pageSize = page.pageSize;
  loadRecords();
}

function handleTemplateTableChange(page: any) {
  templatePagination.value.current = page.current;
  templatePagination.value.pageSize = page.pageSize;
  loadTemplates();
}

function openTemplateModal(record?: any) {
  editingTemplate.value = record || null;
  templateForm.value = record ? { ...emptyTemplateForm(), ...record } : emptyTemplateForm();
  templateModalOpen.value = true;
}

async function saveTemplate() {
  const body = { ...templateForm.value };
  if (!body.code || !body.name || !body.category || !body.content) {
    message.warning(t('page.consent.messages.templateRequired'));
    return;
  }
  if (editingTemplate.value?.id) {
    await vpetConsentTemplateUpdate(editingTemplate.value.id, body);
    message.success(t('page.consent.messages.templateUpdated'));
  } else {
    await vpetConsentTemplateCreate(body);
    message.success(t('page.consent.messages.templateCreated'));
  }
  templateModalOpen.value = false;
  await Promise.all([loadTemplates(), loadMasterData()]);
}

async function disableTemplate(record: any) {
  await vpetConsentTemplateDelete(record.id);
  message.success(t('page.consent.messages.templateDeleted'));
  await Promise.all([loadTemplates(), loadMasterData()]);
}

async function openRecordModal() {
  if (!customerOptions.value.length || !activeTemplates.value.length) await loadMasterData();
  recordForm.value = emptyRecordForm();
  petOptions.value = [];
  recordModalOpen.value = true;
}

async function handleVisitChange(value?: number) {
  if (!value) return;
  const visit = visitMap.value.get(Number(value));
  const relation = getVisitRelation(visit);
  recordForm.value.customerId = relation.customerId;
  recordForm.value.petId = relation.petId;
  recordForm.value.doctorId = relation.doctorId;
  petOptions.value = await loadPets(relation.customerId);
  const customer = customerOptions.value.find((item: any) => Number(item.value) === Number(relation.customerId))?.raw;
  recordForm.value.guardianName = customer?.name || recordForm.value.guardianName;
  recordForm.value.guardianPhone = customer?.phone || recordForm.value.guardianPhone;
}

async function handleCustomerChange(value?: number) {
  recordForm.value.petId = undefined;
  petOptions.value = await loadPets(value);
  const customer = customerOptions.value.find((item: any) => Number(item.value) === Number(value))?.raw;
  recordForm.value.guardianName = customer?.name || '';
  recordForm.value.guardianPhone = customer?.phone || '';
}

function handleTemplateChange(value?: number) {
  const template = value ? templateMap.value.get(Number(value)) : null;
  if (template?.riskLevel === 'high' || template?.riskLevel === 'critical') {
    message.info(consentRiskLevelText(template.riskLevel));
  }
}

async function saveRecord() {
  if (!recordForm.value.templateId || !recordForm.value.customerId || !recordForm.value.petId) {
    message.warning(t('page.consent.messages.templateRequired'));
    return;
  }
  await vpetConsentRecordCreate(recordForm.value);
  message.success(t('page.consent.messages.recordCreated'));
  recordModalOpen.value = false;
  await loadRecords();
}

function openSignModal(record: any) {
  signingRecord.value = record;
  signForm.value = {
    guardianName: record.guardianName || record.customerSnapshot?.name || '',
    guardianPhone: record.guardianPhone || record.customerSnapshot?.phone || '',
    signatureData: '',
  };
  signModalOpen.value = true;
}

async function saveSignature() {
  if (!signingRecord.value?.id || !signForm.value.guardianName) return;
  await vpetConsentRecordSign(signingRecord.value.id, signForm.value);
  message.success(t('page.consent.messages.recordSigned'));
  signModalOpen.value = false;
  await loadRecords();
}

async function voidRecord(record: any) {
  await vpetConsentRecordVoid(record.id);
  message.success(t('page.consent.messages.recordVoided'));
  await loadRecords();
}

function openPreview(record: any, isTemplate = false) {
  previewItem.value = isTemplate
    ? { ...record, title: record.name, contentSnapshot: record.content }
    : record;
  previewOpen.value = true;
}

onMounted(async () => {
  await loadMasterData();
  await loadRecords();
});
</script>

<style scoped>
.consent-help {
  margin-bottom: 15px;
}

.consent-preview {
  color: #1f2933;
  line-height: 1.8;
}

.consent-preview h2 {
  margin-bottom: 12px;
  text-align: center;
}

.consent-preview-meta {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 15px;
}

.consent-preview pre {
  white-space: pre-wrap;
  word-break: break-word;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  font-family: inherit;
}

.consent-signature {
  margin-top: 15px;
  text-align: right;
}
</style>
