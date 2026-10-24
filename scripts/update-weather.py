#!/usr/bin/env python3
"""Fetch two daily MET Norway forecasts; publish only lunch/dinner summaries."""
import argparse
from datetime import datetime, timedelta, timezone
import gzip
import json
import math
from pathlib import Path
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROME = ZoneInfo('Europe/Rome')
ROOT = Path(__file__).resolve().parent.parent
ENDPOINT = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=45.0641&lon=7.6525'


def condition(symbol):
    code = symbol.split('_')[0]
    if 'thunder' in code:
        return 9, 'Temporali', '⛈'
    if 'snow' in code:
        return 8, 'Neve', '❄'
    if 'sleet' in code:
        return 7, 'Pioggia e neve', '🌨'
    if 'heavyrain' in code:
        return 6, 'Pioggia intensa', '🌧'
    if 'rainshowers' in code:
        return 5, 'Rovesci', '🌦'
    if 'lightrain' in code:
        return 4, 'Pioggia debole', '🌧'
    if 'rain' in code:
        return 5, 'Pioggia', '🌧'
    if code == 'fog':
        return 3, 'Nebbia', '🌫'
    if code == 'cloudy':
        return 2, 'Coperto', '☁'
    if code in ('partlycloudy', 'fair'):
        return 1, 'Parzialmente nuvoloso', '⛅'
    if code == 'clearsky':
        return 0, 'Sereno', '☀' if symbol.endswith('_day') else '☾'
    raise ValueError('Unknown MET Norway condition: ' + symbol)


def period(points, day, start, end):
    temperatures, conditions = [], []
    precipitation = 0.0
    for hour in range(start, math.ceil(end)):
        at = datetime.combine(day, datetime.min.time(), ROME) + timedelta(hours=hour)
        key = at.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
        next_key = (at + timedelta(hours=1)).astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
        # Missing or 6-hour-only points must never be interpreted as dry weather.
        if key not in points or next_key not in points:
            return None
        data = points[key]['data']
        hourly = data.get('next_1_hours')
        if not hourly:
            return None
        weight = min(1.0, end - hour)
        temp = data['instant']['details']['air_temperature']
        next_temp = points[next_key]['data']['instant']['details']['air_temperature']
        amount = hourly['details']['precipitation_amount']
        if not all(isinstance(n, (int, float)) and math.isfinite(n) for n in (temp, next_temp, amount)):
            raise ValueError('Invalid forecast numbers')
        temperatures.extend([temp, temp + (next_temp - temp) * weight])
        precipitation += amount * weight
        conditions.append(condition(hourly['summary']['symbol_code']))
    _, label, icon = max(conditions, key=lambda value: value[0])
    return {'condition': label, 'icon': icon,
            'min_c': round(min(temperatures)), 'max_c': round(max(temperatures)),
            'precipitation_mm': round(precipitation, 1)}


def summarize(raw, now):
    updated = datetime.fromisoformat(raw['properties']['meta']['updated_at'].replace('Z', '+00:00'))
    if abs((now - updated).total_seconds()) > 24 * 3600:
        raise ValueError('Provider forecast is older than 24 hours')
    points = {p['time']: p for p in raw['properties']['timeseries']}
    days = []
    # Keep a third date so tomorrow remains available after midnight until the morning update.
    # Only today and tomorrow are exposed by the card controls.
    for offset in range(3):
        day = now.astimezone(ROME).date() + timedelta(days=offset)
        lunch = period(points, day, 12, 14.5)
        dinner = period(points, day, 19, 22.5)
        if lunch or dinner:
            days.append({'date': day.isoformat(), 'lunch': lunch, 'dinner': dinner})
    if not days or days[0]['date'] != now.astimezone(ROME).date().isoformat():
        raise ValueError('No usable forecast for today; previous file preserved')
    return {'source': 'MET Norway', 'source_url': ENDPOINT,
            'location': 'Torino · zona San Paolo', 'latitude': 45.0641, 'longitude': 7.6525,
            'fetched_at': now.isoformat(timespec='seconds'), 'provider_updated_at': updated.isoformat(),
            'days': days}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path, help='Use an already downloaded response (validation/initial setup)')
    parser.add_argument('--output', type=Path, default=ROOT / 'weather.json')
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    old = None
    if args.output.exists():
        old = json.loads(args.output.read_text())
        fetched = datetime.fromisoformat(old['fetched_at'])
        local_now, local_fetched = now.astimezone(ROME), fetched.astimezone(ROME)
        slot = lambda value: (value.date(), value.hour * 60 + value.minute >= 17 * 60 + 30)
        if slot(local_fetched) == slot(local_now):
            print('Forecast already fetched in this morning/evening slot; no API request or file change.')
            return
    if args.input:
        raw = json.loads(args.input.read_text())
    else:
        request = Request(ENDPOINT, headers={
            'User-Agent': 'ControcorrenteWeather/1.0 (+https://piol77.github.io/controcorrente/contatti.html)',
            'Accept': 'application/json', 'Accept-Encoding': 'gzip'})
        with urlopen(request, timeout=30) as response:
            payload = response.read()
            if response.headers.get('Content-Encoding') == 'gzip':
                payload = gzip.decompress(payload)
            raw = json.loads(payload)
    result = summarize(raw, now)
    # The evening provider response no longer contains past lunch hours. Keep that day's
    # last actual forecast, clearly dated, rather than lose the lunch row or invent data.
    if old:
        for day in result['days']:
            prior = next((d for d in old.get('days', []) if d['date'] == day['date']), None)
            if prior and day['date'] == now.astimezone(ROME).date().isoformat():
                for service, end in [('lunch', 14.5), ('dinner', 22.5)]:
                    if day[service] is None and now.astimezone(ROME).hour >= end and prior.get(service):
                        day[service] = dict(prior[service], forecast_at=old['fetched_at'])
    temporary = args.output.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(args.output)
    print('Updated', args.output.name, 'for', result['days'][0]['date'])


if __name__ == '__main__':
    main()
