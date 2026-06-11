<template>
  <div class="vpet-page queue-board">
    <div class="queue-board__backdrop queue-board__backdrop--left" />
    <div class="queue-board__backdrop queue-board__backdrop--right" />

    <header class="queue-board__hero">
      <div>
        <div class="queue-board__eyebrow">{{ t('page.queue.eyebrow') }}</div>
        <h1>{{ t('page.queue.title') }}</h1>
        <p>{{ t('page.queue.notice') }}</p>
      </div>
      <div class="queue-board__clock">
        <strong>{{ currentTime }}</strong>
        <span>{{ currentDate }}</span>
      </div>
    </header>

    <section class="queue-board__stats">
      <div class="queue-board__stat-card queue-board__stat-card--active">
        <span>{{ t('page.queue.active') }}</span>
        <strong>{{ activeQueue.length }}</strong>
      </div>
      <div class="queue-board__stat-card">
        <span>{{ t('page.queue.waiting') }}</span>
        <strong>{{ waitingQueue.length }}</strong>
      </div>
      <div class="queue-board__stat-card">
        <span>{{ t('page.queue.autoRefresh') }}</span>
        <strong>5s</strong>
      </div>
    </section>

    <main class="queue-board__layout">
      <section class="queue-board__now">
        <div class="queue-board__section-head">
          <span>{{ t('page.queue.active') }}</span>
          <i />
        </div>
        <div v-if="activeQueue.length" class="queue-board__active-list">
          <article v-for="item in activeQueue" :key="item.id" class="queue-board__active-card">
            <span class="queue-board__active-label">{{ t('page.queue.inConsultation') }}</span>
            <strong>{{ queuePetName(item) }}</strong>
            <em>{{ item.visitNo }}</em>
            <small>{{ queueOwnerName(item) }}</small>
          </article>
        </div>
        <div v-else class="queue-board__empty queue-board__empty--large">
          <strong>{{ t('page.queue.emptyActive') }}</strong>
          <span>{{ t('page.queue.emptyActiveHint') }}</span>
        </div>
      </section>

      <section class="queue-board__waiting">
        <div class="queue-board__section-head">
          <span>{{ t('page.queue.waiting') }}</span>
          <i />
        </div>
        <div v-if="waitingQueue.length" class="queue-board__waiting-list">
          <div v-for="(item, i) in waitingQueue" :key="item.id" class="queue-board__waiting-row">
            <div class="queue-board__rank">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="queue-board__pet">
              <strong>{{ queuePetName(item) }}</strong>
              <span>{{ queueOwnerName(item) }}</span>
            </div>
            <div class="queue-board__visit-no">{{ item.visitNo }}</div>
          </div>
        </div>
        <div v-else class="queue-board__empty">
          <strong>{{ t('page.queue.emptyWaiting') }}</strong>
          <span>{{ t('page.queue.emptyWaitingHint') }}</span>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { vpetVisitQueue } from '@/api/backend/vpet';
import { useVpetLocale } from '../shared/locale';

const { t } = useVpetLocale();
const waitingQueue = ref<any[]>([]);
const activeQueue = ref<any[]>([]);
const now = ref(new Date());
let timer: any = null;
let clockTimer: any = null;

const dateTimeLocale = computed(() => {
  const lang = document.documentElement.lang || navigator.language || 'zh-CN';
  return lang.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
});

const currentDate = computed(() => {
  return now.value.toLocaleDateString(dateTimeLocale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  });
});

const currentTime = computed(() => {
  return now.value.toLocaleTimeString(dateTimeLocale.value, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
});

async function loadQueue() {
  try {
    const list = await vpetVisitQueue() as any[];
    waitingQueue.value = list.filter((v: any) => v.status === 1);
    activeQueue.value = list.filter((v: any) => [2, 3].includes(v.status));
  } catch {}
}

function queuePetName(item: any) {
  return item?.pet?.name || item?.petSnapshot?.name || t('common.unknown');
}

function queueOwnerName(item: any) {
  return item?.customer?.name || item?.customerSnapshot?.name || '';
}

onMounted(() => {
  loadQueue();
  timer = setInterval(loadQueue, 5000);
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<style lang="less" scoped>
  .queue-board {
    position: relative;
    overflow: hidden;
    min-height: 100vh;
    padding: 32px;
    color: #12202f;
    background:
      linear-gradient(135deg, rgba(240, 253, 250, 0.92), rgba(239, 246, 255, 0.94) 48%, rgba(255, 251, 235, 0.88)),
      #f5fbff;
    font-family: "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif;
  }

  .queue-board__backdrop {
    position: absolute;
    z-index: 0;
    border-radius: 999px;
    filter: blur(4px);
    opacity: 0.72;
    pointer-events: none;
  }

  .queue-board__backdrop--left {
    top: -180px;
    left: -160px;
    width: 480px;
    height: 480px;
    background: radial-gradient(circle, rgba(20, 184, 166, 0.28), transparent 66%);
  }

  .queue-board__backdrop--right {
    right: -180px;
    bottom: -220px;
    width: 560px;
    height: 560px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.22), transparent 66%);
  }

  .queue-board__hero,
  .queue-board__stats,
  .queue-board__layout {
    position: relative;
    z-index: 1;
  }

  .queue-board__hero {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 24px;
    padding: 26px 30px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 32px;
    background: rgba(255, 255, 255, 0.74);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(16px);
  }

  .queue-board__eyebrow {
    margin-bottom: 10px;
    color: #0f766e;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.18em;
  }

  .queue-board__hero h1 {
    margin: 0;
    color: #102033;
    font-size: clamp(34px, 4vw, 60px);
    font-weight: 950;
    letter-spacing: 0.04em;
  }

  .queue-board__hero p {
    margin: 12px 0 0;
    color: #64748b;
    font-size: 18px;
    font-weight: 600;
  }

  .queue-board__clock {
    display: flex;
    min-width: 220px;
    flex-direction: column;
    justify-content: center;
    padding: 16px 22px;
    border-radius: 24px;
    color: #fff;
    background: linear-gradient(135deg, #0f766e, #0ea5e9);
    box-shadow: 0 18px 40px rgba(14, 165, 233, 0.22);
    text-align: right;
  }

  .queue-board__clock strong {
    font-size: 48px;
    line-height: 1;
    font-weight: 950;
    letter-spacing: 0.04em;
  }

  .queue-board__clock span {
    margin-top: 10px;
    opacity: 0.86;
    font-size: 15px;
    font-weight: 700;
  }

  .queue-board__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .queue-board__stat-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.78);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
  }

  .queue-board__stat-card span {
    color: #64748b;
    font-size: 16px;
    font-weight: 800;
  }

  .queue-board__stat-card strong {
    color: #0f766e;
    font-size: 42px;
    line-height: 1;
    font-weight: 950;
  }

  .queue-board__stat-card--active strong {
    color: #f97316;
  }

  .queue-board__layout {
    display: grid;
    grid-template-columns: minmax(360px, 0.88fr) minmax(460px, 1.12fr);
    gap: 15px;
    margin-top: 15px;
    min-height: calc(100vh - 260px);
  }

  .queue-board__now,
  .queue-board__waiting {
    padding: 22px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 24px 56px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(14px);
  }

  .queue-board__section-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    color: #102033;
    font-size: 24px;
    font-weight: 950;
  }

  .queue-board__section-head i {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(15, 118, 110, 0.34), transparent);
  }

  .queue-board__active-list {
    display: grid;
    gap: 15px;
  }

  .queue-board__active-card {
    position: relative;
    overflow: hidden;
    min-height: 230px;
    padding: 26px;
    border-radius: 28px;
    color: #fff;
    background:
      radial-gradient(circle at 88% 10%, rgba(255, 255, 255, 0.28), transparent 28%),
      linear-gradient(145deg, #f97316, #ea580c 48%, #0f766e);
    box-shadow: 0 22px 44px rgba(249, 115, 22, 0.26);
  }

  .queue-board__active-label {
    display: inline-flex;
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    font-size: 15px;
    font-weight: 900;
  }

  .queue-board__active-card strong {
    display: block;
    margin-top: 24px;
    font-size: clamp(48px, 7vw, 86px);
    line-height: 1;
    font-weight: 950;
    letter-spacing: 0.04em;
  }

  .queue-board__active-card em {
    display: block;
    margin-top: 16px;
    font-style: normal;
    font-size: 28px;
    font-weight: 900;
    opacity: 0.9;
  }

  .queue-board__active-card small {
    display: block;
    margin-top: 8px;
    font-size: 18px;
    font-weight: 700;
    opacity: 0.82;
  }

  .queue-board__waiting-list {
    display: grid;
    gap: 12px;
    max-height: calc(100vh - 332px);
    overflow: auto;
    padding-right: 4px;
  }

  .queue-board__waiting-row {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr) minmax(140px, auto);
    gap: 16px;
    align-items: center;
    padding: 15px 18px;
    border: 1px solid rgba(203, 213, 225, 0.66);
    border-radius: 22px;
    background: rgba(248, 250, 252, 0.9);
  }

  .queue-board__rank {
    display: inline-flex;
    width: 52px;
    height: 52px;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    color: #0f766e;
    background: #ccfbf1;
    font-size: 22px;
    font-weight: 950;
  }

  .queue-board__pet {
    min-width: 0;
  }

  .queue-board__pet strong {
    display: block;
    overflow: hidden;
    color: #102033;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 950;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .queue-board__pet span {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 15px;
    font-weight: 700;
  }

  .queue-board__visit-no {
    color: #475569;
    font-size: 21px;
    font-weight: 900;
    text-align: right;
  }

  .queue-board__empty {
    display: flex;
    min-height: 260px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px dashed rgba(148, 163, 184, 0.5);
    border-radius: 24px;
    color: #64748b;
    text-align: center;
  }

  .queue-board__empty strong {
    color: #334155;
    font-size: 26px;
    font-weight: 950;
  }

  .queue-board__empty span {
    font-size: 16px;
    font-weight: 700;
  }

  .queue-board__empty--large {
    min-height: calc(100% - 48px);
  }

  @media (max-width: 1080px) {
    .queue-board {
      padding: 24px;
    }

    .queue-board__hero,
    .queue-board__layout {
      grid-template-columns: 1fr;
    }

    .queue-board__hero {
      flex-direction: column;
    }

    .queue-board__clock {
      text-align: left;
    }

    .queue-board__stats {
      grid-template-columns: 1fr;
    }

    .queue-board__layout {
      min-height: auto;
    }

    .queue-board__waiting-list {
      max-height: none;
    }
  }

  @media (max-width: 640px) {
    .queue-board {
      padding: 16px;
    }

    .queue-board__waiting-row {
      grid-template-columns: 58px minmax(0, 1fr);
    }

    .queue-board__visit-no {
      grid-column: 2;
      text-align: left;
    }
  }
</style>
