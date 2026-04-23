#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
クプクプ WordPress XML → STORES CSV 変換スクリプト
"""

import xml.etree.ElementTree as ET
import csv
import html
import re

XML_PATH = '/Users/kobayashimasahiro/Downloads/WordPress.2026-04-08.xml'
OUTPUT_PATH = '/Users/kobayashimasahiro/Downloads/kupukupu_stores.csv'

# STORESのCSVヘッダー
HEADERS = [
    'アイテム名', '価格', '割引適用方法', '割引率', '割引金額', '軽減税率',
    '紹介文', '追加在庫', '在庫無制限', 'バリエーション', '品番', 'バーコード',
    '原価', '国内発送', '海外発送', 'カテゴリ', '管理用タグ',
    '画像1', '画像2', '画像3', '画像4', '画像5',
    '画像6', '画像7', '画像8', '画像9', '画像10',
    '画像11', '画像12', '画像13', '画像14', '画像15',
    '画像16', '画像17', '画像18', '画像19', '画像20',
    '画像21', '画像22', '画像23', '画像24', '画像25',
    '画像26', '画像27', '画像28', '画像29', '画像30',
]

def clean_html(text):
    """HTMLタグと余分な空白を除去"""
    if not text:
        return ''
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def get_meta(item, key, ns):
    for meta in item.findall('wp:postmeta', ns):
        k = meta.find('wp:meta_key', ns)
        v = meta.find('wp:meta_value', ns)
        if k is not None and k.text == key:
            return v.text.strip() if v is not None and v.text else ''
    return ''

def main():
    tree = ET.parse(XML_PATH)
    root = tree.getroot()
    ns = {
        'wp': 'http://wordpress.org/export/1.2/',
        'content': 'http://purl.org/rss/1.0/modules/content/',
    }

    items = root.findall('.//item')

    # 添付ファイルからID→URLマッピング
    attachments = {}
    for item in items:
        post_type = item.find('wp:post_type', ns)
        if post_type is not None and post_type.text == 'attachment':
            pid = item.find('wp:post_id', ns)
            guid = item.find('guid')
            if pid is not None and guid is not None and guid.text:
                attachments[pid.text.strip()] = guid.text.strip()

    # クプクプ公開商品のみ
    products = []
    for item in items:
        post_type = item.find('wp:post_type', ns)
        if post_type is None or post_type.text != 'product':
            continue
        status = item.find('wp:status', ns)
        link = item.find('link')
        if status is not None and status.text == 'publish':
            if link is not None and 'kupu' in (link.text or '').lower():
                # variableなデモ商品を除外
                is_variable = any(
                    c.get('domain') == 'product_type' and c.text == 'variable'
                    for c in item.findall('category')
                )
                if not is_variable:
                    products.append(item)

    rows = []
    for p in products:
        title = p.find('title')
        name = title.text.strip() if title is not None and title.text else ''

        # 紹介文（encoded = post content）
        encoded = p.find('{http://purl.org/rss/1.0/modules/content/}encoded')
        description = clean_html(encoded.text if encoded is not None else '')

        # 価格
        price = get_meta(p, '_regular_price', ns)

        # カテゴリ（product_cat）
        cats = []
        for c in p.findall('category'):
            if c.get('domain') == 'product_cat' and c.text:
                cats.append(c.text.strip())
        category = '>'.join(cats) if cats else ''

        # 管理用タグ（product_tag）
        tags = []
        for c in p.findall('category'):
            if c.get('domain') == 'product_tag' and c.text:
                tags.append(c.text.strip())
        tags_str = ','.join(tags)

        # 画像URL（サムネイル + ギャラリー）
        image_urls = []
        thumb_id = get_meta(p, '_thumbnail_id', ns)
        if thumb_id and thumb_id in attachments:
            image_urls.append(attachments[thumb_id])

        gallery_ids = get_meta(p, '_product_image_gallery', ns)
        if gallery_ids:
            for gid in gallery_ids.split(','):
                gid = gid.strip()
                if gid and gid in attachments and attachments[gid] not in image_urls:
                    image_urls.append(attachments[gid])

        # 在庫設定
        manage_stock = get_meta(p, '_manage_stock', ns)
        stock_qty = get_meta(p, '_stock', ns)
        virtual = get_meta(p, '_virtual', ns)

        # 在庫無制限: manage_stockがnoなら1
        unlimited = '1' if manage_stock == 'no' else ''
        add_stock = stock_qty if manage_stock == 'yes' and stock_qty else ''

        # 発送方法（バーチャル商品は発送なし）
        if virtual == 'yes':
            domestic = ''
            international = ''
        else:
            domestic = 'ヤマト宅急便'
            international = ''

        # 画像列（最大30）
        images = image_urls[:30]
        images += [''] * (30 - len(images))

        row = [
            name,           # アイテム名
            price,          # 価格
            '',             # 割引適用方法
            '',             # 割引率
            '',             # 割引金額
            '',             # 軽減税率
            description,    # 紹介文
            add_stock,      # 追加在庫
            unlimited,      # 在庫無制限
            '',             # バリエーション
            '',             # 品番
            '',             # バーコード
            '',             # 原価
            domestic,       # 国内発送
            international,  # 海外発送
            category,       # カテゴリ
            tags_str,       # 管理用タグ
        ] + images

        rows.append(row)

    # CSV出力（UTF-8 BOM付き → Excelで開きやすい）
    with open(OUTPUT_PATH, 'w', newline='', encoding='shift_jis', errors='replace') as f:
        writer = csv.writer(f)
        writer.writerow(HEADERS)
        writer.writerows(rows)

    print(f'完了: {len(rows)}件 → {OUTPUT_PATH}')

if __name__ == '__main__':
    main()

