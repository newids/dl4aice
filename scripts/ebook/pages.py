"""페이지 셸(HTML 문서 골격)과 이전/다음 내비게이션."""

from __future__ import annotations

import html


def shell(
    *, title: str, book_title: str, body: str, page_class: str = "", head_extra: str = "", scripts: str = ""
) -> str:
    cls = f' class="{page_class}"' if page_class else ""
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(book_title)}" />
<link rel="stylesheet" href="style.css" />
{head_extra}
</head>
<body{cls}>
{body}
{scripts}
</body>
</html>
"""


def masthead(book_title: str, is_index: bool = False) -> str:
    home = (
        f'<span class="masthead__title">{html.escape(book_title)}</span>'
        if is_index
        else f'<a class="masthead__title" href="index.html">{html.escape(book_title)}</a>'
    )
    link = "" if is_index else '<a class="masthead__toc" href="index.html">목차</a>'
    return f'<header class="masthead">{home}{link}</header>'


def pager(prev_item: dict | None, next_item: dict | None, css_class: str = "pager") -> str:
    """이전/다음 내비게이션. 항목은 {href, label, title} 형태."""
    def side(item: dict | None, direction: str, caption: str) -> str:
        if not item:
            return '<span class="pager__slot pager__slot--empty"></span>'
        return (
            f'<a class="pager__slot pager__slot--{direction}" href="{item["href"]}">'
            f'<span class="pager__dir">{caption}</span>'
            f'<span class="pager__label">{html.escape(item["label"])}</span>'
            f'<span class="pager__title">{html.escape(item["title"])}</span></a>'
        )

    return (
        f'<nav class="{css_class}" aria-label="페이지 이동">'
        f'{side(prev_item, "prev", "이전")}'
        f'{side(next_item, "next", "다음")}</nav>'
    )


def section_nav(headings: list[tuple[str, str]]) -> str:
    """페이지 내 목차(h2 기준)."""
    if not headings:
        return ""
    items = "".join(
        f'<li><a href="#{anchor}">{html.escape(text)}</a></li>' for anchor, text in headings
    )
    return (
        '<nav class="section-nav" aria-label="이 페이지의 구성">'
        '<p class="section-nav__title">이 페이지의 구성</p>'
        f"<ol>{items}</ol></nav>"
    )


def objectives_box(objectives: list[str]) -> str:
    if not objectives:
        return ""
    items = "".join(f"<li>{html.escape(text)}</li>" for text in objectives)
    return (
        '<aside class="objectives" aria-label="학습 목표">'
        '<h2 class="objectives__title">학습 목표</h2>'
        f"<ul>{items}</ul></aside>"
    )
