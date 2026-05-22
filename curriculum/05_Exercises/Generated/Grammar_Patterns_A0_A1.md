---
title: Grammar Pattern Registry — A0/A1
type: grammar-pattern-registry
status: draft
cefr_band: A0-A1
covers_modules: [MOD-001, MOD-002, MOD-003, MOD-004, MOD-005]
created: 2026-05-19
updated: 2026-05-19
total_patterns: 18
tags: [grammar, patterns, registry, A0, A1, generated]
---

# Grammar Pattern Registry — A0/A1 (Levels 1–10)

> Single source of truth for grammar pattern slugs used across MOD-001 through MOD-005.
> Each module references patterns by `slug`; the registry holds the canonical definition.
>
> Per [[../../03_Curriculum/Module_Template]] §18 open question and [[../../00_Project/NEXT_PHASE_PLAN]] Step 5: the registry lives here (not per-module).

---

## Schema

Every entry has the following fields. The app's vault indexer parses them as a structured table.

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| `slug` | string | yes | Unique, kebab-case, stable. Pattern: `[a-z-]+`. |
| `name_en` | string | yes | Human-readable English name. |
| `pienemann_stage` | integer 1–10 | yes | Pienemann (1998) processability stage. |
| `cefr_band` | enum | yes | `A0-A1` / `A1-A2` / `A2-B1` / `B1-B2`. |
| `module_introduced` | string | yes | Where the pattern is **drilled** (not previewed). |
| `dutch_pattern` | string | yes | Schema-style description (`[X] + [Y] + [Z]`). |
| `english_meaning` | string | yes | Plain-English summary. |
| `spanish_contrast` | string | optional | Where Spanish-L1 would mislead. Only if useful. |
| `examples` | string[] | yes | 2–4 example sentences in Dutch + English gloss. |
| `common_mistake` | string | yes | Most-likely Juanpa-specific error. |
| `practice_activity` | string | yes | One concrete drill activity. |
| `srs_cloze_candidate` | bool | yes | If true, the pattern generates cloze cards (1–3 per pattern). |
| `tags` | string[] | yes | Includes `pienemann:N`, `module:MOD-NNN`, domain tags. |

---

## Patterns

### 1. `ik-heet`

| Field | Value |
|-------|-------|
| **slug** | `ik-heet` |
| **name_en** | Saying your name with *heten* |
| **pienemann_stage** | 1 (formulaic chunk) |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-002_Dutch_Sounds_and_Greetings]] |
| **dutch_pattern** | `[subject] + [heten-form] + [name]` |
| **english_meaning** | "My name is X" — literally "I am called X". |
| **spanish_contrast** | Spanish *yo me llamo* is reflexive (uses *me*). Dutch *heten* is **not** reflexive. Drop the *me*. |
| **examples** | *Ik heet Juan.* / *Hij heet Pieter.* / *Hoe heet jij?* |
| **common_mistake** | Adding *me* (Spanish-L1 transfer): `*Ik me heet Juan` is ungrammatical. |
| **practice_activity** | Cued production: 5 different subject pronouns + the correct *heten*-form. |
| **srs_cloze_candidate** | true |

### 2. `present-tense-zijn-hebben`

| Field | Value |
|-------|-------|
| **slug** | `present-tense-zijn-hebben` |
| **name_en** | Present tense of *zijn* (to be) and *hebben* (to have) |
| **pienemann_stage** | 2 (irregular high-frequency verbs in canonical SVO) |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-003_I_Am_You_Are]] (zijn), [[../../03_Curriculum/Modules/MOD-004_Nouns_De_Het_and_Core_Objects]] (hebben) |
| **dutch_pattern** | `[pron] + [zijn/hebben-form] + [rest]` |
| **english_meaning** | "I am / you are / he is / we are / …"; "I have / you have / …". |
| **spanish_contrast** | Spanish has *ser* and *estar* — Dutch has one *zijn*. Decision relief (D-001). |
| **examples** | *Ik ben Colombiaans.* / *Hij is leraar.* / *Wij hebben een huis.* / *Heb jij een broer?* |
| **common_mistake** | Forgetting `-t` ending on `jij/hij/zij` (`*hij is werken` instead of `hij werkt`); confusing inversion: `*Hebt jij…?` (should be `Heb jij…?`). |
| **practice_activity** | Six-person conjugation drill, recorded. Then 10 cued fill-ins (5 per verb). |
| **srs_cloze_candidate** | true |

### 3. `present-tense-regular`

| Field | Value |
|-------|-------|
| **slug** | `present-tense-regular` |
| **name_en** | Regular present-tense verbs |
| **pienemann_stage** | 2 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-005_Basic_Sentences_and_Questions]] |
| **dutch_pattern** | `[subject] + [stem(+t/+en)] + [rest]` |
| **english_meaning** | Standard regular conjugation: stem (ik), stem+t (jij/u/hij/zij/het), stem+en (wij/jullie/zij-pl). |
| **spanish_contrast** | Spanish has 3 conjugation classes (-ar, -er, -ir); Dutch has one regular pattern. Easier. |
| **examples** | *Ik werk.* / *Jij werkt.* / *Hij werkt.* / *Wij werken.* / *Werk jij in Bogotá?* |
| **common_mistake** | Double `-t` on stems ending in `-t` (`*zitt`; should be `zit`). Dropping the `-t` in inversion only for `jij`, not for `hij` (`Werkt hij?` is correct, `*Werk hij?` is wrong). |
| **practice_activity** | Build 10 sentences from a verb pool, varying the subject. |
| **srs_cloze_candidate** | true |

### 4. `ik-kom-uit`

| Field | Value |
|-------|-------|
| **slug** | `ik-kom-uit` |
| **name_en** | Saying where you're from |
| **pienemann_stage** | 1 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-003_I_Am_You_Are]] |
| **dutch_pattern** | `[subject] + [komen-form] + uit + [country]` |
| **english_meaning** | "I come from X." |
| **spanish_contrast** | Spanish *Soy de X*. Dutch uses motion verb *komen* + *uit* (preposition), not the "to be" verb. |
| **examples** | *Ik kom uit Colombia.* / *Zij komt uit Spanje.* / *Waar kom jij vandaan?* |
| **common_mistake** | Calque from Spanish: `*Ik ben uit Colombia.` Heard as foreign. |
| **practice_activity** | 5 different countries + 5 different subjects + matching *komen* forms. |
| **srs_cloze_candidate** | true |

### 5. `ik-spreek`

| Field | Value |
|-------|-------|
| **slug** | `ik-spreek` |
| **name_en** | Saying which languages you speak |
| **pienemann_stage** | 2 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-003_I_Am_You_Are]] |
| **dutch_pattern** | `[subject] + [spreken-form] + [language]` |
| **english_meaning** | "I speak X." |
| **spanish_contrast** | Spanish *Hablo español*. Dutch *Ik spreek Spaans*. Direct parallel; no traps. |
| **examples** | *Ik spreek Spaans en Engels.* / *Hij spreekt Portugees.* / *Spreek jij Nederlands?* |
| **common_mistake** | Capitalizing language names (Dutch *Spaans/Engels* are lowercase as adjectives but capitalize as proper nouns when used as the name of the language — modern usage is mixed; *Spaans/Engels/Nederlands* usually capitalized in writing). |
| **practice_activity** | List your 3 languages + ask a partner about theirs. |
| **srs_cloze_candidate** | true |

### 6. `dit-is-dat-is`

| Field | Value |
|-------|-------|
| **slug** | `dit-is-dat-is` |
| **name_en** | "This is / That is" + noun phrase |
| **pienemann_stage** | 1 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-003_I_Am_You_Are]] (formulaic) → [[../../03_Curriculum/Modules/MOD-004_Nouns_De_Het_and_Core_Objects]] (analyzed) |
| **dutch_pattern** | `dit/dat + is + [NP]` |
| **english_meaning** | "This/that is …". |
| **spanish_contrast** | Spanish *esto/eso* maps cleanly. No trap. |
| **examples** | *Dit is mijn vriend.* / *Dat is een Nederlander.* / *Dit is het boek.* |
| **common_mistake** | Confusing `dit/dat` (used with *het*-nouns) vs `deze/die` (used with *de*-nouns) — drilled later. |
| **practice_activity** | Point at 5 objects in your room; produce *Dit is de/het ___.* for each. |
| **srs_cloze_candidate** | true |

### 7. `v2-main-clause`

| Field | Value |
|-------|-------|
| **slug** | `v2-main-clause` |
| **name_en** | V2 word order in main clauses |
| **pienemann_stage** | 3–4 (acquisition order; emerges after stable canonical SVO) |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-005_Basic_Sentences_and_Questions]] |
| **dutch_pattern** | `[Element 1] + [V-finite] + [Subject if not in 1] + [...rest...]` |
| **english_meaning** | Finite verb always in second position, regardless of what fronts. |
| **spanish_contrast** | Spanish allows *Hoy yo trabajo en Bogotá* (Adv + Subj + V). Dutch must be *Vandaag werk ik in Bogotá* (Adv + V + Subj). This is the **first big Spanish-L1 trap**. |
| **examples** | *Ik werk in Bogotá.* / *Vandaag werk ik in Bogotá.* / *Hier werk ik in Bogotá.* / *Koffie drink ik 's ochtends.* |
| **common_mistake** | Spanish-L1 transfer: `*Vandaag ik werk in Bogotá.` Stage-3 learners typically produce this; stage-4 fix it. |
| **practice_activity** | Transformation drill: rewrite 10 SV sentences with adverb fronting. |
| **srs_cloze_candidate** | true |

### 8. `question-yes-no`

| Field | Value |
|-------|-------|
| **slug** | `question-yes-no` |
| **name_en** | Yes/no questions via subject-verb inversion |
| **pienemann_stage** | 3 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-005_Basic_Sentences_and_Questions]] |
| **dutch_pattern** | `[V-fin] + [Subject] + [rest]?` |
| **english_meaning** | Move the finite verb to position 1 to form a yes/no question. |
| **spanish_contrast** | Spanish marks questions via intonation alone (*¿Trabajas en Bogotá?*). Dutch requires inversion. |
| **examples** | *Werk jij in Bogotá?* / *Heb jij een broer?* / *Is hij Colombiaans?* |
| **common_mistake** | Forgetting to drop `-t` from `jij`-form in inversion: `*Werkt jij in Bogotá?` (should be `Werk jij?`). Note: `hij/zij/het`-forms keep their `-t` in inversion. |
| **practice_activity** | 10 statements → flip each to a yes/no question. |
| **srs_cloze_candidate** | true |

### 9. `question-word`

| Field | Value |
|-------|-------|
| **slug** | `question-word` |
| **name_en** | *Wh-*questions |
| **pienemann_stage** | 3 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-005_Basic_Sentences_and_Questions]] |
| **dutch_pattern** | `[Q-word] + [V-fin] + [Subject] + [rest]?` |
| **english_meaning** | Q-word fills position 1; V2 word order applies. |
| **spanish_contrast** | Spanish allows *¿Por qué tú estudias holandés?* (Q + Subj + V). Dutch requires V2: *Waarom leer jij Nederlands?* (Q + V + Subj). |
| **examples** | *Wie ben jij?* / *Wat doet hij?* / *Waar woon je?* / *Wanneer kom je?* / *Hoe gaat het?* / *Hoeveel broers heb je?* / *Waarom leer je Nederlands?* |
| **common_mistake** | Spanish-L1: keeping subject before verb. `*Wat hij doet?` instead of `Wat doet hij?`. |
| **practice_activity** | One *wh-*question per word, all 7 question words covered. |
| **srs_cloze_candidate** | true |

### 10. `negation-niet-geen`

| Field | Value |
|-------|-------|
| **slug** | `negation-niet-geen` |
| **name_en** | Basic negation: *niet* vs *geen* |
| **pienemann_stage** | 2 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-005_Basic_Sentences_and_Questions]] (introduced; consolidated in MOD-006+) |
| **dutch_pattern** | `[subject] + [V-fin] + ... niet` (verb/adj/adv negation) OR `[subject] + [V-fin] + geen + [N]` (indefinite-noun negation) |
| **english_meaning** | *Niet* = "not" (negates everything except indefinite noun phrases). *Geen* = "no, none" (negates indefinite noun phrases). |
| **spanish_contrast** | Spanish *no* covers both meanings. Dutch makes the distinction. Mapping: *Yo no tengo hermano* → *Ik heb geen broer.* (Not *niet broer*.) |
| **examples** | *Ik werk niet vandaag.* / *Hij is niet Colombiaans.* / *Ik heb geen broer.* / *Wij hebben geen koffie.* |
| **common_mistake** | Using `niet` before indefinite nouns: `*Ik heb niet een broer.` (should be `Ik heb geen broer.`). Definite-article nouns and proper nouns take *niet*, not *geen*. |
| **practice_activity** | 10 statements: half need *niet*, half need *geen*. Pick correctly. |
| **srs_cloze_candidate** | true |

### 11. `de-het-article`

| Field | Value |
|-------|-------|
| **slug** | `de-het-article` |
| **name_en** | Definite article assignment (de / het) |
| **pienemann_stage** | 1 (lexical, learned per noun) |
| **cefr_band** | A0-A1 (begins; never fully graduates) |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-004_Nouns_De_Het_and_Core_Objects]] |
| **dutch_pattern** | `de + [common-gender N]` / `het + [neuter-gender N]` |
| **english_meaning** | "the X" — with one of two genders, mostly unpredictable. |
| **spanish_contrast** | Spanish has *el/la* (masc/fem) and Dutch has *de/het* (common/neuter). Spanish gender is mostly predictable from word ending; Dutch gender is mostly unpredictable. **Memorize article with the noun.** |
| **examples** | *de stoel, de tafel, de hand, de moeder* (de-nouns) / *het huis, het bed, het kind, het boek* (het-nouns) |
| **common_mistake** | Defaulting to *de* (since it's ~70%). Especially mistakes on `het huis, het boek, het bed, het kind` — high-frequency het-nouns. |
| **practice_activity** | Article-assignment drill: 30 nouns shown without article; pick de/het. |
| **srs_cloze_candidate** | true (every noun card carries article on the front per D-008) |

### 12. `plural-formation`

| Field | Value |
|-------|-------|
| **slug** | `plural-formation` |
| **name_en** | Plural formation: `-en` vs `-s` |
| **pienemann_stage** | 2 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-004_Nouns_De_Het_and_Core_Objects]] |
| **dutch_pattern** | `[N]-en` (most native) / `[N]-s` (loanwords; -el/-en/-er/-je endings; vowel-final) |
| **english_meaning** | Standard plural inflection. |
| **spanish_contrast** | Spanish uses `-s/-es` only. Dutch defaults to `-en`. |
| **examples** | *huis → huizen, boek → boeken, kind → kinderen* (irregular) / *tafel → tafels, kamer → kamers, koffie → koffies, meisje → meisjes* |
| **common_mistake** | Spanish-L1 default of `-s` everywhere: `*huises, *boeks`. Also: forgetting consonant doubling (`bed → bedden`, not `*bedn`) and long-vowel collapse (`huis → huizen`, not `*huisen`). |
| **practice_activity** | 10 nouns → form plurals. Mix of `-en` and `-s` types. |
| **srs_cloze_candidate** | true |

### 13. `noun-phrase-een`

| Field | Value |
|-------|-------|
| **slug** | `noun-phrase-een` |
| **name_en** | Indefinite noun phrases with *een* |
| **pienemann_stage** | 1 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-004_Nouns_De_Het_and_Core_Objects]] |
| **dutch_pattern** | `een + [N]` (singular indefinite) |
| **english_meaning** | "a / an + N". One form for all genders. |
| **spanish_contrast** | Spanish *un/una* (masc/fem) is gender-marked. Dutch *een* is gender-neutral. Easier. |
| **examples** | *een huis, een stoel, een kind, een Nederlander* |
| **common_mistake** | Confusing reduced indefinite *een* (`/ən/`) with the number *één* (`/eːn/`, "one"). Same spelling, different pronunciation. |
| **practice_activity** | Convert 10 definite NPs to indefinite (`de stoel → een stoel`). |
| **srs_cloze_candidate** | false (lexically trivial) |

### 14. `modal-kunnen-willen`

| Field | Value |
|-------|-------|
| **slug** | `modal-kunnen-willen` |
| **name_en** | Modals: *kunnen* (can) and *willen* (want) |
| **pienemann_stage** | 3 |
| **cefr_band** | A0-A1 |
| **module_introduced** | Previewed in MOD-005; fully drilled in MOD-014 / MOD-015 per [[../../03_Curriculum/A0_A1_Roadmap]]. |
| **dutch_pattern** | `[Subj] + [modal-fin] + [...] + [infinitive]` (infinitive at clause end) |
| **english_meaning** | Modal + bare infinitive; the infinitive moves to the end of the clause. |
| **spanish_contrast** | Spanish *quiero hablar* keeps verbs adjacent. Dutch separates: *Ik wil Nederlands spreken.* |
| **examples** | *Ik kan Nederlands spreken.* / *Hij wil koffie drinken.* / *Wij kunnen vandaag werken.* |
| **common_mistake** | Keeping infinitive adjacent to modal: `*Ik wil spreken Nederlands.` |
| **practice_activity** | Combine 5 modals + 5 main verbs into 10 correct sentences. |
| **srs_cloze_candidate** | true |

### 15. `future-gaan-infinitive`

| Field | Value |
|-------|-------|
| **slug** | `future-gaan-infinitive` |
| **name_en** | Near future with *gaan* + infinitive |
| **pienemann_stage** | 3 |
| **cefr_band** | A0-A1 |
| **module_introduced** | Previewed in MOD-005; fully drilled in MOD-019 per [[../../03_Curriculum/A0_A1_Roadmap]]. |
| **dutch_pattern** | `[Subj] + [gaan-fin] + [...] + [infinitive]` |
| **english_meaning** | Near future "going to X". |
| **spanish_contrast** | Spanish *voy a hablar* uses preposition *a*. Dutch uses no preposition: *Ik ga praten.* |
| **examples** | *Ik ga morgen werken.* / *Wij gaan koffie drinken.* / *Hij gaat Nederlands leren.* |
| **common_mistake** | Adding a preposition: `*Ik ga te werken` or `*Ik ga om te werken`. |
| **practice_activity** | Convert 5 present-tense statements into near-future. |
| **srs_cloze_candidate** | true |

### 16. `adjective-predicative`

| Field | Value |
|-------|-------|
| **slug** | `adjective-predicative` |
| **name_en** | Predicative adjectives (after *zijn*) |
| **pienemann_stage** | 2 |
| **cefr_band** | A0-A1 |
| **module_introduced** | Used informally from MOD-003; recognized as a pattern from MOD-004. |
| **dutch_pattern** | `[Subj] + [zijn-fin] + [adj-base-form]` |
| **english_meaning** | Adjective in citation form (no ending) when used predicatively. |
| **spanish_contrast** | Spanish adjectives agree in gender/number (*alto/alta/altos/altas*). Dutch predicative adjectives are invariant. Easier. |
| **examples** | *Het huis is groot.* / *De stoel is mooi.* / *De kinderen zijn klein.* |
| **common_mistake** | Adding `-e` to predicative adjectives. `*Het huis is grote.` is wrong. `-e` only attaches in attributive position (next pattern). |
| **practice_activity** | 8 sentences: noun + *zijn* + adjective. Keep adjective base-form. |
| **srs_cloze_candidate** | false |

### 17. `adjective-attributive`

| Field | Value |
|-------|-------|
| **slug** | `adjective-attributive` |
| **name_en** | Attributive adjectives — the *-e* rule |
| **pienemann_stage** | 3 |
| **cefr_band** | A0-A1 |
| **module_introduced** | Previewed in MOD-004; fully drilled in MOD-017 per [[../../03_Curriculum/A0_A1_Roadmap]]. |
| **dutch_pattern** | `[article/det] + [adj+e] + [N]` — with one exception: `een + [adj-base] + [het-noun]` keeps the adjective uninflected. |
| **english_meaning** | Most attributive adjectives get *-e* in Dutch. The exception: *een* + adjective + het-noun → no *-e*. |
| **spanish_contrast** | Spanish agrees gender + number. Dutch agrees only on this one rule. Subtle for L2 learners. |
| **examples** | *het grote huis* / *de mooie stoel* / *een groot huis* (no -e, indefinite + het-noun!) / *een grote stoel* (-e, indefinite + de-noun) |
| **common_mistake** | Forgetting the *een + het-noun* exception. |
| **practice_activity** | 10 noun phrases. Decide adjective ending. Half are exception triggers. |
| **srs_cloze_candidate** | true |

### 18. `ik-woon-in`

| Field | Value |
|-------|-------|
| **slug** | `ik-woon-in` |
| **name_en** | Saying where you live |
| **pienemann_stage** | 1 |
| **cefr_band** | A0-A1 |
| **module_introduced** | [[../../03_Curriculum/Modules/MOD-005_Basic_Sentences_and_Questions]] |
| **dutch_pattern** | `[Subj] + [wonen-form] + in/op/aan + [place]` |
| **english_meaning** | "I live in X." |
| **spanish_contrast** | Spanish *vivo en X*. Dutch uses *in* (cities, countries) or *op* (islands, certain places) or *aan* (rivers/coasts). Initially: default to *in*. |
| **examples** | *Ik woon in Bogotá.* / *Hij woont in Nederland.* / *Wij wonen in Amsterdam.* |
| **common_mistake** | Spanish-L1: *Ik leef in Bogotá* (calque from *vivo*). Dutch *leven* = "to be alive"; for residence, use *wonen*. |
| **practice_activity** | Where do you live? Where do 5 different people live? Use *wonen*. |
| **srs_cloze_candidate** | true |

---

## Pattern Index (by Module)

| Module | Patterns drilled |
|--------|------------------|
| MOD-001 | (none — pronunciation only; chunks previewed) |
| MOD-002 | `ik-heet` |
| MOD-003 | `present-tense-zijn-hebben` (zijn), `ik-kom-uit`, `ik-spreek`, `dit-is-dat-is`, `adjective-predicative` |
| MOD-004 | `de-het-article`, `present-tense-zijn-hebben` (hebben), `plural-formation`, `noun-phrase-een` |
| MOD-005 | `v2-main-clause`, `question-yes-no`, `question-word`, `present-tense-regular`, `negation-niet-geen`, `ik-woon-in` |
| MOD-014 (later) | `modal-kunnen-willen` |
| MOD-017 (later) | `adjective-attributive` |
| MOD-019 (later) | `future-gaan-infinitive` |

---

## Schema Mapping to SQLite

The `grammar_topics` table in [[../../08_App_Architecture/Database_Schema]] accommodates this registry without modification:

| Registry field | DB column |
|----------------|-----------|
| `slug` | `slug` (UNIQUE) |
| `name_en` | `title` |
| `cefr_band` | `level_code` (mapped to canonical CEFR letter) |
| (this file's path) | `vault_path` |
| `module_introduced` | derivable from module's `grammar_pattern_slugs` frontmatter |

Mastery (`grammar_topics.mastery`) is a rolling EMA computed from `activity_attempts` where the activity payload references one of these slugs.

---

## Cross-References

- [[../../03_Curriculum/Modules/MOD-001_First_Contact]] through [[../../03_Curriculum/Modules/MOD-005_Basic_Sentences_and_Questions]]
- [[Vocabulary_Seed_A0_A1]] — vocabulary seed that complements this registry.
- [[../../03_Curriculum/Module_Template]] §4 — grammar focus section in module files.
- [[../../03_Curriculum/A0_A1_Roadmap]] — full A0-A1 phase plan.
- [[../../08_App_Architecture/Database_Schema]] — `grammar_topics` table.
- [[../../01_Research/04_curriculum_design_from_a0_to_b2]] §11 — Pienemann sequencing principle.

---

## Open Items

- [ ] **Patterns 14, 15, 17** are listed here for forward-completeness but their full drilling lives in MOD-014, MOD-017, MOD-019 respectively. Slugs are reserved.
- [ ] **Numbering A0-A1 patterns 1–18 is suggestive** — slugs are the stable identifier, not numbers.
- [ ] **Mastery thresholds** for declaring a pattern "controlled" not yet defined; recommend rolling EMA ≥ 0.80 with at least 10 attempts (decision to be made in Phase 3 alongside `grammar_topics.mastery` computation logic).
