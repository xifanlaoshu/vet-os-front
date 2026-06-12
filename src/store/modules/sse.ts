import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useIdle } from '@vueuse/core';
import mitt from 'mitt';
import { useUserStore } from './user';
import { uniqueSlash } from '@/utils/urlUtils';

export type MessageEvent = {
  data?: any;
  type?: 'ping' | 'close' | 'updatePermsAndMenus' | 'updateOnlineUserCount';
};

type Events = {
  onlineUser: number;
};

function parseSseChunk(chunk: string) {
  return chunk
    .split('\n\n')
    .map((block) => {
      const data = block
        .split('\n')
        .filter(line => line.startsWith('data:'))
        .map(line => line.replace(/^data:\s?/, ''))
        .join('\n');
      if (!data) return null;
      try {
        return JSON.parse(data) as MessageEvent;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as MessageEvent[];
}

export const useSSEStore = defineStore('sse', () => {
  const emitter = mitt<Events>();
  const userStore = useUserStore();
  const { idle } = useIdle(5 * 60 * 1000); // 5 min
  let abortController: AbortController | null = null;
  const serverConnected = ref(true);
  const onlineUserCount = ref(0);

  watch(serverConnected, (val) => {
    if (val && userStore.token) {
      initServerMsgListener();
    } else {
      closeEventSource();
    }
  });

  watch(idle, (idleValue) => {
    if (idleValue) {
      closeEventSource();
    } else if (userStore.token) {
      setServerConnectStatus(true);
    }
  });

  const closeEventSource = () => {
    serverConnected.value = false;
    abortController?.abort();
    abortController = null;
  };

  const handleMessage = (message: MessageEvent) => {
    const { type, data } = message;
    if (type === 'close') {
      closeEventSource();
    } else if (type === 'updatePermsAndMenus') {
      userStore.fetchPermsAndMenus();
    } else if (type === 'updateOnlineUserCount') {
      onlineUserCount.value = ~~data;
      emitter.emit('onlineUser', onlineUserCount.value);
    }
  };

  const initServerMsgListener = async () => {
    closeEventSource();
    const uid = userStore.userInfo.id;
    if (!uid || !userStore.token) return;

    abortController = new AbortController();
    const sseUrl = uniqueSlash(`${import.meta.env.VITE_BASE_API_URL}/api/sse/${uid}`);

    try {
      const response = await fetch(sseUrl, {
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${userStore.token}`,
          ...(userStore.areaId ? { 'X-Area-Id': String(userStore.areaId) } : {}),
        },
        signal: abortController.signal,
      });

      if (!response.ok || !response.body)
        throw new Error(`SSE connection failed: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (abortController && !abortController.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const boundary = buffer.lastIndexOf('\n\n');
        if (boundary < 0) continue;

        const ready = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        parseSseChunk(ready).forEach(handleMessage);
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.log('eventSource err', error);
        closeEventSource();
      }
    }
  };

  const setServerConnectStatus = (isConnect: boolean) => {
    serverConnected.value = isConnect;
  };

  return {
    emitter,
    onlineUserCount,
    closeEventSource,
    initServerMsgListener,
    setServerConnectStatus,
  };
});
