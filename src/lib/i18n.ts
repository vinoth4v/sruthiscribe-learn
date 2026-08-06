export type Lang = 'en' | 'ta';

// Not exhaustive -- covers primary student-facing surfaces (nav, dashboard,
// sign-in, practice loop, results) per build plan §9 Phase 6. The admin
// console stays English-only for now (lower priority, tooling rather than
// learner-facing).
export const STRINGS = {
  brand: { en: 'SruthiScribe Learn', ta: 'சுருதிஸ்கிரைப் கற்றல்' },
  nav_learn: { en: 'Learn', ta: 'கற்க' },
  nav_admin: { en: 'Admin', ta: 'நிர்வாகம்' },
  nav_review: { en: 'Review', ta: 'மதிப்பாய்வு' },
  nav_analytics: { en: 'Analytics', ta: 'பகுப்பாய்வு' },
  nav_sign_in: { en: 'Sign in', ta: 'உள்நுழைக' },
  nav_sign_out: { en: 'Sign out', ta: 'வெளியேறு' },

  dashboard_welcome: { en: 'Welcome', ta: 'வரவேற்கிறோம்' },
  dashboard_day_streak: { en: 'day streak', ta: 'நாள் தொடர்ச்சி' },
  dashboard_minutes_practiced: { en: 'minutes practiced', ta: 'பயிற்சி நிமிடங்கள்' },
  dashboard_activity: { en: 'Practice activity', ta: 'பயிற்சி செயல்பாடு' },
  dashboard_ragam_accuracy: { en: 'Accuracy by ragam', ta: 'ராகம் வாரியான துல்லியம்' },
  dashboard_continue: { en: 'Continue learning', ta: 'தொடர்ந்து கற்க' },
  dashboard_export_pdf: { en: 'Export progress report (PDF)', ta: 'முன்னேற்ற அறிக்கை (PDF)' },
  dashboard_building_pdf: { en: 'Building PDF…', ta: 'PDF உருவாக்கப்படுகிறது…' },

  sign_in_title: { en: 'Sign in', ta: 'உள்நுழைக' },
  sign_up_title: { en: 'Create an account', ta: 'கணக்கை உருவாக்கு' },
  sign_in_email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  sign_in_password: { en: 'Password', ta: 'கடவுச்சொல்' },
  sign_in_google: { en: 'Continue with Google', ta: 'Google மூலம் தொடரவும்' },
  sign_in_switch_to_signup: { en: "Don't have an account? Sign up", ta: 'கணக்கு இல்லையா? பதிவு செய்யவும்' },
  sign_in_switch_to_signin: { en: 'Already have an account? Sign in', ta: 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக' },

  practice_play_drone: { en: '▶ Play Sa drone', ta: '▶ ஸ்ருதி இசைக்க' },
  practice_stop_drone: { en: '■ Stop drone', ta: '■ ஸ்ருதி நிறுத்து' },
  practice_record: { en: '● Record', ta: '● பதிவு செய்' },
  practice_stop_score: { en: '■ Stop & score', ta: '■ நிறுத்தி மதிப்பிடு' },
  practice_analyzing: { en: 'Analyzing…', ta: 'பகுப்பாய்வு செய்யப்படுகிறது…' },
  practice_next_section: { en: 'Next section', ta: 'அடுத்த பகுதி' },
  practice_finish: { en: 'Finish', ta: 'முடி' },
  practice_locked: { en: 'Complete the previous lesson to unlock', ta: 'முந்தைய பாடத்தை முடித்தால் திறக்கும்' },
  practice_section: { en: 'Section', ta: 'பகுதி' },
  practice_of: { en: 'of', ta: '/' },

  results_pass: { en: 'Lesson complete — well sung.', ta: 'பாடம் முடிந்தது — நன்றாக பாடினீர்கள்.' },
  results_retry: { en: 'Keep at it.', ta: 'தொடர்ந்து முயற்சி செய்யுங்கள்.' },
  results_focus: { en: 'Focus on', ta: 'கவனம் செலுத்த வேண்டியவை' },
  results_retry_btn: { en: 'Retry', ta: 'மீண்டும் முயற்சி' },
  results_next_btn: { en: 'Next lesson', ta: 'அடுத்த பாடம்' },
} as const;

export type StringKey = keyof typeof STRINGS;

export function translate(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}
