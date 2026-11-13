# DDD lines 13 and 18 — ArcGIS stop-layer review (2026-11-13)

## Scope and method

Read-only comparison of the DDD operator's published route sequences with the public ArcGIS DDD route/stop layers extracted on 2026-11-13. ArcGIS feature OBJECTID order is retained as published by the service; it is treated as a candidate ordering, not as proof of current passenger service or a certified direction. No production data, application code, TER/BRT data, or Supabase records were changed.

Sources:
- DDD published urban network: https://demdikk.sn/reseau-urbain-dakar/
- DDD passenger information index: https://demdikk.sn/info-voyageurs/
- ArcGIS public DDD mapping layers, extracted by the repository's read-only ArcGIS audit workflow.

## Line 13

Official DDD page publishes one ordered sequence headed **LIGNE 13 : LIBERTÉ 5 PALAIS 2**, with 24 named stops. It begins at Liberté 5 / Dieuppeul and ends at **Terminus Palais 2**.

ArcGIS layer `Arret_ligne_13_Dem_Dikk` contains 23 ordered point features. The first feature is `Terminus Liberté 5`; the final feature is `Terminus DDD Palais 1`. Intermediate attributes broadly follow the corridor described by the official page (Cheikh Ahmadou Bamba, Boulevard du Général de Gaulle, Allées Papa Gueye Fall, Faidherbe, Hôpital Principal, Avenue Pasteur and Hôpital Aristide Le Dantec).

A second ArcGIS layer, `Arrets_LIgne_13_Dakar_Dem_Dikk`, contains 22 geometries without stop names. Its point coordinates closely duplicate the named layer's points, so it is not independent confirmation and must not be counted as another route or direction.

**Finding:** ArcGIS supports the existence of a mapped line-13 corridor, but the mapped terminal is Palais 1 while the current official page heading says Palais 2. The point count also differs (23 vs 24). Keep the official published sequence intact, flag the terminal/count mismatch for review, and do not silently replace Palais 2 with Palais 1 or manufacture a return sequence.

## Line 18

Official DDD page publishes one ordered sequence headed **LIGNE 18 : DIEUPPEUL CENTRE-VILLE**, with 41 named stops. It starts and ends at Liberté 5 / Dieuppeul, describing a route through HLM/Bel Air and central Dakar before returning through Gueule Tapée, Canal 4, Cheikh Anta Diop, Ecole Normale, Bourguiba, Demba Diop and Jet d'Eau.

ArcGIS layer `Arrets_LIgne_18_Dakar_Dem_Dikk` contains 44 ordered point features. It also starts and ends at Liberté 5. Its point attributes trace a coherent loop-like corridor: Liberté 5 and Cheikh Ahmadou Bamba; the HLM/Bel Air and port area; Hotel de Ville / Independence / George Pompidou; Ville and Boulevard du Docteur Samba Gueye; Malick Sy / Gueule Tapée; Cheikh Anta Diop / UCAD / VDN; Bourguiba / GDO / Dieuppeul; and Liberté 5.

The ArcGIS point list is not an exact name-for-name transcription of the 41-stop official sequence. Some labels are broad road names, some stops are unnamed, and several central-Dakar segments use different labels. Therefore the 44 features cannot be substituted directly for the 41 published stops.

**Finding:** Line 18 has stronger two-ended spatial support than a one-way-only record: both the official text and ArcGIS point layer return to Liberté 5. This supports treating the published line-18 description as a loop candidate for subsequent stop-by-stop reconciliation. It does not establish a separate outbound/return timetable or authorize reversing the published list.

## Data handling decisions

- Preserve official DDD sequence text and order as the authoritative published transcription.
- Preserve ArcGIS feature order and attributes separately as mapping evidence.
- Keep line 13 terminal conflict (Palais 2 official vs Palais 1 ArcGIS) unresolved.
- For line 18, use ArcGIS as a geometry/stop-name cross-check, not as an automatic replacement for official stop order.
- Do not infer frequencies, live countdowns, stop IDs, or unlisted return directions from either source.
- No GTFS feed was used or required for this review.

## Extraction snapshot

ArcGIS audit completed successfully: 24/24 route layers and 12/12 stop layers fetched; 25 route features and 455 stop features; no transfer-limit responses and no extraction errors.