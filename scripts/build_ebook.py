#!/usr/bin/env python3
"""『AICE Associate 딥러닝 실전 교본』 HTML e-book 빌더.

_workspace/ 의 챕터·도해·문제를 book/ 의 오프라인 열람용 HTML로 조립한다.
재실행 가능(idempotent)하며, `--only ch03,mock01` 로 일부 페이지만 갱신할 수 있다.

사용법:
    python3 scripts/build_ebook.py [--only ch03,ch04] [--quiet]
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from ebook import assemble, curriculum, indexpage, mdconv, sources, v2, verify  # noqa: E402

WORKSPACE = ROOT / "_workspace"
DIAGRAMS = WORKSPACE / "diagrams"
CHAPTERS = WORKSPACE / "chapters"
EXAMS = WORKSPACE / "exams"
BOOK = ROOT / "book"
DOCS = ROOT / "docs"
EXTRA_PAGES = ("cheatsheet.html", "appendix.html")
ASSETS = ROOT / "scripts" / "assets"


def load_sources() -> dict:
    text = (WORKSPACE / "01_curriculum.md").read_text(encoding="utf-8")
    rows = curriculum.parse_toc(text)
    meta = curriculum.parse_book_meta(text)
    svgs = {p.stem: p.read_text(encoding="utf-8") for p in sorted(DIAGRAMS.glob("*.svg"))}
    return {"rows": rows, "meta": meta, "svgs": svgs, "book_title": meta.get("제목", "").strip("『』")}


def _nav_items(rows: list[dict], infos: dict) -> dict:
    order = [{"href": "index.html", "label": "표지", "title": "전체 목차"}]
    for row in rows:
        label = f'Ch{row["number"]}' if row["kind"] == "chapter" else f'모의고사 {row["number"]}회'
        order.append(
            {
                "href": f'{row["key"]}.html',
                "label": label,
                "title": infos.get(row["key"], {}).get("title", row["title"]),
            }
        )
    keys = [row["key"] for row in rows]
    for key, eyebrow, title, _, _ in v2.EXTRA_PAGES:
        if v2.page_fragment(key):
            order.append({"href": f"{key}.html", "label": eyebrow, "title": title})
            keys.append(key)
    nav = {}
    for i, key in enumerate(keys, start=1):
        nav[key] = (order[i - 1], order[i + 1] if i + 1 < len(order) else None)
    return nav


def collect_infos(rows: list[dict]) -> dict:
    """페이지별 frontmatter와 목차 카드용 수치."""
    infos: dict[str, dict] = {}
    drills = v2.drill_ids_by_chapter()
    exams = v2.mock_exams()
    for row in rows:
        if row["kind"] == "chapter":
            meta, body = sources.split_frontmatter((CHAPTERS / f'{row["key"]}.md').read_text(encoding="utf-8"))
            quiz_meta, quiz_body = sources.split_frontmatter(
                (EXAMS / f'{row["key"]}_quiz.md').read_text(encoding="utf-8")
            )
            diagrams = sum(1 for k, _ in sources.split_blocks(body) if k == "diagram")
            infos[row["key"]] = {
                "title": meta.get("title", row["title"]),
                "objectives": meta.get("objectives", []),
                "meta": meta,
                "body": body,
                "quiz": quiz_body,
                "facts": [f"도해 {diagrams}개", f'확인 문제 {quiz_meta.get("items", "?")}문항'],
                "drills": len(drills.get(int(row["number"]), [])),
            }
            if infos[row["key"]]["drills"]:
                infos[row["key"]]["facts"].append(f'실습 셀 {infos[row["key"]]["drills"]}문항')
        else:
            legacy = EXAMS / f'mock_exam_{row["number"]}.md'
            meta, body = (
                sources.split_frontmatter(legacy.read_text(encoding="utf-8")) if legacy.exists() else ({}, "")
            )
            exam = exams.get(row["key"])
            if exam:
                # v2: 14문항 CBT. 배점·시간은 데이터에서 읽는다.
                points = sum(q.get("points", 0) for q in exam["questions"])
                facts = [f'{len(exam["questions"])}문항', f"{points}점", "90분", "CBT 즉시 채점"]
            else:
                facts = [f'{meta.get("items", "?")}문항', f'{meta.get("points", "?")}점', f'{meta.get("minutes", "?")}분']
                if meta.get("extra_items"):
                    facts.append(f'확장 {meta["extra_items"]}문항')
            infos[row["key"]] = {
                "title": (exam or {}).get("title") or meta.get("title", row["title"]),
                "meta": meta,
                "body": body,
                "facts": facts,
                "exam": exam,
            }
    return infos


def build(only: set[str] | None = None) -> dict:
    data = load_sources()
    rows, svgs, book_title = data["rows"], data["svgs"], data["book_title"]
    infos = collect_infos(rows)
    nav = _nav_items(rows, infos)
    BOOK.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ASSETS / "style.css", BOOK / "style.css")

    written: list[str] = []
    assets = v2.publish_assets(BOOK)
    for row in rows:
        key = row["key"]
        if only and key not in only:
            continue
        info = infos[key]
        if row["kind"] == "chapter":
            page, _ = assemble.chapter_page(
                row, info["meta"], info["body"], svgs, info["quiz"], nav[key], book_title,
                drill_count=info.get("drills", 0),
            )
        else:
            page, _ = assemble.mock_page(
                row, info["meta"], info["body"], nav[key], book_title, exam=info.get("exam")
            )
        (BOOK / f"{key}.html").write_text(page, encoding="utf-8")
        written.append(f"{key}.html")

    stats = _cover_stats(data["meta"], rows, infos)
    (BOOK / "index.html").write_text(
        indexpage.render(data["meta"], rows, infos, stats, book_title), encoding="utf-8"
    )
    written.append("index.html")
    written.append("style.css")

    # 목차 밖 부속 페이지: (키, 머리표, 제목) — 원고는 _workspace/pages/<키>.html 조각
    for key, eyebrow, title, kind, _ in v2.EXTRA_PAGES:
        fragment = v2.page_fragment(key)
        if fragment and (not only or key in only):
            (BOOK / f"{key}.html").write_text(
                assemble.extra_page(key, fragment, eyebrow, book_title, title, kind, nav.get(key)),
                encoding="utf-8",
            )
            written.append(f"{key}.html")
    return {"written": written, "rows": rows, "infos": infos, "assets": assets}


def _cover_stats(meta: dict, rows: list[dict], infos: dict) -> list[tuple[str, str]]:
    chapters = [r for r in rows if r["kind"] == "chapter"]
    parts = len({r["part"] for r in chapters})
    diagrams = len(list(DIAGRAMS.glob("*.svg")))
    quiz_items = sum(int(infos[r["key"]]["facts"][1].split()[-1].rstrip("문항")) for r in chapters)
    drill_items = sum(infos[r["key"]].get("drills", 0) for r in chapters)
    mocks = len(rows) - len(chapters)
    return [
        (f"{parts}", "Part"),
        (f"{len(chapters)}", "챕터"),
        (f"{diagrams}", "도해"),
        (f"{drill_items or quiz_items}", "실습 셀" if drill_items else "확인 문제"),
        (f"{mocks}", "모의고사"),
    ]


def run_verification(rows: list[dict]) -> int:
    ph = verify.check_placeholders(BOOK)
    links = verify.check_links(BOOK)
    diag = verify.check_diagrams(BOOK, DIAGRAMS)
    toc = verify.check_toc(BOOK, [r["key"] for r in rows], EXTRA_PAGES)
    missing = assemble.missing_diagrams()

    print("\n=== 자체 검증 ===")
    print(f"1) 잔존 플레이스홀더: {len(ph['placeholders'])}건 / 소스 주석 잔존: {len(ph['stray_comments'])}건")
    for item in (ph["placeholders"] + ph["stray_comments"])[:10]:
        print(f"   - {item}")
    print(f"2) 내부 링크: {links['checked']}건 검사 / 깨짐 {len(links['broken'])}건")
    for item in links["broken"][:10]:
        print(f"   - {item}")
    print(
        f"3) 도해 매칭: SVG {diag['available']}개 / 임베드 {diag['embedded']}개 / "
        f"고아 {len(diag['orphans'])}건 / 누락 {len(diag['missing']) + len(missing)}건"
    )
    for item in (diag["orphans"] + diag["missing"] + missing)[:10]:
        print(f"   - {item}")
    print(
        f"4) 목차↔페이지: 기대 {len(toc['expected'])}쪽 / 미링크 {len(toc['not_linked'])}건 / "
        f"링크만 존재 {len(toc['linked_but_absent'])}건 / 목차 밖 페이지 {len(toc['unlisted_pages'])}건"
    )
    for item in toc["not_linked"] + toc["linked_but_absent"] + toc["unlisted_pages"]:
        print(f"   - {item}")

    failures = (
        len(ph["placeholders"]) + len(ph["stray_comments"]) + len(links["broken"])
        + len(diag["orphans"]) + len(diag["missing"]) + len(missing)
        + len(toc["not_linked"]) + len(toc["linked_but_absent"]) + len(toc["unlisted_pages"])
    )
    print(f"\n검증 결과: {'ALL PASS' if failures == 0 else f'{failures}건 확인 필요'}")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description="AICE 교본 e-book 빌더")
    parser.add_argument("--only", help="갱신할 페이지 키 (예: ch03,mock01,cheatsheet,appendix)")
    parser.add_argument("--no-docs", action="store_true", help="docs/(GitHub Pages) 동기화를 건너뛴다")
    args = parser.parse_args()
    only = {k.strip() for k in args.only.split(",")} if args.only else None

    result = build(only)
    print(f"변환기: {mdconv.BACKEND}")
    print(f"생성: {', '.join(result['written'])}")
    print(f"v2 자산: {len(result['assets'])}개 파일 → book/assets/")
    failures = run_verification(result["rows"])
    if not args.no_docs:
        v2.mirror(BOOK, DOCS)
        print("docs/ 동기화 완료 (book/ 과 동일)")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
