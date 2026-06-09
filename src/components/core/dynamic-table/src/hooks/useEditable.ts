import { nextTick, watch } from 'vue';
import { cloneDeep } from 'lodash-es';
import { message } from 'ant-design-vue';
import type { TableColumn } from '../types/column';
import type { TableState } from './useTableState';
import type { DynamicTableProps } from '../dynamic-table';
import { useI18n } from '@/hooks/useI18n';

export type UseEditableType = ReturnType<typeof useEditable>;

interface UseEditablePayload {
  tableState: TableState;
  props: DynamicTableProps;
}

export const useEditable = (payload: UseEditablePayload) => {
  const { props, tableState } = payload;
  const { t } = useI18n();
  const {
    tableData,
    editFormModel,
    editTableFormRef,
    editFormErrorMsgs,
    editableCellKeys,
    editableRowKeys,
  } = tableState;

  watch(
    () => props.editableType,
    (type) => {
      if (type === 'cell') {
        editableRowKeys.value.clear();
      } else {
        editableCellKeys.value.clear();
      }
    },
  );

  const setEditFormModel = (recordKey: Key, editValue: Recordable) => {
    Reflect.set(editFormModel.value, recordKey, editValue);
    nextTick(() => {
      editTableFormRef.value?.setFormModel(recordKey, editValue);
    });
  };

  const getEditValue = (
    recordKey: Key,
    currentRow?: Recordable,
    columns?: TableColumn<Recordable<any>>[],
  ) => {
    const editValue = cloneDeep(
      currentRow ?? tableData.value.find((n) => n[String(props.rowKey)] === recordKey),
    );
    columns?.forEach((item) => {
      const { formItemProps, editFormItemProps } = item;
      const field = (item.dataIndex || item.key) as string;

      if (!Reflect.has(editValue, field)) {
        Reflect.set(editValue, field, undefined);
      }

      if (
        !Object.is(editFormItemProps?.extendSearchFormProps, false) &&
        formItemProps &&
        Reflect.has(formItemProps, 'defaultValue')
      ) {
        editValue[field] = formItemProps.defaultValue;
      }
      if (editFormItemProps && Reflect.has(editFormItemProps, 'defaultValue')) {
        editValue[field] = editFormItemProps.defaultValue;
      }
    });
    return editValue;
  };

  const startEditable = (recordKey: Key, currentRow?: Recordable) => {
    editableCellKeys.value.clear();
    console.log('startEditable editFormModel', editFormModel);
    if (editableRowKeys.value.size > 0 && props.editableType === 'single') {
      message.warn(props.onlyOneLineEditorAlertMessage || t('component.table.onlyOneLineEditor'));
      return false;
    }
    const editValue = getEditValue(recordKey, currentRow, props.columns);
    setEditFormModel(recordKey, editValue);
    editableRowKeys.value.add(recordKey);
    return true;
  };

  const startCellEditable = (recordKey: Key, dataIndex: Key, currentRow?: Recordable) => {
    editableRowKeys.value.clear();
    const targetColumn = props.columns.filter((n) => n.dataIndex === dataIndex);
    const editValue = getEditValue(recordKey, currentRow, targetColumn);

    editableCellKeys.value.add(`${recordKey}.${dataIndex}`);
    setEditFormModel(recordKey, {
      ...(getEditFormModel(recordKey) || editValue),
      [dataIndex]: editValue[dataIndex],
    });
  };

  const cancelCellEditable = (recordKey: Key, dataIndex: Key) => {
    editableCellKeys.value.delete(`${recordKey}.${dataIndex}`);
    const editFormModel = getEditFormModel(recordKey);
    const record = tableData.value.find((n) => n[String(props.rowKey)] === recordKey);
    if (record) {
      Reflect.set(editFormModel, dataIndex, record[dataIndex]);
    }
    editFormErrorMsgs.value.delete(`${recordKey}.${dataIndex}`);
  };

  const cancelEditable = (recordKey: Key) => {
    const formModel = getEditFormModel(recordKey);
    Object.keys(formModel).forEach((field) =>
      editFormErrorMsgs.value.delete(`${recordKey}.${field}`),
    );

    nextTick(() => {
      editTableFormRef.value?.delFormModel?.(recordKey);
    });

    editableRowKeys.value.delete(recordKey);
    return Reflect.deleteProperty(editFormModel.value, recordKey);
  };

  const isEditable = (recordKey: Key) => editableRowKeys.value.has(recordKey);

  const getEditFormModel = (recordKey: Key) => Reflect.get(editFormModel.value, recordKey);

  const validateRow = async (recordKey: Key) => {
    const nameList = Object.keys(getEditFormModel(recordKey)).map((n) => [String(recordKey), n]);
    const result = await editTableFormRef.value?.validateFields(nameList);
    return result?.[recordKey] ?? result;
  };

  const validateCell = async (recordKey: Key, dataIndex: Key) => {
    const result = await editTableFormRef.value?.validateFields([[String(recordKey), dataIndex]]);
    return result?.[recordKey] ?? result;
  };

  return {
    setEditFormModel,
    startEditable,
    startCellEditable,
    cancelCellEditable,
    cancelEditable,
    isEditable,
    validateRow,
    validateCell,
    getEditFormModel,
  };
};
