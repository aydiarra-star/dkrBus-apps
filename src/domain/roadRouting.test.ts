import { describe, expect, it } from 'vitest'
import { parseRoadRouteQuery } from './roadRouting'

describe('parseRoadRouteQuery', () => {
  it('reconnaît les trajets saisis directement dans la recherche', () => {
    expect(parseRoadRouteQuery('Dakar à Pikine')).toEqual({ origin: 'Dakar', destination: 'Pikine' })
    expect(parseRoadRouteQuery('Trajet de Dakar vers Pikine')).toEqual({ origin: 'Dakar', destination: 'Pikine' })
    expect(parseRoadRouteQuery('Dakar → Pikine')).toEqual({ origin: 'Dakar', destination: 'Pikine' })
  })

  it('ignore une recherche qui ne contient pas deux lieux distincts', () => {
    expect(parseRoadRouteQuery('Dakar')).toBeNull()
    expect(parseRoadRouteQuery('Dakar à Dakar')).toBeNull()
    expect(parseRoadRouteQuery('   ')).toBeNull()
  })
})
