<template>
  <div class="vpet-page vpet-stack">
    <a-card class="vpet-query-card" :title="t('page.report.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.report.fields.date')">
          <a-date-picker v-model:value="dateValue" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadReport">{{ t('common.search') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <div class="vpet-report-stats">
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.report.cards.appointments')" :value="report?.overview?.appointmentCount || 0" />
        </a-card>
      </div>
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.report.cards.visits')" :value="report?.overview?.visitCount || 0" />
        </a-card>
      </div>
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.report.cards.revenue')" :value="report?.overview?.revenue || 0" />
        </a-card>
      </div>
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.report.cards.hospitalized')" :value="report?.overview?.hospitalizedCount || 0" />
        </a-card>
      </div>
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.report.cards.activeChronic')" :value="chronicSummary?.overview?.activeCases || 0" />
        </a-card>
      </div>
      <div class="vpet-report-stat-item">
        <a-card class="vpet-stat-card vpet-report-stat-card" :bordered="false">
          <a-statistic :title="t('page.report.cards.pendingChronic')" :value="chronicSummary?.overview?.pendingReviews || 0" />
        </a-card>
      </div>
    </div>

    <div class="vpet-report-panels">
      <div class="vpet-report-panel-item">
        <a-card class="vpet-panel-card vpet-report-panel" :title="t('page.report.doctorRanking')" :bordered="false">
          <a-table row-key="doctorId" :pagination="false" :columns="doctorColumns" :data-source="report?.doctorRanking || []" />
        </a-card>
      </div>
      <div class="vpet-report-panel-item">
        <a-card class="vpet-panel-card vpet-report-panel" :title="t('page.report.lowStock')" :bordered="false">
          <a-table row-key="id" :pagination="false" :columns="stockColumns" :data-source="report?.lowStock || []" />
        </a-card>
      </div>
    </div>

    <div class="vpet-report-panels vpet-report-panels--single">
      <div class="vpet-report-panel-item">
        <a-card class="vpet-panel-card vpet-report-panel" :title="t('page.report.chronicFollowups')" :bordered="false">
          <a-table row-key="id" :pagination="false" :columns="chronicColumns" :data-source="chronicSummary?.recentFollowups || []" />
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs';
import { onMounted, ref } from 'vue';
import { vpetChronicSummary, vpetReportDaily } from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference, type SelectOption } from '../shared/reference';

defineOptions({ name: 'VPetReportDaily' });

const { t } = useVpetLocale();
const { doctorLabel, loadDoctors } = useVpetReference();
const dateValue = ref<Dayjs>(dayjs());
const report = ref<any>(null);
const chronicSummary = ref<any>(null);
const doctorOptions = ref<SelectOption[]>([]);

const doctorColumns = [
  {
    title: t('page.report.fields.staff'),
    dataIndex: 'doctorName',
    width: 220,
    customRender: ({ record }: any) => doctorLabel(
      undefined,
      record.doctorId,
      record.doctorResolvedName,
      doctorOptions.value,
    ),
  },
  { title: t('page.report.fields.appointmentCount'), dataIndex: 'appointmentCount', width: 110 },
  { title: t('page.report.fields.checkedInCount'), dataIndex: 'checkedInCount', width: 110 },
  { title: t('page.report.fields.completedAppointmentCount'), dataIndex: 'completedAppointmentCount', width: 110 },
];

const stockColumns = [
  { title: t('page.report.fields.drugName'), dataIndex: 'drugName' },
  { title: t('page.report.fields.currentStock'), dataIndex: 'currentStock', width: 140 },
];

const chronicColumns = [
  {
    title: t('page.report.fields.reviewDate'),
    dataIndex: 'reviewDate',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('page.report.fields.caseNo'),
    dataIndex: ['chronicCase', 'caseNo'],
    width: 160,
  },
  {
    title: t('page.report.fields.diseaseName'),
    dataIndex: ['chronicCase', 'diseaseName'],
    width: 180,
  },
  { title: t('page.report.fields.statusSummary'), dataIndex: 'statusSummary', ellipsis: true },
];

async function loadReport() {
  [report.value, chronicSummary.value] = await Promise.all([
    vpetReportDaily({ date: dateValue.value.format('YYYY-MM-DD') }),
    vpetChronicSummary(),
  ]);
}

onMounted(async () => {
  try {
    doctorOptions.value = await loadDoctors();
  } catch {
    doctorOptions.value = [];
  }
  await loadReport();
});
</script>

<style lang="less" scoped>
  .vpet-report-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 15px;
  }

  .vpet-report-panels {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 15px;
  }

  .vpet-report-stat-item,
  .vpet-report-panel-item {
    display: flex;
    min-width: 0;
  }

  .vpet-report-stat-card,
  .vpet-report-panel {
    width: 100%;
  }

  .vpet-report-panel :deep(.ant-table-wrapper) {
    width: 100%;
  }

  @media (max-width: 1400px) {
    .vpet-report-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .vpet-report-panel :deep(.ant-card-body) {
      padding: 18px 20px;
    }
  }

  @media (max-width: 1200px) {
    .vpet-report-panels {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .vpet-report-stats {
      grid-template-columns: 1fr;
    }
  }

  .vpet-report-panels--single {
    grid-template-columns: 1fr;
  }
</style>
