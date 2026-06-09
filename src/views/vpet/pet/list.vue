<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.pet.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.pet.fields.name')" class="vpet-query-item-wide">
          <a-input v-model:value="filters.name" :placeholder="`${t('common.inputText')}${t('page.pet.fields.name')}`" @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.pet.fields.species')">
          <a-select
            v-model:value="filters.species"
            allow-clear
            :options="speciesOptions"
            :placeholder="`${t('common.chooseText')}${t('page.pet.fields.species')}`"
          />
        </a-form-item>
        <a-form-item :label="t('page.pet.fields.breed')" class="vpet-query-item-wide">
          <a-input v-model:value="filters.breed" :placeholder="`${t('common.inputText')}${t('page.pet.fields.breed')}`" @pressEnter="reloadTable" />
        </a-form-item>
        <a-form-item :label="t('page.appointment.fields.customer')" class="vpet-query-item-wide">
          <a-select
            v-model:value="filters.customerId"
            allow-clear
            show-search
            :filter-option="filterByLabel"
            :get-popup-container="getPopupContainer"
            :options="customerOptions"
            :placeholder="`${t('common.chooseText')}${t('page.appointment.fields.customer')}`"
          />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openModal()">
              <Icon icon="ant-design:plus-outlined" /> {{ t('page.pet.add') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <DynamicTable
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.pet.title')"
      show-index
      :search="false"
      :data-request="loadTableData"
      :columns="columns"
    />

    <a-modal
      v-model:open="modalVisible"
      :title="editingRecord?.id ? t('page.pet.edit') : t('page.pet.add')"
      :width="860"
      :mask-closable="false"
      :confirm-loading="saving"
      destroy-on-close
      @ok="submitForm"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.appointment.fields.customer')">
          <a-select
            v-model:value="form.customerId"
            show-search
            :filter-option="filterByLabel"
            :get-popup-container="getPopupContainer"
            :options="customerOptions"
            :placeholder="t('page.appointment.fields.customer')"
          />
        </a-form-item>
      </a-form>
      <VPetPetForm v-model="form" />
    </a-modal>
  </div>
</template>

<script setup lang="tsx">
import dayjs from 'dayjs';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useTable } from '@/components/core/dynamic-table';
import Icon from '@/components/basic/icon/Icon.vue';
import { createPetColumns } from './columns';
import VPetPetForm from '../components/VPetPetForm.vue';
import { vpetCustomerList, vpetPetCreate, vpetPetList, vpetPetUpdate } from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';
import { resolveVpetPopupContainer } from '../shared/popup';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetPet' });

type CustomerOption = {
  value: number;
  label: string;
};

const MASTER_DATA_PAGE_SIZE = 100;

const { t } = useVpetLocale();
const { filterByLabel, loadDictOptions } = useVpetReference();
const router = useRouter();
const [DynamicTable, dynamicTableInstance] = useTable();

const modalVisible = ref(false);
const saving = ref(false);
const editingRecord = ref<any>(null);
const customerOptions = ref<CustomerOption[]>([]);
const speciesOptions = ref<any[]>([]);
const form = ref<any>({});
const filters = ref({
  name: '',
  species: undefined as string | undefined,
  breed: '',
  customerId: undefined as number | undefined,
});

function getPopupContainer(triggerNode: HTMLElement) {
  return resolveVpetPopupContainer(triggerNode);
}

function createEmptyForm() {
  return {
    customerId: undefined,
    name: '',
    species: undefined,
    breed: '',
    gender: 1,
    neutered: 0,
    birthday: undefined,
    birthdayPicker: undefined,
    color: '',
    weight: undefined,
    microchipId: '',
    allergy: '',
    behaviorTag: '',
    livingEnvironment: undefined,
    otherPetsCount: undefined,
    reproductiveStatus: undefined,
    dietBrand: '',
    recentTravel: '',
    medicalHistory: '',
  };
}

async function loadCustomers() {
  try {
    const res: any = await vpetCustomerList({ page: 1, pageSize: MASTER_DATA_PAGE_SIZE });
    customerOptions.value = (res?.items || []).map((item: any) => ({
      value: item.id,
      label: [item.name, item.phone].filter(Boolean).join(' / '),
    }));
  } catch {
    customerOptions.value = [];
  }
}

const loadTableData = async (params: any) => {
  return vpetPetList({
    ...params,
    name: filters.value.name || undefined,
    species: filters.value.species || undefined,
    breed: filters.value.breed || undefined,
    customerId: filters.value.customerId || undefined,
  }) as any;
};

function reloadTable() {
  dynamicTableInstance?.reload();
}

function resetFilters() {
  filters.value = {
    name: '',
    species: undefined,
    breed: '',
    customerId: undefined,
  };
  reloadTable();
}

function openModal(record: any = null) {
  editingRecord.value = record;
  if (record?.id) {
    form.value = {
      ...createEmptyForm(),
      ...record,
      birthdayPicker: record.birthday ? dayjs(record.birthday) : undefined,
    };
  } else {
    form.value = createEmptyForm();
  }
  modalVisible.value = true;
}

async function submitForm() {
  if (!form.value.customerId) {
    message.error(t('page.pet.messages.selectCustomer'));
    return;
  }
  if (!form.value.name || !form.value.species || form.value.gender === undefined) {
    message.error(t('page.pet.messages.fillBasicInfo'));
    return;
  }

  const payload = {
    ...form.value,
    breed: form.value.breed || '',
    birthday: form.value.birthdayPicker?.format ? form.value.birthdayPicker.format('YYYY-MM-DD') : form.value.birthday,
  };
  delete payload.birthdayPicker;

  saving.value = true;
  try {
    if (editingRecord.value?.id) {
      await vpetPetUpdate(editingRecord.value.id, payload);
      message.success(t('page.pet.messages.updated'));
    } else {
      await vpetPetCreate(payload);
      message.success(t('page.pet.messages.created'));
    }
    modalVisible.value = false;
    dynamicTableInstance?.reload();
  } finally {
    saving.value = false;
  }
}

const columns = [
  ...createPetColumns(),
  {
    title: t('page.appointment.table.action'),
    width: 120,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:eye-outlined',
        tooltip: t('common.detail'),
        onClick: () => router.push('/vpet/pet/' + record.id),
      },
      {
        icon: 'ant-design:edit-outlined',
        tooltip: t('common.edit'),
        onClick: () => openModal(record),
      },
    ],
  },
];

onMounted(async () => {
  const [species] = await Promise.all([
    loadDictOptions('pet_species'),
    loadCustomers(),
  ]);
  speciesOptions.value = species;
});
</script>
