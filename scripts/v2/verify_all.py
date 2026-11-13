#!/usr/bin/env python3
"""dl4aice v2 — 자체 검증 게이트 (WORK_ORDER Stage 5).

한 번에 돌리는 검증 묶음. 모든 단계가 통과해야 종료 코드 0.

  1) JSON 파싱 / JS 문법           assets/data/*.json, assets/js/*.js, scripts/v2/*.js
  2) 채점기 단위 테스트            node scripts/v2/test_grader.js
  3) 빌드 + 링크·스크립트 무결성   python3 scripts/build_ebook.py  (book/ → docs/ 동기화 포함)
  4) 기존 자산 보존                python3 scripts/v2/baseline_inventory.py --check book|docs
  5) 브라우저 통합 검증            node scripts/v2/e2e_browser.js     (--no-browser 로 생략)
  6) 모의고사 답안 실제 실행       python3 scripts/v2/run_mock_answers.py   (--with-python 일 때만; 수 분 소요)

사용법: python3 scripts/v2/verify_all.py [--no-browser] [--with-python]
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent


def run(label: str, cmd: list[str]) -> bool:
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    ok = proc.returncode == 0
    tail = [line for line in (proc.stdout + proc.stderr).strip().splitlines() if line.strip()]
    print(f'[{"PASS" if ok else "FAIL"}] {label}')
    for line in tail[-(4 if ok else 25):]:
        print(f"       {line}")
    return ok


def check_syntax() -> bool:
    ok = True
    files = sorted((ROOT / "assets" / "data").glob("*.json"))
    for path in files:
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except ValueError as exc:
            ok = False
            print(f"       JSON 오류 {path.relative_to(ROOT)}: {exc}")
    scripts = sorted((ROOT / "assets" / "js").glob("*.js")) + sorted((ROOT / "scripts" / "v2").glob("*.js"))
    for path in scripts:
        proc = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
        if proc.returncode != 0:
            ok = False
            print(f"       JS 문법 오류 {path.relative_to(ROOT)}: {proc.stderr.strip().splitlines()[0]}")
    print(f'[{"PASS" if ok else "FAIL"}] JSON 파싱 {len(files)}개 / JS 문법 {len(scripts)}개')
    return ok


def main() -> int:
    results = [check_syntax()]
    results.append(run("채점기 단위 테스트 (모범 답안·변형·오답)", ["node", "scripts/v2/test_grader.js"]))
    results.append(run("부록 연습 채점 규칙", [sys.executable, "scripts/v2/appendix_memorize.py", "--verify-rules"]))
    results.append(run("금지 장식 검사 (한쪽 가장자리 색 띠)", [sys.executable, "scripts/v2/check_no_edge_stripes.py"]))
    results.append(run("빌드 + 내부 링크·스크립트·도해·목차 검증", [sys.executable, "scripts/build_ebook.py"]))
    for target in ("book", "docs"):
        results.append(
            run(f"기존 자산 보존 ({target}/)", [sys.executable, "scripts/v2/baseline_inventory.py", "--check", target])
        )
    if "--no-browser" not in sys.argv:
        results.append(run("브라우저 통합 검증 (전 페이지·실습 셀·CBT·오픈북)", ["node", "scripts/v2/e2e_browser.js"]))
    if "--with-python" in sys.argv:
        results.append(run("모의고사 답안 파이프라인 실제 실행", [sys.executable, "scripts/v2/run_mock_answers.py"]))
        results.append(run("부록 코드 실제 실행", [sys.executable, "scripts/v2/appendix_memorize.py", "--verify"]))
    failed = results.count(False)
    print(f'\n자체 검증 게이트: {"ALL PASS" if not failed else f"{failed}개 단계 실패"} ({len(results)}단계)')
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
