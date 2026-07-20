#!/usr/bin/env python3
"""Refreshes lotto-nz/draws-data.js with any new NZ Lotto draws.

Reads the current bundled dataset, scrapes the latest results for the
current and previous calendar month from lottoresults.co.nz, and appends
any draws newer than the last one on record. Only ever appends a strictly
sequential run of new draw numbers -- if a fetched draw doesn't continue
the sequence or fails a sanity check, it (and anything after it) is
dropped rather than risking a corrupt/gapped dataset.

Exits 0 whether or not new draws were found; the calling workflow decides
whether to commit based on `git status`.
"""
import datetime
import re
import sys
import urllib.request

DATA_FILE = "lotto-nz/draws-data.js"
SOURCE_URL = "http://lottoresults.co.nz/lotto/{month}-{year}"
MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]
MONTH_INDEX = {m: i + 1 for i, m in enumerate(MONTH_NAMES)}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (lotto-nz data refresh)"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as exc:  # network hiccups shouldn't crash the whole job
        print(f"WARN: failed to fetch {url}: {exc}", file=sys.stderr)
        return None


def parse_month_page(html):
    """Returns a list of dicts: draw, date (YYYYMMDD int), main[6], bonus, powerball."""
    draws = []
    for card in html.split('<div class="result-card">')[1:]:
        heading = re.search(
            r'Lotto Result for \w+,\s*(\d{1,2}) (\w+) (\d{4})', card)
        draw_num = re.search(
            r'Draw Number:\s*<span class="result-meta__detail">(\d+)</span>', card)
        if not heading or not draw_num:
            continue
        day, month_name, year = heading.groups()
        month_name = month_name.lower()
        if month_name not in MONTH_INDEX:
            continue
        ymd = int(f"{year}{MONTH_INDEX[month_name]:02d}{int(day):02d}")

        # Main draw balls + bonus live in the first <ol class="draw-result">,
        # before the "draw-result--sub" block that holds Powerball/Strike.
        main_block = card.split('draw-result draw-result--sub')[0]
        balls = [int(n) for n in re.findall(
            r'<li class="draw-result__ball[^"]*">(\d+)</li>', main_block)]
        if len(balls) != 7:
            continue
        main, bonus = balls[:6], balls[6]

        powerball = None
        pb_idx = card.find('powerball-logo')
        if pb_idx != -1:
            pb_match = re.search(
                r'<li class="draw-result__ball[^"]*">(\d+)</li>', card[pb_idx:pb_idx + 400])
            if pb_match:
                powerball = int(pb_match.group(1))

        draws.append({
            "draw": int(draw_num.group(1)),
            "date": ymd,
            "main": main,
            "bonus": bonus,
            "powerball": powerball,
        })
    return draws


def valid_draw(d, expected_draw_num):
    if d["draw"] != expected_draw_num:
        return False
    if len(d["main"]) != 6 or len(set(d["main"])) != 6:
        return False
    if any(n < 1 or n > 40 for n in d["main"]):
        return False
    if not (1 <= d["bonus"] <= 40) or d["bonus"] in d["main"]:
        return False
    if d["powerball"] is None or not (1 <= d["powerball"] <= 10):
        return False
    return True


def load_existing():
    with open(DATA_FILE, encoding="utf-8") as f:
        content = f.read()
    match = re.search(r'RAW_DRAWS\s*=\s*\[(.*?)\];', content, re.S)
    nums = [int(x) for x in re.findall(r'-?\d+', match.group(1))]
    if len(nums) % 10 != 0:
        raise ValueError("existing draws-data.js is not a multiple of 10 ints; refusing to touch it")
    draws = []
    for i in range(0, len(nums), 10):
        draws.append({
            "draw": nums[i],
            "date": nums[i + 1],
            "main": nums[i + 2:i + 8],
            "bonus": nums[i + 8],
            "powerball": nums[i + 9] or None,
        })
    return draws


def write_file(draws):
    last = draws[-1]
    last_date = str(last["date"])
    pretty_date = f"{int(last_date[6:8])} {MONTH_NAMES[int(last_date[4:6]) - 1].title()[:3]} {last_date[0:4]}"
    lines = [
        f"// Historical NZ Lotto + Powerball results, draw 1 (1 Aug 1987) to draw {last['draw']} ({pretty_date}).",
        "// Source: official Lotto NZ (mylotto.co.nz) archive for draws 1-2308, cross-checked",
        "// public results archives (lottoresults.co.nz, lotto.net) for later draws. Refreshed",
        "// automatically by .github/workflows/update-lotto-data.yml.",
        "// Layout: flat ints, 10 per draw: [drawNumber, dateYYYYMMDD, n1..n6, bonusBall, powerball].",
        "// Powerball is 0 for draws before Powerball existed (pre draw 711, 17 Feb 2001).",
        "export const RAW_DRAWS = [",
    ]
    row = []
    for d in draws:
        chunk = [d["draw"], d["date"], *d["main"], d["bonus"], d["powerball"] or 0]
        row.append(",".join(str(x) for x in chunk))
        if len(row) == 4:
            lines.append("  " + ",  ".join(row) + ",")
            row = []
    if row:
        lines.append("  " + ",  ".join(row) + ",")
    lines.append("];")
    lines.append("")
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def month_year_slugs(today):
    cur = (MONTH_NAMES[today.month - 1], today.year)
    prev_month = today.month - 1 or 12
    prev_year = today.year if today.month > 1 else today.year - 1
    prev = (MONTH_NAMES[prev_month - 1], prev_year)
    return [prev, cur]


def main():
    existing = load_existing()
    last_draw_num = existing[-1]["draw"]
    print(f"Current dataset ends at draw {last_draw_num} ({existing[-1]['date']})")

    today = datetime.date.today()
    candidates = {}
    for month, year in month_year_slugs(today):
        html = fetch(SOURCE_URL.format(month=month, year=year))
        if not html:
            continue
        for d in parse_month_page(html):
            candidates[d["draw"]] = d

    new_draws = []
    expected = last_draw_num + 1
    while expected in candidates:
        cand = candidates[expected]
        if not valid_draw(cand, expected):
            print(f"WARN: candidate draw {expected} failed validation, stopping here", file=sys.stderr)
            break
        new_draws.append(cand)
        expected += 1

    if not new_draws:
        print("No new draws found; dataset already up to date.")
        return 0

    merged = existing + new_draws
    write_file(merged)
    print(f"Appended {len(new_draws)} new draw(s): "
          f"{new_draws[0]['draw']}-{new_draws[-1]['draw']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
