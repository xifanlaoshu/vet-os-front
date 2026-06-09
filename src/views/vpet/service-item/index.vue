<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.serviceItem.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.serviceItem.fields.itemCode')">
          <a-input v-model:value="filters.itemCode" allow-clear @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item class="vpet-query-item-wide" :label="t('page.serviceItem.fields.itemName')">
          <a-input v-model:value="filters.itemName" allow-clear @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.serviceItem.fields.category')">
          <a-select v-model:value="filters.category" allow-clear :options="chargeItemCategoryOptions" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openServiceItemModal({})">
              <Icon icon="ant-design:plus-outlined" />
              {{ t('page.serviceItem.add') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <ServiceItemTable
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.serviceItem.title')"
      show-index
      :data-request="loadTableData"
      :columns="columns"
      :search="false"
    />

    <a-modal
      v-model:open="showModal"
      :title="serviceItemForm.id ? t('page.serviceItem.edit') : t('page.serviceItem.add')"
      @ok="submitServiceItem"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.serviceItem.fields.itemCode')" required>
              <a-input v-model:value="serviceItemForm.itemCode" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.serviceItem.fields.itemName')" required>
              <a-input v-model:value="serviceItemForm.itemName" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.serviceItem.fields.category')">
              <a-select v-model:value="serviceItemForm.category" allow-clear :options="chargeItemCategoryOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.serviceItem.fields.unit')">
              <a-input v-model:value="serviceItemForm.unit" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.serviceItem.fields.retailPrice')">
              <a-input-number v-model:value="serviceItemForm.retailPrice" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.serviceItem.fields.status')">
              <a-select v-model:value="serviceItemForm.status" :options="pharmacyStatusOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.serviceItem.fields.specification')">
              <a-input v-model:value="serviceItemForm.specification" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.serviceItem.fields.description')">
              <a-textarea v-model:value="serviceItemForm.description" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { message, Tag } from 'ant-design-vue';
import Icon from '@/components/basic/icon/Icon.vue';
import { useTable } from '@/components/core/dynamic-table';
import {
  vpetChargeItemCreate,
  vpetChargeItemDelete,
  vpetChargeItemList,
  vpetChargeItemUpdate,
} from '@/api/backend/vpet/pharmacy';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetServiceItem' });

const { t, pharmacyStatusColor, pharmacyStatusOptions, pharmacyStatusText } = useVpetLocale();
const { loadDictOptions, optionLabel } = useVpetReference();
const [ServiceItemTable, serviceItemTableInstance] = useTable();

const showModal = ref(false);
const chargeItemCategoryOptions = ref<any[]>([]);
const filters = ref({
  itemCode: '',
  itemName: '',
  category: undefined as string | undefined,
});
const serviceItemForm = ref<any>(createEmptyServiceItemForm());

const columns = computed(() => [
  { title: t('page.serviceItem.fields.itemCode'), dataIndex: 'itemCode', width: 140 },
  { title: t('page.serviceItem.fields.itemName'), dataIndex: 'itemName', width: 180 },
  {
    title: t('page.serviceItem.fields.category'),
    dataIndex: 'category',
    width: 120,
    customRender: ({ text }: any) => optionLabel(chargeItemCategoryOptions.value, text, '-'),
  },
  { title: t('page.serviceItem.fields.specification'), dataIndex: 'specification', width: 160 },
  { title: t('page.serviceItem.fields.unit'), dataIndex: 'unit', width: 80 },
  {
    title: t('page.serviceItem.fields.retailPrice'),
    dataIndex: 'retailPrice',
    width: 120,
    customRender: ({ text }: any) => `${Number(text || 0).toFixed(2)} ${t('common.amountUnit')}`,
  },
  {
    title: t('page.serviceItem.fields.status'),
    dataIndex: 'status',
    width: 90,
    customRender: ({ record }: any) => <Tag color={pharmacyStatusColor(record.status)}>{pharmacyStatusText(record.status)}</Tag>,
  },
  {
    title: t('common.action'),
    width: 130,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:edit-outlined',
        tooltip: t('common.edit'),
        onClick: () => openServiceItemModal(record),
      },
      {
        icon: 'ant-design:delete-outlined',
        tooltip: t('common.delete'),
        popConfirm: {
          title: t('common.confirmDelete'),
          onConfirm: () => deleteServiceItem(record),
        },
      },
    ],
  },
]);

const loadTableData = async (params: any) => {
  const keywords = [
    filters.value.itemCode?.trim(),
    filters.value.itemName?.trim(),
  ].filter(Boolean);

  return vpetChargeItemList({
    ...params,
    keyword: keywords.join(' '),
    category: filters.value.category,
  }) as any;
};

function reloadTable() {
  serviceItemTableInstance?.reload();
}

function resetFilters() {
  filters.value = {
    itemCode: '',
    itemName: '',
    category: undefined,
  };
  reloadTable();
}

function createEmptyServiceItemForm() {
  return {
    id: undefined as number | undefined,
    itemCode: '',
    itemName: '',
    category: undefined as string | undefined,
    specification: '',
    unit: '',
    retailPrice: 0,
    status: 1,
    description: '',
  };
}

function openServiceItemModal(record: any = {}) {
  serviceItemForm.value = {
    ...createEmptyServiceItemForm(),
    ...record,
    retailPrice: Number(record.retailPrice || 0),
    status: record.status ?? 1,
  };
  showModal.value = true;
}

async function submitServiceItem() {
  if (!serviceItemForm.value.itemCode || !serviceItemForm.value.itemName) {
    message.error(t('page.serviceItem.messages.required'));
    return;
  }

  const payload = {
    itemCode: serviceItemForm.value.itemCode,
    itemName: serviceItemForm.value.itemName,
    category: serviceItemForm.value.category || undefined,
    specification: serviceItemForm.value.specification || undefined,
    unit: serviceItemForm.value.unit || undefined,
    retailPrice: Number(serviceItemForm.value.retailPrice || 0),
    status: Number(serviceItemForm.value.status ?? 1),
    description: serviceItemForm.value.description || undefined,
  };

  if (serviceItemForm.value.id) {
    await vpetChargeItemUpdate(serviceItemForm.value.id, payload);
    message.success(t('page.serviceItem.messages.updated'));
  } else {
    await vpetChargeItemCreate(payload);
    message.success(t('page.serviceItem.messages.created'));
  }

  showModal.value = false;
  reloadTable();
}

async function deleteServiceItem(record: any) {
  await vpetChargeItemDelete(record.id);
  message.success(t('page.serviceItem.messages.deleted'));
  reloadTable();
}

onMounted(() => {
  loadDictOptions('vpet_charge_item_category').then((options) => {
    chargeItemCategoryOptions.value = options;
  });
});
</script>
