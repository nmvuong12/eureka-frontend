import { createI18n } from 'vue-i18n';
import vi from './locales/vi.json';
import en from './locales/en.json';

const savedLocale = localStorage.getItem('app-locale') || 'vi';

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: savedLocale, // Restore saved locale
  fallbackLocale: 'en',
  messages: {
    vi,
    en
  }
});

export default i18n;
