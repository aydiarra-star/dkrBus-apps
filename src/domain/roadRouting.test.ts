import { describe, expect, it } from 'vitest'
import { parseRoadRouteQuery } from './roadRouting'

describe('parseRoadRouteQuery', () => {
  it('reconnaît les trajets saisis directement dans la recherche', () => {
    expect(parseRoadRouteQuery('Dakar à Pikine')).toEqual({ origin: 'Dakar', destination: 'Pikine' })
    expect(parseRoadRouteQuery('Trajet de Dakar vers Pikine')).toEqual({ origin: 'Dakar', destination: 'Pikine' })
    expect(parseRoadRouteQuery('Dakar → Pikine')).toEqual({ origin: 'Dakar', destination: 'Pikine' })
    expect(parseRoadRouteQuery('Thiès à Saint-Louis')).toEqual({ origin: 'Thiès', destination: 'Saint-Louis' })
    expect(parseRoadRouteQuery('Dakar vers Mbour')).toEqual({ origin: 'Dakar', destination: 'Mbour' })
    expect(parseRoadRouteQuery('Compare les trajets de Préfecture de Guédiawaye à Rufisque, moins de marche')).toBeNull()
  })

  it('ignore une recherche qui ne contient pas deux lieux distincts', () => {
    expect(parseRoadRouteQuery('Dakar')).toBeNull()
    expect(parseRoadRouteQuery('Dakar à Dakar')).toBeNull()
    expect(parseRoadRouteQuery('   ')).toBeNull()
  })
})
