export type LangCode = 'en-US' | 'en-GB' | 'fr' | 'es' | 'de' | 'ar' | 'zh' | 'pt'

export const translations: Record<string, Record<LangCode, string>> = {
  // ── Bottom nav ──────────────────────────────────────
  'nav.home':     { 'en-US': 'Home',     'en-GB': 'Home',     'fr': 'Accueil',  'es': 'Inicio',    'de': 'Start',    'ar': 'الرئيسية', 'zh': '主页',  'pt': 'Início' },
  'nav.trade':    { 'en-US': 'Trade',    'en-GB': 'Trade',    'fr': 'Trader',   'es': 'Operar',    'de': 'Handel',   'ar': 'تداول',    'zh': '交易',  'pt': 'Negociar' },
  'nav.finbot':   { 'en-US': 'Fin Bot',  'en-GB': 'Fin Bot',  'fr': 'Fin Bot',  'es': 'Fin Bot',   'de': 'Fin Bot',  'ar': 'فن بوت',   'zh': 'Fin机器人', 'pt': 'Fin Bot' },
  'nav.markets':  { 'en-US': 'Markets',  'en-GB': 'Markets',  'fr': 'Marchés',  'es': 'Mercados',  'de': 'Märkte',   'ar': 'الأسواق',  'zh': '市场',  'pt': 'Mercados' },
  'nav.profile':  { 'en-US': 'Profile',  'en-GB': 'Profile',  'fr': 'Profil',   'es': 'Perfil',    'de': 'Profil',   'ar': 'الملف',    'zh': '我的',  'pt': 'Perfil' },

  // ── Sidebar nav ─────────────────────────────────────
  'nav.dashboard':      { 'en-US': 'Dashboard',      'en-GB': 'Dashboard',      'fr': 'Tableau de bord', 'es': 'Panel',        'de': 'Übersicht',    'ar': 'لوحة التحكم',  'zh': '仪表板',  'pt': 'Painel' },
  'nav.wallet':         { 'en-US': 'Wallet',          'en-GB': 'Wallet',          'fr': 'Portefeuille',    'es': 'Billetera',    'de': 'Wallet',       'ar': 'المحفظة',      'zh': '钱包',    'pt': 'Carteira' },
  'nav.chatfin':        { 'en-US': 'Chat Fin',        'en-GB': 'Chat Fin',        'fr': 'Chat Fin',        'es': 'Chat Fin',     'de': 'Chat Fin',     'ar': 'شات فين',      'zh': 'Chat Fin', 'pt': 'Chat Fin' },
  'nav.news':           { 'en-US': 'News',             'en-GB': 'News',             'fr': 'Actualités',      'es': 'Noticias',     'de': 'Nachrichten',  'ar': 'الأخبار',      'zh': '新闻',    'pt': 'Notícias' },
  'nav.notifications':  { 'en-US': 'Notifications',   'en-GB': 'Notifications',   'fr': 'Notifications',   'es': 'Notificaciones','de': 'Benachrichtigungen', 'ar': 'الإشعارات', 'zh': '通知', 'pt': 'Notificações' },
  'nav.settings':       { 'en-US': 'Settings',        'en-GB': 'Settings',        'fr': 'Paramètres',      'es': 'Configuración', 'de': 'Einstellungen', 'ar': 'الإعدادات',   'zh': '设置',    'pt': 'Configurações' },
  'nav.support':        { 'en-US': 'Support',         'en-GB': 'Support',         'fr': 'Assistance',      'es': 'Soporte',       'de': 'Support',      'ar': 'الدعم',        'zh': '支持',    'pt': 'Suporte' },
  'nav.pricing':        { 'en-US': 'Pricing',         'en-GB': 'Pricing',         'fr': 'Tarifs',          'es': 'Precios',       'de': 'Preise',       'ar': 'الأسعار',      'zh': '价格',    'pt': 'Preços' },
  'nav.admin':          { 'en-US': 'Admin Panel',     'en-GB': 'Admin Panel',     'fr': 'Admin',           'es': 'Panel Admin',   'de': 'Admin',        'ar': 'لوحة المدير',  'zh': '管理员',  'pt': 'Painel Admin' },
  'nav.signout':        { 'en-US': 'Sign Out',        'en-GB': 'Sign Out',        'fr': 'Se déconnecter',  'es': 'Cerrar sesión', 'de': 'Abmelden',     'ar': 'تسجيل الخروج', 'zh': '退出',    'pt': 'Sair' },

  // ── Common buttons ───────────────────────────────────
  'btn.save':        { 'en-US': 'Save',       'en-GB': 'Save',       'fr': 'Enregistrer', 'es': 'Guardar',   'de': 'Speichern', 'ar': 'حفظ',     'zh': '保存', 'pt': 'Salvar' },
  'btn.cancel':      { 'en-US': 'Cancel',     'en-GB': 'Cancel',     'fr': 'Annuler',     'es': 'Cancelar',  'de': 'Abbrechen', 'ar': 'إلغاء',   'zh': '取消', 'pt': 'Cancelar' },
  'btn.newchat':     { 'en-US': 'New',        'en-GB': 'New',        'fr': 'Nouveau',     'es': 'Nuevo',     'de': 'Neu',       'ar': 'جديد',    'zh': '新建', 'pt': 'Novo' },
  'btn.loading':     { 'en-US': 'Loading…',   'en-GB': 'Loading…',   'fr': 'Chargement…', 'es': 'Cargando…', 'de': 'Laden…',    'ar': '…تحميل',  'zh': '加载中…', 'pt': 'Carregando…' },

  // ── Settings titles ───────────────────────────────────
  'settings.title':          { 'en-US': 'Settings',           'en-GB': 'Settings',          'fr': 'Paramètres',        'es': 'Configuración',    'de': 'Einstellungen',     'ar': 'الإعدادات',         'zh': '设置',           'pt': 'Configurações' },
  'settings.notifications':  { 'en-US': 'Notifications',      'en-GB': 'Notifications',     'fr': 'Notifications',     'es': 'Notificaciones',   'de': 'Benachrichtigungen','ar': 'الإشعارات',         'zh': '通知',           'pt': 'Notificações' },
  'settings.tradeAlerts':    { 'en-US': 'Trade Alerts',       'en-GB': 'Trade Alerts',      'fr': 'Alertes de Trade',  'es': 'Alertas de Trade', 'de': 'Handelsmeldungen',  'ar': 'تنبيهات التداول',   'zh': '交易提醒',       'pt': 'Alertas de Trade' },
  'settings.appPrefs':       { 'en-US': 'App Preferences',    'en-GB': 'App Preferences',   'fr': 'Préférences',       'es': 'Preferencias',     'de': 'Einstellungen',     'ar': 'تفضيلات التطبيق',   'zh': '应用偏好',       'pt': 'Preferências' },
  'settings.langRegion':     { 'en-US': 'Language & Region',  'en-GB': 'Language & Region', 'fr': 'Langue & Région',   'es': 'Idioma y Región',  'de': 'Sprache & Region',  'ar': 'اللغة والمنطقة',    'zh': '语言与地区',     'pt': 'Idioma & Região' },
  'settings.security':       { 'en-US': 'Security & Account', 'en-GB': 'Security & Account','fr': 'Sécurité',          'es': 'Seguridad',        'de': 'Sicherheit',        'ar': 'الأمان والحساب',    'zh': '安全与账户',     'pt': 'Segurança' },

  // ── Dashboard ────────────────────────────────────────
  'dashboard.title':   { 'en-US': 'Dashboard',  'en-GB': 'Dashboard',  'fr': 'Tableau de bord', 'es': 'Panel',       'de': 'Übersicht',   'ar': 'لوحة التحكم', 'zh': '仪表板', 'pt': 'Painel' },
  'dashboard.balance': { 'en-US': 'Balance',     'en-GB': 'Balance',    'fr': 'Solde',           'es': 'Saldo',       'de': 'Guthaben',    'ar': 'الرصيد',      'zh': '余额',   'pt': 'Saldo' },

  // ── Chat ─────────────────────────────────────────────
  'chat.placeholder': { 'en-US': 'Ask about markets, strategies, signals…', 'en-GB': 'Ask about markets, strategies, signals…', 'fr': 'Posez une question sur les marchés…', 'es': 'Pregunta sobre mercados, estrategias…', 'de': 'Frage zu Märkten, Strategien…', 'ar': '…اسأل عن الأسواق والاستراتيجيات', 'zh': '询问市场、策略、信号…', 'pt': 'Pergunte sobre mercados, estratégias…' },
  'chat.disclaimer':  { 'en-US': 'Chat Fin is AI-powered · Not financial advice', 'en-GB': 'Chat Fin is AI-powered · Not financial advice', 'fr': 'Chat Fin est alimenté par IA · Pas de conseil financier', 'es': 'Chat Fin usa IA · No es asesoría financiera', 'de': 'Chat Fin nutzt KI · Keine Finanzberatung', 'ar': 'Chat Fin مدعوم بالذكاء الاصطناعي · ليس نصيحة مالية', 'zh': 'Chat Fin 由 AI 驱动 · 非财务建议', 'pt': 'Chat Fin usa IA · Não é conselho financeiro' },
  'chat.dashboard':   { 'en-US': 'Dashboard', 'en-GB': 'Dashboard', 'fr': 'Tableau de bord', 'es': 'Panel', 'de': 'Übersicht', 'ar': 'لوحة التحكم', 'zh': '仪表板', 'pt': 'Painel' },
  'chat.online':      { 'en-US': 'Online', 'en-GB': 'Online', 'fr': 'En ligne', 'es': 'En línea', 'de': 'Online', 'ar': 'متصل', 'zh': '在线', 'pt': 'Online' },
}

export const LANGUAGE_NAMES: Record<LangCode, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'fr':    'Français',
  'es':    'Español',
  'de':    'Deutsch',
  'ar':    'العربية',
  'zh':    '中文',
  'pt':    'Português',
}

export function t(key: string, lang: LangCode): string {
  return translations[key]?.[lang] ?? translations[key]?.['en-US'] ?? key
}
