"""빌드 산출물 자체 검증 4종."""

from __future__ import annotations

import re
from pathlib import Path

HREF_RE = re.compile(r'href="([^"]+)"')
ID_RE = re.compile(r'\sid="([^"]+)"')
SVG_BLOCK_RE = re.compile(r"(?s)<svg\b.*?</svg>")
PLACEHOLDER_RE = re.compile(r"<!--\s*(DIAGRAM|EXAM|WIDGET)\b")
SRC_RE = re.compile(r'\ssrc="([^"]+)"')
SCRIPT_BLOCK_RE = re.compile(r"(?s)<script\b[^>]*>.*?</script>")
COMMENT_RE = re.compile(r"<!--(?!\[if).*?-->", re.S)


def _outside_svg(text: str) -> str:
    return SVG_BLOCK_RE.sub("", text)


def check_placeholders(book: Path) -> dict:
    """1) 치환되지 않은 플레이스홀더·소스 주석 잔존 검사."""
    hits: list[str] = []
    comments: list[str] = []
    for path in sorted(book.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        hits += [f"{path.name}: {m.group(0)}" for m in PLACEHOLDER_RE.finditer(text)]
        outside = _outside_svg(text)
        comments += [
            f"{path.name}: {m.group(0)[:60]}" for m in COMMENT_RE.finditer(outside)
        ]
    return {"placeholders": hits, "stray_comments": comments}


def check_links(book: Path) -> dict:
    """2) 내부 링크 대상 파일·앵커 존재 검사."""
    ids: dict[str, set[str]] = {}
    for path in sorted(book.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        ids[path.name] = set(ID_RE.findall(text))
    broken: list[str] = []
    total = 0
    for path in sorted(book.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        outside = _outside_svg(text)
        for src in SRC_RE.findall(outside):
            if src.startswith(("http://", "https://", "data:")):
                broken.append(f"{path.name} -> {src} (외부 스크립트/리소스 금지)")
                continue
            total += 1
            if not (book / src).exists():
                broken.append(f"{path.name} -> {src} (파일 없음)")
        for href in HREF_RE.findall(SCRIPT_BLOCK_RE.sub("", outside)):
            if href.startswith(("http://", "https://", "mailto:")):
                continue
            total += 1
            target, _, anchor = href.partition("#")
            target_name = target or path.name
            if target and not (book / target).exists():
                broken.append(f"{path.name} -> {href} (파일 없음)")
                continue
            if anchor and anchor not in ids.get(target_name, set()):
                broken.append(f"{path.name} -> {href} (앵커 없음)")
    return {"checked": total, "broken": broken}


def check_diagrams(book: Path, diagrams: Path) -> dict:
    """3) 도해 매칭 — 고아 SVG와 누락 SVG."""
    available = {p.stem for p in diagrams.glob("*.svg")}
    used: set[str] = set()
    for path in sorted(book.glob("ch*.html")):
        used |= set(re.findall(r'<figure class="diagram" id="fig-([^"]+)"', path.read_text(encoding="utf-8")))
    return {
        "available": len(available),
        "embedded": len(used),
        "orphans": sorted(available - used),
        "missing": sorted(used - available),
    }


def check_toc(book: Path, expected_keys: list[str], extra_pages: tuple[str, ...] = ()) -> dict:
    """4) 목차 ↔ 실제 페이지 일치."""
    index = (book / "index.html").read_text(encoding="utf-8")
    linked = {
        h.split("#")[0]
        for h in HREF_RE.findall(index)
        if h.endswith(".html")
    }
    expected = {f"{k}.html" for k in expected_keys}
    produced = {p.name for p in book.glob("*.html")} - {"index.html"} - set(extra_pages)
    linked -= set(extra_pages)  # 목차 밖 부속 페이지(치트시트 등)는 링크 검사에서 따로 확인한다
    return {
        "expected": sorted(expected),
        "not_linked": sorted(expected - linked),
        "linked_but_absent": sorted(linked - produced - {"index.html"}),
        "unlisted_pages": sorted(produced - expected),
    }
