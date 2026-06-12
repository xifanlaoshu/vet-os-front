<template>
  <DynamicTable
    row-key="id"
    header-title="租户用户管理"
    title-tooltip="管理当前租户内可登录账号、角色和可访问院区；不会修改该用户在其他租户的授权。"
    :data-request="loadTableData"
    :columns="columns"
    :scroll="{ x: 1450 }"
    bordered
    size="small"
  >
    <template #toolbar>
      <a-button type="primary" :disabled="!$auth('tenant:user:create')" @click="openUserModal({})">
        新增
      </a-button>
    </template>
  </DynamicTable>
</template>

<script lang="tsx" setup>
  import { onMounted, ref } from 'vue';
  import { Modal, Space, Tag, Typography } from 'ant-design-vue';
  import type { FormSchema } from '@/components/core/schema-form';
  import type { TableColumn } from '@/components/core/dynamic-table';
  import { useTable } from '@/components/core/dynamic-table';
  import { useFormModal } from '@/hooks/useModal/';
  import Api from '@/api/';

  defineOptions({ name: 'TenantUserManagement' });

  type TenantUserRecord = Recordable & {
    id?: number;
    username?: string;
    nickname?: string;
    email?: string;
    phone?: string;
    remark?: string;
    status?: number;
    roles?: Array<{ id: number; name: string }>;
    tenantAreas?: Array<{ areaId: number; areaName: string; defaultArea: number }>;
  };
  type TableColumnItem = TableColumn<TenantUserRecord>;

  const statusOptions = [
    { value: 1, label: '启用' },
    { value: 0, label: '禁用' },
  ];
  const roleOptions = ref<Array<{ label: string; value: number }>>([]);
  const areaOptions = ref<Array<{ label: string; value: number }>>([]);

  const [DynamicTable, dynamicTableInstance] = useTable({
    formProps: { autoSubmitOnEnter: true },
  });
  const [showModal] = useFormModal();

  const textCell = (value?: string, maxWidth = 160) => (
    <Typography.Text style={{ maxWidth: `${maxWidth}px` }} ellipsis={{ tooltip: value || '-' }}>
      {value || '-'}
    </Typography.Text>
  );

  async function loadOptions() {
    const [roles, areas] = await Promise.all([
      Api.tenantAdmin.roleOptions(),
      Api.tenantAdmin.areaOptions(),
    ]);
    roleOptions.value = (roles || []).map((item: any) => ({ label: item.name, value: item.id }));
    areaOptions.value = (areas || []).map((item: any) => ({ label: item.name, value: item.id }));
  }

  const loadTableData = async (params: Recordable) => {
    return Api.tenantAdmin.userList({
      ...params,
      page: params.page,
      pageSize: params.pageSize || params.limit,
    });
  };

  const modalSchemas: FormSchema<TenantUserRecord>[] = [
    { field: 'username', label: '登录账号', component: 'Input', required: true, colProps: { span: 12 } },
    {
      field: 'password',
      label: '登录密码',
      component: 'InputPassword',
      colProps: { span: 12 },
      componentProps: { placeholder: '编辑时留空表示不修改' },
    },
    { field: 'nickname', label: '用户昵称', component: 'Input', colProps: { span: 12 } },
    { field: 'phone', label: '手机号', component: 'Input', colProps: { span: 12 } },
    { field: 'email', label: '邮箱', component: 'Input', colProps: { span: 12 } },
    {
      field: 'status',
      label: '状态',
      component: 'Select',
      defaultValue: 1,
      required: true,
      colProps: { span: 12 },
      componentProps: { options: statusOptions },
    },
    {
      field: 'roleIds',
      label: '角色',
      component: 'Select',
      required: true,
      colProps: { span: 24 },
      componentProps: () => ({
        mode: 'multiple',
        options: roleOptions.value,
        placeholder: '请选择租户内可分配角色',
      }),
    },
    {
      field: 'areaIds',
      label: '可访问院区',
      component: 'Select',
      required: true,
      colProps: { span: 24 },
      componentProps: () => ({
        mode: 'multiple',
        options: areaOptions.value,
        placeholder: '请选择可访问院区',
      }),
    },
    {
      field: 'defaultAreaId',
      label: '默认院区',
      component: 'Select',
      colProps: { span: 24 },
      componentProps: () => ({
        options: areaOptions.value,
        placeholder: '不选择时默认使用第一个可访问院区',
      }),
    },
    { field: 'remark', label: '备注', component: 'InputTextArea', colProps: { span: 24 }, componentProps: { rows: 3 } },
  ];

  const openUserModal = async (record: Partial<TenantUserRecord>) => {
    await loadOptions();
    if (!areaOptions.value.length) {
      Modal.warning({ title: '提示', content: '当前租户没有启用的院区，请先维护租户院区。' });
      return;
    }
    if (!roleOptions.value.length) {
      Modal.warning({ title: '提示', content: '当前没有可分配角色，请联系系统管理员维护角色。' });
      return;
    }

    const isUpdate = Boolean(record.id);
    const detail = isUpdate ? await Api.tenantAdmin.userRead(record.id) : record;
    const tenantAreas = detail.tenantAreas || [];
    const [formRef] = await showModal({
      modalProps: {
        title: `${isUpdate ? '编辑' : '新增'}租户用户`,
        width: 780,
        onFinish: async (values) => {
          const payload = {
            ...values,
            status: Number(values.status ?? 1),
            roleIds: (values.roleIds || []).map(Number),
            areaIds: (values.areaIds || []).map(Number),
            defaultAreaId: values.defaultAreaId ? Number(values.defaultAreaId) : undefined,
          };
          if (!payload.defaultAreaId && payload.areaIds.length) {
            payload.defaultAreaId = payload.areaIds[0];
          }
          if (!payload.password) {
            delete payload.password;
          }
          if (isUpdate) {
            await Api.tenantAdmin.userUpdate(record.id!, payload);
          } else {
            await Api.tenantAdmin.userCreate(payload);
          }
          dynamicTableInstance?.reload();
        },
      },
      formProps: {
        labelWidth: 100,
        schemas: modalSchemas,
        rowProps: { gutter: 15 },
        autoSubmitOnEnter: true,
      },
    });

    formRef?.setFieldsValue({
      status: 1,
      ...detail,
      roleIds: (detail.roles || []).map((item: any) => item.id),
      areaIds: tenantAreas.map((item: any) => item.areaId),
      defaultAreaId: tenantAreas.find((item: any) => Number(item.defaultArea) === 1)?.areaId || tenantAreas[0]?.areaId,
    });
    formRef?.updateSchema([
      { field: 'username', componentProps: { disabled: isUpdate } },
      { field: 'password', required: !isUpdate, defaultValue: isUpdate ? undefined : 'a123456' },
    ]);
  };

  const columns: TableColumnItem[] = [
    {
      title: '登录账号',
      dataIndex: 'username',
      width: 140,
      customRender: ({ record }) => textCell(record.username, 120),
    },
    {
      title: '用户昵称',
      dataIndex: 'nickname',
      width: 140,
      customRender: ({ record }) => textCell(record.nickname, 120),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      customRender: ({ record }) => textCell(record.phone, 110),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      width: 220,
      hideInSearch: true,
      customRender: ({ record }) => (
        <Space wrap>
          {(record.roles || []).map(role => <Tag color="green" key={role.id}>{role.name}</Tag>)}
        </Space>
      ),
    },
    {
      title: '可访问院区',
      dataIndex: 'tenantAreas',
      width: 300,
      hideInSearch: true,
      customRender: ({ record }) => (
        <Space wrap>
          {(record.tenantAreas || []).map(area => (
            <Tag color={Number(area.defaultArea) === 1 ? 'blue' : 'default'} key={area.areaId}>
              {area.areaName}{Number(area.defaultArea) === 1 ? ' / 默认' : ''}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 170,
      customRender: ({ record }) => textCell(record.email, 150),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      formItemProps: {
        component: 'Select',
        componentProps: { options: statusOptions, allowClear: true },
      },
      customRender: ({ record }) => {
        const enabled = Number(record.status) === 1;
        return <Tag color={enabled ? 'green' : 'red'}>{enabled ? '启用' : '禁用'}</Tag>;
      },
    },
    {
      title: '操作',
      width: 90,
      dataIndex: 'ACTION',
      fixed: 'right',
      hideInSearch: true,
      actions: ({ record }) => [
        {
          label: '编辑',
          auth: { perm: 'tenant:user:update', effect: 'disable' },
          onClick: () => openUserModal(record),
        },
      ],
    },
  ];

  onMounted(loadOptions);
</script>
