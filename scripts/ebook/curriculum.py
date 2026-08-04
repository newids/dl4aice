"""01_curriculum.md에서 교재 정보와 목차 순서를 읽는다(목차의 단일 기준)."""

from __future__ import annotations

import re

_META_KEYS = ("제목", "부제", "콘셉트 한 줄", "대상 독자", "총 규모")


def parse_book_meta(text: str) -> dict[str, str]:
    """§1 교재 정보의 굵은 라벨 항목을 뽑는다."""
    meta: dict[str, str] = {}
    for match in re.finditer(r"^-\s+\*\*(.+?):\*\*\s*(.+)$", text, re.M):
        label, value = match.group(1).strip(), match.group(2).strip()
        if label in _META_KEYS:
            meta[label] = value
    return meta


def parse_toc(text: str) -> list[dict[str, str]]:
    """§2 전체 목차 표를 순서대로 읽는다.

    반환 항목: part / key(ch01·mock01) / kind(chapter·mock) / title / prereq / role
    """
    rows: list[dict[str, str]] = []
    header_seen = False
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped.startswith("|"):
            if header_seen and rows:
                break
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if len(cells) != 5:
            continue
        if cells[0] == "Part":
            header_seen = True
            continue
        if not header_seen or set(cells[0]) <= set("-: "):
            continue
        part, chapter, title, prereq, role = cells
        num = re.match(r"^(\d{2})$", chapter)
        mock = re.match(r"^모의\s*(\d)$", chapter)
        if num:
            rows.append(
                {
                    "part": part,
                    "key": f"ch{num.group(1)}",
                    "kind": "chapter",
                    "number": num.group(1),
                    "title": title,
                    "prereq": prereq,
                    "role": role,
                }
            )
        elif mock:
            rows.append(
                {
                    "part": part,
                    "key": f"mock0{mock.group(1)}",
                    "kind": "mock",
                    "number": mock.group(1),
                    "title": title,
                    "prereq": prereq,
                    "role": role,
                }
            )
    return rows
