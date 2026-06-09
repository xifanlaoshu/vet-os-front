import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';

export function createCustomerColumns() {
  const { t } = useVpetLocale();

  return [
    { title: t('page.customer.fields.name'), dataIndex: 'name', width: 120 },
    { title: t('page.customer.fields.phone'), dataIndex: 'phone', width: 140 },
    {
      title: t('page.customer.fields.address'),
      dataIndex: 'address',
      customRender: ({ text }: any) => text || '-',
    },
    {
      title: t('page.customer.fields.remark'),
      dataIndex: 'remark',
      width: 160,
      customRender: ({ text }: any) => text || '-',
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      width: 160,
      customRender: ({ text }: any) => text ? formatToDateTime(text) : '-',
    },
  ];
}
