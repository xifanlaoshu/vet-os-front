<template>
  <Layout.Header :style="headerStyle" class="layout-header">
    <div class="header-left">
      <slot name="left">
        <Space :size="20">
          <span
            class="menu-fold cursor-pointer"
            @click="() => emit('update:collapsed', !collapsed)"
          >
            <component :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined" />
          </span>
          <LayoutBreadcrumb />
        </Space>
      </slot>
    </div>
    <div class="header-menu">
      <slot name="menu" />
    </div>
    <div class="header-right">
      <Space :size="20">
        <div v-if="userStore.tenantName || userStore.areaName" class="tenant-area-switcher">
          <span class="tenant-name">{{ userStore.tenantName || '当前医院' }}</span>
          <Select
            :value="userStore.areaId"
            :options="areaSelectOptions"
            size="small"
            class="area-select"
            :disabled="areaSelectOptions.length <= 1"
            @change="handleAreaChange"
          />
        </div>
        <Search />
        <Tooltip :title="$t('layout.header.tooltipLock')" placement="bottom">
          <LockOutlined @click="lockscreenStore.setLock(true)" />
        </Tooltip>
        <FullScreen />
        <LocalePicker />
        <Dropdown placement="bottomRight">
          <Avatar :src="userInfo.avatar" :alt="userInfo.username">{{ userInfo.username }}</Avatar>
          <template #overlay>
            <Menu>
              <Menu.Item @click="$router.push({ name: 'account-settings' })">
                {{ $t('routes.account.settings') }}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item>
                <div @click.prevent="doLogout">
                  <poweroff-outlined /> {{ $t('layout.header.dropdownItemLoginOut') }}
                </div>
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
        <ProjectSetting />
      </Space>
    </div>
  </Layout.Header>
</template>

<script lang="tsx" setup>
  import { computed, type CSSProperties } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import {
    QuestionCircleOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PoweroffOutlined,
    LockOutlined,
  } from '@ant-design/icons-vue';
  import {
    Layout,
    message,
    Modal,
    Dropdown,
    Menu,
    Space,
    Avatar,
    Tooltip,
    Select,
    type MenuTheme,
  } from 'ant-design-vue';
  import { Search, FullScreen, ProjectSetting, LayoutBreadcrumb } from './components/';
  import { LocalePicker } from '@/components/basic/locale-picker';
  import { useUserStore } from '@/store/modules/user';
  import { useKeepAliveStore } from '@/store/modules/keepAlive';
  import { useLockscreenStore } from '@/store/modules/lockscreen';
  import { LOGIN_NAME } from '@/router/constant';
  import { useLayoutSettingStore } from '@/store/modules/layoutSetting';

  defineProps({
    collapsed: {
      type: Boolean,
    },
    theme: {
      type: String as PropType<MenuTheme>,
    },
  });

  const emit = defineEmits(['update:collapsed']);
  const userStore = useUserStore();
  const layoutSettingStore = useLayoutSettingStore();
  const lockscreenStore = useLockscreenStore();
  const keepAliveStore = useKeepAliveStore();
  const router = useRouter();
  const route = useRoute();

  const userInfo = computed(() => userStore.userInfo);
  const areaSelectOptions = computed(() =>
    (userStore.areaOptions || []).map((item) => ({
      label: item.areaName,
      value: item.areaId,
    })),
  );
  const headerStyle = computed<CSSProperties>(() => {
    const { navTheme, layout } = layoutSettingStore.layoutSetting;
    const isDark = navTheme === 'dark' && layout === 'topmenu';
    return {
      backgroundColor: navTheme === 'realDark' || isDark ? '' : 'rgba(255, 255, 255, 0.85)',
      color: isDark ? 'rgba(255, 255, 255, 0.85)' : '',
    };
  });

  const handleAreaChange = async (value: any) => {
    await userStore.switchArea(Number(value));
    message.success('院区已切换');
  };

  const doLogout = () => {
    Modal.confirm({
      title: '确定要退出登录吗？',
      icon: <QuestionCircleOutlined />,
      centered: true,
      onOk: async () => {
        await userStore.logout();
        keepAliveStore.clear();
        message.success('成功退出登录');
        router.replace({
          name: LOGIN_NAME,
          query: {
            redirect: route.fullPath,
          },
        });
      },
    });
  };
</script>

<style lang="less" scoped>
  .layout-header {
    display: flex;
    position: sticky;
    z-index: 10;
    top: 0;
    align-items: center;
    justify-content: space-between;
    height: var(--app-header-height);
    padding: 0 20px;

    .header-right {
      min-width: 180px;
      cursor: pointer;
    }

    .header-menu {
      flex: 1;
      align-items: center;
      min-width: 0;
    }

    .tenant-area-switcher {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: default;
    }

    .tenant-name {
      max-width: 140px;
      overflow: hidden;
      color: #475569;
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .area-select {
      width: 128px;
    }
  }
</style>
