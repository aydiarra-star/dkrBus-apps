import { describe, expect, it } from 'vitest'
import { answerAssistant, extractJourneyRequest, getAssistantCountdownMinutes, type AssistantContext } from './assistant'

const CONTEXT: AssistantContext = { publishedAvailable: false, adminOnline: true }

describe('assistant mobilité', () => {
  it('maîtrise les 23 stations BRT et les 13 gares TER', () => {
    const brt = answerAssistant('Quelles sont les stations du BRT ?', CONTEXT)
    expect(brt).toContain('23')
    expect(brt).toContain('Préfecture de Guédiawaye')
    expect(brt).toContain('Petersen')
    const ter = answerAssistant('liste des gares TER', CONTEXT)
    expect(ter).toContain('13')
    expect(ter).toContain('Diamniadio')
    expect(ter).toContain('Rufisque')
  })

  it('répond à « prochain BRT vers Guédiawaye » sans inventer d’heure de passage', () => {
    const answer = answerAssistant('Quel est le prochain BRT vers Guédiawaye ?', CONTEXT)
    expect(answer).toContain('Guédiawaye')
    expect(answer).toMatch(/6 min|toutes les 6/)
    expect(answer).toContain('aucune heure de prochain passage fiable')
    expect(answer).toContain('fréquence seule ne permet pas de déduire')
    expect(answer).toContain('vérification en ligne non documentée')
    expect(answer).not.toMatch(/\bdans \d+ min\b/)
  })

  it('distingue les périodes TER et ne présente pas une référence comme un départ', () => {
    const answer = answerAssistant('Quelle est la fréquence du TER ?', CONTEXT)
    expect(answer).toContain('05h35 de Diamniadio, 05h45 de Dakar')
    expect(answer).toContain('21h05 à 22h05')
    expect(answer).toContain('06h25 à 22h05')
    expect(answer).toContain('Consultée le 2026-10-10')
    expect(answer).not.toMatch(/prochain.*dans \d+ min/i)
  })

  it('ne donne pas de fréquence uniforme ni de compte à rebours DDD/AFTU', () => {
    const ddd = answerAssistant('Quelle est la fréquence de DDD ?', CONTEXT)
    expect(ddd).toContain('38 lignes')
    expect(ddd).toContain('400 bus')
    expect(ddd.toLowerCase()).toContain('fréquences non publiées ligne par ligne')
    expect(ddd).not.toMatch(/dans \d+ min/)

    const aftu = answerAssistant('Quand passe le prochain bus AFTU ?', CONTEXT)
    expect(aftu).toContain('72 lignes')
    expect(aftu.replace(/\s/g, ' ')).toContain('2 300 bus')
    expect(aftu).toContain('14 GIE')
    expect(aftu.toLowerCase()).toContain('aucun prochain départ fiable')
  })

  it('ne calcule le délai que depuis un départ exact programmé du bon réseau', () => {
    const now = Date.parse('2026-10-08T12:00:00Z')
    const scheduled: AssistantContext = {
      ...CONTEXT,
      nextDepartureAt: { network: 'brt', status: 'SCHEDULED', nextDepartureAt: '2026-10-08T12:05:01Z' },
    }
    expect(getAssistantCountdownMinutes('Dans combien de temps le BRT ?', scheduled, now)).toBe(6)
    expect(getAssistantCountdownMinutes('Dans combien de temps le TER ?', scheduled, now)).toBeNull()
    expect(answerAssistant('Dans combien de temps le BRT ?', scheduled, now)).toContain('dans 6 min')
    const expired: AssistantContext = {
      ...CONTEXT,
      nextDepartureAt: { network: 'brt', status: 'SCHEDULED', nextDepartureAt: '2026-10-08T12:00:00Z' },
    }
    expect(getAssistantCountdownMinutes('Dans combien de temps le BRT ?', expired, now)).toBeNull()
    expect(answerAssistant('Dans combien de temps le BRT ?', expired, now)).not.toMatch(/dans \d+ min/)
  })

  it('calcule un itinéraire multimodal en langage naturel', () => {
    const answer = answerAssistant('trajet de Petersen à Rufisque', CONTEXT)
    expect(answer).toContain('Itinéraire de référence')
    expect(answer).toContain('TER')
    expect(answer).toMatch(/min/)
  })

  it('combine BRT et TER avec correspondance quand c’est nécessaire', () => {
    const answer = answerAssistant('comment aller de Préfecture de Guédiawaye à Diamniadio', CONTEXT)
    expect(answer).toContain('correspondance')
    expect(answer).toContain('TER')
    // L'accès au TER peut se faire par le BRT ou par un bus de quartier : le
    // moteur choisit la chaîne réellement la plus courte du référentiel.
    expect(answer).toMatch(/B1|TATA|DDD|AFTU/)
  })

  it('dit honnêtement qu’un lieu non desservi n’est pas deviné', () => {
    const answer = answerAssistant('est-ce que le BRT va à Mbour ?', CONTEXT)
    expect(answer).toContain('plutôt que deviner')
  })

  it('ne fabrique aucune alerte de perturbation', () => {
    const answer = answerAssistant('y a-t-il des perturbations sur le BRT ?', CONTEXT)
    expect(answer).toContain('aucune alerte vérifiable')
    expect(answer).toContain('cetud.sn')
  })

  it('refuse une synthèse trafic périmée ou sans date limite, même gardée dans un ancien contexte', () => {
    const now = Date.parse('2026-10-11T12:00:00Z')
    const context: AssistantContext = {
      ...CONTEXT, trafficSummaryFr: 'Un incident actif de test est confirmé.',
      trafficSummaryValidUntil: '2026-10-11T12:01:00Z',
    }
    expect(answerAssistant('Y a-t-il des bouchons ?', context, now)).toContain('Un incident actif de test')
    expect(answerAssistant('Y a-t-il des bouchons ?', context, now + 60_000)).not.toContain('Un incident actif de test')
    expect(answerAssistant('Y a-t-il des bouchons ?', { ...context, trafficSummaryValidUntil: null }, now)).toContain('aucune alerte vérifiable')
  })

  it('donne l’état réel des données quand on le demande', () => {
    const answer = answerAssistant('où en sont les données publiées ?', CONTEXT)
    expect(answer).toContain('aucun snapshot GTFS n’est publié')
    expect(answer).toContain('en ligne')
    const offline = answerAssistant('où en sont les données publiées ?', { publishedAvailable: false, adminOnline: false })
    expect(offline).toContain('npm run admin:api')
  })

  it('comprend une phrase libre et sert l’itinéraire sans rien redemander', () => {
    const answer = answerAssistant('Comment faire pour aller à Dakar ? Je suis à Keur Mbaye Fall', CONTEXT)
    expect(answer).toContain('Itinéraire de référence Keur Mbaye Fall → Dakar')
    expect(answer).toContain('TER')
    expect(answer).not.toContain('Quel est votre point de départ')
    expect(answer).not.toContain('Indiquez « trajet de')
    // L’ordre des propositions ne change pas le résultat.
    expect(answerAssistant('je suis à Parcelles Assainies, je vais à Diamniadio', CONTEXT))
      .toContain('Itinéraire de référence Parcelles → Diamniadio')
  })

  it('propose un itinéraire concret pour un lieu seul, sans phrase toute faite', () => {
    for (const place of ['Parcelles Assainies', 'Petersen', 'Rufisque', 'Keur Mbaye Fall']) {
      const answer = answerAssistant(place, CONTEXT)
      expect(answer).not.toMatch(/Quel est votre point de départ|Destination non reconnue/)
      expect(answer).toMatch(/(gare\/halte TER|station BRT|fiches documentaires)/)
    }
    const parcelles = answerAssistant('Parcelles Assainies', CONTEXT)
    expect(parcelles).toContain('B1')
    expect(parcelles).toContain('Itinéraire repère')
  })

  it('extrait un couple origine/destination d’une phrase naturelle', () => {
    const request = extractJourneyRequest('Comment aller de Colobane à Bargny ?')
    expect(request?.origin.label).toBe('Colobane')
    expect(request?.destination.label).toBe('Bargny')
    expect(extractJourneyRequest('bonjour')).toBeNull()
  })
})

describe('point d’embarquement demandé au guichet', () => {
  const LOCATED: AssistantContext = { ...CONTEXT, userLocation: { lat: 14.7, lon: -17.45 } }

  it('répond où monter un réseau avec les arrêts déclarés et la cadence publiée', () => {
    const answer = answerAssistant('Où prendre le BRT ?', CONTEXT)
    expect(answer).toMatch(/Où embarquer/)
    expect(answer).toMatch(/23 arrêts déclarés/)
    expect(answer).toContain('Petersen')
    expect(answer).toContain('6 minutes')
    expect(answer).toMatch(/Vérifiez le service auprès des opérateurs/)
    // Aucun emplacement physique n'est inventé : ni quai numéroté, ni voie.
    expect(answer).not.toMatch(/quai \d|voie \d/)
  })

  it('borne la réponse au réseau nommé et compte chaque arrêt une fois', () => {
    const ter = answerAssistant('Où monter le TER ?', CONTEXT)
    expect(ter).toMatch(/13 arrêts déclarés/)
    expect(ter).not.toMatch(/BRT \(SunuBRT\)/)
    const both = answerAssistant('Où prendre le TER ou le BRT ?', CONTEXT)
    expect(both).toMatch(/• TER/)
    expect(both).toMatch(/• BRT/)
    // DDD : trois lignes de référence qui partagent des arrêts, comptés une fois.
    const ddd = answerAssistant('Où prendre un bus DDD ?', CONTEXT)
    expect(ddd).toMatch(/lignes de référence, \d+ arrêts déclarés/)
    expect(ddd).toMatch(/fréquences non publiées|Aucun horaire par arrêt/)
  })

  it('demande le réseau manquant au lieu de deviner, et exploite la position autorisée', () => {
    expect(answerAssistant('Où prendre le bus ?', CONTEXT)).toMatch(/Précisez le réseau voulu/)
    expect(answerAssistant('Où monter le TER ?', LOCATED)).toMatch(/Le plus près de votre position/)
    expect(answerAssistant('Où prendre le BRT ?', CONTEXT)).toMatch(/Autorisez la localisation/)
  })

  it('ne confond pas « quand prendre » et « où prendre »', () => {
    const when = answerAssistant('Quand prendre le BRT ?', CONTEXT)
    expect(when).not.toMatch(/Où embarquer/)
    expect(when).toMatch(/fréquence officielle de référence de 6 minutes/)
  })
})

describe('questions d’exemple du cahier des charges', () => {
  const API: AssistantContext = { publishedAvailable: false, adminOnline: true }

  it('trace un trajet de Pikine à la gare de Dakar avec durée, marche et tarif', () => {
    const answer = answerAssistant('Comment aller de Pikine à la gare de Dakar ?', API)
    expect(answer).toMatch(/Itinéraire de référence Pikine → Dakar/)
    expect(answer).toMatch(/marge ±\d+ min/)
    expect(answer).toMatch(/0 correspondance/)
    expect(answer).toMatch(/1 000 F CFA|500 F CFA/)
    // Le détail est daté et qualifié : jamais un horaire prétendu temps réel.
    expect(answer).toMatch(/ni un horaire, ni du temps réel/)
  })

  it('désigne le point d’embarquement du BRT sans inventer de quai', () => {
    const answer = answerAssistant('Où prendre le BRT ?', API)
    expect(answer).toMatch(/Où embarquer/)
    expect(answer).toContain('BRT')
    expect(answer).toMatch(/fréquence officielle de référence de 6 minutes/)
  })

  it('énumère ce que l’on peut faire à Petersen plutôt que d’inventer une correspondance', () => {
    const answer = answerAssistant('Quelles correspondances à Petersen ?', API)
    expect(answer).toContain('Petersen')
    expect(answer).toMatch(/Pôle d’échange/)
    expect(answer).toMatch(/B1/)
  })
})
