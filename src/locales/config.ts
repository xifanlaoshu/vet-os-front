export type LocaleType = keyof typeof localeMap;

export const localeMap = {
  zh_CN: 'zh_CN',
  en: 'en',
} as const;

export const localeSetting = {
  defaultLocale: localeMap.zh_CN,
  supportedLocales: [localeMap.zh_CN, localeMap.en],
  reloadPageOnChange: true,
  showPicker: true,
} as const;

export const localeList = [
  {
    lang: localeMap.zh_CN,
    label: {
      zh_CN: '简体中文',
      en: 'Simplified Chinese',
    },
    icon: '🇨🇳',
    title: {
      zh_CN: '语言',
      en: 'Language',
    },
  },
  {
    lang: localeMap.en,
    label: {
      zh_CN: '英语',
      en: 'English',
    },
    icon: '🇺🇸',
    title: {
      zh_CN: '语言',
      en: 'Language',
    },
  },
] as const;
