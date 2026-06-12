<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.audit.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.audit.fields.source')" class="vpet-query-item-narrow">
          <a-select v-model:value="filters.source" allow-clear :options="sourceOptions" />
        </a-form-item>
        <a-form-item :label="t('page.audit.fields.bizType')" class="vpet-query-item-narrow">
          <a-select v-model:value="filters.bizType" allow-clear :options="bizTypeOptions" />
        </a-form-item>
        <a-form-item :label="t('page.audit.fields.bizId')" class="vpet-query-item-narrow">
          <a-input-number v-model:value="filters.bizId" :min="1" />
        </a-form-item>
        <a-form-item :label="t('page.audit.fields.action')" class="vpet-query-item-wide">
          <a-input v-model:value="filters.action" allow-clear @pressEnter="loadEvents" />
        </a-form-item>
        <a-form-item :label="t('page.audit.fields.dateRange')" class="vpet-query-item-wide">
          <a-range-picker v-model:value="dateRange" show-time />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadEvents">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card class="vpet-panel-card vpet-list-card" :title="t('page.audit.list')" :bordered="false">
      <a-table
        row-key="eventId"
        :loading="loading"
        :columns="columns"
        :data-source="events"
        :pagination="pagination"
        :scroll="{ x: 1120 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'source'">
            <a-tag :color="sourceColor(record.source)">{{ sourceText(record.source) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'bizType'">
            {{ bizTypeText(record.bizType) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-tag>{{ actionText(record.action) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'operatorId'">
            {{ record.operatorId ? `#${record.operatorId}` : '-' }}
          </template>
          <template v-else-if="column.key === 'occurredAt'">
            {{ record.occurredAt ? formatToDateTime(record.occurredAt) : '-' }}
          </template>
          <template v-else-if="column.key === 'reason'">
            {{ record.reason || '-' }}
          </template>
          <template v-else-if="column.key === 'actionColumn'">
            <a-button type="link" size="small" @click="openDetail(record)">{{ t('common.detail') }}</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="detailVisible"
      :title="t('page.audit.detail')"
      width="720"
      destroy-on-close
    >
      <a-descriptions :column="1" size="small" bordered>
        <a-descriptions-item :label="t('page.audit.fields.source')">
          {{ sourceText(detailEvent?.source) }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.audit.fields.bizType')">
          {{ bizTypeText(detailEvent?.bizType) }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.audit.fields.bizId')">
          {{ detailEvent?.bizId || '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.audit.fields.action')">
          {{ actionText(detailEvent?.action) }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.audit.fields.operatorId')">
          {{ detailEvent?.operatorId ? `#${detailEvent.operatorId}` : '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.audit.fields.occurredAt')">
          {{ detailEvent?.occurredAt ? formatToDateTime(detailEvent.occurredAt) : '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.audit.fields.reason')">
          {{ detailEvent?.reason || '-' }}
        </a-descriptions-item>
      </a-descriptions>

      <div class="audit-snapshot-block">
        <div class="vpet-subtitle-spaced">{{ t('page.audit.fields.metadata') }}</div>
        <pre class="audit-json">{{ prettyJson(detailEvent?.metadata) }}</pre>
      </div>

      <div class="audit-snapshot-block">
        <div class="vpet-subtitle-spaced">{{ t('page.audit.fields.beforeSnapshot') }}</div>
        <pre class="audit-json">{{ prettyJson(detailEvent?.beforeSnapshot) }}</pre>
      </div>

      <div class="audit-snapshot-block">
        <div class="vpet-subtitle-spaced">{{ t('page.audit.fields.afterSnapshot') }}</div>
        <pre class="audit-json">{{ prettyJson(detailEvent?.afterSnapshot) }}</pre>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { vpetAuditEvents } from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';

defineOptions({ name: 'VPetAuditCenter' });

type AuditEvent = {
  eventId: string;
  source: string;
  sourceId: number;
  bizType: string;
  bizId?: number | null;
  action: string;
  operatorId?: number | null;
  occurredAt?: string;
  reason?: string | null;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  metadata?: any;
};

const { t } = useVpetLocale();
const loading = ref(false);
const events = ref<AuditEvent[]>([]);
const detailVisible = ref(false);
const detailEvent = ref<AuditEvent | null>(null);
const dateRange = ref<[Dayjs, Dayjs] | undefined>();
const pager = reactive({ current: 1, pageSize: 20, total: 0 });
const filters = reactive<{
  source?: string;
  bizType?: string;
  bizId?: number;
  action?: string;
}>({});

const sourceOptions = computed(() => [
  { value: 'operation', label: t('page.audit.sources.operation') },
  { value: 'emr', label: t('page.audit.sources.emr') },
  { value: 'stock', label: t('page.audit.sources.stock') },
]);

const bizTypeOptions = computed(() => [
  { value: 'billing', label: t('page.audit.bizTypes.billing') },
  { value: 'emr', label: t('page.audit.bizTypes.emr') },
  { value: 'inventory_stock', label: t('page.audit.bizTypes.inventoryStock') },
]);

const columns = computed(() => [
  { title: t('page.audit.fields.source'), key: 'source', dataIndex: 'source', width: 110 },
  { title: t('page.audit.fields.bizType'), key: 'bizType', dataIndex: 'bizType', width: 150 },
  { title: t('page.audit.fields.bizId'), key: 'bizId', dataIndex: 'bizId', width: 100 },
  { title: t('page.audit.fields.action'), key: 'action', dataIndex: 'action', width: 150 },
  { title: t('page.audit.fields.operatorId'), key: 'operatorId', dataIndex: 'operatorId', width: 110 },
  { title: t('page.audit.fields.occurredAt'), key: 'occurredAt', dataIndex: 'occurredAt', width: 180 },
  { title: t('page.audit.fields.reason'), key: 'reason', dataIndex: 'reason', ellipsis: true },
  { title: t('common.action'), key: 'actionColumn', width: 90, fixed: 'right' },
]);

const pagination = computed(() => ({
  current: pager.current,
  pageSize: pager.pageSize,
  total: pager.total,
  showSizeChanger: true,
  showTotal: (total: number) => t('component.table.total', { total }),
}));

function sourceText(source?: string) {
  return sourceOptions.value.find(item => item.value === source)?.label || source || '-';
}

function sourceColor(source?: string) {
  return { operation: 'blue', emr: 'green', stock: 'orange' }[source || ''] || 'default';
}

function bizTypeText(bizType?: string) {
  return bizTypeOptions.value.find(item => item.value === bizType)?.label || bizType || '-';
}

function actionText(action?: string) {
  if (!action) return '-';
  return {
    refund: t('page.audit.actions.refund'),
    lock: t('page.audit.actions.lock'),
    signed: t('page.audit.actions.signed'),
    unlock_requested: t('page.audit.actions.unlockRequested'),
    unlock_approved: t('page.audit.actions.unlockApproved'),
    unlock_rejected: t('page.audit.actions.unlockRejected'),
    stock_in: t('page.audit.actions.stockIn'),
    stock_out: t('page.audit.actions.stockOut'),
    stock_adjust: t('page.audit.actions.stockAdjust'),
    stock_return: t('page.audit.actions.stockReturn'),
  }[action] || action;
}

function buildParams() {
  return {
    page: pager.current,
    pageSize: pager.pageSize,
    source: filters.source,
    bizType: filters.bizType,
    bizId: filters.bizId,
    action: filters.action,
    startDate: dateRange.value?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
    endDate: dateRange.value?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
  };
}

async function loadEvents() {
  loading.value = true;
  try {
    const data = await vpetAuditEvents(buildParams());
    events.value = data?.items || [];
    pager.total = data?.meta?.totalItems || 0;
    pager.current = data?.meta?.currentPage || pager.current;
    pager.pageSize = data?.meta?.itemsPerPage || pager.pageSize;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.source = undefined;
  filters.bizType = undefined;
  filters.bizId = undefined;
  filters.action = undefined;
  dateRange.value = undefined;
  pager.current = 1;
  loadEvents();
}

function handleTableChange(nextPagination: any) {
  pager.current = nextPagination.current || 1;
  pager.pageSize = nextPagination.pageSize || 20;
  loadEvents();
}

function openDetail(record: AuditEvent) {
  detailEvent.value = record;
  detailVisible.value = true;
}

function prettyJson(value: any) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

onMounted(loadEvents);
</script>

<style lang="less" scoped>
  .audit-snapshot-block {
    margin-top: 15px;
  }

  .audit-json {
    max-height: 260px;
    margin: 0;
    padding: 14px 16px;
    overflow: auto;
    color: #334155;
    background: #f8fbfd;
    border: 1px solid var(--vpet-line);
    border-radius: 14px;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
