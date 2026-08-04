"""표지 + 전체 목차 + 학습 로드맵 페이지."""

from __future__ import annotations

import html

from . import pages


def _stat(value: str, label: str) -> str:
    return f'<div class="stat"><span class="stat__value">{html.escape(value)}</span><span class="stat__label">{html.escape(label)}</span></div>'


def _cover(meta: dict, stats: list[tuple[str, str]]) -> str:
    title = meta.get("제목", "").strip("『』")
    main, _, tagline = title.partition(" — ")
    return f"""<section class="cover" aria-labelledby="book-title">
<p class="cover__kicker">{html.escape(meta.get("부제", ""))}</p>
<h1 class="cover__title" id="book-title">{html.escape(main)}</h1>
<p class="cover__tagline">{html.escape(tagline)}</p>
<p class="cover__concept">{html.escape(meta.get("콘셉트 한 줄", ""))}</p>
<p class="cover__reader"><span>대상 독자</span>{html.escape(meta.get("대상 독자", ""))}</p>
<div class="cover__stats">{''.join(_stat(v, l) for v, l in stats)}</div>
</section>"""


def _entry(row: dict, info: dict) -> str:
    href = f'{row["key"]}.html'
    number = (
        f'Ch{row["number"]}' if row["kind"] == "chapter" else f'모의고사 {row["number"]}회'
    )
    objectives = info.get("objectives") or []
    goals = (
        "<ul class='entry__goals'>"
        + "".join(f"<li>{html.escape(g)}</li>" for g in objectives[:3])
        + "</ul>"
        if objectives
        else ""
    )
    facts = " · ".join(info.get("facts", []))
    return f"""<li class="entry entry--{row["kind"]}">
<a class="entry__link" href="{href}">
<span class="entry__num">{html.escape(number)}</span>
<span class="entry__title">{html.escape(info.get("title", row["title"]))}</span>
</a>
<p class="entry__role">{html.escape(row["role"])}</p>
{goals}
<p class="entry__facts">{html.escape(facts)}</p>
</li>"""


def _toc(rows: list[dict], infos: dict) -> str:
    out: list[str] = ['<section class="toc" aria-labelledby="toc-title">',
                      '<h2 class="section-title" id="toc-title">전체 목차</h2>']
    current = None
    for row in rows:
        part = row["part"] if row["part"] != "—" else "실전 모의고사"
        if part != current:
            if current is not None:
                out.append("</ol></section>")
            out.append(
                f'<section class="part"><h3 class="part__title">{html.escape(part)}</h3><ol class="entries">'
            )
            current = part
        out.append(_entry(row, infos.get(row["key"], {})))
    out.append("</ol></section></section>")
    return "\n".join(out)


def _roadmap(rows: list[dict]) -> str:
    steps = "".join(
        f'<li class="road__step"><span class="road__key">'
        f'<a href="{row["key"]}.html">'
        f'{html.escape("Ch" + row["number"] if row["kind"] == "chapter" else "모의 " + row["number"] + "회")}'
        f'</a></span>'
        f'<span class="road__label">{html.escape(row["title"])}</span>'
        f'<span class="road__prereq">선행 {html.escape(row["prereq"])}</span></li>'
        for row in rows
    )
    return f"""<section class="roadmap" aria-labelledby="roadmap-title">
<h2 class="section-title" id="roadmap-title">학습 로드맵</h2>
<p class="roadmap__lead">개념 → 데이터 준비 → 모델링 → 학습·개선 → 평가 → 실전 순서로 읽습니다. 각 단계는 앞 단계의 결과를 이어받습니다.</p>
<ol class="road">{steps}</ol>
</section>"""


def render(meta: dict, rows: list[dict], infos: dict, stats: list[tuple[str, str]], book_title: str) -> str:
    body = f"""{pages.masthead(book_title, is_index=True)}
<main class="page page--index">
{_cover(meta, stats)}
{_roadmap(rows)}
{_toc(rows, infos)}
</main>"""
    return pages.shell(title=book_title, book_title=book_title, body=body, page_class="page-index")
