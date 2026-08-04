"""Markdown -> HTML 변환기.

`python-markdown`이 설치되어 있으면 그것을 사용하고, 없으면 교재에서 실제로
쓰이는 문법만 지원하는 최소 변환기로 자동 대체한다(오프라인 빌드 보장).

지원 문법: 제목, 문단, 순서/비순서 목록, 표, 인용, 수평선, 펜스 코드,
인라인 코드/굵게/기울임.
"""

from __future__ import annotations

import html
import re

# nl2br: 원고의 줄바꿈은 의도된 것이다(객관식 보기 ①~⑤, 콜아웃 제목/본문 분리 등).
# 줄바꿈을 접으면 보기가 한 줄로 이어붙어 문제집 가독성이 무너진다.
_MD_EXTENSIONS = ("tables", "fenced_code", "sane_lists", "nl2br")


def _load_library():
    try:
        import markdown  # type: ignore
    except ImportError:
        return None
    return markdown.Markdown(extensions=list(_MD_EXTENSIONS))


_LIB = _load_library()
BACKEND = "python-markdown" if _LIB is not None else "builtin-minimal"


def convert(text: str) -> str:
    """마크다운 문자열을 HTML 조각으로 변환한다."""
    if not text.strip():
        return ""
    if _LIB is not None:
        _LIB.reset()
        return _LIB.convert(text)
    return convert_minimal(text)


# --------------------------------------------------------------------------
# 최소 변환기 (fallback)
# --------------------------------------------------------------------------

_FENCE_RE = re.compile(r"^\s*(```|~~~)\s*(\S*)\s*$")
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_HR_RE = re.compile(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$")
_UL_RE = re.compile(r"^(\s*)[-*+]\s+(.*)$")
_OL_RE = re.compile(r"^(\s*)(\d+)\.\s+(.*)$")
_TABLE_SEP_RE = re.compile(r"^\s*\|?[\s:|-]+\|[\s:|-]*$")


def convert_minimal(text: str) -> str:
    lines = text.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    index = 0
    total = len(lines)

    while index < total:
        line = lines[index]

        fence = _FENCE_RE.match(line)
        if fence:
            index = _emit_code(lines, index, fence, out)
            continue
        if not line.strip():
            index += 1
            continue
        if _HR_RE.match(line):
            out.append("<hr />")
            index += 1
            continue

        heading = _HEADING_RE.match(line)
        if heading:
            level = len(heading.group(1))
            out.append(f"<h{level}>{inline(heading.group(2).strip())}</h{level}>")
            index += 1
            continue
        if line.lstrip().startswith(">"):
            index = _emit_blockquote(lines, index, out)
            continue
        if _is_table_start(lines, index):
            index = _emit_table(lines, index, out)
            continue
        if _UL_RE.match(line) or _OL_RE.match(line):
            index = _emit_list(lines, index, out)
            continue

        index = _emit_paragraph(lines, index, out)

    return "\n".join(out)


def _emit_code(lines: list[str], index: int, fence, out: list[str]) -> int:
    marker, lang = fence.group(1), fence.group(2)
    body: list[str] = []
    index += 1
    while index < len(lines) and not lines[index].strip().startswith(marker):
        body.append(lines[index])
        index += 1
    index += 1  # 닫는 펜스
    cls = f' class="language-{html.escape(lang)}"' if lang else ""
    out.append(f"<pre><code{cls}>{html.escape(chr(10).join(body))}\n</code></pre>")
    return index


def _emit_blockquote(lines: list[str], index: int, out: list[str]) -> int:
    body: list[str] = []
    while index < len(lines) and lines[index].lstrip().startswith(">"):
        body.append(re.sub(r"^\s*>\s?", "", lines[index]))
        index += 1
    out.append("<blockquote>\n" + convert_minimal("\n".join(body)) + "\n</blockquote>")
    return index


def _is_table_start(lines: list[str], index: int) -> bool:
    if "|" not in lines[index]:
        return False
    nxt = lines[index + 1] if index + 1 < len(lines) else ""
    return bool(_TABLE_SEP_RE.match(nxt)) and "|" in nxt


def _split_row(row: str) -> list[str]:
    cells = row.strip().strip("|").split("|")
    return [c.strip() for c in cells]


def _emit_table(lines: list[str], index: int, out: list[str]) -> int:
    header = _split_row(lines[index])
    index += 2
    rows: list[list[str]] = []
    while index < len(lines) and lines[index].strip().startswith("|"):
        rows.append(_split_row(lines[index]))
        index += 1
    parts = ["<table>", "<thead>", "<tr>"]
    parts += [f"<th>{inline(c)}</th>" for c in header]
    parts += ["</tr>", "</thead>", "<tbody>"]
    for row in rows:
        parts.append("<tr>")
        parts += [f"<td>{inline(c)}</td>" for c in row]
        parts.append("</tr>")
    parts += ["</tbody>", "</table>"]
    out.append("\n".join(parts))
    return index


def _list_item_indent(line: str) -> int | None:
    match = _UL_RE.match(line) or _OL_RE.match(line)
    return len(match.group(1)) if match else None


def _emit_list(lines: list[str], index: int, out: list[str]) -> int:
    block: list[str] = []
    while index < len(lines):
        line = lines[index]
        if _list_item_indent(line) is not None or line.startswith((" ", "\t")):
            block.append(line)
            index += 1
            continue
        if not line.strip() and index + 1 < len(lines) and (
            _list_item_indent(lines[index + 1]) is not None
            or lines[index + 1].startswith((" ", "\t"))
        ):
            block.append(line)
            index += 1
            continue
        break
    out.append(_render_list(block, base_indent=_list_item_indent(block[0]) or 0))
    return index


def _render_list(block: list[str], base_indent: int) -> str:
    ordered = _OL_RE.match(block[0]) is not None
    tag = "ol" if ordered else "ul"
    start = ""
    if ordered:
        first = int(_OL_RE.match(block[0]).group(2))
        if first != 1:
            start = f' start="{first}"'

    items: list[list[str]] = []
    for line in block:
        indent = _list_item_indent(line)
        if indent is not None and indent <= base_indent:
            match = _UL_RE.match(line) or _OL_RE.match(line)
            items.append([match.group(match.lastindex)])
        elif items:
            items[-1].append(line[base_indent + 2 :] if len(line) > base_indent else "")
    parts = [f"<{tag}{start}>"]
    for item in items:
        head = inline(item[0])
        rest = "\n".join(item[1:]).strip("\n")
        inner = convert_minimal(rest) if rest.strip() else ""
        parts.append(f"<li>{head}{chr(10) + inner if inner else ''}</li>")
    parts.append(f"</{tag}>")
    return "\n".join(parts)


def _emit_paragraph(lines: list[str], index: int, out: list[str]) -> int:
    buffer: list[str] = []
    while index < len(lines) and lines[index].strip():
        line = lines[index]
        if (
            _HEADING_RE.match(line)
            or _HR_RE.match(line)
            or _FENCE_RE.match(line)
            or line.lstrip().startswith(">")
            or _UL_RE.match(line)
            or _OL_RE.match(line)
        ):
            break
        buffer.append(line.strip())
        index += 1
    if buffer:
        joined = "<br />\n".join(inline(line) for line in buffer)
        out.append(f"<p>{joined}</p>")
    return index


_CODE_TOKEN = "\x00CODE{}\x00"


def inline(text: str) -> str:
    """인라인 마크다운(코드/굵게/기울임)을 변환한다."""
    codes: list[str] = []

    def stash(match: re.Match[str]) -> str:
        codes.append(match.group(1))
        return _CODE_TOKEN.format(len(codes) - 1)

    text = re.sub(r"`([^`]+)`", stash, text)
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*\s][^*]*)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    for i, code in enumerate(codes):
        text = text.replace(_CODE_TOKEN.format(i), f"<code>{html.escape(code)}</code>")
    return text
