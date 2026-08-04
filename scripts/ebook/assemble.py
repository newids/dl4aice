"""챕터·모의고사 페이지 조립."""

from __future__ import annotations

import html
import re

from . import blocks, htmlpost, pages, sources

_MISSING: list[str] = []


def missing_diagrams() -> list[str]:
    return list(_MISSING)


def _eyebrow(part: str, number: str, kind: str) -> str:
    if kind == "mock":
        return f'<p class="opener__eyebrow">실전 모의고사 {number}회</p>'
    label = f"Part {part}" if part and part != "—" else ""
    sep = " · " if label else ""
    return f'<p class="opener__eyebrow">{html.escape(label)}{sep}Chapter {number}</p>'


def chapter_page(item, meta, body_md, svgs, quiz_md, nav, book_title) -> tuple[str, list[str]]:
    """챕터 페이지 HTML과 그 페이지가 정의한 앵커 id 목록을 만든다."""
    used_ids: set[str] = set()
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
        elif kind == "exam":
            anchor = f"exam-{payload}"
            used_ids.add(anchor)
            parts.append(blocks.exam_section(quiz_md, used_ids, anchor))

    content = "\n".join(parts)
    content = _insert_after_h1(content, pages.objectives_box(meta.get("objectives") or []))
    headings = htmlpost.collect_headings(_without_solutions(content))
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
        ),
        sorted(used_ids),
    )


def mock_page(item, meta, body_md, nav, book_title) -> tuple[str, list[str]]:
    used_ids: set[str] = set()
    anchor = f'exam-{item["key"]}'
    used_ids.add(anchor)
    content = blocks.exam_section(body_md, used_ids, anchor, demote=0)
    headings = htmlpost.collect_headings(_without_solutions(content))
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
            title=f'{meta.get("title", item["title"])} — {book_title}',
            book_title=book_title,
            body=body,
            page_class="page-mock",
        ),
        sorted(used_ids),
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
