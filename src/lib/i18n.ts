import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const resources = {
  en: {
    translation: {
      welcome: "Welcome to Imboni",
      tagline: "Visual assistance at your fingertips",
      needHelp: "I need visual assistance",
      alreadyHaveAccount: "Already have an account? Log in",
      login: "Log in",
      signup: "Sign up",
      email: "Email",
      password: "Password",
      fullName: "Full Name",
      signIn: "Sign In",
      signUp: "Sign Up",
      signInWithGoogle: "Sign in with Google",
      signUpWithGoogle: "Sign up with Google",
      history: "History",
      settings: "Settings",
      available: "Available",
      unavailable: "Unavailable",
      helpRequest: "Help Request",
      accept: "Accept",
      decline: "Decline",
      endCall: "End Call",
      mute: "Mute",
      unmute: "Unmute",
      videoOn: "Video On",
      videoOff: "Video Off",
      connecting: "Connecting...",
      connected: "Connected",
      rateCall: "Rate this call",
      skip: "Skip",
      submit: "Submit",
      cancel: "Cancel",
      account: "Account",
      appearance: "Appearance",
      languages: "Languages",
      notifications: "Notifications",
      light: "Light",
      dark: "Dark",
      system: "System",
      english: "English",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      agreeAndContinue: "Agree and Continue",
      verifyEmail: "Verify your email",
      verifyEmailMessage: "Please check your email and click the verification link.",
      resendEmail: "Resend verification email",
      emailVerified: "Email verified",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      callEnded: "Call ended",
      ratingSubmitted: "Thank you for your feedback!",
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

