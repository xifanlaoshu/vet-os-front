<template>
  <a-form :model="modelValue" layout="vertical">
    <a-row :gutter="16">
      <a-col :span="8"><a-form-item :label="t('page.petForm.fields.name')"><a-input v-model:value="modelValue.name" /></a-form-item></a-col>
      <a-col :span="8"><a-form-item :label="t('page.petForm.fields.species')">
        <a-select
          v-model:value="modelValue.species"
          :options="speciesOpts"
          :get-popup-container="getPopupContainer"
          @change="onSpeciesChange"
        />
      </a-form-item></a-col>
      <a-col :span="8"><a-form-item :label="t('page.petForm.fields.gender')">
        <a-select
          v-model:value="modelValue.gender"
          :options="genderOptions"
          :get-popup-container="getPopupContainer"
        />
      </a-form-item></a-col>
    </a-row>
    <a-row :gutter="16">
      <a-col :span="12"><a-form-item :label="t('page.petForm.fields.breed')">
        <a-select
          v-if="hasBreedDict"
          v-model:value="modelValue.breed"
          :options="breedOpts"
          :get-popup-container="getPopupContainer"
          allow-clear
        />
        <a-input v-else v-model:value="modelValue.breed" :placeholder="t('page.petForm.breedPlaceholder')" />
      </a-form-item></a-col>
      <a-col :span="6"><a-form-item :label="t('page.petForm.fields.birthday')"><a-date-picker v-model:value="modelValue.birthdayPicker" style="width:100%" /></a-form-item></a-col>
      <a-col :span="6"><a-form-item :label="t('page.petForm.fields.color')"><a-input v-model:value="modelValue.color" /></a-form-item></a-col>
    </a-row>
    <a-row :gutter="16">
      <a-col :span="8"><a-form-item :label="t('page.petForm.fields.weight')"><a-input-number v-model:value="modelValue.weight" :min="0" :step="0.1" style="width:100%" /></a-form-item></a-col>
      <a-col :span="8"><a-form-item :label="t('page.petForm.fields.neutered')">
        <a-select
          v-model:value="modelValue.neutered"
          :options="neuteredOptions"
          :get-popup-container="getPopupContainer"
        />
      </a-form-item></a-col>
      <a-col :span="8"><a-form-item :label="t('page.petForm.fields.microchipId')"><a-input v-model:value="modelValue.microchipId" /></a-form-item></a-col>
    </a-row>
    <a-form-item :label="t('page.petForm.fields.allergy')"><a-input v-model:value="modelValue.allergy" /></a-form-item>
    <a-collapse>
      <a-collapse-panel key="more" :header="t('page.petForm.more')">
        <a-row :gutter="16">
          <a-col :span="12"><a-form-item :label="t('page.petForm.fields.behaviorTag')"><a-input v-model:value="modelValue.behaviorTag" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item :label="t('page.petForm.fields.livingEnvironment')">
            <a-select
              v-model:value="modelValue.livingEnvironment"
              :options="livingEnvironmentOptions"
              :get-popup-container="getPopupContainer"
              allow-clear
            />
          </a-form-item></a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12"><a-form-item :label="t('page.petForm.fields.otherPetsCount')"><a-input-number v-model:value="modelValue.otherPetsCount" :min="0" style="width:100%" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item :label="t('page.petForm.fields.reproductiveStatus')">
            <a-select
              v-model:value="modelValue.reproductiveStatus"
              :options="reproductiveStatusOptions"
              :get-popup-container="getPopupContainer"
              allow-clear
            />
          </a-form-item></a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12"><a-form-item :label="t('page.petForm.fields.dietBrand')"><a-input v-model:value="modelValue.dietBrand" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item :label="t('page.petForm.fields.recentTravel')"><a-input v-model:value="modelValue.recentTravel" /></a-form-item></a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24"><a-form-item :label="t('page.petForm.fields.medicalHistory')"><a-textarea v-model:value="modelValue.medicalHistory" :rows="4" /></a-form-item></a-col>
        </a-row>
      </a-collapse-panel>
    </a-collapse>
  </a-form>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useVpetLocale } from '../shared/locale';
import { resolveVpetPopupContainer } from '../shared/popup';
import { useVpetReference } from '../shared/reference';

const { modelValue } = defineProps<{ modelValue: any }>();
const emit = defineEmits<{ 'update:modelValue': [v: any] }>();

const { t } = useVpetLocale();
const { loadDictOptions } = useVpetReference();

const speciesOpts = ref<any[]>([]);
const breedOpts = ref<any[]>([]);
const hasBreedDict = ref(false);
const genderOptions = ref<any[]>([]);
const neuteredOptions = ref<any[]>([]);
const livingEnvironmentOptions = ref<any[]>([]);
const reproductiveStatusOptions = ref<any[]>([]);

function getPopupContainer(triggerNode: HTMLElement) {
  return resolveVpetPopupContainer(triggerNode);
}

watch(() => modelValue?.species, (val) => {
  if (val) {
    loadBreeds(val);
  }
}, { immediate: false });

async function loadSpecies() {
  speciesOpts.value = await loadDictOptions('pet_species');
}

async function loadBreeds(species: string) {
  const items = await loadDictOptions(`pet_breed_${species}`);
  if (items.length > 0) {
    hasBreedDict.value = true;
    breedOpts.value = items;
  } else {
    hasBreedDict.value = false;
    breedOpts.value = [];
    if (modelValue) {
      modelValue.breed = undefined;
    }
  }
}

async function loadPetMetaOptions() {
  const [gender, neutered, livingEnvironment, reproductiveStatus] = await Promise.all([
    loadDictOptions('pet_gender', 'number'),
    loadDictOptions('pet_neutered', 'number'),
    loadDictOptions('pet_living_environment', 'number'),
    loadDictOptions('pet_reproductive_status', 'number'),
  ]);
  genderOptions.value = gender;
  neuteredOptions.value = neutered;
  livingEnvironmentOptions.value = livingEnvironment;
  reproductiveStatusOptions.value = reproductiveStatus;
}

function onSpeciesChange(val: string) {
  if (modelValue) {
    modelValue.breed = undefined;
    emit('update:modelValue', { ...modelValue });
  }
  loadBreeds(val);
}

onMounted(async () => {
  await Promise.all([loadSpecies(), loadPetMetaOptions()]);
});
</script>
