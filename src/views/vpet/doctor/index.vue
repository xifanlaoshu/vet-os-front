<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.doctor.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.doctor.fields.name')">
          <a-input v-model:value="filters.name" :placeholder="`${t('common.inputText')}${t('page.doctor.fields.name')}`" @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.doctor.fields.phone')">
          <a-input v-model:value="filters.phone" :placeholder="`${t('common.inputText')}${t('page.doctor.fields.phone')}`" @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.doctor.fields.department')">
          <a-select
            v-model:value="filters.department"
            allow-clear
            show-search
            :filter-option="filterByLabel"
            :options="departmentOptions"
            :placeholder="`${t('common.chooseText')}${t('page.doctor.fields.department')}`"
          />
        </a-form-item>
        <a-form-item :label="t('page.doctor.fields.position')">
          <a-select
            v-model:value="filters.position"
            allow-clear
            show-search
            :filter-option="filterByLabel"
            :options="positionOptions"
            :placeholder="`${t('common.chooseText')}${t('page.doctor.fields.position')}`"
          />
        </a-form-item>
        <a-form-item :label="t('page.doctor.fields.status')" class="vpet-query-item-narrow">
          <a-select
            v-model:value="filters.status"
            allow-clear
            :options="doctorStatusOptions"
            :placeholder="`${t('common.chooseText')}${t('page.doctor.fields.status')}`"
          />
        </a-form-item>
        <a-form-item :label="t('page.doctor.fields.bookable')" class="vpet-query-item-narrow">
          <a-select
            v-model:value="filters.bookable"
            allow-clear
            :options="bookableOptions"
            :placeholder="`${t('common.chooseText')}${t('page.doctor.fields.bookable')}`"
          />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openModal()">
              <Icon icon="ant-design:plus-outlined" />
              {{ t('page.doctor.add') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <DynamicTable
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.doctor.title')"
      show-index
      :search="false"
      :data-request="loadTableData"
      :columns="columns"
    />

    <a-modal
      v-model:open="modalVisible"
      :title="editingRecord?.id ? t('page.doctor.edit') : t('page.doctor.add')"
      :width="720"
      :mask-closable="false"
      :confirm-loading="saving"
      destroy-on-close
      @ok="submitForm"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.doctor.fields.user')">
              <a-select
                v-model:value="form.userId"
                show-search
                allow-clear
                :filter-option="filterByLabel"
                :get-popup-container="getPopupContainer"
                :options="userOptions"
                :placeholder="t('page.doctor.placeholders.user')"
                @change="handleUserChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.doctor.fields.name')">
              <a-input v-model:value="form.name" :placeholder="t('page.doctor.placeholders.name')" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.doctor.fields.phone')">
              <a-input v-model:value="form.phone" :placeholder="t('page.doctor.fields.phone')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.doctor.fields.title')">
              <a-input v-model:value="form.title" :placeholder="t('page.doctor.placeholders.title')" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.doctor.fields.position')">
              <a-select
                v-model:value="form.position"
                show-search
                :filter-option="filterByLabel"
                :get-popup-container="getPopupContainer"
                :options="positionOptions"
                :placeholder="t('page.doctor.placeholders.position')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.doctor.fields.department')">
              <a-select
                v-model:value="form.department"
                allow-clear
                show-search
                :filter-option="filterByLabel"
                :get-popup-container="getPopupContainer"
                :options="departmentOptions"
                :placeholder="t('page.doctor.placeholders.department')"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.doctor.fields.status')">
              <a-select v-model:value="form.status" :options="doctorStatusOptions" :get-popup-container="getPopupContainer" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.doctor.fields.bookable')">
              <a-select v-model:value="form.bookable" :options="bookableOptions" :get-popup-container="getPopupContainer" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item :label="t('page.doctor.fields.introduction')">
          <a-textarea v-model:value="form.introduction" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="tsx">
import { Tag, message } from 'ant-design-vue';
import { computed, onMounted, ref } from 'vue';
import { useTable } from '@/components/core/dynamic-table';
import Icon from '@/components/basic/icon/Icon.vue';
import Api from '@/api/backend/api';
import { vpetDoctorCreate, vpetDoctorDelete, vpetDoctorList, vpetDoctorUpdate } from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { resolveVpetPopupContainer } from '../shared/popup';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetDoctor' });

type SelectOption = {
  value: number | string;
  label: string;
};

const { t, doctorStatusOptions, doctorStatusText } = useVpetLocale();
const { filterByLabel, loadDictOptions, optionLabel } = useVpetReference();
const [DynamicTable, dynamicTableInstance] = useTable();

const modalVisible = ref(false);
const saving = ref(false);
const editingRecord = ref<any>(null);
const userOptions = ref<SelectOption[]>([]);
const departmentOptions = ref<SelectOption[]>([]);
const positionOptions = ref<SelectOption[]>([]);
const users = ref<any[]>([]);
const form = ref<any>({});
const filters = ref({
  name: '',
  phone: '',
  department: undefined as string | undefined,
  position: undefined as string | undefined,
  status: undefined as number | undefined,
  bookable: undefined as number | undefined,
});

const defaultDoctorStatus = computed<number | undefined>(() => {
  const activeOption = doctorStatusOptions.value.find(item => Number(item.value) === 1);
  const candidate = activeOption?.value ?? doctorStatusOptions.value[0]?.value;
  return candidate === undefined ? undefined : Number(candidate);
});

const bookableOptions = computed(() => [
  { value: 1, label: t('page.doctor.bookable.yes') },
  { value: 0, label: t('page.doctor.bookable.no') },
]);

function getPopupContainer(triggerNode: HTMLElement) {
  return resolveVpetPopupContainer(triggerNode);
}

function createEmptyForm() {
  return {
    userId: undefined,
    name: '',
    phone: '',
    title: '',
    position: 'doctor',
    department: undefined,
    introduction: '',
    bookable: 1,
    status: defaultDoctorStatus.value,
  };
}

async function loadUsers() {
  try {
    const res = await Api.systemUser.userList({ page: 1, pageSize: 100 });
    users.value = res?.items || [];
    userOptions.value = users.value.map((item: any) => ({
      value: item.id,
      label: [item.nickname || item.username, item.phone].filter(Boolean).join(' / '),
    }));
  } catch {
    users.value = [];
    userOptions.value = [];
  }
}

async function loadDepartmentOptions() {
  departmentOptions.value = await loadDictOptions('vpet_doctor_department');
}

async function loadPositionOptions() {
  positionOptions.value = await loadDictOptions('vpet_staff_position');
}

const loadTableData = async (params: any) => {
  try {
    const res: any = await vpetDoctorList({
      ...params,
      name: filters.value.name || undefined,
      phone: filters.value.phone || undefined,
      department: filters.value.department || undefined,
      position: filters.value.position || undefined,
      status: filters.value.status,
      bookable: filters.value.bookable,
    });
    return res || { items: [], meta: {} };
  } catch {
    return { items: [], meta: {} };
  }
};

function reloadTable() {
  dynamicTableInstance?.reload();
}

function resetFilters() {
  filters.value = {
    name: '',
    phone: '',
    department: undefined,
    position: undefined,
    status: undefined,
    bookable: undefined,
  };
  reloadTable();
}

function openModal(record: any = null) {
  editingRecord.value = record;
  form.value = record?.id
    ? {
        ...createEmptyForm(),
        ...record,
        position: record.position || 'doctor',
        bookable: record.bookable ?? 1,
        status: record.status ?? defaultDoctorStatus.value,
      }
    : createEmptyForm();
  modalVisible.value = true;
}

function handleUserChange(userId?: number) {
  const user = users.value.find((item: any) => Number(item.id) === Number(userId));
  if (!user) return;
  if (!form.value.name) form.value.name = user.nickname || user.username;
  if (!form.value.phone) form.value.phone = user.phone || '';
  form.value.userId = userId;
}

function userNicknameText(record: any) {
  if (!record?.userId) return '-';
  const linkedUser = users.value.find((item: any) => Number(item.id) === Number(record.userId));
  return record.userNickname || linkedUser?.nickname || linkedUser?.username || t('common.unknown');
}

async function submitForm() {
  if (!form.value.name) {
    message.error(t('page.doctor.messages.nameRequired'));
    return;
  }
  if (!form.value.position) {
    message.error(t('page.doctor.messages.positionRequired'));
    return;
  }

  saving.value = true;
  try {
    const payload = { ...form.value };
    if (editingRecord.value?.id) {
      await vpetDoctorUpdate(editingRecord.value.id, payload);
      message.success(t('page.doctor.messages.updated'));
    } else {
      await vpetDoctorCreate(payload);
      message.success(t('page.doctor.messages.created'));
    }
    modalVisible.value = false;
    dynamicTableInstance?.reload();
  } finally {
    saving.value = false;
  }
}

async function removeDoctor(record: any) {
  await vpetDoctorDelete(record.id);
  message.success(t('page.doctor.messages.deleted'));
  dynamicTableInstance?.reload();
}

const columns = [
  { title: t('page.doctor.fields.name'), dataIndex: 'name', width: 120 },
  { title: t('page.doctor.fields.phone'), dataIndex: 'phone', width: 140, customRender: ({ text }: any) => text || '-' },
  { title: t('page.doctor.fields.title'), dataIndex: 'title', width: 120, customRender: ({ text }: any) => text || '-' },
  {
    title: t('page.doctor.fields.position'),
    dataIndex: 'position',
    width: 120,
    customRender: ({ text }: any) => optionLabel(positionOptions.value, text, text || '-'),
  },
  {
    title: t('page.doctor.fields.department'),
    dataIndex: 'department',
    width: 120,
    customRender: ({ text }: any) => optionLabel(departmentOptions.value, text, text || '-'),
  },
  {
    title: t('page.doctor.fields.userNickname'),
    dataIndex: 'userNickname',
    width: 140,
    customRender: ({ record }: any) => userNicknameText(record),
  },
  {
    title: t('page.doctor.fields.status'),
    dataIndex: 'status',
    width: 90,
    customRender: ({ record }: any) => (
      <Tag color={record.status === 1 ? 'green' : 'default'}>
        {doctorStatusText(record.status)}
      </Tag>
    ),
  },
  {
    title: t('page.doctor.fields.bookable'),
    dataIndex: 'bookable',
    width: 100,
    customRender: ({ record }: any) => (
      <Tag color={Number(record.bookable) === 1 ? 'blue' : 'default'}>
        {Number(record.bookable) === 1 ? t('page.doctor.bookable.yes') : t('page.doctor.bookable.no')}
      </Tag>
    ),
  },
  {
    title: t('common.createdAt'),
    dataIndex: 'createdAt',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('common.action'),
    width: 110,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:edit-outlined' as const,
        tooltip: t('common.edit'),
        onClick: () => openModal(record),
      },
      {
        icon: 'ant-design:delete-outlined' as const,
        color: 'red' as const,
        tooltip: t('common.delete'),
        onClick: () => removeDoctor(record),
      },
    ],
  },
];

onMounted(async () => {
  form.value = createEmptyForm();
  await Promise.all([loadUsers(), loadDepartmentOptions(), loadPositionOptions()]);
  reloadTable();
});
</script>
