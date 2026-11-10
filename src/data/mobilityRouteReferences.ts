import type { EstimatedLineSchedule } from '../domain/estimatedSchedules'

type EstimatedScheduleNetwork = 'ddd' | 'aftu' | 'tata'
type MobilityRouteReference = {
  network: EstimatedScheduleNetwork
  code: string
  waypoints: string[]
  outboundSchedule?: EstimatedLineSchedule | null
  inboundWaypoints?: string[]
  inboundSchedule?: EstimatedLineSchedule | null
  detailSourceUrl: string | null
  inboundDetailSourceUrl?: string | null
  note: string | null
}

export async function loadMobilityRouteReferences(): Promise<MobilityRouteReference[]> {
  const [mobility, tata, aftu66Return, aftu57Directions, aftu30Directions, aftu58Directions, aftu67Directions] = await Promise.all([
    import('./mobility-lines.json'),
    import('./tata-lines.json'),
    import('./aftu-66-return.json'),
    import('./aftu-57-directions.json'),
    import('./aftu-30-directions.json'),
    import('./aftu-58-directions.json'),
    import('./aftu-67-directions.json'),
  ])
  const aftuOverrides: Record<string, Partial<MobilityRouteReference>> = {
    '66': aftu66Return.default,
    '57': aftu57Directions.default,
    '30': aftu30Directions.default,
    '58': aftu58Directions.default,
    '67': aftu67Directions.default,
  }
  return [
    ...(mobility.default as MobilityRouteReference[]).map((item) => {
      const details = item.network === 'aftu' ? aftuOverrides[item.code] : undefined
      return details ? { ...item, ...details } : item
    }),
    ...(tata.default as MobilityRouteReference[]),
  ]
}
