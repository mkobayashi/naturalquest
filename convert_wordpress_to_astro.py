#!/usr/bin/env python3
"""
WordPress の XML エクスポートファイルから投稿（post）を読み込み、
Astro 用の Markdown ファイルに変換するスクリプト

XML の構造が多少壊れていても動作するよう、正規表現ベースで抽出しています。
"""

import re
from pathlib import Path
from typing import List
from urllib.parse import unquote


def extract_item_blocks(xml_content: str) -> List[str]:
    """
    XML から <item>...</item> ブロックを抽出する。
    CDATA 内の <item> / </item> は無視して、正しくネストを追跡する。
    """
    items = []
    i = 0
    depth = 0
    start = -1
    n = len(xml_content)

    while i < n:
        # CDATA セクションをスキップ（ここを先にチェック）
        if i <= n - 9 and xml_content[i:i + 9] == "<![CDATA[":
            i += 9
            while i < n - 2:
                if xml_content[i:i + 3] == "]]>":
                    i += 3
                    break
                i += 1
            continue

        # <item> タグ（開始）- 前の文字が < または空白
        if i <= n - 6 and xml_content[i:i + 6] == "<item>":
            if depth == 0:
                start = i
            depth += 1
            i += 6
            continue

        # </item> タグ（終了）
        if i <= n - 7 and xml_content[i:i + 7] == "</item>":
            depth -= 1
            if depth == 0 and start >= 0:
                items.append(xml_content[start : i + 7])
                start = -1
            i += 7
            continue

        i += 1

    return items


def extract_tag_content(block: str, tag_name: str, use_cdata: bool = True) -> str:
    """
    ブロック内からタグの内容を正規表現で抽出する。
    CDATA 対応。見つからない場合は空文字を返す。
    """
    # CDATA 形式: <tag><![CDATA[content]]></tag>
    if use_cdata:
        cdata_pattern = rf"<{re.escape(tag_name)}>\s*<!\[CDATA\[(.*?)\]\]>\s*</{re.escape(tag_name)}>"
        m = re.search(cdata_pattern, block, re.DOTALL)
        if m:
            return m.group(1).strip()
    # プレーン形式: <tag>content</tag>
    plain_pattern = rf"<{re.escape(tag_name)}>(.*?)</{re.escape(tag_name)}>"
    m = re.search(plain_pattern, block, re.DOTALL)
    if m:
        return m.group(1).strip()
    return ""


def extract_content_encoded(block: str) -> str:
    """
    content:encoded は CDATA 内に ]]> が含まれる可能性があるため、
    専用の抽出ロジックを使用。]]> までを貪欲に取得する。
    """
    # <content:encoded><![CDATA[ の開始位置を探す
    start_marker = "<content:encoded><![CDATA["
    end_marker = "]]></content:encoded>"
    start_idx = block.find(start_marker)
    if start_idx < 0:
        return ""
    start_idx += len(start_marker)
    end_idx = block.find(end_marker, start_idx)
    if end_idx < 0:
        # 壊れた形式: 少なくとも ]]></ まで探す
        end_idx = block.find("]]>", start_idx)
        if end_idx < 0:
            return block[start_idx:]
    return block[start_idx:end_idx]


def extract_categories(block: str, domain: str) -> List[str]:
    """domain 属性が一致する category タグの内容を抽出"""
    results = []
    # domain="category" または domain='category'
    pattern = rf'<category\s+domain=["\']' + re.escape(domain) + r'["\'][^>]*>.*?</category>'
    for m in re.finditer(pattern, block, re.DOTALL):
        tag = m.group(0)
        # CDATA またはプレーンテキストから中身を取得
        cdata = re.search(r"<!\[CDATA\[(.*?)\]\]>", tag, re.DOTALL)
        if cdata:
            results.append(cdata.group(1).strip())
        else:
            inner = re.search(r">(.*?)<", tag, re.DOTALL)
            if inner:
                results.append(inner.group(1).strip())
    return [c for c in results if c]


def safe_filename(slug: str) -> str:
    """ファイル名として使用可能な形式に変換"""
    if not slug or not slug.strip():
        return "untitled"
    # URL デコード
    decoded = unquote(slug)
    # ファイル名に使えない文字を置換
    safe = re.sub(r'[<>:"/\\|?*]', '-', decoded)
    safe = re.sub(r'\s+', '-', safe)
    return safe.strip('-') or "untitled"


def html_to_markdown(html_content: str) -> str:
    """HTML を Markdown に変換（標準ライブラリのみ使用）"""
    if not html_content or not html_content.strip():
        return ""

    result = html_content

    # ブロック要素の変換
    result = re.sub(r"<p>\s*", "\n\n", result)
    result = re.sub(r"\s*</p>", "\n\n", result)
    result = re.sub(r"<br\s*/?>", "\n", result, flags=re.IGNORECASE)
    result = re.sub(r"<hr\s*/?>", "\n\n---\n\n", result, flags=re.IGNORECASE)

    # 見出し
    for i in range(6, 0, -1):
        result = re.sub(rf"<h{i}[^>]*>(.*?)</h{i}>", rf"\n\n{'#' * i} \1\n\n", result, flags=re.DOTALL | re.IGNORECASE)

    # インライン要素
    result = re.sub(r"<strong>(.*?)</strong>", r"**\1**", result, flags=re.DOTALL | re.IGNORECASE)
    result = re.sub(r"<b>(.*?)</b>", r"**\1**", result, flags=re.DOTALL | re.IGNORECASE)
    result = re.sub(r"<em>(.*?)</em>", r"*\1*", result, flags=re.DOTALL | re.IGNORECASE)
    result = re.sub(r"<i>(.*?)</i>", r"*\1*", result, flags=re.DOTALL | re.IGNORECASE)
    result = re.sub(r"<u>(.*?)</u>", r"\1", result, flags=re.DOTALL | re.IGNORECASE)

    # リンク
    result = re.sub(r'<a\s+href=["\']([^"\']*)["\'][^>]*>(.*?)</a>', r"[\2](\1)", result, flags=re.DOTALL | re.IGNORECASE)

    # 画像
    result = re.sub(
        r'<img[^>]*src=["\']([^"\']*)["\'][^>]*alt=["\']([^"\']*)["\'][^>]*/?>',
        r'![\2](\1)',
        result,
        flags=re.IGNORECASE,
    )
    result = re.sub(
        r'<img[^>]*src=["\']([^"\']*)["\'][^>]*/?>',
        r'![](\1)',
        result,
        flags=re.IGNORECASE,
    )

    # リスト
    result = re.sub(r"<li>(.*?)</li>", r"- \1\n", result, flags=re.DOTALL | re.IGNORECASE)
    result = re.sub(r"</?[ou]l[^>]*>", "\n", result, flags=re.IGNORECASE)

    # ブロック引用
    result = re.sub(r"<blockquote[^>]*>(.*?)</blockquote>", r"\n\n> \1\n\n", result, flags=re.DOTALL | re.IGNORECASE)

    # コード
    result = re.sub(r"<code>(.*?)</code>", r"`\1`", result, flags=re.DOTALL | re.IGNORECASE)
    result = re.sub(r"<pre[^>]*>(.*?)</pre>", r"\n\n```\n\1\n```\n\n", result, flags=re.DOTALL | re.IGNORECASE)

    # 残りのタグを削除
    result = re.sub(r"<[^>]+>", "", result)

    # HTML エンティティをデコード
    result = result.replace("&nbsp;", " ")
    result = result.replace("&amp;", "&")
    result = result.replace("&lt;", "<")
    result = result.replace("&gt;", ">")
    result = result.replace("&quot;", '"')
    result = result.replace("&#39;", "'")

    # 余分な空行を整理
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result.strip()


def parse_wordpress_xml(xml_path: str) -> List[dict]:
    """
    WordPress XML ファイルを正規表現でパースして投稿のリストを返す。
    壊れた XML でも可能な限り抽出を試みる。
    """
    with open(xml_path, "r", encoding="utf-8", errors="replace") as f:
        xml_content = f.read()

    # <channel> 内のみを対象にする
    channel_match = re.search(r"<channel>(.*?)</channel>", xml_content, re.DOTALL)
    if not channel_match:
        return []
    channel_content = channel_match.group(1)

    item_blocks = extract_item_blocks(channel_content)
    posts = []

    for block in item_blocks:
        post_type = extract_tag_content(block, "wp:post_type")
        if post_type != "post":
            continue

        title = extract_tag_content(block, "title") or "Untitled"
        content = extract_content_encoded(block)
        post_name = extract_tag_content(block, "wp:post_name")
        post_date = extract_tag_content(block, "wp:post_date")
        post_id = extract_tag_content(block, "wp:post_id")
        categories = extract_categories(block, "category")
        tags = extract_categories(block, "post_tag")

        slug = safe_filename(post_name) if post_name else f"post-{post_id}"
        posts.append({
            "title": title,
            "content": content,
            "slug": slug,
            "post_date": post_date,
            "categories": categories,
            "tags": tags,
            "post_id": post_id,
        })

    return posts


def format_date(wp_date: str) -> str:
    """WordPress の日付形式を ISO 8601 形式に変換"""
    if not wp_date or wp_date.startswith("0000"):
        return ""
    # "2018-03-08 17:31:33" -> "2018-03-08"
    parts = wp_date.split()
    return parts[0] if parts else ""


def escape_yaml_string(s: str) -> str:
    """YAML 文字列用のエスケープ"""
    s = s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")
    return s


def create_frontmatter(post: dict) -> str:
    """フロントマターを生成"""
    lines = ["---"]
    title_escaped = escape_yaml_string(post["title"])
    lines.append(f'title: "{title_escaped}"')
    if post["post_date"]:
        date_str = format_date(post["post_date"])
        if date_str:
            lines.append(f"pubDate: {date_str}")
    if post["categories"]:
        lines.append("categories:")
        for cat in post["categories"]:
            lines.append(f'  - "{escape_yaml_string(cat)}"')
    if post["tags"]:
        lines.append("tags:")
        for tag in post["tags"]:
            lines.append(f'  - "{escape_yaml_string(tag)}"')
    lines.append("---")
    return "\n".join(lines)


def convert_posts(xml_path: str, output_dir: str) -> int:
    """投稿を変換して Markdown ファイルを出力"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    posts = parse_wordpress_xml(xml_path)
    print(f"投稿を {len(posts)} 件検出しました")

    used_slugs = {}
    converted = 0

    for post in posts:
        slug = post["slug"]
        if not slug:
            slug = f"post-{post['post_id']}"

        # 重複するスラッグの処理
        if slug in used_slugs:
            used_slugs[slug] += 1
            slug = f"{slug}-{used_slugs[slug]}"
        else:
            used_slugs[slug] = 0

        md_content = create_frontmatter(post)
        body = html_to_markdown(post["content"])
        if body:
            md_content += "\n\n" + body

        file_path = output_path / f"{slug}.md"
        file_path.write_text(md_content, encoding="utf-8")
        converted += 1
        print(f"  変換: {post['title'][:50]}... -> {file_path.name}")

    return converted


def main():
    script_dir = Path(__file__).parent
    xml_files = list(script_dir.glob("*.xml"))

    if not xml_files:
        print("エラー: プロジェクトルートに XML ファイルが見つかりません")
        return 1

    xml_path = xml_files[0]
    output_dir = script_dir / "src" / "content" / "blog"

    print(f"入力: {xml_path}")
    print(f"出力: {output_dir}")
    print()

    count = convert_posts(str(xml_path), str(output_dir))
    print()
    print(f"完了: {count} 件の投稿を Markdown に変換しました")

    return 0


if __name__ == "__main__":
    exit(main())
