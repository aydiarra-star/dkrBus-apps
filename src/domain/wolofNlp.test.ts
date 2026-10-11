import { describe, expect, it } from 'vitest'
import {
  PLACE_ALIASES,
  foldWolof,
  resolveWolofPlace,
  understandWolof,
  wolofSignal,
  wolofPlaceMentions,
} from './wolofNlp'
import { ALL_CORRIDOR_STOPS, getCorridorStop } from './corridors'

describe('réduction phonétique wolof', () => {
  it('rend la même forme pour l’orthographe standard et la transcription française', () => {
    // Les équivalences sont celles de la prononciation, pas des hasards.
    expect(foldWolof('jël')).toBe(foldWolof('jel'))
    expect(foldWolof('gën a')).toBe(foldWolof('gen a'))
    expect(foldWolof('ñaata')).toBe(foldWolof('nata'))
    expect(foldWolof('ñu ngi')).toBe(foldWolof('nu ngi'))
    expect(foldWolof('joge')).toBe(foldWolof('jóge'))
    expect(foldWolof('correspondance')).toContain('korre')
    expect(foldWolof('  Nanga   def ! ')).toBe('nanga def')
  })

  it('ne garde aucun signe de ponctuation dans la forme réduite', () => {
    expect(foldWolof('Ndakaaru?')).toBe('ndakaru')
    expect(/[^\w\s]/.test(foldWolof('« Dem na ci BRT ! »'))).toBe(false)
  })
})

describe('compréhension wolof', () => {
  it('comprend « Naka laay def ngir dem Garu Ndakaaru » comme une demande d’itinéraire', () => {
    const understood = understandWolof('Naka laay def ngir dem Garu Ndakaaru ?')
    expect(understood.wolof).toBe(true)
    expect(understood.intent).toBe('journey')
    expect(understood.destinationText).toBe(getCorridorStop('ter-dakar')?.name)
    // Aucun départ n'est énoncé : le module ne l'invente pas, c'est au copilote
    // de le demander.
    expect(understood.originText).toBeNull()
    expect(understood.confidence).toBe('high')
  })

  it('accepte une transcription approximative du même lieu', () => {
    expect(understandWolof('naka laay def ngir dem garou dakar').destinationText).toBe(getCorridorStop('ter-dakar')?.name)
    expect(understandWolof('dama bëgg a dem ndakaaru').destinationText).toBe(getCorridorStop('ter-dakar')?.name)
  })

  it('résout un départ et une destination cités dans l ordre de la phrase', () => {
    const understood = understandWolof('nou jege thiaroye dem pikine')
    expect(understood.intent).toBe('journey')
    expect(understood.originText).toBeTruthy()
    expect(understood.destinationText).toBeTruthy()
    expect(understood.originText).not.toBe(understood.destinationText)
  })

  it('classe les intentions courtes d’un guichet', () => {
    expect(understandWolof('fan la sama jël BRT').intent).toBe('where_to_board')
    expect(understandWolof('station bi gën a jege').intent).toBe('nearest_stop')
    expect(understandWolof('ñaata la tarif bi').intent).toBe('fare')
    expect(understandWolof('ñaata la fréquence BRT').intent).toBe('frequency')
    expect(understandWolof('lan la correspondance à Petersen').intent).toBe('transfers')
    expect(understandWolof('nanga def').intent).toBe('greeting')
    expect(understandWolof('jërëjëf').intent).toBe('thanks')
  })

  it('ne classe pas une question de fréquence en question de prix', () => {
    // « ñaata » seul ne dit pas de quoi on parle ; le mot explicite tranche.
    expect(understandWolof('ñaata la fréquence BRT').intent).not.toBe('fare')
    expect(understandWolof('ñaata la tarif bi').intent).toBe('fare')
  })

  it('relève le réseau et le critère demandés', () => {
    // Le réseau n'est retenu que s'il est dit : « ndakaaru » seul ne fait pas
    // choisir TER par hypothèse.
    const speed = understandWolof('naka laay def ngir dem ndakaaru, bi gën a gaw')
    expect(speed.criterion).toBe('speed')
    expect(speed.network).toBeNull()
    expect(understandWolof('ñaata la tarif BRT').network).toBe('brt')
    expect(understandWolof('dernier train TER').network).toBe('ter')
    expect(understandWolof('dama bëgg yoon bu amul soppi').criterion).toBe('transfers')
  })

  it('orient le trajet d’après les mots de la phrase, pas d’après l’ordre des lieux', () => {
    const stop = (id: string) => getCorridorStop(id)?.name
    // Le lieu cité en second est le départ : « je suis à Keur Mbaye Fall ».
    const first = understandWolof('Comment faire pour aller à Dakar ? Je suis à Keur Mbaye Fall')
    expect(first.originText).toBe(stop('ter-mbao'))
    expect(first.destinationText).toBe(stop('ter-dakar'))
    // Même phrase en wolof : « dem » marque la destination, « jóge » le départ.
    const second = understandWolof('naka laay def ngir dem Ndakaaru, sama jóge Guédiawaye')
    expect(second.destinationText).toBe(stop('ter-dakar'))
    expect(second.originText).toBeTruthy()
    // Un lieu unique sans indice est la destination visée, jamais le départ.
    const single = understandWolof('naka laay def ngir dem Garu Ndakaaru ?')
    expect(single.originText).toBeNull()
    expect(single.destinationText).toBe(stop('ter-dakar'))
  })

  it('signale que le départ vient de l’appareil, sans le confondre avec un lieu', () => {
    expect(understandWolof('naka laay def ngir dem ndakaaru, sama position').originFromSelf).toBe(true)
    expect(understandWolof('naka laay def ngir dem ndakaaru').originFromSelf).toBe(false)
  })

  it('garde une phrase française en français', () => {
    const understood = understandWolof('Comment aller de Pikine à la gare de Dakar')
    expect(understood.wolof).toBe(false)
    // Le sens est pourtant compris, et les deux lieux sont résolus.
    expect(understood.intent).toBe('journey')
    expect(understood.originText).toBeTruthy()
    expect(understood.destinationText).toBeTruthy()
  })

  it('ne devine pas un lieu hors référentiel', () => {
    const understood = understandWolof('naka laay def ngir dem Kénawa Villagë')
    expect(understood.placeNames).toEqual([])
    expect(understood.destinationText).toBeNull()
    expect(understood.originText).toBeNull()
    expect(wolofPlaceMentions(foldWolof('dem Kénawa Villagë'))).toHaveLength(0)
  })

  it('ne reconnaît pas une langue sans marqueur wolof', () => {
    expect(wolofSignal('xyz').score).toBe(0)
    expect(wolofSignal('Très bien, merci').score).toBe(0)
    expect(understandWolof('Pikine').wolof).toBe(false)
  })
})

describe('résolution des lieux', () => {
  it('ne résout que des arrêts du réseau de référence', () => {
    for (const alias of Object.keys(PLACE_ALIASES)) {
      const [stop] = resolveWolofPlace(alias)
      expect(stop, alias).toBeTruthy()
      expect(ALL_CORRIDOR_STOPS.some((candidate) => candidate.id === stop?.id), alias).toBe(true)
    }
  })

  it('préfère le réseau cité quand un lieu existe sur plusieurs réseaux', () => {
    expect(resolveWolofPlace('guédiawaye', 'brt')[0]?.id).toBe('brt-prefecture-guediawaye')
    expect(resolveWolofPlace('guédiawaye', 'tata')[0]?.id).toBe('tata-guediawaye')
    // Un réseau demandé qui ne dessert pas ce lieu ne fait pas inventer d arrêt :
    // on retombe sur le réseau de référence prioritaire pour ce point.
    expect(resolveWolofPlace('pikine', 'brt')[0]?.id).toBe('ter-pikine')
  })

  it('ne lit pas quatre fois un quartier présent sur quatre réseaux', () => {
    expect(understandWolof('dem pikine').placeNames).toHaveLength(1)
  })

  it('ne découpe pas un lieu en deux quand un nom court est dedans', () => {
    const mentions = wolofPlaceMentions(foldWolof('dem parcelles assainies'))
    expect(mentions).toHaveLength(1)
    expect(mentions[0]?.name).toContain('Parcelles')
  })
})
