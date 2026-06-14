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
      :width="1120"
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

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item :label="t('page.prescription.fields.type')" required>
              <a-select v-model:value="form.type" :options="prescriptionTypeOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="16">
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
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.prescription.fields.diagnosisSummary')">
              <a-input v-model:value="form.diagnosisSummary" :placeholder="t('page.prescription.placeholders.diagnosisSummary')" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider orientation="left">{{ t('page.prescription.detailItems') }}</a-divider>

        <a-table
          class="vpet-edit-table vpet-rx-edit-table"
          row-key="rowKey"
          size="small"
          :pagination="false"
          :columns="detailInputColumns"
          :data-source="form.details"
          :scroll="{ x: 1400 }"
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
      :width="1240"
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
          class="vpet-edit-table vpet-rx-edit-table"
          row-key="rowKey"
          size="small"
          :pagination="false"
          :columns="templateInputColumns"
          :data-source="templateForm.items"
          :scroll="{ x: 1790 }"
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

    <a-drawer
      v-model:open="detailVisible"
      :title="t('page.prescription.detailTitle')"
      width="760"
      destroy-on-close
    >
      <a-descriptions :column="2" size="small" bordered>
        <a-descriptions-item :label="t('page.prescription.fields.rxNo')">
          {{ detailPrescription?.rxNo || '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.prescription.fields.type')">
          <a-tag :color="prescriptionTypeColor(detailPrescription?.type)">
            {{ prescriptionTypeText(detailPrescription?.type) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.prescription.fields.visit')">
          {{ visitLabelById(detailPrescription?.visitId) }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.prescription.fields.doctor')">
          {{ doctorLabel(detailPrescription?.doctor, detailPrescription?.doctorId, detailPrescription?.doctorSnapshot?.name) }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.prescription.fields.customer')">
          {{ customerLabel(null, detailPrescription?.customerSnapshot, detailPrescription?.customerId) }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.prescription.fields.pet')">
          {{ petLabel(null, detailPrescription?.petSnapshot, detailPrescription?.petId) }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.prescription.fields.diagnosisSummary')" :span="2">
          {{ detailPrescription?.diagnosisSummary || '-' }}
        </a-descriptions-item>
      </a-descriptions>

      <a-divider>{{ t('page.prescription.detailItems') }}</a-divider>
      <a-table
        row-key="id"
        size="small"
        :pagination="false"
        :columns="detailViewColumns"
        :data-source="detailPrescription?.details || []"
      />
      <a-space class="vpet-block-top">
        <a-button type="primary" @click="openPrescriptionPrint(detailPrescription)">
          {{ t('page.prescription.print') }}
        </a-button>
      </a-space>
    </a-drawer>

    <a-modal
      v-model:open="printVisible"
      :title="t('page.prescription.print')"
      width="900px"
      :footer="null"
      destroy-on-close
    >
      <a-space class="vpet-block-bottom">
        <a-select
          v-model:value="selectedPrintTemplateId"
          style="width: 260px"
          :options="prescriptionPrintTemplateOptions"
          :placeholder="t('page.printTemplate.selectTemplate')"
        />
        <a-button type="primary" @click="printCurrentPrescription">{{ t('common.print') }}</a-button>
      </a-space>
      <div id="vpet-prescription-print-area" class="vpet-print-paper" v-html="prescriptionPrintHtml" />
    </a-modal>
  </div>
</template>

<script setup lang="tsx">
import { computed, nextTick, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useTable } from '@/components/core/dynamic-table';
import Icon from '@/components/basic/icon/Icon.vue';
import { createPrescriptionColumns } from './columns';
import {
  vpetPrescriptionCreate,
  vpetPrescriptionGet,
  vpetPrescriptionList,
  vpetPrescriptionTemplateCreate,
  vpetPrescriptionTemplateDelete,
  vpetPrescriptionTemplateList,
  vpetPrintTemplateActive,
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

const {
  t,
  prescriptionTypeColor,
  prescriptionTypeOptions,
  prescriptionTypeText,
} = useVpetLocale();
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
const detailVisible = ref(false);
const printVisible = ref(false);
const detailPrescription = ref<any>(null);
const prescriptionPrintTemplates = ref<any[]>([]);
const selectedPrintTemplateId = ref<number | undefined>();
const form = ref({
  visitId: undefined as number | undefined,
  doctorId: undefined as number | undefined,
  type: 1,
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
    type: 1,
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

async function openDetail(record: any) {
  detailPrescription.value = await vpetPrescriptionGet(record.id);
  detailVisible.value = true;
}

async function loadPrescriptionPrintTemplates() {
  const data: any = await vpetPrintTemplateActive({ templateType: 'prescription' });
  prescriptionPrintTemplates.value = Array.isArray(data) ? data : [];
  selectedPrintTemplateId.value = prescriptionPrintTemplates.value.find(item => Number(item.defaultTemplate) === 1)?.id
    ?? prescriptionPrintTemplates.value[0]?.id;
}

async function openPrescriptionPrint(record: any) {
  if (!record?.id) return;
  detailPrescription.value = record.details ? record : await vpetPrescriptionGet(record.id);
  if (!prescriptionPrintTemplates.value.length) await loadPrescriptionPrintTemplates();
  printVisible.value = true;
}

async function printCurrentPrescription() {
  await nextTick();
  window.print();
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
      type: form.value.type,
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
    width: 130,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:eye-outlined',
        tooltip: t('common.detail'),
        onClick: () => openDetail(record),
      },
      {
        icon: 'ant-design:printer-outlined',
        tooltip: t('page.prescription.print'),
        onClick: () => openPrescriptionPrint(record),
      },
    ],
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
  { title: t('page.prescription.fields.item'), key: 'item', width: 380 },
  { title: t('page.prescription.fields.specification'), key: 'specification', width: 180 },
  { title: t('page.prescription.fields.dosage'), key: 'dosage', width: 220 },
  { title: t('page.prescription.fields.frequency'), key: 'frequency', width: 180 },
  { title: t('page.prescription.fields.quantity'), key: 'quantity', width: 130 },
  { title: t('page.prescription.fields.dosageUnit'), key: 'dosageUnit', width: 120 },
  { title: t('page.prescription.fields.unitPrice'), key: 'unitPrice', width: 130 },
  { title: t('common.action'), key: 'action', width: 90, fixed: 'right' as const },
];

const detailViewColumns = [
  { title: t('page.prescription.fields.item'), dataIndex: 'itemName', width: 180 },
  { title: t('page.prescription.fields.specification'), dataIndex: 'specification', width: 140 },
  { title: t('page.prescription.fields.dosage'), dataIndex: 'dosage', width: 120 },
  { title: t('page.prescription.fields.frequency'), dataIndex: 'frequency', width: 100 },
  { title: t('page.prescription.fields.quantity'), dataIndex: 'quantity', width: 90 },
  { title: t('page.prescription.fields.dosageUnit'), dataIndex: 'dosageUnit', width: 100 },
  {
    title: t('page.prescription.fields.unitPrice'),
    dataIndex: 'unitPrice',
    width: 100,
    customRender: ({ text }: any) => Number(text || 0).toFixed(2),
  },
  {
    title: t('page.billing.fields.amount'),
    dataIndex: 'amount',
    width: 100,
    customRender: ({ text }: any) => Number(text || 0).toFixed(2),
  },
];

const prescriptionPrintTemplateOptions = computed(() =>
  prescriptionPrintTemplates.value.map(item => ({
    value: item.id,
    label: `${item.name} / ${item.paperType || 'A4'}`,
  })),
);

const prescriptionPrintHtml = computed(() => {
  const rx = detailPrescription.value || {};
  const template = prescriptionPrintTemplates.value.find(item => Number(item.id) === Number(selectedPrintTemplateId.value));
  const model = buildPrescriptionPrintModel(rx);
  const fallback = [
    '<h1>宠物医院处方单</h1>',
    '<p>处方号：{{rxNo}}　类别：{{prescriptionType}}　打印时间：{{printedAt}}</p>',
    '<p>宠主：{{customerName}}　宠物：{{petName}}　医生：{{doctorName}}</p>',
    '<p>诊断：{{diagnosisSummary}}</p>',
    '{{itemsTable}}',
    '<p class="vpet-print-sign">医生签名：____________</p>',
  ].join('');
  const content = template
    ? [template.templateHeader, template.templateBody, template.templateFooter].filter(Boolean).join('\n')
    : fallback;
  return renderPrintTemplate(content, model);
});

function buildPrescriptionPrintModel(rx: any) {
  const details = rx.details || [];
  const totalAmount = details.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  return {
    rxNo: rx.rxNo || '-',
    prescriptionType: prescriptionTypeText(rx.type),
    customerName: customerLabel(null, rx.customerSnapshot, rx.customerId),
    petName: petLabel(null, rx.petSnapshot, rx.petId),
    doctorName: doctorLabel(rx.doctor, rx.doctorId, rx.doctorSnapshot?.name),
    diagnosisSummary: rx.diagnosisSummary || '-',
    totalAmount: totalAmount.toFixed(2),
    createdAt: rx.createdAt ? new Date(rx.createdAt).toLocaleString() : '-',
    printedAt: new Date().toLocaleString(),
    itemsTable: buildPrescriptionItemsTable(details),
  };
}

function buildPrescriptionItemsTable(details: any[]) {
  const rows = details.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.itemName || item.drugName || '-')}</td>
      <td>${escapeHtml(item.specification || '-')}</td>
      <td>${escapeHtml(item.dosage || '-')}</td>
      <td>${escapeHtml(item.frequency || '-')}</td>
      <td>${Number(item.quantity || 0).toFixed(2)} ${escapeHtml(item.dosageUnit || '')}</td>
      <td>${Number(item.unitPrice || 0).toFixed(2)}</td>
      <td>${Number(item.amount || 0).toFixed(2)}</td>
    </tr>
  `).join('');
  return `<table class="vpet-print-table"><thead><tr><th>#</th><th>项目</th><th>规格</th><th>剂量</th><th>频次</th><th>数量</th><th>单价</th><th>金额</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderPrintTemplate(template: string, model: Record<string, any>) {
  const html = template.replace(/\n/g, '<br />');
  return html.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (key === 'itemsTable') return model.itemsTable || '';
    return escapeHtml(model[key] ?? '');
  });
}

function escapeHtml(value: any) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const templateInputColumns = [
  { title: t('page.prescription.fields.item'), key: 'item', width: 380 },
  { title: t('page.prescription.fields.specification'), key: 'specification', width: 170 },
  { title: t('page.prescription.fields.dosage'), key: 'dosage', width: 150 },
  { title: t('page.prescription.fields.dosageFormula'), key: 'dosageFormula', width: 240 },
  { title: t('page.prescription.fields.frequency'), key: 'frequency', width: 150 },
  { title: t('page.prescription.fields.quantity'), key: 'quantity', width: 120 },
  { title: t('page.prescription.fields.quantityFormula'), key: 'quantityFormula', width: 240 },
  { title: t('page.prescription.fields.dosageUnit'), key: 'dosageUnit', width: 120 },
  { title: t('page.prescription.fields.unitPrice'), key: 'unitPrice', width: 130 },
  { title: t('common.action'), key: 'action', width: 90, fixed: 'right' as const },
];

onMounted(async () => {
  await Promise.all([loadVisits(), loadDoctors(), searchChargeableOptions(''), loadTemplates()]);
});
</script>

<style lang="less" scoped>
  .vpet-rx-edit-table {
    :deep(.ant-table-cell) {
      vertical-align: top;
    }

    :deep(.ant-input),
    :deep(.ant-input-number),
    :deep(.ant-select) {
      width: 100%;
    }
  }

  .vpet-print-paper {
    padding: 24px;
    color: #111827;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    line-height: 1.8;

    :deep(h1) {
      margin: 0 0 16px;
      text-align: center;
      font-size: 22px;
      font-weight: 700;
    }

    :deep(.vpet-print-table) {
      width: 100%;
      margin: 12px 0;
      border-collapse: collapse;
    }

    :deep(.vpet-print-table th),
    :deep(.vpet-print-table td) {
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      text-align: left;
    }

    :deep(.vpet-print-sign) {
      margin-top: 28px;
      text-align: right;
    }
  }

  @media print {
    :global(body *) {
      visibility: hidden;
    }

    :global(#vpet-prescription-print-area),
    :global(#vpet-prescription-print-area *) {
      visibility: visible;
    }

    :global(#vpet-prescription-print-area) {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      border: 0 !important;
    }
  }
</style>
