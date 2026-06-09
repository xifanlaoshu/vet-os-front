<template>
  <div class="vpet-page">
    <DynamicTable
      class="vpet-panel-card"
      :header-title="t('page.prescription.title')"
      show-index
      :data-request="loadTableData"
      :columns="columns"
    >
      <template #toolbar>
        <a-space>
          <a-button @click="openTemplateModal">
            {{ t('page.prescription.templateManager') }}
          </a-button>
          <a-button type="primary" @click="openCreateModal()">
            <Icon icon="ant-design:plus-outlined" />
            {{ t('page.prescription.add') }}
          </a-button>
        </a-space>
      </template>
    </DynamicTable>

    <a-modal
      v-model:open="createVisible"
      :title="t('page.prescription.add')"
      :width="960"
      :confirm-loading="saving"
      destroy-on-close
      @ok="submitCreate"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.prescription.fields.visit')">
              <a-select
                v-model:value="form.visitId"
                show-search
                :filter-option="filterByLabel"
                :options="visitOptions"
                :placeholder="t('page.prescription.messages.selectVisit')"
                @change="handleVisitChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.prescription.fields.doctor')">
              <a-input :value="selectedVisitDoctorText" disabled :placeholder="t('page.prescription.doctorPlaceholder')" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.prescription.fields.customer')">
              <a-input :value="selectedVisitCustomerText" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.prescription.fields.pet')">
              <a-input :value="selectedVisitPetText" disabled />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item :label="t('page.prescription.fields.template')">
          <a-select
            v-model:value="selectedTemplateId"
            allow-clear
            mode="multiple"
            show-search
            :filter-option="filterByLabel"
            :options="templateOptions"
            :placeholder="t('page.prescription.placeholders.template')"
            @change="applyTemplate"
          />
        </a-form-item>

        <a-form-item :label="t('page.prescription.fields.diagnosisSummary')">
          <a-input v-model:value="form.diagnosisSummary" :placeholder="t('page.prescription.placeholders.diagnosisSummary')" />
        </a-form-item>

        <a-divider orientation="left">{{ t('page.prescription.detailItems') }}</a-divider>

        <a-table
          row-key="rowKey"
          size="small"
          :pagination="false"
          :columns="detailInputColumns"
          :data-source="form.details"
          :scroll="{ x: 1080 }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'item'">
              <a-select
                v-model:value="record.itemSelectValue"
                show-search
                :filter-option="false"
                :options="chargeableOptions"
                :placeholder="t('page.prescription.placeholders.drug')"
                style="width: 100%"
                @search="handleChargeableSearch"
                @change="(value) => handleChargeableChange(index, value)"
              />
            </template>
            <template v-else-if="column.key === 'specification'">
              <a-input :value="record.specification || '-'" disabled />
            </template>
            <template v-else-if="column.key === 'dosage'">
              <a-input v-model:value="record.dosage" :placeholder="t('page.prescription.fields.dosage')" />
            </template>
            <template v-else-if="column.key === 'frequency'">
              <a-input v-model:value="record.frequency" :placeholder="t('page.prescription.fields.frequency')" />
            </template>
            <template v-else-if="column.key === 'quantity'">
              <a-input-number v-model:value="record.quantity" :min="0.01" :precision="2" style="width: 100%" />
            </template>
            <template v-else-if="column.key === 'dosageUnit'">
              <a-input :value="record.dosageUnit || '-'" disabled />
            </template>
            <template v-else-if="column.key === 'unitPrice'">
              <a-input-number v-model:value="record.unitPrice" :min="0" style="width: 100%" />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" danger @click="removeDetail(index)">{{ t('common.delete') }}</a-button>
            </template>
          </template>
        </a-table>

        <a-button class="vpet-block-top" size="small" @click="addDetail">{{ t('page.prescription.addDrug') }}</a-button>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="templateVisible"
      :title="t('page.prescription.templateManager')"
      :width="980"
      destroy-on-close
      @ok="submitTemplate"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item :label="t('page.prescription.fields.templateCode')">
              <a-input v-model:value="templateForm.templateCode" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.prescription.fields.templateName')">
              <a-input v-model:value="templateForm.templateName" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.prescription.fields.templateCategory')">
              <a-input v-model:value="templateForm.category" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.prescription.fields.templateDescription')">
              <a-input v-model:value="templateForm.description" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider orientation="left">{{ t('page.prescription.templateItems') }}</a-divider>
        <a-alert
          type="info"
          show-icon
          class="vpet-block-bottom"
          :message="t('page.prescription.formulaHelp')"
        />
        <a-table
          row-key="rowKey"
          size="small"
          :pagination="false"
          :columns="templateInputColumns"
          :data-source="templateForm.items"
          :scroll="{ x: 1420 }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'item'">
              <a-select
                v-model:value="record.itemSelectValue"
                show-search
                :filter-option="false"
                :options="chargeableOptions"
                :placeholder="t('page.prescription.placeholders.drug')"
                style="width: 100%"
                @search="handleChargeableSearch"
                @change="(value) => handleTemplateChargeableChange(index, value)"
              />
            </template>
            <template v-else-if="column.key === 'specification'">
              <a-input :value="record.specification || '-'" disabled />
            </template>
            <template v-else-if="column.key === 'dosage'">
              <a-input v-model:value="record.dosage" :placeholder="t('page.prescription.fields.dosage')" />
            </template>
            <template v-else-if="column.key === 'dosageFormula'">
              <a-input v-model:value="record.dosageFormula" :placeholder="t('page.prescription.placeholders.formula')" />
            </template>
            <template v-else-if="column.key === 'frequency'">
              <a-input v-model:value="record.frequency" :placeholder="t('page.prescription.fields.frequency')" />
            </template>
            <template v-else-if="column.key === 'quantity'">
              <a-input-number v-model:value="record.quantity" :min="0.01" :precision="2" style="width: 100%" />
            </template>
            <template v-else-if="column.key === 'quantityFormula'">
              <a-input v-model:value="record.quantityFormula" :placeholder="t('page.prescription.placeholders.formula')" />
            </template>
            <template v-else-if="column.key === 'dosageUnit'">
              <a-input :value="record.dosageUnit || '-'" disabled />
            </template>
            <template v-else-if="column.key === 'unitPrice'">
              <a-input-number v-model:value="record.unitPrice" :min="0" style="width: 100%" />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" danger @click="removeTemplateDetail(index)">{{ t('common.delete') }}</a-button>
            </template>
          </template>
        </a-table>
        <a-space class="vpet-block-bottom">
          <a-button size="small" @click="addTemplateDetail">{{ t('page.prescription.addDrug') }}</a-button>
        </a-space>

        <a-table
          row-key="id"
          size="small"
          :pagination="false"
          :columns="templateColumns"
          :data-source="templates"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'items'">
              {{ (record.items || []).map((item: any) => item.itemName || item.drugName).join(' / ') || '-' }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" danger size="small" @click="deleteTemplate(record)">
                {{ t('common.delete') }}
              </a-button>
            </template>
          </template>
        </a-table>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useTable } from '@/components/core/dynamic-table';
import Icon from '@/components/basic/icon/Icon.vue';
import { createPrescriptionColumns } from './columns';
import {
  vpetPrescriptionCreate,
  vpetPrescriptionList,
  vpetPrescriptionTemplateCreate,
  vpetPrescriptionTemplateDelete,
  vpetPrescriptionTemplateList,
} from '@/api/backend/vpet';
import { vpetPharmacyChargeableSearch } from '@/api/backend/vpet/pharmacy';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';
import { calculatePrescriptionFormula } from './formula';

defineOptions({ name: 'VPetPrescription' });

type ChargeableOption = {
  value: string;
  label: string;
  raw: any;
};

type PrescriptionDetailForm = {
  rowKey: string;
  itemSelectValue?: string;
  itemKind: number;
  itemId?: number;
  itemName: string;
  drugId?: number;
  chargeItemId?: number;
  drugName: string;
  specification?: string;
  dosage?: string;
  dosageFormula?: string;
  dosageUnit?: string;
  frequency?: string;
  quantity: number;
  quantityFormula?: string;
  unitPrice: number;
};

const { t } = useVpetLocale();
const {
  customerLabel,
  doctorLabel,
  filterByLabel,
  loadDoctors: loadDoctorOptions,
  loadVisits: loadVisitOptions,
  petLabel,
  visitLabel,
} = useVpetReference();
const [DynamicTable, dynamicTableInstance] = useTable();

let chargeableSearchTimer: number | undefined;
let detailRowSeed = 0;

function createDetailRowKey() {
  detailRowSeed += 1;
  return `rx-detail-${Date.now()}-${detailRowSeed}`;
}

function createEmptyDetail(): PrescriptionDetailForm {
  return {
    rowKey: createDetailRowKey(),
    drugId: undefined,
    chargeItemId: undefined,
    itemSelectValue: undefined,
    itemKind: 1,
    itemId: undefined,
    itemName: '',
    drugName: '',
    specification: '',
    dosage: '',
    dosageFormula: '',
    dosageUnit: '',
    frequency: 'bid',
    quantity: 1,
    quantityFormula: '',
    unitPrice: 0,
  };
}

function createEmptyTemplateForm() {
  return {
    templateCode: '',
    templateName: '',
    category: '',
    description: '',
    items: [createEmptyDetail()],
  };
}

const createVisible = ref(false);
const templateVisible = ref(false);
const saving = ref(false);
const visitOptions = ref<any[]>([]);
const doctorMap = ref<Record<number, string>>({});
const chargeableOptions = ref<ChargeableOption[]>([]);
const templates = ref<any[]>([]);
const selectedTemplateId = ref<number[]>([]);
const form = ref({
  visitId: undefined as number | undefined,
  doctorId: undefined as number | undefined,
  diagnosisSummary: '',
  details: [] as PrescriptionDetailForm[],
});
const templateForm = ref(createEmptyTemplateForm());

function parseDiagnosisSummary(visit?: any) {
  let raw = visit?.diagnosis;
  if (Array.isArray(visit?.diagnoses)) {
    raw = visit.diagnoses;
  } else if (typeof visit?.diagnosis === 'string') {
    try {
      raw = JSON.parse(visit.diagnosis);
    } catch {
      raw = [];
    }
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item: any) => item?.name || item?.code).filter(Boolean).join(' / ');
  }
  return '';
}

async function loadVisits() {
  try {
    visitOptions.value = await loadVisitOptions();
  } catch {
    visitOptions.value = [];
  }
}

async function loadDoctors() {
  try {
    const options = await loadDoctorOptions();
    doctorMap.value = Object.fromEntries(options.map(item => [Number(item.value), item.label]));
  } catch {
    doctorMap.value = {};
  }
}

async function searchChargeableOptions(keyword = '') {
  try {
    const res: any[] = await vpetPharmacyChargeableSearch(keyword);
    setChargeableOptions((res || []).map((item: any) => ({
      value: `${item.itemKind}:${item.itemId}`,
      label: chargeableLabelFromOption(item),
      raw: item,
    })));
  } catch {
    setChargeableOptions([]);
  }
}

function chargeableLabelFromOption(item: any) {
  const source = item.itemKind === 2 ? t('page.serviceItem.title') : t('page.pharmacy.title');
  const name = item.itemName || item.drugName;
  const specification = item.specification ? ` / ${item.specification}` : '';
  const unit = item.dosageUnit || item.unit || '';
  const stock = item.currentStock !== undefined && item.currentStock !== null
    ? ` / ${t('page.pharmacy.fields.currentStock')} ${Number(item.currentStock || 0).toFixed(2)}${unit}`
    : '';
  const price = ` / ${Number(item.retailPrice || 0).toFixed(2)}${t('common.amountUnit')}${unit ? `/${unit}` : ''}`;
  return `${source} / ${name}${specification}${price}${stock}`;
}

function chargeableValueFromDetail(detail: Partial<PrescriptionDetailForm> | any) {
  const itemKind = Number(detail.itemKind || (detail.chargeItemId ? 2 : 1));
  const itemId = detail.itemId || detail.drugId || detail.chargeItemId;
  return itemId ? `${itemKind}:${itemId}` : undefined;
}

function chargeableLabelFromDetail(detail: Partial<PrescriptionDetailForm> | any) {
  const itemKind = Number(detail.itemKind || (detail.chargeItemId ? 2 : 1));
  const name = detail.itemName || detail.drugName || t('page.consultation.detail.drugFallback');
  const specification = detail.specification ? ` / ${detail.specification}` : '';
  const unit = detail.dosageUnit ? ` / ${detail.dosageUnit}` : '';
  return `${itemKind === 2 ? t('page.serviceItem.title') : t('page.pharmacy.title')} / ${name}${specification}${unit}`;
}

function chargeableOptionFromDetail(detail: PrescriptionDetailForm): ChargeableOption | undefined {
  const value = detail.itemSelectValue || chargeableValueFromDetail(detail);
  if (!value) return undefined;
  return {
    value,
    label: chargeableLabelFromDetail(detail),
    raw: {
      ...detail,
      itemKind: detail.itemKind,
      itemId: detail.itemId,
      itemName: detail.itemName || detail.drugName,
      drugName: detail.drugName || detail.itemName,
      retailPrice: detail.unitPrice,
      dosageUnit: detail.dosageUnit,
    },
  };
}

function setChargeableOptions(baseOptions: ChargeableOption[]) {
  const optionMap = new Map<string, ChargeableOption>();
  [...baseOptions, ...form.value.details.map(chargeableOptionFromDetail), ...templateForm.value.items.map(chargeableOptionFromDetail)]
    .filter(Boolean)
    .forEach((item: any) => {
      optionMap.set(String(item.value), item);
    });
  chargeableOptions.value = Array.from(optionMap.values());
}

async function loadTemplates() {
  const data: any = await vpetPrescriptionTemplateList({ page: 1, pageSize: 100, status: 1 });
  templates.value = data?.items || [];
}

const templateOptions = computed(() =>
  templates.value.map(item => ({
    value: item.id,
    label: `${item.templateName} / ${item.templateCode}`,
  })),
);

function handleChargeableSearch(keyword: string) {
  window.clearTimeout(chargeableSearchTimer);
  chargeableSearchTimer = window.setTimeout(() => {
    searchChargeableOptions(keyword);
  }, 250);
}

function handleVisitChange(value?: number) {
  const visit = visitOptions.value.find(item => Number(item.value) === Number(value))?.raw;
  form.value.visitId = value;
  form.value.doctorId = visit?.doctorId;
  form.value.diagnosisSummary = parseDiagnosisSummary(visit);
}

function handleChargeableChange(index: number, value?: any) {
  const option = chargeableOptions.value.find(item => String(item.value) === String(value))?.raw;
  const detail = form.value.details[index];
  if (!detail || !option) return;
  fillDetailFromChargeableItem(detail, option);
}

function fillDetailFromChargeableItem(detail: PrescriptionDetailForm, option: any) {
  const itemKind = Number(option.itemKind || 1);
  detail.itemSelectValue = `${itemKind}:${option.itemId || option.id}`;
  detail.itemKind = itemKind;
  detail.itemId = option.itemId || option.id;
  detail.itemName = option.itemName || option.drugName;
  detail.drugId = itemKind === 1 ? (option.drugId || option.id) : undefined;
  detail.chargeItemId = itemKind === 2 ? (option.chargeItemId || option.id) : undefined;
  detail.drugName = option.itemName || option.drugName;
  detail.specification = option.specification || '';
  detail.dosageUnit = option.dosageUnit || option.unit || '';
  detail.unitPrice = Number(option.retailPrice || 0);
}

function handleTemplateChargeableChange(index: number, value?: any) {
  const option = chargeableOptions.value.find(item => String(item.value) === String(value))?.raw;
  const detail = templateForm.value.items[index];
  if (!detail || !option) return;
  fillDetailFromChargeableItem(detail, option);
}

function createDetailFromTemplateItem(item: any): PrescriptionDetailForm {
  const itemSelectValue = `${Number(item.itemKind || 1)}:${item.itemId || item.drugId || item.chargeItemId}`;
  return {
    rowKey: createDetailRowKey(),
    itemSelectValue,
    itemKind: Number(item.itemKind || 1),
    itemId: item.itemId || item.drugId || item.chargeItemId,
    itemName: item.itemName || item.drugName,
    drugId: item.drugId,
    chargeItemId: item.chargeItemId,
    drugName: item.itemName || item.drugName,
    specification: item.specification || '',
    dosage: calculateDosageFromTemplate(item),
    dosageFormula: item.dosageFormula || '',
    dosageUnit: item.dosageUnit || item.unit || '',
    frequency: item.frequency || '',
    quantity: calculateQuantityFromTemplate(item),
    quantityFormula: item.quantityFormula || '',
    unitPrice: Number(item.unitPrice || 0),
  };
}

function selectedVisitWeight() {
  return Number(selectedVisit.value?.pet?.weight || selectedVisit.value?.petSnapshot?.weight || 0) || undefined;
}

function calculateDosageFromTemplate(item: any) {
  const calculated = calculatePrescriptionFormula(item.dosageFormula, { weight: selectedVisitWeight() });
  return calculated === undefined ? (item.dosage || '') : String(calculated);
}

function calculateQuantityFromTemplate(item: any) {
  const calculated = calculatePrescriptionFormula(item.quantityFormula, { weight: selectedVisitWeight() });
  return calculated === undefined ? Number(item.quantity || 1) : calculated;
}

function normalizeTemplateIds(templateIds?: number[] | number) {
  if (Array.isArray(templateIds)) return templateIds.map(Number).filter(Boolean);
  return templateIds ? [Number(templateIds)] : [];
}

function applyTemplate(templateIds?: number[] | number) {
  const ids = normalizeTemplateIds(templateIds);
  if (!ids.length) {
    form.value.details = [createEmptyDetail()];
    setChargeableOptions(chargeableOptions.value);
    return;
  }
  const selectedTemplates = templates.value.filter(item => ids.includes(Number(item.id)));
  const details = selectedTemplates.flatMap(template => (template.items || []).map(createDetailFromTemplateItem));
  form.value.details = details.length ? details : [createEmptyDetail()];
  setChargeableOptions(chargeableOptions.value);
}

function addDetail() {
  form.value.details.push(createEmptyDetail());
}

function removeDetail(index: number) {
  form.value.details.splice(index, 1);
}

function resetForm() {
  form.value = {
    visitId: undefined,
    doctorId: undefined,
    diagnosisSummary: '',
    details: [createEmptyDetail()],
  };
  selectedTemplateId.value = [];
}

async function openCreateModal() {
  resetForm();
  if (!templates.value.length) await loadTemplates();
  createVisible.value = true;
}

async function openTemplateModal() {
  templateForm.value = createEmptyTemplateForm();
  if (!chargeableOptions.value.length) await searchChargeableOptions('');
  await loadTemplates();
  templateVisible.value = true;
}

function addTemplateDetail() {
  templateForm.value.items.push(createEmptyDetail());
}

function removeTemplateDetail(index: number) {
  templateForm.value.items.splice(index, 1);
}

async function submitTemplate() {
  if (!templateForm.value.templateCode || !templateForm.value.templateName) {
    message.error(t('page.prescription.messages.templateRequired'));
    return;
  }

  const items = templateForm.value.items
    .filter(item => item.itemId || item.drugId || item.chargeItemId)
    .map((item, index) => ({
      itemKind: item.itemKind,
      itemId: item.itemId,
      itemName: item.itemName,
      drugId: item.drugId,
      chargeItemId: item.chargeItemId,
      drugName: item.drugName,
      specification: item.specification,
      dosage: item.dosage,
      dosageFormula: item.dosageFormula,
      dosageUnit: item.dosageUnit,
      frequency: item.frequency,
      quantity: Number(item.quantity || 1),
      quantityFormula: item.quantityFormula,
      unitPrice: Number(item.unitPrice || 0),
      sortNo: index,
    }));
  if (!items.length) {
    message.error(t('page.prescription.messages.selectDrug'));
    return;
  }

  await vpetPrescriptionTemplateCreate({
    templateCode: templateForm.value.templateCode,
    templateName: templateForm.value.templateName,
    category: templateForm.value.category || undefined,
    description: templateForm.value.description || undefined,
    items,
  });
  message.success(t('page.prescription.messages.templateCreated'));
  templateForm.value = createEmptyTemplateForm();
  await loadTemplates();
}

async function deleteTemplate(record: any) {
  await vpetPrescriptionTemplateDelete(record.id);
  message.success(t('page.prescription.messages.templateDeleted'));
  await loadTemplates();
}

async function submitCreate() {
  if (!form.value.visitId) {
    message.error(t('page.prescription.messages.selectVisit'));
    return;
  }
  if (!form.value.doctorId) {
    message.error(t('page.prescription.messages.doctorRequired'));
    return;
  }

  const details = form.value.details
    .filter(item => item.itemId || item.drugId || item.chargeItemId)
    .map(item => ({
      itemKind: item.itemKind,
      itemId: item.itemId,
      itemName: item.itemName,
      drugId: item.drugId,
      chargeItemId: item.chargeItemId,
      drugName: item.drugName,
      specification: item.specification,
      dosage: item.dosage,
      dosageUnit: item.dosageUnit,
      frequency: item.frequency,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    }));

  if (!details.length) {
    message.error(t('page.prescription.messages.selectDrug'));
    return;
  }

  saving.value = true;
  try {
    await vpetPrescriptionCreate({
      visitId: form.value.visitId,
      doctorId: form.value.doctorId,
      diagnosisSummary: form.value.diagnosisSummary,
      details,
    });
    message.success(t('page.prescription.messages.created'));
    createVisible.value = false;
    dynamicTableInstance?.reload();
  } finally {
    saving.value = false;
  }
}

const selectedVisit = computed(() => {
  return visitOptions.value.find(item => Number(item.value) === Number(form.value.visitId))?.raw;
});

const selectedVisitCustomerText = computed(() => {
  return customerLabel(
    selectedVisit.value?.customer,
    selectedVisit.value?.customerSnapshot,
    selectedVisit.value?.customerId,
  );
});

const selectedVisitPetText = computed(() => {
  return petLabel(
    selectedVisit.value?.pet,
    selectedVisit.value?.petSnapshot,
    selectedVisit.value?.petId,
  );
});

const selectedVisitDoctorText = computed(() => {
  return doctorLabel(
    selectedVisit.value?.doctor,
    form.value.doctorId,
    selectedVisit.value?.doctorName || doctorMap.value[form.value.doctorId!],
  );
});

function visitLabelById(visitId?: number) {
  return visitLabel(visitOptions.value, visitId);
}

const loadTableData = async (params: any) => {
  return vpetPrescriptionList(params) as any;
};

const columns = [
  ...createPrescriptionColumns(visitLabelById),
  {
    title: t('common.action'),
    width: 80,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: () => [],
  },
];

const templateColumns = [
  { title: t('page.prescription.fields.templateCode'), dataIndex: 'templateCode', width: 140 },
  { title: t('page.prescription.fields.templateName'), dataIndex: 'templateName', width: 180 },
  { title: t('page.prescription.fields.templateCategory'), dataIndex: 'category', width: 120 },
  { title: t('page.prescription.templateItems'), key: 'items' },
  { title: t('common.action'), key: 'action', width: 90 },
];

const detailInputColumns = [
  { title: t('page.prescription.fields.item'), key: 'item', width: 260 },
  { title: t('page.prescription.fields.specification'), key: 'specification', width: 150 },
  { title: t('page.prescription.fields.dosage'), key: 'dosage', width: 130 },
  { title: t('page.prescription.fields.frequency'), key: 'frequency', width: 120 },
  { title: t('page.prescription.fields.quantity'), key: 'quantity', width: 110 },
  { title: t('page.prescription.fields.dosageUnit'), key: 'dosageUnit', width: 90 },
  { title: t('page.prescription.fields.unitPrice'), key: 'unitPrice', width: 120 },
  { title: t('common.action'), key: 'action', width: 90, fixed: 'right' as const },
];

const templateInputColumns = [
  { title: t('page.prescription.fields.item'), key: 'item', width: 260 },
  { title: t('page.prescription.fields.specification'), key: 'specification', width: 140 },
  { title: t('page.prescription.fields.dosage'), key: 'dosage', width: 110 },
  { title: t('page.prescription.fields.dosageFormula'), key: 'dosageFormula', width: 180 },
  { title: t('page.prescription.fields.frequency'), key: 'frequency', width: 110 },
  { title: t('page.prescription.fields.quantity'), key: 'quantity', width: 100 },
  { title: t('page.prescription.fields.quantityFormula'), key: 'quantityFormula', width: 180 },
  { title: t('page.prescription.fields.dosageUnit'), key: 'dosageUnit', width: 90 },
  { title: t('page.prescription.fields.unitPrice'), key: 'unitPrice', width: 110 },
  { title: t('common.action'), key: 'action', width: 90, fixed: 'right' as const },
];

onMounted(async () => {
  await Promise.all([loadVisits(), loadDoctors(), searchChargeableOptions(''), loadTemplates()]);
});
</script>
