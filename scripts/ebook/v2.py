"""v2 인터랙티브 계층 — 정적 자산 배포와 위젯 마운트 HTML.

정본 소스는 리포 루트의 assets/ 이다.
  assets/js/*.js            위젯 모듈 (그대로 복사)
  assets/css/_parts/*.css   위젯 스타일 조각 → assets/css/v2-widgets.css 하나로 합침
  assets/data/*.json        학습 데이터 → 같은 이름의 .js 래퍼도 생성(file:// 열람 지원)

빌드는 이 자산을 book/assets/ 로 내보내고, 각 페이지에 필요한 스크립트 태그와
위젯 마운트 요소만 심는다. 무거운 런타임·번들러는 쓰지 않는다.
"""

from __future__ import annotations

import html
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
ASSETS = ROOT / "assets"
PAGES = ROOT / "_workspace" / "pages"

CSS_HREF = "assets/css/v2-widgets.css"
DATA_NAMES = ("arch_patterns", "chapter_drills", "mock_exams_14q", "openbook_refs")

# 페이지 로드 전에 테마를 적용해 다크 모드 깜빡임을 막는다.
THEME_BOOT = (
    "<script>try{if(JSON.parse(localStorage.getItem('dl4aice.v2.theme'))==='dark')"
    "document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>"
)

NOTICE = "본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다. 기출 원문이 아닙니다."


# ---------------------------------------------------------------- 데이터
def load_data(name: str) -> dict:
    path = ASSETS / "data" / f"{name}.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def drill_ids_by_chapter() -> dict[int, list[str]]:
    out: dict[int, list[str]] = {}
    for item in load_data("chapter_drills").get("items", []):
        out.setdefault(int(item["chapter"]), []).append(item["question_id"])
    return out


def mock_exams() -> dict[str, dict]:
    return {exam["id"]: exam for exam in load_data("mock_exams_14q").get("exams", [])}


# ---------------------------------------------------------------- 자산 배포
def build_widget_css() -> Path:
    """_parts/*.css 를 파일명 순서로 이어 붙여 v2-widgets.css 를 만든다."""
    parts = sorted((ASSETS / "css" / "_parts").glob("*.css"))
    chunks = []
    for i, part in enumerate(parts):
        text = part.read_text(encoding="utf-8").strip()
        if i:
            text = text.replace('@charset "utf-8";', "").strip()
        chunks.append(text)
    target = ASSETS / "css" / "v2-widgets.css"
    target.write_text("\n\n".join(chunks) + "\n", encoding="utf-8")
    return target


def publish_assets(book: Path) -> list[str]:
    """assets/ → book/assets/ (JS 복사, CSS 합본, JSON + JS 래퍼)."""
    written: list[str] = []
    out = book / "assets"
    if out.exists():
        shutil.rmtree(out)
    for sub in ("js", "css", "data"):
        (out / sub).mkdir(parents=True, exist_ok=True)

    for src in sorted((ASSETS / "js").glob("*.js")):
        shutil.copyfile(src, out / "js" / src.name)
        written.append(f"assets/js/{src.name}")

    css = build_widget_css()
    shutil.copyfile(css, out / "css" / css.name)
    written.append(f"assets/css/{css.name}")

    for src in sorted((ASSETS / "data").glob("*.json")):
        data = json.loads(src.read_text(encoding="utf-8"))
        shutil.copyfile(src, out / "data" / src.name)
        compact = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        wrapper = (
            "window.DL4AICE_DATA=window.DL4AICE_DATA||{};"
            f"window.DL4AICE_DATA[{json.dumps(src.stem)}]={compact};\n"
        )
        (out / "data" / f"{src.stem}.js").write_text(wrapper, encoding="utf-8")
        written += [f"assets/data/{src.name}", f"assets/data/{src.stem}.js"]
    return written


def mirror(book: Path, docs: Path) -> None:
    """book/ 을 docs/(GitHub Pages)로 그대로 반영한다. .nojekyll 은 유지."""
    docs.mkdir(parents=True, exist_ok=True)
    for path in docs.iterdir():
        if path.name == ".nojekyll":
            continue
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()
    for path in book.iterdir():
        target = docs / path.name
        if path.is_dir():
            shutil.copytree(path, target)
        else:
            shutil.copyfile(path, target)
    (docs / ".nojekyll").touch()


# ---------------------------------------------------------------- 스크립트 태그
def head_extra() -> str:
    return f'<link rel="stylesheet" href="{CSS_HREF}" />\n{THEME_BOOT}'


def scripts(kind: str, *, arch: bool = False) -> str:
    """페이지 종류별 defer 스크립트 묶음. kind: chapter | mock | index | appendix | plain"""
    data: list[str] = ["openbook_refs"]
    modules: list[str] = ["dl4aice-core", "motion", "code-blocks"]
    if kind == "chapter":
        data.append("chapter_drills")
        if arch:
            data.append("arch_patterns")
        modules += ["grader-core", "code-grader"]
        if arch:
            modules.append("arch-switcher")
    elif kind == "mock":
        data.append("mock_exams_14q")
        modules += ["grader-core", "code-grader", "cbt-engine"]
    elif kind == "appendix":
        data.append("appendix_units")
        modules += ["grader-core", "code-grader", "appendix"]
    elif kind == "index":
        modules.append("dashboard")
    modules.append("openbook-modal")
    tags = [f'<script defer src="assets/data/{name}.js"></script>' for name in data]
    tags += [f'<script defer src="assets/js/{name}.js"></script>' for name in modules]
    return "\n".join(tags)


def _noscript(text: str) -> str:
    return f'<noscript><p class="v2-noscript">{html.escape(text)}</p></noscript>'


# ---------------------------------------------------------------- 위젯 마운트
def arch_widget(fields: list[str]) -> str:
    """`<!-- WIDGET: arch | type=binary | api=sequential | focus=output,loss -->`"""
    opts = dict(f.split("=", 1) for f in fields if "=" in f)
    attrs = [
        f'data-default-type="{html.escape(opts.get("type", "binary"))}"',
        f'data-default-api="{html.escape(opts.get("api", "sequential"))}"',
    ]
    if opts.get("focus"):
        attrs.append(f'data-focus="{html.escape(opts["focus"])}"')
    return (
        f'<div class="v2-arch" data-v2-arch {" ".join(attrs)}></div>\n'
        + _noscript("문제 유형·API 비교 위젯은 자바스크립트를 켜야 보입니다. 같은 내용은 Ch08의 템플릿 A·B·C에 정리되어 있습니다.")
    )


def widget(kind: str, fields: list[str]) -> str:
    if kind == "arch":
        return arch_widget(fields)
    return f'<div class="diagram__missing" role="alert"><strong>위젯 누락</strong><span>{html.escape(kind)}</span></div>'


def drills_section(chapter_key: str, count: int) -> tuple[str, str, str]:
    """(HTML, 앵커 id, 목차 표기) — 챕터 실습 셀 마운트."""
    number = int(chapter_key[2:])
    anchor = f"drills-{chapter_key}"
    title = "실습 셀 — 코드 빈칸 채우기"
    block = (
        f'<section class="v2-drills" id="{anchor}" data-v2-drills data-chapter="{number}" '
        f'aria-label="{chapter_key.capitalize()} {title}"></section>\n'
        + _noscript(f"실습 셀 {count}문항은 자바스크립트를 켜야 풀 수 있습니다. 아래 지면판 확인 문제는 그대로 볼 수 있습니다.")
    )
    return block, anchor, title


def legacy_block(inner: str, summary: str) -> str:
    """v1 지면판 문제·해설을 접어서 보존한다."""
    return (
        '<details class="v2-legacy">'
        f"<summary>{html.escape(summary)}</summary>"
        f'<div class="v2-legacy__body">{inner}</div>'
        "</details>"
    )


def cbt_block(exam: dict) -> str:
    title = html.escape(exam["title"])
    return (
        f"<h1>{title}</h1>\n"
        f'<blockquote class="callout callout--note"><p><strong>{html.escape(NOTICE)}</strong> '
        "문항 수·배점·합격 기준(14문항·100점·80점)은 교재 자체 기준이며 실제 시험 정책은 회차별로 달라질 수 있습니다. "
        "응시 전 KT AICE 공식 공지를 확인하십시오.</p></blockquote>\n"
        f'<div class="v2-cbt" data-v2-cbt data-mock="{html.escape(exam["id"])}"></div>\n'
        + _noscript("CBT 모의고사는 자바스크립트를 켜야 풀 수 있습니다.")
    )


# ---------------------------------------------------------------- 표지 대시보드
def dashboard(rows: list[dict], infos: dict) -> str:
    drills = drill_ids_by_chapter()
    exams = mock_exams()
    payload = {
        "pass_score": load_data("mock_exams_14q").get("pass_score", 80),
        "chapters": [
            {
                "key": row["key"],
                "label": f'Ch{row["number"]}',
                "title": infos.get(row["key"], {}).get("title", row["title"]),
                "href": f'{row["key"]}.html#drills-{row["key"]}',
                "ids": drills.get(int(row["number"]), []),
            }
            for row in rows
            if row["kind"] == "chapter"
        ],
        "mocks": [
            {
                "id": row["key"],
                "label": f'모의고사 {row["number"]}회',
                "title": exams.get(row["key"], {}).get("title", row["title"]),
                "href": f'{row["key"]}.html',
            }
            for row in rows
            if row["kind"] == "mock"
        ],
    }
    blob = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return f"""<section class="v2-dashboard" data-v2-dashboard aria-labelledby="dash-title">
<h2 class="section-title" id="dash-title">내 학습 현황</h2>
<div class="v2-dashboard__body" data-v2-dashboard-body>
<p class="v2-dashboard__empty">실습 셀과 모의고사를 풀면 이 브라우저에 진도가 저장되어 여기에 표시됩니다.</p>
</div>
<script type="application/json" data-v2-dashboard-data>{blob}</script>
</section>"""


def tools_section(drill_total: int) -> str:
    """표지의 v2 도구 진입 카드."""
    cards = [
        ("cheatsheet.html", "시험장 직전 10분 치트시트",
         "유형별 출력층·손실·지표 비교표, 빈출 에러 5선, 문항별 변수명·임포트 요약을 한 장에."),
        ("appendix.html", "부록 — 외워야 하는 코드 3단 분해",
         "임포트부터 새 입력 예측까지 아홉 묶음을 흐름·줄·값 세 단계로 나눠 외웁니다."),
        ("mock01.html", "CBT 실전 모의고사 3회분",
         "14문항·90분 타이머·자동 저장·즉시 채점. 1회 이진분류, 2회 다중분류, 3회 회귀."),
        ("ch08.html#drills-ch08", f"챕터 실습 셀 {drill_total}문항",
         "주피터 셀처럼 빈칸을 채우고 Shift+Enter 로 채점합니다. 변수명과 핵심 인자를 엄격히 확인합니다."),
    ]
    items = "".join(
        f'<li class="v2-tool"><a class="v2-tool__link" href="{href}">'
        f'<span class="v2-tool__title">{html.escape(title)}</span>'
        f'<span class="v2-tool__desc">{html.escape(desc)}</span></a></li>'
        for href, title, desc in cards
    )
    return f"""<section class="v2-tools" aria-labelledby="tools-title">
<h2 class="section-title" id="tools-title">실전 도구</h2>
<ul class="v2-tools__list">{items}
<li class="v2-tool"><button class="v2-tool__link" type="button" data-v2-openbook>
<span class="v2-tool__title">오픈북 30초 검색</span>
<span class="v2-tool__desc">시험장에서 허용되는 공식 문서 찾기를 연습합니다. 어느 페이지에서나 Ctrl+K (Mac ⌘K).</span></button></li>
</ul>
</section>"""


# ---------------------------------------------------------------- 부속 페이지
# (키, 머리표, 제목, 스크립트 종류, 목차에 적을 한 줄 설명) — 목차의 "부록" 묶음에 이 순서로 실린다
EXTRA_PAGES = (
    ("appendix", "부록 A", "부록 — 외워야 하는 코드 3단 분해", "appendix",
     "임포트부터 새 입력 예측까지 아홉 묶음을 흐름·줄·값으로 나눠 외우고, 가리기와 직접 써 보기로 확인합니다."),
    ("cheatsheet", "부록 B", "시험장 직전 10분 치트시트", "plain",
     "유형별 출력층·손실·지표 비교표, 자주 만나는 에러 다섯 가지, 문항별 변수명과 임포트 요약입니다."),
)


def page_fragment(key: str) -> str | None:
    path = PAGES / f"{key}.html"
    return path.read_text(encoding="utf-8") if path.exists() else None
