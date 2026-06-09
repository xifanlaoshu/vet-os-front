<template>
  <div class="vpet-page vpet-stack">
    <a-card class="vpet-detail-card" :title="t('page.lab.reportTitle')" :bordered="false">
      <a-descriptions :column="2" size="small">
        <a-descriptions-item :label="t('page.lab.fields.orderNo')">{{ detail?.orderNo || '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.lab.fields.testName')">{{ detail?.testName || '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.lab.fields.customer')">{{ customerLabel(detail?.customer, detail?.customerSnapshot, detail?.customerId) }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.lab.fields.pet')">{{ petLabel(detail?.pet, detail?.petSnapshot, detail?.petId) }}</a-descriptions-item>
      </a-descriptions>
      <a-space class="vpet-block-spaced">
        <a-button @click="addRow">{{ t('page.lab.addItem') }}</a-button>
        <a-button @click="submitLis">{{ t('page.lab.submitLis') }}</a-button>
        <a-button @click="runAi">{{ t('page.ai.labInterpret') }}</a-button>
        <a-button @click="printPreview">{{ t('page.lab.print') }}</a-button>
        <a-button type="primary" @click="saveReport">{{ t('common.save') }}</a-button>
      </a-space>
      <a-alert v-if="aiSummary" class="vpet-block-spaced" type="info" :message="aiSummary.summaryForDoctor" :description="aiSummary.summaryForOwner" show-icon />
    </a-card>

    <a-card
      v-if="templateHeader"
      class="vpet-detail-card"
      :title="t('page.lab.fields.templateHeader')"
      :bordered="false"
    >
      <div class="vpet-pre-wrap">{{ templateHeader }}</div>
    </a-card>

    <a-card class="vpet-panel-card" :title="t('page.lab.reportItems')" :bordered="false">
      <div v-for="(item, index) in items" :key="index" class="vpet-form-grid">
        <a-input v-model:value="item.itemName" :placeholder="t('page.lab.fields.itemName')" />
        <a-input v-model:value="item.resultValue" :placeholder="t('page.lab.fields.resultValue')" />
        <a-input v-model:value="item.unit" :placeholder="t('page.lab.fields.unit')" />
        <a-input-number v-model:value="item.refMin" :placeholder="t('page.lab.fields.refMin')" />
        <a-input-number v-model:value="item.refMax" :placeholder="t('page.lab.fields.refMax')" />
        <a-input v-model:value="item.flag" :placeholder="t('page.lab.fields.flag')" />
        <a-button danger @click="removeRow(index)">{{ t('common.delete') }}</a-button>
        <div v-if="fieldDefinition(item)?.explanation" class="vpet-muted">
          {{ fieldDefinition(item)?.explanation }}
        </div>
      </div>
      <a-textarea v-model:value="reportSummary" :rows="4" :placeholder="t('page.lab.fields.reportSummary')" />
    </a-card>

    <a-card class="vpet-detail-card vpet-lab-print-card" :title="t('page.lab.printPreview')" :bordered="false">
      <div id="vpet-lab-print-preview" class="vpet-lab-print-preview" :style="{ fontSize: `${printConfig.fontSize || 12}px` }">
        <h2>{{ printConfig.title || detail?.testName || t('page.lab.reportTitle') }}</h2>
        <a-descriptions :column="2" size="small">
          <a-descriptions-item :label="t('page.lab.fields.orderNo')">{{ detail?.orderNo || '-' }}</a-descriptions-item>
          <a-descriptions-item :label="t('page.lab.fields.sampleType')">{{ detail?.sampleType || '-' }}</a-descriptions-item>
          <a-descriptions-item :label="t('page.lab.fields.customer')">{{ customerLabel(detail?.customer, detail?.customerSnapshot, detail?.customerId) }}</a-descriptions-item>
          <a-descriptions-item :label="t('page.lab.fields.pet')">{{ petLabel(detail?.pet, detail?.petSnapshot, detail?.petId) }}</a-descriptions-item>
        </a-descriptions>
        <div v-if="templateHeader" class="vpet-pre-wrap vpet-block-top">{{ templateHeader }}</div>
        <table>
          <thead>
            <tr>
              <th>{{ t('page.lab.fields.itemName') }}</th>
              <th>{{ t('page.lab.fields.englishAbbr') }}</th>
              <th>{{ t('page.lab.fields.resultValue') }}</th>
              <th>{{ t('page.lab.fields.unit') }}</th>
              <th v-if="printConfig.showReferenceRange">{{ t('page.lab.fields.referenceRange') }}</th>
              <th>{{ t('page.lab.fields.flag') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items.filter(row => row.itemName)" :key="item.id || item.itemCode || item.itemName">
              <td>{{ item.itemName }}</td>
              <td>{{ fieldDefinition(item)?.englishAbbr || '-' }}</td>
              <td>{{ item.resultValue || '-' }}</td>
              <td>{{ item.unit || '-' }}</td>
              <td v-if="printConfig.showReferenceRange">{{ referenceRangeText(item) }}</td>
              <td>{{ item.flag || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="reportSummary" class="vpet-block-top">
          <strong>{{ t('page.lab.fields.reportSummary') }}：</strong>{{ reportSummary }}
        </div>
        <div v-if="printConfig.showExplanation" class="vpet-block-top">
          <div v-for="definition in printableDefinitions" :key="definition.itemCode || definition.itemName">
            <strong>{{ definition.itemName }}：</strong>
            {{ [definition.explanation, definition.clinicalSignificance].filter(Boolean).join(' / ') }}
          </div>
        </div>
        <div v-if="templateFooter" class="vpet-pre-wrap vpet-block-top">{{ templateFooter }}</div>
      </div>
    </a-card>

    <a-card
      v-if="templateFooter"
      class="vpet-detail-card"
      :title="t('page.lab.fields.templateFooter')"
      :bordered="false"
    >
      <div class="vpet-pre-wrap">{{ templateFooter }}</div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';
import { vpetAiLabInterpret, vpetLabGet, vpetLabSaveReport, vpetLabSubmitLis } from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetLabReport' });

const route = useRoute();
const { t } = useVpetLocale();
const { customerLabel, petLabel } = useVpetReference();
const detail = ref<any>(null);
const items = ref<any[]>([]);
const reportSummary = ref('');
const aiSummary = ref<any>(null);
const templateHeader = computed(() => detail.value?.templateSnapshot?.templateHeader || '');
const templateFooter = computed(() => detail.value?.templateSnapshot?.templateFooter || '');
const templateDefinitions = computed(() => {
  const items = detail.value?.templateSnapshot?.resultSchema?.items;
  return Array.isArray(items) ? items : [];
});
const printConfig = computed(() => ({
  title: '',
  fontSize: 12,
  showReferenceRange: true,
  showExplanation: true,
  ...(detail.value?.templateSnapshot?.printConfig || {}),
}));
const printableDefinitions = computed(() =>
  templateDefinitions.value.filter((item: any) => item.explanation || item.clinicalSignificance),
);

function addRow() {
  items.value.push({ itemName: '', resultValue: '', unit: '', refMin: undefined, refMax: undefined, flag: '' });
}

function removeRow(index: number) {
  items.value.splice(index, 1);
}

async function loadDetail() {
  detail.value = await vpetLabGet(Number(route.params.id));
  items.value = (detail.value?.resultItems || []).map((item: any) => ({
    ...item,
    ...definitionFallback(item),
  }));
  reportSummary.value = detail.value?.reportSummary || '';
  if (!items.value.length) addRow();
}

async function saveReport() {
  await vpetLabSaveReport(Number(route.params.id), {
    reportSummary: reportSummary.value,
    items: items.value.filter(item => item.itemName),
  });
  message.success(t('page.lab.messages.reportSaved'));
  loadDetail();
}

async function submitLis() {
  await vpetLabSubmitLis(Number(route.params.id));
  message.success(t('page.lab.messages.lisSubmitted'));
  loadDetail();
}

async function runAi() {
  aiSummary.value = await vpetAiLabInterpret({
    petName: detail.value?.pet?.name || detail.value?.petSnapshot?.name,
    species: detail.value?.pet?.species || detail.value?.petSnapshot?.species,
    items: items.value.filter(item => item.itemName),
  });
}

function fieldDefinition(item: any) {
  return templateDefinitions.value.find((definition: any) =>
    (item.itemCode && (definition.itemCode === item.itemCode || definition.code === item.itemCode))
    || definition.itemName === item.itemName
    || definition.name === item.itemName,
  );
}

function definitionFallback(item: any) {
  const definition = fieldDefinition(item);
  if (!definition)
    return {};
  return {
    unit: item.unit || definition.unit,
    refMin: item.refMin ?? definition.refMin,
    refMax: item.refMax ?? definition.refMax,
  };
}

function referenceRangeText(item: any) {
  const definition = fieldDefinition(item);
  if (definition?.referenceText)
    return definition.referenceText;
  if (item.refMin !== undefined && item.refMax !== undefined)
    return `${item.refMin} - ${item.refMax}`;
  if (item.refMin !== undefined)
    return `>= ${item.refMin}`;
  if (item.refMax !== undefined)
    return `<= ${item.refMax}`;
  return '-';
}

function printPreview() {
  window.print();
}

onMounted(loadDetail);
</script>

<style scoped>
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

@media print {
  .vpet-page > :not(.vpet-lab-print-card) {
    display: none;
  }

  .vpet-lab-print-preview {
    border: 0;
    padding: 0;
  }
}
</style>
