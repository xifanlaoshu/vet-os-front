<template>
  <div class="vpet-page vpet-stack">
    <a-card class="vpet-panel-card vpet-ai-card" :title="t('page.ai.title')" :bordered="false">
      <a-tabs class="vpet-ai-tabs">
        <a-tab-pane key="soap" :tab="t('page.ai.soapDraft')">
          <a-form layout="vertical">
            <a-row :gutter="[16, 0]">
              <a-col :span="12">
                <a-form-item :label="t('page.ai.fields.visit')">
                  <a-select
                    v-model:value="soapForm.visitId"
                    :options="visitOptions"
                    show-search
                    option-filter-prop="label"
                    :filter-option="filterByLabel"
                    @change="handleSoapVisitChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :label="t('page.ai.fields.petName')"><a-input :value="selectedSoapPetName" disabled /></a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item :label="t('page.ai.fields.chiefComplaint')"><a-textarea v-model:value="soapForm.chiefComplaint" :rows="4" /></a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :label="t('page.ai.fields.objectiveFindings')"><a-textarea v-model:value="soapForm.objectiveFindings" :rows="4" /></a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :label="t('page.ai.fields.draftNotes')"><a-textarea v-model:value="soapForm.draftNotes" :rows="4" /></a-form-item>
              </a-col>
            </a-row>
            <div class="vpet-ai-actions">
              <a-button type="primary" @click="generateSoap">{{ t('page.ai.generate') }}</a-button>
            </div>
          </a-form>
          <a-card v-if="soapResult" class="vpet-detail-card vpet-list-card" :bordered="false">
            <pre class="vpet-ai-output">{{ formatAiOutput(soapResult) }}</pre>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="review" :tab="t('page.ai.prescriptionReview')">
          <div class="vpet-ai-review-bar">
            <a-select
              v-model:value="selectedPrescriptionId"
              class="vpet-ai-review-select"
              :options="prescriptionOptions"
              show-search
              option-filter-prop="label"
            />
            <a-button type="primary" @click="reviewPrescription">{{ t('page.ai.review') }}</a-button>
          </div>
          <a-card v-if="reviewResult" class="vpet-detail-card vpet-list-card" :bordered="false">
            <pre class="vpet-ai-output">{{ formatAiOutput(reviewResult) }}</pre>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="logs" :tab="t('page.ai.logs')">
          <a-table
            class="vpet-ai-log-table"
            row-key="id"
            :columns="logColumns"
            :data-source="logs"
            :pagination="false"
            :scroll="{ x: 620 }"
          />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { vpetAiLogs, vpetAiPrescriptionReview, vpetAiSoapDraft, vpetPrescriptionList } from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference, type SelectOption } from '../shared/reference';

defineOptions({ name: 'VPetAI' });

const { t } = useVpetLocale();
const { filterByLabel, loadVisits, visitLabel } = useVpetReference();
const visitOptions = ref<SelectOption[]>([]);
const soapForm = ref({
  visitId: undefined as number | undefined,
  petName: '',
  species: '',
  chiefComplaint: '',
  objectiveFindings: '',
  draftNotes: '',
});
const soapResult = ref<any>(null);
const selectedPrescriptionId = ref<number>();
const prescriptionOptions = ref<any[]>([]);
const reviewResult = ref<any>(null);
const logs = ref<any[]>([]);

const selectedSoapVisit = computed(() => (
  visitOptions.value.find(item => Number(item.value) === Number(soapForm.value.visitId))?.raw
));

const selectedSoapPetName = computed(() => (
  selectedSoapVisit.value?.pet?.name
  || selectedSoapVisit.value?.petSnapshot?.name
  || soapForm.value.petName
  || '-'
));

const logColumns = [
  { title: t('page.ai.fields.taskType'), dataIndex: 'taskType', width: 180 },
  { title: t('page.ai.fields.bizType'), dataIndex: 'bizType', width: 120 },
  { title: t('page.ai.fields.riskLevel'), dataIndex: 'riskLevel', width: 120 },
];

function handleSoapVisitChange(value?: number) {
  const visit = visitOptions.value.find(item => Number(item.value) === Number(value))?.raw;
  soapForm.value.visitId = value;
  soapForm.value.petName = visit?.pet?.name || visit?.petSnapshot?.name || '';
  soapForm.value.species = visit?.pet?.species || visit?.petSnapshot?.species || '';
  if (!soapForm.value.chiefComplaint) {
    soapForm.value.chiefComplaint = visit?.chiefComplaint || '';
  }
}

async function loadVisitOptions() {
  try {
    visitOptions.value = await loadVisits();
  } catch {
    visitOptions.value = [];
  }
}

async function loadPrescriptions() {
  const data: any = await vpetPrescriptionList({ page: 1, pageSize: 100 });
  prescriptionOptions.value = (data?.items || []).map((item: any) => ({
    value: item.id,
    label: `${item.rxNo} / ${visitLabel(visitOptions.value, item.visitId)}`,
  }));
}

async function loadLogs() {
  const data: any = await vpetAiLogs({ page: 1, pageSize: 50 });
  logs.value = data?.items || [];
}

async function generateSoap() {
  soapResult.value = await vpetAiSoapDraft({
    petName: soapForm.value.petName,
    species: soapForm.value.species,
    chiefComplaint: soapForm.value.chiefComplaint,
    objectiveFindings: soapForm.value.objectiveFindings,
    draftNotes: soapForm.value.draftNotes,
  });
  await loadLogs();
}

async function reviewPrescription() {
  if (!selectedPrescriptionId.value) return;
  reviewResult.value = await vpetAiPrescriptionReview(selectedPrescriptionId.value);
  await loadLogs();
}

function formatAiOutput(value: any) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

onMounted(async () => {
  await loadVisitOptions();
  await loadPrescriptions();
  await loadLogs();
});
</script>

<style lang="less" scoped>
  .vpet-ai-card {
    :deep(.ant-card-body) {
      padding-top: 16px;
    }
  }

  .vpet-ai-tabs {
    :deep(.ant-tabs-nav) {
      margin-bottom: 18px;
    }
  }

  .vpet-ai-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .vpet-ai-review-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    flex-wrap: wrap;
    padding: 15px;
    border: 1px solid #dbe7f3;
    border-radius: 16px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 251, 255, 0.94)),
      #fff;
    margin-bottom: 15px;
  }

  .vpet-ai-review-select {
    flex: 1 1 360px;
    width: auto;
    max-width: 100%;
  }

  .vpet-ai-output {
    margin: 0;
    max-height: 520px;
    overflow: auto;
    padding: 16px;
    border: 1px solid #dbe7f3;
    border-radius: 14px;
    background: #f8fbfd;
    white-space: pre-wrap;
    word-break: break-word;
    color: #1f2a37;
    font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
    line-height: 1.7;
  }
</style>
