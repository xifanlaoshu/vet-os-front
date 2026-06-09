import { useI18n } from '@/hooks/useI18n';
import Api from '@/api/backend/api';
import { vpetCustomerList, vpetDoctorAll, vpetPetList, vpetVisitList } from '@/api/backend/vpet';

export type SelectOption<T = any> = {
  value: number | string;
  label: string;
  raw?: T;
};

type DictValueType = 'string' | 'number';

const MASTER_DATA_PAGE_SIZE = 100;
const dictTypeIdCache = new Map<string, number>();
const dictRawItemCache = new Map<string, any[]>();
const dictPendingCache = new Map<string, Promise<any[]>>();

function parseDictValue(value: any, valueType: DictValueType) {
  if (valueType !== 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

export function useVpetReference() {
  const { t } = useI18n('vpet');

  function filterByLabel(input: string, option: any) {
    return String(option?.label || '').toLowerCase().includes(input.toLowerCase());
  }

  function translateDictLabel(dictCode: string, value: string | number, fallbackLabel?: string) {
    const items = dictRawItemCache.get(dictCode) || [];
    const matched = items.find(item => String(item.value) === String(value));
    return matched?.label || fallbackLabel || String(value);
  }

  async function ensureDictTypeMap() {
    if (dictTypeIdCache.size > 0) return;
    const types = await Api.systemDictType.dictTypeGetAll();
    (types || []).forEach((item: any) => {
      dictTypeIdCache.set(item.code, item.id);
    });
  }

  async function loadRawDictItems(dictCode: string) {
    if (dictRawItemCache.has(dictCode)) {
      return dictRawItemCache.get(dictCode) || [];
    }
    if (dictPendingCache.has(dictCode)) {
      return dictPendingCache.get(dictCode) || [];
    }
    const pending = (async () => {
      await ensureDictTypeMap();
      const typeId = dictTypeIdCache.get(dictCode);
      if (!typeId) {
        dictRawItemCache.set(dictCode, []);
        return [];
      }
      const res = await Api.systemDictItem.dictItemList({
        typeId,
        page: 1,
        pageSize: MASTER_DATA_PAGE_SIZE,
      });
      const items = res?.items || [];
      dictRawItemCache.set(dictCode, items);
      return items;
    })().finally(() => {
      dictPendingCache.delete(dictCode);
    });
    dictPendingCache.set(dictCode, pending);
    return pending;
  }

  async function loadDictOptions(dictCode: string, valueType: DictValueType = 'string') {
    const items = await loadRawDictItems(dictCode);
    return items.map((item: any) => ({
      value: parseDictValue(item.value, valueType),
      label: item.label,
      raw: item,
    })) as SelectOption[];
  }

  function findOption<T = any>(options: SelectOption<T>[], value?: string | number | null) {
    if (value === undefined || value === null || value === '') return undefined;
    return options.find(item => String(item.value) === String(value));
  }

  function optionLabel(options: SelectOption[], value?: string | number | null, fallback = '-') {
    return findOption(options, value)?.label || fallback;
  }

  function orphanLabel(value?: string | number | null) {
    if (value === undefined || value === null || value === '') return '-';
    return `${t('common.unknown')} #${value}`;
  }

  function buildCustomerLabel(item: any) {
    if (!item) return '';
    return [item.name, item.phone].filter(Boolean).join(' / ');
  }

  function buildPetLabel(item: any) {
    if (!item) return '';
    return [item.name, translateDictLabel('pet_species', item.species, item.species), item.breed].filter(Boolean).join(' / ');
  }

  function buildDoctorLabel(item: any) {
    if (!item) return '';
    const positionLabel = item.position
      ? translateDictLabel('vpet_staff_position', item.position, item.position)
      : '';
    const departmentLabel = item.department
      ? translateDictLabel('vpet_doctor_department', item.department, item.department)
      : '';
    return [item.name, positionLabel, item.title || departmentLabel].filter(Boolean).join(' / ');
  }

  function buildVisitLabel(item: any) {
    if (!item) return '';
    return [item.visitNo, petLabel(item.pet, item.petSnapshot, item.petId), customerLabel(item.customer, item.customerSnapshot, item.customerId)]
      .filter(Boolean)
      .join(' / ');
  }

  function customerLabel(customer?: any, snapshot?: any, customerId?: string | number | null) {
    return buildCustomerLabel(customer || snapshot) || orphanLabel(customerId);
  }

  function petLabel(pet?: any, snapshot?: any, petId?: string | number | null) {
    return buildPetLabel(pet || snapshot) || orphanLabel(petId);
  }

  function doctorLabel(
    doctor?: any,
    doctorId?: string | number | null,
    fallbackName?: string,
    options: SelectOption[] = [],
  ) {
    return buildDoctorLabel(doctor) || fallbackName || optionLabel(options, doctorId, orphanLabel(doctorId));
  }

  function visitLabel(options: SelectOption[], visitId?: string | number | null) {
    return optionLabel(options, visitId, orphanLabel(visitId));
  }

  function drugLabel(drug?: any, fallbackName?: string, drugId?: string | number | null) {
    return drug?.drugName || fallbackName || orphanLabel(drugId);
  }

  async function loadCustomers() {
    const res: any = await vpetCustomerList({ page: 1, pageSize: MASTER_DATA_PAGE_SIZE });
    return ((res?.items || []) as any[]).map(item => ({
      value: item.id,
      label: buildCustomerLabel(item),
      raw: item,
    })) as SelectOption[];
  }

  async function loadPets(customerId?: number) {
    if (!customerId) return [];
    await loadRawDictItems('pet_species');
    const res: any = await vpetPetList({ page: 1, pageSize: MASTER_DATA_PAGE_SIZE, customerId });
    return ((res?.items || []) as any[]).map(item => ({
      value: item.id,
      label: buildPetLabel(item),
      raw: item,
    })) as SelectOption[];
  }

  async function loadDoctors() {
    await Promise.all([
      loadRawDictItems('vpet_doctor_department'),
      loadRawDictItems('vpet_staff_position'),
    ]);
    const res: any[] = await vpetDoctorAll();
    return (res || []).map(item => ({
      value: item.id,
      label: buildDoctorLabel(item),
      raw: item,
    })) as SelectOption[];
  }

  async function loadVisits(params: Record<string, any> = {}) {
    const res: any = await vpetVisitList({ page: 1, pageSize: MASTER_DATA_PAGE_SIZE, ...params });
    return ((res?.items || []) as any[]).map(item => ({
      value: item.id,
      label: buildVisitLabel(item),
      raw: item,
    })) as SelectOption[];
  }

  function getVisitRelation(visit: any) {
    return {
      customerId: visit?.customerId,
      petId: visit?.petId,
      doctorId: visit?.doctorId,
    };
  }

  return {
    MASTER_DATA_PAGE_SIZE,
    filterByLabel,
    translateDictLabel,
    loadDictOptions,
    findOption,
    optionLabel,
    orphanLabel,
    customerLabel,
    petLabel,
    doctorLabel,
    visitLabel,
    drugLabel,
    loadCustomers,
    loadPets,
    loadDoctors,
    loadVisits,
    getVisitRelation,
  };
}
