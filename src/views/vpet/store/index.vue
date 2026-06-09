<template>
  <div class="vpet-page">
    <a-card class="vpet-panel-card" :bordered="false">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="stores" :tab="t('page.store.stores')">
          <a-space class="vpet-action-bar vpet-action-bar-right">
            <a-button type="primary" @click="openCreateStoreModal">{{ t('page.store.createStore') }}</a-button>
          </a-space>
          <a-table row-key="id" :columns="storeColumns" :data-source="stores" :pagination="false" />
        </a-tab-pane>

        <a-tab-pane key="stock" :tab="t('page.store.stock')">
          <a-space class="vpet-action-bar vpet-action-bar-between">
            <a-select v-model:value="activeStoreId" style="width: 280px" :options="storeOptions" @change="loadStock" />
            <a-button type="primary" @click="openSetStockModal">{{ t('page.store.setStock') }}</a-button>
          </a-space>
          <a-table row-key="id" :columns="stockColumns" :data-source="stockList" :pagination="false" />
        </a-tab-pane>

        <a-tab-pane key="transfer" :tab="t('page.store.transfer')">
          <a-space class="vpet-action-bar vpet-action-bar-right">
            <a-button type="primary" @click="openCreateTransferModal">{{ t('page.store.createTransfer') }}</a-button>
          </a-space>
          <a-table row-key="id" :columns="transferColumns" :data-source="transfers" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="transferStatusColor(record.status)">{{ transferStatusText(record.status) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="approveTransfer(record)">{{ t('page.store.approve') }}</a-button>
                  <a-button type="link" size="small" @click="completeTransfer(record)">{{ t('page.store.complete') }}</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useFormModal } from '@/hooks/useModal';
import {
  vpetPharmacyList,
  vpetStoreCreate,
  vpetStoreList,
  vpetStoreStockList,
  vpetStoreStockSet,
  vpetStoreTransferApprove,
  vpetStoreTransferComplete,
  vpetStoreTransferCreate,
  vpetStoreTransferList,
} from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';

defineOptions({ name: 'VPetStore' });

const { t, transferStatusColor, transferStatusText } = useVpetLocale();
const [showModal] = useFormModal();
const activeTab = ref('stores');
const stores = ref<any[]>([]);
const stockList = ref<any[]>([]);
const transfers = ref<any[]>([]);
const activeStoreId = ref<number>();
const drugOptions = ref<any[]>([]);

const storeOptions = computed(() => stores.value.map(item => ({ value: item.id, label: `${item.storeName} / ${item.storeCode}` })));
const storeColumns = [
  { title: t('page.store.fields.storeCode'), dataIndex: 'storeCode', width: 160 },
  { title: t('page.store.fields.storeName'), dataIndex: 'storeName', width: 220 },
  { title: t('page.store.fields.contactName'), dataIndex: 'contactName', width: 160 },
  { title: t('page.store.fields.contactPhone'), dataIndex: 'contactPhone', width: 180 },
];
const stockColumns = [
  { title: t('page.store.fields.drugName'), dataIndex: ['drug', 'drugName'], width: 260 },
  { title: t('page.store.fields.quantity'), dataIndex: 'quantity', width: 120 },
  { title: t('page.store.fields.safetyStock'), dataIndex: 'safetyStock', width: 120 },
];
const transferColumns = [
  { title: t('page.store.fields.transferNo'), dataIndex: 'transferNo', width: 170 },
  { title: t('page.store.fields.sourceStore'), dataIndex: ['sourceStore', 'storeName'], width: 180 },
  { title: t('page.store.fields.targetStore'), dataIndex: ['targetStore', 'storeName'], width: 180 },
  { title: t('page.store.fields.status'), key: 'status', width: 120 },
  { title: t('common.action'), key: 'action', width: 160 },
];

async function loadDrugOptions() {
  const data: any = await vpetPharmacyList({ page: 1, pageSize: 100 });
  drugOptions.value = (data?.items || []).map((item: any) => ({ value: item.id, label: `${item.drugName} / ${item.drugCode}` }));
}

async function loadStores() {
  const data: any = await vpetStoreList({ page: 1, pageSize: 100 });
  stores.value = data?.items || [];
  if (!activeStoreId.value && stores.value.length) {
    activeStoreId.value = stores.value[0].id;
  }
}

async function loadStock() {
  if (!activeStoreId.value) {
    stockList.value = [];
    return;
  }
  stockList.value = await vpetStoreStockList(activeStoreId.value);
}

async function loadTransfers() {
  const data: any = await vpetStoreTransferList({ page: 1, pageSize: 100 });
  transfers.value = data?.items || [];
}

async function openCreateStoreModal() {
  await showModal({
    modalProps: {
      title: t('page.store.createStore'),
      onFinish: async (values: any) => {
        await vpetStoreCreate(values);
        message.success(t('page.store.messages.storeCreated'));
        loadStores();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'storeCode', label: t('page.store.fields.storeCode'), component: 'Input', required: true, colProps: { span: 24 } },
        { field: 'storeName', label: t('page.store.fields.storeName'), component: 'Input', required: true, colProps: { span: 24 } },
        { field: 'contactName', label: t('page.store.fields.contactName'), component: 'Input', colProps: { span: 12 } },
        { field: 'contactPhone', label: t('page.store.fields.contactPhone'), component: 'Input', colProps: { span: 12 } },
      ],
    },
  });
}

async function openSetStockModal() {
  if (!activeStoreId.value) return;
  if (!drugOptions.value.length) await loadDrugOptions();
  await showModal({
    modalProps: {
      title: t('page.store.setStock'),
      onFinish: async (values: any) => {
        await vpetStoreStockSet(activeStoreId.value!, values);
        message.success(t('page.store.messages.stockSaved'));
        loadStock();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'drugId', label: t('page.store.fields.drugName'), component: 'Select', required: true, colProps: { span: 24 }, componentProps: { options: drugOptions.value, showSearch: true, optionFilterProp: 'label' } },
        { field: 'quantity', label: t('page.store.fields.quantity'), component: 'InputNumber', required: true, colProps: { span: 12 } },
        { field: 'safetyStock', label: t('page.store.fields.safetyStock'), component: 'InputNumber', colProps: { span: 12 } },
      ],
    },
  });
}

async function openCreateTransferModal() {
  if (!stores.value.length) await loadStores();
  if (!drugOptions.value.length) await loadDrugOptions();
  await showModal({
    modalProps: {
      title: t('page.store.createTransfer'),
      width: 760,
      onFinish: async (values: any) => {
        await vpetStoreTransferCreate({
          sourceStoreId: values.sourceStoreId,
          targetStoreId: values.targetStoreId,
          reason: values.reason,
          items: [{ drugId: values.drugId, quantity: values.quantity }],
        });
        message.success(t('page.store.messages.transferCreated'));
        loadTransfers();
      },
    },
    formProps: {
      labelWidth: 120,
      schemas: [
        { field: 'sourceStoreId', label: t('page.store.fields.sourceStore'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: storeOptions.value } },
        { field: 'targetStoreId', label: t('page.store.fields.targetStore'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: storeOptions.value } },
        { field: 'drugId', label: t('page.store.fields.drugName'), component: 'Select', required: true, colProps: { span: 12 }, componentProps: { options: drugOptions.value, showSearch: true, optionFilterProp: 'label' } },
        { field: 'quantity', label: t('page.store.fields.quantity'), component: 'InputNumber', required: true, colProps: { span: 12 } },
        { field: 'reason', label: t('page.store.fields.reason'), component: 'InputTextArea', colProps: { span: 24 } },
      ],
    },
  });
}

async function approveTransfer(record: any) {
  await vpetStoreTransferApprove(record.id);
  message.success(t('page.store.messages.transferApproved'));
  loadTransfers();
}

async function completeTransfer(record: any) {
  await vpetStoreTransferComplete(record.id);
  message.success(t('page.store.messages.transferCompleted'));
  loadTransfers();
  loadStock();
}

onMounted(async () => {
  await loadStores();
  await loadStock();
  await loadTransfers();
});
</script>
