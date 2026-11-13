#!/usr/bin/env python3
"""v2 baseline inventory for the built e-book pages.

Default mode: read book/*.html as committed in git HEAD (read-only
`git ls-tree` / `git show`) and write _workspace/qa/v2_baseline.json.

--check [DIR]: scan the *.html files on disk in DIR (default: book) and
compare them with the saved baseline. Figure ids (with identical svg sha256
and caption) and h2 ids must all survive. New items and pre/table decreases
are reported as informational only.

Standard library only.
"""

import argparse
import hashlib
import html
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BOOK_REL = "book/"
BASELINE_PATH = ROOT / "_workspace" / "qa" / "v2_baseline.json"

FIGURE_RE = re.compile(r"<figure\b([^>]*)>(.*?)</figure>", re.S | re.I)
FIGCAPTION_RE = re.compile(r"<figcaption\b[^>]*>(.*?)</figcaption>", re.S | re.I)
SVG_START_RE = re.compile(r"<svg\b[^>]*>", re.I)
H2_RE = re.compile(r"<h2\b([^>]*)>", re.I)
ID_ATTR_RE = re.compile(r"(?<![\w-])id\s*=\s*([\"'])(.*?)\1", re.I | re.S)
CLASS_ATTR_RE = re.compile(r"(?<![\w-])class\s*=\s*([\"'])(.*?)\1", re.I | re.S)
HREF_RE = re.compile(r"(?<![\w:-])href\s*=\s*(?:\"([^\"]*)\"|'([^']*)')", re.I)
PRE_RE = re.compile(r"<pre\b", re.I)
TABLE_RE = re.compile(r"<table\b", re.I)
TAG_RE = re.compile(r"<[^>]+>")
EXTERNAL_PREFIXES = ("http://", "https://", "mailto:")


def git_head_pages():
    """Return {basename: text} for every *.html under book/ in git HEAD."""
    listing = subprocess.run(
        ["git", "-C", str(ROOT), "ls-tree", "--name-only", "HEAD", BOOK_REL],
        capture_output=True, check=True,
    ).stdout.decode("utf-8").splitlines()
    pages = {}
    for path in listing:
        if not path.endswith(".html"):
            continue
        blob = subprocess.run(
            ["git", "-C", str(ROOT), "show", f"HEAD:{path}"],
            capture_output=True, check=True,
        ).stdout
        pages[Path(path).name] = blob.decode("utf-8")
    return pages


def disk_pages(directory):
    """Return {basename: text} for *.html files currently on disk."""
    pages = {}
    for path in sorted(directory.glob("*.html")):
        pages[path.name] = path.read_text(encoding="utf-8")
    return pages


def clean_caption(raw):
    text = TAG_RE.sub("", raw)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def attr(regex, attrs):
    m = regex.search(attrs)
    return m.group(2) if m else None


def analyze_figure(attrs, body):
    """Return (figure_record, odd_notes) for one <figure> element."""
    odd = []
    fig_id = attr(ID_ATTR_RE, attrs)
    classes = (attr(CLASS_ATTR_RE, attrs) or "").split()
    if "diagram" not in classes:
        odd.append("figure without class=\"diagram\"")

    caption_m = FIGCAPTION_RE.search(body)
    caption = clean_caption(caption_m.group(1)) if caption_m else ""
    if not caption_m:
        odd.append(f"figure {fig_id}: no figcaption")

    svg_sha = None
    svg_bytes = 0
    svg_count = len(SVG_START_RE.findall(body))
    if svg_count == 0:
        odd.append(f"figure {fig_id}: no svg")
    else:
        if svg_count > 1:
            odd.append(f"figure {fig_id}: {svg_count} svg elements")
        start_m = None
        for m in SVG_START_RE.finditer(body):
            if re.search(r"(?<![\w-])class\s*=\s*[\"']diagram__svg[\"']", m.group(0), re.I):
                start_m = m
                break
        if start_m is None:
            start_m = SVG_START_RE.search(body)
            odd.append(f"figure {fig_id}: svg without class=\"diagram__svg\"")
        end = body.find("</svg>", start_m.start())
        if end == -1:
            odd.append(f"figure {fig_id}: unclosed svg")
        else:
            svg = body[start_m.start(): end + len("</svg>")]
            if svg.count("<svg") > 1:
                odd.append(f"figure {fig_id}: nested svg")
            svg_sha = hashlib.sha256(svg.encode("utf-8")).hexdigest()
            svg_bytes = len(svg.encode("utf-8"))

    record = {
        "id": fig_id,
        "caption": caption,
        "svg_sha256": svg_sha,
        "svg_bytes": svg_bytes,
    }
    return record, odd


def analyze_page(text):
    odd = []
    figures = []
    for m in FIGURE_RE.finditer(text):
        record, notes = analyze_figure(m.group(1), m.group(2))
        figures.append(record)
        odd.extend(notes)

    h2_ids = []
    for m in H2_RE.finditer(text):
        h2_id = attr(ID_ATTR_RE, m.group(1))
        if h2_id is not None:
            h2_ids.append(h2_id)

    links = set()
    for m in HREF_RE.finditer(text):
        raw = m.group(1) if m.group(1) is not None else m.group(2)
        href = html.unescape(raw).strip()
        if href.lower().startswith(EXTERNAL_PREFIXES):
            continue
        links.add(href)

    return {
        "figures": figures,
        "h2_ids": h2_ids,
        "code_blocks": len(PRE_RE.findall(text)),
        "tables": len(TABLE_RE.findall(text)),
        "internal_links": sorted(links),
    }, odd


def build_inventory(pages):
    inventory = {"generated_from": "git HEAD book/", "pages": {}}
    odd_all = []
    for name in sorted(pages):
        analyzed, odd = analyze_page(pages[name])
        inventory["pages"][name] = analyzed
        odd_all.extend(f"{name}: {note}" for note in odd)

    all_ids = [f["id"] for p in inventory["pages"].values() for f in p["figures"]]
    inventory["totals"] = {
        "pages": len(inventory["pages"]),
        "figures": len(all_ids),
        "unique_figure_ids": len(set(all_ids)),
    }
    return inventory, odd_all


def duplicate_figure_ids(inventory):
    where = defaultdict(list)
    for name, page in inventory["pages"].items():
        for f in page["figures"]:
            where[f["id"]].append(name)
    return {fid: pages for fid, pages in where.items() if len(pages) > 1}


def write_baseline():
    pages = git_head_pages()
    inventory, odd = build_inventory(pages)
    BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    BASELINE_PATH.write_text(
        json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"baseline written: {BASELINE_PATH}")
    print(f"pages: {inventory['totals']['pages']}")
    for name, page in inventory["pages"].items():
        print(f"  {name}: figures={len(page['figures'])} "
              f"h2={len(page['h2_ids'])} pre={page['code_blocks']} "
              f"table={page['tables']} links={len(page['internal_links'])}")
    print(f"totals: figures={inventory['totals']['figures']} "
          f"unique_figure_ids={inventory['totals']['unique_figure_ids']}")
    dups = duplicate_figure_ids(inventory)
    print(f"duplicate figure ids: {len(dups)}")
    for fid, where in sorted(dups.items()):
        print(f"  {fid}: {', '.join(where)}")
    print(f"odd notes: {len(odd)}")
    for note in odd:
        print(f"  {note}")


def check_directory(directory):
    if not BASELINE_PATH.exists():
        print(f"baseline not found: {BASELINE_PATH} (run without flags first)")
        return 1
    baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    current, _ = build_inventory(disk_pages(directory))
    cur_pages = current["pages"]

    failures = []
    info = []

    # Figures: every baseline id must exist on the same page with identical
    # svg sha256 and caption. Duplicate ids are matched by occurrence order.
    fig_total = 0
    fig_ok = 0
    for name, bpage in baseline["pages"].items():
        cur_figs = cur_pages.get(name, {"figures": []})["figures"]
        cur_by_id = defaultdict(list)
        for f in cur_figs:
            cur_by_id[f["id"]].append(f)
        base_by_id = defaultdict(list)
        for f in bpage["figures"]:
            base_by_id[f["id"]].append(f)
        for fid, base_list in base_by_id.items():
            cur_list = cur_by_id.get(fid, [])
            for k, bf in enumerate(base_list):
                fig_total += 1
                if k >= len(cur_list):
                    where = "page missing" if name not in cur_pages else "id missing"
                    failures.append(f"도해 누락 [{name}] {fid} ({where})")
                    continue
                cf = cur_list[k]
                if cf["svg_sha256"] == bf["svg_sha256"] and cf["caption"] == bf["caption"]:
                    fig_ok += 1
                else:
                    reasons = []
                    if cf["svg_sha256"] != bf["svg_sha256"]:
                        reasons.append("svg changed")
                    if cf["caption"] != bf["caption"]:
                        reasons.append("caption changed")
                    failures.append(f"도해 변경 [{name}] {fid} ({', '.join(reasons)})")

    # h2 ids: every baseline id must still exist on its page.
    h2_total = 0
    h2_ok = 0
    for name, bpage in baseline["pages"].items():
        cur_h2 = set(cur_pages.get(name, {"h2_ids": []})["h2_ids"])
        for h2 in sorted(set(bpage["h2_ids"])):
            h2_total += 1
            if h2 in cur_h2:
                h2_ok += 1
            else:
                failures.append(f"h2 앵커 누락 [{name}] #{h2}")

    # Informational items.
    for name in sorted(set(cur_pages) - set(baseline["pages"])):
        info.append(f"[정보] 신규 페이지: {name}")
    for name, bpage in baseline["pages"].items():
        if name not in cur_pages:
            continue
        cpage = cur_pages[name]
        base_fig_ids = {f["id"] for f in bpage["figures"]}
        for f in cpage["figures"]:
            if f["id"] not in base_fig_ids:
                info.append(f"[정보] 신규 도해 [{name}] {f['id']}")
        base_h2 = set(bpage["h2_ids"])
        for h2 in sorted(set(cpage["h2_ids"]) - base_h2):
            info.append(f"[정보] 신규 h2 [{name}] #{h2}")
        for link in sorted(set(cpage["internal_links"]) - set(bpage["internal_links"])):
            info.append(f"[정보] 신규 링크 [{name}] {link}")
        for link in sorted(set(bpage["internal_links"]) - set(cpage["internal_links"])):
            info.append(f"[정보] 사라진 링크 [{name}] {link}")
        if cpage["code_blocks"] < bpage["code_blocks"]:
            info.append(f"[정보] <pre> 감소 [{name}] {bpage['code_blocks']} -> {cpage['code_blocks']}")
        if cpage["tables"] < bpage["tables"]:
            info.append(f"[정보] <table> 감소 [{name}] {bpage['tables']} -> {cpage['tables']}")

    print(f"검사 디렉터리: {directory}")
    print(f"도해 보존 검사: {fig_ok}/{fig_total} 동일")
    print(f"기존 h2 앵커 보존: {h2_ok}/{h2_total}")
    for line in failures:
        print(f"  [실패] {line}")
    for line in info:
        print(f"  {line}")
    return 1 if failures else 0


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument(
        "--check", nargs="?", const="book", default=None, metavar="DIR",
        help="compare on-disk pages in DIR (default: book) with the baseline",
    )
    args = parser.parse_args()

    if args.check is None:
        write_baseline()
        return 0

    directory = Path(args.check)
    if not directory.is_absolute():
        directory = ROOT / directory
    if not directory.is_dir():
        print(f"directory not found: {directory}")
        return 1
    return check_directory(directory)


if __name__ == "__main__":
    sys.exit(main())
