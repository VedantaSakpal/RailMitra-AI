import pdfplumber, re, csv, json
from collections import defaultdict

PDF = r"c:\Users\VARAD\Desktop\RailMitra-AI\centrarailTT.pdf"
COL_TOL = 13.0  # half of ~26.3pt column spacing

def cluster_rows(words, tol=2.0):
    rows = defaultdict(list)
    sorted_words = sorted(words, key=lambda w: w['top'])
    row_tops = []
    for w in sorted_words:
        placed = False
        for rt in row_tops:
            if abs(w['top'] - rt) <= tol:
                rows[rt].append(w)
                placed = True
                break
        if not placed:
            row_tops.append(w['top'])
            rows[w['top']].append(w)
    return dict(sorted(rows.items()))

def nearest_col(x0, col_positions):
    best, best_d = None, 1e9
    for cx in col_positions:
        d = abs(x0 - cx)
        if d < best_d:
            best, best_d = cx, d
    return best if best_d <= COL_TOL else None

train_meta = {}   # train_no -> {link_code, flags: set()}
stop_times = []    # list of dicts: train_no, station, time, seq_in_page (for ordering)
station_order = [] # to preserve overall station sequence (first-seen order)
seen_stations = set()

with pdfplumber.open(PDF) as pdf:
    for pageno, page in enumerate(pdf.pages, start=1):
        words = page.extract_words()
        rows = cluster_rows(words, tol=2.0)
        tops = list(rows.keys())

        # 1. find header row: many 5-6 digit tokens
        header_top = None
        for t in tops:
            toks = [w['text'] for w in rows[t]]
            numeric = [tok for tok in toks if re.fullmatch(r'\d{5,6}', tok)]
            if len(numeric) >= 5:
                header_top = t
                break
        if header_top is None:
            continue

        header_words = sorted(rows[header_top], key=lambda w: w['x0'])
        col_positions = [w['x0'] for w in header_words if re.fullmatch(r'\d{5,6}', w['text'])]
        train_numbers = [w['text'] for w in header_words if re.fullmatch(r'\d{5,6}', w['text'])]
        col_to_train = dict(zip(col_positions, train_numbers))
        for tn in train_numbers:
            train_meta.setdefault(tn, {"link_code": "", "flags": set(), "page": pageno})

        # 2. link-code row (right after header, within ~12pt)
        link_row_top = None
        for t in tops:
            if t > header_top and t <= header_top + 12:
                link_row_top = t
                break
        if link_row_top:
            buckets = defaultdict(list)
            for w in rows[link_row_top]:
                c = nearest_col(w['x0'], col_positions)
                if c is not None:
                    buckets[c].append(w['text'])
            for c, toks in buckets.items():
                tn = col_to_train.get(c)
                if tn:
                    train_meta[tn]['link_code'] = " ".join(toks)

        # 3. flag rows (AC / X / 15 C / etc.) — rows between link_row and first station row
        # first station row = first row containing a time HH:MM AND a left-side station name token (x0<90)
        first_station_top = None
        for t in tops:
            if t <= (link_row_top or header_top):
                continue
            toks = rows[t]
            has_time = any(re.fullmatch(r'\d{1,2}:\d{2}', w['text']) for w in toks)
            has_name = any(w['x0'] < 90 for w in toks)
            if has_time and has_name:
                first_station_top = t
                break

        flag_rows_tops = [t for t in tops if (link_row_top and t > link_row_top) and (first_station_top and t < first_station_top)]
        for t in flag_rows_tops:
            buckets = defaultdict(list)
            for w in rows[t]:
                c = nearest_col(w['x0'], col_positions)
                if c is not None:
                    buckets[c].append(w['text'])
            for c, toks in buckets.items():
                tn = col_to_train.get(c)
                if tn:
                    train_meta[tn]['flags'].add(" ".join(toks))

        # 4. station rows: from first_station_top to end of page (or until next header)
        if first_station_top is None:
            continue
        for t in tops:
            if t < first_station_top:
                continue
            toks = rows[t]
            name_parts = [w['text'] for w in sorted(toks, key=lambda w: w['x0']) if w['x0'] < 90]
            if not name_parts:
                continue
            station = " ".join(name_parts).strip()
            if not re.search(r'[A-Za-z]', station):
                continue
            if station.upper() in ("STATION",):
                continue
            if station not in seen_stations:
                seen_stations.add(station)
                station_order.append(station)
            for w in toks:
                if w['x0'] >= 90 and re.fullmatch(r'\d{1,2}:\d{2}|…', w['text']):
                    c = nearest_col(w['x0'], col_positions)
                    tn = col_to_train.get(c)
                    if tn and w['text'] != '…':
                        stop_times.append({"train_no": tn, "station": station, "time": w['text'], "page": pageno})

print("Trains found:", len(train_meta))
print("Stations found:", len(station_order))
print("Stop-time records:", len(stop_times))

# write CSVs
with open(r"c:\Users\VARAD\Desktop\RailMitra-AI\centerTt\trains.csv", "w", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["train_no", "link_code", "flags", "source_page"])
    for tn, meta in sorted(train_meta.items()):
        wr.writerow([tn, meta['link_code'], "|".join(sorted(meta['flags'])), meta['page']])

with open(r"c:\Users\VARAD\Desktop\RailMitra-AI\centerTt\stop_times.csv", "w", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["train_no", "station", "time"])
    for r in stop_times:
        wr.writerow([r['train_no'], r['station'], r['time']])

with open(r"c:\Users\VARAD\Desktop\RailMitra-AI\centerTt\stations.csv", "w", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["seq", "station_name"])
    for i, s in enumerate(station_order, start=1):
        wr.writerow([i, s])

# sample check for train 96301 (first train, page1)
sample = [r for r in stop_times if r['train_no'] == '96301']
print("\nSample stops for train 96301:")
for r in sample:
    print(" ", r['station'], r['time'])

# ---- Post-processing: normalize station names against the canonical master list ----
print("\n--- Normalizing station names ---")
canonical = station_order[:51]  # first page produced the clean, complete 51-station list
canonical_sorted = sorted(canonical, key=len, reverse=True)

def normalize(raw):
    raw = raw.strip()
    if raw in canonical:
        return raw, None
    # raw starts with a canonical name plus a trailing time glued on (e.g. "CSMT 13:50")
    for c in canonical_sorted:
        if raw.startswith(c) and len(raw) > len(c):
            rest = raw[len(c):].strip()
            m = re.search(r'\d{1,2}:\d{2}', rest)
            return c, (m.group(0) if m else None)
    # raw is a partial fragment of a canonical name (e.g. "Sandhurst" of "Sandhurst Road")
    for c in canonical_sorted:
        if c.startswith(raw) and raw != c:
            return c, None
    return raw, None  # unresolved — leave as-is for manual review

fixed_stop_times = []
unresolved = set()
for r in stop_times:
    norm, extra_time = normalize(r['station'])
    if norm not in canonical:
        unresolved.add(norm)
    fixed_stop_times.append({"train_no": r['train_no'], "station": norm, "time": r['time']})
    if extra_time:
        fixed_stop_times.append({"train_no": r['train_no'], "station": norm, "time": extra_time})

print("Unresolved station labels (need manual check):", unresolved)
print("Total stop_time rows after normalization:", len(fixed_stop_times))

# de-duplicate exact repeats
seen = set()
deduped = []
for r in fixed_stop_times:
    key = (r['train_no'], r['station'], r['time'])
    if key not in seen:
        seen.add(key)
        deduped.append(r)
print("After de-dup:", len(deduped))

with open(r"c:\Users\VARAD\Desktop\RailMitra-AI\centerTt\stop_times_clean.csv", "w", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["train_no", "station", "time"])
    for r in deduped:
        wr.writerow([r['train_no'], r['station'], r['time']])

with open(r"c:\Users\VARAD\Desktop\RailMitra-AI\centerTt\stations_clean.csv", "w", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["seq", "station_name"])
    for i, s in enumerate(canonical, start=1):
        wr.writerow([i, s])

print("\nTrains with flags sample:")
for tn in list(train_meta)[:5]:
    print(" ", tn, train_meta[tn])
