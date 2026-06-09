<template>
  <div class="vpet-page vpet-stack">
    <a-page-header
      @back="router.back()"
      :title="customer.name || t('page.customer.detailTitle')"
      :subtitle="customer.phone || '-'"
    >
      <template #extra>
        <a-space>
          <a-button @click="router.push({ path: '/vpet/chronic', query: { customerId: customer.id } })">
            {{ t('page.chronic.title') }}
          </a-button>
          <a-tag color="blue">{{ pets.length }} {{ t('page.customer.petCountUnit') }}</a-tag>
          <a-tag color="green">{{ visits.length }} {{ t('page.customer.visitCountUnit') }}</a-tag>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="vpet-grid-row">
      <a-col :span="8">
        <a-card class="vpet-detail-card" :title="t('page.customer.customerInfo')">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="t('page.customer.fields.name')">{{ customer.name || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.customer.fields.phone')">{{ customer.phone || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.customer.fields.address')">{{ customer.address || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.customer.fields.registeredAt')">
              {{ customer.createdAt ? customer.createdAt.slice(0, 10) : '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.customer.fields.remark')">{{ customer.remark || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <a-col :span="16">
        <a-card class="vpet-detail-card" :title="t('page.customer.pets')">
          <template #extra>
            <a-button type="primary" size="small" @click="openAddPet">{{ t('page.customer.addPet') }}</a-button>
          </template>
          <a-table :data-source="pets" :columns="petColumns" row-key="id" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'gender'">
                <a-tag :color="record.gender === 1 ? 'blue' : 'pink'">{{ genderText(record.gender) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'weight'">
                {{ formatWeight(record.weight) }}
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button size="small" @click="router.push(`/vpet/pet/${record.id}`)">{{ t('common.detail') }}</a-button>
                  <a-button size="small" @click="showPetVisits(record)">{{ t('common.visitHistory') }}</a-button>
                  <a-button size="small" @click="openEditPet(record)">{{ t('common.edit') }}</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
          <a-empty v-if="pets.length === 0" :description="t('page.customer.emptyPets')" />
        </a-card>
      </a-col>
    </a-row>

    <a-card class="vpet-detail-card" :title="t('page.customer.visitHistory')">
      <template #extra>
        <a-space>
          <a-select
            v-model:value="selectedPetId"
            allow-clear
            style="width: 220px"
            :placeholder="t('page.customer.filterByPet')"
            :options="petFilterOptions"
            @change="loadVisits"
          />
          <a-button
            @click="
              selectedPetId = undefined;
              loadVisits();
            "
          >
            {{ t('common.clear') }}
          </a-button>
        </a-space>
      </template>
      <a-table :data-source="visits" :columns="visitColumns" row-key="id" size="small" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'pet'">
            {{ petLabel(record.pet, record.petSnapshot, record.petId) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="visitStatusColor(record.status)">{{ visitStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'diagnosis'">
            {{ diagnosisText(record) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="router.push(`/vpet/consultation/visit/${record.id}`)">
              {{ t('common.viewMedicalRecord') }}
            </a-button>
          </template>
        </template>
      </a-table>
      <a-empty v-if="visits.length === 0" :description="t('page.customer.emptyVisits')" />
    </a-card>

    <a-modal v-model:open="showPetForm" :title="formTitle" width="760px" destroy-on-close @ok="handlePetSubmit">
      <VPetPetForm v-model:model-value="petForm" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { vpetCustomerGet, vpetPetCreate, vpetPetList, vpetPetUpdate, vpetVisitList } from '@/api/backend/vpet';
import VPetPetForm from '@/views/vpet/components/VPetPetForm.vue';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetCustomerDetail' });

const { t, genderText, speciesText, visitStatusColor, visitStatusText, formatWeight } = useVpetLocale();
const { petLabel } = useVpetReference();
const route = useRoute();
const router = useRouter();

const customer = ref<any>({});
const pets = ref<any[]>([]);
const visits = ref<any[]>([]);
const selectedPetId = ref<number | undefined>();
const showPetForm = ref(false);
const isAdd = ref(true);
const editId = ref<number | null>(null);
const petForm = ref<any>({});

const formTitle = computed(() => (isAdd.value ? t('page.pet.add') : t('page.pet.edit')));
const petFilterOptions = computed(() =>
  pets.value.map(item => ({
    value: item.id,
    label: [item.name, speciesText(item.species), item.breed].filter(Boolean).join(' / '),
  })),
);

const petColumns = [
  { title: t('page.pet.fields.name'), dataIndex: 'name', key: 'name' },
  { title: t('page.pet.fields.breed'), dataIndex: 'breed', key: 'breed' },
  { title: t('page.pet.fields.gender'), key: 'gender', width: 90 },
  { title: t('page.pet.fields.weight'), key: 'weight', width: 100 },
  { title: t('common.action'), key: 'action', width: 220 },
];

const visitColumns = [
  { title: t('page.consultation.fields.visitNo'), dataIndex: 'visitNo', width: 160 },
  { title: t('page.appointment.fields.pet'), key: 'pet', width: 140 },
  { title: t('page.consultation.fields.chiefComplaint'), dataIndex: 'chiefComplaint', ellipsis: true },
  { title: t('page.consultation.fields.diagnosis'), key: 'diagnosis', ellipsis: true },
  { title: t('page.consultation.fields.visitStatus'), key: 'status', width: 110 },
  {
    title: t('page.consultation.fields.endTime'),
    dataIndex: 'endTime',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  { title: t('common.action'), key: 'action', width: 120 },
];

function createEmptyPetForm() {
  return {
    name: '',
    species: 'dog',
    gender: 1,
    breed: undefined,
    birthdayPicker: null,
    color: '',
    weight: null,
    neutered: 0,
    microchipId: '',
    allergy: '',
    behaviorTag: '',
    livingEnvironment: undefined,
    otherPetsCount: undefined,
    dietBrand: '',
    recentTravel: '',
    reproductiveStatus: undefined,
    medicalHistory: '',
  };
}

function diagnosisText(record: any) {
  let items = Array.isArray(record.diagnoses) ? record.diagnoses : record.diagnosis;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  items = Array.isArray(items) ? items : [];
  return items.map((item: any) => item.name || item.code).filter(Boolean).join(' / ') || '-';
}

function openAddPet() {
  isAdd.value = true;
  editId.value = null;
  petForm.value = createEmptyPetForm();
  showPetForm.value = true;
}

function openEditPet(record: any) {
  isAdd.value = false;
  editId.value = record.id;
  petForm.value = {
    ...createEmptyPetForm(),
    ...record,
    birthdayPicker: record.birthday ? dayjs(record.birthday) : null,
  };
  showPetForm.value = true;
}

function showPetVisits(record: any) {
  selectedPetId.value = record.id;
  loadVisits();
}

async function loadVisits() {
  const customerId = Number(route.params.id);
  const data: any = await vpetVisitList({
    customerId,
    petId: selectedPetId.value,
    page: 1,
    pageSize: 50,
  });
  visits.value = data?.items || [];
}

async function handlePetSubmit() {
  const body: any = {
    ...petForm.value,
    customerId: Number(route.params.id),
  };
  delete body.birthdayPicker;
  if (petForm.value.birthdayPicker) {
    body.birthday = petForm.value.birthdayPicker.format('YYYY-MM-DD');
  }

  if (isAdd.value) {
    await vpetPetCreate(body);
    message.success(t('page.customer.messages.petCreated'));
  } else if (editId.value) {
    await vpetPetUpdate(editId.value, body);
    message.success(t('page.customer.messages.petUpdated'));
  }

  showPetForm.value = false;
  await Promise.all([loadPets(), loadVisits()]);
}

async function loadPets() {
  const customerId = Number(route.params.id);
  const data: any = await vpetPetList({ customerId, page: 1, pageSize: 50 });
  pets.value = data?.items || [];
}

onMounted(async () => {
  const customerId = Number(route.params.id);
  petForm.value = createEmptyPetForm();
  customer.value = await vpetCustomerGet(customerId) as any;
  await Promise.all([loadPets(), loadVisits()]);
});
</script>
