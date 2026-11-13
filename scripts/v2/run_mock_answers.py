#!/usr/bin/env python3
"""모의고사 모범 답안 파이프라인 실행 검증.

데이터 생성 코드(dataset.setup_code)와 Q1~Q14 answer_code 를 순서대로 이어 붙여
임시 디렉터리에서 실제로 실행한다. 딥러닝 학습은 epochs 를 줄여 빠르게 돈다
(`--full` 이면 지문의 원래 epochs 그대로).

사용법:
    python3 scripts/v2/run_mock_answers.py [json 파일] [examId ...] [--full] [--keep]
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT = ROOT / "assets" / "data" / "mock_exams_14q.json"

PREAMBLE = """import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("MPLBACKEND", "Agg")
import tensorflow as tf
import matplotlib
matplotlib.use("Agg")
"""


def build_script(exam: dict, full: bool) -> str:
    parts = [PREAMBLE, "# ---- setup_code ----", exam["dataset"]["setup_code"]]
    for q in exam["questions"]:
        parts.append(f'\nprint("\\n##### Q{q["no"]} #####")')
        parts.append(q["answer_code"])
    script = "\n".join(parts)
    if not full:
        script = re.sub(r"epochs\s*=\s*\d+", "epochs=3", script)
    return script


def run_exam(exam: dict, full: bool, keep: bool) -> bool:
    script = build_script(exam, full)
    with tempfile.TemporaryDirectory(prefix=f'{exam["id"]}_') as tmp:
        path = Path(tmp) / "pipeline.py"
        path.write_text(script, encoding="utf-8")
        proc = subprocess.run(
            [sys.executable, str(path)], cwd=tmp, capture_output=True, text=True, timeout=1800
        )
        if keep:
            out = ROOT / "_workspace" / "qa" / f'v2_{exam["id"]}_run.log'
            out.write_text(proc.stdout + "\n--- stderr ---\n" + proc.stderr[-4000:], encoding="utf-8")
    ok = proc.returncode == 0
    reached = re.findall(r"##### Q(\d+) #####", proc.stdout)
    print(f'{"PASS" if ok else "FAIL"} {exam["id"]} — 실행 도달 문항: Q{reached[-1] if reached else 0}/14')
    if not ok:
        print(proc.stdout[-1500:])
        print(proc.stderr[-2500:])
    elif os.environ.get("V2_SHOW_OUTPUT"):
        print(proc.stdout)
    return ok


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    full = "--full" in sys.argv
    keep = "--keep" in sys.argv
    file = Path(args[0]) if args and args[0].endswith(".json") else DEFAULT
    wanted = set(a for a in args if not a.endswith(".json"))
    data = json.loads(file.read_text(encoding="utf-8"))
    exams = data["exams"] if "exams" in data else [data]
    failures = 0
    for exam in exams:
        if wanted and exam["id"] not in wanted:
            continue
        if not run_exam(exam, full, keep):
            failures += 1
    print(f'\n모의고사 답안 실행 검증: {"ALL PASS" if failures == 0 else f"{failures}건 실패"}')
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
