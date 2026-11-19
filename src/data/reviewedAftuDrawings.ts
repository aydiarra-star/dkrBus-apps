/** Reference to an operator drawing, NOT journey geometry. Only attach to the
 * official body transcription with its exact endpoints, never its reverse, a
 * short working, a GTFS variant or a homonymous TATA sheet. Audit and hashes:
 * docs/revue-bus-2026-11-19.md. Metres refer to the ENTIRE source line. */
export interface OperatorDrawing { from: string; to: string; meters: number }
export const AFTU_DRAWINGS: Readonly<Record<string, OperatorDrawing>> = {
  '24': { from: 'Terminus Notaire (Guédiawaye)', to: 'Terminus Université Cheikh Anta Diop', meters: 17032 },
  '33': { from: 'Terminus Colobane', to: 'Terminus Serigne Assane', meters: 17999 },
  '38': { from: 'Cité Enseignants', to: 'Terminus Sahm', meters: 16725 },
  '42': { from: 'Terminus Gadaye', to: 'Terminus Ouakam Baye', meters: 21086 },
  '44': { from: 'Terminus Grand Mbao', to: 'Terminus Ouakam', meters: 26922 },
  '62': { from: 'Terminus Arrêt Chérif (Rufisque)', to: 'Terminus Penc Mi (Gueule Tapée)', meters: 31354 },
  '66': { from: 'Terminus Yoff', to: 'Terminus Gorom 1', meters: 44772 },
  '67': { from: 'Terminus Thiawlène', to: 'Terminus Boutique Diallo (Ouakam)', meters: 31031 },
  '69': { from: 'Terminus Diamalaye', to: 'Terminus Namora', meters: 24785 },
  '72': { from: 'Terminus Guédiawaye (Cité des Enseignants)', to: 'Terminus Kounoune (Cité Cardinal Thiandoum)', meters: 31445 },
  '74': { from: 'Terminus Bargny (Gare ferroviaire)', to: 'Terminus Cité COCEHAS', meters: 27455 },
  '77': { from: 'Terminus Rufisque Cité Tacco', to: 'Terminus Liberté 5', meters: 25911 },
  '78': { from: 'Terminus Diamaguène', to: 'Terminus Liberté 5', meters: 15973 },
  '80': { from: 'Terminus Diamalaye', to: 'Terminus Darou Thioub', meters: 32885 },
  '83': { from: 'Terminus Rufisque Arafat', to: 'Terminus Zone de Captage', meters: 33507 },
}
