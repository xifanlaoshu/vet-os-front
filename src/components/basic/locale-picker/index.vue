<template>
  <Dropdown placement="bottomRight" v-if="localeSetting.showPicker">
    <SvgIcon name="locale" />
    <span v-if="showText" class="ml-1">{{ getLocaleText }}</span>
    <template #overlay>
      <Menu v-model:selectedKeys="selectedKeys" @click="handleMenuClick">
        <Menu.Item v-for="item in localeList" :key="item.lang">
          <a href="javascript:;">{{ item.icon }} {{ resolveLocaleText(item.label) }}</a>
        </Menu.Item>
      </Menu>
    </template>
  </Dropdown>
</template>

<script lang="ts" setup>
  import { computed, ref, unref, watchEffect } from 'vue';
  import { Dropdown, Menu } from 'ant-design-vue';
  import { useLocale } from '@/locales/useLocale';
  import { localeList, localeSetting, type LocaleType } from '@/locales/config';
  import { SvgIcon } from '@/components/basic/icon';

  const props = defineProps({
    showText: { type: Boolean, default: true },
    reload: { type: Boolean, default: localeSetting.reloadPageOnChange },
  });

  const selectedKeys = ref<string[]>([]);
  const { changeLocale, getLocale } = useLocale();
  const currentLocale = computed(() => unref(getLocale));

  function resolveLocaleText(value: string | Title18n | undefined) {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return value[currentLocale.value];
  }

  const getLocaleText = computed(() => {
    const key = selectedKeys.value[0];
    if (!key) {
      return '';
    }
    return resolveLocaleText(localeList.find((item) => item.lang === key)?.label);
  });

  watchEffect(() => {
    selectedKeys.value = [unref(getLocale)];
  });

  async function toggleLocale(lang: LocaleType | string) {
    await changeLocale(lang as LocaleType);
    selectedKeys.value = [lang as string];
    if (props.reload) {
      location.reload();
    }
  }

  function handleMenuClick({ key }) {
    if (unref(getLocale) === key) {
      return;
    }
    toggleLocale(key as string);
  }
</script>
