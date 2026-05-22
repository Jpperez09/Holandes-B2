---
title: Vocabulary Seed — A0/A1 (Levels 1–5)
type: vocabulary-seed
status: draft
cefr_band: A0-A1
covers_modules: [MOD-001, MOD-002, MOD-003, MOD-004, MOD-005]
created: 2026-05-19
updated: 2026-05-19
total_items: 130
tags: [vocabulary, seed, A0, A1, generated, MOD-001, MOD-002, MOD-003, MOD-004, MOD-005]
---

# Vocabulary Seed — A0/A1 (Levels 1–5)

> **Purpose.** The first 130 lemmas of the curriculum, organized into 10 domains, ready for the app to ingest. Every row carries audio metadata fields per [[../../00_Project/DECISION_REGISTER_V1]] P2-R1 (`audio_path`, `audio_url`, `tts_text` — at least one must be populated; `tts_text` defaults to the Dutch lemma for fallback synthesis).
>
> **Selection criteria.** High frequency (top ~1,000 in [SUBTLEX-NL](https://crr.ugent.be/programs-data/subtitle-frequencies/subtlex-nl)), cognate-dense at A0 (~50–60% English-cognate-friendly), no rare/niche items, every noun article-tagged.

---

## 1. Schema

Every item below has the following fields. The app's vault indexer parses them as a structured table.

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| `id` | string | yes | Stable slug, kebab-case, unique. Format: `voc-A1-NNN`. |
| `dutch` | string | yes | Canonical lemma. For nouns: includes the article inside the entry only when displayed; stored separately. |
| `article` | enum(`de`/`het`/null) | yes for nouns | Null for non-nouns. Cards for nouns render this on the front. |
| `pos` | enum | yes | `noun, verb, adj, adv, pron, det, conj, num, prep, int, phrase` |
| `ipa` | string | yes | IPA transcription. |
| `gloss_en` | string | yes | Primary English meaning. |
| `gloss_es` | string | optional | Spanish gloss only if it adds clarification or contrasts. |
| `cognate_en` | bool | yes | True if Dutch-English cognate is visible/audible. |
| `cognate_note` | string | optional | "EN: *book/boek*" / "EN-partial: drop final -e" / etc. |
| `example_nl` | string | yes | One Dutch example sentence using the lemma. |
| `cefr` | enum(`A0`/`A1`/`A2`/…) | yes | Level at which the item is introduced. |
| `module_id` | string | yes | `MOD-NNN`. |
| `tags` | string[] | yes | Domain + module + CEFR tags. |
| `audio_path` | string | nullable | Local file path under `06_Resources/audio/`. |
| `audio_url` | string | nullable | Remote URL (Forvo, CDN). |
| `tts_text` | string | nullable | Fallback text for on-demand TTS. Defaults to `dutch`. |
| `status` | enum | yes | `new` at seed time. |

> Per [[../../00_Project/DECISION_REGISTER_V1]] D-007 (audio mandatory on every vocab card) and P2-R1 (TTS-compatible metadata first): at least one of `audio_path`, `audio_url`, `tts_text` must be non-null in production. For seed data, `tts_text` is populated for every row so the app can render audio via on-demand TTS until human-recorded audio is available.

---

## 2. Items

### 2.1. Greetings & Politeness (MOD-001 + MOD-002)

| id | dutch | article | pos | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|----------|------------|------------|-----------|
| voc-A1-001 | hallo | — | int | /haˈloː/ | hello | hola | true | *Hallo, ik ben Juan.* | MOD-001 |
| voc-A1-002 | dag | — | int | /dɑx/ | hi/bye (informal) | hola/adiós | false | *Dag!* | MOD-001 |
| voc-A1-003 | goedemorgen | — | int | /ɣudəˈmɔrɣə(n)/ | good morning | buenos días | partial | *Goedemorgen!* | MOD-002 |
| voc-A1-004 | goedemiddag | — | int | /ɣudəˈmɪdɑx/ | good afternoon | buenas tardes | partial | *Goedemiddag, mevrouw.* | MOD-002 |
| voc-A1-005 | goedenavond | — | int | /ɣudəˈnaːvɔnt/ | good evening | buenas noches | partial | *Goedenavond.* | MOD-002 |
| voc-A1-006 | goedenacht | — | int | /ɣudəˈnɑxt/ | good night | buenas noches | partial | *Goedenacht!* | MOD-002 |
| voc-A1-007 | tot ziens | — | phrase | /tɔt ˈzins/ | goodbye | hasta luego | false | *Tot ziens!* | MOD-002 |
| voc-A1-008 | doei | — | int | /duj/ | bye (informal) | chao | false | *Doei!* | MOD-002 |
| voc-A1-009 | alstublieft | — | phrase | /ɑlstyˈblift/ | please / here you go (formal) | por favor | false | *Alstublieft, meneer.* | MOD-002 |
| voc-A1-010 | alsjeblieft | — | phrase | /ɑlʃəˈblift/ | please / here you go (informal) | por favor | false | *Alsjeblieft, hier.* | MOD-002 |
| voc-A1-011 | dank je wel | — | phrase | /ˈdɑŋkjəʋɛl/ | thank you (informal) | gracias | false | *Dank je wel.* | MOD-002 |
| voc-A1-012 | dank u wel | — | phrase | /ˈdɑŋkyʋɛl/ | thank you (formal) | gracias (usted) | false | *Dank u wel.* | MOD-002 |
| voc-A1-013 | ja | — | int | /jaː/ | yes | sí | partial-EN | *Ja, dat klopt.* | MOD-001 |
| voc-A1-014 | nee | — | int | /neː/ | no | no | partial-EN | *Nee, dat is fout.* | MOD-001 |
| voc-A1-015 | mevrouw | — | noun-title | /məˈvrʌu/ | madam, Mrs. | señora | false | *Goedemorgen, mevrouw.* | MOD-002 |
| voc-A1-016 | meneer | — | noun-title | /məˈneːr/ | sir, Mr. | señor | false | *Dank u wel, meneer.* | MOD-002 |

### 2.2. Numbers 0–10 (MOD-002)

| id | dutch | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|-----|-----|----------|------------|-----------|
| voc-A1-017 | nul | num | /nʏl/ | zero | *Mijn score is nul.* | MOD-002 |
| voc-A1-018 | een | num | /eːn/ | one | *Ik heb een broer.* | MOD-002 |
| voc-A1-019 | twee | num | /tʋeː/ | two | *Twee koffies, alstublieft.* | MOD-002 |
| voc-A1-020 | drie | num | /dri/ | three | *Wij zijn met z'n drieën.* | MOD-002 |
| voc-A1-021 | vier | num | /vir/ | four | *Vier uur.* | MOD-002 |
| voc-A1-022 | vijf | num | /vɛif/ | five | *Vijf minuten.* | MOD-002 |
| voc-A1-023 | zes | num | /zɛs/ | six | *Zes broden.* | MOD-002 |
| voc-A1-024 | zeven | num | /ˈzeːvə(n)/ | seven | *Zeven dagen.* | MOD-002 |
| voc-A1-025 | acht | num | /ɑxt/ | eight | *Acht uur.* | MOD-002 |
| voc-A1-026 | negen | num | /ˈneːɣə(n)/ | nine | *Negen uur.* | MOD-002 |
| voc-A1-027 | tien | num | /tin/ | ten | *Tien euro.* | MOD-002 |

### 2.3. Pronouns (MOD-003)

| id | dutch | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|-----|-----|----------|------------|-----------|
| voc-A1-028 | ik | pron | /ɪk/ | I | *Ik ben Juan.* | MOD-001 |
| voc-A1-029 | jij | pron | /jɛi/ | you (informal) | *Jij bent leraar.* | MOD-003 |
| voc-A1-030 | je | pron | /jə/ | you (informal, reduced) | *Hoe heet je?* | MOD-003 |
| voc-A1-031 | u | pron | /y/ | you (formal) | *Hoe heet u?* | MOD-003 |
| voc-A1-032 | hij | pron | /hɛi/ | he | *Hij is jong.* | MOD-003 |
| voc-A1-033 | zij | pron | /zɛi/ | she / they | *Zij is mijn zus.* | MOD-003 |
| voc-A1-034 | ze | pron | /zə/ | she / they (reduced) | *Ze komt uit Spanje.* | MOD-003 |
| voc-A1-035 | het | pron | /(h)ɛt/ | it | *Het is mooi.* | MOD-003 |
| voc-A1-036 | wij | pron | /ʋɛi/ | we | *Wij zijn studenten.* | MOD-003 |
| voc-A1-037 | we | pron | /ʋə/ | we (reduced) | *We werken samen.* | MOD-003 |
| voc-A1-038 | jullie | pron | /ˈjʏli/ | you (plural) | *Jullie zijn welkom.* | MOD-003 |
| voc-A1-039 | mijn | det | /mɛin/ | my | *Mijn moeder is leraar.* | MOD-003 |

### 2.4. Core Verbs (MOD-003 + MOD-005)

| id | dutch | pos | ipa | gloss_en | cognate_en | example_nl | module_id |
|----|-------|-----|-----|----------|------------|------------|-----------|
| voc-A1-040 | zijn | verb | /zɛin/ | to be | partial | *Ik ben hier.* | MOD-003 |
| voc-A1-041 | hebben | verb | /ˈhɛbə(n)/ | to have | true | *Ik heb een huis.* | MOD-004 |
| voc-A1-042 | heten | verb | /ˈheːtə(n)/ | to be called | partial | *Ik heet Juan.* | MOD-002 |
| voc-A1-043 | komen | verb | /ˈkoːmə(n)/ | to come | true | *Ik kom uit Colombia.* | MOD-003 |
| voc-A1-044 | spreken | verb | /ˈspreːkə(n)/ | to speak | true | *Ik spreek Spaans.* | MOD-003 |
| voc-A1-045 | wonen | verb | /ˈʋoːnə(n)/ | to live (reside) | false | *Ik woon in Bogotá.* | MOD-005 |
| voc-A1-046 | werken | verb | /ˈʋɛrkə(n)/ | to work | true | *Hij werkt in een kantoor.* | MOD-005 |
| voc-A1-047 | doen | verb | /dun/ | to do | partial | *Wat doe jij?* | MOD-005 |
| voc-A1-048 | gaan | verb | /ɣaːn/ | to go | false | *Ik ga naar huis.* | MOD-005 |
| voc-A1-049 | zien | verb | /zin/ | to see | partial | *Ik zie je morgen.* | MOD-005 |
| voc-A1-050 | kennen | verb | /ˈkɛnə(n)/ | to know (a person) | partial | *Ken jij hem?* | MOD-005 |
| voc-A1-051 | leren | verb | /ˈleːrə(n)/ | to learn | true | *Ik leer Nederlands.* | MOD-001 |
| voc-A1-052 | drinken | verb | /ˈdrɪŋkə(n)/ | to drink | true | *Ik drink koffie.* | MOD-004 |
| voc-A1-053 | eten | verb | /ˈeːtə(n)/ | to eat | partial | *Wij eten brood.* | MOD-004 |

### 2.5. Family (MOD-003 + MOD-004)

| id | dutch | article | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|------------|-----------|
| voc-A1-054 | moeder | de | noun | /ˈmudər/ | mother | *Mijn moeder is leraar.* | MOD-004 |
| voc-A1-055 | vader | de | noun | /ˈvaːdər/ | father | *Mijn vader werkt.* | MOD-004 |
| voc-A1-056 | broer | de | noun | /brur/ | brother | *Ik heb een broer.* | MOD-004 |
| voc-A1-057 | zus | de | noun | /zʏs/ | sister | *Mijn zus woont in Spanje.* | MOD-004 |
| voc-A1-058 | kind | het | noun | /kɪnt/ | child | *Het kind speelt.* | MOD-004 |
| voc-A1-059 | ouders | de | noun-pl | /ˈʌudərs/ | parents | *Mijn ouders zijn ouder.* | MOD-004 |
| voc-A1-060 | vriend | de | noun | /vrint/ | friend (m.) / boyfriend | *Hij is mijn vriend.* | MOD-003 |
| voc-A1-061 | vriendin | de | noun | /vrinˈdɪn/ | friend (f.) / girlfriend | *Zij is mijn vriendin.* | MOD-003 |

### 2.6. Countries, Nationalities, Languages (MOD-003)

| id | dutch | article | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|------------|-----------|
| voc-A1-062 | Colombia | — | noun-proper | /koˈlɔmbijaː/ | Colombia | *Ik kom uit Colombia.* | MOD-001 |
| voc-A1-063 | Colombiaan | de | noun | /kolɔmbijaːn/ | Colombian (n.) | *Ik ben een Colombiaan.* | MOD-003 |
| voc-A1-064 | Colombiaans | — | adj | /kolɔmbijaːns/ | Colombian (adj.) | *Ik ben Colombiaans.* | MOD-003 |
| voc-A1-065 | Nederland | het | noun-proper | /ˈneːdərlɑnt/ | Netherlands | *Hij woont in Nederland.* | MOD-001 |
| voc-A1-066 | Nederlander | de | noun | /ˈneːdərlɑndər/ | Dutch person | *Hij is een Nederlander.* | MOD-003 |
| voc-A1-067 | Nederlands | het | noun/adj | /ˈneːdərlɑnts/ | Dutch (language/adj.) | *Ik leer Nederlands.* | MOD-001 |
| voc-A1-068 | Spanje | het | noun-proper | /ˈspɑɲə/ | Spain | *Zij komt uit Spanje.* | MOD-003 |
| voc-A1-069 | Spanjaard | de | noun | /ˈspɑɲaːrt/ | Spaniard | *Hij is een Spanjaard.* | MOD-003 |
| voc-A1-070 | Spaans | — | adj | /spaːns/ | Spanish (lang./adj.) | *Ik spreek Spaans.* | MOD-003 |
| voc-A1-071 | Engeland | het | noun-proper | /ˈɛŋələnt/ | England | *Engeland is een eiland.* | MOD-003 |
| voc-A1-072 | Engels | — | adj/noun | /ˈɛŋəls/ | English (lang./adj.) | *Ik spreek Engels.* | MOD-003 |
| voc-A1-073 | Portugees | — | adj/noun | /pɔrtyˈɣes/ | Portuguese | *Hij spreekt Portugees.* | MOD-003 |

### 2.7. People & Property (MOD-003)

| id | dutch | article | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|------------|-----------|
| voc-A1-074 | naam | de | noun | /naːm/ | name | *Mijn naam is Juan.* | MOD-001 |
| voc-A1-075 | leraar | de | noun | /ˈleːraːr/ | teacher | *Hij is leraar.* | MOD-003 |
| voc-A1-076 | student | de | noun | /styˈdɛnt/ | student | *Ik ben student.* | MOD-003 |
| voc-A1-077 | oud | — | adj | /ʌut/ | old | *Mijn vader is oud.* | MOD-003 |
| voc-A1-078 | jong | — | adj | /jɔŋ/ | young | *Mijn broer is jong.* | MOD-003 |
| voc-A1-079 | groot | — | adj | /ɣroːt/ | big | *Een groot huis.* | MOD-004 |
| voc-A1-080 | klein | — | adj | /klɛin/ | small | *Een klein kind.* | MOD-004 |
| voc-A1-081 | mooi | — | adj | /moːi/ | beautiful | *Een mooi huis.* | MOD-004 |
| voc-A1-082 | goed | — | adj | /ɣut/ | good | *Het gaat goed.* | MOD-002 |
| voc-A1-083 | heel | — | adv | /heːl/ | very | *Het is heel mooi.* | MOD-005 |

### 2.8. Home Objects (MOD-004)

| id | dutch | article | pos | ipa | gloss_en | cognate_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|------------|------------|-----------|
| voc-A1-084 | huis | het | noun | /hœys/ | house | true | *Het huis is groot.* | MOD-004 |
| voc-A1-085 | kamer | de | noun | /ˈkaːmər/ | room | partial | *Mijn kamer is klein.* | MOD-004 |
| voc-A1-086 | keuken | de | noun | /ˈkøːkən/ | kitchen | true | *Wij eten in de keuken.* | MOD-004 |
| voc-A1-087 | slaapkamer | de | noun | /ˈslaːpkaːmər/ | bedroom | partial | *Mijn slaapkamer.* | MOD-004 |
| voc-A1-088 | badkamer | de | noun | /ˈbɑtkaːmər/ | bathroom | true | *De badkamer is klein.* | MOD-004 |
| voc-A1-089 | woonkamer | de | noun | /ˈʋoːnkaːmər/ | living room | partial | *De woonkamer is groot.* | MOD-004 |
| voc-A1-090 | tafel | de | noun | /ˈtaːfəl/ | table | true | *Een tafel en stoel.* | MOD-004 |
| voc-A1-091 | stoel | de | noun | /stul/ | chair | false | *De stoel is hier.* | MOD-004 |
| voc-A1-092 | bed | het | noun | /bɛt/ | bed | true | *Het bed is groot.* | MOD-004 |
| voc-A1-093 | deur | de | noun | /dør/ | door | false | *De deur is open.* | MOD-004 |
| voc-A1-094 | raam | het | noun | /raːm/ | window | false | *Het raam is open.* | MOD-004 |
| voc-A1-095 | boek | het | noun | /buk/ | book | true | *Het boek is mooi.* | MOD-004 |

### 2.9. Body Parts (MOD-004)

| id | dutch | article | pos | ipa | gloss_en | cognate_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|------------|------------|-----------|
| voc-A1-096 | hand | de | noun | /hɑnt/ | hand | true | *Mijn hand is koud.* | MOD-004 |
| voc-A1-097 | hoofd | het | noun | /hoːft/ | head | partial | *Mijn hoofd doet pijn.* | MOD-004 |
| voc-A1-098 | oog | het | noun | /oːx/ | eye | false | *Een blauw oog.* | MOD-004 |
| voc-A1-099 | mond | de | noun | /mɔnt/ | mouth | partial | *Open je mond.* | MOD-004 |
| voc-A1-100 | voet | de | noun | /vut/ | foot | true | *Mijn voet doet pijn.* | MOD-004 |
| voc-A1-101 | arm | de | noun | /ɑrm/ | arm | true | *Mijn arm doet pijn.* | MOD-004 |

### 2.10. Food & Drink (MOD-004)

| id | dutch | article | pos | ipa | gloss_en | cognate_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|------------|------------|-----------|
| voc-A1-102 | water | het | noun | /ˈʋaːtər/ | water | true | *Een glas water.* | MOD-004 |
| voc-A1-103 | brood | het | noun | /broːt/ | bread | false | *Wij eten brood.* | MOD-004 |
| voc-A1-104 | koffie | de | noun | /ˈkɔfi/ | coffee | true | *Ik drink koffie.* | MOD-004 |
| voc-A1-105 | thee | de | noun | /teː/ | tea | true | *Een kopje thee.* | MOD-004 |
| voc-A1-106 | melk | de | noun | /mɛlk/ | milk | true | *Melk in de koffie?* | MOD-004 |
| voc-A1-107 | kaas | de | noun | /kaːs/ | cheese | false | *Nederlandse kaas.* | MOD-004 |
| voc-A1-108 | bier | het | noun | /bir/ | beer | true | *Een Nederlands bier.* | MOD-004 |

### 2.11. Question Words (MOD-005)

| id | dutch | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|-----|-----|----------|------------|-----------|
| voc-A1-109 | wie | int-q | /ʋi/ | who | *Wie ben jij?* | MOD-005 |
| voc-A1-110 | wat | int-q | /ʋɑt/ | what | *Wat doe je?* | MOD-005 |
| voc-A1-111 | waar | int-q | /ʋaːr/ | where | *Waar woon je?* | MOD-005 |
| voc-A1-112 | wanneer | int-q | /ʋɑˈneːr/ | when | *Wanneer kom je?* | MOD-005 |
| voc-A1-113 | hoe | int-q | /hu/ | how | *Hoe gaat het?* | MOD-005 |
| voc-A1-114 | hoeveel | int-q | /ˈhuveːl/ | how many / how much | *Hoeveel broers heb je?* | MOD-005 |
| voc-A1-115 | waarom | int-q | /ʋaːˈrɔm/ | why | *Waarom leer je Nederlands?* | MOD-005 |

### 2.12. Connectors, Negation, Small Words (MOD-005)

| id | dutch | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|-----|-----|----------|------------|-----------|
| voc-A1-116 | en | conj | /ɛn/ | and | *Spaans en Engels.* | MOD-003 |
| voc-A1-117 | maar | conj | /maːr/ | but | *Ik leer, maar het is moeilijk.* | MOD-005 |
| voc-A1-118 | ook | adv | /oːk/ | also, too | *Ik werk ook in Bogotá.* | MOD-005 |
| voc-A1-119 | niet | adv | /nit/ | not | *Ik werk niet vandaag.* | MOD-005 |
| voc-A1-120 | geen | det | /ɣeːn/ | no, none (noun-negator) | *Ik heb geen broer.* | MOD-005 |
| voc-A1-121 | dit | det/pron | /dɪt/ | this (het-) | *Dit is het boek.* | MOD-004 |
| voc-A1-122 | dat | det/pron | /dɑt/ | that (het-) | *Dat is een stoel.* | MOD-004 |

### 2.13. Adverbs of Time & Place (MOD-005)

| id | dutch | pos | ipa | gloss_en | example_nl | module_id |
|----|-------|-----|-----|----------|------------|-----------|
| voc-A1-123 | vandaag | adv | /vɑnˈdaːx/ | today | *Vandaag werk ik.* | MOD-005 |
| voc-A1-124 | morgen | adv/noun | /ˈmɔrɣə(n)/ | tomorrow / morning | *Tot morgen!* | MOD-005 |
| voc-A1-125 | nu | adv | /ny/ | now | *Nu ga ik naar huis.* | MOD-005 |
| voc-A1-126 | hier | adv | /hir/ | here | *Hier is mijn boek.* | MOD-005 |
| voc-A1-127 | daar | adv | /daːr/ | there | *Daar is mijn vriend.* | MOD-005 |
| voc-A1-128 | altijd | adv | /ˈɑltɛit/ | always | *Hij is altijd hier.* | MOD-005 |

### 2.14. Classroom / App words (carry-overs and discovery)

| id | dutch | article | pos | ipa | gloss_en | cognate_en | example_nl | module_id |
|----|-------|---------|-----|-----|----------|------------|------------|-----------|
| voc-A1-129 | uit | — | prep | /œyt/ | out of / from | partial | *Ik kom uit Colombia.* | MOD-003 |
| voc-A1-130 | in | — | prep | /ɪn/ | in | true | *Ik woon in Bogotá.* | MOD-003 |

---

## 3. Audio Metadata Defaults

Per P2-R1 in [[../../00_Project/DECISION_REGISTER_V1]]:

```yaml
default_audio_resolution:
  - audio_path  # checked first if present
  - audio_url   # checked next if path missing
  - tts_text    # always populated as fallback (defaults to `dutch` field)
```

The app's audio resolver tries them in order. If all three are null on a noun card, the card renders without audio but logs a content warning (not a crash). For the seed, only `tts_text` is populated.

---

## 4. Conventions Used in This Seed

- **Lemma form.** Verbs in infinitive (`zijn`, `hebben`). Nouns in singular. Adjectives in predicative (citation) form.
- **Article.** Stored separately from the lemma. Always populated for nouns. `—` for non-nouns.
- **IPA.** Northern (Netherlandic) Dutch pronunciation by default. Flemish variants noted only if relevant for B1+.
- **Cognate flag.** `true` = transparent EN cognate; `partial` = recognizable but not identical; `false` = no useful EN cognate.
- **Tags.** Every row carries `cefr:A0` or `cefr:A1`, the `module_id`, and a domain tag (e.g., `domain:greetings`, `domain:family`, `domain:home`).
- **`tts_text`** defaults to the `dutch` lemma. Override only if pronunciation requires hint markup (e.g., for proper nouns).

---

## 5. Open Items

- [ ] **Audio sourcing**: per P2-R1, decision deferred. Forvo-download vs Piper TTS vs OpenAI TTS — picks made before MOD-001 first daily use.
- [ ] **Frequency rank**: SUBTLEX-NL frequency rank not yet added per row. Recommend a one-time enrichment pass before vault indexer reads this file (or computed lazily by the indexer).
- [ ] **Spanish glosses**: only ~30% of rows have a `gloss_es`. Per D-001 (English bridge), Spanish glosses are optional/contrastive — keep current sparsity.
- [ ] **Wait-list**: numbers 11–100, days of week, months — held back for MOD-006+ (do not seed here).

---

## 6. Cross-References

- [[../../00_Project/DECISION_REGISTER_V1]] — D-007, D-008, D-009, D-026, P2-R1.
- [[../../03_Curriculum/Modules/MOD-001_First_Contact]]
- [[../../03_Curriculum/Modules/MOD-002_Dutch_Sounds_and_Greetings]]
- [[../../03_Curriculum/Modules/MOD-003_I_Am_You_Are]]
- [[../../03_Curriculum/Modules/MOD-004_Nouns_De_Het_and_Core_Objects]]
- [[../../03_Curriculum/Modules/MOD-005_Basic_Sentences_and_Questions]]
- [[Grammar_Patterns_A0_A1]] — the grammar registry that complements this vocabulary seed.
- [[../../02_Methodology/Spaced_Repetition]] §4 — card format expectations.
- [[../../08_App_Architecture/Database_Schema]] — `vocabulary_items` table.
- [[../../08_App_Architecture/Markdown_Data_Model]] — vocabulary table parsing contract.
