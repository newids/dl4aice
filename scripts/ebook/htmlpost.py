"""변환된 HTML 조각의 조판 후처리.

콘텐츠 텍스트는 건드리지 않는다. 제목 레벨 조정·앵커 id 부여·콜아웃 분류·
표 스크롤 래핑처럼 조판에만 관여하는 변형만 수행한다.
"""

from __future__ import annotations

import re

# 인용 블록 선두 기호 -> 콜아웃 종류
_CALLOUT_MARKERS = (
    ("⚠", "callout callout--warn"),
    ("ℹ", "callout callout--info"),
    ("📎", "callout callout--more"),
    ("💡", "callout callout--tip"),
    ("📌", "callout callout--pin"),
)
_DEFAULT_CALLOUT = "callout callout--note"

_TAG_RE = re.compile(r"<[^>]+>")
_HEADING_RE = re.compile(r"<h([1-6])>(.*?)</h\1>", re.S)


def demote_headings(fragment: str, levels: int = 1) -> str:
    """제목 레벨을 levels 만큼 낮춘다(챕터 페이지에 문제집을 끼워 넣을 때 사용)."""

    def repl(match: re.Match[str]) -> str:
        level = min(6, int(match.group(1)) + levels)
        return f"<h{level}>{match.group(2)}</h{level}>"

    return _HEADING_RE.sub(repl, fragment)


def slugify(text: str) -> str:
    plain = _TAG_RE.sub("", text)
    plain = re.sub(r"[^0-9A-Za-z가-힣\s._-]", "", plain).strip()
    plain = re.sub(r"[\s._]+", "-", plain).strip("-")
    return plain[:60].lower()


def assign_heading_ids(fragment: str, used: set[str], prefix: str = "s") -> str:
    """h2~h6에 유일한 id를 부여한다(페이지 내 목차 링크 대상)."""

    def repl(match: re.Match[str]) -> str:
        level, inner = match.group(1), match.group(2)
        if level == "1":
            return match.group(0)
        base = slugify(inner) or prefix
        slug, n = base, 2
        while slug in used:
            slug = f"{base}-{n}"
            n += 1
        used.add(slug)
        return f'<h{level} id="{slug}">{inner}</h{level}>'

    return _HEADING_RE.sub(repl, fragment)


def collect_headings(fragment: str, level: int = 2) -> list[tuple[str, str]]:
    """(id, 텍스트) 목록을 반환한다."""
    pattern = re.compile(rf'<h{level} id="([^"]+)">(.*?)</h{level}>', re.S)
    return [(m.group(1), _TAG_RE.sub("", m.group(2)).strip()) for m in pattern.finditer(fragment)]


def classify_callouts(fragment: str) -> str:
    """인용 블록 선두 기호를 보고 콜아웃 클래스를 붙인다."""
    parts: list[str] = []
    cursor = 0
    for match in re.finditer(r"<blockquote>", fragment):
        lookahead = _TAG_RE.sub("", fragment[match.end() : match.end() + 80]).lstrip()
        cls = _DEFAULT_CALLOUT
        for marker, name in _CALLOUT_MARKERS:
            if lookahead.startswith(marker):
                cls = name
                break
        parts.append(fragment[cursor : match.start()])
        parts.append(f'<blockquote class="{cls}">')
        cursor = match.end()
    parts.append(fragment[cursor:])
    return "".join(parts)


def wrap_tables(fragment: str) -> str:
    """좁은 화면에서 표가 넘칠 때를 대비해 가로 스크롤 컨테이너로 감싼다."""
    fragment = fragment.replace(
        "<table>", '<div class="table-scroll" role="region" tabindex="0"><table>'
    )
    return fragment.replace("</table>", "</table></div>")


def polish(fragment: str, used_ids: set[str], demote: int = 0) -> str:
    """조판 후처리 일괄 적용."""
    if demote:
        fragment = demote_headings(fragment, demote)
    fragment = classify_callouts(fragment)
    fragment = assign_heading_ids(fragment, used_ids)
    return wrap_tables(fragment)
