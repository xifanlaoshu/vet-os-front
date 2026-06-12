<template>
  <div class="vpet-page vpet-print-page">
    <a-page-header
      class="vpet-print-toolbar"
      :title="t('page.consultation.print.title')"
      :subtitle="visit?.visitNo || '-'"
      @back="router.back()"
    >
      <template #extra>
        <a-space>
          <a-button @click="router.push(`/vpet/consultation/visit/${visitId}`)">
            {{ t('common.viewMedicalRecord') }}
          </a-button>
          <a-button type="primary" :disabled="loading" @click="printRecord">
            {{ t('page.consultation.print.printButton') }}
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <article class="vpet-print-sheet">
        <header class="print-hero">
          <div>
            <div class="print-kicker">{{ t('page.consultation.print.documentNo') }} {{ visit?.visitNo || '-' }}</div>
            <h1>{{ t('page.consultation.print.title') }}</h1>
            <p>{{ t('page.consultation.print.generatedAt') }} {{ formatToDateTime(new Date()) }}</p>
          </div>
          <div class="print-status">
            <span>{{ visitStatusText(visit?.status) }}</span>
          </div>
        </header>

        <section class="print-section">
          <h2>{{ t('page.consultation.print.basicInfo') }}</h2>
          <div class="print-grid">
            <PrintField :label="t('page.appointment.fields.customer')" :value="customerLabel(visit?.customer, visit?.customerSnapshot, visit?.customerId)" />
            <PrintField :label="t('page.customer.fields.phone')" :value="visit?.customer?.phone || visit?.customerSnapshot?.phone" />
            <PrintField :label="t('page.appointment.fields.pet')" :value="petLabel(visit?.pet, visit?.petSnapshot, visit?.petId)" />
            <PrintField :label="t('page.pet.fields.species')" :value="speciesText(visit?.pet?.species || visit?.petSnapshot?.species)" />
            <PrintField :label="t('page.pet.fields.breed')" :value="visit?.pet?.breed || visit?.petSnapshot?.breed" />
            <PrintField :label="t('page.pet.fields.gender')" :value="genderText(visit?.pet?.gender || visit?.petSnapshot?.gender)" />
            <PrintField :label="t('page.pet.fields.weight')" :value="weightText(visit?.pet?.weight || visit?.petSnapshot?.weight)" />
            <PrintField :label="t('page.pet.fields.allergy')" :value="visit?.pet?.allergy || visit?.petSnapshot?.allergy || t('common.none')" />
            <PrintField :label="t('page.consultation.detail.doctor')" :value="doctorLabel(visit?.doctor, visit?.doctorId, visit?.doctorName)" />
            <PrintField :label="t('page.consultation.fields.chiefComplaint')" :value="visit?.chiefComplaint" />
            <PrintField :label="t('page.consultation.detail.startTime')" :value="dateText(visit?.startTime || visit?.createdAt)" />
            <PrintField :label="t('page.consultation.fields.endTime')" :value="dateText(visit?.endTime)" />
          </div>
        </section>

        <section class="print-section">
          <h2>{{ t('page.consultation.detail.soap') }}</h2>
          <div class="soap-layout">
            <PrintBlock :title="t('page.consultation.detail.subjective')" :content="visit?.chiefComplaint || visit?.symptomSummary" />
            <PrintBlock :title="t('page.consultation.detail.objective')" :content="physicalExamText" />
            <PrintBlock :title="t('page.consultation.detail.assessment')" :content="diagnosisSummary" />
            <PrintBlock :title="t('page.consultation.detail.plan')" :content="visit?.treatmentPlan || visit?.doctorAdvice" />
          </div>
        </section>

        <section class="print-section">
          <h2>{{ t('page.consultation.detail.continuousCare') }}</h2>
          <div v-if="careFollowups.length" class="timeline">
            <div v-for="item in careFollowups" :key="item.id" class="timeline-item">
              <div class="timeline-head">
                <strong>{{ item.batchNo || '-' }}</strong>
                <span>{{ dateText(item.occurredAt || item.createdAt) }}</span>
                <span>{{ t('page.consultation.detail.recordedBy') }} {{ doctorLabel(item.recorder, item.recordedBy) }}</span>
              </div>
              <div class="timeline-body">
                <p v-if="item.symptomSummary">{{ t('page.consultation.detail.symptomObservation') }}：{{ item.symptomSummary }}</p>
                <p v-if="item.statusSummary">{{ t('page.consultation.detail.statusObservation') }}：{{ item.statusSummary }}</p>
                <p v-if="vitalSignText(item.vitalSigns)">{{ vitalSignText(item.vitalSigns) }}</p>
                <p v-if="item.objectiveNote">{{ t('page.consultation.detail.objectiveObservation') }}：{{ item.objectiveNote }}</p>
                <p v-if="item.assessmentText">{{ t('page.consultation.detail.followupAssessment') }}：{{ item.assessmentText }}</p>
                <p v-if="item.planAdjustment">{{ t('page.consultation.detail.planAdjustment') }}：{{ item.planAdjustment }}</p>
                <p v-if="item.medicationAdjustment">{{ t('page.consultation.detail.medicationAdjustment') }}：{{ item.medicationAdjustment }}</p>
              </div>
            </div>
          </div>
          <div v-else class="print-empty">{{ t('page.consultation.detail.emptyCareFollowups') }}</div>
        </section>

        <section class="print-section">
          <h2>{{ t('page.consultation.detail.prescriptionAndDispense') }}</h2>
          <div v-if="prescriptions.length" class="print-card-list">
            <div v-for="rx in prescriptions" :key="rx.id" class="print-card">
              <div class="print-card-title">
                <strong>{{ rx.rxNo }}</strong>
                <span>{{ prescriptionStatusText(rx.status) }}</span>
                <span>{{ t('page.consultation.detail.prescriber') }} {{ doctorLabel(rx.doctor, rx.doctorId, rx.doctorSnapshot?.name) }}</span>
              </div>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>{{ t('page.prescription.fields.item') }}</th>
                    <th>{{ t('page.prescription.fields.specification') }}</th>
                    <th>{{ t('page.prescription.fields.dosage') }}</th>
                    <th>{{ t('page.prescription.fields.frequency') }}</th>
                    <th>{{ t('page.prescription.fields.quantity') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="detail in rx.details || []" :key="detail.id">
                    <td>{{ detail.itemName || detail.drugName || '-' }}</td>
                    <td>{{ detail.specification || '-' }}</td>
                    <td>{{ detail.dosage || '-' }}</td>
                    <td>{{ detail.frequency || '-' }}</td>
                    <td>{{ `${Number(detail.quantity || 0).toFixed(2)} ${detail.dosageUnit || ''}` }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="print-empty">{{ t('page.consultation.detail.emptyPrescription') }}</div>
        </section>

        <section class="print-section">
          <h2>{{ t('page.lab.title') }}</h2>
          <div v-if="labs.length" class="print-card-list">
            <div v-for="lab in labs" :key="lab.id" class="print-card">
              <div class="print-card-title">
                <strong>{{ lab.orderNo }} / {{ lab.testName || '-' }}</strong>
                <span>{{ labStatusText(lab.status) }}</span>
              </div>
              <p v-if="lab.reportSummary" class="print-note">{{ lab.reportSummary }}</p>
              <table v-if="(lab.resultItems || []).length" class="print-table">
                <thead>
                  <tr>
                    <th>{{ t('page.lab.fields.itemName') }}</th>
                    <th>{{ t('page.lab.fields.resultValue') }}</th>
                    <th>{{ t('page.lab.fields.referenceRange') }}</th>
                    <th>{{ t('page.lab.fields.flag') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in lab.resultItems || []" :key="result.id || result.itemCode">
                    <td>{{ result.itemName || '-' }}</td>
                    <td>{{ [result.resultValue, result.unit].filter(Boolean).join(' ') || '-' }}</td>
                    <td>{{ referenceRangeText(result) }}</td>
                    <td>{{ result.flag || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="print-empty">{{ t('page.consultation.print.emptyLabs') }}</div>
        </section>

        <section class="print-section">
          <h2>{{ t('page.consultation.detail.billingAndPayments') }}</h2>
          <div v-if="billings.length" class="print-card-list">
            <div v-for="bill in billings" :key="bill.id" class="print-card">
              <div class="print-card-title">
                <strong>{{ bill.billNo }}</strong>
                <span>{{ paymentStatusText(bill.paymentStatus) }}</span>
                <span>{{ t('page.consultation.detail.receivable') }} {{ billReceivable(bill).toFixed(2) }} {{ t('common.amountUnit') }}</span>
              </div>
              <table class="print-table">
                <tbody>
                  <tr v-for="detail in bill.details || []" :key="detail.id">
                    <td>{{ detail.itemName }}</td>
                    <td>{{ Number(detail.quantity || 1).toFixed(2) }}</td>
                    <td>{{ Number(detail.amount || 0).toFixed(2) }} {{ t('common.amountUnit') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="print-empty">{{ t('page.consultation.detail.emptyBills') }}</div>
        </section>

        <footer class="print-footer">
          <div>{{ t('page.consultation.print.doctorSignature') }}：{{ doctorLabel(visit?.doctor, visit?.doctorId, visit?.doctorName) }}</div>
          <div>{{ t('page.consultation.print.printedAt') }}：{{ formatToDateTime(new Date()) }}</div>
        </footer>
      </article>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatToDateTime } from '@/utils/dateUtil';
import {
  vpetBillingByVisit,
  vpetLabList,
  vpetPrescriptionByVisit,
  vpetVisitGet,
} from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

defineOptions({ name: 'VPetConsultationPrint' });

const PrintField = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: '' },
  },
  setup(props) {
    return () => h('div', { class: 'print-field' }, [
      h('span', props.label),
      h('strong', props.value || '-'),
    ]);
  },
});

const PrintBlock = defineComponent({
  props: {
    title: { type: String, required: true },
    content: { type: [String, Number], default: '' },
  },
  setup(props) {
    return () => h('div', { class: 'print-block' }, [
      h('h3', props.title),
      h('p', props.content || '-'),
    ]);
  },
});

const {
  t,
  genderText,
  labStatusText,
  paymentStatusText,
  prescriptionStatusText,
  speciesText,
  visitStatusText,
} = useVpetLocale();
const { customerLabel, doctorLabel, petLabel } = useVpetReference();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const visit = ref<any>(null);
const prescriptions = ref<any[]>([]);
const billings = ref<any[]>([]);
const labs = ref<any[]>([]);
const visitId = computed(() => Number(route.params.id));
const careFollowups = computed(() => visit.value?.careFollowups || []);

const diagnosisSummary = computed(() => {
  const diagnoses = parseDiagnosisList(visit.value);
  return diagnoses.map((item: any) => item.name || item.code).filter(Boolean).join(' / ') || '-';
});

const physicalExamText = computed(() => {
  const exam = visit.value?.physicalExam;
  if (!exam) return '-';
  if (typeof exam === 'string') {
    try {
      const parsed = JSON.parse(exam);
      return parsed.note || parsed.summary || JSON.stringify(parsed);
    } catch {
      return exam;
    }
  }
  return exam.note || exam.summary || JSON.stringify(exam);
});

function parseDiagnosisList(detail: any) {
  if (Array.isArray(detail?.diagnoses)) return detail.diagnoses;
  if (Array.isArray(detail?.diagnosis)) return detail.diagnosis;
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

function dateText(value?: string | Date | null) {
  return value ? formatToDateTime(value) : '-';
}

function weightText(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-';
  return `${Number(value).toFixed(2)} kg`;
}

function billReceivable(bill: any) {
  return Math.max(Number(bill.totalAmount || 0) - Number(bill.discount || 0), 0);
}

function referenceRangeText(item: any) {
  if (item.referenceRange) return item.referenceRange;
  const min = item.referenceMin ?? item.lowerLimit;
  const max = item.referenceMax ?? item.upperLimit;
  if (min !== undefined && max !== undefined) return `${min} - ${max}`;
  if (min !== undefined) return `>= ${min}`;
  if (max !== undefined) return `<= ${max}`;
  return '-';
}

function parseMaybeJson(value?: any) {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function vitalSignText(vitalSigns?: Record<string, any> | string | null) {
  const signs = parseMaybeJson(vitalSigns);
  if (!signs) return '';
  return [
    signs.temperature !== undefined ? `${t('page.consultation.detail.temperature')} ${signs.temperature}℃` : '',
    signs.heartRate !== undefined ? `${t('page.consultation.detail.heartRate')} ${signs.heartRate}/min` : '',
    signs.respiratoryRate !== undefined ? `${t('page.consultation.detail.respiratoryRate')} ${signs.respiratoryRate}/min` : '',
    signs.weight !== undefined ? `${t('page.consultation.detail.weight')} ${signs.weight}kg` : '',
  ].filter(Boolean).join(' / ');
}

async function loadPrintData() {
  if (!visitId.value) return;
  loading.value = true;
  try {
    const [visitDetail, rxList, billingList, labResult] = await Promise.all([
      vpetVisitGet(visitId.value),
      vpetPrescriptionByVisit(visitId.value),
      vpetBillingByVisit(visitId.value),
      vpetLabList({ visitId: visitId.value, page: 1, pageSize: 100 }),
    ]);
    visit.value = visitDetail;
    prescriptions.value = (rxList || []) as any[];
    billings.value = (billingList || []) as any[];
    labs.value = (labResult as any)?.items || [];
  } finally {
    loading.value = false;
  }
}

function printRecord() {
  window.print();
}

onMounted(loadPrintData);
</script>

<style lang="less" scoped>
.vpet-print-page {
  background: #eef2f7;
}

.vpet-print-sheet {
  width: min(1080px, 100%);
  margin: 0 auto;
  padding: 38px 44px;
  background:
    linear-gradient(135deg, rgba(30, 88, 140, 0.08), transparent 38%),
    #fff;
  border: 1px solid rgba(28, 43, 64, 0.08);
  border-radius: 24px;
  box-shadow: 0 18px 48px rgba(30, 48, 80, 0.12);
  color: #1d2939;
}

.print-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 22px;
  border-bottom: 3px solid #17324d;
}

.print-kicker {
  color: #5b6b7d;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.print-hero h1 {
  margin: 8px 0;
  color: #102a43;
  font-size: 34px;
  letter-spacing: 0.04em;
}

.print-hero p {
  margin: 0;
  color: #667085;
}

.print-status {
  min-width: 120px;
  padding: 10px 16px;
  color: #17324d;
  font-weight: 700;
  text-align: center;
  background: #eaf4ff;
  border: 1px solid #b8d7f2;
  border-radius: 999px;
}

.print-section {
  margin-top: 26px;
  break-inside: avoid;
}

.print-section h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  color: #17324d;
  font-size: 19px;
}

.print-section h2::before {
  width: 7px;
  height: 20px;
  background: #2f80b7;
  border-radius: 999px;
  content: '';
}

.print-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 14px;
}

.print-field {
  min-height: 58px;
  padding: 10px 12px;
  background: rgba(248, 250, 252, 0.86);
  border: 1px solid #e4e7ec;
  border-radius: 12px;
}

.print-field span {
  display: block;
  margin-bottom: 4px;
  color: #667085;
  font-size: 12px;
}

.print-field strong {
  color: #1d2939;
  font-weight: 650;
  white-space: pre-wrap;
}

.soap-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.print-block,
.print-card {
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e4e7ec;
  border-radius: 14px;
}

.print-block h3 {
  margin: 0 0 8px;
  color: #344054;
  font-size: 15px;
}

.print-block p,
.timeline-body p,
.print-note {
  margin: 0;
  line-height: 1.75;
  white-space: pre-wrap;
}

.print-card-list {
  display: grid;
  gap: 14px;
}

.print-card-title,
.timeline-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  margin-bottom: 10px;
  color: #475467;
}

.print-card-title strong,
.timeline-head strong {
  color: #17324d;
}

.timeline {
  display: grid;
  gap: 12px;
}

.timeline-item {
  padding: 12px 14px;
  border-left: 4px solid #2f80b7;
  background: #f8fbff;
  border-radius: 12px;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.print-table th,
.print-table td {
  padding: 8px 10px;
  text-align: left;
  border: 1px solid #d0d5dd;
}

.print-table th {
  color: #17324d;
  background: #edf6ff;
}

.print-empty {
  padding: 16px;
  color: #667085;
  text-align: center;
  border: 1px dashed #d0d5dd;
  border-radius: 12px;
}

.print-footer {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-top: 34px;
  padding-top: 16px;
  color: #344054;
  border-top: 1px solid #d0d5dd;
}

@media print {
  :global(body) {
    background: #fff !important;
  }

  .vpet-print-page {
    padding: 0 !important;
    background: #fff !important;
  }

  .vpet-print-toolbar,
  :global(.ant-layout-header),
  :global(.ant-layout-sider),
  :global(.ant-tabs-nav),
  :global(.vben-tabs-view) {
    display: none !important;
  }

  .vpet-print-sheet {
    width: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .print-section,
  .print-card,
  .timeline-item {
    break-inside: avoid;
  }

  @page {
    margin: 12mm;
    size: A4;
  }
}
</style>
