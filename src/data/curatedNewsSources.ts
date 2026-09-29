import { NewsRssSource } from '../types';

/**
 * Curated Global and Country-Specific RSS Feeds.
 * Every source includes countryCode, language, category, priority, and enabled state.
 * All existing Indonesian sources are strictly preserved under countryCode: 'ID'.
 */
export const CURATED_NEWS_SOURCES: NewsRssSource[] = [
  // ==========================================
  // 🇮🇩 INDONESIA (ID) — ALL EXISTING SOURCES PRESERVED
  // ==========================================
  // Persib / Jabar
  {
    id: 'src-detikjabar',
    countryCode: 'ID',
    language: 'id',
    name: 'detikJabar',
    url: 'https://rss.detik.com/index.php/detikjabar',
    category: 'Persib',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-tribunjabar',
    countryCode: 'ID',
    language: 'id',
    name: 'Tribun Jabar Persib',
    url: 'https://jabar.tribunnews.com/rss',
    category: 'Persib',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-bolacom-persib',
    countryCode: 'ID',
    language: 'id',
    name: 'Bola.com Indonesia',
    url: 'https://www.bola.com/feed',
    category: 'Persib',
    active: true,
    priority: 'medium'
  },
  // Sepakbola / Football
  {
    id: 'src-detiksport',
    countryCode: 'ID',
    language: 'id',
    name: 'detikSport',
    url: 'https://rss.detik.com/index.php/sport',
    category: 'Sepakbola',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-bolasport',
    countryCode: 'ID',
    language: 'id',
    name: 'BolaSport',
    url: 'https://www.bolasport.com/rss',
    category: 'Sepakbola',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-bbcsport',
    countryCode: 'ID',
    language: 'en',
    name: 'BBC Sport Football',
    url: 'http://feeds.bbci.co.uk/sport/football/rss.xml',
    category: 'Sepakbola',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-guardian-sport',
    countryCode: 'ID',
    language: 'en',
    name: 'Guardian Football',
    url: 'https://www.theguardian.com/football/rss',
    category: 'Sepakbola',
    active: true,
    priority: 'medium'
  },
  // Nasional
  {
    id: 'src-detiknews',
    countryCode: 'ID',
    language: 'id',
    name: 'detikNews',
    url: 'https://rss.detik.com/index.php/detikcom',
    category: 'Nasional',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-cnn-nasional',
    countryCode: 'ID',
    language: 'id',
    name: 'CNN Indonesia',
    url: 'https://www.cnnindonesia.com/nasional/rss',
    category: 'Nasional',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-antara-terkini',
    countryCode: 'ID',
    language: 'id',
    name: 'Antara News',
    url: 'https://www.antaranews.com/rss/terkini.xml',
    category: 'Nasional',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-tempo-nasional',
    countryCode: 'ID',
    language: 'id',
    name: 'Tempo Nasional',
    url: 'https://rss.tempo.co/nasional',
    category: 'Nasional',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-liputan6',
    countryCode: 'ID',
    language: 'id',
    name: 'Liputan6',
    url: 'https://feed.liputan6.com/rss',
    category: 'Nasional',
    active: true,
    priority: 'medium'
  },
  // Hype / Viral
  {
    id: 'src-antara-top',
    countryCode: 'ID',
    language: 'id',
    name: 'Antara Top News',
    url: 'https://www.antaranews.com/rss/top-news.xml',
    category: 'Hype / Viral',
    active: true,
    priority: 'high'
  },
  // Internasional
  {
    id: 'src-bbc-world',
    countryCode: 'ID',
    language: 'en',
    name: 'BBC World News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'Internasional',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-cnn-inter',
    countryCode: 'ID',
    language: 'id',
    name: 'CNN Internasional',
    url: 'https://www.cnnindonesia.com/internasional/rss',
    category: 'Internasional',
    active: true,
    priority: 'medium'
  },
  // Teknologi
  {
    id: 'src-detikinet',
    countryCode: 'ID',
    language: 'id',
    name: 'detikInet',
    url: 'https://rss.detik.com/index.php/inet',
    category: 'Teknologi',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-antara-tekno',
    countryCode: 'ID',
    language: 'id',
    name: 'Antara Tekno',
    url: 'https://www.antaranews.com/rss/tekno.xml',
    category: 'Teknologi',
    active: true,
    priority: 'medium'
  },

  // ==========================================
  // 🇺🇸 UNITED STATES (US)
  // ==========================================
  {
    id: 'src-us-npr-news',
    countryCode: 'US',
    language: 'en',
    name: 'NPR News',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-us-abc-top',
    countryCode: 'US',
    language: 'en',
    name: 'ABC News Top Stories',
    url: 'https://abcnews.go.com/abcnews/topstories',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-us-npr-politics',
    countryCode: 'US',
    language: 'en',
    name: 'NPR Politics',
    url: 'https://feeds.npr.org/1014/rss.xml',
    category: 'Politics',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-us-politico',
    countryCode: 'US',
    language: 'en',
    name: 'Politico',
    url: 'https://rss.politico.com/politics-news.xml',
    category: 'Politics',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-us-verge',
    countryCode: 'US',
    language: 'en',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'Technology',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-us-techcrunch',
    countryCode: 'US',
    language: 'en',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Technology',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-us-cnbc-biz',
    countryCode: 'US',
    language: 'en',
    name: 'CNBC Business',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=business&output=rss',
    category: 'Business',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-us-espn',
    countryCode: 'US',
    language: 'en',
    name: 'ESPN Sports',
    url: 'https://www.espn.com/espn/rss/news',
    category: 'Sports',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-us-cbssports',
    countryCode: 'US',
    language: 'en',
    name: 'CBS Sports',
    url: 'https://www.cbssports.com/rss/headlines/',
    category: 'Sports',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-us-hollywood-reporter',
    countryCode: 'US',
    language: 'en',
    name: 'The Hollywood Reporter',
    url: 'https://www.hollywoodreporter.com/feed/',
    category: 'Entertainment',
    active: true,
    priority: 'medium'
  },

  // ==========================================
  // 🇬🇧 UNITED KINGDOM (GB)
  // ==========================================
  {
    id: 'src-gb-bbc-uk',
    countryCode: 'GB',
    language: 'en',
    name: 'BBC News UK',
    url: 'http://feeds.bbci.co.uk/news/uk/rss.xml',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-gb-guardian-uk',
    countryCode: 'GB',
    language: 'en',
    name: 'The Guardian UK',
    url: 'https://www.theguardian.com/uk-news/rss',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-gb-skynews',
    countryCode: 'GB',
    language: 'en',
    name: 'Sky News UK',
    url: 'https://feeds.skynews.com/feeds/rss/uk.xml',
    category: 'National',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-gb-bbc-football',
    countryCode: 'GB',
    language: 'en',
    name: 'BBC Premier League & Football',
    url: 'http://feeds.bbci.co.uk/sport/football/rss.xml',
    category: 'Football',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-gb-skysports-football',
    countryCode: 'GB',
    language: 'en',
    name: 'Sky Sports Premier League',
    url: 'https://www.skysports.com/rss/12040',
    category: 'Football',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-gb-bbc-business',
    countryCode: 'GB',
    language: 'en',
    name: 'BBC Business UK',
    url: 'http://feeds.bbci.co.uk/news/business/rss.xml',
    category: 'Business',
    active: true,
    priority: 'medium'
  },

  // ==========================================
  // 🇯🇵 JAPAN (JP)
  // ==========================================
  {
    id: 'src-jp-nhk-news',
    countryCode: 'JP',
    language: 'ja',
    name: 'NHK 主要ニュース (NHK News)',
    url: 'https://www.nhk.or.jp/rss/news/cat0.xml',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-jp-yahoo-top',
    countryCode: 'JP',
    language: 'ja',
    name: 'Yahoo! JAPAN ニュース トピックス',
    url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-jp-yahoo-sports',
    countryCode: 'JP',
    language: 'ja',
    name: 'Yahoo! JAPAN スポーツ (Sports & J-League)',
    url: 'https://news.yahoo.co.jp/rss/topics/sports.xml',
    category: 'Sports',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-jp-itmedia',
    countryCode: 'JP',
    language: 'ja',
    name: 'ITmedia 総合記事 (Technology)',
    url: 'https://rss.itmedia.co.jp/rss/2.0/itmedia_all.xml',
    category: 'Technology',
    active: true,
    priority: 'medium'
  },

  // ==========================================
  // 🇩🇪 GERMANY (DE)
  // ==========================================
  {
    id: 'src-de-tagesschau',
    countryCode: 'DE',
    language: 'de',
    name: 'Tagesschau',
    url: 'https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-de-spiegel',
    countryCode: 'DE',
    language: 'de',
    name: 'Der Spiegel',
    url: 'https://www.spiegel.de/schlagzeilen/index.rss',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-de-kicker',
    countryCode: 'DE',
    language: 'de',
    name: 'Kicker Bundesliga & Sport',
    url: 'https://rss.kicker.de/news/aktuell',
    category: 'Football',
    active: true,
    priority: 'high'
  },

  // ==========================================
  // 🇫🇷 FRANCE (FR)
  // ==========================================
  {
    id: 'src-fr-lemonde',
    countryCode: 'FR',
    language: 'fr',
    name: 'Le Monde',
    url: 'https://www.lemonde.fr/rss/une.xml',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-fr-france24',
    countryCode: 'FR',
    language: 'fr',
    name: 'France 24 Actualités',
    url: 'https://www.france24.com/fr/rss',
    category: 'National',
    active: true,
    priority: 'high'
  },

  // ==========================================
  // 🇪🇸 SPAIN (ES)
  // ==========================================
  {
    id: 'src-es-elpais',
    countryCode: 'ES',
    language: 'es',
    name: 'El País',
    url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-es-marca',
    countryCode: 'ES',
    language: 'es',
    name: 'Marca La Liga & Deportes',
    url: 'https://e00-marca.uecdn.es/rss/portada.xml',
    category: 'Football',
    active: true,
    priority: 'high'
  },

  // ==========================================
  // 🇦🇺 AUSTRALIA (AU)
  // ==========================================
  {
    id: 'src-au-abc-news',
    countryCode: 'AU',
    language: 'en',
    name: 'ABC News Australia',
    url: 'https://www.abc.net.au/news/feed/51120/rss.xml',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-au-abc-sports',
    countryCode: 'AU',
    language: 'en',
    name: 'ABC Sport Australia',
    url: 'https://www.abc.net.au/news/feed/45924/rss.xml',
    category: 'Sports',
    active: true,
    priority: 'medium'
  },

  // ==========================================
  // 🇨🇦 CANADA (CA)
  // ==========================================
  {
    id: 'src-ca-cbc-top',
    countryCode: 'CA',
    language: 'en',
    name: 'CBC News Top Stories',
    url: 'https://www.cbc.ca/cmlink/rss-topstories',
    category: 'National',
    active: true,
    priority: 'high'
  },

  // ==========================================
  // 🇧🇷 BRAZIL (BR)
  // ==========================================
  {
    id: 'src-br-g1',
    countryCode: 'BR',
    language: 'pt',
    name: 'G1 Brasil',
    url: 'https://g1.globo.com/rss/g1/brasil/',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-br-ge',
    countryCode: 'BR',
    language: 'pt',
    name: 'Globo Esporte (Futebol)',
    url: 'https://ge.globo.com/dynamo/rss2.xml',
    category: 'Football',
    active: true,
    priority: 'high'
  },

  // ==========================================
  // 🇮🇳 INDIA (IN)
  // ==========================================
  {
    id: 'src-in-thehindu',
    countryCode: 'IN',
    language: 'en',
    name: 'The Hindu National',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    category: 'National',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-in-cricinfo',
    countryCode: 'IN',
    language: 'en',
    name: 'ESPNcricinfo Cricket',
    url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    category: 'Sports',
    active: true,
    priority: 'high'
  },

  // ==========================================
  // 🌎 GLOBAL / INTERNATIONAL SOURCES
  // ==========================================
  {
    id: 'src-global-bbc-world',
    countryCode: 'GLOBAL',
    isGlobal: true,
    language: 'en',
    name: 'BBC World News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'International',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-global-aljazeera',
    countryCode: 'GLOBAL',
    isGlobal: true,
    language: 'en',
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'International',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-global-france24-en',
    countryCode: 'GLOBAL',
    isGlobal: true,
    language: 'en',
    name: 'France 24 International (EN)',
    url: 'https://www.france24.com/en/rss',
    category: 'International',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-global-un-news',
    countryCode: 'GLOBAL',
    isGlobal: true,
    language: 'en',
    name: 'UN News Global Perspective',
    url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    category: 'International',
    active: true,
    priority: 'medium'
  },
  {
    id: 'src-global-techcrunch',
    countryCode: 'GLOBAL',
    isGlobal: true,
    language: 'en',
    name: 'TechCrunch Global Tech',
    url: 'https://techcrunch.com/feed/',
    category: 'Technology',
    active: true,
    priority: 'high'
  },
  {
    id: 'src-global-cnbc-world',
    countryCode: 'GLOBAL',
    isGlobal: true,
    language: 'en',
    name: 'CNBC International Business',
    url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=world&output=rss',
    category: 'Business',
    active: true,
    priority: 'medium'
  }
];
