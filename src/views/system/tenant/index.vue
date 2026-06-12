<template>
  <DynamicTable
    row-key="id"
    header-title="租户管理"
    title-tooltip="租户是医院主体和最高数据隔离边界，停用前请确认没有正在进行的业务。"
    :data-request="loadTableData"
    :columns="columns"
    :scroll="{ x: 1200 }"
    bordered
    size="small"
  >
    <template #toolbar>
      <a-button
        type="primary"
        :disabled="!$auth('system:tenant:create')"
        @click="openTenantModal({})"
      >
        新增
      </a-button>
    </template>
  </DynamicTable>
</template>

<script lang="tsx" setup>
  import { Tag, Typography } from 'ant-design-vue';
  import type { FormSchema } from '@/components/core/schema-form';
  import type { TableColumn } from '@/components/core/dynamic-table';
  import { useTable } from '@/components/core/dynamic-table';
  import { useFormModal } from '@/hooks/useModal/';
  import Api from '@/api/';

  defineOptions({ name: 'SystemTenant' });

  type TenantRecord = Recordable & {
    id?: number;
    code?: string;
    name?: string;
    shortName?: string;
    contactName?: string;
    contactPhone?: string;
    region?: string;
    address?: string;
    edition?: string;
    status?: number;
    remark?: string;
  };
  type TableColumnItem = TableColumn<TenantRecord>;

  const statusOptions = [
    { value: 1, label: '启用' },
    { value: 0, label: '停用' },
  ];

  const [DynamicTable, dynamicTableInstance] = useTable({
    formProps: {
      autoSubmitOnEnter: true,
    },
  });
  const [showModal] = useFormModal();

  const textCell = (value?: string, maxWidth = 180) => (
    <Typography.Text
      style={{ maxWidth: `${maxWidth}px` }}
      ellipsis={{ tooltip: value || '-' }}
    >
      {value || '-'}
    </Typography.Text>
  );

  const loadTableData = async (params: Recordable) => {
    return Api.systemTenant.tenantList({
      ...params,
      page: params.page,
      pageSize: params.pageSize || params.limit,
    });
  };

  const modalSchemas: FormSchema<TenantRecord>[] = [
    { field: 'code', label: '租户编码', component: 'Input', required: true, colProps: { span: 8 } },
    { field: 'name', label: '租户名称', component: 'Input', required: true, colProps: { span: 8 } },
    { field: 'shortName', label: '简称', component: 'Input', colProps: { span: 8 } },
    { field: 'contactName', label: '联系人', component: 'Input', colProps: { span: 8 } },
    { field: 'contactPhone', label: '联系电话', component: 'Input', colProps: { span: 8 } },
    { field: 'edition', label: '版本', component: 'Input', colProps: { span: 8 } },
    { field: 'region', label: '地区', component: 'Input', colProps: { span: 8 } },
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

  const openTenantModal = async (record: Partial<TenantRecord>) => {
    const isUpdate = Boolean(record.id);
    const [formRef] = await showModal({
      modalProps: {
        title: `${isUpdate ? '编辑' : '新增'}租户`,
        width: 820,
        onFinish: async (values) => {
          if (isUpdate) {
            await Api.systemTenant.tenantUpdate(record.id!, values);
          } else {
            await Api.systemTenant.tenantCreate(values);
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
      status: 1,
      ...record,
    });
  };

  const columns: TableColumnItem[] = [
    {
      title: '租户名称',
      dataIndex: 'name',
      width: 190,
      formItemProps: {
        label: '关键字',
        componentProps: {
          placeholder: '编码 / 名称 / 电话',
          allowClear: true,
        },
      },
      searchField: 'keyword',
      customRender: ({ record }) => textCell(record.name, 170),
    },
    {
      title: '租户编码',
      dataIndex: 'code',
      width: 150,
      hideInSearch: true,
      customRender: ({ record }) => textCell(record.code, 130),
    },
    {
      title: '简称',
      dataIndex: 'shortName',
      width: 140,
      hideInSearch: true,
      customRender: ({ record }) => textCell(record.shortName, 120),
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      width: 120,
      hideInSearch: true,
      customRender: ({ record }) => textCell(record.contactName, 100),
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
      title: '版本',
      dataIndex: 'edition',
      width: 110,
      hideInSearch: true,
      customRender: ({ record }) => textCell(record.edition, 90),
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
      title: '操作',
      width: 90,
      dataIndex: 'ACTION',
      hideInSearch: true,
      fixed: 'right',
      actions: ({ record }) => [
        {
          label: '编辑',
          auth: {
            perm: 'system:tenant:update',
            effect: 'disable',
          },
          onClick: () => openTenantModal(record),
        },
      ],
    },
  ];
</script>
