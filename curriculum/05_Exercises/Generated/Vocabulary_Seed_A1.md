---
title: Vocabulary Seed — A1 (October 2026)
type: vocabulary-seed
status: draft
cefr_band: A0-A1
covers_modules: [MOD-006]
created: 2026-09-30
updated: 2026-09-30
total_items: 14
tags: [vocabulary, seed, A0, A1, october, MOD-006]
---

# Vocabulary Seed — A1 (MOD-006 to MOD-018)

> Second vocabulary file of the curriculum: the lemmas introduced in October 2026, after the 130 in `Vocabulary_Seed_A0_A1`. The vault indexer reads every `Vocabulary_Seed*.md` file, so nothing else needs to change. **A lemma may exist in only one seed file** (`UNIQUE(lemma, language)`): a duplicate would overwrite the first row, including its `module_id`.
>
> Budget: with the cap of 10 new cards a day, October admits at most 310 cards; 130 already exist, so this file holds at most 180 (about 14 per module).

---

## 1. Schema

Same as `Vocabulary_Seed_A0_A1`, plus two optional columns:

| Field | Type | Notes |
|-------|------|-------|
| `plural` | string | Plural of a noun, always filled for nouns in this file. |
| `forms` | string | Verb forms: present (`ik …, hij …`), then simple past and past participle. Always filled for verbs here. |

`id` continues the series (`voc-A1-131` onwards). Every common noun has `article` = `de` or `het`. Examples are Dutch as spoken in the Netherlands. `tts_text` defaults to the lemma. Each single word gets a Forvo link from the indexer (not stored here).

---

## 2. Items

### 2.1. Negation practice words (MOD-006)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-131 | fiets | de | noun | fietsen | — | /fits/ | bicycle, bike | bicicleta | false | *Ik heb geen fiets.* | MOD-006 |
| voc-A1-132 | auto | de | noun | auto's | — | /ˈʌuto/ | car | coche, carro | true | *Wij hebben geen auto.* | MOD-006 |
| voc-A1-133 | hond | de | noun | honden | — | /hɔnt/ | dog | perro | partial | *Zij heeft geen hond.* | MOD-006 |
| voc-A1-134 | kat | de | noun | katten | — | /kɑt/ | cat | gato | true | *Ik heb een kat, maar ik heb geen hond.* | MOD-006 |
| voc-A1-135 | tas | de | noun | tassen | — | /tɑs/ | bag | bolso, bolsa | false | *Ik heb mijn tas niet.* | MOD-006 |
| voc-A1-136 | sleutel | de | noun | sleutels | — | /ˈsløːtəl/ | key | llave | false | *Waar is mijn sleutel? Ik weet het niet.* | MOD-006 |
| voc-A1-137 | telefoon | de | noun | telefoons | — | /teːləˈfoːn/ | telephone, phone | teléfono | true | *Hij heeft geen telefoon.* | MOD-006 |
| voc-A1-138 | begrijpen | — | verb | — | ik begrijp, hij begrijpt · begreep · begrepen | /bəˈɣrɛipə(n)/ | to understand | entender, comprender | false | *Ik begrijp je niet.* | MOD-006 |
| voc-A1-139 | weten | — | verb | — | ik weet, hij weet · wist · geweten | /ˈʋeːtə(n)/ | to know (a fact) | saber | partial | *Ik weet het niet.* | MOD-006 |
| voc-A1-140 | moe | — | adj | — | — | /mu/ | tired | cansado | false | *Hij is niet moe.* | MOD-006 |
| voc-A1-141 | moeilijk | — | adj | — | — | /ˈmujlək/ | difficult, hard | difícil | false | *Nederlands is niet moeilijk.* | MOD-006 |
| voc-A1-142 | nooit | — | adv | — | — | /nojt/ | never | nunca | false | *Ik drink nooit koffie.* | MOD-006 |
| voc-A1-143 | niets | — | pron | — | — | /nits/ | nothing | nada | false | *Ik heb niets.* | MOD-006 |
| voc-A1-144 | niemand | — | pron | — | — | /ˈnimɑnt/ | nobody, no one | nadie | false | *Niemand woont hier.* | MOD-006 |
