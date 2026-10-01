---
title: Vocabulary Seed — A1 (October 2026)
type: vocabulary-seed
status: draft
cefr_band: A0-A1
covers_modules: [MOD-006, MOD-007, MOD-008, MOD-009, MOD-010, MOD-011, MOD-012, MOD-013, MOD-014, MOD-015]
created: 2026-09-30
updated: 2026-09-30
total_items: 140
tags: [vocabulary, seed, A0, A1, october, MOD-006, MOD-007, MOD-008, MOD-009, MOD-010, MOD-011, MOD-012, MOD-013, MOD-014, MOD-015]
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

### 2.4. Possessives and family (MOD-009)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-173 | jouw | — | det | — | — | /jʌu/ | your (informal, stressed) | tu, tuyo | false | *Is dit jouw tas?* | MOD-009 |
| voc-A1-174 | haar | — | det | — | — | /haːr/ | her | su (de ella) | false | *Haar broer heet Pieter.* | MOD-009 |
| voc-A1-175 | ons | — | det | — | — | /ɔns/ | our (+ het-word) | nuestro | partial | *Ons huis is groot.* | MOD-009 |
| voc-A1-176 | onze | — | det | — | — | /ˈɔnzə/ | our (+ de-word or plural) | nuestro, nuestra | partial | *Onze moeder woont in Utrecht.* | MOD-009 |
| voc-A1-177 | hun | — | det | — | — | /hʏn/ | their | su (de ellos) | false | *Hun huis is mooi.* | MOD-009 |
| voc-A1-178 | uw | — | det | — | — | /yʋ/ | your (formal) | su (de usted) | false | *Is dit uw tas, mevrouw?* | MOD-009 |
| voc-A1-179 | oma | de | noun | oma's | — | /ˈoːma/ | grandmother, grandma | abuela | false | *Mijn oma woont in Colombia.* | MOD-009 |
| voc-A1-180 | opa | de | noun | opa's | — | /ˈoːpa/ | grandfather, grandpa | abuelo | false | *Mijn opa is zeventig jaar oud.* | MOD-009 |
| voc-A1-181 | zoon | de | noun | zonen | — | /zoːn/ | son | hijo | partial | *Zij heeft een zoon en een dochter.* | MOD-009 |
| voc-A1-182 | dochter | de | noun | dochters | — | /ˈdɔxtər/ | daughter | hija | partial | *Onze dochter is twaalf jaar oud.* | MOD-009 |
| voc-A1-183 | oom | de | noun | ooms | — | /oːm/ | uncle | tío | false | *Mijn oom werkt in Amsterdam.* | MOD-009 |
| voc-A1-184 | tante | de | noun | tantes | — | /ˈtɑntə/ | aunt | tía | false | *Mijn tante heeft een hond.* | MOD-009 |
| voc-A1-185 | gezin | het | noun | gezinnen | — | /ɣəˈzɪn/ | family (parents and children), household | familia (nuclear), hogar | false | *Ons gezin is klein.* | MOD-009 |
| voc-A1-186 | familie | de | noun | families | — | /faːˈmili/ | family (including relatives) | familia (extensa) | true | *Mijn familie woont in Colombia.* | MOD-009 |

### 2.5. Verbs: stems and spelling (MOD-010)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-187 | maken | — | verb | — | ik maak, hij maakt · maakte · gemaakt | /ˈmaːkə(n)/ | to make | hacer, fabricar | partial | *Ik maak koffie.* | MOD-010 |
| voc-A1-188 | leven | — | verb | — | ik leef, hij leeft · leefde · geleefd | /ˈleːvə(n)/ | to live, to be alive | vivir (estar vivo) | partial | *Mijn oma leeft, maar mijn opa leeft niet.* | MOD-010 |
| voc-A1-189 | reizen | — | verb | — | ik reis, hij reist · reisde · gereisd | /ˈrɛizə(n)/ | to travel | viajar | false | *Mijn oom reist in oktober.* | MOD-010 |
| voc-A1-190 | kopen | — | verb | — | ik koop, hij koopt · kocht · gekocht | /ˈkoːpə(n)/ | to buy | comprar | false | *Ik koop een fiets.* | MOD-010 |
| voc-A1-191 | lopen | — | verb | — | ik loop, hij loopt · liep · gelopen | /ˈloːpə(n)/ | to walk | caminar | partial | *Ik loop hier, jij loopt daar.* | MOD-010 |
| voc-A1-192 | slapen | — | verb | — | ik slaap, hij slaapt · sliep · geslapen | /ˈslaːpə(n)/ | to sleep | dormir | true | *Ik slaap in mijn kamer.* | MOD-010 |
| voc-A1-193 | schrijven | — | verb | — | ik schrijf, hij schrijft · schreef · geschreven | /ˈsxrɛivə(n)/ | to write | escribir | false | *Ik schrijf een boek.* | MOD-010 |
| voc-A1-194 | lezen | — | verb | — | ik lees, hij leest · las · gelezen | /ˈleːzə(n)/ | to read | leer | false | *Ik lees mijn boek.* | MOD-010 |
| voc-A1-195 | spelen | — | verb | — | ik speel, hij speelt · speelde · gespeeld | /ˈspeːlə(n)/ | to play | jugar, tocar | false | *Mijn zoon speelt in zijn kamer.* | MOD-010 |
| voc-A1-196 | praten | — | verb | — | ik praat, hij praat · praatte · gepraat | /ˈpraːtə(n)/ | to talk, to chat | hablar, charlar | partial | *Wij praten Nederlands.* | MOD-010 |
| voc-A1-197 | zitten | — | verb | — | ik zit, hij zit · zat · gezeten | /ˈzɪtə(n)/ | to sit, to be sitting | estar sentado | true | *Hij zit in zijn kamer.* | MOD-010 |
| voc-A1-198 | vinden | — | verb | — | ik vind, hij vindt · vond · gevonden | /ˈvɪndə(n)/ | to find; to think (an opinion) | encontrar; opinar | true | *Ik vind Nederlands niet moeilijk.* | MOD-010 |
| voc-A1-199 | kijken | — | verb | — | ik kijk, hij kijkt · keek · gekeken | /ˈkɛikə(n)/ | to look, to watch | mirar | false | *Kijk, daar is je tas!* | MOD-010 |
| voc-A1-200 | staan | — | verb | — | ik sta, hij staat · stond · gestaan | /staːn/ | to stand; to be (upright) | estar de pie | true | *De fiets staat hier.* | MOD-010 |

### 2.6. Demonstratives, clothes and objects (MOD-011)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-201 | deze | — | det | — | — | /ˈdeːzə/ | this, these (de-word or plural) | este, esta, estos, estas | false | *Deze jas is mooi.* | MOD-011 |
| voc-A1-202 | die | — | det | — | — | /di/ | that, those (de-word or plural) | ese, esa, aquel, esos | false | *Die schoenen zijn duur.* | MOD-011 |
| voc-A1-203 | jas | de | noun | jassen | — | /jɑs/ | coat, jacket | abrigo, chaqueta | false | *Deze jas is nieuw.* | MOD-011 |
| voc-A1-204 | broek | de | noun | broeken | — | /bruk/ | trousers, pants | pantalón | false | *Die broek is goedkoop.* | MOD-011 |
| voc-A1-205 | schoen | de | noun | schoenen | — | /sxun/ | shoe | zapato | partial | *Deze schoenen zijn duur.* | MOD-011 |
| voc-A1-206 | trui | de | noun | truien | — | /trœy/ | sweater, jumper | suéter, jersey | false | *Die trui is nieuw.* | MOD-011 |
| voc-A1-207 | bril | de | noun | brillen | — | /brɪl/ | glasses | gafas | false | *Mijn bril is groot.* | MOD-011 |
| voc-A1-208 | fles | de | noun | flessen | — | /flɛs/ | bottle | botella | partial | *Die fles kost twee euro.* | MOD-011 |
| voc-A1-209 | glas | het | noun | glazen | — | /ɣlɑs/ | glass | vaso, copa | true | *Dat glas is klein.* | MOD-011 |
| voc-A1-210 | horloge | het | noun | horloges | — | /hɔrˈloːʒə/ | watch | reloj de pulsera | false | *Dit horloge is mooi.* | MOD-011 |
| voc-A1-211 | pen | de | noun | pennen | — | /pɛn/ | pen | bolígrafo | true | *Dit is mijn pen.* | MOD-011 |
| voc-A1-212 | nieuw | — | adj | — | — | /niu/ | new | nuevo | partial | *Mijn fiets is nieuw.* | MOD-011 |
| voc-A1-213 | duur | — | adj | — | — | /dyr/ | expensive | caro | false | *Die jas is duur.* | MOD-011 |
| voc-A1-214 | goedkoop | — | adj | — | — | /ɣutˈkoːp/ | cheap | barato | partial | *Deze broek is goedkoop.* | MOD-011 |

### 2.7. Modal verbs and activities (MOD-012)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-215 | kunnen | — | verb | — | ik kan, jij kunt, hij kan · kon · gekund | /ˈkʏnə(n)/ | can, to be able to | poder (capacidad) | false | *Ik kan Nederlands spreken.* | MOD-012 |
| voc-A1-216 | willen | — | verb | — | ik wil, jij wilt, hij wil · wilde · gewild | /ˈʋɪlə(n)/ | to want | querer | true | *Ik wil koffie drinken.* | MOD-012 |
| voc-A1-217 | moeten | — | verb | — | ik moet, jij moet, hij moet · moest · gemoeten | /ˈmutə(n)/ | must, to have to | tener que, deber | false | *Ik moet vandaag werken.* | MOD-012 |
| voc-A1-218 | mogen | — | verb | — | ik mag, jij mag, hij mag · mocht · gemogen | /ˈmoːɣə(n)/ | may, to be allowed to | poder (permiso) | false | *Mag ik een koffie?* | MOD-012 |
| voc-A1-219 | zwemmen | — | verb | — | ik zwem, hij zwemt · zwom · gezwommen | /ˈzʋɛmə(n)/ | to swim | nadar | false | *Mijn zoon kan goed zwemmen.* | MOD-012 |
| voc-A1-220 | fietsen | — | verb | — | ik fiets, hij fietst · fietste · gefietst | /ˈfitsə(n)/ | to cycle, to bike | andar en bicicleta | false | *Ik wil morgen fietsen.* | MOD-012 |
| voc-A1-221 | koken | — | verb | — | ik kook, hij kookt · kookte · gekookt | /ˈkoːkə(n)/ | to cook | cocinar | false | *Mijn zus kan koken.* | MOD-012 |
| voc-A1-222 | bellen | — | verb | — | ik bel, hij belt · belde · gebeld | /ˈbɛlə(n)/ | to call, to phone | llamar (por teléfono) | false | *Ik moet mijn moeder bellen.* | MOD-012 |
| voc-A1-223 | helpen | — | verb | — | ik help, hij helpt · hielp · geholpen | /ˈhɛlpə(n)/ | to help | ayudar | false | *Kun je helpen?* | MOD-012 |
| voc-A1-224 | betalen | — | verb | — | ik betaal, hij betaalt · betaalde · betaald | /bəˈtaːlə(n)/ | to pay | pagar | false | *Ik wil betalen.* | MOD-012 |
| voc-A1-225 | wachten | — | verb | — | ik wacht, hij wacht · wachtte · gewacht | /ˈʋɑxtə(n)/ | to wait | esperar | false | *Wij moeten hier wachten.* | MOD-012 |
| voc-A1-226 | dansen | — | verb | — | ik dans, hij danst · danste · gedanst | /ˈdɑnsə(n)/ | to dance | bailar | true | *Mijn dochter wil dansen.* | MOD-012 |
| voc-A1-227 | samen | — | adv | — | — | /ˈsaːmə(n)/ | together | juntos | false | *Wij kunnen samen koken.* | MOD-012 |
| voc-A1-228 | snel | — | adv | — | — | /snɛl/ | fast, quickly | rápido | false | *Hij kan snel fietsen.* | MOD-012 |

### 2.8. Colours, size and people (MOD-013)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-229 | rood | — | adj | — | — | /roːt/ | red | rojo | false | *Ik heb een rode fiets.* | MOD-013 |
| voc-A1-230 | blauw | — | adj | — | — | /blʌu/ | blue | azul | partial | *Mijn blauwe jas is nieuw.* | MOD-013 |
| voc-A1-231 | groen | — | adj | — | — | /ɣrun/ | green | verde | partial | *Het groene boek is mooi.* | MOD-013 |
| voc-A1-232 | geel | — | adj | — | — | /ɣeːl/ | yellow | amarillo | partial | *Zij heeft een geel horloge.* | MOD-013 |
| voc-A1-233 | zwart | — | adj | — | — | /zʋɑrt/ | black | negro | partial | *Ik heb een zwarte tas.* | MOD-013 |
| voc-A1-234 | wit | — | adj | — | — | /ʋɪt/ | white | blanco | true | *Een wit huis is mooi.* | MOD-013 |
| voc-A1-235 | lang | — | adj | — | — | /lɑŋ/ | long, tall | largo, alto | true | *De lange man werkt hier.* | MOD-013 |
| voc-A1-236 | kort | — | adj | — | — | /kɔrt/ | short | corto, bajo | true | *Zij heeft een korte broek.* | MOD-013 |
| voc-A1-237 | warm | — | adj | — | — | /ʋɑrm/ | warm, hot | cálido, caliente | true | *Ik drink een warme koffie.* | MOD-013 |
| voc-A1-238 | koud | — | adj | — | — | /kʌut/ | cold | frío | true | *Het koude water is goed.* | MOD-013 |
| voc-A1-239 | zwaar | — | adj | — | — | /zʋaːr/ | heavy | pesado | false | *Mijn tas is zwaar.* | MOD-013 |
| voc-A1-240 | man | de | noun | mannen | — | /mɑn/ | man | hombre | true | *De lange man heet Pieter.* | MOD-013 |
| voc-A1-241 | vrouw | de | noun | vrouwen | — | /vrʌu/ | woman | mujer | false | *Die vrouw is mijn tante.* | MOD-013 |
| voc-A1-242 | jongen | de | noun | jongens | — | /ˈjɔŋə(n)/ | boy | chico, niño | false | *De jongen heeft een rode fiets.* | MOD-013 |

### 2.9. At the café (MOD-014)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-243 | graag | — | adv | — | — | /ɣraːx/ | gladly, please (softens a request); like to | con gusto, por favor | false | *Ik wil graag een koffie.* | MOD-014 |
| voc-A1-244 | bestellen | — | verb | — | ik bestel, hij bestelt · bestelde · besteld | /bəˈstɛlə(n)/ | to order | pedir | false | *Wij willen graag bestellen.* | MOD-014 |
| voc-A1-245 | nog | — | adv | — | — | /nɔx/ | still; another, more | todavía; otro, más | false | *Nog een koffie, alstublieft.* | MOD-014 |
| voc-A1-246 | met | — | prep | — | — | /mɛt/ | with | con | false | *Een koffie met melk, alstublieft.* | MOD-014 |
| voc-A1-247 | zonder | — | prep | — | — | /ˈzɔndər/ | without | sin | partial | *Ik drink koffie zonder suiker.* | MOD-014 |
| voc-A1-248 | lekker | — | adj | — | — | /ˈlɛkər/ | tasty, delicious; nice | rico, sabroso | false | *De appeltaart is lekker.* | MOD-014 |
| voc-A1-249 | café | het | noun | cafés | — | /kɑˈfeː/ | café, bar | cafetería, bar | true | *Het café is klein, maar mooi.* | MOD-014 |
| voc-A1-250 | ober | de | noun | obers | — | /ˈoːbər/ | waiter | camarero | false | *Ober, mag ik de rekening?* | MOD-014 |
| voc-A1-251 | kaart | de | noun | kaarten | — | /kaːrt/ | menu; card; map | carta; tarjeta; mapa | partial | *Mag ik de kaart, alstublieft?* | MOD-014 |
| voc-A1-252 | rekening | de | noun | rekeningen | — | /ˈreːkənɪŋ/ | bill, check | cuenta | false | *Mag ik de rekening?* | MOD-014 |
| voc-A1-253 | wijn | de | noun | wijnen | — | /ʋɛin/ | wine | vino | true | *Mijn opa drinkt graag wijn.* | MOD-014 |
| voc-A1-254 | appeltaart | de | noun | appeltaarten | — | /ˈɑpəltaːrt/ | apple pie | tarta de manzana | partial | *De appeltaart is lekker.* | MOD-014 |
| voc-A1-255 | suiker | de | noun | suikers | — | /ˈsœykər/ | sugar | azúcar | partial | *Koffie zonder suiker, alstublieft.* | MOD-014 |
| voc-A1-256 | limonade | de | noun | limonades | — | /limoˈnaːdə/ | lemonade, soft drink | limonada, refresco | true | *Mijn zoon wil graag limonade.* | MOD-014 |

### 2.10. Irregular plurals and diminutives (MOD-015)

| id | dutch | article | pos | plural | forms | ipa | gloss_en | gloss_es | cognate_en | example_nl | module_id |
|---|---|---|---|---|---|---|---|---|---|---|---|
| voc-A1-257 | stad | de | noun | steden | — | /stɑt/ | city, town | ciudad | false | *Amsterdam is een grote stad.* | MOD-015 |
| voc-A1-258 | ei | het | noun | eieren | — | /ɛi/ | egg | huevo | partial | *Ik eet een ei.* | MOD-015 |
| voc-A1-259 | schip | het | noun | schepen | — | /sxɪp/ | ship, boat | barco | partial | *Het schip is groot.* | MOD-015 |
| voc-A1-260 | blad | het | noun | bladeren | — | /blɑt/ | leaf; sheet of paper | hoja | false | *Dit blad is groen.* | MOD-015 |
| voc-A1-261 | weg | de | noun | wegen | — | /ʋɛx/ | road, way | camino, carretera | partial | *De weg is lang.* | MOD-015 |
| voc-A1-262 | been | het | noun | benen | — | /beːn/ | leg (also: bone, in some words) | pierna | false | *Mijn been is moe.* | MOD-015 |
| voc-A1-263 | lied | het | noun | liederen | — | /lit/ | song | canción | false | *Dit lied is mooi.* | MOD-015 |
| voc-A1-264 | kop | de | noun | koppen | — | /kɔp/ | head (informal); cup, mug | cabeza; taza | partial | *Ik heb een kop koffie.* | MOD-015 |
| voc-A1-265 | meisje | het | noun | meisjes | — | /ˈmɛiʃə/ | girl | niña, chica | false | *Het meisje heeft een rode fiets.* | MOD-015 |
| voc-A1-266 | jongetje | het | noun | jongetjes | — | /ˈjɔŋətjə/ | little boy | niñito | false | *Het jongetje speelt in zijn kamer.* | MOD-015 |
| voc-A1-267 | kopje | het | noun | kopjes | — | /ˈkɔpjə/ | cup | taza | false | *Ik wil graag een kopje koffie.* | MOD-015 |
| voc-A1-268 | broodje | het | noun | broodjes | — | /ˈbroːtjə/ | bread roll, sandwich | panecillo, bocadillo | false | *Mag ik een broodje kaas?* | MOD-015 |
| voc-A1-269 | kaartje | het | noun | kaartjes | — | /ˈkaːrtjə/ | ticket; small card | billete, entrada; tarjetita | false | *Hoeveel kost het kaartje?* | MOD-015 |
| voc-A1-270 | beetje | het | noun | beetjes | — | /ˈbeːtjə/ | little bit | poquito | false | *Ik spreek een beetje Nederlands.* | MOD-015 |
