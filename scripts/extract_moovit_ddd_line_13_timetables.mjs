import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCES = [
  {
    direction: 'liberte5-to-palais',
    from: 'Terminus Liberté 5',
    to: 'Gare Palais',
    url: 'https://moovitapp.com/index/fr/transport_en_commun-time-13-Dakar-5996-1618037-18051475-4256271-0',
  },
  {
    direction: 'palais-to-liberte5',
    from: 'Gare Palais',
    to: 'Terminus Liberté 5',
    url: 'https://moovitapp.com/index/fr/transport_en_commun-time-13-Dakar-5996-1618037-18051475-4256270-0',
  },
]

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function decodeHtml(value) {
  return value
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
}

function cellText(html) {
  return decodeHtml(html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim())
}

export function parseMoovitTimetableHtml(html, source) {
  const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)]
  const schedules = []

  for (const tableMatch of tables) {
    const tableHtml = tableMatch[1]
    const rows = [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map((rowMatch) => [...rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map((cellMatch) => cellText(cellMatch[1])))
      .filter((cells) => cells.length > 0)

    for (let headerIndex = 0; headerIndex < rows.length; headerIndex += 1) {
      const stops = rows[headerIndex]
      if (stops.length !== 30 || stops.every((value) => TIME_RE.test(value))) continue

      const trips = []
      for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
        const values = rows[rowIndex]
        if (values.length !== 30 || !values.every((value) => TIME_RE.test(value))) break
        trips.push(values)
      }

      if (trips.length === 0) continue
      const firstDepartureMinutes = trips.map((trip) => {
        const [hour, minute] = trip[0].split(':').map(Number)
        return hour * 60 + minute
      })

      const monotonicTrips = trips.every((trip) => trip.every((time, index) => {
        if (index === 0) return true
        return time >= trip[index - 1]
      }))
      const orderedDepartures = firstDepartureMinutes.every((value, index) =>
        index === 0 || value > firstDepartureMinutes[index - 1])

      schedules.push({
        stops,
        trips,
        validation: {
          stopCount: stops.length,
          tripCount: trips.length,
          allTimesValid: trips.every((trip) => trip.every((time) => TIME_RE.test(time))),
          chronologicalAlongStops: monotonicTrips,
          chronologicalDepartures: orderedDepartures,
        },
      })
      headerIndex += trips.length
    }
  }

  const uniqueSchedules = schedules.filter((schedule, index, all) =>
    all.findIndex((candidate) =>
      candidate.stops.join('|') === schedule.stops.join('|')
      && candidate.trips.length === schedule.trips.length
      && candidate.trips[0]?.[0] === schedule.trips[0]?.[0]) === index)

  if (uniqueSchedules.length !== 2) {
    throw new Error(`Expected 2 timetable sections (weekday and Saturday) for ${source.direction}; found ${uniqueSchedules.length}`)
  }

  for (const schedule of uniqueSchedules) {
    if (schedule.validation.stopCount !== 30
      || !schedule.validation.allTimesValid
      || !schedule.validation.chronologicalAlongStops
      || !schedule.validation.chronologicalDepartures) {
      throw new Error(`Invalid timetable matrix for ${source.direction}: ${JSON.stringify(schedule.validation)}`)
    }
  }

  return {
    ...source,
    retrievedOn: new Date().toISOString().slice(0, 10),
    sourceUpdatedOn: (html.match(/Dernière mise à jour le\s*(\d{1,2}\s+\w+\s+\d{4})/i) ?? [])[1] ?? null,
    schedules: uniqueSchedules,
  }
}

async function main() {
  const output = []
  for (const source of SOURCES) {
    const response = await fetch(source.url, {
      headers: { 'user-agent': 'DakarBusResearchBot/1.0 (read-only timetable evidence)' },
      signal: AbortSignal.timeout(25_000),
    })
    if (!response.ok) throw new Error(`Moovit returned HTTP ${response.status} for ${source.direction}`)
    output.push(parseMoovitTimetableHtml(await response.text(), source))
  }

  const totalTrips = output.reduce((sum, route) =>
    sum + route.schedules.reduce((routeSum, schedule) => routeSum + schedule.trips.length, 0), 0)
  const totalValues = output.reduce((sum, route) =>
    sum + route.schedules.reduce((routeSum, schedule) => routeSum + schedule.trips.length * schedule.stops.length, 0), 0)

  const artifact = {
    line: '13',
    operator: 'Dakar Dem Dikk',
    sourceProvider: 'Moovit',
    sourceStatus: 'SECONDARY_SOURCE_NEEDS_RECONCILIATION',
    checkedOn: new Date().toISOString().slice(0, 10),
    totalDirections: output.length,
    totalStopColumns: output.reduce((sum, route) => sum + route.schedules[0].stops.length, 0),
    totalTrips,
    totalTimeValues: totalValues,
    routes: output,
  }

  await mkdir('artifacts/ddd/moovit-line-13', { recursive: true })
  await writeFile('artifacts/ddd/moovit-line-13/line-13-timetable-matrices.json', JSON.stringify(artifact, null, 2) + '\n')
  process.stdout.write(`Extracted ${totalTrips} trips and ${totalValues} stop-time values across both directions.\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`)
    process.exitCode = 1
  })
}
