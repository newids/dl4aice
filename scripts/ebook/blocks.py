"""도해 figure와 문제 섹션 렌더링."""

from __future__ import annotations

import html
import re

from . import htmlpost, mdconv, sources

SVG_ROOT_RE = re.compile(r"<svg\b")


def inline_svg(svg_text: str) -> str:
    """SVG를 인라인 임베드용으로 다듬는다(루트 클래스 부여, 선언부 제거)."""
    body = re.sub(r"(?s)^\s*<\?xml.*?\?>\s*", "", svg_text)
    body = re.sub(r"(?s)^\s*<!DOCTYPE[^>]*>\s*", "", body).strip()
    return SVG_ROOT_RE.sub('<svg class="diagram__svg" focusable="false"', body, count=1)


def figure(diagram_id: str, caption: str, number: str, svg_text: str | None) -> str:
    """도해 figure. SVG가 없으면 눈에 띄는 '도해 누락' 박스로 대체한다."""
    label = f"그림 {number}"
    if svg_text is None:
        frame = (
            '<div class="diagram__missing" role="alert">'
            f"<strong>도해 누락</strong>"
            f"<span>id <code>{html.escape(diagram_id)}</code> 에 해당하는 SVG 파일을 찾지 못했습니다.</span>"
            "</div>"
        )
    else:
        frame = f'<div class="diagram__frame">{inline_svg(svg_text)}</div>'
    return (
        f'<figure class="diagram" id="fig-{html.escape(diagram_id)}">{frame}'
        f'<figcaption><span class="diagram__num">{label}</span>'
        f"<span class=\"diagram__caption\">{html.escape(caption)}</span></figcaption></figure>"
    )


def _render_markdown(text: str, used_ids: set[str], demote: int) -> str:
    return htmlpost.polish(mdconv.convert(text), used_ids, demote=demote)


def exam_section(
    body_md: str, used_ids: set[str], anchor: str, demote: int = 1
) -> str:
    """문제 마크다운을 문제부 + 접힌 해설부로 렌더링한다."""
    problems_md, solution_md = sources.split_solution(sources.strip_comments(body_md))
    problems = _render_markdown(problems_md, used_ids, demote)
    parts = [f'<section class="exam" id="{anchor}">', problems]
    if solution_md.strip():
        solution = _render_markdown(solution_md, used_ids, demote)
        parts.append(
            '<details class="solution">'
            "<summary>해답 및 해설 보기</summary>"
            f'<div class="solution__body">{solution}</div>'
            "</details>"
        )
    parts.append("</section>")
    return "\n".join(parts)


def prose(text: str, used_ids: set[str], demote: int = 0) -> str:
    """본문 마크다운 조각(주석 제거 후 변환)."""
    return _render_markdown(sources.strip_comments(text), used_ids, demote)
