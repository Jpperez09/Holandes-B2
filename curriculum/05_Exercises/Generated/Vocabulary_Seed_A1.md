---
title: Vocabulary Seed — A1 (October 2026)
type: vocabulary-seed
status: draft
cefr_band: A0-A1
covers_modules: [MOD-006, MOD-007, MOD-008]
created: 2026-09-30
updated: 2026-09-30
total_items: 42
tags: [vocabulary, seed, A0, A1, october, MOD-006, MOD-007, MOD-008]
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

### 2.2. Numbers 11–100, age and prices (MOD-007)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-145 | elf | — | num | — | — | /ɛlf/ | eleven | once | partial | *Het kost elf euro.* | MOD-007 |
| voc-A1-146 | twaalf | — | num | — | — | /tʋaːlf/ | twelve | doce | partial | *Mijn zus is twaalf jaar oud.* | MOD-007 |
| voc-A1-147 | dertien | — | num | — | — | /ˈdɛrtin/ | thirteen | trece | partial | *Het kost dertien euro.* | MOD-007 |
| voc-A1-148 | veertien | — | num | — | — | /ˈveːrtin/ | fourteen | catorce | partial | *Mijn broer is veertien jaar oud.* | MOD-007 |
| voc-A1-149 | vijftien | — | num | — | — | /ˈvɛiftin/ | fifteen | quince | partial | *Het boek kost vijftien euro.* | MOD-007 |
| voc-A1-150 | twintig | — | num | — | — | /ˈtʋɪntəx/ | twenty | veinte | partial | *Ik ben twintig jaar oud.* | MOD-007 |
| voc-A1-151 | dertig | — | num | — | — | /ˈdɛrtəx/ | thirty | treinta | partial | *Hij is dertig jaar oud.* | MOD-007 |
| voc-A1-152 | veertig | — | num | — | — | /ˈveːrtəx/ | forty | cuarenta | partial | *Mijn vader is veertig jaar oud.* | MOD-007 |
| voc-A1-153 | vijftig | — | num | — | — | /ˈvɛiftəx/ | fifty | cincuenta | partial | *Mijn moeder is vijftig jaar oud.* | MOD-007 |
| voc-A1-154 | honderd | — | num | — | — | /ˈhɔndərt/ | one hundred | cien | partial | *De fiets kost honderd euro.* | MOD-007 |
| voc-A1-155 | jaar | het | noun | jaren | — | /jaːr/ | year | año | partial | *Ik ben dertig jaar oud.* | MOD-007 |
| voc-A1-156 | euro | de | noun | euro's | — | /ˈøːro/ | euro | euro | true | *Het kost tien euro.* | MOD-007 |
| voc-A1-157 | prijs | de | noun | prijzen | — | /prɛis/ | price | precio | partial | *Wat is de prijs?* | MOD-007 |
| voc-A1-158 | kosten | — | verb | — | het kost, ze kosten · kostte · gekost | /ˈkɔstə(n)/ | to cost | costar | true | *Hoeveel kost de fiets?* | MOD-007 |

### 2.3. Time, days and months (MOD-008)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-159 | maandag | de | noun | maandagen | — | /ˈmaːndɑx/ | Monday | lunes | false | *Vandaag is het maandag.* | MOD-008 |
| voc-A1-160 | dinsdag | de | noun | dinsdagen | — | /ˈdinzdɑx/ | Tuesday | martes | false | *Morgen is het dinsdag.* | MOD-008 |
| voc-A1-161 | woensdag | de | noun | woensdagen | — | /ˈʋunzdɑx/ | Wednesday | miércoles | false | *Woensdag werk ik niet.* | MOD-008 |
| voc-A1-162 | donderdag | de | noun | donderdagen | — | /ˈdɔndərdɑx/ | Thursday | jueves | partial | *Donderdag werk ik in Amsterdam.* | MOD-008 |
| voc-A1-163 | vrijdag | de | noun | vrijdagen | — | /ˈvrɛidɑx/ | Friday | viernes | false | *Vrijdag ben ik moe.* | MOD-008 |
| voc-A1-164 | zaterdag | de | noun | zaterdagen | — | /ˈzaːtərdɑx/ | Saturday | sábado | partial | *Wat doe je zaterdag?* | MOD-008 |
| voc-A1-165 | zondag | de | noun | zondagen | — | /ˈzɔndɑx/ | Sunday | domingo | partial | *Zondag werkt mijn vader niet.* | MOD-008 |
| voc-A1-166 | week | de | noun | weken | — | /ʋeːk/ | week | semana | true | *Een week heeft zeven dagen.* | MOD-008 |
| voc-A1-167 | maand | de | noun | maanden | — | /maːnt/ | month | mes | partial | *Een maand heeft dertig dagen.* | MOD-008 |
| voc-A1-168 | uur | het | noun | uren | — | /yr/ | hour; o'clock | hora; en punto | false | *Het is vijf uur.* | MOD-008 |
| voc-A1-169 | laat | — | adj | — | — | /laːt/ | late | tarde | partial | *Hoe laat is het?* | MOD-008 |
| voc-A1-170 | vroeg | — | adj | — | — | /vrux/ | early | temprano | false | *Zij is vroeg.* | MOD-008 |
| voc-A1-171 | half | — | adj | — | — | /hɑlf/ | half | medio | true | *Het is half drie.* | MOD-008 |
| voc-A1-172 | kwart | — | num | — | — | /kʋɑrt/ | quarter | cuarto | true | *Het is kwart over drie.* | MOD-008 |
