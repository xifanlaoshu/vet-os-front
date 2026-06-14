<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.billing.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.billing.fields.visit')">
          <a-select
            v-model:value="filters.visitId"
            allow-clear
            show-search
            :placeholder="t('page.billing.placeholders.visit')"
            :options="visitOptions"
            :filter-option="filterByLabel"
          />
        </a-form-item>
        <a-form-item :label="t('page.billing.fields.paymentStatus')">
          <a-select
            v-model:value="filters.paymentStatus"
            allow-clear
            :placeholder="t('page.appointment.statusPlaceholder')"
            :options="paymentStatusOptions"
          />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="reloadTable">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openCreateModal()">
              <Icon icon="ant-design:plus-outlined" />
              {{ t('page.billing.create') }}
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <DynamicTable
      class="vpet-panel-card vpet-list-card"
      :header-title="t('page.billing.list')"
      show-index
      :data-request="loadTableData"
      :columns="columns"
      :search="false"
    />

    <a-modal
      v-model:open="createVisible"
      :title="t('page.billing.create')"
      :mask-closable="false"
      :confirm-loading="creating"
      destroy-on-close
      @cancel="handleCreateCancel"
      @ok="submitCreate"
    >
      <a-form
        ref="createFormRef"
        layout="vertical"
        :model="createForm"
        :rules="createFormRules"
      >
        <a-form-item :label="t('page.billing.fields.visit')" name="visitId">
          <a-select
            v-model:value="createForm.visitId"
            show-search
            :filter-option="filterByLabel"
            :get-popup-container="getPopupContainer"
            :options="visitOptions"
            :placeholder="t('page.prescription.messages.selectVisit')"
            @change="handleCreateVisitChange"
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.appointment.fields.customer')">
              <a-input :value="selectedCreateCustomerText" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.appointment.fields.pet')">
              <a-input :value="selectedCreatePetText" disabled />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="14">
            <a-form-item :label="t('page.billing.fields.itemName')" name="itemName">
              <a-input v-model:value="createForm.itemName" :placeholder="t('page.billing.defaultItemName')" />
            </a-form-item>
          </a-col>
          <a-col :span="10">
            <a-form-item :label="t('page.billing.fields.amount')" name="amount">
              <a-input-number v-model:value="createForm.amount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item :label="t('page.billing.fields.discount')">
          <a-input-number v-model:value="createForm.discount" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="payVisible"
      :title="t('page.billing.confirmPayment')"
      :confirm-loading="paying"
      destroy-on-close
      @ok="submitPayment"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.billing.fields.billNo')">
          <a-input :value="payingBill?.billNo || '-'" disabled />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.billing.fields.receivable')">
              <a-input :value="billReceivable(payingBill).toFixed(2)" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.billing.fields.due')">
              <a-input :value="billDue(payingBill).toFixed(2)" disabled />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item :label="t('page.billing.fields.memberBalance')">
          <a-input :value="memberBalanceText" disabled />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.billing.fields.paymentMethod')">
              <a-select v-model:value="payForm.paymentMethod" :options="paymentMethodOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.billing.fields.paidAmount')">
              <a-input-number v-model:value="payForm.paidAmount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="refundVisible"
      :title="t('page.billing.refund')"
      :confirm-loading="refunding"
      destroy-on-close
      @ok="submitRefund"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.billing.fields.billNo')">
          <a-input :value="refundingBill?.billNo || '-'" disabled />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.billing.fields.receivable')">
              <a-input :value="billReceivable(refundingBill).toFixed(2)" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.billing.fields.refundableAmount')">
              <a-input :value="billRefundable(refundingBill).toFixed(2)" disabled />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item :label="t('page.billing.fields.refundAmount')" required>
          <a-input-number v-model:value="refundForm.refundAmount" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="t('page.billing.fields.refundReason')" required>
          <a-textarea v-model:value="refundForm.reason" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="detailVisible"
      :title="t('page.billing.detail')"
      width="520"
      destroy-on-close
    >
      <a-descriptions :column="1" size="small" bordered>
        <a-descriptions-item :label="t('page.billing.fields.billNo')">
          {{ detailBill?.billNo || '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.billing.fields.visit')">
          {{ detailVisitLabel }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.billing.fields.receivable')">
          {{ billReceivable(detailBill).toFixed(2) }} {{ t('common.amountUnit') }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.billing.fields.paidAmount')">
          {{ Number(detailBill?.paidAmount || 0).toFixed(2) }} {{ t('common.amountUnit') }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('page.billing.fields.paymentStatus')">
          {{ paymentStatusText(detailBill?.paymentStatus) }}
        </a-descriptions-item>
      </a-descriptions>

      <a-divider>{{ t('page.billing.chargeItems') }}</a-divider>
      <a-empty v-if="!(detailBill?.details || []).length" :description="t('page.billing.emptyDetails')" />
      <div v-else>
        <div
          v-for="item in detailBill?.details || []"
          :key="item.id"
          class="vpet-flex-between-spaced"
        >
          <span>{{ item.itemName }}</span>
          <span>{{ Number(item.amount || 0).toFixed(2) }} {{ t('common.amountUnit') }}</span>
        </div>
      </div>

      <a-divider>{{ t('page.billing.paymentRecords') }}</a-divider>
      <a-empty v-if="!(detailBill?.payments || []).length" :description="t('page.billing.emptyPayments')" />
      <a-timeline v-else size="small">
        <a-timeline-item
          v-for="payment in detailBill?.payments || []"
          :key="payment.id"
        >
          <Tag :color="Number(payment.direction) === 2 ? 'red' : 'green'">
            {{ paymentDirectionText(payment.direction) }}
          </Tag>
          {{ paymentMethodText(payment.paymentMethod) }}
          {{ Number(payment.amount || 0).toFixed(2) }} {{ t('common.amountUnit') }}
          / {{ formatToDateTime(payment.paidAt) }}
        </a-timeline-item>
      </a-timeline>

      <a-space class="vpet-block-top">
        <a-button type="primary" @click="openReceiptPrint(detailBill, 'billing_receipt')">
          {{ t('page.billing.printReceipt') }}
        </a-button>
        <a-button v-if="billRefundable(detailBill) > 0" @click="openReceiptPrint(detailBill, 'billing_refund')">
          {{ t('page.billing.printRefundReceipt') }}
        </a-button>
      </a-space>
    </a-drawer>

    <a-modal
      v-model:open="printVisible"
      :title="printTemplateTypeText(activePrintType)"
      width="760px"
      :footer="null"
      destroy-on-close
    >
      <a-space class="vpet-block-bottom">
        <a-select
          v-model:value="selectedPrintTemplateId"
          style="width: 260px"
          :options="receiptPrintTemplateOptions"
          :placeholder="t('page.printTemplate.selectTemplate')"
        />
        <a-button type="primary" @click="printCurrentReceipt">{{ t('common.print') }}</a-button>
      </a-space>
      <div id="vpet-billing-print-area" class="vpet-receipt-paper" v-html="receiptPrintHtml" />
    </a-modal>
  </div>
</template>

<script setup lang="tsx">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Tag, message } from 'ant-design-vue';
import type { FormInstance, Rule } from 'ant-design-vue';
import { useTable } from '@/components/core/dynamic-table';
import Icon from '@/components/basic/icon/Icon.vue';
import { formatToDateTime } from '@/utils/dateUtil';
import {
  vpetBillingAll,
  vpetBillingCreate,
  vpetBillingGet,
  vpetBillingPay,
  vpetBillingRefund,
  vpetPrintTemplateActive,
  vpetMemberBalance,
} from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';
import { resolveVpetPopupContainer } from '../shared/popup';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetBilling' });

const {
  t,
  paymentDirectionText,
  paymentMethodOptions,
  paymentMethodText,
  paymentStatusColor,
  paymentStatusOptions,
  paymentStatusText,
  printTemplateTypeText,
} = useVpetLocale();
const {
  customerLabel,
  filterByLabel,
  loadVisits: loadVisitOptions,
  petLabel,
  visitLabel,
} = useVpetReference();
const [DynamicTable, dynamicTableInstance] = useTable();

const filters = ref({
  visitId: undefined as number | undefined,
  paymentStatus: undefined as number | undefined,
});
const visitOptions = ref<VisitOption[]>([]);
const createVisible = ref(false);
const creating = ref(false);
const createFormRef = ref<FormInstance>();
const payVisible = ref(false);
const paying = ref(false);
const refundVisible = ref(false);
const refunding = ref(false);
const detailVisible = ref(false);
const payingBill = ref<any>(null);
const refundingBill = ref<any>(null);
const detailBill = ref<any>(null);
const memberBalance = ref<any>(null);
const printVisible = ref(false);
const printBill = ref<any>(null);
const receiptPrintTemplates = ref<any[]>([]);
const selectedPrintTemplateId = ref<number | undefined>();
const activePrintType = ref('billing_receipt');

const createForm = ref({
  visitId: undefined as number | undefined,
  customerId: undefined as number | undefined,
  itemName: t('page.billing.defaultItemName'),
  amount: undefined as number | undefined,
  discount: 0,
});

const createFormRules: Record<string, Rule[]> = {
  visitId: [{ required: true, message: t('page.billing.messages.invalidVisit'), trigger: 'change' }],
  itemName: [{ required: true, message: t('page.billing.messages.itemNameRequired'), trigger: 'blur' }],
  amount: [{
    validator: async (_rule, value) => {
      if (Number(value || 0) > 0) return;
      throw new Error(t('page.billing.messages.amountPositive'));
    },
    trigger: 'change',
  }],
};

const payForm = ref({
  paymentMethod: undefined as number | undefined,
  paidAmount: 0,
});

const refundForm = ref({
  refundAmount: 0,
  reason: '',
});

const defaultPaymentMethod = computed<number | undefined>(() => {
  const cashOption = paymentMethodOptions.value.find(item => Number(item.value) === 3);
  const candidate = cashOption?.value ?? paymentMethodOptions.value[0]?.value;
  return candidate === undefined ? undefined : Number(candidate);
});

function billReceivable(record: any) {
  if (!record) return 0;
  return Math.max(Number(record.totalAmount || 0) - Number(record.discount || 0), 0);
}

function billDue(record: any) {
  if (!record) return 0;
  return Math.max(billReceivable(record) - Number(record.paidAmount || 0), 0);
}

function billRefundable(record: any) {
  if (!record) return 0;
  return Math.max(Number(record.paidAmount || 0), 0);
}

const memberBalanceText = computed(() => {
  return memberBalance.value
    ? `${Number(memberBalance.value.balance || 0).toFixed(2)} ${t('common.amountUnit')}`
    : t('page.billing.memberNotOpened');
});

async function loadVisits() {
  try {
    visitOptions.value = await loadVisitOptions();
  } catch {
    visitOptions.value = [];
  }
}

function resetCreateForm() {
  createForm.value = {
    visitId: undefined,
    customerId: undefined,
    itemName: t('page.billing.defaultItemName'),
    amount: undefined,
    discount: 0,
  };
  createFormRef.value?.clearValidate();
}

function reloadTable() {
  dynamicTableInstance?.reload();
}

function resetFilters() {
  filters.value = {
    visitId: undefined,
    paymentStatus: undefined,
  };
  reloadTable();
}

async function openCreateModal() {
  resetCreateForm();
  createVisible.value = true;
  await nextTick();
  createFormRef.value?.clearValidate();
}

function handleCreateCancel() {
  createVisible.value = false;
  resetCreateForm();
}

function handleCreateVisitChange(value?: number) {
  const visit = visitOptions.value.find(item => Number(item.value) === Number(value))?.raw;
  createForm.value.visitId = value;
  createForm.value.customerId = visit?.customerId;
}

async function submitCreate() {
  try {
    await createFormRef.value?.validate();
  } catch {
    return;
  }

  if (!createForm.value.visitId || !createForm.value.customerId) {
    message.error(t('page.billing.messages.invalidVisit'));
    return;
  }

  creating.value = true;
  try {
    await vpetBillingCreate({
      visitId: createForm.value.visitId,
      customerId: createForm.value.customerId,
      discount: Number(createForm.value.discount || 0),
      details: [{
        itemType: 1,
        itemName: createForm.value.itemName,
        sourceType: 'visit',
        sourceId: createForm.value.visitId,
        quantity: 1,
        unitPrice: Number(createForm.value.amount || 0),
      }],
    });
    message.success(t('page.billing.messages.created'));
    createVisible.value = false;
    reloadTable();
  } finally {
    creating.value = false;
  }
}

async function openDetail(record: any) {
  detailBill.value = await vpetBillingGet(record.id);
  detailVisible.value = true;
}

async function loadReceiptPrintTemplates(templateType: string) {
  const data: any = await vpetPrintTemplateActive({ templateType });
  receiptPrintTemplates.value = Array.isArray(data) ? data : [];
  selectedPrintTemplateId.value = receiptPrintTemplates.value.find(item => Number(item.defaultTemplate) === 1)?.id
    ?? receiptPrintTemplates.value[0]?.id;
}

async function openReceiptPrint(record: any, templateType = 'billing_receipt') {
  if (!record?.id) return;
  activePrintType.value = templateType;
  printBill.value = record.details ? record : await vpetBillingGet(record.id);
  await loadReceiptPrintTemplates(templateType);
  printVisible.value = true;
}

async function printCurrentReceipt() {
  await nextTick();
  window.print();
}

async function openPayModal(record: any) {
  const due = billDue(record);
  if (due <= 0) {
    message.info(t('page.billing.messages.cleared'));
    return;
  }
  payingBill.value = record;
  payForm.value = {
    paymentMethod: defaultPaymentMethod.value,
    paidAmount: due,
  };

  try {
    memberBalance.value = await vpetMemberBalance(record.customerId);
  } catch {
    memberBalance.value = null;
  }

  payVisible.value = true;
}

async function submitPayment() {
  if (!payingBill.value) return;
  if (Number(payForm.value.paidAmount || 0) <= 0) {
    message.error(t('page.billing.messages.amountPositive'));
    return;
  }

  paying.value = true;
  try {
    await vpetBillingPay(payingBill.value.id, {
      paymentMethod: payForm.value.paymentMethod,
      paidAmount: Number(payForm.value.paidAmount || 0),
      customerId: payingBill.value.customerId,
    });
    message.success(t('page.billing.messages.paid'));
    payVisible.value = false;
    if (detailVisible.value && detailBill.value?.id === payingBill.value.id) {
      await openDetail(payingBill.value);
    }
    reloadTable();
  } finally {
    paying.value = false;
  }
}

function openRefundModal(record: any) {
  const refundable = billRefundable(record);
  if (refundable <= 0) {
    message.info(t('page.billing.messages.noRefundableAmount'));
    return;
  }
  refundingBill.value = record;
  refundForm.value = {
    refundAmount: refundable,
    reason: '',
  };
  refundVisible.value = true;
}

async function submitRefund() {
  if (!refundingBill.value) return;
  const refundAmount = Number(refundForm.value.refundAmount || 0);
  if (refundAmount <= 0) {
    message.error(t('page.billing.messages.amountPositive'));
    return;
  }
  if (refundAmount > billRefundable(refundingBill.value)) {
    message.error(t('page.billing.messages.refundExceedsPaid'));
    return;
  }
  if (!refundForm.value.reason?.trim()) {
    message.error(t('page.billing.messages.refundReasonRequired'));
    return;
  }

  refunding.value = true;
  try {
    await vpetBillingRefund(refundingBill.value.id, {
      refundAmount,
      reason: refundForm.value.reason.trim(),
    });
    message.success(t('page.billing.messages.refunded'));
    refundVisible.value = false;
    if (detailVisible.value && detailBill.value?.id === refundingBill.value.id) {
      await openDetail(refundingBill.value);
    }
    reloadTable();
  } finally {
    refunding.value = false;
  }
}

const selectedCreateVisit = computed(() => {
  return visitOptions.value.find(item => Number(item.value) === Number(createForm.value.visitId))?.raw;
});

const selectedCreateCustomerText = computed(() => {
  return customerLabel(
    selectedCreateVisit.value?.customer,
    selectedCreateVisit.value?.customerSnapshot,
    selectedCreateVisit.value?.customerId,
  );
});

const selectedCreatePetText = computed(() => {
  return petLabel(
    selectedCreateVisit.value?.pet,
    selectedCreateVisit.value?.petSnapshot,
    selectedCreateVisit.value?.petId,
  );
});

const detailVisitLabel = computed(() => visitLabel(visitOptions.value, detailBill.value?.visitId));

function getPopupContainer(triggerNode: HTMLElement) {
  return resolveVpetPopupContainer(triggerNode);
}

const loadTableData = async (params: any) => {
  return vpetBillingAll({
    ...params,
    visitId: filters.value.visitId,
    paymentStatus: filters.value.paymentStatus,
  }) as any;
};

const columns = [
  {
    title: t('page.billing.fields.billNo'),
    dataIndex: 'billNo',
    width: 180,
  },
  {
    title: t('page.billing.fields.visit'),
    dataIndex: 'visitId',
    width: 220,
    customRender: ({ text }: any) => visitLabel(visitOptions.value, text),
  },
  {
    title: t('page.billing.fields.receivable'),
    dataIndex: 'totalAmount',
    width: 130,
    customRender: ({ record }: any) => `${billReceivable(record).toFixed(2)} ${t('common.amountUnit')}`,
  },
  {
    title: t('page.billing.fields.paidAmount'),
    dataIndex: 'paidAmount',
    width: 130,
    customRender: ({ record }: any) => `${Number(record.paidAmount || 0).toFixed(2)} ${t('common.amountUnit')}`,
  },
  {
    title: t('page.billing.fields.due'),
    dataIndex: 'dueAmount',
    width: 130,
    customRender: ({ record }: any) => `${billDue(record).toFixed(2)} ${t('common.amountUnit')}`,
  },
  {
    title: t('page.billing.fields.paymentStatus'),
    dataIndex: 'paymentStatus',
    width: 120,
    customRender: ({ record }: any) => (
      <Tag color={paymentStatusColor(record.paymentStatus)}>
        {paymentStatusText(record.paymentStatus)}
      </Tag>
    ),
  },
  {
    title: t('page.billing.fields.paymentMethod'),
    dataIndex: 'paymentMethod',
    width: 120,
    customRender: ({ record }: any) => paymentMethodText(record.paymentMethod),
  },
  {
    title: t('page.billing.fields.paidAt'),
    dataIndex: 'paidAt',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('common.createdAt'),
    dataIndex: 'createdAt',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  {
    title: t('common.action'),
    width: 140,
    dataIndex: 'ACTION',
    fixed: 'right' as const,
    actions: ({ record }: any) => [
      {
        icon: 'ant-design:eye-outlined',
        tooltip: t('page.billing.detail'),
        onClick: () => openDetail(record),
      },
      {
        icon: 'ant-design:check-circle-outlined',
        tooltip: t('page.billing.confirmPayment'),
        onClick: () => openPayModal(record),
      },
      {
        icon: 'ant-design:rollback-outlined',
        tooltip: t('page.billing.refund'),
        onClick: () => openRefundModal(record),
      },
      {
        icon: 'ant-design:printer-outlined',
        tooltip: t('page.billing.printReceipt'),
        onClick: () => openReceiptPrint(record, 'billing_receipt'),
      },
    ],
  },
];

const receiptPrintTemplateOptions = computed(() =>
  receiptPrintTemplates.value.map(item => ({
    value: item.id,
    label: `${item.name} / ${item.paperType || '80mm'}`,
  })),
);

const receiptPrintHtml = computed(() => {
  const bill = printBill.value || {};
  const template = receiptPrintTemplates.value.find(item => Number(item.id) === Number(selectedPrintTemplateId.value));
  const model = buildBillingPrintModel(bill);
  const fallback = [
    '<h1>宠物医院收款小票</h1>',
    '<p>账单号：{{billNo}}</p>',
    '<p>宠主：{{customerName}}　宠物：{{petName}}</p>',
    '{{itemsTable}}',
    '<p>应收：{{receivableAmount}}　优惠：{{discountAmount}}　实收：{{paidAmount}}</p>',
    '<p>支付方式：{{paymentMethod}}　打印时间：{{printedAt}}</p>',
  ].join('');
  const content = template
    ? [template.templateHeader, template.templateBody, template.templateFooter].filter(Boolean).join('\n')
    : fallback;
  return renderPrintTemplate(content, model);
});

function buildBillingPrintModel(bill: any) {
  return {
    billNo: bill.billNo || '-',
    customerName: customerLabel(null, bill.customerSnapshot, bill.customerId),
    petName: petLabel(null, bill.petSnapshot, bill.petId),
    receivableAmount: billReceivable(bill).toFixed(2),
    discount: Number(bill.discount || 0).toFixed(2),
    discountAmount: Number(bill.discount || 0).toFixed(2),
    paidAmount: Number(bill.paidAmount || 0).toFixed(2),
    dueAmount: billDue(bill).toFixed(2),
    refundAmount: calculateRefundAmount(bill.payments || []).toFixed(2),
    refundReason: resolveRefundReason(bill.payments || []),
    paymentMethod: paymentMethodText(bill.paymentMethod),
    paymentStatus: paymentStatusText(bill.paymentStatus),
    paidAt: bill.paidAt ? formatToDateTime(bill.paidAt) : '-',
    refundedAt: resolveRefundedAt(bill.payments || []),
    operatorName: '-',
    printedAt: new Date().toLocaleString(),
    itemsTable: buildBillingItemsTable(bill.details || []),
    paymentsTable: buildBillingPaymentsTable(bill.payments || []),
  };
}

function calculateRefundAmount(payments: any[]) {
  return payments
    .filter(item => Number(item.direction) === 2)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function resolveRefundReason(payments: any[]) {
  return payments.filter(item => Number(item.direction) === 2).at(-1)?.remark || '-';
}

function resolveRefundedAt(payments: any[]) {
  const refundedAt = payments.filter(item => Number(item.direction) === 2).at(-1)?.paidAt;
  return refundedAt ? formatToDateTime(refundedAt) : '-';
}

function buildBillingItemsTable(details: any[]) {
  const rows = details.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.itemName || '-')}</td>
      <td>${Number(item.quantity || 1).toFixed(2)}</td>
      <td>${Number(item.unitPrice || 0).toFixed(2)}</td>
      <td>${Number(item.amount || 0).toFixed(2)}</td>
    </tr>
  `).join('');
  return `<table class="vpet-print-table"><thead><tr><th>#</th><th>项目</th><th>数量</th><th>单价</th><th>金额</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function buildBillingPaymentsTable(payments: any[]) {
  const rows = payments.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(paymentDirectionText(item.direction))}</td>
      <td>${escapeHtml(paymentMethodText(item.paymentMethod))}</td>
      <td>${Number(item.amount || 0).toFixed(2)}</td>
      <td>${escapeHtml(item.paidAt ? formatToDateTime(item.paidAt) : '-')}</td>
    </tr>
  `).join('');
  return `<table class="vpet-print-table"><thead><tr><th>#</th><th>方向</th><th>方式</th><th>金额</th><th>时间</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderPrintTemplate(template: string, model: Record<string, any>) {
  const html = template.replace(/\n/g, '<br />');
  return html.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (key === 'itemsTable' || key === 'paymentsTable') return model[key] || '';
    return escapeHtml(model[key] ?? '');
  });
}

function escapeHtml(value: any) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

onMounted(async () => {
  await loadVisits();
});
</script>

<style lang="less" scoped>
  .vpet-receipt-paper {
    max-width: 520px;
    padding: 22px;
    margin: 0 auto;
    color: #111827;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    line-height: 1.8;

    :deep(h1) {
      margin: 0 0 14px;
      text-align: center;
      font-size: 20px;
      font-weight: 700;
    }

    :deep(.vpet-print-table) {
      width: 100%;
      margin: 12px 0;
      border-collapse: collapse;
    }

    :deep(.vpet-print-table th),
    :deep(.vpet-print-table td) {
      padding: 6px 8px;
      border-bottom: 1px dashed #d1d5db;
      text-align: left;
    }
  }

  @media print {
    :global(body *) {
      visibility: hidden;
    }

    :global(#vpet-billing-print-area),
    :global(#vpet-billing-print-area *) {
      visibility: visible;
    }

    :global(#vpet-billing-print-area) {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      max-width: none;
      border: 0 !important;
    }
  }
</style>
