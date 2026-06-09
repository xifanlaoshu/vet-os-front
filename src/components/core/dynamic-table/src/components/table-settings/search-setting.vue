<template>
  <template v-if="formSchemas?.length && tableProps.search">
    <Tooltip placement="top">
      <template #title>
        <span>{{ innerPropsRef.search ? t('component.table.hideSearch') : t('component.table.showSearch') }}</span>
      </template>
      <SearchOutlined @click="toggle" />
    </Tooltip>
  </template>
</template>

<script lang="ts" setup>
  import { SearchOutlined } from '@ant-design/icons-vue';
  import { Tooltip } from 'ant-design-vue';
  import { useTableContext } from '../../hooks/useTableContext';
  import { useI18n } from '@/hooks/useI18n';

  const { tableProps, innerPropsRef, setProps, formSchemas } = useTableContext();
  const { t } = useI18n();

  function toggle() {
    setProps({
      search: !innerPropsRef.value.search,
    });
  }
</script>
