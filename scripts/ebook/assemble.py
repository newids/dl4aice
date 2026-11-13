"""챕터·모의고사 페이지 조립."""

from __future__ import annotations

import html
import re

from . import blocks, htmlpost, pages, sources, v2

_MISSING: list[str] = []


def missing_diagrams() -> list[str]:
    return list(_MISSING)


def _eyebrow(part: str, number: str, kind: str) -> str:
    if kind == "mock":
        return f'<p class="opener__eyebrow">실전 모의고사 {number}회</p>'
    label = f"Part {part}" if part and part != "—" else ""
    sep = " · " if label else ""
    return f'<p class="opener__eyebrow">{html.escape(label)}{sep}Chapter {number}</p>'


def chapter_page(item, meta, body_md, svgs, quiz_md, nav, book_title, drill_count: int = 0) -> tuple[str, list[str]]:
    """챕터 페이지 HTML과 그 페이지가 정의한 앵커 id 목록을 만든다.

    v2: `<!-- WIDGET: ... -->` 자리에 위젯을 심고, 확인 문제 자리에는 인터랙티브 실습 셀을
    먼저 놓은 뒤 v1 지면판 문제·해설을 접어서 보존한다.
    """
    used_ids: set[str] = set()
    has_arch = False
    drill_nav: tuple[str, str] | None = None
    number = item["number"].lstrip("0") or "0"
    fig_no = 0
    parts: list[str] = []

    for kind, payload in sources.split_blocks(body_md):
        if kind == "md":
            parts.append(blocks.prose(payload, used_ids))
        elif kind == "diagram":
            diagram_id, caption = payload
            fig_no += 1
            svg = svgs.get(diagram_id)
            if svg is None:
                _MISSING.append(f'{item["key"]}: {diagram_id}')
            used_ids.add(f"fig-{diagram_id}")
            parts.append(blocks.figure(diagram_id, caption, f"{number}-{fig_no}", svg))
        elif kind == "widget":
            widget_kind, fields = payload
            has_arch = has_arch or widget_kind == "arch"
            parts.append(v2.widget(widget_kind, fields))
        elif kind == "exam":
            anchor = f"exam-{payload}"
            used_ids.add(anchor)
            legacy = blocks.exam_section(quiz_md, used_ids, anchor)
            if drill_count:
                block, drill_anchor, drill_title = v2.drills_section(item["key"], drill_count)
                used_ids.add(drill_anchor)
                drill_nav = (drill_anchor, drill_title)
                parts.append(block)
                parts.append(v2.legacy_block(legacy, "지면판 확인 문제와 해설 보기 (v1 원문)"))
            else:
                parts.append(legacy)

    content = "\n".join(parts)
    content = _insert_after_h1(content, pages.objectives_box(meta.get("objectives") or []))
    headings = htmlpost.collect_headings(_without_solutions(content))
    if drill_nav:
        at = next((i for i, (hid, _) in enumerate(headings) if f'id="{hid}"' in legacy), len(headings))
        headings.insert(at, drill_nav)
    body = f"""{pages.masthead(book_title)}
<main class="page">
<div class="opener">{_eyebrow(item["part"], number, "chapter")}</div>
{pages.section_nav(headings)}
<article class="page-body">
{content}
</article>
{pages.pager(nav[0], nav[1])}
</main>"""
    return (
        pages.shell(
            title=f'Ch{item["number"]}. {meta.get("title", item["title"])} — {book_title}',
            book_title=book_title,
            body=body,
            page_class="page-chapter",
            head_extra=v2.head_extra(),
            scripts=v2.scripts("chapter", arch=has_arch),
        ),
        sorted(used_ids),
    )


def mock_page(item, meta, body_md, nav, book_title, exam: dict | None = None) -> tuple[str, list[str]]:
    """모의고사 페이지. v2: CBT 엔진 마운트 + (있으면) v1 지면판을 접어서 보존."""
    used_ids: set[str] = set()
    anchor = f'exam-{item["key"]}'
    used_ids.add(anchor)
    legacy = blocks.exam_section(body_md, used_ids, anchor, demote=0) if body_md else ""
    if exam:
        content = v2.cbt_block(exam)
        if legacy:
            content += "\n" + v2.legacy_block(legacy, "지면판 모의고사 보기 (v1 원문 12문항 · 데이터 생성 코드 · 해설)")
        headings: list[tuple[str, str]] = []
    else:
        content = legacy
        headings = htmlpost.collect_headings(_without_solutions(content))
    title = (exam or {}).get("title") or meta.get("title", item["title"])
    body = f"""{pages.masthead(book_title)}
<main class="page">
<div class="opener">{_eyebrow(item["part"], item["number"], "mock")}</div>
{pages.section_nav(headings)}
<article class="page-body">
{content}
</article>
{pages.pager(nav[0], nav[1])}
</main>"""
    return (
        pages.shell(
            title=f"{title} — {book_title}",
            book_title=book_title,
            body=body,
            page_class="page-mock",
            head_extra=v2.head_extra(),
            scripts=v2.scripts("mock") if exam else v2.scripts("plain"),
        ),
        sorted(used_ids),
    )


def extra_page(
    key: str, fragment: str, eyebrow: str, book_title: str, title: str, kind: str = "plain", nav=None
) -> str:
    """목차 밖 부속 페이지(치트시트 등): HTML 조각을 사이트 셸로 감싼다."""
    headings = htmlpost.collect_headings(fragment)
    body = f"""{pages.masthead(book_title)}
<main class="page">
<div class="opener"><p class="opener__eyebrow">{html.escape(eyebrow)}</p></div>
{pages.section_nav(headings)}
<article class="page-body page-body--{key}">
{fragment}
</article>
{pages.pager(*(nav or ({"href": "index.html", "label": "표지", "title": "전체 목차"}, None)))}
</main>"""
    return pages.shell(
        title=f"{title} — {book_title}",
        book_title=book_title,
        body=body,
        page_class=f"page-extra page-{key}",
        head_extra=v2.head_extra(),
        scripts=v2.scripts(kind),
    )


def _without_solutions(content: str) -> str:
    """접힌 해설 안의 제목은 페이지 목차에 노출하지 않는다."""
    return re.sub(r"(?s)<details class=\"solution\">.*?</details>", "", content)


def _insert_after_h1(content: str, snippet: str) -> str:
    if not snippet:
        return content
    marker = "</h1>"
    at = content.find(marker)
    if at < 0:
        return snippet + content
    at += len(marker)
    return content[:at] + "\n" + snippet + content[at:]
