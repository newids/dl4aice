"""_workspace 소스 파일 읽기 — frontmatter, HTML 주석, 플레이스홀더 분해."""

from __future__ import annotations

import re

FENCE_RE = re.compile(r"^\s*(```|~~~)")
DIAGRAM_RE = re.compile(r"<!--\s*DIAGRAM:\s*(.*?)-->", re.S)
EXAM_RE = re.compile(r"<!--\s*EXAM:\s*(\S+?)\s*-->")
SOLUTION_HEADING = "## 해답 및 해설"


def read(path) -> str:
    return path.read_text(encoding="utf-8")


def split_frontmatter(text: str) -> tuple[dict, str]:
    """`---` frontmatter를 (메타, 본문)으로 분리한다(최소 YAML)."""
    match = re.match(r"(?s)^---\n(.*?)\n---\n?", text)
    if not match:
        return {}, text
    meta: dict[str, object] = {}
    key = None
    for line in match.group(1).split("\n"):
        item = re.match(r"^\s+-\s+(.*)$", line)
        if item and key:
            meta.setdefault(key, [])
            if isinstance(meta[key], list):
                meta[key].append(item.group(1).strip())
            continue
        pair = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if pair:
            key = pair.group(1)
            value = pair.group(2).strip().strip('"')
            meta[key] = value if value else []
    return meta, text[match.end() :]


def strip_comments(text: str) -> str:
    """코드 펜스 밖의 HTML 주석을 제거한다(verified 스탬프 등)."""
    out: list[str] = []
    in_fence = False
    in_comment = False
    for line in text.split("\n"):
        if FENCE_RE.match(line) and not in_comment:
            in_fence = not in_fence
            out.append(line)
            continue
        if in_fence:
            out.append(line)
            continue
        if in_comment:
            if "-->" in line:
                in_comment = False
                rest = line.split("-->", 1)[1]
                if rest.strip():
                    out.append(rest)
            continue
        stripped = re.sub(r"<!--.*?-->", "", line, flags=re.S)
        if "<!--" in stripped:
            in_comment = True
            head = stripped.split("<!--", 1)[0]
            if head.strip():
                out.append(head)
            continue
        if stripped.strip() or not line.strip():
            out.append(stripped)
    return "\n".join(out)


def split_blocks(text: str) -> list[tuple[str, object]]:
    """본문을 ('md', 텍스트) / ('diagram', (id, 캡션)) / ('exam', 챕터키) 로 분해한다.

    코드 펜스 안의 주석은 건드리지 않는다. 주석 제거는 호출 측에서 md 조각에만 적용한다.
    """
    blocks: list[tuple[str, object]] = []
    buffer: list[str] = []
    in_fence = False

    def flush() -> None:
        chunk = "\n".join(buffer).strip("\n")
        if chunk.strip():
            blocks.append(("md", chunk))
        buffer.clear()

    for line in text.split("\n"):
        if FENCE_RE.match(line):
            in_fence = not in_fence
            buffer.append(line)
            continue
        if not in_fence:
            diagram = DIAGRAM_RE.fullmatch(line.strip())
            if diagram:
                fields = [f.strip() for f in diagram.group(1).split("|")]
                flush()
                blocks.append(("diagram", (fields[0], fields[1] if len(fields) > 1 else "")))
                continue
            exam = EXAM_RE.fullmatch(line.strip())
            if exam:
                flush()
                blocks.append(("exam", exam.group(1)))
                continue
        buffer.append(line)
    flush()
    return blocks


def split_solution(text: str) -> tuple[str, str]:
    """`## 해답 및 해설` 앞뒤로 (문제, 해설)을 나눈다."""
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if line.strip() == SOLUTION_HEADING:
            return "\n".join(lines[:i]), "\n".join(lines[i + 1 :])
    return text, ""
