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
      </div>
      <a-textarea v-model:value="reportSummary" :rows="4" :placeholder="t('page.lab.fields.reportSummary')" />
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

function addRow() {
  items.value.push({ itemName: '', resultValue: '', unit: '', refMin: undefined, refMax: undefined, flag: '' });
}

function removeRow(index: number) {
  items.value.splice(index, 1);
}

async function loadDetail() {
  detail.value = await vpetLabGet(Number(route.params.id));
  items.value = (detail.value?.resultItems || []).map((item: any) => ({ ...item }));
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

onMounted(loadDetail);
</script>
