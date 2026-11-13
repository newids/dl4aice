#!/usr/bin/env python3
"""금지 장식 검사 — 한쪽 가장자리(왼쪽/위쪽)에만 색 포인트를 주는 띠.

CLAUDE.md 의 디자인 금지 규칙을 스타일시트에서 기계적으로 확인한다.
잡는 것: 굵게 색칠한 border-left/border-top, 한쪽 면만 지정한 border-*-color/-width,
inset box-shadow 로 만든 가장자리 띠, 한쪽만 각진 border-radius(0 r r 0).
허용: 1px 중립 구분선, 제목 위의 전폭 구분선(2px ink), CSS 삼각형(북마크 표시), 텍스트 하이라이트 밑줄.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
FILES = [ROOT / "scripts" / "assets" / "style.css", *sorted((ROOT / "assets" / "css" / "_parts").glob("*.css"))]
PAGES = ROOT / "_workspace" / "pages"

NEUTRAL = re.compile(
    r"^(0|none|1px (solid|dashed) (var\(--(line|line-soft|cb-line|v2-[\w-]+)\)|transparent|rgba\([^)]*\))"
    r"|2px solid var\(--ink\)|[\d.]+pt solid var\(--v2-cs-print-ink\))$"
)
ALLOW_SELECTORS = (".v2-cbt__q[data-bm]::after", ".v2-ob__hl", ".page-body .v2-cs > h2")
SIDE = re.compile(r"border-(left|top|inline-start|block-start)(-width|-color)?:\s*([^;]+);")
INSET = re.compile(r"box-shadow:[^;]*inset\s+(-?[\d.]+(px|rem)\s+0|0\s+-?[\d.]+(px|rem)\s+0)(?!\s+[1-9])[^;]*;")
RADIUS = re.compile(r"border-radius:\s*0\s+\S+\s+\S+\s+0\s*;")


def scan(text: str, name: str) -> list[str]:
    problems: list[str] = []
    for block in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
        selector = block.group(1).strip().split("\n")[-1].strip()
        if any(key in selector for key in ALLOW_SELECTORS):
            continue
        body = block.group(2)
        for decl in SIDE.finditer(body):
            if not NEUTRAL.match(decl.group(3).strip()):
                problems.append(f"{name}: {selector} → {decl.group(0)}")
        for pattern in (INSET, RADIUS):
            for decl in pattern.finditer(body):
                problems.append(f"{name}: {selector} → {decl.group(0)}")
    return problems


def main() -> int:
    problems: list[str] = []
    for path in FILES:
        problems += scan(path.read_text(encoding="utf-8"), path.name)
    for page in sorted(PAGES.glob("*.html")) if PAGES.exists() else []:
        for style in re.findall(r'style="([^"]*)"', page.read_text(encoding="utf-8")):
            if SIDE.search(style + ";"):
                problems.append(f"{page.name}: inline style → {style}")
    for line in problems:
        print(f"  금지 장식: {line}")
    print(f'가장자리 색 띠 검사: {"0건 (통과)" if not problems else f"{len(problems)}건 발견"} / 스타일시트 {len(FILES)}개')
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
