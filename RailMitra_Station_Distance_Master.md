# RailMitra-AI — Station-to-Station Distance Master

## Purpose

This file defines the `distance_km` values to be used by RailMitra-AI for calculating journey distance and evaluating ticket fare.

**Rule:** Fare calculation must use the sum of the station-to-station distances for the selected route, not the number of stations.

> **Accuracy note:** The values below are based on published railway timetable/route chainages available for the referenced routes. Many timetable chainages are published to the nearest kilometre, so these values should be treated as **published/rounded railway chainage**, not metre-level track measurements. Where an official Central Railway section length is available, retain it separately as an authoritative section total.

---

## Database Rule

Store each adjacent station relationship as:

```text
line_code
from_station
to_station
distance_km
```

Example:

```text
CENTRAL | CSMT | MSD | 1
CENTRAL | MSD | SNRD | 1
CENTRAL | SNRD | BY | 2
```

For fare calculation:

```text
total_distance_km =
distance(from_station → next_station)
+ distance(next_station → next_station)
+ ...
```

Do not calculate fare using station count.

---

# 1. CENTRAL — CSMT → KALYAN

| From | To | distance_km |
|---|---|---:|
| CSMT | Masjid | 1 |
| Masjid | Sandhurst Road | 1 |
| Sandhurst Road | Byculla | 2 |
| Byculla | Chinchpokli | 1 |
| Chinchpokli | Currey Road | 1 |
| Currey Road | Parel | 2 |
| Parel | Dadar | 1 |
| Dadar | Matunga | 1 |
| Matunga | Sion | 3 |
| Sion | Kurla | 3 |
| Kurla | Vidyavihar | 2 |
| Vidyavihar | Ghatkopar | 1 |
| Ghatkopar | Vikhroli | 4 |
| Vikhroli | Kanjur Marg | 2 |
| Kanjur Marg | Bhandup | 2 |
| Bhandup | Nahur | 1 |
| Nahur | Mulund | 3 |
| Mulund | Thane | 2 |
| Thane | Kalwa | 3 |
| Kalwa | Mumbra | 4 |
| Mumbra | Diva | 3 |
| Diva | Kopar | 4 |
| Kopar | Dombivli | 1 |
| Dombivli | Thakurli | 2 |
| Thakurli | Kalyan | 4 |

---

# 2. CENTRAL — KALYAN → KASARA

| From | To | distance_km |
|---|---|---:|
| Kalyan | Shahad | 3 |
| Shahad | Ambivli | 4 |
| Ambivli | Titwala | 4 |
| Titwala | Khadavli | 8 |
| Khadavli | Vasind | 8 |
| Vasind | Asangaon | 6 |
| Asangaon | Atgaon | 9 |
| Atgaon | Thansit | 6 |
| Thansit | Khardi | 6 |
| Khardi | Umbermali | 7 |
| Umbermali | Kasara | 7 |

**Official Central Railway section reference:** Kalyan–Kasara = **67.35 km**.

---

# 3. CENTRAL — KALYAN → KHOPOLI

| From | To | distance_km |
|---|---|---:|
| Kalyan | Vithalwadi | 2 |
| Vithalwadi | Ulhasnagar | 2 |
| Ulhasnagar | Ambernath | 2 |
| Ambernath | Badlapur | 8 |
| Badlapur | Vangani | 11 |
| Vangani | Shelu | 4 |
| Shelu | Neral | 4 |
| Neral | Bhivpuri Road | 6 |
| Bhivpuri Road | Karjat | 7 |
| Karjat | Palasdhari | 3 |
| Palasdhari | Kelavli | 5 |
| Kelavli | Dolavali | 1 |
| Dolavali | Lowjee | 3 |
| Lowjee | Khopoli | 2 |

**Official Central Railway section references:**
- Kalyan–Karjat = **46.51 km**
- Karjat–Khopoli = **14.52 km**

---

# 4. WESTERN — CHURCHGATE → DAHANU ROAD

## Churchgate → Virar

| From | To | distance_km |
|---|---|---:|
| Churchgate | Marine Lines | 1 |
| Marine Lines | Charni Road | 1 |
| Charni Road | Grant Road | 2 |
| Grant Road | Mumbai Central | 1 |
| Mumbai Central | Mahalaxmi | 1 |
| Mahalaxmi | Lower Parel | 2 |
| Lower Parel | Prabhadevi | 1 |
| Prabhadevi | Dadar | 2 |
| Dadar | Matunga Road | 1 |
| Matunga Road | Mahim | 1 |
| Mahim | Bandra | 2 |
| Bandra | Khar Road | 1 |
| Khar Road | Santacruz | 2 |
| Santacruz | Vile Parle | 2 |
| Vile Parle | Andheri | 2 |
| Andheri | Jogeshwari | 2 |
| Jogeshwari | Ram Mandir | 1 |
| Ram Mandir | Goregaon | 2 |
| Goregaon | Malad | 2 |
| Malad | Kandivali | 2 |
| Kandivali | Borivali | 3 |
| Borivali | Dahisar | 2 |
| Dahisar | Mira Road | 4 |
| Mira Road | Bhayandar | 3 |
| Bhayandar | Naigaon | 5 |
| Naigaon | Vasai Road | 4 |
| Vasai Road | Nalasopara | 4 |
| Nalasopara | Virar | 4 |

## Virar → Dahanu Road

| From | To | distance_km |
|---|---|---:|
| Virar | Vaitarna | 9 |
| Vaitarna | Saphale | 7 |
| Saphale | Kelve Road | 7 |
| Kelve Road | Palghar | 8 |
| Palghar | Umroli | 7 |
| Umroli | Boisar | 4 |
| Boisar | Vangaon | 10 |
| Vangaon | Dahanu Road | 12 |

---

# 5. HARBOUR — CSMT → PANVEL

| From | To | distance_km |
|---|---|---:|
| CSMT | Masjid | 1 |
| Masjid | Sandhurst Road | 1 |
| Sandhurst Road | Dockyard Road | 1 |
| Dockyard Road | Reay Road | 1 |
| Reay Road | Cotton Green | 1 |
| Cotton Green | Sewri | 2 |
| Sewri | Wadala Road | 2 |
| Wadala Road | GTB Nagar | 3 |
| GTB Nagar | Chunabhatti | 1 |
| Chunabhatti | Kurla | 2 |
| Kurla | Tilak Nagar | 2 |
| Tilak Nagar | Chembur | 1 |
| Chembur | Govandi | 1 |
| Govandi | Mankhurd | 3 |
| Mankhurd | Vashi | 7 |
| Vashi | Sanpada | 1 |
| Sanpada | Juinagar | 2 |
| Juinagar | Nerul | 2 |
| Nerul | Seawoods-Darave | 2 |
| Seawoods-Darave | CBD Belapur | 2 |
| CBD Belapur | Kharghar | 3 |
| Kharghar | Mansarovar | 2 |
| Mansarovar | Khandeshwar | 2 |
| Khandeshwar | Panvel | 4 |

**Official Central Railway section reference:** CSMT–Panvel = **48.94 km**.

---

# 6. HARBOUR — WADALA ROAD → ANDHERI

| From | To | distance_km |
|---|---|---:|
| Wadala Road | King's Circle | 2 |
| King's Circle | Mahim Junction | 2 |
| Mahim Junction | Bandra | 1 |
| Bandra | Khar Road | 2 |
| Khar Road | Santacruz | 2 |
| Santacruz | Vile Parle | 2 |
| Vile Parle | Andheri | 2 |

**Official Central Railway section reference:** Wadala Road–Andheri = **12.19 km**.

---

# 7. TRANS-HARBOUR — THANE → PANVEL

| From | To | distance_km |
|---|---|---:|
| Thane | Digha Gaon | 4 |
| Digha Gaon | Airoli | 2 |
| Airoli | Rabale | 2 |
| Rabale | Ghansoli | 3 |
| Ghansoli | Kopar Khairane | 1 |
| Kopar Khairane | Turbhe | 3 |
| Turbhe | Juinagar | 3 |
| Juinagar | Nerul | 2 |
| Nerul | Seawoods-Darave | 1 |
| Seawoods-Darave | CBD Belapur | 3 |
| CBD Belapur | Kharghar | 2 |
| Kharghar | Mansarovar | 3 |
| Mansarovar | Khandeshwar | 2 |
| Khandeshwar | Panvel | 3 |

---

# Fare Calculation Logic

The fare system should work like this:

```text
1. Identify source station.
2. Identify destination station.
3. Identify the applicable railway line/branch.
4. Find the ordered station path.
5. Sum distance_km for every adjacent station pair.
6. Get total journey distance.
7. Apply the configured fare slab/rule.
8. Return fare.
```

Example:

```text
Dombivli → Kalyan

Dombivli → Thakurli = 2 km
Thakurli → Kalyan = 4 km

Total = 6 km
```

Do not use:

```text
number_of_stations × fixed_distance
```

---

# Important Station-Code Rules

Use the existing station identity/code system in the database.

Important correction:

```text
TNA  = Thane
TKNG = Tilak Nagar
```

Do **not** use `TNA` for Tilak Nagar.

For Seawoods, use the project's verified/current station code consistently; do not create duplicate station records for the same physical station.

---

# Database Implementation Recommendation

Create/use a station-distance relationship table:

```sql
station_distances
-----------------
id
line_code
from_station_id
to_station_id
distance_km
created_at
updated_at
```

Recommended unique constraint:

```text
UNIQUE(line_code, from_station_id, to_station_id)
```

This prevents duplicate distance records.

---

# Fare Calculation Safety

Do not hard-code fares inside the station-distance table.

Keep distance and fare rules separate:

```text
station_distances
        ↓
total journey distance
        ↓
fare slabs/rules
        ↓
ticket fare
```

This allows railway fare rules to change without modifying station distances.

---

# Validation Requirements

Before using this data in production:

- Check that every adjacent station pair exists.
- Check that `distance_km > 0`.
- Prevent duplicate `line_code + from_station + to_station`.
- Preserve existing station IDs.
- Do not create duplicate physical stations.
- Keep Central Kalyan→Kasara and Kalyan→Khopoli as separate branches.
- Keep Harbour and Trans-Harbour separate.
- Preserve the existing Western Line functionality.
- Test fare calculation for short, medium, and long journeys.
- Test interchange stations carefully.
- Do not replace existing station data blindly; compare before updating.

## Source/Accuracy Policy

Use the values in this file as the current RailMitra distance master.

Where an official railway section total differs from the sum of rounded station-to-station values, do **not** artificially modify individual station distances just to make the rounded values add up. Preserve the published station chainage values and retain the official section total separately.

For future fare production use, replace rounded values with official railway engineering chainage if a more precise station-wise source is obtained.
