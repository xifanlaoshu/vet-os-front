<template>
  <div class="vpet-page vpet-stack">
    <a-row :gutter="[16, 16]">
      <a-col :span="6">
        <a-card class="vpet-stat-card" hoverable><a-statistic :title="t('page.dashboard.stats.appointments')" :value="stats.todayAppointments || 0" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card" hoverable><a-statistic :title="t('page.dashboard.stats.waiting')" :value="stats.waitingCount || 0" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card" hoverable><a-statistic :title="t('page.dashboard.stats.hospitalized')" :value="stats.hospitalized || 0" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card" hoverable><a-statistic :title="t('page.dashboard.stats.revenue')" :value="stats.todayRevenue || 0" /></a-card>
      </a-col>
    </a-row>
    <a-card class="vpet-panel-card" :title="t('page.dashboard.todayVisits')">
      <a-table :dataSource="visits" :columns="visitColumns" rowKey="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="visitStatusColor(record.status)">{{ visitStatusText(record.status) }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { vpetBillingTodayStats } from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';

const { t, visitStatusColor, visitStatusText } = useVpetLocale();
const stats = ref<any>({});
const visits = ref([]);
const visitColumns = [
  { title: t('page.dashboard.columns.visitNo'), dataIndex: 'visitNo', key: 'visitNo' },
  { title: t('page.dashboard.columns.status'), key: 'status', width: 100 },
  { title: t('page.dashboard.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt' },
];

onMounted(async () => {
  try {
    stats.value = await vpetBillingTodayStats();
  } catch {}
});
</script>
