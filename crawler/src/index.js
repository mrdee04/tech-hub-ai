const RSS_SOURCES = [
  { name: 'VnExpress Số hóa', url: 'https://vnexpress.net/rss/so-hoa.rss' },
  { name: 'VnExpress Khoa học', url: 'https://vnexpress.net/rss/khoa-hoc.rss' },
  { name: 'GenK', url: 'https://genk.vn/rss.chn' },
  { name: '24h Công nghệ', url: 'https://www.24h.com.vn/upload/rss/congnghethongtin.rss' }
];

export default {
  // Triggered by Cron (every 1 hour)
  async scheduled(event, env, ctx) {
    await runCrawler(env);
  },

  // Triggered manually via URL (for testing)
  async fetch(request, env, ctx) {
    await runCrawler(env);
    return new Response('Crawler finished successfully (Direct Fetch Mode)!', { status: 200 });
  }
};

async function runCrawler(env) {
  for (const source of RSS_SOURCES) {
    console.log(`Fetching from ${source.name}...`);
    try {
      const response = await fetch(source.url);
      const xmlData = await response.text();
      
      // Manual RSS parsing using Regex (No dependencies!)
      const items = parseRSS(xmlData);
      
      // Only process the 10 latest items
      const latestItems = items.slice(0, 10);

      for (const item of latestItems) {
        const url = item.link;
        
        // 1. Check if news already exists in Supabase via REST API
        const exists = await supabaseCheckExists(url, env);

        if (exists) {
          console.log(`Skipping existing: ${item.title}`);
          continue;
        }

        // 2. Summarize with Gemini AI
        console.log(`Summarizing new article: ${item.title}`);
        const summary = await summarizeWithAI(item.title, item.description, env.GEMINI_API_KEY);

        // 3. Save to Supabase via REST API
        await supabaseInsertNews({
          title: item.title,
          summary: summary,
          source: source.name,
          url: url,
          image_url: extractImageUrl(item.description),
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
        }, env);
      }
    } catch (err) {
      console.error(`Error crawling ${source.name}:`, err);
    }
  }
}

// Zero-dependency RSS Parser
function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const match of itemMatches) {
    const content = match[1];
    items.push({
      title: (content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/) || [])[1],
      link: (content.match(/<link>([\s\S]*?)<\/link>/) || [])[1],
      description: (content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/) || [])[1],
      pubDate: (content.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1],
    });
  }
  return items;
}

// Direct Supabase REST API calls
async function supabaseCheckExists(url, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/news?url=eq.${encodeURIComponent(url)}&select=id`, {
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  return data.length > 0;
}

async function supabaseInsertNews(newsData, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/news`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(newsData)
  });
  if (!res.ok) {
    console.error('Supabase Inset Error:', await res.text());
  }
}

async function summarizeWithAI(title, description, apiKey) {
  if (!apiKey) {
    return (description || '').replace(/<[^>]*>/g, '').slice(0, 200) + '...';
  }

  const cleanDesc = (description || '').replace(/<[^>]*>/g, '').slice(0, 500);
  const prompt = `Bạn là một biên tập viên tin tức công nghệ. Hãy tóm tắt tin tức sau đây thành 2-3 câu ngắn gọn, thu hút, văn phong hiện đại.\n\nTiêu đề: ${title}\nNội dung: ${cleanDesc}\n\nTóm tắt (tiếng Việt):`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    console.error('Gemini AI error:', err);
    return cleanDesc.slice(0, 200) + '...';
  }
}

function extractImageUrl(description) {
  const match = (description || '').match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000';
}
