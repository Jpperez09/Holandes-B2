"""E2E Phase A — non-destructive backend + content-integrity sweep.
Hits every read endpoint and validates the data. Mutates nothing."""
import json, urllib.request, sys

BASE = "http://127.0.0.1:8787"
passes, fails, warns = [], [], []

def get(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return r.status, json.loads(r.read().decode())

def check(name, cond, detail=""):
    (passes if cond else fails).append(name + (" :: " + detail if detail and not cond else ""))
    print(("  PASS " if cond else "  FAIL ") + name + ("" if cond else "  -> " + detail))

def warn(name, detail=""):
    warns.append(name + " :: " + detail)
    print("  WARN " + name + ("  -> " + detail if detail else ""))

print("\n=== 1. HEALTH ===")
s, d = get("/api/health"); check("GET /api/health ok", s==200 and d.get("ok") is True)
s, d = get("/api/health/db"); check("GET /api/health/db ok", s==200 and d.get("ok") is True, str(d))
check("DB integrity = ok", d.get("integrity")=="ok", str(d.get("integrity")))
check("migrations applied >=2", len(d.get("migrations",[]))>=2, str(d.get("migrations")))

print("\n=== 2. SETTINGS ===")
s, settings = get("/api/settings")
check("GET /api/settings ok", s==200)
for k in ["vault_path","user_name","daily_goal_minutes","current_level","target_level"]:
    check(f"settings has '{k}'", k in settings, str(list(settings.keys())))

print("\n=== 3. LEVELS ===")
s, levels = get("/api/levels")
check("GET /api/levels ok", s==200)
check("5 levels", len(levels)==5, f"got {len(levels)}")
for lv in levels:
    code = lv.get("code")
    s2, one = get(f"/api/levels/{code}")
    check(f"GET /api/levels/{code}", s2==200 and one.get("code")==code)
    s3, un = get(f"/api/levels/{code}/unlock-state")
    check(f"unlock-state /api/levels/{code}", s3==200 and "unlocked" in un)

print("\n=== 4. MODULES (list) ===")
s, modules = get("/api/modules")
check("GET /api/modules ok", s==200)
check("5 modules", len(modules)==5, f"got {len(modules)}")
ids = sorted(m["module_id"] for m in modules)
check("modules are MOD-001..005", ids==["MOD-001","MOD-002","MOD-003","MOD-004","MOD-005"], str(ids))
for m in modules:
    check(f"{m['module_id']} has title", bool(m.get("title")), repr(m.get("title")))
    check(f"{m['module_id']} sort_order set", isinstance(m.get("sort_order"),int))
    check(f"{m['module_id']} percent 0..1", 0<=m.get("percent_complete",-1)<=1, str(m.get("percent_complete")))
    if not m.get("estimated_minutes"): warn(f"{m['module_id']} no estimated_minutes")
    if not m.get("cefr_band"): warn(f"{m['module_id']} no cefr_band")

print("\n=== 5. MODULE DETAIL (each of 5) ===")
total_activities = 0
total_vocab_in_modules = 0
for m in modules:
    mid = m["module_id"]
    s, det = get(f"/api/modules/{mid}")
    check(f"GET /api/modules/{mid}", s==200)
    acts = det.get("activities",[])
    voc = det.get("vocabulary",[])
    total_activities += len(acts)
    total_vocab_in_modules += len(voc)
    check(f"{mid} has activities", len(acts)>0, f"{len(acts)} activities")
    # activity integrity
    for a in acts:
        if not a.get("title"): fails.append(f"{mid} activity {a.get('id')} empty title")
        if not a.get("type"): fails.append(f"{mid} activity {a.get('id')} empty type")
        if a.get("id") is None: fails.append(f"{mid} activity has no id")
    valid_types = {"vocab","grammar","reading","listening","writing","freeform"}
    bad = [a["type"] for a in acts if a.get("type") not in valid_types]
    check(f"{mid} all activity types valid", not bad, f"unexpected: {bad}")
    # vocab integrity
    for v in voc:
        if not v.get("lemma"): fails.append(f"{mid} vocab {v.get('id')} empty lemma")
        if not v.get("translation_en"): warn(f"{mid} vocab '{v.get('lemma')}' no EN translation")
        if not v.get("tts_text"): warn(f"{mid} vocab '{v.get('lemma')}' no tts_text")
    s2, prog = get(f"/api/modules/{mid}/progress")
    check(f"GET /api/modules/{mid}/progress", s2==200 and "percent_complete" in prog)
    print(f"    {mid}: {len(acts)} activities, {len(voc)} vocab")
check("total activities = 39", total_activities==39, f"got {total_activities}")

print("\n=== 6. VOCABULARY ===")
s, vlist = get("/api/vocabulary")
check("GET /api/vocabulary ok", s==200)
items = vlist.get("items",[])
check("vocabulary total = 130", vlist.get("total")==130, f"got {vlist.get('total')}")
# integrity over ALL vocab
s, allv = get("/api/vocabulary?limit=500")
allitems = allv.get("items",[])
check("fetched all 130 vocab", len(allitems)==130, f"got {len(allitems)}")
no_en = [v["lemma"] for v in allitems if not v.get("translation_en")]
no_tts = [v["lemma"] for v in allitems if not v.get("tts_text")]
no_ipa = [v["lemma"] for v in allitems if not v.get("ipa")]
check("every vocab has EN translation", not no_en, f"missing: {no_en[:5]}")
check("every vocab has tts_text", not no_tts, f"missing: {no_tts[:5]}")
if no_ipa: warn("vocab missing IPA", f"{len(no_ipa)} items: {no_ipa[:5]}")
# nouns should have article
nouns_no_article = [v["lemma"] for v in allitems if v.get("pos")=="noun" and not v.get("article")]
if nouns_no_article: warn("nouns without article", f"{len(nouns_no_article)}: {nouns_no_article[:8]}")
s, due = get("/api/vocabulary/due")
check("GET /api/vocabulary/due ok", s==200 and isinstance(due,list))
check("due queue <= 50 (documented cap)", len(due)<=50, f"got {len(due)}")
s, stats = get("/api/vocabulary/stats")
check("GET /api/vocabulary/stats ok", s==200)
tot = sum(stats.get(k,0) for k in ["new","learning","review","mature","suspended","archived"])
check("vocab stats sum to 130", tot==130, f"sum={tot} {stats}")

print("\n=== 7. VAULT DIAGNOSTICS ===")
s, snap = get("/api/vault/snapshot")
check("GET /api/vault/snapshot ok", s==200)
c = snap.get("counts",{})
check("snapshot: 5 modules", c.get("modules")==5)
check("snapshot: 130 vocab", c.get("vocabulary")==130)
check("snapshot: 18 grammar", c.get("grammar_patterns")==18)
s, gp = get("/api/vault/grammar-patterns")
check("GET /api/vault/grammar-patterns ok", s==200)
check("18 grammar patterns", len(gp.get("items",[]))==18, f"got {len(gp.get('items',[]))}")
s, wn = get("/api/vault/warnings")
warnings = wn.get("warnings",[])
print(f"    parser warnings: {len(warnings)}")
for w in warnings:
    warn("parser warning", f"[{w.get('severity')}] {w.get('code')}: {w.get('message','')[:90]}")
# vault module bodies
for m in modules:
    s, vm = get(f"/api/vault/modules/{m['module_id']}")
    check(f"vault body {m['module_id']}", s==200 and len(vm.get("body",""))>200, f"body len {len(vm.get('body',''))}")

print("\n=== 8. TODAY / PROGRESS / DAILY-LOGS ===")
s, today = get("/api/today")
check("GET /api/today ok", s==200 and "slots" in today)
s, prog = get("/api/progress")
check("GET /api/progress ok", s==200 and "skillScores" in prog)
s, logs = get("/api/daily-logs")
check("GET /api/daily-logs ok", s==200 and isinstance(logs,list))

print("\n=== 9. ERROR HANDLING (read-only) ===")
try:
    get("/api/modules/MOD-999")
    check("unknown module -> 404", False, "expected 404")
except urllib.error.HTTPError as e:
    check("unknown module -> 404", e.code==404, f"got {e.code}")
try:
    get("/api/vocabulary/99999")
    check("unknown vocab -> 404", False, "expected 404")
except urllib.error.HTTPError as e:
    check("unknown vocab -> 404", e.code==404, f"got {e.code}")
try:
    get("/api/activities/abc")
    check("non-numeric activity id -> 400", False)
except urllib.error.HTTPError as e:
    check("non-numeric activity id -> 400", e.code==400, f"got {e.code}")

print("\n" + "="*50)
print(f"PHASE A RESULT: {len(passes)} passed, {len(fails)} failed, {len(warns)} warnings")
if fails:
    print("\nFAILURES:")
    for f in fails: print("  X " + f)
print("="*50)
sys.exit(1 if fails else 0)
