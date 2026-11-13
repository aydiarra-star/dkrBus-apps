# DDD line 6 — official sequence, ArcGIS and OSM candidate conflict (2026-11-13)

## Scope

Read-only review of DDD line 6 using the official published network page, the latest successful ArcGIS extraction, and the current Dakar OSM relation inventory available to this audit. This review does not change the app, production data, Supabase, TER/BRT, or any timetable.

Sources:
- Official DDD network: https://demdikk.sn/reseau-urbain-dakar/
- Official DDD passenger information: https://demdikk.sn/info-voyageurs/
- Public DDD ArcGIS layers extracted by the repository's read-only ArcGIS audit.
- OSM route relation inventory extracted by the repository's read-only OSM audit.

## 1. Official published sequence

The DDD page publishes **LIGNE 6 : GUÉDIAWAYE PALAIS 1** as one ordered sequence of 25 stops, from **Terminus Guédiawaye** to **Palais 1**. The sequence includes Marche Jeudi, Hôpital Dalal Diam, Camberene, Case PA, Police des Parcelles Assainies / Marché Grand Médine, Foire, Sipres, Liberté 6, Liberté 5, Jet d’Eau, Niary Tally, ENA, Allées Papa Gueye Fall, Faidherbe, Lamine Gueye, André Peytavin, Jean Jaurès, République, Nelson Mandela and Palais 1.

The extracted official record is explicitly marked `ONE_PUBLISHED_ORDER_ONLY`; no verified return order or frequency is published in this record. The official sequence must not be reversed automatically.

## 2. ArcGIS evidence

The ArcGIS service exposes:
- `Arret_ligne_6_Dakar_Dem_Dikk`: 60 point features.
- `Itinéraire_ligne_6_Dakar_Dem_Dikk`: one route feature.

The route feature is explicitly labelled `Nom_Ligne = Ligne 6`. Its route description begins with **Cambéréne 2 – Cambéréne village** and lists the same broad corridor landmarks as the official line 6, including Case / Route des Niayes, Police des Parcelles Assainies / Marché Grand-Médine, Cité Keur Damel / VDN Sipres, Liberté 5, Jet d’Eau / Niary Tally, ENAM / Boulevard Général de Gaulle, Allées Papa Guèye Fall / Avenue Faidherbe, Lamine Guèye / André Peytavin, Jean Jaurès / République and Nelson Mandela.

However, the ArcGIS route description ends at **Palais 2**, whereas the current official DDD heading and published stop sequence end at **Palais 1**. Its starting description also uses Cambérène 2 / Cambérène village rather than the official page's Terminus Guédiawaye. The ArcGIS point layer contains 60 features, substantially more than the 25 stops in the published text; this may reflect multiple stop positions, duplicated directional points or a more granular mapped layer, but the extraction alone does not resolve that.

**Finding:** ArcGIS is strong supporting evidence for the line-6 corridor and provides a useful candidate stop inventory. It does not resolve the terminal discrepancy or establish a validated 60-stop sequence. Keep its point features separate from the 25 official published stops.

## 3. OSM relation candidate 7499433 — reject as line-6 evidence

The current OSM inventory contains one relation with `ref=6`:
- relation 7499433;
- name: **“7 Palais 1 → Parcelles-Assainies”**;
- from: Palais 1;
- to: Parcelles-Assainies;
- only one ordered stop member, unnamed;
- OSM tag `fixme`: route passes a one-way road in the wrong direction.

This relation's name identifies line 7, its endpoints do not match the official line-6 corridor, and it has only one unnamed stop. The `ref=6` tag is therefore an internal tagging conflict, not sufficient evidence that this is DDD line 6. Do not import it, use its sequence, or use it to infer a return direction.

## 4. Decision

- Retain the official 25-stop Guédiawaye → Palais 1 sequence as the published baseline.
- Retain the ArcGIS line-6 route and 60 point features as separate mapping evidence.
- Flag two unresolved discrepancies for later corroboration: Guédiawaye vs Cambérène 2 at the origin, and Palais 1 vs Palais 2 at the destination.
- Exclude OSM relation 7499433 from line-6 matching unless its `ref=6` conflict is corrected by independent evidence.
- Do not generate a reverse sequence, stop IDs, frequency, or countdown times from these sources.
- No GTFS feed was used or required.

## Extraction quality

The latest ArcGIS audit completed successfully: 24/24 route layers and 12/12 stop layers fetched, 25 route features and 455 stop features, zero extraction errors. The OSM inventory used for this review contained 25 route relations and 522 ordered stop-member occurrences; a newer OSM extraction is still running and should be compared before this finding is considered final.