/**
 * Internationalization (i18n) Engine and Display Language Management
 * Social Share Scheduler
 */

export interface LanguageOption {
  code: string;
  name: string; // Native name or display label in opened dropdown, e.g. "हिन्दी (Hindi)"
  nativeName: string; // Clean native label, e.g. "हिन्दी"
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'id', name: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia' },
  { code: 'hi', name: 'हिन्दी (Hindi)', nativeName: 'हिन्दी' },
  { code: 'th', name: 'ไทย (Thai)', nativeName: 'ไทย' },
  { code: 'ja', name: '日本語 (Japanese)', nativeName: '日本語' },
  { code: 'ko', name: '한국어 (Korean)', nativeName: '한국어' },
  { code: 'zh', name: '中文 (Chinese)', nativeName: '中文' },
  { code: 'es', name: 'Español (Spanish)', nativeName: 'Español' },
  { code: 'fr', name: 'Français (French)', nativeName: 'Français' },
  { code: 'de', name: 'Deutsch (German)', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Português (Portuguese)', nativeName: 'Português' },
  { code: 'ar', name: 'العربية (Arabic)', nativeName: 'العربية' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)', nativeName: 'Tiếng Việt' },
  { code: 'tr', name: 'Türkçe (Turkish)', nativeName: 'Türkçe' },
  { code: 'ms', name: 'Melayu (Malay)', nativeName: 'Melayu' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano' },
  { code: 'nl', name: 'Nederlands', nativeName: 'Nederlands' },
];

/**
 * Detects the user's browser/device language without relying on IP location.
 * Fallback to English if unsupported or unavailable.
 */
export function detectBrowserLanguage(): string {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const rawLocale = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
  if (!rawLocale) return 'en';

  if (rawLocale.startsWith('id')) return 'id';
  if (rawLocale.startsWith('en')) return 'en';
  if (rawLocale.startsWith('hi')) return 'hi';
  if (rawLocale.startsWith('th')) return 'th';
  if (rawLocale.startsWith('ja')) return 'ja';
  if (rawLocale.startsWith('ko')) return 'ko';
  if (rawLocale.startsWith('zh')) return 'zh';
  if (rawLocale.startsWith('es')) return 'es';
  if (rawLocale.startsWith('fr')) return 'fr';
  if (rawLocale.startsWith('de')) return 'de';
  if (rawLocale.startsWith('pt')) return 'pt';
  if (rawLocale.startsWith('ar')) return 'ar';
  if (rawLocale.startsWith('vi')) return 'vi';
  if (rawLocale.startsWith('tr')) return 'tr';
  if (rawLocale.startsWith('ms')) return 'ms';
  if (rawLocale.startsWith('it')) return 'it';
  if (rawLocale.startsWith('nl')) return 'nl';

  return 'en';
}

/**
 * Returns the language option object for a given code.
 */
export function getLanguageOption(code?: string | null): LanguageOption | undefined {
  if (!code) return undefined;
  return LANGUAGE_OPTIONS.find(l => l.code.toLowerCase() === code.toLowerCase());
}

/**
 * Returns native name of the given language code (e.g. 'ja' -> '日本語').
 */
export function getNativeLanguageName(code?: string | null): string {
  const opt = getLanguageOption(code);
  return opt ? opt.nativeName : (code || 'English');
}

/**
 * Resolves effective language based on stored settings.
 * If mode is manual, returns user's explicit selection.
 * If mode is automatic, detects browser locale dynamically.
 */
export function resolveEffectiveLanguage(settings?: {
  languageMode?: 'automatic' | 'manual';
  selectedLanguage?: string;
  language?: string;
} | null): string {
  if (!settings) {
    return detectBrowserLanguage();
  }

  if (settings.languageMode === 'manual' && settings.selectedLanguage) {
    return settings.selectedLanguage;
  }

  if (settings.languageMode === 'automatic') {
    return detectBrowserLanguage();
  }

  if (settings.language) {
    return settings.language;
  }

  return detectBrowserLanguage();
}

/**
 * Comprehensive multi-language translations dictionary.
 * English ('en') serves as the authoritative fallback.
 */
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  // English (Master Fallback)
  en: {
    'nav.home': 'HOME',
    'nav.news': 'NEWS',
    'nav.create': 'CREATE',
    'nav.queue': 'QUEUE',
    'nav.drafts': 'DRAFTS',
    'nav.history': 'HISTORY',
    'nav.settings': 'SETTINGS',
    'settings.title': 'Application Settings',
    'settings.display_language': 'Display Language',
    'settings.display_language_desc': 'Application UI language & localized labels',
    'settings.automatic': 'Automatic',
    'settings.search_placeholder': 'Search Settings (e.g. AI, timezone, notification, backup, media, language, hashtags)...',
    'settings.storage_cache': 'Storage & Cache',
    'settings.clean_now': 'Clean Now',
    'settings.clear_cache': 'Clear Media Cache',
    'settings.cleanup_completed': 'Cleanup completed.',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.share': 'Share',
    'common.success': 'Success',
    'common.error': 'Error'
  },

  // Bahasa Indonesia
  id: {
    'nav.home': 'BERANDA',
    'nav.news': 'BERITA',
    'nav.create': 'BUAT',
    'nav.queue': 'ANTREAN',
    'nav.drafts': 'DRAF',
    'nav.history': 'RIWAYAT',
    'nav.settings': 'PENGATURAN',
    'settings.title': 'Pengaturan Aplikasi',
    'settings.display_language': 'Display Language',
    'settings.display_language_desc': 'Application UI language & localized labels',
    'settings.automatic': 'Automatic',
    'settings.search_placeholder': 'Cari Pengaturan (cth. AI, timezone, notifikasi, backup, media, bahasa)...',
    'settings.storage_cache': 'Penyimpanan & Cache',
    'settings.clean_now': 'Bersihkan Sekarang',
    'settings.clear_cache': 'Hapus Cache Media',
    'settings.cleanup_completed': 'Pembersihan selesai.',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.delete': 'Hapus',
    'common.edit': 'Ubah',
    'common.close': 'Tutup',
    'common.loading': 'Memuat...',
    'common.share': 'Bagikan',
    'common.success': 'Berhasil',
    'common.error': 'Gagal'
  },

  // Hindi (हिन्दी)
  hi: {
    'nav.home': 'होम',
    'nav.news': 'समाचार',
    'nav.create': 'बनाएं',
    'nav.queue': 'कतार',
    'nav.drafts': 'ड्राफ्ट',
    'nav.history': 'इतिहास',
    'nav.settings': 'सेटिंग्स',
    'settings.title': 'एप्लिकेशन सेटिंग्स',
    'settings.display_language': 'प्रदर्शन भाषा',
    'settings.display_language_desc': 'एप्लिकेशन यूआई भाषा और स्थानीयकृत लेबल',
    'settings.automatic': 'स्वचालित',
    'settings.search_placeholder': 'सेटिंग्स खोजें (उदा. AI, टाइमज़ोन, बैकअप, मीडिया, भाषा)...',
    'settings.storage_cache': 'स्टोरेज और कैश',
    'settings.clean_now': 'अभी साफ़ करें',
    'settings.clear_cache': 'मीडिया कैश साफ़ करें',
    'settings.cleanup_completed': 'सफाई पूरी हुई।',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.close': 'बंद करें',
    'common.loading': 'लोड हो रहा है...',
    'common.share': 'साझा करें',
    'common.success': 'सफल',
    'common.error': 'त्रुटि'
  },

  // Thai (ไทย)
  th: {
    'nav.home': 'หน้าแรก',
    'nav.news': 'ข่าว',
    'nav.create': 'สร้าง',
    'nav.queue': 'คิว',
    'nav.drafts': 'ฉบับร่าง',
    'nav.history': 'ประวัติ',
    'nav.settings': 'การตั้งค่า',
    'settings.title': 'การตั้งค่าแอปพลิเคชัน',
    'settings.display_language': 'ภาษาที่แสดง',
    'settings.display_language_desc': 'ภาษาอินเทอร์เฟซและป้ายกำกับที่แปลแล้ว',
    'settings.automatic': 'อัตโนมัติ',
    'settings.search_placeholder': 'ค้นหาการตั้งค่า (เช่น AI, โซนเวลา, สำรองข้อมูล, แคช, ภาษา)...',
    'settings.storage_cache': 'พื้นที่จัดเก็บและแคช',
    'settings.clean_now': 'ล้างข้อมูลตอนนี้',
    'settings.clear_cache': 'ล้างแคชสื่อ',
    'settings.cleanup_completed': 'ล้างข้อมูลเสร็จสมบูรณ์',
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.close': 'ปิด',
    'common.loading': 'กำลังโหลด...',
    'common.share': 'แชร์',
    'common.success': 'สำเร็จ',
    'common.error': 'ข้อผิดพลาด'
  },

  // Japanese (日本語)
  ja: {
    'nav.home': 'ホーム',
    'nav.news': 'ニュース',
    'nav.create': '作成',
    'nav.queue': 'キュー',
    'nav.drafts': '下書き',
    'nav.history': '履歴',
    'nav.settings': '設定',
    'settings.title': 'アプリケーション設定',
    'settings.display_language': '表示言語',
    'settings.display_language_desc': 'アプリケーションUI言語とローカライズラベル',
    'settings.automatic': '自動',
    'settings.search_placeholder': '設定を検索 (AI、タイムゾーン、通知、バックアップ、メディア、言語)...',
    'settings.storage_cache': 'ストレージとキャッシュ',
    'settings.clean_now': '今すぐクリーンアップ',
    'settings.clear_cache': 'メディアキャッシュを削除',
    'settings.cleanup_completed': 'クリーンアップが完了しました。',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.close': '閉じる',
    'common.loading': '読み込み中...',
    'common.share': '共有',
    'common.success': '成功',
    'common.error': 'エラー'
  },

  // Korean (한국어)
  ko: {
    'nav.home': '홈',
    'nav.news': '뉴스',
    'nav.create': '만들기',
    'nav.queue': '대기열',
    'nav.drafts': '임시저장',
    'nav.history': '기록',
    'nav.settings': '설정',
    'settings.title': '애플리케이션 설정',
    'settings.display_language': '표시 언어',
    'settings.display_language_desc': '애플리케이션 UI 언어 및 라벨',
    'settings.automatic': '자동',
    'settings.search_placeholder': '설정 검색 (AI, 시간대, 알림, 백업, 미디어, 언어)...',
    'settings.storage_cache': '저장공간 및 캐시',
    'settings.clean_now': '지금 정리',
    'settings.clear_cache': '미디어 캐시 삭제',
    'settings.cleanup_completed': '정리가 완료되었습니다.',
    'common.save': '저장',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.edit': '수정',
    'common.close': '닫기',
    'common.loading': '로딩 중...',
    'common.share': '공유',
    'common.success': '성공',
    'common.error': '오류'
  },

  // Chinese (中文)
  zh: {
    'nav.home': '首页',
    'nav.news': '新闻',
    'nav.create': '创建',
    'nav.queue': '队列',
    'nav.drafts': '草稿',
    'nav.history': '历史',
    'nav.settings': '设置',
    'settings.title': '应用程序设置',
    'settings.display_language': '显示语言',
    'settings.display_language_desc': '应用程序界面语言和本地化标签',
    'settings.automatic': '自动',
    'settings.search_placeholder': '搜索设置 (如 AI、时区、通知、备份、媒体、语言)...',
    'settings.storage_cache': '存储与缓存',
    'settings.clean_now': '立即清理',
    'settings.clear_cache': '清理媒体缓存',
    'settings.cleanup_completed': '清理完成。',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'common.share': '分享',
    'common.success': '成功',
    'common.error': '错误'
  },

  // Spanish (Español)
  es: {
    'nav.home': 'INICIO',
    'nav.news': 'NOTICIAS',
    'nav.create': 'CREAR',
    'nav.queue': 'COLA',
    'nav.drafts': 'BORRADORES',
    'nav.history': 'HISTORIAL',
    'nav.settings': 'AJUSTES',
    'settings.title': 'Configuración de la Aplicación',
    'settings.display_language': 'Idioma de la interfaz',
    'settings.display_language_desc': 'Idioma de la aplicación y etiquetas localizadas',
    'settings.automatic': 'Automático',
    'settings.search_placeholder': 'Buscar ajustes (ej. IA, zona horaria, notificación, respaldo, idioma)...',
    'settings.storage_cache': 'Almacenamiento y Caché',
    'settings.clean_now': 'Limpiar ahora',
    'settings.clear_cache': 'Borrar caché de medios',
    'settings.cleanup_completed': 'Limpieza completada.',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.close': 'Cerrar',
    'common.loading': 'Cargando...',
    'common.share': 'Compartir',
    'common.success': 'Éxito',
    'common.error': 'Error'
  },

  // French (Français)
  fr: {
    'nav.home': 'ACCUEIL',
    'nav.news': 'ACTUALITÉS',
    'nav.create': 'CRÉER',
    'nav.queue': 'FILE',
    'nav.drafts': 'BROUILLONS',
    'nav.history': 'HISTORIQUE',
    'nav.settings': 'PARAMÈTRES',
    'settings.title': 'Paramètres de l\'application',
    'settings.display_language': 'Langue d\'affichage',
    'settings.display_language_desc': 'Langue de l\'interface et libellés localisés',
    'settings.automatic': 'Automatique',
    'settings.search_placeholder': 'Rechercher des paramètres (ex. IA, fuseau horaire, sauvegarde, langue)...',
    'settings.storage_cache': 'Stockage et cache',
    'settings.clean_now': 'Nettoyer maintenant',
    'settings.clear_cache': 'Vider le cache multimédia',
    'settings.cleanup_completed': 'Nettoyage terminé.',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.close': 'Fermer',
    'common.loading': 'Chargement...',
    'common.share': 'Partager',
    'common.success': 'Succès',
    'common.error': 'Erreur'
  },

  // German (Deutsch)
  de: {
    'nav.home': 'STARTSEITE',
    'nav.news': 'NACHRICHTEN',
    'nav.create': 'ERSTELLEN',
    'nav.queue': 'WARTESCHLANGE',
    'nav.drafts': 'ENTWÜRFE',
    'nav.history': 'VERLAUF',
    'nav.settings': 'EINSTELLUNGEN',
    'settings.title': 'Anwendungseinstellungen',
    'settings.display_language': 'Anzeigesprache',
    'settings.display_language_desc': 'Sprache der Benutzeroberfläche und lokalisierte Beschriftungen',
    'settings.automatic': 'Automatisch',
    'settings.search_placeholder': 'Einstellungen suchen (z. B. KI, Zeitzone, Benachrichtigung, Sprache)...',
    'settings.storage_cache': 'Speicher & Cache',
    'settings.clean_now': 'Jetzt bereinigen',
    'settings.clear_cache': 'Medien-Cache leeren',
    'settings.cleanup_completed': 'Bereinigung abgeschlossen.',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.close': 'Schließen',
    'common.loading': 'Wird geladen...',
    'common.share': 'Teilen',
    'common.success': 'Erfolg',
    'common.error': 'Fehler'
  },

  // Portuguese (Português)
  pt: {
    'nav.home': 'INÍCIO',
    'nav.news': 'NOTÍCIAS',
    'nav.create': 'CRIAR',
    'nav.queue': 'FILA',
    'nav.drafts': 'RASCUNHOS',
    'nav.history': 'HISTÓRICO',
    'nav.settings': 'CONFIGURAÇÕES',
    'settings.title': 'Configurações do Aplicativo',
    'settings.display_language': 'Idioma de Exibição',
    'settings.display_language_desc': 'Idioma da interface e rótulos localizados',
    'settings.automatic': 'Automático',
    'settings.search_placeholder': 'Pesquisar configurações (ex.: IA, fuso horário, backup, idioma)...',
    'settings.storage_cache': 'Armazenamento e Cache',
    'settings.clean_now': 'Limpar Agora',
    'settings.clear_cache': 'Limpar Cache de Mídia',
    'settings.cleanup_completed': 'Limpeza concluída.',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.close': 'Fechar',
    'common.loading': 'Carregando...',
    'common.share': 'Compartilhar',
    'common.success': 'Sucesso',
    'common.error': 'Erro'
  },

  // Arabic (العربية)
  ar: {
    'nav.home': 'الرئيسية',
    'nav.news': 'أخبار',
    'nav.create': 'إنشاء',
    'nav.queue': 'قائمة الانتظار',
    'nav.drafts': 'المسودات',
    'nav.history': 'السجل',
    'nav.settings': 'الإعدادات',
    'settings.title': 'إعدادات التطبيق',
    'settings.display_language': 'لغة العرض',
    'settings.display_language_desc': 'لغة واجهة التطبيق والتسميات المترجمة',
    'settings.automatic': 'تلقائي',
    'settings.search_placeholder': 'البحث في الإعدادات (مثل الذكاء الاصطناعي، المنطقة الزمنية، النسخ الاحتياطي، اللغة)...',
    'settings.storage_cache': 'التخزين وذاكرة التخزين المؤقت',
    'settings.clean_now': 'تنظيف الآن',
    'settings.clear_cache': 'مسح ذاكرة التخزين المؤقت للوسائط',
    'settings.cleanup_completed': 'اكتمل التنظيف.',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.close': 'إغلاق',
    'common.loading': 'جارٍ التحميل...',
    'common.share': 'مشاركة',
    'common.success': 'نجاح',
    'common.error': 'خطأ'
  },

  // Vietnamese (Tiếng Việt)
  vi: {
    'nav.home': 'TRANG CHỦ',
    'nav.news': 'TIN TỨC',
    'nav.create': 'TẠO',
    'nav.queue': 'HÀNG ĐỢI',
    'nav.drafts': 'BẢN NHÁP',
    'nav.history': 'LỊCH SỬ',
    'nav.settings': 'CÀI ĐẶT',
    'settings.title': 'Cài đặt ứng dụng',
    'settings.display_language': 'Ngôn ngữ hiển thị',
    'settings.display_language_desc': 'Ngôn ngữ giao diện người dùng và nhãn bản địa hóa',
    'settings.automatic': 'Tự động',
    'settings.search_placeholder': 'Tìm kiếm cài đặt (ví dụ: AI, múi giờ, sao lưu, ngôn ngữ)...',
    'settings.storage_cache': 'Bộ nhớ & Bộ nhớ đệm',
    'settings.clean_now': 'Dọn dẹp ngay',
    'settings.clear_cache': 'Xóa bộ nhớ đệm đa phương tiện',
    'settings.cleanup_completed': 'Dọn dẹp hoàn tất.',
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.close': 'Đóng',
    'common.loading': 'Đang tải...',
    'common.share': 'Chia sẻ',
    'common.success': 'Thành công',
    'common.error': 'Lỗi'
  },

  // Turkish (Türkçe)
  tr: {
    'nav.home': 'ANA SAYFA',
    'nav.news': 'HABERLER',
    'nav.create': 'OLUŞTUR',
    'nav.queue': 'KUYRUK',
    'nav.drafts': 'TASLAKLAR',
    'nav.history': 'GEÇMİŞ',
    'nav.settings': 'AYARLAR',
    'settings.title': 'Uygulama Ayarları',
    'settings.display_language': 'Görüntüleme Dili',
    'settings.display_language_desc': 'Uygulama arayüz dili ve yerelleştirilmiş etiketler',
    'settings.automatic': 'Otomatik',
    'settings.search_placeholder': 'Ayarları arayın (örn. Yapay Zeka, saat dilimi, yedekleme, dil)...',
    'settings.storage_cache': 'Depolama ve Önbellek',
    'settings.clean_now': 'Şimdi Temizle',
    'settings.clear_cache': 'Medya Önbelleğini Temizle',
    'settings.cleanup_completed': 'Temizlik tamamlandı.',
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.close': 'Kapat',
    'common.loading': 'Yükleniyor...',
    'common.share': 'Paylaş',
    'common.success': 'Başarılı',
    'common.error': 'Hata'
  },

  // Malay (Melayu)
  ms: {
    'nav.home': 'UTAMA',
    'nav.news': 'BERITA',
    'nav.create': 'CIPTA',
    'nav.queue': 'BARISAN',
    'nav.drafts': 'DRAF',
    'nav.history': 'SEJARAH',
    'nav.settings': 'TETAPAN',
    'settings.title': 'Tetapan Aplikasi',
    'settings.display_language': 'Bahasa Paparan',
    'settings.display_language_desc': 'Bahasa antara muka aplikasi & label setempat',
    'settings.automatic': 'Automatik',
    'settings.search_placeholder': 'Cari tetapan (cth. AI, zon masa, sandaran, media, bahasa)...',
    'settings.storage_cache': 'Storan & Cache',
    'settings.clean_now': 'Bersihkan Sekarang',
    'settings.clear_cache': 'Kosongkan Cache Media',
    'settings.cleanup_completed': 'Pembersihan selesai.',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.delete': 'Padam',
    'common.edit': 'Sunting',
    'common.close': 'Tutup',
    'common.loading': 'Memuatkan...',
    'common.share': 'Kongsi',
    'common.success': 'Berjaya',
    'common.error': 'Ralat'
  },

  // Italian (Italiano)
  it: {
    'nav.home': 'HOME',
    'nav.news': 'NOTIZIE',
    'nav.create': 'CREA',
    'nav.queue': 'CODA',
    'nav.drafts': 'BOZZE',
    'nav.history': 'CRONOLOGIA',
    'nav.settings': 'IMPOSTAZIONI',
    'settings.title': 'Impostazioni dell\'applicazione',
    'settings.display_language': 'Lingua di visualizzazione',
    'settings.display_language_desc': 'Lingua dell\'interfaccia utente ed etichette localizzate',
    'settings.automatic': 'Automatico',
    'settings.search_placeholder': 'Cerca impostazioni (es. IA, fuso orario, backup, media, lingua)...',
    'settings.storage_cache': 'Memoria e Cache',
    'settings.clean_now': 'Pulisci ora',
    'settings.clear_cache': 'Cancella cache multimediale',
    'settings.cleanup_completed': 'Pulizia completata.',
    'common.save': 'Salva',
    'common.cancel': 'Annulla',
    'common.delete': 'Elimina',
    'common.edit': 'Modifica',
    'common.close': 'Chiudi',
    'common.loading': 'Caricamento...',
    'common.share': 'Condividi',
    'common.success': 'Completato',
    'common.error': 'Errore'
  },

  // Dutch (Nederlands)
  nl: {
    'nav.home': 'HOME',
    'nav.news': 'NIEUWS',
    'nav.create': 'MAKEN',
    'nav.queue': 'WACHTRIJ',
    'nav.drafts': 'CONCEPTEN',
    'nav.history': 'GESCHIEDENIS',
    'nav.settings': 'INSTELLINGEN',
    'settings.title': 'Applicatie-instellingen',
    'settings.display_language': 'Weergavetaal',
    'settings.display_language_desc': 'Taal van de gebruikersinterface en gelokaliseerde labels',
    'settings.automatic': 'Automatisch',
    'settings.search_placeholder': 'Zoek instellingen (bijv. AI, tijdzone, meldingen, back-up, taal)...',
    'settings.storage_cache': 'Opslag & Cache',
    'settings.clean_now': 'Nu opschonen',
    'settings.clear_cache': 'Mediacache wissen',
    'settings.cleanup_completed': 'Opschonen voltooid.',
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'common.delete': 'Verwijderen',
    'common.edit': 'Bewerken',
    'common.close': 'Sluiten',
    'common.loading': 'Laden...',
    'common.share': 'Delen',
    'common.success': 'Succes',
    'common.error': 'Fout'
  }
};

/**
 * Translation lookup with strict safety guarantees:
 * 1. Checks target language dictionary
 * 2. Falls back to English dictionary
 * 3. Falls back to provided fallback text
 * 4. Falls back to key
 * NEVER returns undefined, null, or blank string.
 */
export function t(
  key: string,
  langOrSettings?: string | { language?: string; languageMode?: 'automatic' | 'manual'; selectedLanguage?: string } | null,
  fallbackText?: string
): string {
  if (!key) return fallbackText || '';

  const langCode = typeof langOrSettings === 'string'
    ? langOrSettings
    : resolveEffectiveLanguage(langOrSettings);

  const targetDict = TRANSLATIONS[langCode];
  if (targetDict && typeof targetDict[key] === 'string' && targetDict[key].trim() !== '') {
    return targetDict[key];
  }

  // Fallback to English dictionary
  const enDict = TRANSLATIONS['en'];
  if (enDict && typeof enDict[key] === 'string' && enDict[key].trim() !== '') {
    return enDict[key];
  }

  // Fallback to provided fallbackText
  if (fallbackText && typeof fallbackText === 'string' && fallbackText.trim() !== '') {
    return fallbackText;
  }

  // Fallback to key itself (guaranteed non-empty)
  return key;
}
