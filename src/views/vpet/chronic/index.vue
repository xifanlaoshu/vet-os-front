<template>
  <div class="vpet-page vpet-stack">
    <a-card class="vpet-query-card" :title="t('page.chronic.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.chronic.fields.customer')">
          <a-select
            v-model:value="filters.customerId"
            allow-clear
            show-search
            :options="customerOptions"
            :filter-option="filterByLabel"
            @change="handleCustomerChange"
          />
        </a-form-item>
        <a-form-item :label="t('page.chronic.fields.pet')">
          <a-select
            v-model:value="filters.petId"
            allow-clear
            show-search
            :options="petOptions"
            :filter-option="filterByLabel"
          />
        </a-form-item>
        <a-form-item :label="t('page.chronic.fields.keyword')">
          <a-input v-model:value="filters.keyword" allow-clear @pressEnter="loadCases" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadCases">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCaseModal()">{{ t('page.chronic.create') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <div class="vpet-report-stats">
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.chronic.cards.activeCases')" :value="summary?.overview?.activeCases || 0" />
        </a-card>
      </div>
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.chronic.cards.pendingReviews')" :value="summary?.overview?.pendingReviews || 0" />
        </a-card>
      </div>
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.chronic.cards.recentFollowups')" :value="summary?.overview?.recentFollowupCount || 0" />
        </a-card>
      </div>
    </div>

    <a-row :gutter="[15, 15]" class="vpet-grid-row">
      <a-col :span="9">
        <a-card class="vpet-panel-card" :title="t('page.chronic.caseList')" :bordered="false">
          <a-table
            row-key="id"
            size="small"
            :loading="loading"
            :columns="caseColumns"
            :data-source="cases"
            :pagination="false"
            :custom-row="caseRowProps"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'petCustomer'">
                <div style="font-weight: 600">{{ petLabel(record.pet, record.petSnapshot, record.petId) }}</div>
                <div class="vpet-muted">{{ customerLabel(record.customer, record.customerSnapshot, record.customerId) }}</div>
              </template>
              <template v-else-if="column.key === 'nextReviewDate'">
                {{ record.nextReviewDate || '-' }}
              </template>
              <template v-else-if="column.key === 'lastReviewDate'">
                {{ latestFollowupDate(record) }}
              </template>
            </template>
          </a-table>
          <a-empty v-if="!cases.length" :description="t('page.chronic.emptyCases')" />
        </a-card>
      </a-col>

      <a-col :span="15">
        <a-card v-if="selectedCase" class="vpet-detail-card" :bordered="false">
          <template #title>
            <div class="vpet-chronic-header">
              <div>
                <div class="vpet-chronic-title">{{ selectedCase.caseNo }} / {{ selectedCase.diseaseName }}</div>
                <div class="vpet-muted vpet-inline-note">
                  {{ petLabel(selectedCase.pet, selectedCase.petSnapshot, selectedCase.petId) }}
                  /
                  {{ customerLabel(selectedCase.customer, selectedCase.customerSnapshot, selectedCase.customerId) }}
                </div>
              </div>
              <a-space>
                <a-button type="primary" @click="openFollowupModal">{{ t('page.chronic.addFollowup') }}</a-button>
                <a-button @click="openLinkedVisit">{{ t('page.chronic.openVisit') }}</a-button>
              </a-space>
            </div>
          </template>

          <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane key="summary" :tab="t('page.chronic.tabs.summary')">
              <a-descriptions :column="2" size="small">
                <a-descriptions-item :label="t('page.chronic.fields.diseaseName')">
                  {{ selectedCase.diseaseName }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.chronic.fields.nextReviewDate')">
                  {{ selectedCase.nextReviewDate || '-' }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.chronic.fields.diseaseTags')" :span="2">
                  {{ (selectedCase.diseaseTags || []).join(' / ') || '-' }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.chronic.fields.initialSummary')" :span="2">
                  <div class="vpet-pre-wrap">{{ selectedCase.initialSummary || '-' }}</div>
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.chronic.fields.managementGoal')" :span="2">
                  <div class="vpet-pre-wrap">{{ selectedCase.managementGoal || '-' }}</div>
                </a-descriptions-item>
              </a-descriptions>

              <a-divider />

              <div class="vpet-section-title">{{ t('page.chronic.carePlan') }}</div>
              <a-table
                row-key="key"
                size="small"
                :pagination="false"
                :columns="carePlanColumns"
                :data-source="carePlanRows"
              />

              <div class="vpet-section-title vpet-section-spaced">{{ t('page.chronic.trackingSchema') }}</div>
              <a-table
                row-key="key"
                size="small"
                :pagination="false"
                :columns="schemaColumns"
                :data-source="trackingSchemaRows"
              />
            </a-tab-pane>

            <a-tab-pane key="followups" :tab="t('page.chronic.tabs.followups')">
              <a-empty
                v-if="!(selectedCase.followups || []).length"
                :description="t('page.chronic.emptyFollowups')"
              />
              <a-timeline v-else>
                <a-timeline-item
                  v-for="item in selectedCase.followups || []"
                  :key="item.id"
                >
                  <div class="vpet-subtitle">{{ formatToDateTime(item.reviewDate) }}</div>
                  <div class="vpet-inline-note">{{ item.symptomSummary || '-' }}</div>
                  <div class="vpet-muted vpet-inline-note">{{ item.statusSummary || '-' }}</div>
                  <div v-if="followupMetricText(item)" class="vpet-inline-note-spaced">{{ followupMetricText(item) }}</div>
                  <div v-if="item.planAdjustment" class="vpet-inline-note-spaced vpet-pre-wrap">{{ item.planAdjustment }}</div>
                </a-timeline-item>
              </a-timeline>
            </a-tab-pane>

            <a-tab-pane key="report" :tab="t('page.chronic.tabs.report')">
              <div class="vpet-report-stats">
                <div class="vpet-report-stat-item">
                  <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
                    <a-statistic
                      :title="t('page.chronic.report.followupCount')"
                      :value="currentReport?.summary?.followupCount || 0"
                    />
                  </a-card>
                </div>
                <div class="vpet-report-stat-item">
                  <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
                    <a-statistic
                      :title="t('page.chronic.report.lastReviewDate')"
                      :value="currentReport?.summary?.lastReviewDate || '-'"
                    />
                  </a-card>
                </div>
                <div class="vpet-report-stat-item">
                  <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
                    <a-statistic
                      :title="t('page.chronic.report.nextReviewDate')"
                      :value="currentReport?.summary?.nextReviewDate || '-'"
                    />
                  </a-card>
                </div>
              </div>

              <div class="vpet-section-title vpet-section-spaced">{{ t('page.chronic.report.metricTrend') }}</div>
              <a-empty
                v-if="!metricSeriesRows.length"
                :description="t('page.chronic.emptyMetricSeries')"
              />
              <a-table
                v-else
                row-key="metricKey"
                size="small"
                :pagination="false"
                :columns="metricSeriesColumns"
                :data-source="metricSeriesRows"
              />

              <div class="vpet-section-title vpet-section-spaced">{{ t('page.chronic.report.timeline') }}</div>
              <a-table
                row-key="reviewDate"
                size="small"
                :pagination="false"
                :columns="reportTimelineColumns"
                :data-source="currentReport?.timeline || []"
              />
            </a-tab-pane>
          </a-tabs>
        </a-card>

        <a-card v-else class="vpet-detail-card" :bordered="false">
          <a-empty :description="t('page.chronic.selectCase')" />
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="caseModalVisible"
      :title="t('page.chronic.create')"
      width="960px"
      destroy-on-close
      @ok="submitCase"
    >
      <a-form layout="vertical">
        <a-row :gutter="15">
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.customer')">
              <a-select
                v-model:value="caseForm.customerId"
                show-search
                :options="customerOptions"
                :filter-option="filterByLabel"
                @change="handleCaseCustomerChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.pet')">
              <a-select
                v-model:value="caseForm.petId"
                show-search
                :options="casePetOptions"
                :filter-option="filterByLabel"
                @change="handleCasePetChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.visit')">
              <a-select
                v-model:value="caseForm.visitId"
                allow-clear
                show-search
                :options="caseVisitOptions"
                :filter-option="filterByLabel"
                @change="handleCaseVisitChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.diseaseName')">
              <a-input v-model:value="caseForm.diseaseName" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.diseaseTags')">
              <a-input v-model:value="caseForm.diseaseTagsText" :placeholder="t('page.chronic.placeholders.diseaseTags')" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.nextReviewDate')">
              <a-date-picker v-model:value="caseForm.nextReviewDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.chronic.fields.initialSummary')">
              <a-textarea v-model:value="caseForm.initialSummary" :rows="3" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.chronic.fields.managementGoal')">
              <a-textarea v-model:value="caseForm.managementGoal" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>

        <div class="vpet-section-title">{{ t('page.chronic.carePlan') }}</div>
        <div v-for="(item, index) in caseForm.carePlan" :key="`plan-${index}`" class="vpet-three-col-grid">
          <a-input v-model:value="item.stage" :placeholder="t('page.chronic.fields.planStage')" />
          <a-input v-model:value="item.goal" :placeholder="t('page.chronic.fields.planGoal')" />
          <a-input v-model:value="item.action" :placeholder="t('page.chronic.fields.planAction')" />
        </div>
        <a-button @click="addCarePlanRow">{{ t('page.chronic.addCarePlanRow') }}</a-button>

        <div class="vpet-section-title vpet-section-spaced">{{ t('page.chronic.trackingSchema') }}</div>
        <div v-for="(item, index) in caseForm.trackingSchema" :key="`schema-${index}`" class="vpet-three-col-grid">
          <a-input v-model:value="item.key" :placeholder="t('page.chronic.fields.metricKey')" />
          <a-input v-model:value="item.label" :placeholder="t('page.chronic.fields.metricLabel')" />
          <a-input v-model:value="item.unit" :placeholder="t('page.chronic.fields.metricUnit')" />
        </div>
        <a-button @click="addTrackingSchemaRow">{{ t('page.chronic.addMetricRow') }}</a-button>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="followupModalVisible"
      :title="t('page.chronic.addFollowup')"
      width="880px"
      destroy-on-close
      @ok="submitFollowup"
    >
      <a-form layout="vertical">
        <a-row :gutter="15">
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.reviewDate')">
              <a-date-picker v-model:value="followupForm.reviewDate" show-time style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.nextReviewDate')">
              <a-date-picker v-model:value="followupForm.nextReviewDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.chronic.fields.visit')">
              <a-select
                v-model:value="followupForm.visitId"
                allow-clear
                show-search
                :options="followupVisitOptions"
                :filter-option="filterByLabel"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.chronic.fields.symptomSummary')">
              <a-textarea v-model:value="followupForm.symptomSummary" :rows="3" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.chronic.fields.statusSummary')">
              <a-textarea v-model:value="followupForm.statusSummary" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>

        <div class="vpet-section-title">{{ t('page.chronic.metricValues') }}</div>
        <div
          v-for="metric in selectedCaseTrackingSchema"
          :key="metric.key"
          class="vpet-two-col-grid"
        >
          <div class="vpet-metric-label">{{ metric.label || metric.key }}</div>
          <a-input v-model:value="followupForm.metricValues[metric.key]" :placeholder="metric.unit || '-' " />
        </div>

        <a-form-item :label="t('page.chronic.fields.planAdjustment')" class="vpet-section-spaced">
          <a-textarea v-model:value="followupForm.planAdjustment" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs';
import { computed, onMounted, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import {
  vpetChronicCaseCreate,
  vpetChronicCaseGet,
  vpetChronicCaseList,
  vpetChronicFollowupCreate,
  vpetChronicReportGet,
  vpetChronicSummary,
} from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { type SelectOption, useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetChronicCenter' });

type CarePlanRow = { stage?: string; goal?: string; action?: string };
type TrackingRow = { key: string; label?: string; unit?: string };

const { t } = useVpetLocale();
const {
  customerLabel,
  filterByLabel,
  loadCustomers,
  loadPets,
  loadVisits,
  petLabel,
} = useVpetReference();
const route = useRoute();
const router = useRouter();

function toSafeId(value: unknown): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === '') return undefined;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

const loading = ref(false);
const summary = ref<any>(null);
const cases = ref<any[]>([]);
const selectedCaseId = ref<number | null>(null);
const selectedCase = ref<any>(null);
const currentReport = ref<any>(null);
const activeTab = ref('summary');

const customerOptions = ref<SelectOption[]>([]);
const petOptions = ref<SelectOption[]>([]);
const casePetOptions = ref<SelectOption[]>([]);
const caseVisitOptions = ref<SelectOption[]>([]);
const followupVisitOptions = ref<SelectOption[]>([]);

const filters = ref({
  customerId: undefined as number | undefined,
  petId: undefined as number | undefined,
  keyword: '',
});

const caseModalVisible = ref(false);
const followupModalVisible = ref(false);

const caseForm = ref({
  customerId: undefined as number | undefined,
  petId: undefined as number | undefined,
  visitId: undefined as number | undefined,
  diseaseName: '',
  diseaseTagsText: '',
  initialSummary: '',
  managementGoal: '',
  nextReviewDate: null as Dayjs | null,
  carePlan: [{ stage: '', goal: '', action: '' }] as CarePlanRow[],
  trackingSchema: [{ key: 'weight', label: t('page.chronic.defaults.weight'), unit: 'kg' }] as TrackingRow[],
});

const followupForm = ref({
  visitId: undefined as number | undefined,
  reviewDate: dayjs(),
  nextReviewDate: null as Dayjs | null,
  symptomSummary: '',
  statusSummary: '',
  metricValues: {} as Record<string, string>,
  planAdjustment: '',
});

const caseColumns = [
  { title: t('page.chronic.fields.caseNo'), dataIndex: 'caseNo', width: 150 },
  { title: t('page.chronic.fields.pet'), key: 'petCustomer', width: 210 },
  { title: t('page.chronic.fields.diseaseName'), dataIndex: 'diseaseName', ellipsis: true },
  { title: t('page.chronic.fields.lastReviewDate'), key: 'lastReviewDate', width: 130 },
  { title: t('page.chronic.fields.nextReviewDate'), key: 'nextReviewDate', width: 130 },
];

const carePlanColumns = [
  { title: t('page.chronic.fields.planStage'), dataIndex: 'stage' },
  { title: t('page.chronic.fields.planGoal'), dataIndex: 'goal' },
  { title: t('page.chronic.fields.planAction'), dataIndex: 'action' },
];

const schemaColumns = [
  { title: t('page.chronic.fields.metricKey'), dataIndex: 'key', width: 160 },
  { title: t('page.chronic.fields.metricLabel'), dataIndex: 'label', width: 180 },
  { title: t('page.chronic.fields.metricUnit'), dataIndex: 'unit', width: 140 },
];

const metricSeriesColumns = [
  { title: t('page.chronic.fields.metricLabel'), dataIndex: 'metricLabel', width: 180 },
  { title: t('page.chronic.fields.metricKey'), dataIndex: 'metricKey', width: 160 },
  { title: t('page.chronic.report.latestValue'), dataIndex: 'latestValue', width: 160 },
  { title: t('page.chronic.report.history'), dataIndex: 'historyText' },
];

const reportTimelineColumns = [
  {
    title: t('page.chronic.fields.reviewDate'),
    dataIndex: 'reviewDate',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  { title: t('page.chronic.fields.symptomSummary'), dataIndex: 'symptomSummary', ellipsis: true },
  { title: t('page.chronic.fields.statusSummary'), dataIndex: 'statusSummary', ellipsis: true },
  { title: t('page.chronic.fields.planAdjustment'), dataIndex: 'planAdjustment', ellipsis: true },
];

const carePlanRows = computed(() => normalizeRows(selectedCase.value?.carePlan, 'plan'));
const trackingSchemaRows = computed(() => normalizeRows(selectedCase.value?.trackingSchema, 'schema'));
const selectedCaseTrackingSchema = computed<TrackingRow[]>(() => normalizeTrackingSchema(selectedCase.value?.trackingSchema));

const metricSeriesRows = computed(() => {
  const report = currentReport.value;
  const schemaMap = new Map(
    normalizeTrackingSchema(report?.trackingSchema).map(item => [item.key, item]),
  );
  return Object.entries(report?.metricSeries || {}).map(([metricKey, points]: [string, any]) => {
    const metric = schemaMap.get(metricKey);
    const list = Array.isArray(points) ? points : [];
    const latest = list.at(-1);
    return {
      metricKey,
      metricLabel: metric?.label || metricKey,
      latestValue: latest ? `${latest.value}${metric?.unit ? ` ${metric.unit}` : ''}` : '-',
      historyText: list
        .map((item: any) => `${dayjs(item.date).format('MM-DD')} ${item.value}${metric?.unit ? metric.unit : ''}`)
        .join(' / '),
    };
  });
});

function normalizeRows(rows: any, prefix: string) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map((item, index) => ({
    key: `${prefix}-${index + 1}`,
    ...item,
  }));
}

function normalizeTrackingSchema(rows: any): TrackingRow[] {
  return (Array.isArray(rows) ? rows : [])
    .map(item => ({
      key: String(item?.key || '').trim(),
      label: item?.label,
      unit: item?.unit,
    }))
    .filter(item => item.key);
}

function latestFollowupDate(record: any) {
  const latest = (record.followups || []).slice().sort((a: any, b: any) =>
    dayjs(b.reviewDate).valueOf() - dayjs(a.reviewDate).valueOf(),
  )[0];
  return latest?.reviewDate ? dayjs(latest.reviewDate).format('YYYY-MM-DD') : '-';
}

function caseRowProps(record: any) {
  return {
    onClick: () => selectCase(record.id),
    style: {
      cursor: 'pointer',
      background: Number(selectedCaseId.value) === Number(record.id) ? '#f3fbff' : '',
    },
  };
}

function followupMetricText(record: any) {
  const metrics = record?.metricValues || {};
  const schemaMap = new Map(selectedCaseTrackingSchema.value.map(item => [item.key, item]));
  const list = Object.entries(metrics)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const schema = schemaMap.get(key);
      return `${schema?.label || key}: ${value}${schema?.unit ? ` ${schema.unit}` : ''}`;
    });
  return list.join(' / ');
}

function resetCaseForm() {
  caseForm.value = {
    customerId: filters.value.customerId,
    petId: filters.value.petId,
    visitId: toSafeId(route.query.visitId),
    diseaseName: '',
    diseaseTagsText: '',
    initialSummary: '',
    managementGoal: '',
    nextReviewDate: null,
    carePlan: [{ stage: '', goal: '', action: '' }],
    trackingSchema: [{ key: 'weight', label: t('page.chronic.defaults.weight'), unit: 'kg' }],
  };
}

function resetFollowupForm() {
  const metricValues: Record<string, string> = {};
  selectedCaseTrackingSchema.value.forEach((item) => {
    metricValues[item.key] = '';
  });
  followupForm.value = {
    visitId: selectedCase.value?.visitId || undefined,
    reviewDate: dayjs(),
    nextReviewDate: selectedCase.value?.nextReviewDate ? dayjs(selectedCase.value.nextReviewDate) : null,
    symptomSummary: '',
    statusSummary: '',
    metricValues,
    planAdjustment: '',
  };
}

function addCarePlanRow() {
  caseForm.value.carePlan.push({ stage: '', goal: '', action: '' });
}

function addTrackingSchemaRow() {
  caseForm.value.trackingSchema.push({ key: '', label: '', unit: '' });
}

async function loadMasterData() {
  customerOptions.value = await loadCustomers();
}

async function syncFilterPets(customerId?: number) {
  petOptions.value = customerId ? await loadPets(customerId) : [];
}

async function syncCasePets(customerId?: number) {
  casePetOptions.value = customerId ? await loadPets(customerId) : [];
}

async function syncCaseVisits(params: Record<string, any>) {
  caseVisitOptions.value = await loadVisits(params);
}

async function syncFollowupVisits() {
  if (!selectedCase.value?.customerId) {
    followupVisitOptions.value = [];
    return;
  }
  followupVisitOptions.value = await loadVisits({
    customerId: selectedCase.value.customerId,
    petId: selectedCase.value.petId,
  });
}

async function loadSummary() {
  summary.value = await vpetChronicSummary();
}

async function loadCases(preferredCaseId?: number) {
  loading.value = true;
  try {
    cases.value = await vpetChronicCaseList({
      customerId: filters.value.customerId,
      petId: filters.value.petId,
      keyword: filters.value.keyword || undefined,
    }) as any[];

    const nextCaseId = toSafeId(preferredCaseId)
      || toSafeId(route.query.caseId)
      || selectedCaseId.value
      || cases.value[0]?.id;

    if (nextCaseId) {
      await selectCase(nextCaseId);
    } else {
      selectedCaseId.value = null;
      selectedCase.value = null;
      currentReport.value = null;
    }
  } finally {
    loading.value = false;
  }
}

async function selectCase(id: number) {
  const safeId = toSafeId(id);
  if (!safeId) {
    selectedCaseId.value = null;
    selectedCase.value = null;
    currentReport.value = null;
    return;
  }
  selectedCaseId.value = safeId;
  const [detail, report] = await Promise.all([
    vpetChronicCaseGet(safeId),
    vpetChronicReportGet(safeId),
  ]);
  selectedCase.value = detail;
  currentReport.value = report;
  await syncFollowupVisits();
}

function resetFilters() {
  filters.value = {
    customerId: toSafeId(route.query.customerId),
    petId: toSafeId(route.query.petId),
    keyword: '',
  };
  void syncFilterPets(filters.value.customerId);
  void loadCases();
}

async function handleCustomerChange(value?: number) {
  filters.value.petId = undefined;
  await syncFilterPets(value);
}

async function handleCaseCustomerChange(value?: number) {
  caseForm.value.petId = undefined;
  caseForm.value.visitId = undefined;
  await syncCasePets(value);
  await syncCaseVisits({ customerId: value });
}

async function handleCasePetChange(value?: number) {
  caseForm.value.visitId = undefined;
  await syncCaseVisits({
    customerId: caseForm.value.customerId,
    petId: value,
  });
}

async function handleCaseVisitChange(value?: number) {
  if (!value) return;
  const option = caseVisitOptions.value.find(item => Number(item.value) === Number(value));
  const raw = option?.raw as any;
  if (!raw) return;
  caseForm.value.customerId = raw.customerId;
  caseForm.value.petId = raw.petId;
  await syncCasePets(raw.customerId);
}

async function openCaseModal(seed?: any) {
  resetCaseForm();
  await syncCasePets(caseForm.value.customerId);
  await syncCaseVisits({
    customerId: caseForm.value.customerId,
    petId: caseForm.value.petId,
  });
  if (seed?.id) {
    caseForm.value = {
      customerId: seed.customerId,
      petId: seed.petId,
      visitId: seed.visitId || undefined,
      diseaseName: seed.diseaseName || '',
      diseaseTagsText: (seed.diseaseTags || []).join(', '),
      initialSummary: seed.initialSummary || '',
      managementGoal: seed.managementGoal || '',
      nextReviewDate: seed.nextReviewDate ? dayjs(seed.nextReviewDate) : null,
      carePlan: Array.isArray(seed.carePlan) && seed.carePlan.length ? seed.carePlan : [{ stage: '', goal: '', action: '' }],
      trackingSchema: Array.isArray(seed.trackingSchema) && seed.trackingSchema.length ? seed.trackingSchema : [{ key: 'weight', label: t('page.chronic.defaults.weight'), unit: 'kg' }],
    };
  }
  caseModalVisible.value = true;
}

async function openFollowupModal() {
  resetFollowupForm();
  await syncFollowupVisits();
  followupModalVisible.value = true;
}

async function submitCase() {
  if (!caseForm.value.customerId || !caseForm.value.petId || !caseForm.value.diseaseName) {
    message.error(t('page.chronic.messages.caseRequired'));
    return;
  }

  const diseaseTags = caseForm.value.diseaseTagsText
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  const carePlan = caseForm.value.carePlan.filter(item => item.stage || item.goal || item.action);
  const trackingSchema = caseForm.value.trackingSchema.filter(item => item.key);

  const result: any = await vpetChronicCaseCreate({
    customerId: caseForm.value.customerId,
    petId: caseForm.value.petId,
    visitId: caseForm.value.visitId,
    diseaseName: caseForm.value.diseaseName,
    diseaseTags: diseaseTags.length ? JSON.stringify(diseaseTags) : undefined,
    initialSummary: caseForm.value.initialSummary || undefined,
    managementGoal: caseForm.value.managementGoal || undefined,
    carePlan: carePlan.length ? JSON.stringify(carePlan) : undefined,
    trackingSchema: trackingSchema.length ? JSON.stringify(trackingSchema) : undefined,
    nextReviewDate: caseForm.value.nextReviewDate?.format('YYYY-MM-DD'),
  });

  message.success(t('page.chronic.messages.caseCreated'));
  caseModalVisible.value = false;
  await Promise.all([loadSummary(), loadCases(result?.id)]);
}

async function submitFollowup() {
  if (!selectedCase.value?.id) return;
  const filteredMetricValues = Object.fromEntries(
    Object.entries(followupForm.value.metricValues).filter(([, value]) => value !== ''),
  );
  await vpetChronicFollowupCreate(selectedCase.value.id, {
    visitId: followupForm.value.visitId,
    reviewDate: followupForm.value.reviewDate?.format('YYYY-MM-DD HH:mm:ss'),
    symptomSummary: followupForm.value.symptomSummary || undefined,
    statusSummary: followupForm.value.statusSummary || undefined,
    metricValues: Object.keys(filteredMetricValues).length ? JSON.stringify(filteredMetricValues) : undefined,
    planAdjustment: followupForm.value.planAdjustment || undefined,
    nextReviewDate: followupForm.value.nextReviewDate?.format('YYYY-MM-DD'),
  });
  message.success(t('page.chronic.messages.followupCreated'));
  followupModalVisible.value = false;
  await Promise.all([loadSummary(), selectCase(selectedCase.value.id), loadCases(selectedCase.value.id)]);
}

function openLinkedVisit() {
  const visitId = selectedCase.value?.visitId;
  if (!visitId) {
    message.info(t('page.chronic.messages.visitMissing'));
    return;
  }
  router.push(`/vpet/consultation/visit/${visitId}`);
}

watch(activeTab, async (value) => {
  const caseId = toSafeId(selectedCaseId.value);
  if (value === 'report' && caseId) {
    currentReport.value = await vpetChronicReportGet(caseId);
  }
});

onMounted(async () => {
  filters.value.customerId = toSafeId(route.query.customerId);
  filters.value.petId = toSafeId(route.query.petId);
  await loadMasterData();
  await syncFilterPets(filters.value.customerId);
  await Promise.all([loadSummary(), loadCases()]);
});
</script>

<style lang="less" scoped>
  .vpet-chronic-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
  }

  .vpet-chronic-title {
    color: #1f2a37;
    font-size: 18px;
    font-weight: 700;
  }

  .vpet-section-title {
    margin-bottom: 10px;
    color: #1f2a37;
    font-size: 14px;
    font-weight: 700;
  }

  .vpet-three-col-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 10px;
  }

  .vpet-two-col-grid {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
  }

  .vpet-metric-label {
    color: #516476;
    font-weight: 600;
  }

  .vpet-report-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 15px;
  }

  .vpet-report-stat-item {
    display: flex;
    min-width: 0;
  }

  .vpet-report-stat-card {
    width: 100%;
  }

  @media (max-width: 1200px) {
    .vpet-report-stats,
    .vpet-three-col-grid {
      grid-template-columns: 1fr;
    }

    .vpet-two-col-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
