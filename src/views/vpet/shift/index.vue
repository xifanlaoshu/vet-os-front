<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" title="班次管理" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item label="班次名称">
          <a-input v-model:value="filters.keyword" allow-clear placeholder="请输入班次编码/名称" @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item label="启用状态" class="vpet-query-item-narrow">
          <a-select v-model:value="filters.status" allow-clear :options="doctorStatusOptions" placeholder="请选择状态" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">查询</a-button>
            <a-button @click="resetFilters">重置</a-button>
            <a-button type="primary" @click="openModal()">
              <Icon icon="ant-design:plus-outlined" />
              新增班次
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <DynamicTable
      class="vpet-panel-card vpet-list-card"
      header-title="班次主数据"
      show-index
      :search="false"
      :data-request="loadTableData"
      :columns="columns"
    />

    <a-modal
      v-model:open="modalVisible"
      :title="editingRecord?.id ? '编辑班次' : '新增班次'"
      :width="680"
      :confirm-loading="saving"
      :mask-closable="false"
      destroy-on-close
      @ok="submitForm"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="班次编码" required>
              <a-input v-model:value="form.code" placeholder="如 DAY" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="班次名称" required>
              <a-input v-model:value="form.name" placeholder="如 白班" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开始时间" required>
              <a-time-picker v-model:value="form.startTime" value-format="HH:mm:ss" format="HH:mm" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束时间" required>
              <a-time-picker v-model:value="form.endTime" value-format="HH:mm:ss" format="HH:mm" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="排班颜色">
              <a-input v-model:value="form.color" type="color" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="启用状态">
              <a-select v-model:value="form.status" :options="doctorStatusOptions" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="tsx">
import { Tag, message } from 'ant-design-vue';
import { onMounted, ref } from 'vue';
import { useTable } from '@/components/core/dynamic-table';
import Icon from '@/components/basic/icon/Icon.vue';
import { vpetShiftCreate, vpetShiftDelete, vpetShiftList, vpetShiftUpdate } from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';

defineOptions({ name: 'VPetShift' });

const { doctorStatusOptions, doctorStatusText } = useVpetLocale();
const [DynamicTable, dynamicTableInstance] = useTable();
const modalVisible = ref(false);
const saving = ref(false);
const editingRecord = ref<any>(null);
const filters = ref({ keyword: '', status: undefined as number | undefined });
const form = ref<any>({});

function createEmptyForm() {
  return {
    code: '',
    name: '',
    startTime: '09:00:00',
    endTime: '18:00:00',
    color: '#1677ff',
    status: 1,
    remark: '',
  };
}

const loadTableData = async (params: any) => {
  const res: any = await vpetShiftList({
    ...params,
    keyword: filters.value.keyword || undefined,
    status: filters.value.status,
  });
  return res || { items: [], meta: {} };
};

function reloadTable() {
  dynamicTableInstance?.reload();
}

function resetFilters() {
  filters.value = { keyword: '', status: undefined };
  reloadTable();
}

function openModal(record: any = null) {
  editingRecord.value = record;
  form.value = record?.id ? { ...createEmptyForm(), ...record } : createEmptyForm();
  modalVisible.value = true;
}

async function submitForm() {
  if (!form.value.code || !form.value.name || !form.value.startTime || !form.value.endTime) {
    message.error('请完整填写班次编码、名称和工作时间段');
    return;
  }
  saving.value = true;
  try {
    if (editingRecord.value?.id) {
      await vpetShiftUpdate(editingRecord.value.id, form.value);
      message.success('班次已更新');
    } else {
      await vpetShiftCreate(form.value);
      message.success('班次已创建');
    }
    modalVisible.value = false;
    reloadTable();
  } finally {
    saving.value = false;
  }
}

async function removeShift(record: any) {
  await vpetShiftDelete(record.id);
  message.success('班次已删除');
  reloadTable();
}

const columns = [
  { title: '班次编码', dataIndex: 'code', width: 110 },
  { title: '班次名称', dataIndex: 'name', width: 140 },
  {
    title: '工作时间段',
    dataIndex: 'timeRange',
    width: 180,
    customRender: ({ record }: any) => `${(record.startTime || '').slice(0, 5)} - ${(record.endTime || '').slice(0, 5)}`,
  },
  {
    title: '排班颜色',
    dataIndex: 'color',
    width: 120,
    customRender: ({ text }: any) => (
      <span class="shift-color-cell">
        <span class="shift-color-dot" style={{ background: text || '#1677ff' }} />
        {text || '-'}
      </span>
    ),
  },
  {
    title: '启用状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }: any) => <Tag color={Number(text) === 1 ? 'green' : 'default'}>{doctorStatusText(text)}</Tag>,
  },
  { title: '备注', dataIndex: 'remark', width: 180, customRender: ({ text }: any) => text || '-' },
  { title: '创建时间', dataIndex: 'createdAt', width: 180, customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-') },
  {
    title: '操作',
    dataIndex: 'ACTION',
    width: 110,
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      { icon: 'ant-design:edit-outlined' as const, tooltip: '编辑', onClick: () => openModal(record) },
      { icon: 'ant-design:delete-outlined' as const, color: 'red' as const, tooltip: '删除', onClick: () => removeShift(record) },
    ],
  },
];

onMounted(() => {
  form.value = createEmptyForm();
  reloadTable();
});
</script>

<style scoped lang="less">
.shift-color-cell {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.shift-color-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 8%);
}
</style>
