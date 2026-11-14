# Paramètres horaires officiels CETUD — réseau AFTU

Date d'intégration : 14 novembre 2026  
Périmètre : paramètres de configuration et audit AFTU.

## Statut et provenance

Les paramètres ci-dessous sont enregistrés comme **références officielles CETUD**, conformément à la validation du responsable du projet. Ils sont centralisés dans `src/data/aftuScheduleSettings.ts` et protégés par des tests automatisés.

| Paramètre | Valeur CETUD |
|---|---|
| Plage générale de service | 05:30–22:00 |
| Heures de pointe | 06:00–09:00 et 17:00–20:00 |
| Intervalle en pointe | 10–15 min |
| Intervalle hors pointe | 25–40 min |

Ces valeurs sont des paramètres de configuration du réseau AFTU. Elles constituent le référentiel horaire commun du chantier.

## Ligne AFTU 90

- Arrêts aller : 82 occurrences.
- Arrêts retour : 82 occurrences.
- Temps de parcours moyen de référence : 1 h 15 à 1 h 30.
- Les deux directions et les répétitions de noms restent conservées.

## Règles d'application

1. Les valeurs CETUD sont conservées comme settings réseau et ne doivent pas être requalifiées en estimations personnelles.
2. Une rotation propre à une ligne ou à un sens peut compléter ces settings sans les écraser.
3. Ne pas fabriquer des heures de passage par arrêt à partir d'un simple intervalle réseau.
4. Les séquences d'arrêts validées restent inchangées.
5. Les données TER/BRT restent strictement hors périmètre.

## Validation automatisée

Le test `src/data/aftuScheduleSettings.test.ts` vérifie la provenance CETUD, la plage générale, les deux périodes de pointe, les intervalles et les références de la ligne 90.

Ce paramétrage ne modifie pas les données de production et ne déclenche aucune publication.
