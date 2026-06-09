<template>
  <div class="vpet-page vpet-stack">
    <a-card class="vpet-detail-card" :title="t('page.hospitalization.nursingTitle')" :bordered="false">
      <a-descriptions :column="2" size="small">
        <a-descriptions-item :label="t('page.hospitalization.fields.hospNo')">{{ detail?.hospNo || '-' }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.hospitalization.fields.pet')">{{ petLabel(detail?.pet, detail?.petSnapshot, detail?.petId) }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.hospitalization.fields.customer')">{{ customerLabel(detail?.customer, detail?.customerSnapshot, detail?.customerId) }}</a-descriptions-item>
        <a-descriptions-item :label="t('page.hospitalization.fields.cageCode')">{{ detail?.cageCode || '-' }}</a-descriptions-item>
      </a-descriptions>
      <a-space class="vpet-block-spaced">
        <a-button type="primary" @click="openCreatePlanModal">{{ t('page.hospitalization.addPlan') }}</a-button>
        <a-button danger @click="openDischargeModal">{{ t('page.hospitalization.discharge') }}</a-button>
      </a-space>
    </a-card>

    <a-card class="vpet-panel-card" :title="t('page.hospitalization.nursing')" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="plans">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="nursingExecutionStatusColor(record.latestExecutionStatus)">
              {{ nursingExecutionStatusText(record.latestExecutionStatus) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openExecuteModal(record)">{{ t('page.hospitalization.execute') }}</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';
import { useFormModal } from '@/hooks/useModal';
import {
  vpetHospitalizationDischarge,
  vpetHospitalizationGet,
  vpetHospitalizationNursingCreate,
  vpetHospitalizationNursingExecute,
  vpetHospitalizationNursingList,
} from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetHospitalizationNursing' });

const route = useRoute();
const { nursingExecutionStatusColor, nursingExecutionStatusText, t } = useVpetLocale();
const { customerLabel, loadDictOptions, optionLabel, petLabel } = useVpetReference();
const [showModal] = useFormModal();
const detail = ref<any>(null);
const plans = ref<any[]>([]);
const nursingPlanTypeOptions = ref<any[]>([]);

const columns = computed(() => [
  {
    title: t('page.hospitalization.fields.planType'),
    dataIndex: 'planType',
    width: 120,
    customRender: ({ text }: any) => optionLabel(nursingPlanTypeOptions.value, text, text || '-'),
  },
  { title: t('page.hospitalization.fields.planName'), dataIndex: 'planName', width: 180 },
  { title: t('page.hospitalization.fields.instruction'), dataIndex: 'instruction' },
  { title: t('page.hospitalization.fields.frequency'), dataIndex: 'frequency', width: 120 },
  { title: t('page.hospitalization.fields.scheduledTime'), dataIndex: 'scheduledTime', width: 180, customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-') },
  { title: t('page.hospitalization.fields.latestExecutionAt'), dataIndex: 'latestExecutionAt', width: 180, customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-') },
  { title: t('page.hospitalization.fields.status'), key: 'status', width: 120 },
  { title: t('common.action'), key: 'action', width: 100 },
]);

async function loadDetail() {
  if (!nursingPlanTypeOptions.value.length) {
    nursingPlanTypeOptions.value = await loadDictOptions('vpet_nursing_plan_type', 'number');
  }
  const hospId = Number(route.params.id);
  detail.value = await vpetHospitalizationGet(hospId);
  plans.value = await vpetHospitalizationNursingList(hospId);
}

async function openCreatePlanModal() {
  await showModal({
    modalProps: {
      title: t('page.hospitalization.addPlan'),
      width: 760,
      onFinish: async (values: any) => {
        await vpetHospitalizationNursingCreate(Number(route.params.id), values);
        message.success(t('page.hospitalization.messages.planCreated'));
        loadDetail();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'planType', label: t('page.hospitalization.fields.planType'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: nursingPlanTypeOptions.value } },
        { field: 'planName', label: t('page.hospitalization.fields.planName'), component: 'Input', required: true, colProps: { span: 12 } },
        { field: 'frequency', label: t('page.hospitalization.fields.frequency'), component: 'Input', colProps: { span: 12 } },
        { field: 'scheduledTime', label: t('page.hospitalization.fields.scheduledTime'), component: 'DatePicker', required: true, colProps: { span: 12 }, componentProps: { showTime: true, style: { width: '100%' } } },
        { field: 'instruction', label: t('page.hospitalization.fields.instruction'), component: 'InputTextArea', colProps: { span: 24 } },
      ],
    },
  });
}

async function openExecuteModal(record: any) {
  await showModal({
    modalProps: {
      title: t('page.hospitalization.execute'),
      width: 640,
      onFinish: async (values: any) => {
        await vpetHospitalizationNursingExecute(record.id, values);
        message.success(t('page.hospitalization.messages.executed'));
        loadDetail();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'executorName', label: t('page.hospitalization.fields.executorName'), component: 'Input', required: true, colProps: { span: 24 } },
        { field: 'resultNote', label: t('page.hospitalization.fields.resultNote'), component: 'InputTextArea', colProps: { span: 24 } },
      ],
    },
  });
}

async function openDischargeModal() {
  await showModal({
    modalProps: {
      title: t('page.hospitalization.discharge'),
      onFinish: async (values: any) => {
        await vpetHospitalizationDischarge(Number(route.params.id), values);
        message.success(t('page.hospitalization.messages.discharged'));
        loadDetail();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'dischargeSummary', label: t('page.hospitalization.fields.dischargeSummary'), component: 'InputTextArea', colProps: { span: 24 } },
      ],
    },
  });
}

onMounted(loadDetail);
</script>
