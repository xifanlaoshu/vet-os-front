<template>
  <div class="vpet-page vpet-stack">
    <a-page-header
      :title="pageTitle"
      :subtitle="currentVisit?.visitNo || '-'"
      @back="router.back()"
    >
      <template #extra>
        <a-space>
          <a-tag :color="visitStatusColor(currentVisit?.status)">
            {{ visitStatusText(currentVisit?.status) }}
          </a-tag>
          <a-button :disabled="!currentVisit?.petId" @click="openChronicCenter">
            {{ t('page.chronic.title') }}
          </a-button>
          <a-button :disabled="!currentVisit?.id" @click="syncBilling">
            {{ t('page.consultation.detail.syncBilling') }}
          </a-button>
          <a-button :disabled="!currentVisit?.id || isVisitLocked" @click="lockEmr">
            {{ t('page.consultation.detail.lockEmr') }}
          </a-button>
          <a-button :disabled="!currentVisit?.id || isVisitLocked" @click="signEmr">
            {{ t('page.consultation.detail.signEmr') }}
          </a-button>
          <a-button v-if="isVisitLocked" @click="requestUnlockEmr">
            {{ t('page.consultation.detail.requestUnlock') }}
          </a-button>
          <a-button type="primary" :disabled="!canEditVisit" @click="saveSoap">
            {{ t('page.consultation.detail.saveRecord') }}
          </a-button>
          <a-button v-if="canEndVisit" danger @click="endVisit">
            {{ t('page.consultation.detail.endVisit') }}
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="vpet-grid-row">
      <a-col :span="6">
        <a-card class="vpet-stat-card">
          <a-statistic :title="t('page.consultation.detail.queueNumber')" :value="currentVisit?.queueNumber || '-'" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card">
          <a-statistic
            :title="t('page.consultation.detail.startTime')"
            :value="currentVisit?.startTime ? formatToDateTime(currentVisit.startTime) : '-'"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card">
          <a-statistic
            :title="t('page.consultation.detail.receivable')"
            :value="billingReceivableTotal.toFixed(2)"
            :suffix="t('common.amountUnit')"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card">
          <a-statistic
            :title="t('page.consultation.detail.due')"
            :value="billingDueTotal.toFixed(2)"
            :suffix="t('common.amountUnit')"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" class="vpet-grid-row">
      <a-col :span="16" class="vpet-stack">
        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.soap')">
          <a-form layout="vertical">
            <a-form-item :label="t('page.consultation.detail.subjective')">
              <a-textarea v-model:value="soap.S" :rows="3" :disabled="!canEditVisit" />
            </a-form-item>
            <a-form-item :label="t('page.consultation.detail.objective')">
              <a-textarea v-model:value="soap.O" :rows="4" :disabled="!canEditVisit" />
            </a-form-item>
            <a-form-item :label="t('page.consultation.detail.assessment')">
              <a-select
                v-model:value="soap.diagnosisCode"
                show-search
                allow-clear
                :disabled="!canEditVisit"
                :filter-option="false"
                :options="diagnosisOptions"
                :placeholder="t('page.consultation.detail.diagnosisPlaceholder')"
                @search="handleDiagnosisSearch"
                @change="handleDiagnosisChange"
              />
            </a-form-item>
            <a-form-item :label="t('page.consultation.detail.plan')">
              <a-textarea v-model:value="soap.P" :rows="4" :disabled="!canEditVisit" />
            </a-form-item>
            <a-form-item :label="t('page.consultation.detail.statusSummary')">
              <a-textarea v-model:value="soap.statusSummary" :rows="2" :disabled="!canEditVisit" />
            </a-form-item>
            <a-form-item :label="t('page.consultation.detail.planSummary')">
              <a-textarea v-model:value="soap.planSummary" :rows="2" :disabled="!canEditVisit" />
            </a-form-item>
          </a-form>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.progressTimeline')">
          <a-empty v-if="!(currentVisit?.progressBatches || []).length" :description="t('page.consultation.detail.emptyProgressBatches')" />
          <a-timeline v-else>
            <a-timeline-item
              v-for="batch in currentVisit?.progressBatches || []"
              :key="`progress-${batch.id}`"
            >
              <div class="vpet-subtitle">{{ batch.batchNo }} / {{ formatToDateTime(batch.createdAt) }}</div>
              <div class="vpet-inline-note">{{ batch.symptomSummary || '-' }}</div>
              <div class="vpet-muted vpet-inline-note">{{ batch.statusSummary || '-' }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.planTimeline')">
          <a-empty v-if="!(currentVisit?.planBatches || []).length" :description="t('page.consultation.detail.emptyPlanBatches')" />
          <a-timeline v-else>
            <a-timeline-item
              v-for="batch in currentVisit?.planBatches || []"
              :key="`plan-${batch.id}`"
            >
              <div class="vpet-subtitle">{{ batch.batchNo }} / {{ formatToDateTime(batch.createdAt) }}</div>
              <div class="vpet-inline-note">{{ batch.planSummary || '-' }}</div>
              <div class="vpet-muted vpet-inline-note">{{ batch.doctorAdvice || '-' }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.prescription')">
          <a-alert
            type="info"
            show-icon
            class="vpet-block-bottom"
            :message="t('page.consultation.detail.prescriptionSummary', {
              count: prescriptions.length,
              dispensed: dispensedPrescriptionCount,
            })"
          />
          <a-select
            v-model:value="selectedPrescriptionTemplateId"
            allow-clear
            mode="multiple"
            show-search
            :disabled="!canEditVisit"
            :filter-option="filterByLabel"
            :options="prescriptionTemplateOptions"
            :placeholder="t('page.prescription.placeholders.template')"
            class="vpet-block-bottom"
            @change="applyPrescriptionTemplate"
          />
          <a-input
            v-model:value="rxForm.diagnosisSummary"
            :disabled="!canEditVisit"
            :placeholder="t('page.consultation.detail.diagnosisSummaryPlaceholder')"
            class="vpet-block-bottom"
          />

          <a-table
            row-key="rowKey"
            size="small"
            :pagination="false"
            :columns="rxDetailInputColumns"
            :data-source="rxForm.details"
            :scroll="{ x: 1080 }"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'item'">
                <a-select
                  v-model:value="record.itemSelectValue"
                  show-search
                  :disabled="!canEditVisit"
                  :filter-option="false"
                  :options="chargeableOptions"
                  :placeholder="t('page.consultation.detail.drugPlaceholder')"
                  style="width: 100%"
                  @search="handleChargeableSearch"
                  @change="(value) => handleChargeableChange(index, value)"
                />
              </template>
              <template v-else-if="column.key === 'specification'">
                <a-input :value="record.specification || '-'" disabled />
              </template>
              <template v-else-if="column.key === 'dosage'">
                <a-input
                  v-model:value="record.dosage"
                  :disabled="!canEditVisit"
                  :placeholder="t('page.consultation.detail.dosage')"
                />
              </template>
              <template v-else-if="column.key === 'frequency'">
                <a-input
                  v-model:value="record.frequency"
                  :disabled="!canEditVisit"
                  :placeholder="t('page.consultation.detail.frequency')"
                />
              </template>
              <template v-else-if="column.key === 'quantity'">
                <a-input-number
                  v-model:value="record.quantity"
                  :min="0.01"
                  :precision="2"
                  :disabled="!canEditVisit"
                  style="width: 100%"
                />
              </template>
              <template v-else-if="column.key === 'dosageUnit'">
                <a-input :value="record.dosageUnit || '-'" disabled />
              </template>
              <template v-else-if="column.key === 'unitPrice'">
                <a-input-number
                  v-model:value="record.unitPrice"
                  :min="0"
                  :disabled="!canEditVisit"
                  style="width: 100%"
                />
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" danger :disabled="!canEditVisit" @click="removeRxDetail(index)">
                  {{ t('common.delete') }}
                </a-button>
              </template>
            </template>
          </a-table>

          <a-space class="vpet-block-top">
            <a-button :disabled="!canEditVisit" @click="addRxDetail">
              {{ t('page.consultation.detail.addDrug') }}
            </a-button>
            <a-button type="primary" :disabled="!canEditVisit" @click="submitRx">
              {{ t('page.consultation.detail.submitPrescription') }}
            </a-button>
          </a-space>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.prescriptionAndDispense')">
          <a-empty v-if="prescriptions.length === 0" :description="t('page.consultation.detail.emptyPrescription')" />
          <a-collapse v-else>
            <a-collapse-panel
              v-for="item in prescriptions"
              :key="item.id"
              :header="`${item.rxNo}${item.batchNo ? ` / ${item.batchNo}` : ''} / ${Number(item.totalAmount || 0).toFixed(2)} ${t('common.amountUnit')}`"
            >
              <template #extra>
                <a-space>
                  <a-tag :color="prescriptionStatusColor(item.status)">
                    {{ prescriptionStatusText(item.status) }}
                  </a-tag>
                  <a-button
                    v-if="Number(item.status) !== 4 && Number(item.status) !== 5"
                    type="link"
                    size="small"
                    @click.stop="dispensePrescription(item)"
                  >
                    {{ t('page.consultation.detail.dispense') }}
                  </a-button>
                </a-space>
              </template>

              <div
                v-for="detail in item.details || []"
                :key="detail.id"
                class="vpet-list-row"
              >
                <div class="vpet-subtitle">{{ detail.drugName }}</div>
                <div class="vpet-muted">
                  {{ [detail.specification, detail.dosage, detail.frequency, `x${detail.quantity || 0}${detail.dosageUnit || ''}`].filter(Boolean).join(' / ') }}
                </div>
              </div>

              <div class="vpet-block-spaced">
                <div class="vpet-subtitle-spaced">
                  {{ t('page.consultation.detail.transactionList') }}
                </div>
                <a-empty
                  v-if="!(prescriptionTxnsMap[item.id] || []).length"
                  :description="t('page.consultation.detail.emptyTransactions')"
                  :image="false"
                />
                <a-timeline v-else size="small">
                  <a-timeline-item
                    v-for="txn in prescriptionTxnsMap[item.id] || []"
                    :key="txn.id"
                  >
                    {{ drugLabel(txn.drug, txn.drugName, txn.drugId) }}
                    {{ Number(txn.quantityChange || 0) < 0 ? t('page.consultation.detail.dispense') : t('page.pharmacy.stockIn') }}
                    {{ Math.abs(Number(txn.quantityChange || 0)).toFixed(2) }}
                    / {{ t('page.pharmacy.fields.batchNo') }} {{ txn.batch?.batchNo || '-' }}
                    / {{ t('common.updatedAt') }} {{ formatToDateTime(txn.txnTime) }}
                  </a-timeline-item>
                </a-timeline>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>

      <a-col :span="8" class="vpet-stack">
        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.visitInfo')">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="t('page.appointment.fields.customer')">
              {{ customerLabel(currentVisit?.customer, currentVisit?.customerSnapshot, currentVisit?.customerId) }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.appointment.fields.pet')">
              {{ petSummary }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.fields.chiefComplaint')">
              {{ currentVisit?.chiefComplaint || '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.fields.diagnosis')">
              {{ diagnosisSummary || '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.detail.doctor')">
              {{ doctorDisplay }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.detail.memberBalance')">
              {{ memberBalanceText }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.emrCompliance')">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="t('page.consultation.detail.emrLockStatus')">
              <a-tag :color="isVisitLocked ? 'red' : 'green'">
                {{ isVisitLocked ? t('page.consultation.detail.locked') : t('page.consultation.detail.unlocked') }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.detail.signatureCount')">
              {{ emrSignatures.length }}
            </a-descriptions-item>
          </a-descriptions>
          <a-divider style="margin: 12px 0" />
          <div class="vpet-section-title">{{ t('page.consultation.detail.auditLogs') }}</div>
          <a-empty v-if="!emrAuditLogs.length" :description="t('page.consultation.detail.emptyAuditLogs')" :image="false" />
          <a-timeline v-else size="small">
            <a-timeline-item v-for="log in emrAuditLogs" :key="log.id">
              <div class="vpet-subtitle">{{ emrAuditActionText(log.action) }} / {{ formatToDateTime(log.createdAt) }}</div>
              <div class="vpet-muted">{{ log.reason || '-' }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.chronic.title')">
          <template #extra>
            <a-button size="small" @click="openChronicCenter">
              {{ t('common.detail') }}
            </a-button>
          </template>
          <a-empty
            v-if="!chronicCases.length"
            :description="t('page.chronic.emptyCases')"
            :image="false"
          />
          <a-timeline v-else size="small">
            <a-timeline-item
              v-for="item in chronicCases"
              :key="item.id"
            >
              <a-button type="link" style="padding: 0" @click="openChronicCase(item.id)">
                {{ item.caseNo }} / {{ item.diseaseName }}
              </a-button>
              <div class="vpet-muted">{{ item.nextReviewDate || '-' }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.queueTrace')">
          <a-empty
            v-if="!(currentVisit?.queueEvents || []).length"
            :description="t('page.consultation.detail.emptyQueueEvents')"
            :image="false"
          />
          <a-timeline v-else size="small">
            <a-timeline-item
              v-for="event in currentVisit?.queueEvents || []"
              :key="event.id"
            >
              {{ queueEventText(event.eventType) }} / {{ formatToDateTime(event.eventTime) }}
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.billingAndPayments')">
          <a-empty v-if="billings.length === 0" :description="t('page.consultation.detail.emptyBills')" />
          <a-collapse v-else>
            <a-collapse-panel
              v-for="bill in billings"
              :key="bill.id"
              :header="`${bill.billNo} / ${t('page.consultation.detail.receivable')} ${billReceivable(bill).toFixed(2)} ${t('common.amountUnit')}`"
            >
              <template #extra>
                <a-space>
                  <a-tag :color="paymentStatusColor(bill.paymentStatus)">
                    {{ paymentStatusText(bill.paymentStatus) }}
                  </a-tag>
                  <a-button
                    v-if="billDue(bill) > 0"
                    type="link"
                    size="small"
                    @click.stop="openPayModal(bill)"
                  >
                    {{ t('page.consultation.detail.pay') }}
                  </a-button>
                </a-space>
              </template>

              <div class="vpet-block-bottom">
                <div
                  v-for="detail in bill.details || []"
                  :key="detail.id"
                  class="vpet-flex-between-spaced"
                >
                  <span>{{ detail.itemName }}</span>
                  <span>{{ Number(detail.amount || 0).toFixed(2) }} {{ t('common.amountUnit') }}</span>
                </div>
              </div>

              <a-divider style="margin: 12px 0" />
              <div class="vpet-subtitle-spaced">{{ t('page.billing.paymentRecords') }}</div>
              <a-empty
                v-if="!(bill.payments || []).length"
                :description="t('page.consultation.detail.emptyPayments')"
                :image="false"
              />
              <a-timeline v-else size="small">
                <a-timeline-item
                  v-for="payment in bill.payments || []"
                  :key="payment.id"
                >
                  {{ paymentMethodText(payment.paymentMethod) }}
                  {{ Number(payment.amount || 0).toFixed(2) }} {{ t('common.amountUnit') }}
                  / {{ formatToDateTime(payment.paidAt) }}
                </a-timeline-item>
              </a-timeline>
            </a-collapse-panel>
          </a-collapse>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.lab.title')">
          <template #extra>
            <a-button size="small" @click="openLabCreateModal">
              {{ t('page.lab.create') }}
            </a-button>
          </template>
          <a-empty v-if="labs.length === 0" :description="t('page.consultation.detail.emptyPrescription')" />
          <a-collapse v-else>
            <a-collapse-panel
              v-for="lab in labs"
              :key="lab.id"
              :header="`${lab.orderNo} / ${lab.testName || '-'}`"
            >
              <template #extra>
                <a-space>
                  <a-tag :color="labStatusColor(lab.status)">
                    {{ labStatusText(lab.status) }}
                  </a-tag>
                  <a-button type="link" size="small" @click.stop="openLabReport(lab.id)">
                    {{ t('page.lab.report') }}
                  </a-button>
                </a-space>
              </template>

              <a-descriptions :column="1" size="small">
                <a-descriptions-item :label="t('page.lab.fields.sampleType')">
                  {{ lab.sampleType || '-' }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.lab.fields.abnormalCount')">
                  {{ Number(lab.abnormalCount || 0) }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.billing.fields.amount')">
                  {{ Number(lab.chargeAmount || 0).toFixed(2) }} {{ t('common.amountUnit') }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.lab.fields.reportSummary')">
                  {{ lab.reportSummary || '-' }}
                </a-descriptions-item>
              </a-descriptions>

              <div class="vpet-block-spaced">
                <div
                  v-for="result in lab.resultItems || []"
                  :key="result.id"
                  class="vpet-result-row"
                >
                  <span>{{ result.itemName }}</span>
                  <span>{{ [result.resultValue, result.unit, result.flag].filter(Boolean).join(' / ') || '-' }}</span>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="payVisible"
      :title="t('page.consultation.detail.confirmPayment')"
      :confirm-loading="paying"
      destroy-on-close
      @ok="submitPayment"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.billing.fields.billNo')">
          <a-input :value="payingBill?.billNo || '-'" disabled />
        </a-form-item>
        <a-form-item :label="t('page.appointment.fields.customer')">
          <a-input :value="customerLabel(currentVisit?.customer, currentVisit?.customerSnapshot, currentVisit?.customerId)" disabled />
        </a-form-item>
        <a-form-item :label="t('page.consultation.detail.memberBalance')">
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
      v-model:open="labCreateVisible"
      :title="t('page.lab.create')"
      destroy-on-close
      @ok="submitLabOrder"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.lab.fields.testName')">
          <a-select
            v-model:value="labCreateForm.templateId"
            allow-clear
            show-search
            :options="labTemplateOptions"
            :filter-option="filterByLabel"
            @change="handleLabTemplateChange"
          />
        </a-form-item>
        <a-form-item :label="t('page.lab.fields.testName')">
          <a-input v-model:value="labCreateForm.testName" />
        </a-form-item>
        <a-form-item :label="t('page.lab.fields.sampleType')">
          <a-select
            v-model:value="labCreateForm.sampleType"
            allow-clear
            show-search
            :options="sampleTypeOptions"
            :filter-option="filterByLabel"
          />
        </a-form-item>
        <a-form-item :label="t('page.billing.fields.amount')">
          <a-input-number v-model:value="labCreateForm.chargeAmount" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { formatToDateTime } from '@/utils/dateUtil';
import { useFormModal } from '@/hooks/useModal';
import {
  vpetBillingByVisit,
  vpetBillingPay,
  vpetBillingSyncVisit,
  vpetChronicCaseList,
  vpetLabCreate,
  vpetLabList,
  vpetLabTemplateList,
  vpetMemberBalance,
  vpetPrescriptionByVisit,
  vpetPrescriptionCreate,
  vpetPrescriptionDispense,
  vpetPrescriptionStockTxns,
  vpetPrescriptionTemplateList,
  vpetVisitDiagnosisCodes,
  vpetVisitEnd,
  vpetVisitGet,
  vpetVisitAuditLogs,
  vpetVisitLockEmr,
  vpetVisitRequestUnlock,
  vpetVisitSignEmr,
  vpetVisitSignatures,
  vpetVisitStart,
  vpetVisitUpdate,
} from '@/api/backend/vpet';
import { vpetPharmacyChargeableSearch } from '@/api/backend/vpet/pharmacy';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';
import { calculatePrescriptionFormula } from '../prescription/formula';

defineOptions({ name: 'VPetConsultationDetail' });

type DiagnosisOption = {
  value: string;
  label: string;
  name: string;
};

type ChargeableOption = {
  value: string;
  label: string;
  raw: any;
  itemName: string;
  specification?: string;
  retailPrice?: number;
};

type RxDetailForm = {
  rowKey: string;
  itemSelectValue?: string;
  itemKind: number;
  itemId?: number;
  itemName: string;
  drugId?: number;
  chargeItemId?: number;
  drugName: string;
  specification?: string;
  dosage?: string;
  dosageFormula?: string;
  dosageUnit?: string;
  frequency?: string;
  quantity: number;
  quantityFormula?: string;
  unitPrice: number;
};

const {
  t,
  labStatusColor,
  labStatusText,
  paymentMethodOptions,
  paymentMethodText,
  paymentStatusColor,
  paymentStatusText,
  prescriptionStatusColor,
  prescriptionStatusText,
  queueEventText,
  visitStatusColor,
  visitStatusText,
} = useVpetLocale();
const { customerLabel, doctorLabel, drugLabel, filterByLabel, loadDictOptions, petLabel } = useVpetReference();
const route = useRoute();
const router = useRouter();
const [showUnlockModal] = useFormModal();

const currentVisit = ref<any>(null);
const prescriptions = ref<any[]>([]);
const billings = ref<any[]>([]);
const labs = ref<any[]>([]);
const chronicCases = ref<any[]>([]);
const emrAuditLogs = ref<any[]>([]);
const emrSignatures = ref<any[]>([]);
const prescriptionTxnsMap = ref<Record<number, any[]>>({});
const memberBalance = ref<any>(null);
const diagnosisOptions = ref<DiagnosisOption[]>([]);
const chargeableOptions = ref<ChargeableOption[]>([]);
const sampleTypeOptions = ref<any[]>([]);
const labTemplates = ref<any[]>([]);
const prescriptionTemplates = ref<any[]>([]);
const selectedPrescriptionTemplateId = ref<number[]>([]);
const payVisible = ref(false);
const labCreateVisible = ref(false);
const paying = ref(false);
const payingBill = ref<any>(null);

const soap = ref({
  S: '',
  O: '',
  diagnosisCode: undefined as string | undefined,
  diagnosisName: '',
  P: '',
  statusSummary: '',
  planSummary: '',
});

const rxForm = ref({
  visitId: undefined as number | undefined,
  doctorId: undefined as number | undefined,
  diagnosisSummary: '',
  details: [] as RxDetailForm[],
});

const payForm = ref({
  paymentMethod: undefined as number | undefined,
  paidAmount: 0,
});

const labCreateForm = ref({
  templateId: undefined as number | undefined,
  testName: '',
  sampleType: undefined as string | undefined,
  chargeAmount: 0,
});

const labTemplateOptions = computed(() => {
  const species = currentVisit.value?.pet?.species || currentVisit.value?.petSnapshot?.species;
  return labTemplates.value
    .filter((item: any) => !item.speciesScope || item.speciesScope === 'all' || item.speciesScope === species)
    .map((item: any) => ({
      value: item.id,
      label: `${item.name}${item.sampleType ? ` / ${item.sampleType}` : ''}`,
    }));
});

const prescriptionTemplateOptions = computed(() => {
  const species = currentVisit.value?.pet?.species || currentVisit.value?.petSnapshot?.species;
  return prescriptionTemplates.value
    .filter((item: any) => !item.speciesScope || item.speciesScope === 'all' || item.speciesScope === species)
    .map((item: any) => ({
      value: item.id,
      label: `${item.templateName} / ${item.templateCode}`,
    }));
});

const defaultPaymentMethod = computed<number | undefined>(() => {
  const cashOption = paymentMethodOptions.value.find(item => Number(item.value) === 3);
  const candidate = cashOption?.value ?? paymentMethodOptions.value[0]?.value;
  return candidate === undefined ? undefined : Number(candidate);
});

let diagnosisSearchTimer: number | undefined;
let chargeableSearchTimer: number | undefined;
let rxDetailRowSeed = 0;

function createRxDetailRowKey() {
  rxDetailRowSeed += 1;
  return `visit-rx-detail-${Date.now()}-${rxDetailRowSeed}`;
}

function createEmptyRxDetail(): RxDetailForm {
  return {
    rowKey: createRxDetailRowKey(),
    itemSelectValue: undefined,
    itemKind: 1,
    itemId: undefined,
    itemName: '',
    drugId: undefined,
    chargeItemId: undefined,
    drugName: '',
    specification: '',
    dosage: '',
    dosageFormula: '',
    dosageUnit: '',
    frequency: 'bid',
    quantity: 1,
    quantityFormula: '',
    unitPrice: 0,
  };
}

function parseDiagnosisList(detail: any) {
  if (Array.isArray(detail?.diagnoses)) {
    return detail.diagnoses;
  }
  if (Array.isArray(detail?.diagnosis)) {
    return detail.diagnosis;
  }
  if (typeof detail?.diagnosis === 'string') {
    try {
      const parsed = JSON.parse(detail.diagnosis);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const pageTitle = computed(() => {
  const petName = currentVisit.value?.pet?.name || currentVisit.value?.petSnapshot?.name;
  const customerName = customerLabel(
    currentVisit.value?.customer,
    currentVisit.value?.customerSnapshot,
    currentVisit.value?.customerId,
  );
  return petName ? `${petName} / ${customerName}` : t('page.consultation.detail.titleFallback');
});

const doctorDisplay = computed(() => {
  return doctorLabel(currentVisit.value?.doctor, currentVisit.value?.doctorId, currentVisit.value?.doctorName);
});

const petSummary = computed(() => {
  return petLabel(currentVisit.value?.pet, currentVisit.value?.petSnapshot, currentVisit.value?.petId);
});

const diagnosisSummary = computed(() => {
  return parseDiagnosisList(currentVisit.value)
    .map((item: any) => item.name || item.code)
    .filter(Boolean)
    .join(' / ');
});

const isVisitLocked = computed(() => Number(currentVisit.value?.locked || 0) === 1);
const canEditVisit = computed(() => [1, 2, 3].includes(Number(currentVisit.value?.status || 0)) && !isVisitLocked.value);
const canEndVisit = computed(() => [1, 2, 3].includes(Number(currentVisit.value?.status || 0)));
const dispensedPrescriptionCount = computed(() => prescriptions.value.filter(item => Number(item.status) === 4).length);
const billingReceivableTotal = computed(() => billings.value.reduce((sum, bill) => sum + billReceivable(bill), 0));
const billingDueTotal = computed(() => billings.value.reduce((sum, bill) => sum + billDue(bill), 0));
const memberBalanceText = computed(() => {
  return memberBalance.value
    ? `${Number(memberBalance.value.balance || 0).toFixed(2)} ${t('common.amountUnit')}`
    : t('page.billing.memberNotOpened');
});

const rxDetailInputColumns = [
  { title: t('page.prescription.fields.item'), key: 'item', width: 260 },
  { title: t('page.prescription.fields.specification'), key: 'specification', width: 150 },
  { title: t('page.prescription.fields.dosage'), key: 'dosage', width: 130 },
  { title: t('page.prescription.fields.frequency'), key: 'frequency', width: 120 },
  { title: t('page.prescription.fields.quantity'), key: 'quantity', width: 110 },
  { title: t('page.prescription.fields.dosageUnit'), key: 'dosageUnit', width: 90 },
  { title: t('page.prescription.fields.unitPrice'), key: 'unitPrice', width: 120 },
  { title: t('common.action'), key: 'action', width: 90, fixed: 'right' as const },
];

function billReceivable(bill: any) {
  return Math.max(Number(bill.totalAmount || 0) - Number(bill.discount || 0), 0);
}

function billDue(bill: any) {
  return Math.max(billReceivable(bill) - Number(bill.paidAmount || 0), 0);
}

function parseDiagnosis(detail: any) {
  const first = parseDiagnosisList(detail)[0];
  return {
    code: first?.code,
    name: first?.name || '',
  };
}

async function loadVisit(startIfNeeded = false) {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  const snapshot: any = await vpetVisitGet(visitId);
  const shouldStart = startIfNeeded
    && [1, 2].includes(Number(snapshot?.status || 0))
    && !snapshot?.startTime;
  const detail = shouldStart
    ? await vpetVisitStart(visitId)
    : snapshot;

  currentVisit.value = detail;
  await loadEmrCompliance();
  soap.value.S = detail?.chiefComplaint || '';
  soap.value.P = detail?.treatmentPlan || '';
  soap.value.O = detail?.physicalExam?.note || detail?.physicalExam?.summary || '';
  soap.value.statusSummary = detail?.progressBatches?.at?.(-1)?.statusSummary || '';
  soap.value.planSummary = detail?.planBatches?.at?.(-1)?.planSummary || '';

  const diagnosis = parseDiagnosis(detail);
  soap.value.diagnosisCode = diagnosis.code;
  soap.value.diagnosisName = diagnosis.name;

  rxForm.value.visitId = detail?.id;
  rxForm.value.doctorId = detail?.doctorId;
  rxForm.value.diagnosisSummary = diagnosis.name || diagnosis.code || '';
  if (rxForm.value.details.length === 0) {
    rxForm.value.details = [createEmptyRxDetail()];
  }
}

async function loadEmrCompliance() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  const [logs, signatures] = await Promise.all([
    vpetVisitAuditLogs(visitId),
    vpetVisitSignatures(visitId),
  ]);
  emrAuditLogs.value = (logs || []) as any[];
  emrSignatures.value = (signatures || []) as any[];
}

function emrAuditActionText(action: string) {
  const mapping: Record<string, string> = {
    lock: t('page.consultation.detail.auditLock'),
    signed: t('page.consultation.detail.auditSigned'),
    unlock_requested: t('page.consultation.detail.auditUnlockRequested'),
    unlock_approved: t('page.consultation.detail.auditUnlockApproved'),
    unlock_rejected: t('page.consultation.detail.auditUnlockRejected'),
  };
  return mapping[action] || action;
}

async function loadPrescriptions() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  prescriptions.value = await vpetPrescriptionByVisit(visitId) as any[];

  const txns = await Promise.all(
    prescriptions.value.map(async (item) => {
      const list = await vpetPrescriptionStockTxns(item.id);
      return [item.id, list || []] as const;
    }),
  );
  prescriptionTxnsMap.value = Object.fromEntries(txns);
}

async function loadBillings() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  billings.value = await vpetBillingByVisit(visitId) as any[];
}

async function loadLabs() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  const result = await vpetLabList({ visitId, page: 1, pageSize: 100 });
  labs.value = result?.items || [];
}

async function loadChronicCases() {
  const petId = Number(currentVisit.value?.petId || 0);
  if (!petId) {
    chronicCases.value = [];
    return;
  }
  chronicCases.value = await vpetChronicCaseList({ petId }) as any[];
}

async function loadMemberBalance() {
  const customerId = Number(currentVisit.value?.customerId || 0);
  if (!customerId) {
    memberBalance.value = null;
    return;
  }
  try {
    memberBalance.value = await vpetMemberBalance(customerId);
  } catch {
    memberBalance.value = null;
  }
}

async function refreshLinkedData() {
  await Promise.all([loadPrescriptions(), loadBillings(), loadLabs(), loadMemberBalance(), loadChronicCases()]);
}

async function searchDiagnosisOptions(keyword = '') {
  try {
    const items = await vpetVisitDiagnosisCodes({
      keyword,
      species: currentVisit.value?.pet?.species,
    }) as any[];
    diagnosisOptions.value = (items || []).map(item => ({
      value: item.code,
      label: `${item.code} / ${item.name}`,
      name: item.name,
    }));
  } catch {
    diagnosisOptions.value = [];
  }
}

async function searchChargeableOptions(keyword = '') {
  try {
    const items = await vpetPharmacyChargeableSearch(keyword) as any[];
    setChargeableOptions((items || []).map(item => ({
      value: `${item.itemKind}:${item.itemId}`,
      label: chargeableLabelFromOption(item),
      raw: item,
      itemName: item.itemName || item.drugName,
      specification: item.specification,
      retailPrice: Number(item.retailPrice || 0),
    })));
  } catch {
    setChargeableOptions([]);
  }
}

function chargeableLabelFromOption(item: any) {
  const source = item.itemKind === 2 ? t('page.serviceItem.title') : t('page.pharmacy.title');
  const name = item.itemName || item.drugName;
  const specification = item.specification ? ` / ${item.specification}` : '';
  const unit = item.dosageUnit || item.unit || '';
  const stock = item.currentStock !== undefined && item.currentStock !== null
    ? ` / ${t('page.pharmacy.fields.currentStock')} ${Number(item.currentStock || 0).toFixed(2)}${unit}`
    : '';
  const price = ` / ${Number(item.retailPrice || 0).toFixed(2)}${t('common.amountUnit')}${unit ? `/${unit}` : ''}`;
  return `${source} / ${name}${specification}${price}${stock}`;
}

function chargeableValueFromRxDetail(detail: Partial<RxDetailForm> | any) {
  const itemKind = Number(detail.itemKind || (detail.chargeItemId ? 2 : 1));
  const itemId = detail.itemId || detail.drugId || detail.chargeItemId;
  return itemId ? `${itemKind}:${itemId}` : undefined;
}

function chargeableLabelFromRxDetail(detail: Partial<RxDetailForm> | any) {
  const itemKind = Number(detail.itemKind || (detail.chargeItemId ? 2 : 1));
  const name = detail.itemName || detail.drugName || t('page.consultation.detail.drugFallback');
  const specification = detail.specification ? ` / ${detail.specification}` : '';
  const unit = detail.dosageUnit ? ` / ${detail.dosageUnit}` : '';
  return `${itemKind === 2 ? t('page.serviceItem.title') : t('page.pharmacy.title')} / ${name}${specification}${unit}`;
}

function chargeableOptionFromRxDetail(detail: RxDetailForm): ChargeableOption | undefined {
  const value = detail.itemSelectValue || chargeableValueFromRxDetail(detail);
  if (!value) return undefined;
  return {
    value,
    label: chargeableLabelFromRxDetail(detail),
    raw: {
      ...detail,
      itemKind: detail.itemKind,
      itemId: detail.itemId,
      itemName: detail.itemName || detail.drugName,
      drugName: detail.drugName || detail.itemName,
      retailPrice: detail.unitPrice,
      dosageUnit: detail.dosageUnit,
    },
    itemName: detail.itemName || detail.drugName,
    specification: detail.specification,
    retailPrice: detail.unitPrice,
  };
}

function setChargeableOptions(baseOptions: ChargeableOption[]) {
  const optionMap = new Map<string, ChargeableOption>();
  [...baseOptions, ...rxForm.value.details.map(chargeableOptionFromRxDetail)]
    .filter(Boolean)
    .forEach((item: any) => {
      optionMap.set(String(item.value), item);
    });
  chargeableOptions.value = Array.from(optionMap.values());
}

async function loadPrescriptionTemplates() {
  try {
    const result = await vpetPrescriptionTemplateList({ page: 1, pageSize: 100, status: 1 });
    prescriptionTemplates.value = result?.items || [];
  } catch {
    prescriptionTemplates.value = [];
  }
}

function handleDiagnosisSearch(keyword: string) {
  window.clearTimeout(diagnosisSearchTimer);
  diagnosisSearchTimer = window.setTimeout(() => {
    searchDiagnosisOptions(keyword);
  }, 250);
}

function handleChargeableSearch(keyword: string) {
  window.clearTimeout(chargeableSearchTimer);
  chargeableSearchTimer = window.setTimeout(() => {
    searchChargeableOptions(keyword);
  }, 250);
}

function handleDiagnosisChange(value: any) {
  const nextValue = value ? String(value) : undefined;
  const option = diagnosisOptions.value.find(item => item.value === nextValue);
  soap.value.diagnosisCode = nextValue;
  soap.value.diagnosisName = option?.name || '';
  if (!rxForm.value.diagnosisSummary) {
    rxForm.value.diagnosisSummary = option?.name || nextValue || '';
  }
}

function handleChargeableChange(index: number, value: any) {
  const option = chargeableOptions.value.find(item => String(item.value) === String(value))?.raw;
  const detail = rxForm.value.details[index];
  if (!detail || !option) return;
  fillRxDetailFromItem(detail, option);
}

function fillRxDetailFromItem(detail: RxDetailForm, option: any) {
  const itemKind = Number(option.itemKind || 1);
  detail.itemSelectValue = `${itemKind}:${option.itemId || option.id}`;
  detail.itemKind = itemKind;
  detail.itemId = option.itemId || option.id;
  detail.itemName = option.itemName || option.drugName;
  detail.drugId = itemKind === 1 ? (option.drugId || option.id) : undefined;
  detail.chargeItemId = itemKind === 2 ? (option.chargeItemId || option.id) : undefined;
  detail.drugName = option.itemName || option.drugName;
  detail.specification = option.specification || '';
  detail.dosageUnit = option.dosageUnit || option.unit || '';
  detail.unitPrice = Number(option.retailPrice || 0);
}

function createRxDetailFromTemplateItem(item: any): RxDetailForm {
  const itemSelectValue = `${Number(item.itemKind || 1)}:${item.itemId || item.drugId || item.chargeItemId}`;
  return {
    rowKey: createRxDetailRowKey(),
    itemSelectValue,
    itemKind: Number(item.itemKind || 1),
    itemId: item.itemId || item.drugId || item.chargeItemId,
    itemName: item.itemName || item.drugName,
    drugId: item.drugId,
    chargeItemId: item.chargeItemId,
    drugName: item.itemName || item.drugName,
    specification: item.specification || '',
    dosage: calculateDosageFromTemplate(item),
    dosageFormula: item.dosageFormula || '',
    dosageUnit: item.dosageUnit || item.unit || '',
    frequency: item.frequency || '',
    quantity: calculateQuantityFromTemplate(item),
    quantityFormula: item.quantityFormula || '',
    unitPrice: Number(item.unitPrice || 0),
  };
}

function currentPetWeight() {
  return Number(currentVisit.value?.pet?.weight || currentVisit.value?.petSnapshot?.weight || 0) || undefined;
}

function calculateDosageFromTemplate(item: any) {
  const calculated = calculatePrescriptionFormula(item.dosageFormula, { weight: currentPetWeight() });
  return calculated === undefined ? (item.dosage || '') : String(calculated);
}

function calculateQuantityFromTemplate(item: any) {
  const calculated = calculatePrescriptionFormula(item.quantityFormula, { weight: currentPetWeight() });
  return calculated === undefined ? Number(item.quantity || 1) : calculated;
}

function normalizePrescriptionTemplateIds(templateIds?: number[] | number) {
  if (Array.isArray(templateIds)) return templateIds.map(Number).filter(Boolean);
  return templateIds ? [Number(templateIds)] : [];
}

function applyPrescriptionTemplate(templateIds?: number[] | number) {
  const ids = normalizePrescriptionTemplateIds(templateIds);
  if (!ids.length) {
    rxForm.value.details = [createEmptyRxDetail()];
    setChargeableOptions(chargeableOptions.value);
    return;
  }
  const selectedTemplates = prescriptionTemplates.value.filter((item: any) => ids.includes(Number(item.id)));
  const details = selectedTemplates.flatMap((template: any) => (template.items || []).map(createRxDetailFromTemplateItem));
  rxForm.value.details = details.length ? details : [createEmptyRxDetail()];
  setChargeableOptions(chargeableOptions.value);
}

function addRxDetail() {
  rxForm.value.details.push(createEmptyRxDetail());
}

function removeRxDetail(index: number) {
  rxForm.value.details.splice(index, 1);
}

async function saveSoap() {
  if (!currentVisit.value?.id || !canEditVisit.value) return;
  const diagnosisPayload = soap.value.diagnosisCode
    ? [{
        code: soap.value.diagnosisCode,
        name: soap.value.diagnosisName || soap.value.diagnosisCode,
        type: 'confirmed',
      }]
    : undefined;

  await vpetVisitUpdate(currentVisit.value.id, {
    chiefComplaint: soap.value.S,
    treatmentPlan: soap.value.P,
    symptomSummary: soap.value.S,
    statusSummary: soap.value.statusSummary,
    planSummary: soap.value.planSummary,
    physicalExam: soap.value.O ? JSON.stringify({ note: soap.value.O }) : undefined,
    diagnosis: diagnosisPayload ? JSON.stringify(diagnosisPayload) : undefined,
  });
  message.success(t('page.consultation.messages.saved'));
  await loadVisit();
}

async function lockEmr() {
  if (!currentVisit.value?.id || isVisitLocked.value) return;
  if (canEditVisit.value) {
    await saveSoap();
  }
  await vpetVisitLockEmr(currentVisit.value.id, {
    reason: 'manual_lock',
    operatorId: currentVisit.value?.doctorId,
  });
  message.success(t('page.consultation.messages.emrLocked'));
  await loadVisit();
}

async function signEmr() {
  if (!currentVisit.value?.id || isVisitLocked.value) return;
  if (canEditVisit.value) {
    await saveSoap();
  }
  await vpetVisitSignEmr(currentVisit.value.id, {
    signType: 'doctor',
    operatorId: currentVisit.value?.doctorId,
  });
  message.success(t('page.consultation.messages.emrSigned'));
  await loadVisit();
}

async function requestUnlockEmr() {
  if (!currentVisit.value?.id) return;
  await showUnlockModal({
    modalProps: {
      title: t('page.consultation.detail.unlockReasonPrompt'),
      width: 560,
      onFinish: async (values: any) => {
        await vpetVisitRequestUnlock(currentVisit.value.id, {
          reason: values.reason,
          operatorId: currentVisit.value?.doctorId,
        });
        message.success(t('page.consultation.messages.unlockRequested'));
        await loadEmrCompliance();
      },
    },
    formProps: {
      labelWidth: 100,
      schemas: [
        {
          field: 'reason',
          label: t('page.consultation.detail.unlockReason'),
          component: 'InputTextArea',
          required: true,
          colProps: { span: 24 },
        },
      ],
    },
  });
}

async function endVisit() {
  if (!currentVisit.value?.id) return;
  await saveSoap();
  await vpetVisitEnd(currentVisit.value.id);
  message.success(t('page.consultation.messages.ended'));
  await loadVisit();
}

async function submitRx() {
  if (!rxForm.value.visitId || !rxForm.value.doctorId) {
    message.error(t('page.prescription.messages.doctorRequired'));
    return;
  }

  const details = rxForm.value.details
    .filter(item => item.itemId || item.drugId || item.chargeItemId)
    .map(item => ({
      itemKind: item.itemKind,
      itemId: item.itemId,
      itemName: item.itemName,
      drugId: item.drugId,
      chargeItemId: item.chargeItemId,
      drugName: item.drugName,
      specification: item.specification,
      dosage: item.dosage,
      dosageUnit: item.dosageUnit,
      frequency: item.frequency,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    }));

  if (!details.length) {
    message.error(t('page.prescription.messages.selectDrug'));
    return;
  }

  await vpetPrescriptionCreate({
    visitId: rxForm.value.visitId,
    doctorId: rxForm.value.doctorId,
    diagnosisSummary: rxForm.value.diagnosisSummary || soap.value.diagnosisName || soap.value.diagnosisCode || '',
    details,
  });

  message.success(t('page.prescription.messages.created'));
  rxForm.value.details = [createEmptyRxDetail()];
  selectedPrescriptionTemplateId.value = [];
  await syncBilling(false);
  await loadPrescriptions();
}

async function dispensePrescription(item: any) {
  await vpetPrescriptionDispense(item.id, { pharmacistId: currentVisit.value?.doctorId });
  message.success(t('page.consultation.messages.dispensed'));
  await loadPrescriptions();
}

async function syncBilling(showMessage = true) {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  await vpetBillingSyncVisit(visitId);
  await loadBillings();
  if (showMessage) {
    message.success(t('page.consultation.messages.billingSynced'));
  }
}

function openLabReport(id: number) {
  router.push({ name: 'VPetLabReport', params: { id } });
}

function openChronicCenter() {
  router.push({
    path: '/vpet/chronic',
    query: {
      visitId: currentVisit.value?.id,
      customerId: currentVisit.value?.customerId,
      petId: currentVisit.value?.petId,
    },
  });
}

function openChronicCase(id: number) {
  router.push({
    path: '/vpet/chronic',
    query: {
      caseId: id,
      customerId: currentVisit.value?.customerId,
      petId: currentVisit.value?.petId,
    },
  });
}

function openLabCreateModal() {
  labCreateForm.value = {
    templateId: undefined,
    testName: '',
    sampleType: undefined,
    chargeAmount: 0,
  };
  labCreateVisible.value = true;
}

function handleLabTemplateChange(value: number) {
  const template = labTemplates.value.find((item: any) => Number(item.id) === Number(value));
  if (!template) return;
  labCreateForm.value.templateId = template.id;
  labCreateForm.value.testName = template.name;
  labCreateForm.value.sampleType = template.sampleType || undefined;
  labCreateForm.value.chargeAmount = Number(template.defaultChargeAmount || 0);
}

function openPayModal(bill: any) {
  const due = billDue(bill);
  if (due <= 0) {
    message.info(t('page.billing.messages.cleared'));
    return;
  }
  payingBill.value = bill;
  payForm.value = {
    paymentMethod: defaultPaymentMethod.value,
    paidAmount: due,
  };
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
      customerId: currentVisit.value?.customerId,
    });
    message.success(t('page.billing.messages.paid'));
    payVisible.value = false;
    await refreshLinkedData();
  } finally {
    paying.value = false;
  }
}

async function submitLabOrder() {
  if (!currentVisit.value?.id || !labCreateForm.value.testName) {
    message.error(t('page.lab.fields.testName'));
    return;
  }
  await vpetLabCreate({
    visitId: currentVisit.value.id,
    doctorId: currentVisit.value.doctorId,
    templateId: labCreateForm.value.templateId,
    testName: labCreateForm.value.testName,
    sampleType: labCreateForm.value.sampleType,
    chargeAmount: Number(labCreateForm.value.chargeAmount || 0),
  });
  message.success(t('page.lab.messages.created'));
  labCreateVisible.value = false;
  await loadLabs();
}

onMounted(async () => {
  rxForm.value.details = [createEmptyRxDetail()];
  await loadVisit(true);
  sampleTypeOptions.value = await loadDictOptions('vpet_lab_sample_type');
  labTemplates.value = await vpetLabTemplateList() as any[];
  await Promise.all([searchDiagnosisOptions(''), searchChargeableOptions(''), loadPrescriptionTemplates()]);
  await refreshLinkedData();
});
</script>
