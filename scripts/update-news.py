#!/usr/bin/env python3
"""Five current national/world headlines from RaiNews' official public RSS."""
import argparse
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from html import unescape
import json
from pathlib import Path
import re
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
FEED = 'https://www.rainews.it/rss/tutti'
WORLD = {'Esteri', 'Guerre e conflitti', 'Diritti fondamentali', 'Social network', 'Giornalismo investigativo', 'Borse e mercati'}
ITALY = {'Cronaca', 'Politica', 'Economia e finanza', 'Lavoro', 'Capo dello Stato'}


def safe_url(value):
    parsed = urlparse(value)
    return parsed.scheme == 'https' and parsed.hostname in {'www.rainews.it', 'rainews.it'}


def select(raw, now):
    candidates = []
    seen = set()
    for item in ET.fromstring(raw).findall('./channel/item'):
        title = re.sub(r'\s+', ' ', unescape(item.findtext('title', ''))).strip()
        link = item.findtext('link', '').strip()
        category = item.findtext('category', '').strip()
        if category not in WORLD | ITALY or not title or not safe_url(link) or link in seen:
            continue
        try:
            published = parsedate_to_datetime(item.findtext('pubDate', '')).astimezone(timezone.utc)
        except (ValueError, TypeError):
            continue
        if not now - timedelta(hours=36) <= published <= now + timedelta(minutes=10):
            continue
        image = item.find('{http://search.yahoo.com/mrss/}content')
        image_url = image.get('url', '') if image is not None else ''
        if not safe_url(image_url):
            image_url = ''
        candidates.append({'title': title, 'url': link, 'image': image_url, 'source': 'RaiNews',
                           'area': 'Mondo' if category in WORLD else 'Italia',
                           'published_at': published.isoformat()})
        seen.add(link)
    # Preserve editorial feed order within each area, with both Italy and the world represented.
    italy = [x for x in candidates if x['area'] == 'Italia']
    world = [x for x in candidates if x['area'] == 'Mondo']
    if len(italy) < 3 or len(world) < 2:
        raise ValueError('Not enough recent national/world headlines; previous edition preserved')
    chosen = [italy[0], world[0], italy[1], world[1], italy[2]]
    return {'source': 'RaiNews', 'source_url': FEED, 'fetched_at': now.isoformat(timespec='seconds'), 'items': chosen}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'news.json')
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    if args.input:
        raw = args.input.read_bytes()
    else:
        request = Request(FEED, headers={'User-Agent': 'ControcorrenteHeadlines/1.0 (+https://piol77.github.io/controcorrente/)'})
        with urlopen(request, timeout=30) as response:
            raw = response.read(3_000_000)
    result = select(raw, now)
    if args.output.exists():
        previous = json.loads(args.output.read_text())
        # Refresh the timestamp too: it proves a successful source check, even with unchanged headlines.
        if previous == result:
            return
    temporary = args.output.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(args.output)
    print('Updated five RaiNews headlines')


if __name__ == '__main__':
    main()
