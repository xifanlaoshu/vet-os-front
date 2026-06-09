import { defineStore } from 'pinia';
import { localeSetting, type LocaleType } from '@/locales/config';
import { store } from '@/store';
import { LOCALE_KEY } from '@/enums/cacheEnum';
import { Storage } from '@/utils/Storage';

interface LocaleState {
  locale: LocaleType;
}

function resolveStoredLocale() {
  const locale = Storage.get(LOCALE_KEY, localeSetting.defaultLocale) as LocaleType;
  return localeSetting.supportedLocales.includes(locale) ? locale : localeSetting.defaultLocale;
}

export const useLocaleStore = defineStore('locale', {
  state: (): LocaleState => ({
    locale: resolveStoredLocale(),
  }),
  getters: {
    getLocale(): LocaleType {
      return this.locale ?? localeSetting.defaultLocale;
    },
  },
  actions: {
    setLocale(locale: LocaleType) {
      this.locale = locale;
      Storage.set(LOCALE_KEY, locale);
    },
  },
});

export function useLocaleStoreWithOut() {
  return useLocaleStore(store);
}
