export async function loadAftuDirectionOverrides() {
  const [
    aftu66, aftu57, aftu30, aftu58, aftu67, aftu62,
    aftu64, aftu65, aftu75, aftu72, aftu73,
  ] = await Promise.all([
    import('./aftu-66-return.json'),
    import('./aftu-57-directions.json'),
    import('./aftu-30-directions.json'),
    import('./aftu-58-directions.json'),
    import('./aftu-67-directions.json'),
    import('./aftu-62-directions.json'),
    import('./aftu-64-directions.json'),
    import('./aftu-65-directions.json'),
    import('./aftu-75-directions.json'),
    import('./aftu-72-directions.json'),
    import('./aftu-73-directions.json'),
  ])

  return {
    '66': aftu66.default,
    '57': aftu57.default,
    '30': aftu30.default,
    '58': aftu58.default,
    '67': aftu67.default,
    '62': aftu62.default,
    '64': aftu64.default,
    '65': aftu65.default,
    '75': aftu75.default,
    '72': aftu72.default,
    '73': aftu73.default,
  }
}
