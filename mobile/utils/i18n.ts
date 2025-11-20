import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome to Imboni',
      login: 'Log In',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      user_type_selection: 'Are you a blind user or a volunteer?',
      blind_user: 'Blind/Low Vision User',
      volunteer: 'Sighted Volunteer',
      camera_permission: 'We need camera access to assist you.',
      microphone_permission: 'We need microphone access for communication.',
      home: 'Home',
      analyze: 'Analyze Surroundings',
      request_help: 'Request Help',
      settings: 'Settings',
      logout: 'Log Out',
    },
  },
  // Add other languages here
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLocales()[0]?.languageCode ?? 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

export default i18n;

