import { NewsMediaItem } from '../types';

/**
 * Client & Universal RSS / Atom XML Parser for News Hunter
 * Handles RSS 2.0, Atom 1.0, CDATA, HTML entities, and media extraction
 */

export interface ParsedRssItem {
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
  imageUrl?: string | null;
  media?: NewsMediaItem | null;
  category?: string;
  guid?: string;
}

export interface ParsedRssFeed {
  title: string;
  description?: string;
  link?: string;
  items: ParsedRssItem[];
}

// Decode basic HTML entities safely
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

// Strip HTML tags and clean up whitespace
export function stripHtml(html: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return decodeHtmlEntities(text);
}

// Extract first image URL found in HTML or enclosure
export function extractImageUrlFromHtml(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["'](https?:\/\/[^"'\s]+)["']/i);
  return match ? match[1] : null;
}

// Extract tag content taking CDATA into account
function extractTagContent(xmlSnippet: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xmlSnippet.match(regex);
  if (!match) return '';
  
  let content = match[1];
  // Check for CDATA
  const cdataMatch = content.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }
  return decodeHtmlEntities(content);
}

// Extract attributes like href or url
function extractAttribute(xmlSnippet: string, tagName: string, attrName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*\\b${attrName}=["']([^"']+)["'][^>]*>`, 'i');
  const match = xmlSnippet.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract rich media item (image or video) from RSS item or Atom entry snippet
 */
export function extractMediaFromRssBlock(
  snippet: string, 
  articleUrl: string, 
  sourceName: string = 'RSS Source',
  title?: string
): { imageUrl: string | null; media: NewsMediaItem | null } {
  // 1. Enclosure check (image or video)
  const enclosureMatch = snippet.match(/<enclosure\b([^>]*)\/?>/i);
  if (enclosureMatch) {
    const encAttrs = enclosureMatch[1];
    const urlMatch = encAttrs.match(/url=["']([^"']+)["']/i);
    const typeMatch = encAttrs.match(/type=["']([^"']+)["']/i);
    const lengthMatch = encAttrs.match(/length=["'](\d+)["']/i);
    if (urlMatch) {
      const url = urlMatch[1].trim();
      const mime = typeMatch ? typeMatch[1].toLowerCase() : '';
      const sizeBytes = lengthMatch ? parseInt(lengthMatch[1], 10) : undefined;
      const isVideo = mime.startsWith('video/') || /\.(mp4|m4v|webm|ogv|mov)(\?.*)?$/i.test(url);
      const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);

      if (isVideo) {
        return {
          imageUrl: null,
          media: {
            url,
            type: 'video',
            sourceUrl: articleUrl || url,
            sourceName,
            title,
            sizeBytes,
            mimeType: mime || 'video/mp4',
            status: 'downloadable',
            isDownloadable: true
          }
        };
      }
      if (isImage) {
        return {
          imageUrl: url,
          media: {
            url,
            type: 'image',
            sourceUrl: articleUrl || url,
            sourceName,
            title,
            sizeBytes,
            mimeType: mime || 'image/jpeg',
            thumbnailUrl: url,
            status: 'downloadable',
            isDownloadable: true
          }
        };
      }
    }
  }

  // 2. Media content (video or image)
  const mediaContentMatches = snippet.match(/<media:content\b([^>]*)(?:\/?>|>([\s\S]*?)<\/media:content>)/gi) || [];
  for (const mcBlock of mediaContentMatches) {
    const urlMatch = mcBlock.match(/url=["']([^"']+)["']/i);
    if (!urlMatch) continue;
    const url = urlMatch[1].trim();
    const typeMatch = mcBlock.match(/type=["']([^"']+)["']/i);
    const mediumMatch = mcBlock.match(/medium=["']([^"']+)["']/i);
    const widthMatch = mcBlock.match(/width=["'](\d+)["']/i);
    const heightMatch = mcBlock.match(/height=["'](\d+)["']/i);
    const fileSizeMatch = mcBlock.match(/(?:fileSize|length)=["'](\d+)["']/i);
    const durationMatch = mcBlock.match(/duration=["'](\d+)["']/i);
    
    // thumbnail inside media:content or media:group
    const thumbMatch = snippet.match(/<media:thumbnail\b[^>]*url=["']([^"']+)["']/i);
    const thumbnailUrl = thumbMatch ? thumbMatch[1].trim() : undefined;

    const mime = typeMatch ? typeMatch[1].toLowerCase() : '';
    const medium = mediumMatch ? mediumMatch[1].toLowerCase() : '';
    const isVideo = medium === 'video' || mime.startsWith('video/') || /\.(mp4|m4v|webm|ogv|mov)(\?.*)?$/i.test(url);

    if (isVideo) {
      return {
        imageUrl: thumbnailUrl || null,
        media: {
          url,
          type: 'video',
          sourceUrl: articleUrl || url,
          sourceName,
          title,
          width: widthMatch ? parseInt(widthMatch[1], 10) : undefined,
          height: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
          sizeBytes: fileSizeMatch ? parseInt(fileSizeMatch[1], 10) : undefined,
          durationSeconds: durationMatch ? parseInt(durationMatch[1], 10) : undefined,
          mimeType: mime || 'video/mp4',
          thumbnailUrl,
          status: 'downloadable',
          isDownloadable: true
        }
      };
    }

    const isImage = medium === 'image' || mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
    if (isImage) {
      return {
        imageUrl: url,
        media: {
          url,
          type: 'image',
          sourceUrl: articleUrl || url,
          sourceName,
          title,
          width: widthMatch ? parseInt(widthMatch[1], 10) : undefined,
          height: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
          sizeBytes: fileSizeMatch ? parseInt(fileSizeMatch[1], 10) : undefined,
          mimeType: mime || 'image/jpeg',
          thumbnailUrl: thumbnailUrl || url,
          status: 'downloadable',
          isDownloadable: true
        }
      };
    }
  }

  // 3. HTML5 <video> tag
  const videoHtmlMatch = snippet.match(/<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["'][^>]*type=["']video\/([^"']+)["']/i) ||
                         snippet.match(/<video[^>]+src=["']([^"']+)["']/i);
  if (videoHtmlMatch) {
    const videoUrl = videoHtmlMatch[1].trim();
    const posterMatch = snippet.match(/<video[^>]+poster=["']([^"']+)["']/i);
    return {
      imageUrl: posterMatch ? posterMatch[1].trim() : null,
      media: {
        url: videoUrl,
        type: 'video',
        sourceUrl: articleUrl || videoUrl,
        sourceName,
        title,
        thumbnailUrl: posterMatch ? posterMatch[1].trim() : undefined,
        mimeType: 'video/mp4',
        status: 'downloadable',
        isDownloadable: true
      }
    };
  }

  // 4. YouTube embed or video link
  const ytMatch = snippet.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch) {
    const ytId = ytMatch[1];
    const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return {
      imageUrl: thumb,
      media: {
        url: `https://www.youtube.com/watch?v=${ytId}`,
        type: 'video',
        sourceUrl: articleUrl || `https://www.youtube.com/watch?v=${ytId}`,
        sourceName: `${sourceName} (YouTube)`,
        title,
        thumbnailUrl: thumb,
        status: 'preview_only',
        isDownloadable: false
      }
    };
  }

  // 5. Standalone media:thumbnail
  const standaloneThumb = snippet.match(/<media:thumbnail\b[^>]*url=["']([^"']+)["']/i);
  if (standaloneThumb) {
    const thumbUrl = standaloneThumb[1].trim();
    return {
      imageUrl: thumbUrl,
      media: {
        url: thumbUrl,
        type: 'image',
        sourceUrl: articleUrl || thumbUrl,
        sourceName,
        title,
        thumbnailUrl: thumbUrl,
        status: 'preview_only',
        isDownloadable: true
      }
    };
  }

  // 6. HTML <img> tag
  const imgUrl = extractImageUrlFromHtml(snippet);
  if (imgUrl) {
    return {
      imageUrl: imgUrl,
      media: {
        url: imgUrl,
        type: 'image',
        sourceUrl: articleUrl || imgUrl,
        sourceName,
        title,
        thumbnailUrl: imgUrl,
        status: 'downloadable',
        isDownloadable: true
      }
    };
  }

  return { imageUrl: null, media: null };
}

/**
 * Parse an XML string (RSS 2.0 or Atom) into structured items
 */
export function parseRssXml(xmlString: string, defaultCategory: string = 'General'): ParsedRssFeed {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new Error('Empty or invalid XML string provided');
  }

  const cleanXml = xmlString.trim();

  // Channel title
  const feedTitle = extractTagContent(cleanXml, 'title') || 'RSS Feed';
  const feedDesc = extractTagContent(cleanXml, 'description');

  const items: ParsedRssItem[] = [];

  // Check if Atom (<entry>) or RSS (<item>)
  const isAtom = /<entry[\s>]/i.test(cleanXml);

  if (isAtom) {
    const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
    const entries = cleanXml.match(entryRegex) || [];

    for (const entry of entries) {
      const title = stripHtml(extractTagContent(entry, 'title'));
      
      // Atom link href
      let link = extractAttribute(entry, 'link', 'href') || '';
      if (!link) {
        link = stripHtml(extractTagContent(entry, 'link'));
      }

      const summaryRaw = extractTagContent(entry, 'summary') || extractTagContent(entry, 'content');
      const summary = stripHtml(summaryRaw).slice(0, 320);

      const published = 
        extractTagContent(entry, 'published') || 
        extractTagContent(entry, 'updated') || 
        new Date().toISOString();

      const { imageUrl, media } = extractMediaFromRssBlock(entry, link, feedTitle, title);
      const category = stripHtml(extractTagContent(entry, 'category')) || defaultCategory;

      if (title && (link || summary)) {
        items.push({
          title,
          link,
          publishedAt: new Date(published).toISOString(),
          summary: summary || title,
          imageUrl: imageUrl || null,
          media,
          category
        });
      }
    }
  } else {
    // RSS 2.0 (<item>)
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const itemBlocks = cleanXml.match(itemRegex) || [];

    for (const item of itemBlocks) {
      const title = stripHtml(extractTagContent(item, 'title'));
      const link = stripHtml(extractTagContent(item, 'link'));
      const descRaw = extractTagContent(item, 'description') || extractTagContent(item, 'content:encoded');
      const summary = stripHtml(descRaw).slice(0, 320);

      const pubDate = extractTagContent(item, 'pubDate') || extractTagContent(item, 'dc:date');
      let isoDate = new Date().toISOString();
      if (pubDate) {
        const parsedTime = Date.parse(pubDate);
        if (!isNaN(parsedTime)) {
          isoDate = new Date(parsedTime).toISOString();
        }
      }

      const { imageUrl, media } = extractMediaFromRssBlock(item, link, feedTitle, title);
      const category = stripHtml(extractTagContent(item, 'category')) || defaultCategory;
      const guid = stripHtml(extractTagContent(item, 'guid')) || link;

      if (title && (link || summary)) {
        items.push({
          title,
          link,
          publishedAt: isoDate,
          summary: summary || title,
          imageUrl: imageUrl || null,
          media,
          category,
          guid
        });
      }
    }
  }

  return {
    title: feedTitle,
    description: feedDesc,
    items
  };
}
