import { describe, expect, it } from 'vitest'
import { OFFICIAL_REFERENCE_FREQUENCIES } from './frequencies'
import { formatPassageCountdown, nextCountdownTickDelay, nextReferencePassage } from './headways'

const BRT = OFFICIAL_REFERENCE_FREQUENCIES.brt
const TER = OFFICIAL_REFERENCE_FREQUENCIES.ter

/** Jeudi 8 octobre 2026, 12:00:00 UTC (heure de Dakar, UTC+00 toute l'année). */
const at = (iso: string) => Date.parse(iso)

describe('prochains créneaux théoriques', () => {
  it('calcule le prochain créneau BRT depuis la fréquence officielle', () => {
    const passage = nextReferencePassage(BRT, at('2026-10-08T12:00:00Z'))!
    expect(passage.status).toBe('RUNNING')
    expect(passage.headwayMinutes).toBe(6)
    expect(passage.clockLabel).toBe('12:06')
    expect(passage.minutes).toBe(6)
    expect(passage.note).toMatch(/ni une position de véhicule, ni du temps réel/)
  })

  it('décrémente le décompte à mesure que le temps passe', () => {
    const start = at('2026-10-08T12:00:00Z')
    expect(nextReferencePassage(BRT, start)!.minutes).toBe(6)
    // À 12:01:00, il reste exactement 5 minutes : le décompte passe à 5.
    expect(nextReferencePassage(BRT, start + 60_000)!.minutes).toBe(5)
    expect(nextReferencePassage(BRT, start + 4 * 60_000)!.minutes).toBe(2)
    // Jamais « 0 min » : le créneau suivant est annoncé dès que le précédent est passé.
    expect(nextReferencePassage(BRT, start + 6 * 60_000)!.minutes).toBe(6)
    expect(nextReferencePassage(BRT, start + 6 * 60_000)!.clockLabel).toBe('12:12')
  })

  it('ne déclare pas un service en cours quand le jour courant n’est pas desservi', () => {
    // Lundi 5 octobre 2026, 23:00 UTC : la fréquence ne circule que le mardi,
    // mais sa plage horaire du lundi couvre encore 23:00. Le service n’est pas
    // en cours (aucune course lundi) : le créneau suivant est un mardi.
    const tuesdayOnly = [{ ...TER[0], days: ['TUE'] as const, serviceStart: '05:00', serviceEnd: '23:30', headwayMinutes: 10 }]
    const passage = nextReferencePassage(tuesdayOnly, at('2026-10-05T23:00:00Z'))!
    expect(passage.status).toBe('AFTER_SERVICE')
    expect(passage.clockLabel).toBe('05:00')
  })

  it('n’affiche jamais un créneau inférieur à une minute', () => {
    const passage = nextReferencePassage(BRT, at('2026-10-08T12:05:59Z'))!
    expect(passage.clockLabel).toBe('12:06')
    expect(passage.minutes).toBe(1)
  })

  it('annonce le premier créneau quand le service n’a pas commencé', () => {
    const passage = nextReferencePassage(BRT, at('2026-10-08T05:30:00Z'))!
    expect(passage.status).toBe('BEFORE_SERVICE')
    expect(passage.clockLabel).toBe('06:00')
    expect(passage.minutes).toBe(30)
    expect(passage.note).toMatch(/service non commencé/i)
  })

  it('annonce la reprise quand le dernier créneau du service est passé', () => {
    const passage = nextReferencePassage(BRT, at('2026-10-08T20:59:00Z'))!
    expect(passage.status).toBe('LAST_PAST')
    expect(passage.clockLabel).toBe('06:00')
    // 20:59 → 06:00 le lendemain : 9 h 01.
    expect(passage.minutes).toBe(541)
    expect(formatPassageCountdown(passage.minutes)).toBe('9 h 01')
    expect(passage.note).toMatch(/dernier créneau du service passé/i)
  })

  it('renvoie sur le lendemain quand le service est fermé', () => {
    const passage = nextReferencePassage(BRT, at('2026-10-08T21:00:00Z'))!
    expect(passage.status).toBe('AFTER_SERVICE')
    expect(passage.clockLabel).toBe('06:00')
    expect(passage.minutes).toBe(540)
    expect(passage.note).toMatch(/service terminé/i)
  })

  it('exclut le créneau tombant sur l’heure de fin de service', () => {
    // 20:54 est le dernier créneau de la grille (06:00 + 149 × 6 min).
    expect(nextReferencePassage(BRT, at('2026-10-08T20:53:00Z'))!.clockLabel).toBe('20:54')
  })

  it('suit la nouvelle grille TER en semaine', () => {
    // Lundi 5 octobre 2026 : grille Dakar–Diamniadio toutes les 8 min.
    const midday = nextReferencePassage(TER.filter((f) => f.routeSegment === 'DAKAR_DIAMNIADIO'), at('2026-10-05T12:00:00Z'))!
    expect(midday.clockLabel).toBe('12:07')
    expect(midday.headwayMinutes).toBe(8)
    expect(midday.holidayCaveat).toBe(true)

    // La grille de soirée conserve la même cadence jusqu'à la fin de service.
    const evening = nextReferencePassage(TER.filter((f) => f.routeSegment === 'DAKAR_DIAMNIADIO'), at('2026-10-05T21:30:00Z'))!
    expect(evening.clockLabel).toBe('21:35')
    expect(evening.headwayMinutes).toBe(8)
  })

  it('applique la grille du dimanche selon le segment TER', () => {
    // Dimanche 11 octobre 2026 : phase 1 à 20 min ; phase 2 à 30 min.
    const sunday = nextReferencePassage(TER.filter((f) => f.routeSegment === 'DAKAR_DIAMNIADIO'), at('2026-10-11T06:00:00Z'))!
    expect(sunday.clockLabel).toBe('06:30')
    expect(sunday.status).toBe('BEFORE_SERVICE')
    expect(sunday.minutes).toBe(30)
    const airport = nextReferencePassage(TER.filter((f) => f.routeSegment === 'DIAMNIADIO_AIBD'), at('2026-10-11T06:00:00Z'))!
    expect(airport.clockLabel).toBe('06:17')
    expect(airport.headwayMinutes).toBe(30)
  })

  it('applique la grille spéciale TER un jour férié en semaine', () => {
    // Noël 2026 tombe un vendredi : la grille spéciale du segment AIBD s'applique.
    const holiday = nextReferencePassage(TER.filter((f) => f.routeSegment === 'DIAMNIADIO_AIBD'), at('2026-12-25T06:00:00Z'))!
    expect(holiday.clockLabel).toBe('06:17')
    expect(holiday.headwayMinutes).toBe(30)
    expect(holiday.status).toBe('BEFORE_SERVICE')
    expect(holiday.holidayCaveat).toBe(false)
  })

  it('applique la grille spéciale TER un jour férié qui tombe un samedi', () => {
    const holiday = nextReferencePassage(TER.filter((f) => f.routeSegment === 'DAKAR_DIAMNIADIO'), at('2026-03-21T06:40:00Z'))!
    expect(holiday.clockLabel).toBe('06:50')
    expect(holiday.headwayMinutes).toBe(20)
    expect(holiday.status).toBe('RUNNING')
  })

  it('n’invente pas de créneau TER pour une année sans calendrier férié confirmé', () => {
    expect(nextReferencePassage(TER, at('2027-01-04T12:00:00Z'))).toBeNull()
  })

  it('ne renvoie rien quand aucune fréquence exploitable n’est déclarée', () => {
    expect(nextReferencePassage([], Date.now())).toBeNull()
    expect(nextReferencePassage([{ ...BRT[0], headwayMinutes: 0 }], Date.now())).toBeNull()
  })

  it('projette le créneau à distance de l’origine avec un décalage de parcours', () => {
    // Jeudi 8 octobre 2026, 12:00 : la grille BRT part de 06:00 toutes les
    // 6 min. Le départ de grille 11:54 atteint une station à 8 minutes de
    // parcours à 12:02 : c'est le prochain créneau projeté (2 min d'attente).
    const now = at('2026-10-08T12:00:00Z')
    const projected = nextReferencePassage(BRT, now, 8)!
    expect(projected.clockLabel).toBe('12:02')
    expect(projected.minutes).toBe(2)
    expect(projected.headwayMinutes).toBe(6)
    // La fenêtre de service s'apprécie au terminus, origine de la grille :
    // le créneau 12:02 reste porté par le départ 11:54 de la grille déclarée.
    expect(projected.status).toBe('RUNNING')
  })

  it('peut afficher un créneau projeté dont le départ du terminus vient de passer', () => {
    // À 12:07, le départ de grille 12:06 vient de passer : une station à
    // 4 minutes de parcours voit encore ce passage, projeté à 12:10.
    const now = at('2026-10-08T12:07:00Z')
    const projected = nextReferencePassage(BRT, now, 4)!
    expect(projected.clockLabel).toBe('12:10')
    expect(projected.minutes).toBe(3)
  })


  it('conserve la journée de service J pour un passage projeté après minuit', () => {
    // Départ du terminus le mercredi à 22:45, passage à la station aval
    // le jeudi à 00:25 (offset de 100 min). À 00:20, la course de J doit
    // rester prioritaire sur la grille du jeudi matin.
    const lateService = [{
      ...BRT[0],
      serviceStart: '22:00',
      serviceEnd: '23:00',
      headwayMinutes: 15,
    }]
    const passage = nextReferencePassage(
      lateService,
      at('2026-10-08T00:20:00Z'),
      100,
    )!
    expect(passage.clockLabel).toBe('00:25')
    expect(passage.minutes).toBe(5)
    expect(passage.status).toBe('RUNNING')
    expect(passage.nextDepartureAt).toBe('2026-10-08T00:25:00.000Z')
  })

  it('compare la course reportée de la veille avec les passages du jour', () => {
    // À 00:20, une course de la veille projetée à 05:45 ne doit pas masquer
    // le premier départ du jour, projeté à 05:00 (décalage de 7 heures).
    const lateService = [{
      ...BRT[0],
      serviceStart: '22:00',
      serviceEnd: '23:00',
      headwayMinutes: 15,
    }]
    const passage = nextReferencePassage(
      lateService,
      at('2026-10-08T00:20:00Z'),
      7 * 60,
    )!
    expect(passage.clockLabel).toBe('05:00')
    expect(passage.minutes).toBe(280)
    expect(passage.nextDepartureAt).toBe('2026-10-08T05:00:00.000Z')
  })

  it('garde un décalage nul strictement équivalent au comportement historique', () => {
    const now = at('2026-10-08T12:00:00Z')
    expect(nextReferencePassage(BRT, now, 0)!.clockLabel).toBe('12:06')
    expect(nextReferencePassage(BRT, now)!.clockLabel).toBe('12:06')
  })
})

describe('formatage du décompte', () => {
  it('affiche des minutes, puis des heures, jamais zéro', () => {
    expect(formatPassageCountdown(6)).toBe('6 min')
    expect(formatPassageCountdown(59)).toBe('59 min')
    expect(formatPassageCountdown(60)).toBe('1 h')
    expect(formatPassageCountdown(65)).toBe('1 h 05')
    expect(formatPassageCountdown(null)).toBe('—')
    expect(formatPassageCountdown(0)).toBe('—')
  })
})

describe('temporisation du décompte', () => {
  it('arme la prochaine temporisation au changement de valeur affichée', () => {
    const now = at('2026-10-08T12:00:00Z')
    // Créneau à 12:05:01 : la valeur passe de 6 à 5 min une seconde plus tard.
    expect(nextCountdownTickDelay(['2026-10-08T12:05:01Z'], now)).toBe(1_030)
    // Sous une minute, on réveille l’interface à la seconde.
    expect(nextCountdownTickDelay(['2026-10-08T12:00:30Z'], now)).toBe(1_030)
    // Au-delà d’une minute, on attend le prochain changement de minute affichée.
    expect(nextCountdownTickDelay(['2026-10-08T12:03:20Z'], now)).toBe(20_030)
  })

  it('ignore les instants passés et les horodatages illisibles', () => {
    const now = at('2026-10-08T12:00:00Z')
    expect(nextCountdownTickDelay(['2026-10-08T11:00:00Z'], now)).toBeNull()
    expect(nextCountdownTickDelay(['pas une date'], now)).toBeNull()
    expect(nextCountdownTickDelay([], now)).toBeNull()
  })

  it('borne la temporisation pour ne jamais dépasser une minute d’attente', () => {
    const now = at('2026-10-08T12:00:00Z')
    expect(nextCountdownTickDelay(['2026-10-09T12:00:00Z'], now)).toBe(60_030)
  })
})

describe('projection terminus → station intermédiaire', () => {
  it('ne qualifie pas de « service non commencé » un passage projeté après la fermeture', () => {
    // BRT : service 06:00–21:00, 6 min. À 21:10 le service est terminé au
    // terminus, mais le dernier départ (20:54) atteint une station à 17 min de
    // parcours à 21:11. Ce passage est la dernière course en route, pas un
    // service qui n’aurait pas encore commencé.
    const now = at('2026-10-08T21:10:00Z')
    const projected = nextReferencePassage(BRT, now, 17)!
    expect(projected.clockLabel).toBe('21:11')
    expect(projected.minutes).toBe(1)
    expect(projected.status).not.toBe('BEFORE_SERVICE')
    expect(projected.status).toBe('RUNNING')
    expect(projected.note).not.toMatch(/service non commencé/i)
  })

  it('garde des statuts cohérents entre le terminus et les stations en aval', () => {
    const now = at('2026-10-08T21:10:00Z')
    // Au terminus : plus aucun départ aujourd’hui, reprise annoncée à 06:00.
    const terminus = nextReferencePassage(BRT, now, 0)!
    expect(terminus.status).toBe('AFTER_SERVICE')
    expect(terminus.clockLabel).toBe('06:00')
    // En aval : la dernière course partie avant la fermeture est encore en route.
    const downstream = nextReferencePassage(BRT, now, 17)!
    expect(downstream.status).toBe('RUNNING')
    // Aucun des deux ne peut annoncer un service qui n’aurait pas commencé.
    expect([terminus, downstream].some((p) => p.status === 'BEFORE_SERVICE')).toBe(false)
  })

  it('projette un départ TER au-delà de 21:00 sans changer de cadence', () => {
    // TER : 05:35–22:00 à 8 min. Le départ de grille 20:55 atteint une gare
    // à 12 min de parcours à 21:07 : la fenêtre de service s’apprécie au
    // terminus, donc ce passage reste porté par un départ en service.
    const now = at('2026-10-05T21:00:00Z')
    const projected = nextReferencePassage(TER.filter((f) => f.routeSegment === 'DAKAR_DIAMNIADIO'), now, 12)!
    expect(projected.clockLabel).toBe('21:07')
    expect(projected.status).toBe('RUNNING')
    expect(projected.note).not.toMatch(/service non commencé/i)
  })

  it('repasse à AFTER_SERVICE une fois la dernière course arrivée', () => {
    // À 21:20, la grille de journée ne fournit plus aucun départ : la prochaine
    // course est celle du lendemain.
    const now = at('2026-10-08T21:20:00Z')
    expect(nextReferencePassage(BRT, now, 17)!.status).toBe('AFTER_SERVICE')
    expect(nextReferencePassage(BRT, now, 17)!.clockLabel).toBe('06:17')
  })
})

describe('entrées invalides du moteur', () => {
  it('ignore un décalage illisible au lieu de lever une exception', () => {
    const now = at('2026-10-08T12:00:00Z')
    expect(() => nextReferencePassage(BRT, now, Number.NaN)).not.toThrow()
    expect(nextReferencePassage(BRT, now, Number.NaN)!.clockLabel).toBe('12:06')
    expect(nextReferencePassage(BRT, now, Number.POSITIVE_INFINITY)!.clockLabel).toBe('12:06')
  })

  it('renvoie null sur une date illisible plutôt que de produire un horaire invalide', () => {
    expect(nextReferencePassage(BRT, Number.NaN)).toBeNull()
    expect(nextReferencePassage(BRT, Number.POSITIVE_INFINITY)).toBeNull()
    expect(nextReferencePassage(TER, Number.NEGATIVE_INFINITY)).toBeNull()
  })

  it('refuse une fréquence non exploitable sans lever d’exception', () => {
    expect(nextReferencePassage([{ ...BRT[0], headwayMinutes: -6 }], Date.now())).toBeNull()
    expect(nextReferencePassage([{ ...BRT[0], headwayMinutes: Number.NaN }], Date.now())).toBeNull()
    expect(nextReferencePassage([{ ...BRT[0], serviceStart: '25:00' }], Date.now())).toBeNull()
    expect(nextReferencePassage([{ ...BRT[0], serviceEnd: '06:0' }], Date.now())).toBeNull()
    expect(nextReferencePassage([{ ...BRT[0], days: [] }], Date.now())).toBeNull()
  })
})
