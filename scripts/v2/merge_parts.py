#!/usr/bin/env python3
"""assets/data/_parts/ 의 조각 JSON 을 최종 데이터 파일로 합친다.

  drills_*.json ({"items": [...]})  → assets/data/chapter_drills.json
  mock0N.json   (시험 객체 1개)      → assets/data/mock_exams_14q.json

조각이 없으면 해당 파일은 건드리지 않는다. 합친 뒤에는 `node scripts/v2/test_grader.js` 로 검증한다.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "assets" / "data"
PARTS = DATA / "_parts"

MOCK_ENVELOPE = {
    "version": "2.0",
    "pass_score": 80,
    "time_limit_min": 90,
    "parts": [
        {"id": "preprocess", "label": "탐색·전처리", "questions": [1, 2, 3, 4, 5, 6, 7]},
        {"id": "ml", "label": "머신러닝", "questions": [8, 9, 10]},
        {"id": "dl_model", "label": "딥러닝 모델링 (유형 13)", "questions": [11, 12, 13]},
        {"id": "dl_infer", "label": "딥러닝 추론 (유형 14)", "questions": [14]},
    ],
}


def dump(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    drills = sorted(PARTS.glob("drills_*.json"))
    if drills:
        items: list[dict] = []
        for part in drills:
            items += json.loads(part.read_text(encoding="utf-8"))["items"]
        items.sort(key=lambda it: (int(it["chapter"]), int(it["question_id"].split("-q")[1])))
        dump(DATA / "chapter_drills.json", {"version": "2.0", "items": items})
        print(f"chapter_drills.json ← {len(drills)}개 조각, {len(items)}문항")

    mocks = sorted(PARTS.glob("mock0*.json"))
    if mocks:
        exams = [json.loads(part.read_text(encoding="utf-8")) for part in mocks]
        dump(DATA / "mock_exams_14q.json", {**MOCK_ENVELOPE, "exams": exams})
        print(f"mock_exams_14q.json ← {[e['id'] for e in exams]}")


if __name__ == "__main__":
    main()
