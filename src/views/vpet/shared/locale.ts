import { computed, ref } from 'vue';
import { useI18n } from '@/hooks/useI18n';
import Api from '@/api/backend/api';

type StatusKey = number | string | undefined | null;
type DictValueType = 'string' | 'number';
type DictOption = {
  value: string | number;
  label: string;
};

const DICT_PAGE_SIZE = 100;
const dictTypeIdCache = new Map<string, number>();
const dictRawItemsCache = new Map<string, ReturnType<typeof ref<any[]>>>();
const dictPendingCache = new Map<string, Promise<any[]>>();

function parseDictValue(value: any, valueType: DictValueType) {
  if (valueType !== 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

function getDictRawRef(dictCode: string) {
  if (!dictRawItemsCache.has(dictCode)) {
    dictRawItemsCache.set(dictCode, ref<any[]>([]));
  }
  return dictRawItemsCache.get(dictCode)!;
}

async function ensureDictTypes() {
  if (dictTypeIdCache.size > 0) return;
  const types = await Api.systemDictType.dictTypeGetAll();
  (types || []).forEach((item: any) => {
    dictTypeIdCache.set(item.code, item.id);
  });
}

async function ensureDictItems(dictCode: string) {
  const rawRef = getDictRawRef(dictCode);
  if (rawRef.value.length > 0) return rawRef.value;
  if (dictPendingCache.has(dictCode)) return dictPendingCache.get(dictCode)!;
  const pending = (async () => {
    await ensureDictTypes();
    const typeId = dictTypeIdCache.get(dictCode);
    if (!typeId) {
      rawRef.value = [];
      return rawRef.value;
    }
    const data = await Api.systemDictItem.dictItemList({
      typeId,
      page: 1,
      pageSize: DICT_PAGE_SIZE,
    });
    rawRef.value = data?.items || [];
    return rawRef.value;
  })().finally(() => {
    dictPendingCache.delete(dictCode);
  });
  dictPendingCache.set(dictCode, pending);
  return pending;
}

function buildDictOptions(
  dictCode: string,
  fallbackFactory: () => DictOption[],
  valueType: DictValueType = 'number',
) {
  void ensureDictItems(dictCode);
  const rawRef = getDictRawRef(dictCode);
  return computed(() => {
    if (!rawRef.value.length) return fallbackFactory();
    return rawRef.value.map((item: any) => ({
      value: parseDictValue(item.value, valueType),
      label: item.label,
    }));
  });
}

function findOption(options: DictOption[], value: StatusKey) {
  if (value === undefined || value === null || value === '') return undefined;
  return options.find(item => String(item.value) === String(value));
}

function buildOptionText(
  options: DictOption[],
  value: StatusKey,
  emptyFallback: string,
) {
  if (value === undefined || value === null || value === '') {
    return emptyFallback;
  }
  return findOption(options, value)?.label || String(value);
}

export function useVpetLocale() {
  const { t } = useI18n('vpet');

  const speciesOptions = buildDictOptions('pet_species', () => [
    { value: 'dog', label: 'Dog' },
    { value: 'cat', label: 'Cat' },
    { value: 'other', label: 'Other' },
  ], 'string');

  const appointmentStatusOptions = buildDictOptions('vpet_appointment_status', () => [
    { value: 1, label: 'Booked' },
    { value: 2, label: 'Checked in' },
    { value: 3, label: 'Completed' },
    { value: 4, label: 'Cancelled' },
  ]);

  const visitStatusOptions = buildDictOptions('vpet_visit_status', () => [
    { value: 1, label: 'Waiting' },
    { value: 2, label: 'Called' },
    { value: 3, label: 'In consultation' },
    { value: 4, label: 'Finished' },
    { value: 6, label: 'Missed' },
  ]);

  const paymentMethodOptions = buildDictOptions('vpet_payment_method', () => [
    { value: 1, label: 'WeChat' },
    { value: 2, label: 'Alipay' },
    { value: 3, label: 'Cash' },
    { value: 4, label: 'Member card' },
    { value: 5, label: 'Combined' },
  ]);

  const paymentStatusOptions = buildDictOptions('vpet_payment_status', () => [
    { value: 1, label: 'Pending' },
    { value: 2, label: 'Partial' },
    { value: 3, label: 'Paid' },
    { value: 4, label: 'Refunded' },
    { value: 5, label: 'Partially refunded' },
  ]);

  const paymentDirectionOptions = buildDictOptions('vpet_payment_direction', () => [
    { value: 1, label: 'Income' },
    { value: 2, label: 'Refund' },
  ]);

  const prescriptionStatusOptions = buildDictOptions('vpet_prescription_status', () => [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Pending review' },
    { value: 3, label: 'Reviewed' },
    { value: 4, label: 'Dispensed' },
    { value: 5, label: 'Voided' },
  ]);

  const prescriptionTypeOptions = buildDictOptions('vpet_prescription_type', () => [
    { value: 1, label: '院内诊疗处方' },
    { value: 2, label: '手术/麻醉处方' },
    { value: 3, label: '家长外带处方' },
  ]);

  const printTemplateTypeOptions = buildDictOptions('vpet_print_template_type', () => [
    { value: 'prescription', label: '处方单' },
    { value: 'billing_receipt', label: '收款小票' },
    { value: 'billing_refund', label: '退款小票' },
    { value: 'dispense_note', label: '发药单' },
    { value: 'lab_report', label: '化验报告' },
    { value: 'visit_summary', label: '病历摘要' },
  ], 'string');

  const doctorStatusOptions = buildDictOptions('vpet_doctor_status', () => [
    { value: 0, label: 'Inactive' },
    { value: 1, label: 'Active' },
  ]);

  const petStatusOptions = buildDictOptions('vpet_pet_status', () => [
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Hospitalized' },
    { value: 3, label: 'Euthanasia' },
    { value: 4, label: 'Deceased' },
  ]);

  const pharmacyStatusOptions = buildDictOptions('vpet_pharmacy_status', () => [
    { value: 0, label: 'Disabled' },
    { value: 1, label: 'Active' },
  ]);

  const labStatusOptions = buildDictOptions('vpet_lab_status', () => [
    { value: 1, label: 'Requested' },
    { value: 2, label: 'Sampled' },
    { value: 4, label: 'Reported' },
  ]);

  const hospitalizationStatusOptions = buildDictOptions('vpet_hospitalization_status', () => [
    { value: 1, label: 'Hospitalized' },
    { value: 2, label: 'Discharged' },
  ]);

  const reminderStatusOptions = buildDictOptions('vpet_reminder_status', () => [
    { value: 1, label: 'Pending' },
    { value: 2, label: 'Reminded' },
    { value: 3, label: 'Completed' },
    { value: 4, label: 'Cancelled' },
  ]);

  const insuranceStatusOptions = buildDictOptions('vpet_insurance_status', () => [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Submitted' },
    { value: 3, label: 'Settled' },
  ]);

  const transferStatusOptions = buildDictOptions('vpet_transfer_status', () => [
    { value: 1, label: 'Pending approval' },
    { value: 2, label: 'Approved' },
    { value: 3, label: 'Completed' },
  ]);

  const pharmacyBatchStatusOptions = buildDictOptions('vpet_pharmacy_batch_status', () => [
    { value: 1, label: 'In stock' },
    { value: 2, label: 'Near expiry' },
    { value: 3, label: 'Expired' },
  ]);

  const genderOptions = buildDictOptions('pet_gender', () => [
    { value: 1, label: 'Male' },
    { value: 2, label: 'Female' },
  ]);

  const neuteredOptions = buildDictOptions('pet_neutered', () => [
    { value: 0, label: 'Not neutered' },
    { value: 1, label: 'Neutered' },
  ]);

  const livingEnvironmentOptions = buildDictOptions('pet_living_environment', () => [
    { value: 1, label: 'Indoor' },
    { value: 2, label: 'Outdoor' },
    { value: 3, label: 'Mixed' },
  ]);

  const reproductiveStatusOptions = buildDictOptions('pet_reproductive_status', () => [
    { value: 1, label: 'Not bred' },
    { value: 2, label: 'Breeding' },
    { value: 4, label: 'Pregnant' },
    { value: 5, label: 'Lactating' },
  ]);

  const lifeStageOptions = buildDictOptions('pet_life_stage', () => [
    { value: 1, label: 'Juvenile' },
    { value: 2, label: 'Adult' },
    { value: 3, label: 'Senior' },
  ]);

  const queueEventOptions = buildDictOptions('vpet_queue_event_type', () => [
    { value: 1, label: 'Checked into queue' },
    { value: 2, label: 'Called by doctor' },
    { value: 3, label: 'Consultation started' },
    { value: 4, label: 'Consultation ended' },
    { value: 5, label: 'Missed' },
  ]);

  const nursingExecutionStatusOptions = buildDictOptions('vpet_nursing_execution_status', () => [
    { value: 1, label: 'Pending' },
    { value: 2, label: 'Executed' },
  ]);

  const consentCategoryOptions = buildDictOptions('vpet_consent_category', () => [
    { value: 'examination', label: '基础/专项检查' },
    { value: 'lab', label: '化验采样' },
    { value: 'imaging', label: '影像检查' },
    { value: 'anesthesia', label: '麻醉镇静' },
    { value: 'surgery', label: '手术治疗' },
    { value: 'dental', label: '口腔治疗' },
    { value: 'hospitalization', label: '住院监护' },
    { value: 'emergency', label: '急危重症' },
    { value: 'treatment', label: '治疗处置' },
    { value: 'medication', label: '特殊用药' },
    { value: 'transfusion', label: '输血血制品' },
    { value: 'vaccination', label: '疫苗接种' },
    { value: 'prevention', label: '预防保健' },
    { value: 'isolation', label: '传染病隔离' },
    { value: 'referral', label: '转诊' },
    { value: 'refusal', label: '拒绝/延迟治疗' },
    { value: 'homecare', label: '居家护理' },
    { value: 'chronic', label: '慢病管理' },
    { value: 'grooming', label: '美容洗护' },
    { value: 'boarding', label: '寄养看护' },
    { value: 'euthanasia', label: '安乐/遗体处理' },
    { value: 'other', label: '其他' },
  ], 'string');

  const consentRiskLevelOptions = buildDictOptions('vpet_consent_risk_level', () => [
    { value: 'low', label: '低风险' },
    { value: 'medium', label: '中风险' },
    { value: 'high', label: '高风险' },
    { value: 'critical', label: '重大风险' },
  ], 'string');

  const consentRecordStatusOptions = buildDictOptions('vpet_consent_record_status', () => [
    { value: 1, label: '待签署' },
    { value: 2, label: '已签署' },
    { value: 3, label: '已作废' },
  ]);

  function speciesText(species?: string) {
    return buildOptionText(speciesOptions.value, species, t('common.none'));
  }

  function appointmentStatusText(status?: number) {
    return buildOptionText(appointmentStatusOptions.value, status, t('common.unknown'));
  }

  function appointmentStatusColor(status?: number) {
    return { 1: 'blue', 2: 'orange', 3: 'green', 4: 'red' }[status || 0] || 'default';
  }

  function visitStatusText(status?: number) {
    return buildOptionText(visitStatusOptions.value, status, t('common.unknown'));
  }

  function visitStatusColor(status?: number) {
    return { 1: 'blue', 2: 'gold', 3: 'processing', 4: 'green', 6: 'default' }[status || 0] || 'default';
  }

  function paymentMethodText(method?: number) {
    return buildOptionText(paymentMethodOptions.value, method, t('common.none'));
  }

  function paymentStatusText(status?: number) {
    return buildOptionText(paymentStatusOptions.value, status, t('common.unknown'));
  }

  function paymentStatusColor(status?: number) {
    return { 1: 'orange', 2: 'blue', 3: 'green', 4: 'red', 5: 'cyan' }[status || 0] || 'default';
  }

  function paymentDirectionText(direction?: number) {
    return buildOptionText(paymentDirectionOptions.value, direction, t('common.unknown'));
  }

  function prescriptionStatusText(status?: number) {
    return buildOptionText(prescriptionStatusOptions.value, status, t('common.unknown'));
  }

  function prescriptionStatusColor(status?: number) {
    return { 1: 'default', 2: 'blue', 3: 'orange', 4: 'green', 5: 'red' }[status || 0] || 'default';
  }

  function prescriptionTypeText(type?: number) {
    return buildOptionText(prescriptionTypeOptions.value, type, t('common.unknown'));
  }

  function prescriptionTypeColor(type?: number) {
    return { 1: 'blue', 2: 'volcano', 3: 'green' }[type || 0] || 'default';
  }

  function printTemplateTypeText(type?: string) {
    return buildOptionText(printTemplateTypeOptions.value, type, t('common.unknown'));
  }

  function doctorStatusText(status?: number) {
    return buildOptionText(doctorStatusOptions.value, status, t('common.unknown'));
  }

  function labStatusText(status?: number) {
    return buildOptionText(labStatusOptions.value, status, t('common.unknown'));
  }

  function labStatusColor(status?: number) {
    return { 1: 'blue', 2: 'gold', 4: 'green' }[status || 0] || 'default';
  }

  function hospitalizationStatusText(status?: number) {
    return buildOptionText(hospitalizationStatusOptions.value, status, t('common.unknown'));
  }

  function hospitalizationStatusColor(status?: number) {
    return { 1: 'orange', 2: 'green' }[status || 0] || 'default';
  }

  function reminderStatusText(status?: number) {
    return buildOptionText(reminderStatusOptions.value, status, t('common.unknown'));
  }

  function reminderStatusColor(status?: number) {
    return { 1: 'blue', 2: 'gold', 3: 'green', 4: 'red' }[status || 0] || 'default';
  }

  function insuranceStatusText(status?: number) {
    return buildOptionText(insuranceStatusOptions.value, status, t('common.unknown'));
  }

  function insuranceStatusColor(status?: number) {
    return { 1: 'orange', 2: 'blue', 3: 'green' }[status || 0] || 'default';
  }

  function transferStatusText(status?: number) {
    return buildOptionText(transferStatusOptions.value, status, t('common.unknown'));
  }

  function transferStatusColor(status?: number) {
    return { 1: 'orange', 2: 'blue', 3: 'green' }[status || 0] || 'default';
  }

  function petStatusText(status?: number) {
    return buildOptionText(petStatusOptions.value, status, t('common.unknown'));
  }

  function petStatusColor(status?: number) {
    return { 1: 'green', 2: 'orange', 3: 'volcano', 4: 'red' }[status || 0] || 'default';
  }

  function pharmacyStatusText(status?: number) {
    return buildOptionText(pharmacyStatusOptions.value, status, t('common.unknown'));
  }

  function pharmacyStatusColor(status?: number) {
    return { 1: 'green', 0: 'default' }[status ?? 0] || 'default';
  }

  function formatWeight(weight?: number | string | null) {
    if (weight === undefined || weight === null || weight === '') {
      return '-';
    }
    return `${weight} ${t('page.pet.fields.weightUnit')}`;
  }

  function genderText(gender?: number) {
    return buildOptionText(genderOptions.value, gender, t('common.unknown'));
  }

  function genderSymbol(gender?: number) {
    if (String(gender) === '1') return 'M';
    if (String(gender) === '2') return 'F';
    return '?';
  }

  function neuteredText(value?: number) {
    return buildOptionText(neuteredOptions.value, value, t('common.none'));
  }

  function livingEnvironmentText(value?: number) {
    return buildOptionText(livingEnvironmentOptions.value, value, t('common.none'));
  }

  function reproductiveStatusText(value?: number) {
    return buildOptionText(reproductiveStatusOptions.value, value, t('common.none'));
  }

  function lifeStageText(value?: number) {
    return buildOptionText(lifeStageOptions.value, value, t('common.none'));
  }

  function queueEventText(value?: number) {
    return buildOptionText(queueEventOptions.value, value, t('common.unknown'));
  }

  function nursingExecutionStatusText(value?: number) {
    return buildOptionText(nursingExecutionStatusOptions.value, value, t('common.unknown'));
  }

  function nursingExecutionStatusColor(value?: number) {
    return { 1: 'orange', 2: 'green' }[value || 0] || 'default';
  }

  function consentCategoryText(value?: string) {
    return buildOptionText(consentCategoryOptions.value, value, t('common.unknown'));
  }

  function consentRiskLevelText(value?: string) {
    return buildOptionText(consentRiskLevelOptions.value, value, t('common.unknown'));
  }

  function consentRiskLevelColor(value?: string) {
    return { low: 'green', medium: 'gold', high: 'orange', critical: 'red' }[value || ''] || 'default';
  }

  function consentRecordStatusText(value?: number) {
    return buildOptionText(consentRecordStatusOptions.value, value, t('common.unknown'));
  }

  function consentRecordStatusColor(value?: number) {
    return { 1: 'blue', 2: 'green', 3: 'red' }[value || 0] || 'default';
  }

  return {
    t,
    speciesOptions,
    appointmentStatusOptions,
    visitStatusOptions,
    paymentMethodOptions,
    paymentStatusOptions,
    paymentDirectionOptions,
    prescriptionStatusOptions,
    prescriptionTypeOptions,
    printTemplateTypeOptions,
    doctorStatusOptions,
    petStatusOptions,
    pharmacyStatusOptions,
    labStatusOptions,
    hospitalizationStatusOptions,
    reminderStatusOptions,
    insuranceStatusOptions,
    transferStatusOptions,
    pharmacyBatchStatusOptions,
    genderOptions,
    neuteredOptions,
    livingEnvironmentOptions,
    reproductiveStatusOptions,
    lifeStageOptions,
    queueEventOptions,
    nursingExecutionStatusOptions,
    consentCategoryOptions,
    consentRiskLevelOptions,
    consentRecordStatusOptions,
    speciesText,
    appointmentStatusText,
    appointmentStatusColor,
    visitStatusText,
    visitStatusColor,
    paymentMethodText,
    paymentStatusText,
    paymentStatusColor,
    paymentDirectionText,
    prescriptionStatusText,
    prescriptionStatusColor,
    prescriptionTypeText,
    prescriptionTypeColor,
    printTemplateTypeText,
    doctorStatusText,
    labStatusText,
    labStatusColor,
    hospitalizationStatusText,
    hospitalizationStatusColor,
    reminderStatusText,
    reminderStatusColor,
    insuranceStatusText,
    insuranceStatusColor,
    transferStatusText,
    transferStatusColor,
    petStatusText,
    petStatusColor,
    pharmacyStatusText,
    pharmacyStatusColor,
    formatWeight,
    genderText,
    genderSymbol,
    neuteredText,
    livingEnvironmentText,
    reproductiveStatusText,
    lifeStageText,
    queueEventText,
    nursingExecutionStatusText,
    nursingExecutionStatusColor,
    consentCategoryText,
    consentRiskLevelText,
    consentRiskLevelColor,
    consentRecordStatusText,
    consentRecordStatusColor,
  };
}
