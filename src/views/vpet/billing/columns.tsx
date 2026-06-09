import { Tag } from 'ant-design-vue';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';

export function createBillingColumns(resolveVisitLabel?: (visitId?: number) => string) {
  const { t, paymentMethodText, paymentStatusColor, paymentStatusText } = useVpetLocale();
  const { orphanLabel } = useVpetReference();

  return [
    { title: t('page.billing.fields.billNo'), dataIndex: 'billNo', width: 160 },
    {
      title: t('page.billing.fields.visit'),
      dataIndex: 'visitId',
      width: 220,
      customRender: ({ text }: any) => resolveVisitLabel ? resolveVisitLabel(text) : orphanLabel(text),
    },
    {
      title: t('page.billing.fields.amount'),
      dataIndex: 'totalAmount',
      width: 120,
      customRender: ({ text }: any) => `${text ?? 0} ${t('common.amountUnit')}`,
    },
    {
      title: t('page.billing.fields.paymentStatus'),
      dataIndex: 'paymentStatus',
      width: 100,
      customRender: ({ record }: any) => (
        <Tag color={paymentStatusColor(record.paymentStatus)}>{paymentStatusText(record.paymentStatus)}</Tag>
      ),
    },
    {
      title: t('page.billing.fields.paymentMethod'),
      dataIndex: 'paymentMethod',
      width: 100,
      customRender: ({ record }: any) => paymentMethodText(record.paymentMethod),
    },
    {
      title: t('page.billing.confirmPayment'),
      dataIndex: 'paidAt',
      width: 160,
      customRender: ({ text }: any) => text ? formatToDateTime(text) : '-',
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      width: 160,
      customRender: ({ text }: any) => text ? formatToDateTime(text) : '-',
    },
  ];
}
