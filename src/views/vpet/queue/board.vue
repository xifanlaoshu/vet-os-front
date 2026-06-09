<template>
  <div class="vpet-page queue-board">
    <div class="queue-board__title">{{ t('page.queue.title') }}</div>
    <div class="queue-board__columns">
      <section class="queue-board__panel">
        <h2 class="queue-board__panel-title queue-board__panel-title--waiting">{{ t('page.queue.waiting') }}</h2>
        <div v-for="(item, i) in waitingQueue" :key="item.id" class="queue-board__item queue-board__item--waiting">
          <span>#{{ i + 1 }} {{ item.pet?.name || ('#' + item.petId) }}</span>
          <span class="queue-board__visit-no">{{ item.visitNo }}</span>
        </div>
        <div v-if="waitingQueue.length === 0" class="queue-board__empty">{{ t('page.queue.emptyWaiting') }}</div>
      </section>
      <section class="queue-board__panel">
        <h2 class="queue-board__panel-title queue-board__panel-title--active">{{ t('page.queue.active') }}</h2>
        <div v-for="item in activeQueue" :key="item.id" class="queue-board__item queue-board__item--active">
          <div>{{ item.pet?.name || ('#' + item.petId) }}</div>
          <div class="queue-board__visit-no queue-board__visit-no--block">{{ item.visitNo }}</div>
        </div>
        <div v-if="activeQueue.length === 0" class="queue-board__empty">{{ t('page.queue.emptyActive') }}</div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { vpetVisitQueue } from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';

const { t } = useVpetLocale();
const waitingQueue = ref<any[]>([]);
const activeQueue = ref<any[]>([]);
let timer: any = null;

async function loadQueue() {
  try {
    const list = await vpetVisitQueue() as any[];
    waitingQueue.value = list.filter((v: any) => v.status === 1);
    activeQueue.value = list.filter((v: any) => [2, 3].includes(v.status));
  } catch {}
}

onMounted(() => {
  loadQueue();
  timer = setInterval(loadQueue, 5000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="less" scoped>
  .queue-board {
    min-height: 100vh;
    padding: 40px;
    color: #fff;
    background:
      radial-gradient(circle at top left, rgba(82, 196, 26, 0.16), transparent 32%),
      radial-gradient(circle at top right, rgba(250, 173, 20, 0.16), transparent 34%),
      #050608;
    font-family: "Microsoft YaHei", sans-serif;
  }

  .queue-board__title {
    margin-bottom: 40px;
    text-align: center;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .queue-board__columns {
    display: flex;
    gap: 40px;
    min-height: calc(100vh - 160px);
  }

  .queue-board__panel {
    flex: 1;
    min-width: 0;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.05);
  }

  .queue-board__panel-title {
    margin-bottom: 20px;
    font-size: 28px;
    font-weight: 800;
  }

  .queue-board__panel-title--waiting {
    color: #52c41a;
  }

  .queue-board__panel-title--active {
    color: #faad14;
  }

  .queue-board__item {
    padding: 16px;
    margin-bottom: 8px;
    border-radius: 10px;
    font-size: 24px;
  }

  .queue-board__item--waiting {
    display: flex;
    justify-content: space-between;
    background: #1a1a2e;
  }

  .queue-board__item--active {
    border: 2px solid #faad14;
    background: #2e1a1a;
  }

  .queue-board__visit-no {
    color: #a0a0a0;
  }

  .queue-board__visit-no--block {
    margin-top: 6px;
    font-size: 16px;
  }

  .queue-board__empty {
    padding: 60px;
    color: #6f6f6f;
    text-align: center;
    font-size: 24px;
  }

  @media (max-width: 1080px) {
    .queue-board {
      padding: 24px;
    }

    .queue-board__columns {
      flex-direction: column;
      min-height: auto;
    }
  }
</style>
