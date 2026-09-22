import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { parseRssXml } from './src/utils/rssParser';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy initialize Gemini API client to ensure stability if key is updated
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

function toCleanArray(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map(v => typeof v === 'string' ? v.trim() : String(v).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

// Helper to generate context-aware copy if all upstream AI models face transient demand spikes
function generateContextualFallback(topic?: string, mediaType?: string, mediaName?: string) {
  const cleanTopic = (topic || 'Keseruan Trip & Wisata Jangari').trim();
  const isJangari = /jangari/i.test(cleanTopic);
  const isFishing = /mancing|fish/i.test(cleanTopic);

  let title = cleanTopic;
  if (!/^(seru|tips|review|jelajah|spot|strike)/i.test(title)) {
    title = `${cleanTopic} - Momen Seru & Inspirasi Menarik`;
  }

  let caption = `${cleanTopic}! Pengalaman menarik yang wajib dicoba dan dibagikan bersama teman serta keluarga.`;
  if (isJangari || isFishing) {
    caption = `Sensasi seru di Waduk Jangari! Pemandangan danau yang tenang dan spot mancing terbaik untuk refreshing akhir pekan.`;
  }

  const description = `${cleanTopic}.\n\nMenikmati suasana yang asri dengan panorama indah di sekitar waduk serta keramahan warga lokal. Dokumentasi perjalanan seru yang terekam sempurna.`;
  const callToAction = 'Tonton selengkapnya, simpan, dan bagikan ke teman-temanmu!';
  
  let hashtags = ['#Wisata', '#Trending', '#ExploreIndonesia', '#Creator', '#Viral'];
  if (isJangari || isFishing) {
    hashtags = ['#Jangari', '#MancingMania', '#WadukJangari', '#WisataJawaBarat', '#SpotMancing'];
  }

  return { title, caption, description, callToAction, hashtags: hashtags.slice(0, 5) };
}

// Fallback generator for platform-specific content
function generatePlatformSpecificFallback(
  topic?: string,
  mediaType?: string,
  mediaName?: string,
  platforms: string[] = [],
  fbPageContentType: 'post' | 'reel' = 'post',
  fbProfileContentType: 'post' | 'reel' = 'post'
) {
  const cleanTopic = (topic || 'Keseruan Trip & Wisata Jangari').trim();
  const isJangari = /jangari/i.test(cleanTopic);
  const isFishing = /mancing|fish/i.test(cleanTopic);

  const outputs: Record<string, any> = {};

  if (platforms.includes('facebook_page')) {
    if (fbPageContentType === 'reel') {
      outputs['facebook_page'] = {
        opening: isJangari || isFishing ? 'Momen strike mantap di Waduk Jangari! 🎣🔥' : `Keseruan ${cleanTopic} yang wajib kamu tonton! 🔥`,
        caption: isJangari || isFishing
          ? 'Sensasi strike ikan air tawar di Waduk Jangari, suasana sejuk dan spot keramba terapung yang memukau. Tonton keseruannya sampai selesai ya!'
          : `Highlight seru seputar ${cleanTopic}! Momen berharga yang penuh energi positif dan pengalaman menarik.`,
        callToAction: 'Follow halaman kami untuk video reel seru lainnya!',
        hashtags: isJangari || isFishing 
          ? ['#FacebookReels', '#ReelsFB', '#Jangari', '#MancingMania', '#WisataJawaBarat']
          : ['#FacebookReels', '#Reels', '#Trending', '#Explore', '#Viral']
      };
    } else {
      outputs['facebook_page'] = {
        caption: isJangari || isFishing
          ? `Sensasi seru di Waduk Jangari, Jawa Barat! Bagi pecinta mancing dan penikmat alam, Jangari bukan sekadar tempat refreshing, tapi juga surganya strike ikan air tawar dengan panorama perairan dan keramba terapung yang menenangkan.\n\nBanyak spot menarik yang bisa dijelajahi mulai dari pagi hingga sore hari bersama keluarga atau komunitas mancing.`
          : `${cleanTopic}!\n\nPengalaman seru dan momen inspiratif yang sayang untuk dilewatkan. Suasana menyenangkan dan pemandangan menarik yang cocok dinikmati bersama teman dan keluarga tercinta.`,
        callToAction: 'Simpan postingan ini untuk referensi liburanmu dan bagikan ke teman-temanmu ya!',
        hashtags: isJangari || isFishing 
          ? ['#Jangari', '#MancingMania', '#WisataJawaBarat', '#WadukJangari', '#NgabloeVenture']
          : ['#Wisata', '#Trending', '#ExploreIndonesia', '#Creator', '#Viral']
      };
    }
  }

  if (platforms.includes('facebook_profile') || platforms.includes('facebook')) {
    const profKey = platforms.includes('facebook_profile') ? 'facebook_profile' : 'facebook';
    if (fbProfileContentType === 'reel') {
      outputs[profKey] = {
        opening: isJangari || isFishing ? 'Nggak nyangka dapet momen sekeren ini di Jangari! 🎣' : `Serunya hari ini bareng teman-teman! ✨`,
        caption: isJangari || isFishing
          ? 'Nggak nyangka dapet momen sekeren ini di Jangari! Suasana tenang, ikan makan kencang, bener-bener refreshing yang mantap.'
          : `Momen seru ${cleanTopic} yang berkesan banget hari ini. Senang bisa mengabadikan suasana ini!`,
        hashtags: isJangari || isFishing
          ? ['#FacebookReels', '#Mancing', '#Jangari', '#LiburanSeru']
          : ['#Reels', '#DailyVibe', '#StoryToday', '#Friends']
      };
    } else {
      outputs[profKey] = {
        caption: isJangari || isFishing
          ? 'Alhamdulillah bisa refreshing ke Waduk Jangari hari ini. Suasananya tenang banget, angin sepoi-sepoi sambil nunggu joran. Pas banget buat lepas penat bareng kawan-kawan setelah rutinitas seminggu. Ada yang hobi mancing ke sini juga?'
          : `Hari ini seru banget berkesempatan menikmati ${cleanTopic}. Pengalaman yang berharga dan banyak pelajaran baru yang bisa diambil. Senang rasanya bisa berbagi momen ini dengan kalian semua.`,
        hashtags: isJangari || isFishing
          ? ['#CeritaHariIni', '#Jangari', '#MancingSantai', '#WeekendVibes']
          : ['#CatatanHariIni', '#LifeUpdate', '#MomenBahagia', '#Bersyukur']
      };
    }
  }

  if (platforms.includes('instagram')) {
    outputs['instagram'] = {
      opening: isJangari || isFishing ? 'Spot mancing terbaik dengan view juara di Jangari! 🎣✨' : `${cleanTopic}! Momen seru yang wajib diabadikan ✨`,
      caption: isJangari || isFishing
        ? `Spot mancing terbaik dengan view juara di Jangari! 🎣✨\n\nMenikmati ketenangan danau sambil nunggu joran melengkung. Udara sejuk, air tenang, dan suasana santai bikin betah berlama-lama.\n\nTag partner mancing kamu yang wajib diajak ke sini!`
        : `${cleanTopic}! Momen seru yang wajib diabadikan ✨\n\nMenikmati setiap detik petualangan dengan pemandangan luar biasa dan cerita baru.\n\nDouble tap kalau kamu suka vibes seperti ini! ❤️`,
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#WisataJawaBarat', '#Fishing', '#NgabloeVenture', '#MancingMania', '#SpotMancing', '#DanauJangari', '#CianjurExplore', '#IndoFishing']
        : ['#Explore', '#TravelGram', '#Visuals', '#Inspiration', '#Community', '#Storytelling', '#IndoTravel', '#Creators', '#DailyPost', '#InstaGood']
    };
  }

  if (platforms.includes('tiktok')) {
    outputs['tiktok'] = {
      hook: isJangari || isFishing ? 'Spot mancing rahasia di Waduk Jangari yang wajib kamu coba!' : `Kalian harus tahu serunya ${cleanTopic}!`,
      caption: isJangari || isFishing
        ? 'Spot mancing rahasia di Waduk Jangari! View tenang, strike mantap. Jangan lupa bookmark buat trip weekend kamu! 🎣'
        : `Momen seru ${cleanTopic} yang bikin nagih! Tonton sampai habis ya! 🔥`,
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#TikTokTravel', '#MancingMania', '#SpotMancing']
        : ['#Trending', '#FYP', '#TikTokCreator', '#SerunyaLiburan', '#Viral']
    };
  }

  if (platforms.includes('youtube')) {
    outputs['youtube'] = {
      title: isJangari || isFishing ? 'Jangari, Surga Pemancing di Jawa Barat - Spot & Suasana Seru' : `${cleanTopic} - Momen Seru & Dokumentasi Lengkap`,
      description: isJangari || isFishing
        ? `Jangari bukan cuma tempat mancing, tapi juga menawarkan panorama dan suasana yang menarik untuk dijelajahi.\n\nDi video ini kami mengabadikan keseruan suasana danau, spot keramba terapung, dan keindahan alam Waduk Jangari di Cianjur, Jawa Barat.\n\nJangan lupa Like, Comment, dan Subscribe untuk update video petualangan berikutnya!`
        : `Dokumentasi lengkap mengenai ${cleanTopic}.\n\nTerima kasih sudah menonton, jangan lupa Like, Comment, dan Subscribe ya!`,
      tags: isJangari || isFishing
        ? ['jangari', 'mancing jangari', 'waduk jangari', 'mancing cianjur', 'spot mancing liar', 'mancing mania', 'wisata jawa barat', 'ikan nila babon', 'keramba terapung', 'fishing vlog', 'petualangan mancing', 'danau cirata jangari']
        : ['vlog', 'trip', 'review', 'inspirasi', 'video viral', 'kreator', 'dokumentasi', 'travel'],
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#WisataJawaBarat', '#Fishing', '#YouTubeShorts']
        : ['#Explore', '#Creator', '#Trending', '#Video', '#Shorts']
    };
  }

  if (platforms.includes('twitter')) {
    outputs['twitter'] = {
      caption: isJangari || isFishing
        ? 'Keseruan trip mancing di Waduk Jangari hari ini! Suasana tenang, spot keramba mantap untuk refreshing.'
        : `Update seru seputar ${cleanTopic}! Pengalaman menarik yang layak dibagikan.`,
      hashtags: isJangari || isFishing
        ? ['#Jangari', '#Mancing', '#Wisata']
        : ['#Explore', '#Update', '#Trending']
    };
  }

  if (platforms.includes('whatsapp')) {
    outputs['whatsapp'] = {
      caption: isJangari || isFishing
        ? `Halo kawan-kawan! Mau share momen seru trip mancing di Waduk Jangari, Jawa Barat nih. Pemandangannya adem dan spotnya asyik banget buat kumpul sambil mancing.`
        : `Halo semuanya! Mau berbagi info dan dokumentasi seru tentang ${cleanTopic}. Semoga bisa jadi inspirasi ya!`,
      callToAction: 'Kira-kira kapan kita agendakan jalan atau mancing bareng lagi? Kabari ya!'
    };
  }

  return outputs;
}

// Dedicated Platform-Specific Content Generator Endpoint
app.post('/api/ai/generate-platform-content', async (req, res) => {
  const { topic, mediaType, mediaName, platforms, singlePlatform, fbPageContentType = 'post', fbProfileContentType = 'post' } = req.body;

  const targetPlatforms: string[] = singlePlatform 
    ? [singlePlatform] 
    : (Array.isArray(platforms) && platforms.length > 0 ? platforms : ['facebook_page', 'facebook_profile', 'instagram', 'tiktok', 'youtube', 'twitter', 'whatsapp']);

  try {
    const ai = getGeminiClient();

    const fbPageRule = fbPageContentType === 'reel'
      ? `1. FACEBOOK PAGE (REEL format):
   - "opening": catchy hook line for Facebook Reel
   - "caption": short engaging Reel caption with energetic tone
   - "callToAction": optional quick call-to-action (e.g. "Follow halaman kami untuk update berikutnya!")
   - "hashtags": up to 5 relevant hashtags with # (including #FacebookReels or #Reels)`
      : `1. FACEBOOK PAGE (PAGE POST format):
   - "caption": natural Facebook page style, descriptive, engaging paragraphs
   - "callToAction": optional call-to-action
   - "hashtags": up to 5 relevant hashtags with #`;

    const fbProfileRule = fbProfileContentType === 'reel'
      ? `2. FACEBOOK PERSONAL PROFILE (PROFILE REEL format):
   - "opening": engaging opening hook for personal profile Reel
   - "caption": short Reel caption with an engaging opening, fun and personal
   - "hashtags": up to 5 relevant hashtags with # (e.g. #FacebookReels #StoryToday)`
      : `2. FACEBOOK PERSONAL PROFILE (PROFILE POST format):
   - "caption": natural personal-profile style caption (authentic, friendly, warm first-person perspective, sharing genuine moments with friends & family, less commercial)
   - "hashtags": up to 3-5 relevant hashtags with #`;

    const prompt = `You are an expert multi-platform social media content generator.
The user wants tailored social media copy for specific platforms based strictly on their topic.

Topic / Description provided by user: "${topic || 'General social media update'}"
Media Attached: ${mediaType ? `${mediaType} (filename: ${mediaName || 'file'})` : 'None specified'}
Target Platforms to generate: ${targetPlatforms.join(', ')}

Platform Requirements:
${fbPageRule}

${fbProfileRule}

3. INSTAGRAM:
   - "opening": engaging opening hook line
   - "caption": visually structured caption with line breaks
   - "hashtags": up to 10 relevant hashtags with #
4. TIKTOK:
   - "hook": strong short hook for short-form video
   - "caption": punchy short caption
   - "hashtags": up to 5 relevant hashtags with #
5. YOUTUBE:
   - "title": catchy video title (under 100 characters)
   - "description": detailed video description with overview and call-to-action
   - "tags": array of up to 15 search keywords (plain words, no #)
   - "hashtags": up to 5 hashtags with #
6. TWITTER (X):
   - "caption": concise post suitable for X (must stay under 240 characters)
   - "hashtags": up to 3 hashtags with #
7. WHATSAPP:
   - "caption": natural, friendly message suitable for broadcasting or group sharing
   - "callToAction": optional closing call-to-action

AI SAFETY & ACCURACY RULES:
- Do NOT invent facts, fake quotes, or false claims about the attached media.
- If the user provides sparse information, only expand creatively using the provided words without hallucinating visual elements.
- DO NOT claim that you visually scanned or recognized anything in the image unless explicitly told by the user.
- Generate outputs ONLY for the requested platforms: ${targetPlatforms.join(', ')}.`;

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ];

    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        await new Promise(r => setTimeout(r, 200));
      }
    }

    let parsed: any = null;
    if (response?.text) {
      try {
        parsed = JSON.parse(response.text.trim());
      } catch {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }
    }

    const fallback = generatePlatformSpecificFallback(topic, mediaType, mediaName, targetPlatforms);
    const merged: Record<string, any> = {};

    for (const p of targetPlatforms) {
      const pKey = p === 'facebook' ? 'facebook_page' : p;
      if (parsed && parsed[pKey]) {
        merged[pKey] = parsed[pKey];
      } else if (parsed && parsed[p]) {
        merged[pKey] = parsed[p];
      } else {
        merged[pKey] = fallback[pKey] || fallback[p];
      }

      // Enforce caps and array types
      if (merged[pKey]) {
        if (merged[pKey].hashtags !== undefined) {
          merged[pKey].hashtags = toCleanArray(merged[pKey].hashtags);
        }
        if (merged[pKey].tags !== undefined) {
          merged[pKey].tags = toCleanArray(merged[pKey].tags);
        }

        if (pKey === 'facebook_page') {
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 5);
        } else if (pKey === 'instagram') {
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 10);
        } else if (pKey === 'tiktok') {
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 5);
        } else if (pKey === 'youtube') {
          merged[pKey].tags = (merged[pKey].tags || []).slice(0, 15);
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 5);
        } else if (pKey === 'twitter') {
          merged[pKey].hashtags = (merged[pKey].hashtags || []).slice(0, 3);
          if (merged[pKey].caption && merged[pKey].caption.length > 250) {
            merged[pKey].caption = merged[pKey].caption.slice(0, 247) + '...';
          }
        }
      }
    }

    res.json({ success: true, data: merged });
  } catch (error: any) {
    console.warn('Platform AI generation fallback applied:', error?.message || error);
    const fallback = generatePlatformSpecificFallback(topic, mediaType, mediaName, targetPlatforms, fbPageContentType, fbProfileContentType);
    res.json({ success: true, data: fallback, isFallback: true });
  }
});

// AI Content Generation endpoint
app.post('/api/ai/generate', async (req, res) => {
  const { topic, mediaType, mediaName, platformHints } = req.body;

  try {
    const ai = getGeminiClient();

    const prompt = `You are an expert social media copywriter for an Android cross-posting application.
Create a high-performing social media package based on:
Topic / Brief: "${topic || 'General engaging social media update'}"
Media Attached: ${mediaType ? `${mediaType} named ${mediaName || 'user_file'}` : 'None'}
Target Platforms: ${platformHints?.join(', ') || 'Facebook, Instagram, YouTube, TikTok, X'}

Important Rules:
1. Provide exactly maximum 5 relevant hashtags without spaces, formatted with #.
2. The title and caption should feel natural, authentic, and ready to share.`;

    // Try multiple model tiers starting with the lightweight, fastest model to prevent 503 spikes
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ];
    let lastError: any = null;
    let response: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'Short catchy title (e.g. Jangari, Surga Pemancing di Jawa Barat)',
                },
                caption: {
                  type: Type.STRING,
                  description: 'Engaging conversational caption (2-3 sentences)',
                },
                description: {
                  type: Type.STRING,
                  description: 'Full detailed description suitable for YouTube, Facebook Page or blog notes',
                },
                callToAction: {
                  type: Type.STRING,
                  description: 'Direct, punchy CTA (e.g. Tonton video selengkapnya dan bagikan ke teman mancingmu!)',
                },
                hashtags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description: 'Up to 5 relevant hashtags including the # symbol',
                },
              },
              required: ['title', 'caption', 'description', 'callToAction', 'hashtags'],
            },
          },
        });
        if (response?.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} attempt notice:`, err?.message || err);
        lastError = err;
        // Brief pause before trying next candidate model to ease concurrent request pressure
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    let parsedData: any = null;
    if (response?.text) {
      try {
        parsedData = JSON.parse(response.text.trim());
      } catch {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!parsedData || !parsedData.title) {
      parsedData = generateContextualFallback(topic, mediaType, mediaName);
    }

    // Ensure hashtags is strictly an array capped at 5
    parsedData.hashtags = toCleanArray(parsedData.hashtags).slice(0, 5);

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.warn('AI generation graceful fallback applied:', error?.message || error);
    const fallbackData = generateContextualFallback(topic, mediaType, mediaName);
    res.json({ 
      success: true, 
      data: fallbackData,
      isFallback: true
    });
  }
});

// Mock simulation endpoint for platform status validation (simulating official API vs intent fallback)
app.post('/api/publish/check-status', (req, res) => {
  const { platformId } = req.body;
  // X and Facebook Fan Page support direct Page API simulation
  if (platformId === 'facebook_page' || platformId === 'twitter') {
    res.json({
      platformId,
      canPublishApi: true,
      apiAuthStatus: 'Authorized'
    });
  } else {
    res.json({
      platformId,
      canPublishApi: false,
      reason: 'Android native share intent required for profile or media verification'
    });
  }
});

// ============================================================
// NEWS HUNTER ENDPOINTS
// ============================================================

// 1. Fetch RSS Feed Server-Side (Bypasses CORS restrictions)
app.post('/api/news/fetch-rss', async (req, res) => {
  const { url, sourceName = 'RSS Source', category = 'General' } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0; +https://social-scheduler.local)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: `Remote server responded with HTTP ${response.status}`
      });
    }

    const xmlText = await response.text();
    const parsed = parseRssXml(xmlText, category);

    const articles = parsed.items.map((item, idx) => ({
      id: `rss-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      title: item.title,
      url: item.link,
      source: sourceName,
      publishedAt: item.publishedAt,
      summary: item.summary,
      imageUrl: item.imageUrl || (item.media?.type === 'image' ? item.media.url : item.media?.thumbnailUrl || null),
      media: item.media || null,
      category,
      sourceType: 'RSS',
      discoveredAt: new Date().toISOString()
    }));

    res.json({
      success: true,
      feedTitle: parsed.title,
      articles
    });
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    res.status(500).json({
      success: false,
      error: isTimeout ? 'Request timed out' : (err?.message || 'Failed to fetch RSS feed')
    });
  }
});

// 2. Test RSS Feed Endpoint
app.post('/api/news/test-rss', async (req, res) => {
  const { url, name = 'RSS Source' } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL required' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({
        success: false,
        message: `HTTP ${response.status} from source`,
        itemCount: 0
      });
    }

    const xml = await response.text();
    const parsed = parseRssXml(xml);

    res.json({
      success: true,
      message: `Berhasil terhubung. Ditemukan ${parsed.items.length} artikel.`,
      itemCount: parsed.items.length,
      sampleTitle: parsed.items[0]?.title || 'Tidak ada judul'
    });
  } catch (err: any) {
    res.json({
      success: false,
      message: err?.name === 'AbortError' ? 'Koneksi timeout (server tidak merespons)' : (err?.message || 'Gagal mengakses RSS'),
      itemCount: 0
    });
  }
});

// 3. Web News Discovery Endpoint
app.post('/api/news/web-discover', async (req, res) => {
  const { category = 'Nasional' } = req.body;

  try {
    const ai = getGeminiClient();
    const cleanCategory = String(category);

    const prompt = `Lakukan pencarian topik berita dan isu aktual terkini untuk kategori: "${cleanCategory}".
Temukan maksimal 4 topik/berita terkini yang nyata dan terverifikasi dari media terpercaya.

PENTING:
- Jangan mengarang berita palsu.
- Berikan judul berita aktual, nama media sumber (misal: Kompas, Detik, Antara, BBC, dsb), perkiraan link atau domain, ringkasan faktual 1-2 kalimat, dan tanggal hari ini/kemarin.
- Format respon strictly JSON Array:
[
  {
    "title": "Judul berita",
    "source": "Nama Media",
    "url": "https://...",
    "summary": "Ringkasan faktual",
    "publishedAt": "${new Date().toISOString()}"
  }
]`;

    let response: any = null;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
    } catch {
      // Fallback
    }

    let articles: any[] = [];
    if (response?.text) {
      try {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed)) {
          articles = parsed.map((item, idx) => ({
            id: `web-${Date.now()}-${idx}`,
            title: item.title || 'Topik Berita Terkini',
            url: item.url || 'https://news.google.com',
            source: item.source || 'Web Discovery',
            summary: item.summary || item.title || '',
            publishedAt: item.publishedAt || new Date().toISOString(),
            imageUrl: null,
            category: cleanCategory,
            sourceType: 'WEB',
            discoveredAt: new Date().toISOString()
          }));
        }
      } catch {
        // Safe empty array
      }
    }

    res.json({ success: true, articles });
  } catch (err: any) {
    console.warn('Web discover error:', err?.message || err);
    res.json({ success: true, articles: [] });
  }
});

// 4. AI Rewrite & Fact Safety Endpoint
app.post('/api/news/rewrite', async (req, res) => {
  const { title, summary, url, source, category, clusterSources, mediaMetadata } = req.body;

  try {
    const ai = getGeminiClient();

    const isBreaking = /breaking|diduga|sementara|korban|terkini/i.test(title || '');
    const sourcesSummary = Array.isArray(clusterSources) && clusterSources.length > 1
      ? `Sumber dalam klaster ini (${clusterSources.length} sumber): ${clusterSources.map((s: any) => `${s.source} ("${s.title}")`).join('; ')}`
      : `Sumber tunggal: ${source}`;

    const mediaInfoText = mediaMetadata 
      ? `Tipe media: ${mediaMetadata.type || 'image'}, Sumber media: ${mediaMetadata.sourceName || source}, Format: ${mediaMetadata.mimeType || 'standard'}`
      : 'Tidak ada media yang dilampirkan';

    const prompt = `Anda adalah jurnalis dan copywriter media sosial profesional untuk berita terkini.
Tugas Anda adalah membuat REWRITE ORISINIL dari materi berita di bawah ini strictly berdasarkan informasi yang tersedia.

MATERI BERITA:
Judul Asli: "${title || ''}"
Ringkasan Asli: "${summary || ''}"
Sumber: ${sourcesSummary}
Kategori: "${category || 'Berita'}"
Media Pendukung: ${mediaInfoText}

ATURAN KETAT:
1. JANGAN menyalin persis kalimat dari sumber (buat parafrase orisinil).
2. JANGAN mengarang fakta baru di luar apa yang ada di judul dan ringkasan.
3. KETENTUAN MEDIA PENDUKUNG:
   - Gambar atau video hanyalah media visual pendukung, BUKAN bukti fakta peristiwa baru.
   - JANGAN mengarang orang, lokasi, peristiwa, angka, kutipan, atau identitas hanya berdasarkan gambar/video.
4. BEDAKAN INFORMASI PASTI (CONFIRMED) dan INFORMASI BERKEMBANG/BELUM PASTI (DEVELOPING/SOURCES DIFFER).
   Jika berita adalah breaking/dugaan, set factStatus = "developing" dan factNotice = "Developing story — verify before publishing."
   Jika ada perbedaan keterangan sumber, set factStatus = "differing" dan factNotice = "Sources differ: [jelaskan ringkas]".
   Jika berita jelas/hasil pertandingan/peristiwa resmi, set factStatus = "confirmed".
5. Buat 4 Pilihan Judul:
   - informative: Lugas dan faktual
   - curiosity: Menarik rasa ingin tahu tanpa clickbait menipu
   - short_viral: Singkat, padat, gaya medsos
   - seo: Mengandung kata kunci pencarian utama
6. Buat platform-specific copy:
   - facebookCaption: format post Facebook yang informatif, rapi, ramah dibaca
   - instagramCaption: format rapi dengan enter, bullet point, hook pembuka
   - tiktokHook: 1 kalimat pembuka video yang menyedot perhatian
   - tiktokCaption: caption singkat padat untuk video TikTok
   - youtubeTitle: judul video YouTube yang jelas
   - youtubeDescription: deskripsi video YouTube yang merangkum poin penting
   - xPost: teks tweet orisinil MAKSIMAL 260 KARAKTER (agar aman batas 280)
   - whatsappMessage: format pesan broadcast/grup WhatsApp (dengan *tebal*, emotikon wajar, dan ajakan diskusi)
7. HASHTAGS:
   - facebook: maksimal 5 hashtag
   - instagram: maksimal 10 hashtag
   - tiktok: maksimal 5 hashtag
   - youtube: maksimal 5 hashtag
   - x: maksimal 3 hashtag

Format respon HARUS JSON:
{
  "selectedTitle": "...",
  "titleOptions": [
    { "type": "informative", "label": "Informatif", "title": "..." },
    { "type": "curiosity", "label": "Curiosity", "title": "..." },
    { "type": "short_viral", "label": "Viral Singkat", "title": "..." },
    { "type": "seo", "label": "SEO-Friendly", "title": "..." }
  ],
  "shortDescription": "Ringkasan orisinil 2 kalimat...",
  "factStatus": "confirmed" | "developing" | "differing",
  "factNotice": "...",
  "facebookCaption": "...",
  "instagramCaption": "...",
  "tiktokHook": "...",
  "tiktokCaption": "...",
  "youtubeTitle": "...",
  "youtubeDescription": "...",
  "xPost": "...",
  "whatsappMessage": "...",
  "hashtags": {
    "facebook": ["#..."],
    "instagram": ["#..."],
    "tiktok": ["#..."],
    "youtube": ["#..."],
    "x": ["#..."]
  }
}`;

    let response: any = null;
    for (const model of ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        if (response?.text) break;
      } catch (err) {
        await new Promise(r => setTimeout(r, 150));
      }
    }

    let rewrite: any = null;
    if (response?.text) {
      try {
        rewrite = JSON.parse(response.text.trim());
      } catch {
        const match = response.text.match(/\{[\s\S]*\}/);
        if (match) rewrite = JSON.parse(match[0]);
      }
    }

    if (!rewrite || !rewrite.selectedTitle) {
      // High-quality contextual fallback
      rewrite = generateNewsRewriteFallback(title, summary, category, isBreaking);
    }

    // Safety enforce hashtag counts and X post length
    if (rewrite.hashtags) {
      rewrite.hashtags.facebook = (rewrite.hashtags.facebook || []).slice(0, 5);
      rewrite.hashtags.instagram = (rewrite.hashtags.instagram || []).slice(0, 10);
      rewrite.hashtags.tiktok = (rewrite.hashtags.tiktok || []).slice(0, 5);
      rewrite.hashtags.youtube = (rewrite.hashtags.youtube || []).slice(0, 5);
      rewrite.hashtags.x = (rewrite.hashtags.x || []).slice(0, 3);
    }
    if (rewrite.xPost && rewrite.xPost.length > 270) {
      rewrite.xPost = rewrite.xPost.slice(0, 267) + '...';
    }

    res.json({ success: true, rewrite });
  } catch (err: any) {
    console.warn('News rewrite fallback applied:', err?.message || err);
    const fallback = generateNewsRewriteFallback(title, summary, category, false);
    res.json({ success: true, rewrite: fallback, isFallback: true });
  }
});

function generateNewsRewriteFallback(title: string = '', summary: string = '', category: string = '', isBreaking: boolean = false) {
  const cleanTitle = title.trim() || 'Kabar Terkini';
  const cleanSummary = summary.trim() || cleanTitle;
  const cleanCategory = category || 'Berita';

  return {
    selectedTitle: cleanTitle,
    titleOptions: [
      { type: 'informative', label: 'Informatif', title: cleanTitle },
      { type: 'curiosity', label: 'Curiosity', title: `Fakta Menarik Seputar: ${cleanTitle}` },
      { type: 'short_viral', label: 'Viral Singkat', title: `${cleanTitle} — Simak Selengkapnya!` },
      { type: 'seo', label: 'SEO-Friendly', title: `${cleanTitle} Update Berita ${cleanCategory}` }
    ],
    shortDescription: cleanSummary.slice(0, 180),
    factStatus: isBreaking ? 'developing' : 'confirmed',
    factNotice: isBreaking ? 'Developing story — verify before publishing.' : undefined,
    facebookCaption: `${cleanTitle}\n\n${cleanSummary}\n\nBagaimana pandangan Anda mengenai perkembangan berita ini? Tulis pendapat Anda di kolom komentar.`,
    instagramCaption: `📌 UPDATE ${cleanCategory.toUpperCase()}:\n\n${cleanTitle}\n\n${cleanSummary}\n\nSimpan dan bagikan informasi ini agar temanmu tidak ketinggalan berita terkini!`,
    tiktokHook: `Kalian udah dengar kabar terbaru ini belum?`,
    tiktokCaption: `${cleanTitle}! Simak rangkuman lengkapnya di video ini.`,
    youtubeTitle: cleanTitle,
    youtubeDescription: `Rangkuman berita seputar ${cleanTitle}.\n\n${cleanSummary}\n\nKategori: ${cleanCategory}\nJangan lupa like, share, dan subscribe untuk update berikutnya!`,
    xPost: `${cleanTitle.slice(0, 180)} — update berita ${cleanCategory}. Simak fakta selengkapnya.`,
    whatsappMessage: `*BERITA TERKINI: ${cleanTitle}*\n\n${cleanSummary}\n\nBagikan informasi ini ke grup dan rekan-rekanmu.`,
    hashtags: {
      facebook: ['#BeritaTerkini', '#Update', `#${cleanCategory.replace(/\s+/g, '')}`, '#KabarHariIni', '#Informasi'],
      instagram: ['#BeritaTerkini', '#KabarTerbaru', '#TrendingNews', '#UpdateHariIni', `#${cleanCategory.replace(/\s+/g, '')}`, '#ViralNews', '#BeritaIndonesia', '#KilasBerita', '#Wawasan', '#Fakta'],
      tiktok: ['#BeritaTerkini', '#UpdateNews', '#ViralHariIni', '#Trending', '#Fakta'],
      youtube: ['#BeritaTerkini', '#TrendingNews', '#Update', '#News', '#KabarHariIni'],
      x: ['#BeritaTerkini', '#Update', '#News']
    }
  };
}


// 5. Media Probe Endpoint
app.post('/api/news/media-probe', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ success: false, error: 'Valid HTTP/HTTPS URL required' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    
    // Perform HEAD request first
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0)',
        'Accept': '*/*'
      }
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0)',
          'Range': 'bytes=0-1024',
          'Accept': '*/*'
        }
      });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({
        success: false,
        accessible: false,
        statusCode: response.status,
        error: `Server responded with HTTP ${response.status}`
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    const sizeBytes = contentLength ? parseInt(contentLength, 10) : undefined;

    if (contentType.includes('text/html')) {
      return res.json({
        success: false,
        accessible: false,
        isHtmlRedirect: true,
        error: 'Media URL redirected to an HTML page (requires authentication or viewing on source)'
      });
    }

    res.json({
      success: true,
      accessible: true,
      statusCode: response.status,
      contentType,
      sizeBytes,
      isDownloadable: true
    });
  } catch (err: any) {
    res.json({
      success: false,
      accessible: false,
      error: err?.name === 'AbortError' ? 'Probe timed out' : (err?.message || 'Failed to reach media server')
    });
  }
});

// 6. Safe Media Download Proxy Endpoint (Respects download limits & public availability)
app.get('/api/news/media-proxy-download', async (req, res) => {
  const mediaUrl = req.query.url as string;
  const maxLimitMb = parseInt((req.query.limitMb as string) || '25', 10);
  const maxBytes = maxLimitMb > 0 ? maxLimitMb * 1024 * 1024 : 100 * 1024 * 1024;

  if (!mediaUrl || !/^https?:\/\//i.test(mediaUrl)) {
    return res.status(400).send('Invalid media URL');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const remoteRes = await fetch(mediaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHunter/1.0)',
        'Accept': '*/*'
      }
    });
    clearTimeout(timeout);

    if (!remoteRes.ok) {
      return res.status(remoteRes.status).send(`Remote media server returned HTTP ${remoteRes.status}`);
    }

    const contentType = remoteRes.headers.get('content-type') || 'application/octet-stream';
    if (contentType.includes('text/html')) {
      return res.status(403).send('Direct download unavailable: media requires authentication or redirected to web page');
    }

    const contentLength = remoteRes.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return res.status(413).send(`File exceeds download limit (${maxLimitMb} MB)`);
    }

    let filename = 'news-media';
    try {
      const parsedUrl = new URL(mediaUrl);
      const pathname = parsedUrl.pathname;
      const basename = pathname.split('/').filter(Boolean).pop();
      if (basename && basename.includes('.')) {
        filename = basename.slice(0, 60);
      } else {
        const ext = contentType.includes('video') ? 'mp4' : (contentType.includes('png') ? 'png' : 'jpg');
        filename = `news-media-${Date.now()}.${ext}`;
      }
    } catch {
      filename = `news-media-${Date.now()}.bin`;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    if (remoteRes.body) {
      // @ts-ignore
      const { Readable } = await import('stream');
      // @ts-ignore
      Readable.fromWeb(remoteRes.body).pipe(res);
    } else {
      res.status(500).send('Empty response from media server');
    }
  } catch (err: any) {
    res.status(500).send(err?.message || 'Download proxy failed');
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
