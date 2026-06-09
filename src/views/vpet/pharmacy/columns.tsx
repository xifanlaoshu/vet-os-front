import { Tag } from 'ant-design-vue';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';

export function createPharmacyColumns() {
  const { t, pharmacyStatusColor, pharmacyStatusText } = useVpetLocale();

  return [
    { title: t('page.pharmacy.fields.drugCode'), dataIndex: 'drugCode', width: 100 },
    { title: t('page.pharmacy.fields.drugName'), dataIndex: 'drugName', width: 160 },
    { title: t('page.pharmacy.fields.specification'), dataIndex: 'specification', width: 120 },
    {
      title: t('page.pharmacy.fields.packageConversion'),
      key: 'packageConversion',
      width: 150,
      customRender: ({ record }: any) => {
        const packageQuantity = Number(record.packageContentQuantity || 1);
        return <span>{`1 ${record.packageUnit || record.unit || ''} = ${packageQuantity} ${record.dosageUnit || record.unit || ''}`}</span>;
      },
    },
    {
      title: t('page.pharmacy.fields.currentStock'),
      dataIndex: 'currentStock',
      width: 150,
      customRender: ({ record }: any) => {
        const minDosageStock = Number(record.minStock || 0) * Number(record.packageContentQuantity || 1);
        const isLow = Number(record.currentStock || 0) <= minDosageStock;
        const dosageText = `${Number(record.currentStock || 0).toFixed(2)} ${record.dosageUnit || record.unit || ''}`;
        const packageText = `${Number(record.currentPackageStock || 0).toFixed(2)} ${record.packageUnit || record.unit || ''}`;
        return (
          <span style={{ color: isLow ? 'red' : undefined, fontWeight: isLow ? 'bold' : undefined }}>
            {dosageText} / {packageText}
          </span>
        );
      },
    },
    {
      title: t('page.pharmacy.fields.packageRetailPrice'),
      dataIndex: 'packageRetailPrice',
      width: 110,
      customRender: ({ record, text }: any) => `${Number(text ?? record.retailPrice ?? 0).toFixed(2)} ${t('common.amountUnit')}`,
    },
    {
      title: t('page.pharmacy.fields.dosageUnitPrice'),
      dataIndex: 'dosageUnitPrice',
      width: 120,
      customRender: ({ record, text }: any) => `${Number(text ?? record.retailPrice ?? 0).toFixed(2)} ${t('common.amountUnit')}/${record.dosageUnit || record.unit || ''}`,
    },
    { title: t('page.pharmacy.fields.minPackageStock'), dataIndex: 'minStock', width: 90 },
    {
      title: t('page.pharmacy.fields.status'),
      dataIndex: 'status',
      width: 80,
      hideInSearch: true,
      customRender: ({ record }: any) => <Tag color={pharmacyStatusColor(record.status)}>{pharmacyStatusText(record.status)}</Tag>,
    },
    {
      title: t('common.updatedAt'),
      dataIndex: 'updatedAt',
      width: 160,
      hideInSearch: true,
      customRender: ({ text }: any) => text ? formatToDateTime(text) : '-',
    },
  ];
}
