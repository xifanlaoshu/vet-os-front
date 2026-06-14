<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" :title="t('page.printTemplate.title')" :bordered="false">
      <a-form class="vpet-query-form" layout="horizontal">
        <a-form-item :label="t('page.printTemplate.fields.templateType')">
          <a-select v-model:value="filters.templateType" allow-clear :options="printTemplateTypeOptions" />
        </a-form-item>
        <a-form-item :label="t('common.keyword')">
          <a-input v-model:value="filters.keyword" allow-clear />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadTemplates">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilters">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="openEditor()">{{ t('common.add') }}</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card class="vpet-panel-card vpet-list-card" :bordered="false">
      <a-table
        row-key="id"
        size="small"
        :loading="loading"
        :columns="columns"
        :data-source="templates"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'templateType'">
            <a-tag>{{ printTemplateTypeText(record.templateType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'defaultTemplate'">
            <a-tag :color="Number(record.defaultTemplate) === 1 ? 'green' : 'default'">
              {{ Number(record.defaultTemplate) === 1 ? t('common.yes') : t('common.no') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="Number(record.status) === 1 ? 'green' : 'default'">
              {{ Number(record.status) === 1 ? t('common.enabled') : t('common.disabled') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEditor(record)">{{ t('common.edit') }}</a-button>
              <a-button type="link" size="small" danger @click="disableTemplate(record)">{{ t('common.delete') }}</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="editorVisible" :title="editingId ? t('common.edit') : t('common.add')" width="920px" @ok="saveTemplate">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item :label="t('page.printTemplate.fields.code')" required>
              <a-input v-model:value="form.code" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.printTemplate.fields.name')" required>
              <a-input v-model:value="form.name" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.printTemplate.fields.templateType')" required>
              <a-select v-model:value="form.templateType" :options="printTemplateTypeOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.printTemplate.fields.paperType')">
              <a-select v-model:value="form.paperType" :options="paperTypeOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.printTemplate.fields.defaultTemplate')">
              <a-switch v-model:checked="defaultChecked" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item :label="t('page.printTemplate.fields.status')">
              <a-switch v-model:checked="statusChecked" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.printTemplate.fields.templateHeader')">
              <a-textarea v-model:value="form.templateHeader" :rows="3" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.printTemplate.fields.templateBody')" required>
              <a-textarea v-model:value="form.templateBody" :rows="8" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.printTemplate.fields.templateFooter')">
              <a-textarea v-model:value="form.templateFooter" :rows="3" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="t('page.printTemplate.fields.remark')">
              <a-input v-model:value="form.remark" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  vpetPrintTemplateCreate,
  vpetPrintTemplateDelete,
  vpetPrintTemplateList,
  vpetPrintTemplateUpdate,
} from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';

defineOptions({ name: 'VPetPrintTemplate' });

const { t, printTemplateTypeOptions, printTemplateTypeText } = useVpetLocale();

const paperTypeOptions = [
  { value: 'a4', label: 'A4' },
  { value: 'a5', label: 'A5' },
  { value: 'thermal_58', label: '58mm' },
  { value: 'thermal_80', label: '80mm' },
];

const loading = ref(false);
const templates = ref<any[]>([]);
const filters = ref({ templateType: undefined as string | undefined, keyword: '' });
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const editorVisible = ref(false);
const editingId = ref<number | undefined>();
const form = ref(emptyForm());

const defaultChecked = computed({
  get: () => Number(form.value.defaultTemplate) === 1,
  set: value => form.value.defaultTemplate = value ? 1 : 0,
});

const statusChecked = computed({
  get: () => Number(form.value.status) === 1,
  set: value => form.value.status = value ? 1 : 0,
});

const columns = [
  { title: t('page.printTemplate.fields.code'), dataIndex: 'code', width: 170 },
  { title: t('page.printTemplate.fields.name'), dataIndex: 'name', width: 180 },
  { title: t('page.printTemplate.fields.templateType'), key: 'templateType', width: 150 },
  { title: t('page.printTemplate.fields.paperType'), dataIndex: 'paperType', width: 110 },
  { title: t('page.printTemplate.fields.defaultTemplate'), key: 'defaultTemplate', width: 110 },
  { title: t('page.printTemplate.fields.status'), key: 'status', width: 100 },
  { title: t('page.printTemplate.fields.remark'), dataIndex: 'remark' },
  { title: t('common.action'), key: 'action', width: 140, fixed: 'right' as const },
];

function emptyForm() {
  return {
    code: '',
    name: '',
    templateType: 'prescription',
    paperType: 'a4',
    defaultTemplate: 0,
    templateHeader: '',
    templateBody: '',
    templateFooter: '',
    status: 1,
    remark: '',
  };
}

async function loadTemplates() {
  loading.value = true;
  try {
    const data: any = await vpetPrintTemplateList({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      templateType: filters.value.templateType,
      keyword: filters.value.keyword,
    });
    templates.value = data?.items || [];
    pagination.value.total = data?.meta?.totalItems || 0;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.value = { templateType: undefined, keyword: '' };
  pagination.value.current = 1;
  loadTemplates();
}

function handleTableChange(page: any) {
  pagination.value.current = page.current;
  pagination.value.pageSize = page.pageSize;
  loadTemplates();
}

function openEditor(record?: any) {
  editingId.value = record?.id;
  form.value = record ? { ...emptyForm(), ...record } : emptyForm();
  editorVisible.value = true;
}

async function saveTemplate() {
  if (!form.value.code || !form.value.name || !form.value.templateType || !form.value.templateBody) {
    message.warning(t('page.printTemplate.messages.required'));
    return;
  }
  const body = {
    ...form.value,
    styleConfig: JSON.stringify({ paperType: form.value.paperType }),
    variableSchema: JSON.stringify({ variables: [] }),
  };
  if (editingId.value) {
    await vpetPrintTemplateUpdate(editingId.value, body);
    message.success(t('page.printTemplate.messages.updated'));
  } else {
    await vpetPrintTemplateCreate(body);
    message.success(t('page.printTemplate.messages.created'));
  }
  editorVisible.value = false;
  await loadTemplates();
}

async function disableTemplate(record: any) {
  await vpetPrintTemplateDelete(record.id);
  message.success(t('page.printTemplate.messages.deleted'));
  await loadTemplates();
}

onMounted(loadTemplates);
</script>
