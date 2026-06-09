import { Tag } from 'ant-design-vue';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';

export function createPetColumns() {
  const { t, genderSymbol, petStatusColor, petStatusText, speciesText, formatWeight } = useVpetLocale();

  return [
    { title: t('page.pet.fields.name'), dataIndex: 'name' },
    {
      title: t('page.pet.fields.species'),
      dataIndex: 'species',
      width: 80,
      customRender: ({ text }: any) => speciesText(text),
    },
    { title: t('page.pet.fields.breed'), dataIndex: 'breed', width: 120 },
    {
      title: t('page.pet.fields.gender'),
      dataIndex: 'gender',
      width: 60,
      customRender: ({ record }: any) => <Tag color={record.gender === 1 ? 'blue' : 'pink'}>{genderSymbol(record.gender)}</Tag>,
    },
    {
      title: t('page.pet.fields.weight'),
      dataIndex: 'weight',
      width: 80,
      customRender: ({ text }: any) => formatWeight(text),
    },
    {
      title: t('page.pet.fields.status'),
      dataIndex: 'status',
      width: 80,
      customRender: ({ record }: any) => <Tag color={petStatusColor(record.status)}>{petStatusText(record.status)}</Tag>,
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      width: 160,
      customRender: ({ text }: any) => text ? formatToDateTime(text) : '-',
    },
  ];
}
