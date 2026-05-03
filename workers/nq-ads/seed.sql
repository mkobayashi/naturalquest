INSERT INTO advertisers (id, name, contact_email, contract_type, cpa_rate) VALUES ('tanaka-shikkui', '田中漆喰工業', 'test@example.com', 'cpa', 3000);
INSERT INTO advertisers (id, name, contact_email, contract_type, cpc_rate, cpa_rate) VALUES ('mori-lumber', '森の木材店', 'test@example.com', 'hybrid', 50, 5000);
INSERT INTO advertisers (id, name, contact_email, contract_type, cpc_rate) VALUES ('eco-reform', 'エコリフォーム協会', 'test@example.com', 'cpc', 80);

INSERT INTO ads (advertiser_id, title, image_url, destination_url, size, tags, weight) VALUES ('tanaka-shikkui', '漆喰のある暮らし', '/ads/banners/tanaka-shikkui-300x250.webp', 'https://example.com/lp', '300x250', '["漆喰","左官","自然素材","リフォーム","古民家","DIY"]', 15);
INSERT INTO ads (advertiser_id, title, image_url, destination_url, size, tags, weight) VALUES ('mori-lumber', '国産無垢材で建てる家', '/ads/banners/mori-lumber-300x250.webp', 'https://example.com/catalog', '300x250', '["無垢材","木材","自然素材","新築","リフォーム","古民家"]', 10);
INSERT INTO ads (advertiser_id, title, image_url, destination_url, size, tags, weight) VALUES ('eco-reform', '自然素材リフォーム 無料相談', '/ads/banners/eco-reform-300x250.webp', 'https://example.com/consult', '300x250', '["リフォーム","自然素材","エコ","省エネ","漆喰","古民家再生"]', 8);
