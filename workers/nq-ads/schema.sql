-- 広告主
CREATE TABLE IF NOT EXISTS advertisers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contract_type TEXT DEFAULT 'cpa',  -- 'fixed' | 'cpc' | 'cpa' | 'hybrid'
  cpc_rate INTEGER DEFAULT 0,
  cpa_rate INTEGER DEFAULT 0,
  fixed_monthly INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- バナー広告
CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertiser_id TEXT NOT NULL REFERENCES advertisers(id),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  size TEXT DEFAULT '300x250',
  tags TEXT NOT NULL,  -- JSON配列 '["漆喰","リフォーム"]'
  weight INTEGER DEFAULT 10,
  active INTEGER DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- クリックログ
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_id INTEGER NOT NULL REFERENCES ads(id),
  article_slug TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  clicked_at TEXT DEFAULT (datetime('now'))
);

-- コンバージョンログ
CREATE TABLE IF NOT EXISTS conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_id INTEGER NOT NULL REFERENCES ads(id),
  advertiser_id TEXT NOT NULL REFERENCES advertisers(id),
  cv_type TEXT NOT NULL,  -- 'inquiry' | 'document_request' | 'consultation'
  form_data TEXT,
  source_click_id INTEGER REFERENCES clicks(id),
  converted_at TEXT DEFAULT (datetime('now'))
);

-- 日次集計
CREATE TABLE IF NOT EXISTS daily_stats (
  date TEXT NOT NULL,
  ad_id INTEGER NOT NULL REFERENCES ads(id),
  advertiser_id TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  PRIMARY KEY (date, ad_id)
);

CREATE INDEX IF NOT EXISTS idx_clicks_ad ON clicks(ad_id, clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_cv_advertiser ON conversions(advertiser_id, converted_at);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(active, advertiser_id);
CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_stats(date, advertiser_id);
