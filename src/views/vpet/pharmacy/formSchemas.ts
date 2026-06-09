import { useVpetLocale } from '../shared/locale';

export function createDrugSchemas() {
  const { t } = useVpetLocale();

  return [
    { field: 'drugCode', label: t('page.pharmacy.fields.drugCode'), component: 'Input', required: true, colProps: { span: 12 } },
    { field: 'drugName', label: t('page.pharmacy.fields.drugName'), component: 'Input', required: true, colProps: { span: 12 } },
    { field: 'specification', label: t('page.pharmacy.fields.specification'), component: 'Input', placeholder: t('page.pharmacy.placeholders.specification'), colProps: { span: 12 } },
    { field: 'unit', label: t('page.pharmacy.fields.packageUnit'), component: 'Input', colProps: { span: 6 } },
    { field: 'dosageUnit', label: t('page.pharmacy.fields.dosageUnit'), component: 'Input', colProps: { span: 6 } },
    { field: 'packageContentQuantity', label: t('page.pharmacy.fields.packageContentQuantity'), component: 'InputNumber', colProps: { span: 8 } },
    { field: 'retailPrice', label: t('page.pharmacy.fields.packageRetailPrice'), component: 'InputNumber', colProps: { span: 8 } },
    { field: 'dosageUnitPrice', label: t('page.pharmacy.fields.dosageUnitPrice'), component: 'InputNumber', colProps: { span: 8 } },
    { field: 'minStock', label: t('page.pharmacy.fields.minPackageStock'), component: 'InputNumber', colProps: { span: 8 } },
    { field: 'supplier', label: t('page.pharmacy.fields.supplier'), component: 'Input', colProps: { span: 16 } },
  ];
}
