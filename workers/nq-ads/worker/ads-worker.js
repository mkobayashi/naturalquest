/**
 * naturalquest.org 広告計測 Cloudflare Worker
 *
 * エンドポイント:
 *   GET  /ads/click/:adId?slug=xxx     → クリック記録 + リダイレクト
 *   POST /ads/cv                        → CV記録
 *   GET  /ads/serve?tags=a,b&size=300x250 → マッチするバナーJSON返却
 *   GET  /ads/stats?period=30d&advertiser=xxx → 集計API
 *   POST /ads/api/*                     → 管理API（Bearer ADMIN_KEY）
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    try {
      if (path.startsWith('/ads/click/')) {
        return handleClick(request, env, url);
      }
      if (path === '/ads/cv' && request.method === 'POST') {
        return handleConversion(request, env);
      }
      if (path === '/ads/serve' && request.method === 'GET') {
        return handleServe(request, env, url);
      }
      if (path === '/ads/stats' && request.method === 'GET') {
        return handleStats(request, env, url);
      }
      if (path.startsWith('/ads/api/') && request.method === 'POST') {
        return handleAdminAPI(request, env, url);
      }

      if (path.startsWith('/ads/')) {
        return jsonResponse(request, { error: 'Not Found' }, 404);
      }
      return new Response('Not Found', { status: 404 });
    } catch (e) {
      console.error(e);
      return jsonResponse(request, { error: e instanceof Error ? e.message : 'Internal error' }, 500);
    }
  },
};

async function handleClick(request, env, url) {
  const raw = url.pathname.split('/').pop();
  const adId = parseInt(raw, 10);
  if (!Number.isFinite(adId)) {
    return jsonResponse(request, { error: 'Invalid ad id' }, 400);
  }
  const slug = url.searchParams.get('slug') || '';

  const ad = await env.DB.prepare(
    'SELECT id, destination_url, advertiser_id FROM ads WHERE id = ? AND active = 1'
  )
    .bind(adId)
    .first();

  if (!ad) {
    return jsonResponse(request, { error: 'Ad not found' }, 404);
  }

  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';
  const ipHash = await hashIP(ip, env);

  const recentClick = await env.DB.prepare(
    `SELECT id FROM clicks
     WHERE ad_id = ? AND ip_hash = ? AND clicked_at > datetime('now', '-1 hour')`
  )
    .bind(adId, ipHash)
    .first();

  if (!recentClick) {
    await env.DB.prepare(
      `INSERT INTO clicks (ad_id, article_slug, referrer, user_agent, ip_hash)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        adId,
        slug,
        request.headers.get('Referer') || '',
        request.headers.get('User-Agent') || '',
        ipHash
      )
      .run();
  }

  const dest = new URL(ad.destination_url);
  dest.searchParams.set('utm_source', 'naturalquest');
  dest.searchParams.set('utm_medium', 'banner');
  dest.searchParams.set('utm_campaign', `ad_${adId}`);
  if (slug) dest.searchParams.set('utm_content', slug);

  return Response.redirect(dest.toString(), 302);
}

const CV_TYPES = new Set(['inquiry', 'document_request', 'consultation']);

async function handleConversion(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, { error: 'Invalid JSON' }, 400);
  }
  const { ad_id, advertiser_id, cv_type, form_data, click_id } = body;

  if (!ad_id || !advertiser_id || !cv_type) {
    return jsonResponse(request, { error: 'Missing required fields' }, 400);
  }
  if (!CV_TYPES.has(cv_type)) {
    return jsonResponse(request, { error: 'Invalid cv_type' }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO conversions (ad_id, advertiser_id, cv_type, form_data, source_click_id)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(
      ad_id,
      advertiser_id,
      cv_type,
      form_data != null ? JSON.stringify(form_data) : null,
      click_id ?? null
    )
    .run();

  return jsonResponse(request, { success: true });
}

async function handleServe(request, env, url) {
  const tagsParam = url.searchParams.get('tags') || '';
  const size = url.searchParams.get('size') || '300x250';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '2', 10) || 2, 20);
  const tags = tagsParam
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  let ads;

  if (tags.length > 0) {
    const allAds = await env.DB.prepare(
      `SELECT a.*, adv.name as advertiser_name
       FROM ads a
       JOIN advertisers adv ON a.advertiser_id = adv.id
       WHERE a.active = 1 AND adv.active = 1
         AND a.size = ?
         AND (a.start_date IS NULL OR date(a.start_date) <= date('now'))
         AND (a.end_date IS NULL OR date(a.end_date) >= date('now'))`
    )
      .bind(size)
      .all();

    const scored = allAds.results
      .map((ad) => {
        let adTags = [];
        try {
          adTags = JSON.parse(ad.tags || '[]');
        } catch {
          adTags = [];
        }
        const matchCount = adTags.filter((t) => tags.includes(t)).length;
        return { ...ad, score: matchCount * ad.weight };
      })
      .filter((a) => a.score > 0);

    scored.sort((a, b) => b.score - a.score);
    ads = scored.slice(0, limit);
  } else {
    const result = await env.DB.prepare(
      `SELECT a.*, adv.name as advertiser_name
       FROM ads a
       JOIN advertisers adv ON a.advertiser_id = adv.id
       WHERE a.active = 1 AND adv.active = 1
         AND a.size = ?
         AND (a.start_date IS NULL OR date(a.start_date) <= date('now'))
         AND (a.end_date IS NULL OR date(a.end_date) >= date('now'))
       ORDER BY a.weight DESC LIMIT ?`
    )
      .bind(size, limit)
      .all();
    ads = result.results;
  }

  const response = ads.map((ad) => ({
    id: ad.id,
    title: ad.title,
    image_url: ad.image_url,
    click_url: `/ads/click/${ad.id}`,
    advertiser_name: ad.advertiser_name,
    size: ad.size,
  }));

  return jsonResponse(request, response, 200, { 'Cache-Control': 'public, max-age=300' });
}

function parsePeriodDays(period) {
  const m = /^(\d+)d$/.exec(period || '30d');
  if (m) return Math.min(365, Math.max(1, parseInt(m[1], 10)));
  const n = parseInt(period, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(365, n) : 30;
}

async function handleStats(request, env, url) {
  const period = url.searchParams.get('period') || '30d';
  const advertiserFilter = url.searchParams.get('advertiser');
  const days = parsePeriodDays(period);

  const advClause = advertiserFilter ? 'AND adv.id = ?' : '';
  const bindAdvertiser = advertiserFilter ? [advertiserFilter] : [];

  const summary = await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM clicks WHERE clicked_at > datetime('now', '-' || ? || ' days')) AS total_clicks,
      (SELECT COUNT(*) FROM conversions WHERE converted_at > datetime('now', '-' || ? || ' days')) AS total_conversions,
      (SELECT COUNT(*) FROM ads WHERE active = 1) AS active_ads`
  )
    .bind(days, days)
    .first();

  const byAdvertiser = await env.DB.prepare(
    `SELECT
      adv.id,
      adv.name,
      adv.contract_type,
      adv.cpc_rate,
      adv.cpa_rate,
      adv.fixed_monthly,
      COUNT(DISTINCT c.id) AS clicks,
      COUNT(DISTINCT cv.id) AS conversions
    FROM advertisers adv
    LEFT JOIN ads a ON a.advertiser_id = adv.id
    LEFT JOIN clicks c ON c.ad_id = a.id
      AND c.clicked_at > datetime('now', '-' || ? || ' days')
    LEFT JOIN conversions cv ON cv.ad_id = a.id
      AND cv.converted_at > datetime('now', '-' || ? || ' days')
    WHERE adv.active = 1 ${advClause}
    GROUP BY adv.id
    ORDER BY clicks DESC`
  )
    .bind(days, days, ...bindAdvertiser)
    .all();

  const enriched = byAdvertiser.results.map((row) => {
    const clicks = row.clicks ?? 0;
    const conversions = row.conversions ?? 0;
    let revenue = 0;
    const ct = row.contract_type;
    if (ct === 'fixed') {
      revenue = Math.round((row.fixed_monthly || 0) * (days / 30));
    } else {
      if (ct === 'cpc' || ct === 'hybrid') {
        revenue += clicks * (row.cpc_rate || 0);
      }
      if (ct === 'cpa' || ct === 'hybrid') {
        revenue += conversions * (row.cpa_rate || 0);
      }
    }
    return { ...row, estimated_revenue: revenue };
  });

  let dailyQuery = `
    SELECT date(clicked_at) AS date, COUNT(*) AS clicks
    FROM clicks
    WHERE clicked_at > datetime('now', '-' || ? || ' days')
    GROUP BY date(clicked_at)
    ORDER BY date ASC`;
  const dailyBind = [days];

  if (advertiserFilter) {
    dailyQuery = `
      SELECT date(c.clicked_at) AS date, COUNT(*) AS clicks
      FROM clicks c
      JOIN ads a ON c.ad_id = a.id
      WHERE c.clicked_at > datetime('now', '-' || ? || ' days')
        AND a.advertiser_id = ?
      GROUP BY date(c.clicked_at)
      ORDER BY date ASC`;
    dailyBind.push(advertiserFilter);
  }

  const daily = await env.DB.prepare(dailyQuery).bind(...dailyBind).all();

  let activeAdsScoped = summary.active_ads;
  if (advertiserFilter) {
    const ar = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM ads WHERE active = 1 AND advertiser_id = ?'
    )
      .bind(advertiserFilter)
      .first();
    activeAdsScoped = ar?.c ?? 0;
  }

  const outSummary = advertiserFilter
    ? {
        total_clicks: enriched.reduce((s, r) => s + (r.clicks || 0), 0),
        total_conversions: enriched.reduce((s, r) => s + (r.conversions || 0), 0),
        active_ads: activeAdsScoped,
      }
    : {
        total_clicks: summary.total_clicks,
        total_conversions: summary.total_conversions,
        active_ads: summary.active_ads,
      };

  return jsonResponse(request, {
    period: `${days}d`,
    summary: outSummary,
    by_advertiser: enriched,
    daily_clicks: daily.results,
  });
}

async function handleAdminAPI(request, env, url) {
  const authHeader = request.headers.get('Authorization');
  const key = env.ADMIN_KEY;
  if (!key || authHeader !== `Bearer ${key}`) {
    return jsonResponse(request, { error: 'Unauthorized' }, 401);
  }

  const action = url.pathname.replace('/ads/api/', '');
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, { error: 'Invalid JSON' }, 400);
  }

  switch (action) {
    case 'add-advertiser': {
      await env.DB.prepare(
        `INSERT INTO advertisers (id, name, contact_email, contract_type, cpc_rate, cpa_rate, fixed_monthly)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          body.id,
          body.name,
          body.contact_email || null,
          body.contract_type || 'cpa',
          body.cpc_rate || 0,
          body.cpa_rate || 0,
          body.fixed_monthly || 0
        )
        .run();
      return jsonResponse(request, { success: true, id: body.id });
    }

    case 'add-ad': {
      const tagsJson =
        typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags || []);
      const result = await env.DB.prepare(
        `INSERT INTO ads (advertiser_id, title, image_url, destination_url, size, tags, weight)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          body.advertiser_id,
          body.title,
          body.image_url,
          body.destination_url,
          body.size || '300x250',
          tagsJson,
          body.weight || 10
        )
        .run();
      return jsonResponse(request, { success: true, id: result.meta.last_row_id });
    }

    case 'toggle-ad': {
      await env.DB.prepare('UPDATE ads SET active = NOT active WHERE id = ?')
        .bind(body.id)
        .run();
      return jsonResponse(request, { success: true });
    }

    default:
      return jsonResponse(request, { error: 'Unknown action' }, 400);
  }
}

async function hashIP(ip, env) {
  const salt = env.IP_HASH_SALT || '-nq-salt';
  const data = new TextEncoder().encode(`${ip}${salt}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function jsonResponse(request, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
      ...extraHeaders,
    },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
