<script setup lang="ts">
  import { computed, unref } from 'vue';
  import type { PropType } from 'vue';
  import {
    DownOutlined,
    ReloadOutlined,
    CloseOutlined,
    VerticalRightOutlined,
    VerticalLeftOutlined,
    ColumnWidthOutlined,
    MinusOutlined,
  } from '@ant-design/icons-vue';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded } from 'vue-router';
  import { isFunction } from 'lodash-es';
  import { message } from 'ant-design-vue';
  import { REDIRECT_NAME } from '@/router/constant';
  import { TitleI18n } from '@/components/basic/title-i18n';
  import { isDevMode } from '@/constants/env';
  import { useTabsViewStore } from '@/store/modules/tabsView';
  import { devWarn } from '@/utils/devLog';

  defineOptions({
    name: 'TabOperator',
  });

  const props = defineProps({
    tabItem: {
      type: Object as PropType<RouteLocationNormalizedLoaded>,
      required: true,
    },
    isExtra: Boolean,
  });

  const route = useRoute();
  const router = useRouter();
  const tabsViewStore = useTabsViewStore();

  const activeKey = computed(() => tabsViewStore.getCurrentTab?.fullPath);
  const tabsList = computed(() => tabsViewStore.getTabsList);

  const isCurrentRoute = (routeItem: RouteLocationNormalizedLoaded) => {
    return router.currentRoute.value.matched.some((item) => item.name === routeItem.name);
  };

  const removeTab = () => {
    if (tabsList.value.length === 1) {
      return message.warning('This is the last tab and cannot be closed.');
    }
    tabsViewStore.closeCurrentTab(props.tabItem);
  };

  const reloadPage = () => {
    router.replace({
      name: REDIRECT_NAME,
      params: {
        path: unref(route).fullPath,
      },
    });
  };

  const closeLeft = () => {
    tabsViewStore.closeLeftTabs(props.tabItem);
    !isCurrentRoute(props.tabItem) && router.replace(props.tabItem.fullPath);
  };

  const closeRight = () => {
    tabsViewStore.closeRightTabs(props.tabItem);
    !isCurrentRoute(props.tabItem) && router.replace(props.tabItem.fullPath);
  };

  const closeOther = () => {
    tabsViewStore.closeOtherTabs(props.tabItem);
    !isCurrentRoute(props.tabItem) && router.replace(props.tabItem.fullPath);
  };

  const closeAll = () => {
    tabsViewStore.closeAllTabs();
    router.replace('/');
  };

  const openPageFile = async () => {
    if (!isDevMode) {
      devWarn('Open page file is only available in development mode.');
      return;
    }

    const routes = router.getRoutes();
    const target = routes.find((n) => n.name === props.tabItem.name);
    if (!target)
      return;

    const comp = target.components?.default;
    let filePathFromComponent = (comp as any)?.__file as string | undefined;
    if (isFunction(comp)) {
      try {
        const res = await comp();
        filePathFromComponent = res?.default?.__file;
      }
      catch {
        devWarn('Failed to resolve page file for editor jump.');
      }
    }
    if (filePathFromComponent)
      fetch(`/__open-in-editor?file=${filePathFromComponent}`);
  };

  defineExpose({
    removeTab,
  });
</script>

<template>
  <a-dropdown :trigger="[isExtra ? 'click' : 'contextmenu']">
    <a v-if="isExtra" class="ant-dropdown-link" @click.prevent>
      <down-outlined :style="{ fontSize: '20px' }" />
    </a>
    <div v-else style="display: inline-block">
      <TitleI18n :title="tabItem.meta?.title" />
    </div>
    <template #overlay>
      <a-menu style="user-select: none">
        <a-menu-item key="1" :disabled="activeKey !== tabItem.fullPath" @click="reloadPage">
          <reload-outlined />
          {{ $t('layout.multipleTab.reload') }}
        </a-menu-item>
        <a-menu-item key="2" @click="removeTab">
          <close-outlined />
          {{ $t('layout.multipleTab.close') }}
        </a-menu-item>
        <a-menu-divider />
        <a-menu-item key="3" @click="closeLeft">
          <vertical-right-outlined />
          {{ $t('layout.multipleTab.closeLeft') }}
        </a-menu-item>
        <a-menu-item key="4" @click="closeRight">
          <vertical-left-outlined />
          {{ $t('layout.multipleTab.closeRight') }}
        </a-menu-item>
        <a-menu-divider />
        <a-menu-item key="5" @click="closeOther">
          <column-width-outlined />
          {{ $t('layout.multipleTab.closeOther') }}
        </a-menu-item>
        <a-menu-item key="6" @click="closeAll">
          <minus-outlined />
          {{ $t('layout.multipleTab.closeAll') }}
        </a-menu-item>
        <template v-if="isDevMode">
          <a-menu-divider />
          <a-menu-item key="7" @click="openPageFile">
            <column-width-outlined />
            Open page file
          </a-menu-item>
        </template>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style lang="less" scoped></style>
