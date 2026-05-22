"""E2E Phase B — destructive write-path tests on an isolated fresh DB.
Module completion, FSRS grading, daily logs, edge cases."""
import json, urllib.request, urllib.error, datetime, sys

BASE = "http://127.0.0.1:8787"
passes, fails = [], []

def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method,
                               headers={"Content-Type": "application/json"} if data else {})
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        return e.code, (json.loads(txt) if txt else None)

def check(name, cond, detail=""):
    (passes if cond else fails).append(name)
    print(("  PASS " if cond else "  FAIL ") + name + ("" if cond else "  -> " + str(detail)))

print("\n=== B1. MODULE COMPLETION + UNLOCK CHAIN (MOD-001) ===")
s, mod = req("GET", "/api/modules/MOD-001")
acts = sorted(mod["activities"], key=lambda a: a["sort_order"])
check("MOD-001 has 7 activities", len(acts) == 7, len(acts))
check("MOD-001 starts at 0%", mod["percent_complete"] == 0, mod["percent_complete"])
last_pct = 0.0
for i, a in enumerate(acts):
    s, att = req("POST", f"/api/activities/{a['id']}/attempts", {})
    check(f"  mark activity {a['slug']} complete -> 201", s == 201, s)
    s, prog = req("GET", "/api/modules/MOD-001/progress")
    pct = prog["percent_complete"]
    check(f"  percent rises after {a['slug']} ({round(pct*100)}%)", pct > last_pct or pct == 1.0, pct)
    last_pct = pct
s, mod = req("GET", "/api/modules/MOD-001")
check("MOD-001 now 100% complete", mod["percent_complete"] == 1.0, mod["percent_complete"])

# duplicate attempt must not change percent
s, _ = req("POST", f"/api/activities/{acts[0]['id']}/attempts", {})
s, prog = req("GET", "/api/modules/MOD-001/progress")
check("duplicate attempt keeps percent at 100%", prog["percent_complete"] == 1.0, prog["percent_complete"])

# other modules still at 0 (unlock chain: frontend unlocks MOD-002 from this)
s, mods = req("GET", "/api/modules")
m2 = next(m for m in mods if m["module_id"] == "MOD-002")
check("MOD-002 still 0% (unlocks via MOD-001=100%)", m2["percent_complete"] == 0, m2["percent_complete"])

print("\n=== B2. COMPLETE A DIFFERENT MODULE (MOD-005, 9 activities) ===")
s, mod5 = req("GET", "/api/modules/MOD-005")
acts5 = mod5["activities"]
check("MOD-005 has 9 activities", len(acts5) == 9, len(acts5))
for a in acts5:
    req("POST", f"/api/activities/{a['id']}/attempts", {})
s, mod5 = req("GET", "/api/modules/MOD-005")
check("MOD-005 reaches 100%", mod5["percent_complete"] == 1.0, mod5["percent_complete"])

print("\n=== B3. FSRS GRADING (4 cards, one per rating) ===")
s, due = req("GET", "/api/vocabulary/due")
check("due queue has cards", len(due) >= 4, len(due))
results = {}
for grade, label in [(1, "Again"), (2, "Hard"), (3, "Good"), (4, "Easy")]:
    card = due[grade - 1]
    s, res = req("POST", f"/api/vocabulary/{card['id']}/review", {"grade": grade, "elapsed_seconds": 3})
    check(f"  grade {grade} ({label}) -> 200", s == 200, s)
    check(f"  grade {grade} returns nextDue", bool(res and res.get("nextDue")), res)
    if res and res.get("nextDue"):
        due_dt = datetime.datetime.fromisoformat(res["nextDue"].replace("Z", "+00:00"))
        now = datetime.datetime.now(datetime.timezone.utc)
        mins = (due_dt - now).total_seconds() / 60
        results[grade] = mins
        print(f"      next review in ~{round(mins,1)} min  (status now: {res['item']['status']})")
        check(f"  grade {grade} card left 'new' state", res["item"]["status"] != "new", res["item"]["status"])
if len(results) == 4:
    check("Again interval < Good interval", results[1] < results[3], f"{results[1]:.0f} vs {results[3]:.0f}")
    check("Good interval <= Easy interval", results[3] <= results[4], f"{results[3]:.0f} vs {results[4]:.0f}")
    check("Again schedules within ~1 day", results[1] < 1440, results[1])

print("\n=== B4. FSRS REVIEW HISTORY ACCUMULATES ===")
s, before = req("GET", "/api/vocabulary/stats")
card = due[10]
for g in (3, 3, 3):
    req("POST", f"/api/vocabulary/{card['id']}/review", {"grade": g, "elapsed_seconds": 2})
s, cardnow = req("GET", f"/api/vocabulary/{card['id']}")
check("repeatedly graded card is no longer 'new'", cardnow["status"] != "new", cardnow["status"])
check("graded card has fsrs_state JSON", bool(cardnow.get("fsrs_state")), cardnow.get("fsrs_state"))
try:
    json.loads(cardnow["fsrs_state"])
    check("fsrs_state is valid JSON", True)
except Exception as e:
    check("fsrs_state is valid JSON", False, e)

print("\n=== B5. DAILY LOGS + STREAK ===")
today = datetime.date.today()
yest = today - datetime.timedelta(days=1)
s, log1 = req("PUT", f"/api/daily-logs/{yest}", {"notes": "E2E test - yesterday", "minutes": 20})
check(f"PUT daily-log {yest} -> 200", s == 200, s)
s, log2 = req("PUT", f"/api/daily-logs/{today}", {"notes": "E2E test - today", "minutes": 30})
check(f"PUT daily-log {today} -> 200", s == 200, s)
check("two consecutive logs -> streak 2", log2.get("streak_at_end") == 2, log2.get("streak_at_end"))
s, getlog = req("GET", f"/api/daily-logs/{today}")
check("GET daily-log returns saved notes", getlog.get("notes") == "E2E test - today", getlog.get("notes"))
# update existing log
s, upd = req("PUT", f"/api/daily-logs/{today}", {"notes": "E2E test - edited", "minutes": 45})
check("re-PUT same date updates (no duplicate)", s == 200 and upd.get("minutes") == 45, upd.get("minutes"))
s, alllogs = req("GET", "/api/daily-logs")
check("daily-logs list has exactly 2 entries", len(alllogs) == 2, len(alllogs))

print("\n=== B6. EDGE CASES ===")
s, _ = req("POST", "/api/activities/99999/attempts", {})
check("attempt on missing activity -> 404", s == 404, s)
s, _ = req("POST", f"/api/vocabulary/{due[20]['id']}/review", {"grade": 5})
check("review grade 5 -> 422", s == 422, s)
s, _ = req("POST", f"/api/vocabulary/{due[20]['id']}/review", {"grade": 0})
check("review grade 0 -> 422", s == 422, s)
s, _ = req("PUT", "/api/daily-logs/not-a-date", {"notes": "x", "minutes": 1})
check("daily-log bad date -> 400", s == 400, s)
s, _ = req("GET", "/api/modules/MOD-001/progress")
check("module progress endpoint stable after writes", s == 200, s)

print("\n=== B7. PROGRESS REFLECTS THE WRITES ===")
s, prog = req("GET", "/api/progress")
check("progress endpoint ok", s == 200)
s, stats = req("GET", "/api/vocabulary/stats")
reviewed = stats["learning"] + stats["review"] + stats["mature"]
check("vocabulary shows reviewed cards", reviewed >= 4, f"reviewed={reviewed} {stats}")
s, mods = req("GET", "/api/modules")
done = [m["module_id"] for m in mods if m["percent_complete"] == 1.0]
check("2 modules at 100% (MOD-001, MOD-005)", sorted(done) == ["MOD-001", "MOD-005"], done)

print("\n" + "=" * 52)
print(f"PHASE B RESULT: {len(passes)} passed, {len(fails)} failed")
if fails:
    print("FAILURES:")
    for f in fails: print("  X " + f)
print("=" * 52)
sys.exit(1 if fails else 0)
