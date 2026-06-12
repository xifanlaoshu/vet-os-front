<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.visitHistory.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.visitHistory.fields.dateRange')" class="vpet-query-item-wide">
          <a-range-picker
            v-model:value="filters.dateRange"
            :placeholder="[t('page.visitHistory.placeholders.startDate'), t('page.visitHistory.placeholders.endDate')]"
            @change="reloadTable"
          />
        </a-form-item>
        <a-form-item :label="t('page.appointment.fields.customer')" class="vpet-query-item-wider">
          <a-select
            v-model:value="filters.customerId"
            allow-clear
            show-search
            :placeholder="t('page.appointment.placeholders.customer')"
            :options="customerOptions"
            :filter-option="false"
            @change="handleCustomerChange"
            @search="handleCustomerSearch"
          />
        </a-form-item>
        <a-form-item :label="t('page.appointment.fields.pet')" class="vpet-query-item-wide">
          <a-select
            v-model:value="filters.petId"
            allow-clear
            show-search
            :disabled="!filters.customerId"
            :placeholder="petPlaceholder"
            :options="petOptions"
            :filter-option="filterByLabel"
            @change="reloadTable"
          />
        </a-form-item>
        <a-form-item :label="t('page.consultation.fields.doctor')">
          <a-select
            v-model:value="filters.doctorId"
            allow-clear
            show-search
            :placeholder="t('page.appointment.placeholders.doctor')"
            :options="doctorOptions"
            :filter-option="filterByLabel"
            @change="reloadTable"
          />
        </a-form-item>
        <a-form-item :label="t('page.consultation.fields.visitStatus')">
          <a-select
            v-model:value="filters.status"
            allow-clear
            :placeholder="t('page.appointment.statusPlaceholder')"
            :options="visitStatusOptions"
            @change="reloadTable"
          />
        </a-form-item>
        <a-form-item :label="t('page.consultation.fields.keyword')" class="vpet-query-item-wide">
          <a-input
            v-model:value="filters.keyword"
            allow-clear
            :placeholder="t('page.visitHistory.placeholders.keyword')"
            @pressEnter="reloadTable"
          />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <VisitHistoryTable
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.visitHistory.list')"
      show-index
      :data-request="loadTableData"
      :columns="columns"
      :search="false"
    />
  </div>
</template>

<script setup lang="tsx">
import type { Dayjs } from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button, Space, Tag } from 'ant-design-vue';
import { useTable } from '@/components/core/dynamic-table';
import { vpetCustomerGet, vpetCustomerList, vpetPetGet, vpetPetList, vpetVisitList } from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { type SelectOption, useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetVisitHistory' });

type DateRange = [Dayjs, Dayjs] | null;

const route = useRoute();
const router = useRouter();
const [VisitHistoryTable, visitHistoryTableInstance] = useTable();
const { t, visitStatusColor, visitStatusOptions, visitStatusText } = useVpetLocale();
const {
  customerLabel,
  doctorLabel,
  filterByLabel,
  loadDoctors,
  petLabel,
} = useVpetReference();

const filters = ref({
  dateRange: null as DateRange,
  customerId: undefined as number | undefined,
  petId: undefined as number | undefined,
  doctorId: undefined as number | undefined,
  status: undefined as number | undefined,
  keyword: '',
});
const customerOptions = ref<SelectOption[]>([]);
const petOptions = ref<SelectOption[]>([]);
const doctorOptions = ref<SelectOption[]>([]);

const petPlaceholder = computed(() =>
  filters.value.customerId
    ? t('page.appointment.placeholders.pet')
    : t('page.appointment.placeholders.selectCustomerFirst'),
);

const columns = computed(() => [
  { title: t('page.consultation.fields.visitNo'), dataIndex: 'visitNo', width: 160 },
  {
    title: t('page.visitHistory.fields.visitDate'),
    dataIndex: 'createdAt',
    width: 170,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('page.appointment.fields.customer'),
    dataIndex: 'customerId',
    width: 180,
    customRender: ({ record }: any) => customerLabel(record.customer, record.customerSnapshot, record.customerId),
  },
  {
    title: t('page.appointment.fields.pet'),
    dataIndex: 'petId',
    width: 180,
    customRender: ({ record }: any) => petLabel(record.pet, record.petSnapshot, record.petId),
  },
  {
    title: t('page.consultation.fields.doctor'),
    dataIndex: 'doctorId',
    width: 180,
    customRender: ({ record }: any) => doctorLabel(record.doctor, record.doctorId, record.doctorName, doctorOptions.value),
  },
  { title: t('page.consultation.fields.chiefComplaint'), dataIndex: 'chiefComplaint', ellipsis: true },
  {
    title: t('page.consultation.fields.diagnosis'),
    dataIndex: 'diagnosis',
    ellipsis: true,
    customRender: ({ record }: any) => diagnosisText(record),
  },
  {
    title: t('page.consultation.fields.visitStatus'),
    dataIndex: 'status',
    width: 120,
    customRender: ({ record }: any) => <Tag color={visitStatusColor(record.status)}>{visitStatusText(record.status)}</Tag>,
  },
  {
    title: t('page.consultation.fields.endTime'),
    dataIndex: 'endTime',
    width: 170,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('common.action'),
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    width: 190,
    customRender: ({ record }: any) => (
      <Space>
        <Button type="link" size="small" onClick={() => router.push(`/vpet/consultation/visit/${record.id}`)}>
          {t('common.viewMedicalRecord')}
        </Button>
        <Button type="link" size="small" onClick={() => router.push(`/vpet/consultation/visit/${record.id}/print`)}>
          {t('page.consultation.print.printButton')}
        </Button>
      </Space>
    ),
  },
]);

function normalizeId(value: unknown) {
  const first = Array.isArray(value) ? value[0] : value;
  if (first === undefined || first === null || first === '') return undefined;
  const parsed = Number(first);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function buildCustomerOption(item: any): SelectOption {
  return {
    value: item.id,
    label: [item.name, item.phone].filter(Boolean).join(' / '),
    raw: item,
  };
}

function buildPetOption(item: any): SelectOption {
  return {
    value: item.id,
    label: petLabel(item, undefined, item.id),
    raw: item,
  };
}

function upsertOption(options: SelectOption[], option: SelectOption) {
  const next = options.filter(item => String(item.value) !== String(option.value));
  next.unshift(option);
  return next;
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

async function loadCustomers(keyword = '') {
  const data: any = await vpetCustomerList({
    page: 1,
    pageSize: 50,
    keyword: keyword || undefined,
  });
  const items = data?.items || [];
  customerOptions.value = items.map(buildCustomerOption);
}

async function ensureCustomerOption(customerId?: number) {
  if (!customerId || customerOptions.value.some(item => String(item.value) === String(customerId))) return;
  const customer: any = await vpetCustomerGet(customerId);
  customerOptions.value = upsertOption(customerOptions.value, buildCustomerOption(customer));
}

async function loadPets(customerId?: number, petId?: number) {
  if (!customerId) {
    petOptions.value = [];
    return;
  }
  const data: any = await vpetPetList({ customerId, page: 1, pageSize: 50 });
  petOptions.value = (data?.items || []).map(buildPetOption);
  if (petId && !petOptions.value.some(item => String(item.value) === String(petId))) {
    const pet: any = await vpetPetGet(petId);
    petOptions.value = upsertOption(petOptions.value, buildPetOption(pet));
  }
}

async function handleCustomerChange(value?: number) {
  filters.value.customerId = value;
  filters.value.petId = undefined;
  await loadPets(value);
  reloadTable();
}

let customerSearchTimer: ReturnType<typeof setTimeout> | undefined;
function handleCustomerSearch(keyword: string) {
  if (customerSearchTimer) clearTimeout(customerSearchTimer);
  customerSearchTimer = setTimeout(() => {
    void loadCustomers(keyword.trim());
  }, 250);
}

const loadTableData = async (params: any) => {
  const [startDate, endDate] = filters.value.dateRange || [];
  return vpetVisitList({
    ...params,
    customerId: filters.value.customerId,
    petId: filters.value.petId,
    doctorId: filters.value.doctorId,
    status: filters.value.status,
    keyword: filters.value.keyword?.trim() || undefined,
    dateFrom: startDate ? startDate.startOf('day').format('YYYY-MM-DD HH:mm:ss') : undefined,
    dateTo: endDate ? endDate.endOf('day').format('YYYY-MM-DD HH:mm:ss') : undefined,
  }) as any;
};

function reloadTable() {
  visitHistoryTableInstance?.reload();
}

async function resetFilters() {
  filters.value = {
    dateRange: null,
    customerId: undefined,
    petId: undefined,
    doctorId: undefined,
    status: undefined,
    keyword: '',
  };
  petOptions.value = [];
  await loadCustomers();
  reloadTable();
}

onMounted(async () => {
  let customerId = normalizeId(route.query.customerId);
  const petId = normalizeId(route.query.petId);
  if (!customerId && petId) {
    const pet: any = await vpetPetGet(petId);
    customerId = pet?.customerId;
  }
  filters.value.customerId = customerId;
  filters.value.petId = petId;
  filters.value.keyword = String(route.query.keyword || '');

  await Promise.all([
    loadCustomers(),
    loadDoctors().then(options => {
      doctorOptions.value = options;
    }),
  ]);
  await ensureCustomerOption(customerId);
  await loadPets(customerId, petId);
  reloadTable();
});
</script>
