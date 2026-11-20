/** Dated *publications*, not service dates. Only the named origin has a
 * reported time. In particular, neither a pair of bounds nor a frequency
 * supplies the intermediate departures or the arrival at the other end. */
interface OriginFact { from: string; to: string; morning: string; evening: string; nextDay?: true }
interface Notice {
  code: string; publication: string; source: string; url: string
  kind: 'bounds' | 'two-departures'; facts: readonly [OriginFact, OriginFact]
  separateVariant?: { name: string; caveat: string }
}
export const DDD_TERMINUS_NOTICES: readonly Notice[] = [
  { code:'8', publication:'22/07/2026', source:'Senego', kind:'bounds',
    url:'https://senego.com/ligne-08-de-dakar-dem-dikk-horaires-entre-aeroport-l-s-s-et-palais-2_1986157.html',
    facts:[{from:'Terminus Aéroport LSS', to:'Terminus Palais 2', morning:'05:45', evening:'20:30'},
      {from:'Palais 2', to:'Aéroport LSS', morning:'06:15', evening:'21:00'}] },
  { code:'218', publication:'25/06/2025', source:'Dem Dikk', kind:'bounds',
    url:'https://x.com/dakardemdikk1/status/1937979936272162819',
    facts:[{from:'Dépôt Thiaroye', to:'Terminus Aéroport LSS', morning:'05:30', evening:'19:30'},
      {from:'Aéroport LSS', to:'Thiaroye', morning:'07:00', evening:'20:30'}] },
  { code:'227', publication:'16/05/2025', source:'Dem Dikk', kind:'two-departures',
    url:'https://x.com/dakardemdikk1/status/1923491755304825149',
    facts:[{from:'Terminus Keur Massar', to:'Terminus Parcelles', morning:'06:00', evening:'20:30'},
      {from:'Parcelles Assainies', to:'Keur Massar', morning:'06:00', evening:'20:30'}] },
  { code:'6', publication:'08/07/2026', source:'Senego', kind:'bounds',
    url:'https://senego.com/dakar-dem-dikk-lance-la-ligne-06-guediawaye-palais-1-avec-des-horaires-fixes_1981250.html',
    separateVariant:{name:'Guédiawaye ↔ Palais 1', caveat:'Ces départs ne sont pas ceux de Cambérène 2 ↔ Palais 2.'},
    facts:[{from:'Guédiawaye', to:'Palais 1', morning:'05:45', evening:'20:30'},
      {from:'Palais 1', to:'Guédiawaye', morning:'07:15', evening:'21:30'}] },
  { code:'220', publication:'15/07/2026', source:'Senego', kind:'bounds',
    url:'https://senego.com/navette-dem-dikk-guediawaye-aibd-toutes-les-2h-6-000-fcfa_1983793.html',
    separateVariant:{name:'Navette Guédiawaye (Espace BRT) ↔ AIBD', caveat:'Un intervalle de deux heures est annoncé. Ce n’est pas la ligne urbaine de Rufisque ni une correspondance garantie avec le BRT.'},
    facts:[{from:'Guédiawaye (Espace BRT)', to:'AIBD', morning:'04:30', evening:'00:30', nextDay:true},
      {from:'AIBD', to:'Guédiawaye (Espace BRT)', morning:'06:30', evening:'02:30', nextDay:true}] },
]
