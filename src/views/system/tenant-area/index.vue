<template>
  <DynamicTable
    row-key="id"
    header-title="院区管理"
    title-tooltip="院区是业务操作、排班预约和库存归属边界；药品库存跟随当前院区。"
    :data-request="loadTableData"
    :columns="columns"
    :scroll="{ x: 1300 }"
    :immediate="false"
    bordered
    size="small"
  >
    <template #toolbar>
      <a-button
        type="primary"
        :disabled="!$auth('system:tenant:area:create')"
        @click="openAreaModal({})"
      >
        新增
      </a-button>
    </template>
    <template #form-tenantId="{ formModel, field }">
      <a-select
        v-model:value="formModel[field]"
        allow-clear
        show-search
        placeholder="请选择租户"
        :options="tenantOptions"
        :filter-option="filterTenantOption"
      />
    </template>
  </DynamicTable>
</template>

<script lang="tsx" setup>
  import { computed, onMounted, ref } from 'vue';
  import { Tag, Typography } from 'ant-design-vue';
  import type { FormSchema } from '@/components/core/schema-form';
  import type { TableColumn } from '@/components/core/dynamic-table';
  import { useTable } from '@/components/core/dynamic-table';
  import { useFormModal } from '@/hooks/useModal/';
  import Api from '@/api/';

  defineOptions({ name: 'SystemTenantArea' });

  type AreaRecord = Recordable & {
    id?: number;
    tenantId?: number;
    tenant?: { name?: string };
    code?: string;
    name?: string;
    shortName?: string;
    contactPhone?: string;
    region?: string;
    address?: string;
    sortNo?: number;
    defaultArea?: number;
    status?: number;
    remark?: string;
  };
  type TableColumnItem = TableColumn<AreaRecord>;

  const statusOptions = [
    { value: 1, label: '启用' },
    { value: 0, label: '停用' },
  ];
  const defaultAreaOptions = [
    { value: 1, label: '默认' },
    { value: 0, label: '普通' },
  ];

  const tenantRows = ref<any[]>([]);
  const tenantOptions = computed(() =>
    tenantRows.value.map(item => ({
      value: item.id,
      label: item.name,
    })),
  );

  const [DynamicTable, dynamicTableInstance] = useTable({
    formProps: {
      autoSubmitOnEnter: true,
    },
  });
  const [showModal] = useFormModal();

  function filterTenantOption(input: string, option: any) {
    return String(option?.label || '').toLowerCase().includes(input.toLowerCase());
  }

  function tenantName(id?: number, mappedName?: string) {
    return mappedName || tenantRows.value.find(item => Number(item.id) === Number(id))?.name || (id ? `#${id}` : '-');
  }

  const textCell = (value?: string, maxWidth = 180) => (
    <Typography.Text
      style={{ maxWidth: `${maxWidth}px` }}
      ellipsis={{ tooltip: value || '-' }}
    >
      {value || '-'}
    </Typography.Text>
  );

  async function loadTenants() {
    tenantRows.value = await Api.systemTenant.tenantOptions();
  }

  const loadTableData = async (params: Recordable) => {
    return Api.systemTenant.tenantAreaList({
      ...params,
      page: params.page,
      pageSize: params.pageSize || params.limit,
    });
  };

  const modalSchemas: FormSchema<AreaRecord>[] = [
    {
      field: 'tenantId',
      label: '所属租户',
      component: 'Select',
      required: true,
      colProps: { span: 8 },
      componentProps: () => ({
        options: tenantOptions.value,
        showSearch: true,
        filterOption: filterTenantOption,
        placeholder: '请选择租户',
      }),
    },
    { field: 'code', label: '院区编码', component: 'Input', required: true, colProps: { span: 8 } },
    { field: 'name', label: '院区名称', component: 'Input', required: true, colProps: { span: 8 } },
    { field: 'shortName', label: '简称', component: 'Input', colProps: { span: 8 } },
    { field: 'contactPhone', label: '联系电话', component: 'Input', colProps: { span: 8 } },
    { field: 'region', label: '地区', component: 'Input', colProps: { span: 8 } },
    {
      field: 'sortNo',
      label: '排序',
      component: 'InputNumber',
      defaultValue: 0,
      colProps: { span: 8 },
      componentProps: { style: { width: '100%' }, min: 0, precision: 0 },
    },
    {
      field: 'defaultArea',
      label: '默认院区',
      component: 'Select',
      defaultValue: 0,
      colProps: { span: 8 },
      componentProps: { options: defaultAreaOptions },
    },
    {
      field: 'status',
      label: '状态',
      component: 'Select',
      defaultValue: 1,
      required: true,
      colProps: { span: 8 },
      componentProps: { options: statusOptions },
    },
    { field: 'address', label: '地址', component: 'Input', colProps: { span: 24 } },
    { field: 'remark', label: '备注', component: 'InputTextArea', colProps: { span: 24 }, componentProps: { rows: 3 } },
  ];

  const openAreaModal = async (record: Partial<AreaRecord>) => {
    const isUpdate = Boolean(record.id);
    if (!tenantRows.value.length) {
      await loadTenants();
    }

    const [formRef] = await showModal({
      modalProps: {
        title: `${isUpdate ? '编辑' : '新增'}院区`,
        width: 860,
        onFinish: async (values) => {
          const payload = {
            ...values,
            defaultArea: Number(values.defaultArea || 0),
            status: Number(values.status ?? 1),
            sortNo: Number(values.sortNo || 0),
          };
          if (isUpdate) {
            await Api.systemTenant.tenantAreaUpdate(record.id!, payload);
          } else {
            await Api.systemTenant.tenantAreaCreate(payload);
          }
          dynamicTableInstance?.reload();
        },
      },
      formProps: {
        labelWidth: 92,
        schemas: modalSchemas,
        rowProps: { gutter: 15 },
      },
    });

    formRef?.setFieldsValue({
      tenantId: record.tenantId || tenantRows.value[0]?.id,
      defaultArea: 0,
      status: 1,
      sortNo: 0,
      ...record,
    });
  };

  const columns: TableColumnItem[] = [
    {
      title: '租户',
      dataIndex: 'tenantId',
      width: 180,
      formItemProps: {
        component: 'Select',
        slot: 'tenantId',
      },
      customRender: ({ record }) => textCell(tenantName(record.tenantId, record.tenant?.name), 160),
    },
    {
      title: '院区名称',
      dataIndex: 'name',
      width: 190,
      searchField: 'keyword',
      formItemProps: {
        label: '关键字',
        componentProps: {
          placeholder: '编码 / 名称 / 电话',
          allowClear: true,
        },
      },
      customRender: ({ record }) => textCell(record.name, 170),
    },
    {
      title: '院区编码',
      dataIndex: 'code',
      width: 140,
      hideInSearch: true,
      customRender: ({ record }) => textCell(record.code, 120),
    },
    {
      title: '简称',
      dataIndex: 'shortName',
      width: 130,
      hideInSearch: true,
      customRender: ({ record }) => textCell(record.shortName, 110),
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      width: 150,
      hideInSearch: true,
      customRender: ({ record }) => textCell(record.contactPhone, 130),
    },
    {
      title: '地区',
      dataIndex: 'region',
      width: 130,
      hideInSearch: true,
      customRender: ({ record }) => textCell(record.region, 110),
    },
    {
      title: '默认',
      dataIndex: 'defaultArea',
      width: 90,
      hideInSearch: true,
      customRender: ({ record }) => {
        const isDefault = Number(record.defaultArea) === 1;
        return <Tag color={isDefault ? 'green' : 'default'}>{isDefault ? '默认' : '普通'}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      formItemProps: {
        component: 'Select',
        componentProps: {
          options: statusOptions,
          allowClear: true,
        },
      },
      customRender: ({ record }) => {
        const enabled = Number(record.status) === 1;
        return <Tag color={enabled ? 'green' : 'red'}>{enabled ? '启用' : '停用'}</Tag>;
      },
    },
    {
      title: '排序',
      dataIndex: 'sortNo',
      width: 90,
      hideInSearch: true,
    },
    {
      title: '操作',
      width: 90,
      dataIndex: 'ACTION',
      hideInSearch: true,
      fixed: 'right',
      actions: ({ record }) => [
        {
          label: '编辑',
          auth: {
            perm: 'system:tenant:area:update',
            effect: 'disable',
          },
          onClick: () => openAreaModal(record),
        },
      ],
    },
  ];

  onMounted(async () => {
    await loadTenants();
    dynamicTableInstance?.reload();
  });
</script>
