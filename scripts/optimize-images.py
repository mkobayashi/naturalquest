#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
画像を軽量化するユーティリティ。

- macOS 標準の `sips` がある場合は JPEG/PNG を変換・リサイズに利用
- ImageMagick の `magick` がある場合は優先して利用
- `cwebp` がある場合は WebP 変換も可能

依存を増やさずに「あるものを使う」設計にしているため、環境によって最適化の結果は変わります。
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


@dataclass(frozen=True)
class Tools:
    magick: str | None
    sips: str | None
    cwebp: str | None


def which(name: str) -> str | None:
    return shutil.which(name)


def detect_tools() -> Tools:
    return Tools(magick=which("magick"), sips=which("sips"), cwebp=which("cwebp"))


def iter_images(root: Path) -> Iterable[Path]:
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
            yield p


def run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        msg = proc.stderr.strip() or proc.stdout.strip() or "unknown error"
        raise RuntimeError(f"command failed: {' '.join(cmd)}\n{msg}")


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def optimize_with_magick(src: Path, dst: Path, *, quality: int, max_width: int | None, max_height: int | None) -> None:
    # ImageMagick: -strip でメタデータ削除。-quality は主に JPEG/WebP に効く。
    resize = []
    if max_width or max_height:
        w = max_width if max_width else ""
        h = max_height if max_height else ""
        resize = ["-resize", f"{w}x{h}>"]

    ensure_parent(dst)
    cmd = [
        "magick",
        str(src),
        "-strip",
        *resize,
        "-quality",
        str(quality),
        str(dst),
    ]
    run(cmd)


def optimize_with_sips(src: Path, dst: Path, *, quality: int, max_width: int | None, max_height: int | None) -> None:
    # sips は JPEG/PNG を扱える。WebP は未対応のケースがあるため呼び出し側で分岐する。
    ensure_parent(dst)

    cmd = ["sips", "-s", "format", src.suffix.lstrip(".").lower()]

    # 画質（JPEGのみ安定して効く）
    if src.suffix.lower() in {".jpg", ".jpeg"}:
        cmd += ["-s", "formatOptions", str(quality)]

    if max_width:
        cmd += ["--resampleWidth", str(max_width)]
    if max_height:
        cmd += ["--resampleHeight", str(max_height)]

    cmd += ["-o", str(dst), str(src)]
    run(cmd)


def convert_to_webp(tools: Tools, src: Path, dst: Path, *, quality: int, max_width: int | None, max_height: int | None) -> None:
    if not tools.cwebp:
        raise RuntimeError("cwebp not found")
    ensure_parent(dst)

    cmd = ["cwebp", "-quiet", "-q", str(quality)]
    if max_width:
        cmd += ["-resize", str(max_width), "0"]
    if max_height and not max_width:
        cmd += ["-resize", "0", str(max_height)]
    cmd += [str(src), "-o", str(dst)]
    run(cmd)


def main() -> None:
    parser = argparse.ArgumentParser(description="Optimize images in a directory.")
    parser.add_argument("input", type=Path, help="input directory")
    parser.add_argument("--out", type=Path, default=None, help="output directory (default: <input>-optimized)")
    parser.add_argument("--in-place", action="store_true", help="overwrite files in input directory")
    parser.add_argument("--quality", type=int, default=82, help="quality (default: 82)")
    parser.add_argument("--max-width", type=int, default=None, help="max width (px)")
    parser.add_argument("--max-height", type=int, default=None, help="max height (px)")
    parser.add_argument("--to-webp", action="store_true", help="convert jpg/png to webp (requires cwebp)")
    args = parser.parse_args()

    tools = detect_tools()
    if not (tools.magick or tools.sips):
        raise SystemExit("No optimizer found. Install ImageMagick (`magick`) or use macOS with `sips`.")

    input_dir: Path = args.input
    if not input_dir.exists() or not input_dir.is_dir():
        raise SystemExit(f"input not found or not a directory: {input_dir}")

    out_dir = args.out
    if args.in_place:
        out_dir = input_dir
    elif out_dir is None:
        out_dir = input_dir.with_name(input_dir.name + "-optimized")

    count = 0
    for src in iter_images(input_dir):
        rel = src.relative_to(input_dir)
        src_ext = src.suffix.lower()

        if args.to_webp and src_ext in {".jpg", ".jpeg", ".png"}:
            dst = (out_dir / rel).with_suffix(".webp")
            convert_to_webp(tools, src, dst, quality=args.quality, max_width=args.max_width, max_height=args.max_height)
        else:
            dst = out_dir / rel
            if tools.magick:
                optimize_with_magick(src, dst, quality=args.quality, max_width=args.max_width, max_height=args.max_height)
            else:
                if src_ext == ".webp":
                    # sips 単体で WebP を触ると壊れるケースがあるので、コピーのみ
                    ensure_parent(dst)
                    if src != dst:
                        dst.write_bytes(src.read_bytes())
                else:
                    optimize_with_sips(src, dst, quality=args.quality, max_width=args.max_width, max_height=args.max_height)

        count += 1

    print(f"done: {count} files -> {out_dir}")


if __name__ == "__main__":
    main()

