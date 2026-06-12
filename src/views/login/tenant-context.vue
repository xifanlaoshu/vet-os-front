<template>
  <div class="tenant-context-page">
    <a-card class="tenant-context-card" :bordered="false">
      <div class="tenant-context-header">
        <img src="~@/assets/images/logo.png" width="46" />
        <div>
          <h1>选择登录环境</h1>
          <p>请选择本次登录使用的医院租户和院区。租户只能退出后重新选择，院区可在系统右上角切换。</p>
        </div>
      </div>

      <a-alert
        v-if="!areaOptions.length"
        type="warning"
        show-icon
        message="当前账号没有可访问的租户院区，请联系管理员授权。"
      />

      <a-radio-group v-else v-model:value="selectedKey" class="tenant-context-list">
        <section v-for="group in groupedOptions" :key="group.tenantId" class="tenant-group">
          <div class="tenant-title">
            <div class="tenant-name">{{ group.tenantName }}</div>
            <div class="tenant-hint">请选择本租户下的登录院区</div>
          </div>
          <a-radio
            v-for="area in group.areas"
            :key="`${area.tenantId}:${area.areaId}`"
            :value="`${area.tenantId}:${area.areaId}`"
            class="area-option"
          >
            <div class="area-content">
              <div class="area-name">{{ area.areaName }}</div>
              <div class="area-meta">
                登录后将进入该院区的业务数据空间
                <a-tag v-if="area.defaultArea" color="green">默认院区</a-tag>
              </div>
            </div>
          </a-radio>
        </section>
      </a-radio-group>

      <div class="tenant-actions">
        <a-button @click="logout">退出登录</a-button>
        <a-button type="primary" :loading="submitting" :disabled="!selectedKey" @click="submit">
          进入系统
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useUserStore, type TenantAreaOption } from '@/store/modules/user';

defineOptions({ name: 'TenantContextSelect' });

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const selectedKey = ref<string>();
const submitting = ref(false);

const areaOptions = computed(() => userStore.areaOptions || []);
const groupedOptions = computed(() => {
  const map = new Map<number, { tenantId: number; tenantName: string; areas: TenantAreaOption[] }>();
  areaOptions.value.forEach((item) => {
    if (!map.has(item.tenantId)) {
      map.set(item.tenantId, {
        tenantId: item.tenantId,
        tenantName: item.tenantName,
        areas: [],
      });
    }
    map.get(item.tenantId)!.areas.push(item);
  });
  return Array.from(map.values());
});

onMounted(async () => {
  try {
    await userStore.loadContext();
  } catch {
    userStore.clearLoginStatus();
    await router.replace({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  if (userStore.contextSelected) {
    await router.replace(userStore.getHomePath(route.query.redirect as string | undefined));
    return;
  }
  const selected = areaOptions.value.find(item => item.tenantId === userStore.tenantId && item.areaId === userStore.areaId)
    || areaOptions.value.find(item => item.defaultArea)
    || areaOptions.value[0];
  if (selected) {
    selectedKey.value = `${selected.tenantId}:${selected.areaId}`;
  }
});

async function submit() {
  if (!selectedKey.value) return;
  const [tenantId, areaId] = selectedKey.value.split(':').map(Number);
  submitting.value = true;
  try {
    await userStore.selectContext(tenantId, areaId);
    message.success('登录环境已选择');
    router.replace(userStore.getHomePath(route.query.redirect as string | undefined));
  } finally {
    submitting.value = false;
  }
}

async function logout() {
  await userStore.logout();
  router.replace('/login');
}
</script>

<style lang="less" scoped>
  .tenant-context-page {
    min-height: 100vh;
    padding: 88px 20px 40px;
    background:
      radial-gradient(circle at 20% 10%, rgba(15, 118, 110, 0.18), transparent 32%),
      radial-gradient(circle at 80% 16%, rgba(14, 165, 233, 0.16), transparent 30%),
      linear-gradient(135deg, #f6fbff, #eef7f3);
  }

  .tenant-context-card {
    max-width: 860px;
    margin: 0 auto;
    border-radius: 24px;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  }

  .tenant-context-header {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 24px;
  }

  .tenant-context-header h1 {
    margin: 0;
    color: #1f2a37;
    font-size: 28px;
    font-weight: 800;
  }

  .tenant-context-header p {
    margin: 6px 0 0;
    color: #64748b;
  }

  .tenant-context-list {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 15px;
  }

  .tenant-group {
    padding: 20px;
    border: 1px solid #dbe7ef;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.9);
  }

  .tenant-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .tenant-name {
    max-width: 100%;
    overflow: hidden;
    color: #102033;
    font-size: 22px;
    font-weight: 850;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tenant-hint {
    margin-top: 4px;
    color: #64748b;
    font-size: 13px;
    font-weight: 400;
  }

  .area-option {
    display: flex;
    width: 100%;
    margin: 0 0 10px;
    padding: 12px 14px;
    border: 1px solid #e5edf5;
    border-radius: 14px;
    background: #f8fbfd;
    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  }

  .area-option:hover {
    border-color: #14b8a6;
    background: #f5fffc;
    box-shadow: 0 8px 20px rgba(20, 184, 166, 0.08);
  }

  .area-option:last-child {
    margin-bottom: 0;
  }

  .area-content {
    min-width: 0;
  }

  .area-name {
    color: #27364a;
    font-size: 15px;
    font-weight: 700;
  }

  .area-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 4px;
    color: #64748b;
    font-size: 12px;
  }

  .tenant-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
</style>
