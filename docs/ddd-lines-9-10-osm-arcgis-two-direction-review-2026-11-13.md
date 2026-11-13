# DDD lines 9 and 10 — OSM direction candidates cross-checked with official text and ArcGIS (2026-11-13)

## Scope and rule

Read-only review of DDD lines 9 and 10. OSM stop members are compared with the official published stop order and the DDD ArcGIS route descriptions. A mapped route or a relation endpoint is evidence for review, not proof of an active operator direction. No reverse order is generated from a single published sequence. No production, Supabase, TER or BRT data is changed.

Sources:
- Official DDD network: https://demdikk.sn/reseau-urbain-dakar/
- Official DDD passenger information: https://demdikk.sn/info-voyageurs/
- Public DDD ArcGIS route/stop layers from the successful 2026-11-13 read-only extraction.
- Dakar OSM relation inventory from the 2026-11-13 read-only extraction.

## Line 9 — Liberté 6 / Palais

### Official baseline
The official DDD page publishes **LIGNE 9 : LIBERTÉ 6 PALAIS 2**, 24 ordered stops, from Terminus Liberté 6 to Terminus Palais 2. Its sequence passes JVC, Sacré Cœur, Dieuppeul, Jet d’Eau, Niary Tally, Sainte Thérèse, Blaise Diagne, Kennedy, Obélisque, RTS, Médina, Sandaga, Pompidou, Place de l’Indépendance, Senghor and the Palais area.

### ArcGIS
- `Itinéraire_ligne_9_Dem_Dikk`: one route feature, explicitly `Nom_Ligne = Ligne 9`.
- Its itinerary text starts at Liberté 6 / Sacré Cœur and includes Dieuppeul, Allées Ababacar Sy, Jet d’Eau / Niary Tally, Sainte Thérèse, General de Gaulle, Malick Sy, Blaise Diagne, Jean Jaurès, André Peytavin, Pompidou and Senghor / Nelson Mandela / Palais 2.
- `Arret_ligne_9_Dem_Dikk`: 36 point features.

The ArcGIS route description supports the same broad line-9 corridor and the Palais 2 terminal named in the official DDD page.

### OSM direction candidates
1. Relation 7487218, **Liberté 6 → Palais 1**, ref 9:
   - 29 ordered stop/platform members, 8 named.
   - Named members include Liberté 6, Brioche Dorée Liberté 6, JVC, two Sacré Cœur stops, Collège Sacré Cœur, Ville and Hôpital Principal.
   - The first named stops align with the beginning of the official Liberté 6 sequence. Hôpital Principal is also a late official corridor landmark, but the OSM relation ends at Palais 1 rather than Palais 2.
   - This is a useful forward-direction candidate, not a validated complete sequence.

2. Relation 6996431, **Palais 1 → Liberté 6**, ref 9:
   - 32 ordered stop/platform members, 10 named.
   - Named members include Clémenceau, Alybaba, El Malick, Ville, Sacré Cœur / BEM, 2 voies Sacré Cœur, JVC and Liberté 6 stops.
   - Its endpoints are opposite to relation 7487218 and its stop inventory includes landmarks in the official line-9 corridor. The sparse named sequence does not independently prove every intermediate stop or its exact order.
   - This is a plausible reverse-direction candidate, still not validated.

**Decision for line 9:** Keep both OSM relations separate as direction candidates. The pair is more useful than automatically reversing the official 24-stop list, but both OSM terminal tags say Palais 1 while the current official page and ArcGIS route description say Palais 2. Preserve that terminal discrepancy and do not promote either OSM list to a verified route.

## Line 10 — Liberté 5 / Palais

### Official baseline
The official DDD page publishes **LIGNE 10 : LIBERTÉ 5 PALAIS 2**, 29 ordered stops, from Terminus Liberté 5 (Dieuppeul) to Terminus Palais 2. The sequence includes Cité Derklé, Liberté 6, Khar Yalla, Cité Marine, Martyrs de l’Ouganda, SDE, Sacré Cœur, Demba Diop, Bourguiba, Ecole Normale, Fann, Aimé Césaire, Corniche Ouest, IFAN, Terrou-Bi, Soumbédioune, Rebeuss, République, Sorano, Senghor and Palais 2.

### ArcGIS
- `Itinéraire_ligne_10_Dakar_Dem_Dikk`: one route feature, explicitly `Nom_Ligne = Ligne 10`.
- Its itinerary starts at Dieuppeul / Cité Derklé and lists Khar Yalla, Cité Marine, Martyrs de l’Ouganda, Marius Ndiaye, Bourguiba, Cheikh Anta Diop, Aimé Césaire, Corniche Ouest, Soumbédioune, Prison Centrale, République, Senghor, Nelson Mandela and Palais 2.
- `Arrets_LIgne_10_Dakar_Dem_Dikk`: 26 point features.

ArcGIS strongly supports the same broad line-10 corridor and the Palais 2 terminal in the official page.

### OSM direction candidates
1. Relation 7488283, **Liberté 5 → Palais 1**, ref 10:
   - 25 ordered stop/platform members, only 2 named.
   - The named members are Hôpital Principal and Clémenceau. These are not enough to establish a complete ordered sequence for line 10.
   - Endpoints suggest the forward direction, but the relation is sparse by name and ends at Palais 1.

2. Relation 6990845, **Palais 1 → Liberté 5**, ref 10:
   - 30 ordered stop/platform members, 5 named.
   - Named members include Gare Palais 2, Clémenceau, DDD 10 and Khar Yalla.
   - Its endpoint direction is opposite to relation 7488283, but the small number of named stops does not prove the full published sequence.

**Decision for line 10:** Keep the two OSM relations as separate, low-confidence directional candidates. Do not auto-match the 25/30 OSM members to the 29 official stops. Both relations terminate at Palais 1, which conflicts with the official and ArcGIS Palais 2 endpoint.

## Consolidated decisions

- Lines 9 and 10 each have two OSM relations with opposite endpoints. Retain the two directions independently; do not derive one by reversing the other.
- ArcGIS route descriptions for both lines corroborate the broad official corridors and Palais 2 destination.
- OSM's Palais 1 terminal for all four candidate relations remains a material unresolved conflict.
- ArcGIS stop-point feature counts (36 for line 9, 26 for line 10) are not equivalent to the official published stop counts (24 and 29). Keep these datasets separate until individual stop matches are evidenced.
- Do not infer service frequencies, departures, stop IDs, or countdown values from these mapping records.
- No GTFS feed was used or required.