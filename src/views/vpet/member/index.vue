<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.member.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.member.fields.customer')">
          <a-select
            v-model:value="filters.customerId"
            allow-clear
            show-search
            :filter-option="false"
            :options="customerOptions"
            :placeholder="t('page.member.placeholders.customer')"
            @search="handleCustomerSearch"
          />
        </a-form-item>
        <a-form-item :label="t('page.member.fields.keyword')">
          <a-input
            v-model:value="filters.keyword"
            :placeholder="t('page.member.placeholders.keyword')"
            @pressEnter="reloadTable"
          />
        </a-form-item>
        <a-form-item :label="t('page.member.fields.level')">
          <a-select
            v-model:value="filters.level"
            allow-clear
            :options="levelOptions"
            :placeholder="t('page.member.placeholders.level')"
          />
        </a-form-item>
        <a-form-item :label="t('page.member.fields.status')">
          <a-select
            v-model:value="filters.status"
            allow-clear
            :options="statusOptions"
            :placeholder="t('page.member.placeholders.status')"
          />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCardModal()">
              <Icon icon="ant-design:plus-outlined" />
              {{ t('page.member.openCard') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <DynamicTable
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.member.list')"
      show-index
      :search="false"
      :data-request="loadTableData"
      :columns="columns"
    />

    <a-modal
      v-model:open="cardModalVisible"
      :title="t('page.member.openCard')"
      :mask-closable="false"
      :confirm-loading="savingCard"
      destroy-on-close
      @ok="submitOpenCard"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.member.fields.customer')" required>
          <a-select
            v-model:value="cardForm.customerId"
            show-search
            :filter-option="false"
            :get-popup-container="getPopupContainer"
            :options="customerOptions"
            :placeholder="t('page.member.placeholders.customer')"
            @search="handleCustomerSearch"
          />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.member.fields.level')">
              <a-select
                v-model:value="cardForm.level"
                :get-popup-container="getPopupContainer"
                :options="levelOptions"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.member.fields.giftBalance')">
              <a-input-number v-model:value="cardForm.giftAmount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item :label="t('page.member.fields.initialBalance')">
          <a-input-number v-model:value="cardForm.initialBalance" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="amountModalVisible"
      :title="amountAction === 'recharge' ? t('page.member.recharge') : t('page.member.deduct')"
      :mask-closable="false"
      :confirm-loading="submittingAmount"
      destroy-on-close
      @ok="submitAmountAction"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.member.fields.cardNo')">
          <a-input :value="selectedCard?.cardNo || '-'" disabled />
        </a-form-item>
        <a-form-item :label="t('page.member.fields.customer')">
          <a-input :value="selectedCustomerText" disabled />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.member.fields.currentBalance')">
              <a-input :value="formatAmount(selectedCard?.balance)" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.member.fields.amount')" required>
              <a-input-number v-model:value="amountForm.amount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item :label="t('page.member.fields.remark')">
          <a-textarea v-model:value="amountForm.remark" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="logDrawerVisible"
      :title="t('page.member.logs')"
      width="720"
      destroy-on-close
    >
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item :label="t('page.member.fields.cardNo')">
          {{ logCard?.cardNo || '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.member.fields.customer')">
          {{ logCustomerText }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.member.fields.level')">
          {{ optionLabel(levelOptions, logCard?.level, '-') }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.member.fields.currentBalance')">
          {{ formatAmount(logCard?.balance) }}
        </a-descriptions-item>
      </a-descriptions>

      <a-table
        row-key="id"
        class="vpet-block-spaced"
        :data-source="logItems"
        :columns="logColumns"
        :pagination="logPagination"
        @change="handleLogTableChange"
      />
    </a-drawer>
  </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { message, Tag } from 'ant-design-vue';
import { useTable } from '@/components/core/dynamic-table';
import Icon from '@/components/basic/icon/Icon.vue';
import {
  vpetCustomerList,
  vpetMemberCardList,
  vpetMemberCardLogs,
  vpetMemberDeduct,
  vpetMemberOpenCard,
  vpetMemberRecharge,
} from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { resolveVpetPopupContainer } from '../shared/popup';
import { useVpetReference, type SelectOption } from '../shared/reference';

defineOptions({ name: 'VPetMember' });

type AmountAction = 'recharge' | 'deduct';

const { t } = useVpetLocale();
const { customerLabel, optionLabel, loadDictOptions } = useVpetReference();
const [DynamicTable, dynamicTableInstance] = useTable();

const filters = ref({
  customerId: undefined as number | undefined,
  keyword: '',
  level: undefined as number | undefined,
  status: undefined as number | undefined,
});
const customerOptions = ref<SelectOption[]>([]);
const levelOptions = ref<SelectOption[]>([]);
const statusOptions = ref<SelectOption[]>([]);
const logTypeOptions = ref<SelectOption[]>([]);
const logDirectionOptions = ref<SelectOption[]>([]);

const cardModalVisible = ref(false);
const savingCard = ref(false);
const amountModalVisible = ref(false);
const submittingAmount = ref(false);
const amountAction = ref<AmountAction>('recharge');
const selectedCard = ref<any>(null);

const logDrawerVisible = ref(false);
const logCard = ref<any>(null);
const logItems = ref<any[]>([]);
const logPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

const cardForm = ref({
  customerId: undefined as number | undefined,
  level: 1,
  initialBalance: 0,
  giftAmount: 0,
});

const amountForm = ref({
  amount: 0,
  remark: '',
});

const fallbackLevelOptions: SelectOption[] = [
  { value: 1, label: '普通会员' },
  { value: 2, label: '银卡会员' },
  { value: 3, label: '金卡会员' },
  { value: 4, label: '钻石会员' },
];

const fallbackStatusOptions: SelectOption[] = [
  { value: 1, label: '正常' },
  { value: 0, label: '停用' },
];

const fallbackLogTypeOptions: SelectOption[] = [
  { value: 1, label: '充值' },
  { value: 2, label: '退款' },
  { value: 3, label: '扣款' },
  { value: 4, label: '调账' },
];

const fallbackLogDirectionOptions: SelectOption[] = [
  { value: 1, label: '收入' },
  { value: 2, label: '支出' },
];

const selectedCustomerText = computed(() => {
  return customerLabel(selectedCard.value?.customer, undefined, selectedCard.value?.customerId);
});

const logCustomerText = computed(() => {
  return customerLabel(logCard.value?.customer, undefined, logCard.value?.customerId);
});

function getPopupContainer(triggerNode: HTMLElement) {
  return resolveVpetPopupContainer(triggerNode);
}

function formatAmount(value?: number | string | null) {
  return `${Number(value || 0).toFixed(2)} ${t('common.amountUnit')}`;
}

function resetFilters() {
  filters.value = {
    customerId: undefined,
    keyword: '',
    level: undefined,
    status: undefined,
  };
  reloadTable();
}

function reloadTable() {
  dynamicTableInstance?.reload();
}

function resetCardForm() {
  cardForm.value = {
    customerId: undefined,
    level: Number(levelOptions.value[0]?.value || fallbackLevelOptions[0].value),
    initialBalance: 0,
    giftAmount: 0,
  };
}

function resetAmountForm() {
  amountForm.value = {
    amount: 0,
    remark: '',
  };
}

async function searchCustomers(keyword = '') {
  const res: any = await vpetCustomerList({
    page: 1,
    pageSize: 20,
    keyword: keyword || undefined,
  });
  customerOptions.value = ((res?.items || []) as any[]).map(item => ({
    value: item.id,
    label: [item.name, item.phone].filter(Boolean).join(' / '),
    raw: item,
  }));
}

async function handleCustomerSearch(keyword: string) {
  await searchCustomers(keyword);
}

async function loadMemberOptions() {
  const [levels, statuses, logTypes, logDirections] = await Promise.all([
    loadDictOptions('vpet_member_card_level', 'number'),
    loadDictOptions('vpet_member_card_status', 'number'),
    loadDictOptions('vpet_member_card_log_type', 'number'),
    loadDictOptions('vpet_member_card_log_direction', 'number'),
  ]);
  levelOptions.value = levels.length ? levels : fallbackLevelOptions;
  statusOptions.value = statuses.length ? statuses : fallbackStatusOptions;
  logTypeOptions.value = logTypes.length ? logTypes : fallbackLogTypeOptions;
  logDirectionOptions.value = logDirections.length ? logDirections : fallbackLogDirectionOptions;
}

function openCardModal() {
  resetCardForm();
  cardModalVisible.value = true;
}

function openAmountModal(action: AmountAction, record: any) {
  amountAction.value = action;
  selectedCard.value = record;
  resetAmountForm();
  amountModalVisible.value = true;
}

async function submitOpenCard() {
  if (!cardForm.value.customerId) {
    message.error(t('page.member.messages.customerRequired'));
    return;
  }

  savingCard.value = true;
  try {
    await vpetMemberOpenCard({
      customerId: cardForm.value.customerId,
      level: Number(cardForm.value.level || 1),
      initialBalance: Number(cardForm.value.initialBalance || 0),
      giftAmount: Number(cardForm.value.giftAmount || 0),
    });
    message.success(t('page.member.messages.cardOpened'));
    cardModalVisible.value = false;
    reloadTable();
  } finally {
    savingCard.value = false;
  }
}

async function submitAmountAction() {
  if (!selectedCard.value?.id) return;
  if (Number(amountForm.value.amount || 0) <= 0) {
    message.error(t('page.member.messages.amountRequired'));
    return;
  }

  submittingAmount.value = true;
  try {
    const payload = {
      amount: Number(amountForm.value.amount || 0),
      remark: amountForm.value.remark || undefined,
    };
    if (amountAction.value === 'recharge') {
      await vpetMemberRecharge(selectedCard.value.id, payload);
      message.success(t('page.member.messages.recharged'));
    } else {
      await vpetMemberDeduct(selectedCard.value.id, payload);
      message.success(t('page.member.messages.deducted'));
    }
    amountModalVisible.value = false;
    reloadTable();
    if (logDrawerVisible.value && Number(logCard.value?.id) === Number(selectedCard.value.id)) {
      await loadCardLogs(selectedCard.value.id, logPagination.value.current, logPagination.value.pageSize);
    }
  } finally {
    submittingAmount.value = false;
  }
}

async function loadCardLogs(cardId: number, page = 1, pageSize = 10) {
  const res: any = await vpetMemberCardLogs(cardId, { page, pageSize });
  logCard.value = res?.card || null;
  logItems.value = res?.items || [];
  logPagination.value = {
    current: res?.meta?.currentPage || page,
    pageSize: res?.meta?.itemsPerPage || pageSize,
    total: res?.meta?.totalItems || 0,
  };
}

async function openLogDrawer(record: any) {
  logDrawerVisible.value = true;
  await loadCardLogs(record.id, 1, logPagination.value.pageSize);
}

async function handleLogTableChange(pagination: any) {
  if (!logCard.value?.id) return;
  await loadCardLogs(logCard.value.id, pagination.current, pagination.pageSize);
}

const loadTableData = async (params: any) => {
  return vpetMemberCardList({
    ...params,
    customerId: filters.value.customerId,
    keyword: filters.value.keyword || undefined,
    level: filters.value.level,
    status: filters.value.status,
  }) as any;
};

const columns = [
  {
    title: t('page.member.fields.cardNo'),
    dataIndex: 'cardNo',
    width: 170,
  },
  {
    title: t('page.member.fields.customer'),
    dataIndex: 'customerId',
    width: 220,
    customRender: ({ record }: any) => customerLabel(record.customer, undefined, record.customerId),
  },
  {
    title: t('page.member.fields.level'),
    dataIndex: 'level',
    width: 120,
    customRender: ({ text }: any) => optionLabel(levelOptions.value, text, '-'),
  },
  {
    title: t('page.member.fields.balance'),
    dataIndex: 'balance',
    width: 120,
    customRender: ({ text }: any) => formatAmount(text),
  },
  {
    title: t('page.member.fields.giftBalance'),
    dataIndex: 'giftBalance',
    width: 120,
    customRender: ({ text }: any) => formatAmount(text),
  },
  {
    title: t('page.member.fields.totalRecharge'),
    dataIndex: 'totalRecharge',
    width: 130,
    customRender: ({ text }: any) => formatAmount(text),
  },
  {
    title: t('page.member.fields.totalSpend'),
    dataIndex: 'totalSpend',
    width: 130,
    customRender: ({ text }: any) => formatAmount(text),
  },
  {
    title: t('page.member.fields.status'),
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }: any) => (
      <Tag color={Number(text) === 1 ? 'green' : 'default'}>
        {optionLabel(statusOptions.value, text, '-')}
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
    width: 150,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:plus-circle-outlined',
        tooltip: t('page.member.recharge'),
        onClick: () => openAmountModal('recharge', record),
      },
      {
        icon: 'ant-design:minus-circle-outlined',
        tooltip: t('page.member.deduct'),
        onClick: () => openAmountModal('deduct', record),
      },
      {
        icon: 'ant-design:unordered-list-outlined',
        tooltip: t('page.member.logs'),
        onClick: () => openLogDrawer(record),
      },
    ],
  },
];

const logColumns = [
  {
    title: t('page.member.fields.logType'),
    dataIndex: 'type',
    width: 120,
    customRender: ({ text }: any) => optionLabel(logTypeOptions.value, text, '-'),
  },
  {
    title: t('page.member.fields.direction'),
    dataIndex: 'direction',
    width: 100,
    customRender: ({ text }: any) => optionLabel(logDirectionOptions.value, text, '-'),
  },
  {
    title: t('page.member.fields.amount'),
    dataIndex: 'amount',
    width: 120,
    customRender: ({ text }: any) => formatAmount(text),
  },
  {
    title: t('page.member.fields.balanceBefore'),
    dataIndex: 'balanceBefore',
    width: 120,
    customRender: ({ text }: any) => formatAmount(text),
  },
  {
    title: t('page.member.fields.balanceAfter'),
    dataIndex: 'balanceAfter',
    width: 120,
    customRender: ({ text }: any) => formatAmount(text),
  },
  {
    title: t('page.member.fields.remark'),
    dataIndex: 'remark',
    ellipsis: true,
  },
  {
    title: t('common.createdAt'),
    dataIndex: 'createdAt',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
];

onMounted(async () => {
  await Promise.all([loadMemberOptions(), searchCustomers('')]);
  resetCardForm();
});
</script>
