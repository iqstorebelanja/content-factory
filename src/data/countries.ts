// ==========================================
// GLOBAL COUNTRY & REGION REGISTRY
// ==========================================

export interface CountryInfo {
  code: string; // ISO 2-letter uppercase or 'GLOBAL'
  name: string;
  nativeName?: string;
  flag: string;
  defaultLanguage: string; // ISO 639-1 code (e.g. 'id', 'en', 'ja')
  languages: string[];
  locales: string[];
  currency?: string;
  sportsCategories?: string[];
  specialCategories?: string[];
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  {
    code: 'GLOBAL',
    name: 'Global / International',
    nativeName: 'Worldwide',
    flag: '🌎',
    defaultLanguage: 'en',
    languages: ['en', 'fr', 'es', 'ar'],
    locales: ['*'],
    sportsCategories: ['World Sports', 'Olympics', 'International Football'],
    specialCategories: ['World News', 'Global Tech', 'Global Economy']
  },
  {
    code: 'ID',
    name: 'Indonesia',
    nativeName: 'Indonesia',
    flag: '🇮🇩',
    defaultLanguage: 'id',
    languages: ['id'],
    locales: ['id', 'id-ID', 'in', 'in-ID'],
    sportsCategories: ['Persib', 'Liga 1', 'Football'],
    specialCategories: ['Persib', 'National', 'Trending']
  },
  {
    code: 'US',
    name: 'United States',
    nativeName: 'United States',
    flag: '🇺🇸',
    defaultLanguage: 'en',
    languages: ['en', 'es'],
    locales: ['en-US'],
    sportsCategories: ['NFL', 'NBA', 'MLB', 'NHL', 'MLS', 'College Sports'],
    specialCategories: ['National', 'Politics', 'Wall Street', 'Silicon Valley']
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    flag: '🇬🇧',
    defaultLanguage: 'en',
    languages: ['en'],
    locales: ['en-GB'],
    sportsCategories: ['Premier League', 'Championship', 'FA Cup', 'Rugby', 'Cricket'],
    specialCategories: ['National', 'Politics', 'Westminster', 'City of London']
  },
  {
    code: 'JP',
    name: 'Japan',
    nativeName: '日本',
    flag: '🇯🇵',
    defaultLanguage: 'ja',
    languages: ['ja'],
    locales: ['ja', 'ja-JP'],
    sportsCategories: ['J-League', 'NPB Baseball', 'Sumo', 'Motorsport'],
    specialCategories: ['National', 'Tech / Anime', 'Tokyo Update']
  },
  {
    code: 'KR',
    name: 'South Korea',
    nativeName: '대한민국',
    flag: '🇰🇷',
    defaultLanguage: 'ko',
    languages: ['ko'],
    locales: ['ko', 'ko-KR'],
    sportsCategories: ['K-League', 'KBO Baseball', 'E-Sports'],
    specialCategories: ['National', 'K-Pop / Culture', 'Tech']
  },
  {
    code: 'DE',
    name: 'Germany',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    defaultLanguage: 'de',
    languages: ['de'],
    locales: ['de', 'de-DE', 'de-AT', 'de-CH'],
    sportsCategories: ['Bundesliga', 'DFB-Pokal', 'Motorsport'],
    specialCategories: ['National', 'Politik', 'Wirtschaft']
  },
  {
    code: 'FR',
    name: 'France',
    nativeName: 'France',
    flag: '🇫🇷',
    defaultLanguage: 'fr',
    languages: ['fr'],
    locales: ['fr', 'fr-FR', 'fr-BE', 'fr-CH'],
    sportsCategories: ['Ligue 1', 'Rugby Top 14', 'Tour de France'],
    specialCategories: ['National', 'Politique', 'Culture']
  },
  {
    code: 'ES',
    name: 'Spain',
    nativeName: 'España',
    flag: '🇪🇸',
    defaultLanguage: 'es',
    languages: ['es'],
    locales: ['es', 'es-ES'],
    sportsCategories: ['La Liga', 'Copa del Rey', 'Baloncesto'],
    specialCategories: ['Nacional', 'Política', 'Economía']
  },
  {
    code: 'IT',
    name: 'Italy',
    nativeName: 'Italia',
    flag: '🇮🇹',
    defaultLanguage: 'it',
    languages: ['it'],
    locales: ['it', 'it-IT'],
    sportsCategories: ['Serie A', 'Coppa Italia', 'MotoGP'],
    specialCategories: ['Nazionale', 'Politica', 'Economia']
  },
  {
    code: 'AU',
    name: 'Australia',
    nativeName: 'Australia',
    flag: '🇦🇺',
    defaultLanguage: 'en',
    languages: ['en'],
    locales: ['en-AU'],
    sportsCategories: ['AFL', 'NRL', 'Cricket', 'A-League'],
    specialCategories: ['National', 'Politics', 'Business']
  },
  {
    code: 'CA',
    name: 'Canada',
    nativeName: 'Canada',
    flag: 'en',
    defaultLanguage: 'en',
    languages: ['en', 'fr'],
    locales: ['en-CA', 'fr-CA'],
    sportsCategories: ['NHL', 'CFL', 'Curling', 'MLS'],
    specialCategories: ['National', 'Ottawa Update', 'Economy']
  },
  {
    code: 'BR',
    name: 'Brazil',
    nativeName: 'Brasil',
    flag: '🇧🇷',
    defaultLanguage: 'pt',
    languages: ['pt'],
    locales: ['pt', 'pt-BR'],
    sportsCategories: ['Brasileirão', 'Copa do Brasil', 'Futebol'],
    specialCategories: ['Nacional', 'Política', 'Economia']
  },
  {
    code: 'IN',
    name: 'India',
    nativeName: 'भारत',
    flag: '🇮🇳',
    defaultLanguage: 'en',
    languages: ['en', 'hi'],
    locales: ['en-IN', 'hi-IN', 'hi'],
    sportsCategories: ['IPL', 'Cricket', 'ISL Football'],
    specialCategories: ['National', 'Bollywood', 'Tech / Startups']
  },
  {
    code: 'SG',
    name: 'Singapore',
    nativeName: 'Singapore',
    flag: '🇸🇬',
    defaultLanguage: 'en',
    languages: ['en', 'zh', 'ms', 'ta'],
    locales: ['en-SG', 'zh-SG'],
    sportsCategories: ['Singapore Premier League', 'F1 Grand Prix'],
    specialCategories: ['National', 'Finance', 'Southeast Asia']
  },
  {
    code: 'MY',
    name: 'Malaysia',
    nativeName: 'Malaysia',
    flag: '🇲🇾',
    defaultLanguage: 'ms',
    languages: ['ms', 'en'],
    locales: ['ms', 'ms-MY', 'en-MY'],
    sportsCategories: ['Liga Super Malaysia', 'Badminton', 'Sepak Takraw'],
    specialCategories: ['Nasional', 'Politik', 'Ekonomi']
  },
  {
    code: 'NL',
    name: 'Netherlands',
    nativeName: 'Nederland',
    flag: '🇳🇱',
    defaultLanguage: 'nl',
    languages: ['nl'],
    locales: ['nl', 'nl-NL'],
    sportsCategories: ['Eredivisie', 'KNVB Beker', 'Schaatsen'],
    specialCategories: ['Nationaal', 'Politiek', 'Binnenland']
  }
];

export const CORE_CATEGORIES = [
  'Trending',
  'National',
  'International',
  'Politics',
  'Business',
  'Technology',
  'Entertainment',
  'Sports',
  'Football',
  'Lifestyle',
  'Health',
  'Travel'
];

export interface CountryCategoryMapping {
  categoryId: string;
  label: string;
  countryCode: string;
}

export const COUNTRY_SPECIFIC_CATEGORIES: CountryCategoryMapping[] = [
  { categoryId: 'persib', label: 'Persib', countryCode: 'ID' },
  { categoryId: 'liga_1', label: 'Liga 1', countryCode: 'ID' },
  { categoryId: 'premier_league', label: 'Premier League', countryCode: 'GB' },
  { categoryId: 'nba', label: 'NBA', countryCode: 'US' },
  { categoryId: 'nfl', label: 'NFL', countryCode: 'US' },
  { categoryId: 'j_league', label: 'J-League', countryCode: 'JP' },
  { categoryId: 'k_league', label: 'K-League', countryCode: 'KR' },
  { categoryId: 'bundesliga', label: 'Bundesliga', countryCode: 'DE' },
  { categoryId: 'ligue_1', label: 'Ligue 1', countryCode: 'FR' },
  { categoryId: 'la_liga', label: 'La Liga', countryCode: 'ES' },
  { categoryId: 'serie_a', label: 'Serie A', countryCode: 'IT' },
  { categoryId: 'ipl', label: 'IPL', countryCode: 'IN' }
];

/**
 * Strips any accidental country suffix like "(Indonesia)" or "(United Kingdom)" from a category label.
 */
export function formatCategoryLabel(category: string): string {
  if (!category) return 'National';
  const stripped = category
    .replace(/\s*\((Indonesia|United States|United Kingdom|Japan|South Korea|Germany|France|Spain|Italy|Australia|Canada|Brazil|India|Singapore|Malaysia|Netherlands|Global|International)\)\s*$/i, '')
    .trim();

  // Normalize common localized category names to global English equivalents
  const lower = stripped.toLowerCase();
  if (lower === 'nasional' || lower === 'nacional' || lower === 'nazionale' || lower === 'nationaal') return 'National';
  if (lower === 'internasional') return 'International';
  if (lower === 'sepakbola' || lower === 'futebol') return 'Football';
  if (lower === 'teknologi') return 'Technology';
  if (lower === 'ekonomi' || lower === 'economía' || lower === 'economia' || lower === 'wirtschaft') return 'Business';
  if (lower === 'hype / viral' || lower === 'hype/viral' || lower === 'viral / trending') return 'Trending';
  return stripped;
}

/**
 * Checks if two category names represent the same logical category (accounting for aliases).
 */
export function categoriesMatch(catA: string, catB: string): boolean {
  if (!catA || !catB) return false;
  const normA = formatCategoryLabel(catA).toLowerCase();
  const normB = formatCategoryLabel(catB).toLowerCase();
  return normA === normB || catA.trim().toLowerCase() === catB.trim().toLowerCase();
}

/**
 * Gets a CountryInfo by code (case-insensitive)
 */
export function getCountryByCode(code: string): CountryInfo {
  const normalized = (code || '').toUpperCase().trim();
  const found = SUPPORTED_COUNTRIES.find(c => c.code === normalized);
  if (found) return found;

  // Fallback to GLOBAL if unknown
  return SUPPORTED_COUNTRIES[0];
}

/**
 * Detects the user's default country from the browser / device navigator.language.
 * Does NOT use IP address. If unable to match a known country, safely returns 'GLOBAL'.
 */
export function detectCountryFromLocale(): CountryInfo {
  try {
    if (typeof navigator === 'undefined') {
      return getCountryByCode('GLOBAL');
    }

    const primaryLocale = navigator.language || (navigator.languages && navigator.languages[0]) || '';
    if (!primaryLocale) {
      return getCountryByCode('GLOBAL');
    }

    const cleanLocale = primaryLocale.toLowerCase().trim();

    // 1. Direct match on country subtag (e.g. en-US -> US, id-ID -> ID, pt-BR -> BR)
    const parts = cleanLocale.split(/[-_]/);
    if (parts.length >= 2) {
      const regionCode = parts[1].toUpperCase();
      const matchByRegion = SUPPORTED_COUNTRIES.find(c => c.code === regionCode);
      if (matchByRegion) {
        return matchByRegion;
      }
    }

    // 2. Match known language prefixes when region subtag is omitted or ambiguous
    const langCode = parts[0];
    switch (langCode) {
      case 'id':
      case 'in':
        return getCountryByCode('ID');
      case 'ja':
        return getCountryByCode('JP');
      case 'ko':
        return getCountryByCode('KR');
      case 'de':
        return getCountryByCode('DE');
      case 'fr':
        return getCountryByCode('FR');
      case 'it':
        return getCountryByCode('IT');
      case 'nl':
        return getCountryByCode('NL');
      case 'es':
        return getCountryByCode('ES');
      case 'pt':
        return getCountryByCode('BR');
      case 'ms':
        return getCountryByCode('MY');
      case 'hi':
        return getCountryByCode('IN');
      default:
        // Generic English or other language without clear country -> GLOBAL
        return getCountryByCode('GLOBAL');
    }
  } catch (err) {
    console.warn('Failed to detect locale country:', err);
    return getCountryByCode('GLOBAL');
  }
}

/**
 * Returns available categories for a given country code,
 * combining core categories with country-specific sports/topics.
 */
export function getCategoriesForCountry(countryCode: string): string[] {
  const country = getCountryByCode(countryCode);
  const categories = new Set<string>(CORE_CATEGORIES);

  // Add country sports & special categories (sanitized without country suffix)
  if (country.sportsCategories) {
    country.sportsCategories.forEach(cat => categories.add(formatCategoryLabel(cat)));
  }
  if (country.specialCategories) {
    country.specialCategories.forEach(cat => categories.add(formatCategoryLabel(cat)));
  }

  // Ensure 'All Categories' is never duplicated in country specific lists
  categories.delete('All Categories');

  return Array.from(categories);
}
