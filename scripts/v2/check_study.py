#!/usr/bin/env python3
"""그룹 스터디 발표 자료(study/*.md) 형식 검사.

회차 자료 14개가 모두 있고, 정해진 구성(study/README.md "자료 형식")과 분량을 지키며,
도해 경로가 실제 파일을 가리키는지, 프로젝트 금지 규칙(광고 카피식 문구, 이모지)을 어기지 않는지 확인한다.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
STUDY = ROOT / "study"

SESSIONS = [
    "01-ch01", "02-ch02", "03-ch03", "04-ch04", "05-ch05", "06-ch06", "07-ch07", "08-ch08",
    "09-mock01", "10-mock02", "11-mock03", "12-mock04", "13-mock05", "14-mock06",
]
REQUIRED_HEADINGS = ["오늘의 목표", "진행 순서", "함께 풀기", "정리", "다음 회차 준비", "토론 질문", "예상 질문과 답"]
BANNED = ["곧 점수", "전부입니다", "로 익히고", "로 끝낸다", "정복", "마스터", "비법", "필살", "한 방에", "족집게"]
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿⭐⬆✅❌]")
IMAGE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)\)")
MINUTES = re.compile(r"(\d+)\s*분")


def split_slides(text: str) -> list[str]:
    body = re.sub(r"(?s)\A---\n.*?\n---\n", "", text, count=1)
    slides, current, in_fence = [], [], False
    for line in body.split("\n"):
        if line.strip().startswith("```"):
            in_fence = not in_fence
        if line.strip() == "---" and not in_fence:
            slides.append("\n".join(current))
            current = []
        else:
            current.append(line)
    slides.append("\n".join(current))
    return [s for s in slides if s.strip()]


def check(name: str) -> list[str]:
    path = STUDY / f"{name}.md"
    if not path.exists():
        return ["파일 없음"]
    text = path.read_text(encoding="utf-8")
    problems: list[str] = []
    if not re.match(r"\A---\nmarp: true\n", text):
        problems.append("첫 줄 프런트매터에 marp: true 가 없음")
    slides = split_slides(text)
    if not 18 <= len(slides) <= 30:
        problems.append(f"슬라이드 {len(slides)}장 (18~30장이어야 함)")
    headings = re.findall(r"^#{1,2}\s+(.+)$", text, re.M)
    for required in REQUIRED_HEADINGS:
        if not any(required in h for h in headings):
            problems.append(f'필수 슬라이드 제목 누락: "{required}"')
    for i, slide in enumerate(slides, start=1):
        lines = [l for l in slide.split("\n") if l.strip()]
        if not re.match(r"^#{1,2}\s+\S", lines[0]):
            problems.append(f"슬라이드 {i}: 제목(# 또는 ##)으로 시작하지 않음")
        if len(lines) > 34:
            problems.append(f"슬라이드 {i}: {len(lines)}줄 — 한 장에 담기에는 김(34줄 이하)")
    if text.count("```") % 2:
        problems.append("코드 펜스가 닫히지 않음")
    for target in IMAGE.findall(text):
        if target.startswith("http"):
            problems.append(f"외부 이미지 사용: {target}")
        elif not (path.parent / target).resolve().exists():
            problems.append(f"이미지 경로가 실제 파일을 가리키지 않음: {target}")
    for phrase in BANNED:
        if phrase in text:
            problems.append(f'금지 문구: "{phrase}"')
    if EMOJI.search(text):
        problems.append("이모지 사용")
    if "<!--" in text:
        problems.append("HTML 주석 사용 (GitHub 에서 보이지 않으므로 쓰지 않는다)")

    # 진행 순서 표의 발표 시간 합계가 30~40분인지
    plan = next((s for s in slides if re.search(r"^#{1,2}\s+.*진행 순서", s, re.M)), "")
    rows = [r for r in plan.split("\n") if r.strip().startswith("|") and "질의응답" not in r and "합계" not in r]
    total = sum(int(m.group(1)) for r in rows for m in [MINUTES.search(r)] if m)
    if not 30 <= total <= 40:
        problems.append(f"진행 순서의 발표 시간 합계 {total}분 (30~40분이어야 함)")
    if "질의응답" not in plan or "20분" not in plan:
        problems.append("진행 순서에 질의응답 20분이 없음")

    qa = next((s for s in slides if re.search(r"^#{1,2}\s+.*예상 질문과 답", s, re.M)), "")
    qa_all = "\n".join(s for s in slides if "예상 질문과 답" in s.split("\n")[0] or re.search(r"^#{1,2}\s+.*예상 질문과 답", s, re.M))
    if len(re.findall(r"^\*\*Q\d*\.", qa_all, re.M)) < 5:
        problems.append("예상 질문과 답이 5개 미만 (**Q1.** 형식)")
    if not qa:
        pass
    return problems


def main() -> int:
    failures = 0
    # 인자로 회차 이름을 주면(예: 12-mock04) 그 회차만 검사한다
    wanted = [a for a in sys.argv[1:] if a in SESSIONS]
    for name in wanted or SESSIONS:
        problems = check(name)
        if problems:
            failures += 1
            print(f"FAIL study/{name}.md")
            for p in problems:
                print(f"  - {p}")
    extra = sorted(p.name for p in STUDY.glob("*.md") if p.stem not in SESSIONS and p.name != "README.md")
    if extra and not wanted:
        failures += 1
        print(f"FAIL 목록에 없는 파일: {extra}")
    print(f'스터디 발표 자료 검사: {f"{len(wanted or SESSIONS)}/{len(wanted or SESSIONS)} 통과" if not failures else f"{failures}건 실패"}')
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
