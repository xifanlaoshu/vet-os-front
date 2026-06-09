<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.customer.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.customer.fields.name')" class="vpet-query-item-wide">
          <a-input v-model:value="filters.name" :placeholder="`${t('common.inputText')}${t('page.customer.fields.name')}`" @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.customer.fields.phone')">
          <a-input v-model:value="filters.phone" :placeholder="`${t('common.inputText')}${t('page.customer.fields.phone')}`" @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.customer.fields.address')" class="vpet-query-item-wider">
          <a-input v-model:value="filters.address" :placeholder="`${t('common.inputText')}${t('page.customer.fields.address')}`" @pressEnter="reloadTable" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openModal({})">
              <Icon icon="ant-design:plus-outlined" /> {{ t('page.customer.add') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <DynamicTable
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.customer.title')"
      show-index
      :search="false"
      :data-request="loadTableData"
      :columns="columns"
    />
  </div>
</template>

<script setup lang="tsx">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTable } from '@/components/core/dynamic-table';
import { useFormModal } from '@/hooks/useModal';
import Icon from '@/components/basic/icon/Icon.vue';
import { createCustomerColumns } from './columns';
import { vpetCustomerCreate, vpetCustomerList, vpetCustomerUpdate } from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';

defineOptions({ name: 'VPetCustomer' });

const { t } = useVpetLocale();
const router = useRouter();
const [DynamicTable, dynamicTableInstance] = useTable();
const [showModal] = useFormModal();
const filters = ref({
  name: '',
  phone: '',
  address: '',
});

const loadTableData = async (params: any) => {
  return await vpetCustomerList({
    ...params,
    name: filters.value.name || undefined,
    phone: filters.value.phone || undefined,
    address: filters.value.address || undefined,
  }) as any;
};

function reloadTable() {
  dynamicTableInstance?.reload();
}

function resetFilters() {
  filters.value = {
    name: '',
    phone: '',
    address: '',
  };
  reloadTable();
}

const openModal = async (record: any = {}) => {
  const isUpdate = Boolean(record.id);
  const schemas: any[] = [
    { field: 'name', label: t('page.customer.fields.name'), component: 'Input', required: true, colProps: { span: 12 } },
    { field: 'phone', label: t('page.customer.fields.phone'), component: 'Input', required: true, colProps: { span: 12 } },
    { field: 'address', label: t('page.customer.fields.address'), component: 'Input', colProps: { span: 24 } },
    { field: 'remark', label: t('page.customer.fields.remark'), component: 'InputTextArea', colProps: { span: 24 } },
  ];

  const [formRef] = await showModal({
    modalProps: {
      title: isUpdate ? t('page.customer.edit') : t('page.customer.add'),
      width: 600,
      onFinish: async (values) => {
        if (isUpdate) {
          await vpetCustomerUpdate(record.id, values);
        } else {
          await vpetCustomerCreate(values);
        }
        dynamicTableInstance?.reload();
      },
    },
    formProps: { labelWidth: 100, schemas },
  });

  if (isUpdate) {
    formRef?.setFieldsValue(record);
  }
};

const columns = [
  ...createCustomerColumns(),
  {
    title: t('page.appointment.table.action'),
    width: 120,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:eye-outlined',
        tooltip: t('common.detail'),
        onClick: () => router.push('/vpet/customer/' + record.id),
      },
      {
        icon: 'ant-design:edit-outlined',
        tooltip: t('common.edit'),
        onClick: () => openModal(record),
      },
    ],
  },
];
</script>
