<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.pharmacy.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.pharmacy.fields.drugCode')">
          <a-input v-model:value="filters.drugCode" allow-clear @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item class="vpet-query-item-wide" :label="t('page.pharmacy.fields.drugName')">
          <a-input v-model:value="filters.drugName" allow-clear @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.pharmacy.fields.specification')">
          <a-input v-model:value="filters.specification" allow-clear @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.pharmacy.fields.packageRetailPrice')">
          <a-input-number v-model:value="filters.retailPrice" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="t('page.pharmacy.fields.minPackageStock')">
          <a-input-number v-model:value="filters.minStock" :min="0" style="width: 100%" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openDrugModal({})">
              <Icon icon="ant-design:plus-outlined" />
              {{ t('page.pharmacy.addDrug') }}
            </a-button>
            <a-button @click="showAlerts = !showAlerts">
              <Icon icon="ant-design:warning-outlined" />
              {{ t('page.pharmacy.stockAlert') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <DynamicTable
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.pharmacy.title')"
      show-index
      :data-request="loadTableData"
      :columns="columns"
      :search="false"
    >
    </DynamicTable>

    <a-modal v-model:open="showAlerts" :title="t('page.pharmacy.alertTitle')" :footer="null" width="600px">
      <a-collapse v-model:activeKey="alertKeys">
        <a-collapse-panel key="low" :header="t('page.pharmacy.lowStockPanel')">
          <div v-for="drug in lowStock" :key="drug.id" style="padding: 4px 0">
            {{ drug.drugName }}
            / {{ t('page.pharmacy.fields.currentStock') }}: {{ stockText(drug) }}
            / {{ t('page.pharmacy.fields.minPackageStock') }}: {{ drug.minStock }} {{ drug.packageUnit || drug.unit }}
          </div>
          <div v-if="lowStock.length === 0" style="color: #888; padding: 8px">
            {{ t('page.pharmacy.emptyLowStock') }}
          </div>
        </a-collapse-panel>
        <a-collapse-panel key="exp" :header="t('page.pharmacy.expiringPanel')">
          <div v-for="batch in expiring" :key="batch.id" style="padding: 4px 0">
            {{ drugLabel(batch.drug, batch.drugName, batch.drugId) }}
            / {{ t('page.pharmacy.fields.batchNo') }}: {{ batch.batchNo }}
            / {{ t('page.pharmacy.fields.expireDate') }}: {{ batch.expireDate }}
            / {{ t('page.pharmacy.fields.quantity') }}: {{ batch.quantity }}
          </div>
          <div v-if="expiring.length === 0" style="color: #888; padding: 8px">
            {{ t('page.pharmacy.emptyExpiring') }}
          </div>
        </a-collapse-panel>
      </a-collapse>
    </a-modal>

    <a-modal v-model:open="showBatch" :title="t('page.pharmacy.batchDetail')" :footer="null" width="800px">
      <a-table :data-source="batchList" :columns="batchColumns" row-key="id" size="small" :pagination="false" />
    </a-modal>

    <a-modal v-model:open="showStockIn" :title="t('page.pharmacy.stockIn')" @ok="handleStockIn">
      <a-form layout="vertical">
        <a-form-item :label="t('page.pharmacy.fields.drugName')">
          {{ stockInRecord?.drugName }}
        </a-form-item>
        <a-alert
          v-if="stockInRecord"
          type="info"
          show-icon
          class="vpet-block-bottom"
          :message="stockInConversionText"
        />
        <a-form-item :label="t('page.pharmacy.fields.stockInPackageQuantity')">
          <a-input-number v-model:value="stockInForm.quantity" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="t('page.pharmacy.fields.batchNo')">
          <a-input v-model:value="stockInForm.batchNo" />
        </a-form-item>
        <a-form-item :label="t('page.pharmacy.fields.expireDate')">
          <a-input v-model:value="stockInForm.expireDate" :placeholder="t('page.pharmacy.placeholders.expireDate')" />
        </a-form-item>
        <a-form-item :label="t('page.pharmacy.fields.purchasePrice')">
          <a-input-number v-model:value="stockInForm.purchasePrice" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

  </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useTable } from '@/components/core/dynamic-table';
import { useFormModal } from '@/hooks/useModal';
import Icon from '@/components/basic/icon/Icon.vue';
import { createPharmacyColumns } from './columns';
import { createDrugSchemas } from './formSchemas';
import {
  vpetPharmacyCreate,
  vpetPharmacyExpiring,
  vpetPharmacyGetBatches,
  vpetPharmacyList,
  vpetPharmacyLowStock,
  vpetPharmacyStockIn,
  vpetPharmacyUpdate,
} from '@/api/backend/vpet/pharmacy';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetPharmacy' });

const { t, pharmacyBatchStatusOptions } = useVpetLocale();
const { drugLabel } = useVpetReference();
const [DynamicTable, dynamicTableInstance] = useTable();
const [showModal] = useFormModal();

const showAlerts = ref(false);
const alertKeys = ref(['low', 'exp']);
const lowStock = ref<any[]>([]);
const expiring = ref<any[]>([]);
const showBatch = ref(false);
const showStockIn = ref(false);
const stockInRecord = ref<any>(null);
const stockInForm = ref<any>({ quantity: 1, batchNo: '', expireDate: '', purchasePrice: 0 });
const batchList = ref<any[]>([]);
const filters = ref({
  drugCode: '',
  drugName: '',
  specification: '',
  retailPrice: undefined as number | undefined,
  minStock: undefined as number | undefined,
});

const batchStatusText = computed<Record<number, string>>(() =>
  Object.fromEntries(
    pharmacyBatchStatusOptions.value.map(item => [Number(item.value), item.label]),
  ) as Record<number, string>,
);

const batchColumns = computed(() => [
  { title: t('page.pharmacy.fields.batchNo'), dataIndex: 'batchNo', key: 'batchNo' },
  { title: t('page.pharmacy.fields.expireDate'), dataIndex: 'expireDate', key: 'expireDate' },
  {
    title: t('page.pharmacy.fields.quantity'),
    key: 'quantity',
    customRender: ({ record }: any) => {
      const dosageUnit = record.dosageUnit || '';
      const packageUnit = record.packageUnit || '';
      return `${Number(record.quantity || 0).toFixed(2)} / ${Number(record.initialQuantity || 0).toFixed(2)} ${dosageUnit} (${Number(record.currentPackageQuantity || 0).toFixed(2)} / ${Number(record.initialPackageQuantity || 0).toFixed(2)} ${packageUnit})`;
    },
  },
  {
    title: t('page.pharmacy.fields.purchasePrice'),
    dataIndex: 'purchasePrice',
    key: 'purchasePrice',
    customRender: ({ text }: any) => (text ? `${text} ${t('common.amountUnit')}` : '-'),
  },
  {
    title: t('page.pharmacy.fields.status'),
    dataIndex: 'status',
    key: 'status',
    customRender: ({ record }: any) => <span>{batchStatusText.value[record.status] || t('common.unknown')}</span>,
  },
]);

const stockInConversionText = computed(() => {
  const record = stockInRecord.value;
  if (!record) return '';
  const packageQuantity = Number(stockInForm.value.quantity || 0);
  const packageContentQuantity = Number(record.packageContentQuantity || 1);
  const dosageQuantity = packageQuantity * packageContentQuantity;
  return t('page.pharmacy.messages.stockInConversion', {
    packageQuantity: packageQuantity.toFixed(2),
    packageUnit: record.packageUnit || record.unit || '',
    dosageQuantity: dosageQuantity.toFixed(2),
    dosageUnit: record.dosageUnit || record.unit || '',
  });
});

const loadTableData = async (params: any) => {
  const keywords = [
    filters.value.drugCode?.trim(),
    filters.value.drugName?.trim(),
    filters.value.specification?.trim(),
  ].filter(Boolean);

  const data: any = await vpetPharmacyList({
    ...params,
    keyword: keywords.join(' '),
  });

  const items = (data?.items || []).filter((item: any) => {
    if (filters.value.drugCode && !String(item.drugCode || '').toLowerCase().includes(filters.value.drugCode.toLowerCase())) {
      return false;
    }
    if (filters.value.drugName && !String(item.drugName || '').toLowerCase().includes(filters.value.drugName.toLowerCase())) {
      return false;
    }
    if (filters.value.specification && !String(item.specification || '').toLowerCase().includes(filters.value.specification.toLowerCase())) {
      return false;
    }
    if (filters.value.retailPrice !== undefined && Number(item.retailPrice) !== Number(filters.value.retailPrice)) {
      return false;
    }
    if (filters.value.minStock !== undefined && Number(item.minStock) !== Number(filters.value.minStock)) {
      return false;
    }
    return true;
  });

  return {
    ...(data || {}),
    items,
    meta: {
      ...(data?.meta || {}),
      totalItems: items.length,
    },
  };
};

function reloadTable() {
  dynamicTableInstance?.reload();
}

function resetFilters() {
  filters.value = {
    drugCode: '',
    drugName: '',
    specification: '',
    retailPrice: undefined,
    minStock: undefined,
  };
  reloadTable();
}

function stockText(drug: any) {
  const dosageUnit = drug.dosageUnit || drug.unit || '';
  const packageUnit = drug.packageUnit || drug.unit || '';
  return `${Number(drug.currentStock || 0).toFixed(2)} ${dosageUnit} / ${Number(drug.currentPackageStock || 0).toFixed(2)} ${packageUnit}`;
}

async function openDrugModal(record: any = {}) {
  const isUpdate = Boolean(record.id);

  const [formRef] = await showModal({
    modalProps: {
      title: isUpdate ? t('page.pharmacy.editDrug') : t('page.pharmacy.addDrug'),
      width: 700,
      onFinish: async (values) => {
        if (isUpdate) {
          await vpetPharmacyUpdate(record.id, values);
          message.success(t('page.pharmacy.messages.updated'));
        } else {
          await vpetPharmacyCreate(values);
          message.success(t('page.pharmacy.messages.created'));
        }
        dynamicTableInstance?.reload();
      },
    },
    formProps: { labelWidth: 100, schemas: createDrugSchemas() as any[] },
  });

  if (isUpdate) {
    formRef?.setFieldsValue(record);
  }
}

const columns = [
  ...createPharmacyColumns(),
  {
    title: t('common.action'),
    width: 160,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:folder-open-outlined',
        tooltip: t('page.pharmacy.batchDetail'),
        onClick: async () => {
          const list = await vpetPharmacyGetBatches(record.id) as any[];
          batchList.value = list ?? [];
          showBatch.value = true;
        },
      },
      {
        icon: 'ant-design:plus-circle-outlined',
        tooltip: t('page.pharmacy.stockIn'),
        onClick: () => {
          stockInRecord.value = record;
          stockInForm.value = { quantity: 1, batchNo: '', expireDate: '', purchasePrice: 0 };
          showStockIn.value = true;
        },
      },
      {
        icon: 'ant-design:edit-outlined',
        tooltip: t('common.edit'),
        onClick: () => openDrugModal(record),
      },
    ],
  },
];

async function loadAlerts() {
  try {
    lowStock.value = await vpetPharmacyLowStock() as any[];
    expiring.value = await vpetPharmacyExpiring(30) as any[];
  } catch {}
}

async function handleStockIn() {
  if (!stockInRecord.value) return;
  try {
    await vpetPharmacyStockIn(stockInRecord.value.id, {
      quantity: stockInForm.value.quantity,
      batchNo: stockInForm.value.batchNo || undefined,
      expireDate: stockInForm.value.expireDate || undefined,
      purchasePrice: stockInForm.value.purchasePrice || undefined,
    });
    message.success(t('page.pharmacy.messages.stockInSuccess', { drugName: stockInRecord.value.drugName }));
    showStockIn.value = false;
    dynamicTableInstance?.reload();
    await loadAlerts();
  } catch {}
}

onMounted(() => {
  loadAlerts();
});
</script>
