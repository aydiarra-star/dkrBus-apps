import { describe, expect, it } from 'vitest'
import { BRT_STOPS, TER_STOPS } from './corridors'
import { boardLinesForNetwork, buildStationBoard, stationShortName } from './stationBoard'
import { nextReferencePassage } from './headways'
import { OFFICIAL_REFERENCE_FREQUENCIES } from './frequencies'

/** Jeudi 8 octobre 2026, 12:00:00 UTC (heure de Dakar, UTC+00 toute l'année). */
const NOW = Date.parse('2026-10-08T12:00:00.000Z')

describe('tableau des créneaux par station et par sens', () => {
  it('construit une ligne par station du TER, avec les deux sens distincts', () => {
    const line = boardLinesForNetwork('ter')[0]
    const board = buildStationBoard(line, NOW)!
    expect(board).toBeTruthy()
    expect(board.rows).toHaveLength(14)
    expect(board.rows).toHaveLength(TER_STOPS.length)
    expect(board.originStop.id).toBe('ter-dakar')
    expect(board.destinationStop.id).toBe('ter-aibd')

    // Une gare intermédiaire (Colobane) : un créneau par sens, distincts.
    const colobane = board.rows.find((row) => row.stop.id === 'ter-colobane')!
    expect(colobane.outbound).toBeTruthy()
    expect(colobane.inbound).toBeTruthy()
    // Les plages observées sont symétriques, mais chaque sens projette sa
    // grille depuis son propre terminus.
    expect(colobane.offsetFromOriginMin).toBeGreaterThan(0)
    expect(colobane.offsetFromDestinationMin).toBeGreaterThan(0)
    expect(colobane.offsetFromDestinationMin).toBeGreaterThan(colobane.offsetFromOriginMin)
    expect(colobane.offsetFromOriginMin).toBe(3)
    expect(colobane.offsetFromDestinationMin).toBe(53.5)

    // Le créneau aller est projeté depuis Dakar : il suit la grille déclarée.
    expect(colobane.outbound!.headwayMinutes).toBe(8)
    expect(colobane.outbound!.clockLabel).toMatch(/^\d{2}:\d{2}$/)
    expect(colobane.inbound!.headwayMinutes).toBe(8)
  })

  it('projette le créneau aller avec le temps de parcours depuis le terminus', () => {
    const line = boardLinesForNetwork('ter')[0]
    const board = buildStationBoard(line, NOW)!
    // À 12:00 pile, la grille TER (8 min depuis 05:35) place le prochain
    // départ de Dakar à 12:07.
    const dakar = board.rows[0]
    expect(dakar.outbound!.clockLabel).toBe('12:07')
    // Dalifort (4e gare) est atteinte entre 10 et 11 min après Dakar : à 12:00, le
    // départ de grille 11:51 y passe encore, projeté vers 12:01:30. Chaque
    // station affiche bien le prochain passage *chez elle*.
    const dalifort = board.rows.find((row) => row.stop.id === 'ter-dalifort')!
    expect(dalifort.offsetFromOriginMin).toBe(10.5)
    expect(dalifort.offsetFromOriginMin).toBeGreaterThan(dakar.offsetFromOriginMin)
    expect(dalifort.outbound!.clockLabel).toBe('12:01')
    expect(dalifort.outbound!.minutes).toBe(2)
    // Le créneau aller est bien porté par la grille déclarée du terminus.
    expect(dalifort.outbound!.headwayMinutes).toBe(8)
  })

  it('applique la cadence propre à chaque segment TER, dans les deux sens', () => {
    const board = buildStationBoard(boardLinesForNetwork('ter')[0], NOW)!
    const colobane = board.rows.find((row) => row.stop.id === 'ter-colobane')!
    const diamniadio = board.rows.find((row) => row.stop.id === 'ter-diamniadio')!
    const aibd = board.rows.find((row) => row.stop.id === 'ter-aibd')!
    expect(colobane.outbound!.headwayMinutes).toBe(8)
    expect(colobane.inbound!.headwayMinutes).toBe(8)
    expect(diamniadio.outbound!.headwayMinutes).toBe(8)
    expect(diamniadio.inbound!.headwayMinutes).toBe(8)
    expect(diamniadio.outboundAirport!.headwayMinutes).toBe(24)
    expect(diamniadio.inboundAirport!.headwayMinutes).toBe(24)
    const outboundPhaseGap = (Date.parse(diamniadio.outboundAirport!.nextDepartureAt) - Date.parse(diamniadio.outbound!.nextDepartureAt)) / 60_000
    expect([0, 8, 16]).toContain(outboundPhaseGap)
    expect(aibd.inbound!.headwayMinutes).toBe(24)
    expect(aibd.outbound!.headwayMinutes).toBe(24)
    expect(aibd.outbound!.nextDepartureAt).toBe(
      nextReferencePassage(
        OFFICIAL_REFERENCE_FREQUENCIES.ter.filter((frequency) => frequency.routeSegment === 'DIAMNIADIO_AIBD'),
        NOW,
        56.5,
      )!.nextDepartureAt,
    )
  })


  it('propage les missions depuis leur terminus et conserve la phase 1 train sur 3 à Diamniadio', () => {
    const board = buildStationBoard(
      boardLinesForNetwork('ter')[0],
      Date.parse('2026-10-08T13:44:00.000Z'),
    )!
    const diamniadio = board.rows.find((row) => row.stop.id === 'ter-diamniadio')!
    const aibd = board.rows.find((row) => row.stop.id === 'ter-aibd')!
    expect(diamniadio.outbound!.headwayMinutes).toBe(8)
    expect(diamniadio.outboundAirport!.headwayMinutes).toBe(24)
    expect(diamniadio.outboundAirport!.nextDepartureAt).toBe(
      nextReferencePassage(
        OFFICIAL_REFERENCE_FREQUENCIES.ter.filter((frequency) => frequency.routeSegment === 'DIAMNIADIO_AIBD'),
        Date.parse('2026-10-08T13:44:00.000Z'),
        44.5,
      )!.nextDepartureAt,
    )
    expect(aibd.inbound!.headwayMinutes).toBe(24)
    expect(aibd.inbound!.nextDepartureAt).toBe(
      nextReferencePassage(
        OFFICIAL_REFERENCE_FREQUENCIES.ter.filter((frequency) => frequency.routeSegment === 'DIAMNIADIO_AIBD'),
        Date.parse('2026-10-08T13:44:00.000Z'),
        0,
      )!.nextDepartureAt,
    )
  })

  it('ancre le retour tous trains à Diamniadio et propage vers Dakar', () => {
    const now = Date.parse('2026-10-08T13:44:00.000Z')
    const board = buildStationBoard(boardLinesForNetwork('ter')[0], now)!
    const diamniadio = board.rows.find((row) => row.stop.id === 'ter-diamniadio')!
    const pnr = board.rows.find((row) => row.stop.id === 'ter-pnr')!
    expect(diamniadio.inbound!.headwayMinutes).toBe(8)
    expect(diamniadio.inbound!.nextDepartureAt).toBe(
      nextReferencePassage(
        OFFICIAL_REFERENCE_FREQUENCIES.ter.filter((frequency) => frequency.routeSegment === 'DAKAR_DIAMNIADIO'),
        now,
        0,
      )!.nextDepartureAt,
    )
    expect(pnr.inbound!.headwayMinutes).toBe(8)
    expect(pnr.inbound!.nextDepartureAt).toBe(
      nextReferencePassage(
        OFFICIAL_REFERENCE_FREQUENCIES.ter.filter((frequency) => frequency.routeSegment === 'DAKAR_DIAMNIADIO'),
        now,
        12.5,
      )!.nextDepartureAt,
    )
    expect(diamniadio.inboundAirport!.headwayMinutes).toBe(24)
  })

  it('calcule le compte à rebours de chaque gare à partir du départ de mission propagé', () => {
    const now = Date.parse('2026-10-08T13:44:00.000Z')
    const board = buildStationBoard(boardLinesForNetwork('ter')[0], now)!
    const pnr = board.rows.find((row) => row.stop.id === 'ter-pnr')!
    const rufisque = board.rows.find((row) => row.stop.id === 'ter-rufisque')!
    const bargny = board.rows.find((row) => row.stop.id === 'ter-bargny')!
    // Deux trains différents peuvent légitimement passer à la même minute :
    // le train attendu à PNR n'est pas nécessairement celui attendu à Bargny.
    expect(pnr.outbound!.nextDepartureAt).toBe('2026-10-08T13:51:00.000Z')
    expect(rufisque.outbound!.nextDepartureAt).toBe('2026-10-08T13:45:30.000Z')
    expect(bargny.outbound!.nextDepartureAt).toBe('2026-10-08T13:51:00.000Z')
  })

  it('ne fait embarquer personne dans le sens impossible au terminus', () => {
    const board = buildStationBoard(boardLinesForNetwork('brt')[0], NOW)!
    // Au terminus d'origine : pas de départ « retour » (on n'y va pas déjà).
    expect(board.rows[0].inbound).toBeNull()
    expect(board.rows[0].outbound).toBeTruthy()
    // Au terminus opposé : pas de départ « aller ».
    const last = board.rows[board.rows.length - 1]
    expect(last.outbound).toBeNull()
    expect(last.inbound).toBeTruthy()
    // Les stations intermédiaires desservent les deux sens.
    expect(board.rows).toHaveLength(BRT_STOPS.length)
    const placeNation = board.rows.find((row) => row.stop.id === 'brt-place-nation')!
    expect(placeNation.outbound).toBeTruthy()
    expect(placeNation.inbound).toBeTruthy()
  })

  it('couvre les stations suivantes dans les deux sens, partout sur la ligne', () => {
    const board = buildStationBoard(boardLinesForNetwork('brt')[0], NOW)!
    // Chaque station intermédiaire affiche un créneau aller ET retour.
    for (const row of board.rows.slice(1, -1)) {
      expect(row.outbound).not.toBeNull()
      expect(row.inbound).not.toBeNull()
    }
    // Les parcours cumulés croissent depuis l'origine et décroissent depuis
    // le terminus opposé : la projection des deux sens reste cohérente.
    for (let i = 1; i < board.rows.length; i += 1) {
      expect(board.rows[i].offsetFromOriginMin).toBeGreaterThan(board.rows[i - 1].offsetFromOriginMin)
      expect(board.rows[i].offsetFromDestinationMin).toBeLessThan(board.rows[i - 1].offsetFromDestinationMin)
    }
  })

  it('reste honnête : DDD et AFTU / TATA affichent leurs lignes de référence en pointillés légers', () => {
    // Après ajustement visuel : TER/BRT en tracés continus, DDD/AFTU/TATA en pointillés légers + pastilles
    expect(boardLinesForNetwork('ter')).toHaveLength(1)
    expect(boardLinesForNetwork('brt')).toHaveLength(1)
    expect(boardLinesForNetwork('ddd').length).toBeGreaterThanOrEqual(1)
    expect(boardLinesForNetwork('aftu_tata').length).toBeGreaterThanOrEqual(1)
    // Les fréquences DDD/AFTU/TATA restent non publiées (UNKNOWN) : pas de prochain passage temps réel
    for (const id of ['ddd', 'aftu_tata'] as const) {
      for (const line of boardLinesForNetwork(id)) {
        expect(line.officialFrequencies).toEqual([])
      }
    }
  })

  it('utilise un libellé court pour les en-têtes de sens', () => {
    expect(stationShortName(BRT_STOPS[0])).toBe('Petersen')
    expect(stationShortName(BRT_STOPS[BRT_STOPS.length - 1])).toBe('Guédiawaye')
    // Sans libellé court déclaré, le nom complet reste la référence.
    expect(stationShortName(TER_STOPS[0])).toBe('Dakar')
  })
})

describe('tableau des créneaux après la fermeture du service', () => {
  it('n’affiche « service non commencé » sur aucune station une fois le service terminé', () => {
    // BRT : service 06:00–21:00. À 21:10 le service est fini au terminus tandis
    // que la dernière course (partie 20:54) atteint encore les stations aval.
    // Aucune ligne du tableau ne peut annoncer un service non commencé.
    const line = boardLinesForNetwork('brt')[0]
    const board = buildStationBoard(line, Date.parse('2026-10-08T21:10:00.000Z'))!
    const statuses = board.rows.flatMap((row) => [row.outbound?.status, row.inbound?.status])
    expect(statuses).not.toContain('BEFORE_SERVICE')
    // Le terminus annonce la reprise du lendemain, les stations aval la dernière course.
    expect(board.rows[0].outbound?.status).toBe('AFTER_SERVICE')
    expect(board.rows.some((row) => row.outbound?.status === 'RUNNING')).toBe(true)
  })

  it('n’annonce aucun créneau BRT après l’arrivée de la dernière course', () => {
    const line = boardLinesForNetwork('brt')[0]
    const board = buildStationBoard(line, Date.parse('2026-10-08T22:30:00.000Z'))!
    const passages = board.rows.flatMap((row) => [row.outbound, row.inbound]).filter(Boolean)
    expect(passages.length).toBeGreaterThan(0)
    for (const passage of passages) {
      expect(passage!.status).toBe('AFTER_SERVICE')
      expect(passage!.clockLabel.startsWith('06:')).toBe(true)
    }
  })
})
