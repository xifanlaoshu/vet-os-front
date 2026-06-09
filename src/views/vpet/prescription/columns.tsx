import { Tag } from 'ant-design-vue';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

export function createPrescriptionColumns(resolveVisitLabel?: (visitId?: number) => string) {
  const { t, prescriptionStatusColor, prescriptionStatusText } = useVpetLocale();
  const { orphanLabel } = useVpetReference();

  return [
    { title: t('page.prescription.fields.rxNo'), dataIndex: 'rxNo', width: 160 },
    {
      title: t('page.prescription.fields.visit'),
      dataIndex: 'visitId',
      width: 220,
      customRender: ({ text }: any) => resolveVisitLabel ? resolveVisitLabel(text) : orphanLabel(text),
    },
    {
      title: t('page.prescription.fields.diagnosisSummary'),
      dataIndex: 'diagnosisSummary',
      customRender: ({ text }: any) => text || '-',
    },
    {
      title: t('page.billing.fields.amount'),
      dataIndex: 'totalAmount',
      width: 100,
      customRender: ({ text }: any) => `${text ?? 0} ${t('common.amountUnit')}`,
    },
    {
      title: t('page.pet.fields.status'),
      dataIndex: 'status',
      width: 100,
      customRender: ({ record }: any) => (
        <Tag color={prescriptionStatusColor(record.status)}>{prescriptionStatusText(record.status)}</Tag>
      ),
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      width: 160,
      customRender: ({ text }: any) => text ? formatToDateTime(text) : '-',
    },
  ];
}
