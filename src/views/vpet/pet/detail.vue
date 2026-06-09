<template>
  <div class="vpet-page vpet-stack">
    <a-page-header @back="router.back()" :title="pet.name || t('page.pet.detailTitle')" :subtitle="petSubtitle">
      <template #extra>
        <a-space>
          <a-button @click="router.push({ path: '/vpet/chronic', query: { petId: pet.id, customerId: pet.customerId } })">
            {{ t('page.chronic.title') }}
          </a-button>
          <a-tag :color="pet.gender === 1 ? 'blue' : 'pink'">{{ genderText(pet.gender) }}</a-tag>
          <a-tag :color="petStatusColor(pet.status)">{{ petStatusText(pet.status) }}</a-tag>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="vpet-grid-row">
      <a-col :span="16" class="vpet-stack">
        <a-card class="vpet-detail-card" :title="t('page.pet.baseInfo')" size="small">
          <a-descriptions :column="2" size="small">
            <a-descriptions-item :label="t('page.pet.fields.name')">{{ pet.name || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.breed')">{{ pet.breed || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.species')">{{ speciesText(pet.species) }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.gender')">{{ genderText(pet.gender) }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.color')">{{ pet.color || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.birthday')">
              {{ pet.birthday || '-' }} / {{ ageText }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.weight')">
              {{ pet.weight ? `${pet.weight} kg` : '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.neutered')">
              {{ neuteredText(pet.neutered) }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.microchipId')">{{ pet.microchipId || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.allergy')">{{ pet.allergy || t('common.none') }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.behaviorTag')">{{ pet.behaviorTag || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.livingEnvironment')">
              {{ livingEnvironmentText(pet.livingEnvironment) }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.pet.visitHistory')" size="small">
          <a-table :data-source="visits" :columns="visitColumns" row-key="id" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="visitStatusColor(record.status)">{{ visitStatusText(record.status) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'diagnosis'">
                {{ diagnosisText(record) }}
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" size="small" @click="router.push(`/vpet/consultation/visit/${record.id}`)">
                  {{ t('common.viewMedicalRecord') }}
                </a-button>
              </template>
            </template>
          </a-table>
          <a-empty v-if="visits.length === 0" :description="t('page.pet.emptyVisits')" />
        </a-card>
      </a-col>

      <a-col :span="8">
        <a-card class="vpet-detail-card" :title="t('page.pet.extraInfo')" size="small">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="t('page.pet.fields.dietBrand')">{{ pet.dietBrand || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.recentTravel')">{{ pet.recentTravel || '-' }}</a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.reproductiveStatus')">
              {{ reproductiveStatusText(pet.reproductiveStatus) }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.lifeStage')">
              {{ lifeStageText(pet.lifeStage) }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.pet.fields.medicalHistory')">
              <div class="vpet-pre-wrap">{{ pet.medicalHistory || t('common.none') }}</div>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { vpetPetGet, vpetVisitList } from '@/api/backend/vpet';
import { formatToDateTime } from '@/utils/dateUtil';
import { useVpetLocale } from '../shared/locale';

defineOptions({ name: 'VPetPetDetail' });

const {
  t,
  genderText,
  lifeStageText,
  livingEnvironmentText,
  neuteredText,
  petStatusColor,
  petStatusText,
  reproductiveStatusText,
  speciesText,
  visitStatusColor,
  visitStatusText,
} = useVpetLocale();
const route = useRoute();
const router = useRouter();
const pet = ref<any>({});
const visits = ref<any[]>([]);

const visitColumns = [
  { title: t('page.consultation.fields.visitNo'), dataIndex: 'visitNo', width: 160 },
  { title: t('page.consultation.fields.chiefComplaint'), dataIndex: 'chiefComplaint', ellipsis: true },
  { title: t('page.consultation.fields.diagnosis'), key: 'diagnosis', ellipsis: true },
  { title: t('page.consultation.fields.visitStatus'), key: 'status', width: 110 },
  {
    title: t('page.consultation.fields.endTime'),
    dataIndex: 'endTime',
    width: 180,
    customRender: ({ text }: any) => (text ? formatToDateTime(text) : '-'),
  },
  { title: t('common.action'), key: 'action', width: 120 },
];

const petSubtitle = computed(() => [speciesText(pet.value.species), pet.value.breed].filter(Boolean).join(' / '));
const ageText = computed(() => {
  if (!pet.value.birthday) return '-';
  const diff = Date.now() - new Date(pet.value.birthday).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  if (years >= 1) {
    return t('page.pet.ageYears', { count: years });
  }
  const months = Math.max(Math.floor(diff / (30 * 24 * 60 * 60 * 1000)), 0);
  return t('page.pet.ageMonths', { count: months });
});

function diagnosisText(record: any) {
  let items = Array.isArray(record.diagnoses) ? record.diagnoses : record.diagnosis;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  items = Array.isArray(items) ? items : [];
  return items.map((item: any) => item.name || item.code).filter(Boolean).join(' / ') || '-';
}

onMounted(async () => {
  const id = Number(route.params.id);
  const [petData, visitData] = await Promise.all([
    vpetPetGet(id),
    vpetVisitList({ petId: id, page: 1, pageSize: 50 }),
  ]);
  pet.value = petData;
  visits.value = (visitData as any)?.items || [];
});
</script>
