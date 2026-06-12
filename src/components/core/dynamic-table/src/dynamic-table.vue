<template>
  <div>
    <Teleport to="body" :disabled="!isFullscreen">
      <div ref="containerElRef" class="dynamic-table-shell">
        <SchemaForm
          v-if="innerPropsRef.search"
          ref="searchFormRef"
          class="dynamic-table-search"
          submit-on-reset
          v-bind="getFormProps"
          :table-instance="dynamicTableContext"
          @toggle-advanced="(e) => $emit('toggle-advanced', e)"
          @submit="handleSubmit"
        >
          <template v-for="item of getFormSlotKeys" #[replaceFormSlotKey(item)]="data">
            <slot :name="item" v-bind="data || {}" />
          </template>
        </SchemaForm>
        <div class="dynamic-table-panel" v-bind="panelAttrs">
          <ToolBar
            v-if="showToolBar"
            :export-file-name="allowClientExport ? exportFileName : ''"
            :title="headerTitle"
            :title-tooltip="titleTooltip"
            :show-table-setting="showTableSetting"
          >
            <template v-for="name of Object.keys($slots)" #[name]="data" :key="name">
              <slot :name="name" v-bind="data || {}" />
            </template>
          </ToolBar>
          <SchemaForm
            ref="editTableFormRef"
            no-style
            :initial-values="editFormModel"
            :show-action-button-group="false"
            :show-advanced-button="false"
            @validate="handleEditFormValidate"
          >
            <Table
              ref="tableRef"
              v-bind="tableProps"
              :columns="innerColumns"
              :data-source="tableData"
              @change="handleTableChange"
            >
              <template v-for="(_, slotName) of $slots" #[slotName]="slotData" :key="slotName">
                <slot :name="slotName" v-bind="slotData" />
              </template>
              <template #bodyCell="slotData">
                <slot name="bodyCell" v-bind="slotData" />
              </template>
            </Table>
          </SchemaForm>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="tsx" setup>
  import { computed, onBeforeMount, useAttrs } from 'vue';
  import { Table } from 'ant-design-vue';
  import {
    useTableMethods,
    createTableContext,
    useExportData2Excel,
    useTableForm,
    useTableState,
    useColumns,
  } from './hooks';
  import { ToolBar } from './components';
  import { dynamicTableProps, dynamicTableEmits } from './dynamic-table';
  import { SchemaForm } from '@/components/core/schema-form';

  defineOptions({
    name: 'DynamicTable',
    inheritAttrs: false,
  });

  const props = defineProps(dynamicTableProps);
  const emit = defineEmits(dynamicTableEmits);
  const attrs = useAttrs();

  // 表格内部状态
  const tableState = useTableState(props);
  const {
    tableRef,
    tableData,
    isFullscreen,
    containerElRef,
    searchFormRef,
    editTableFormRef,
    innerPropsRef,
    getBindValues,
    editFormModel,
  } = tableState;

  // 表格内部方法
  const tableMethods = useTableMethods({ props, emit, tableState });
  const { fetchData, handleSubmit, handleTableChange, handleEditFormValidate } = tableMethods;

  // 表格列的配置描述
  const { innerColumns } = useColumns({ props, tableState, tableMethods });

  // 搜索表单
  const tableForm = useTableForm({ tableState, tableMethods });
  const { getFormProps, replaceFormSlotKey, getFormSlotKeys } = tableForm;

  // 表单导出
  const exportData2ExcelHooks = useExportData2Excel({ props, tableState, tableMethods });

  // 当前组件所有的状态和方法
  const dynamicTableContext = {
    tableProps: props,
    emit,
    innerColumns,
    ...tableState,
    ...tableForm,
    ...tableMethods,
    ...exportData2ExcelHooks,
  };

  // 创建表格上下文
  createTableContext(dynamicTableContext);

  defineExpose(dynamicTableContext);

  const tableProps = computed<Recordable>(() => {
    const { getExpandOption } = tableMethods;
    return {
      ...getBindValues.value,
      ...getExpandOption.value,
    };
  });

  const panelAttrs = computed(() => attrs);

  onBeforeMount(() => {
    if (props.immediate) {
      fetchData();
    }
  });
</script>

<style lang="less" scoped>
  .dynamic-table-shell {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .dynamic-table-search {
    border: 1px solid #dbe7f3;
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 251, 255, 0.94)),
      #fff;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
    padding: 18px 20px 6px;
    overflow: hidden;
    background-clip: padding-box;
    isolation: isolate;
  }

  .dynamic-table-panel {
    border: 1px solid #dbe7f3;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
    overflow: hidden;
    background-clip: padding-box;
    isolation: isolate;
  }

  :deep(.dynamic-table-search .ant-form) {
    width: 100%;
  }

  :deep(.dynamic-table-search .ant-row) {
    row-gap: 10px;
  }

  :deep(.dynamic-table-search .ant-form-item) {
    margin-bottom: 10px;
  }

  :deep(.dynamic-table-search .ant-form-item-row) {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    align-items: center;
    column-gap: 12px;
  }

  :deep(.dynamic-table-search .ant-form-item-label) {
    padding: 0;
    text-align: right;
    white-space: nowrap;
    overflow: visible;
  }

  :deep(.dynamic-table-search .ant-form-item-label > label) {
    color: #54667a;
    font-size: 13px;
    font-weight: 600;
    height: 36px;
    justify-content: flex-end;
  }

  :deep(.dynamic-table-search .ant-input),
  :deep(.dynamic-table-search .ant-input-number),
  :deep(.dynamic-table-search .ant-picker),
  :deep(.dynamic-table-search .ant-select) {
    width: 100%;
  }

  :deep(.dynamic-table-search .ant-form-item-control-input) {
    min-height: 36px;
  }

  :deep(.dynamic-table-search .ant-form-item-control) {
    min-width: 0;
  }

  :deep(.dynamic-table-search .schema-form-action-col) {
    margin-left: auto;
  }

  :deep(.dynamic-table-search .schema-form-action-item) {
    margin-bottom: 0;
  }

  :deep(.dynamic-table-search .schema-form-action-item .ant-form-item-row) {
    display: block;
  }

  :deep(.dynamic-table-search .schema-form-action-item .ant-form-item-control-input-content) {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.dynamic-table-search .schema-form-action-item .ant-btn) {
    margin-right: 0 !important;
  }

  :deep(.dynamic-table-panel > .flex.justify-between) {
    padding: 18px 20px 12px !important;
    border-bottom: 1px solid rgba(219, 231, 243, 0.85);
  }

  :deep(.dynamic-table-panel > .flex.justify-between .ant-space) {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  :deep(.ant-table-wrapper) {
    padding: 0 12px 12px;

    .ant-table {
      .ant-table-title {
        display: flex;
      }

      .ant-image:hover {
        cursor: zoom-in;
      }
    }

    .ant-table-container,
    .ant-table-content,
    .ant-table-header,
    .ant-table-body {
      border-radius: inherit;
      background-clip: padding-box;
    }
  }

  .actions > * {
    margin-right: 10px;
  }

  @media (max-width: 1280px) {
    .dynamic-table-search {
      padding: 16px 16px 4px;
    }

    :deep(.dynamic-table-search .ant-form-item-row) {
      grid-template-columns: 96px minmax(0, 1fr);
      column-gap: 10px;
    }

    :deep(.dynamic-table-panel > .flex.justify-between) {
      padding: 16px 16px 10px !important;
    }

    :deep(.ant-table-wrapper) {
      padding: 0 8px 8px;
    }
  }
</style>
