#!/usr/bin/env node
/** Offline passenger-sign census. Calculate eligibility from printed cells,
 * independently challenge the actual sign at the boundaries, include blanks.
 * CSVs share a direction key; no coordinates, inferred trips or stop-ID joins. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { createServer } from 'vite'
import { busInventory } from './bus_inventory.mjs'

const {values} = parseArgs({options:{dir:{type:'string'}}})
const root=values.dir
const DAY=86400000, MINUTE=60000, day=Date.parse('2026-11-19T00:00Z'), at19=day+19*60*MINUTE
const kinds=['weekday','saturday','sunday'], days=[day,day+2*DAY,day+3*DAY]
const hm=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`
const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3))
const field=v=>/[",\r\n]/.test(String(v)) ? '"'+String(v).replaceAll('"','""')+'"' : String(v ?? '')
const csv=rows=>rows.map(row=>row.map(field).join(',')).join('\n')+'\n'
const pct=(yes,n)=>n?(100*yes/n).toFixed(2).replace('.',',')+' %':'non défini'
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
const catalogueFile='src/domain/busBoardCatalog.ts'
const summary={}, perFamily={}, sheets=[['fiche','famille','ligne','variante','depuis','vers','premier_libellé','dernier_libellé','nature','étendue','rangs','ordre_sha256','libellés_répétés_en_excès','autre_sens','fichier_ordre','source_ordre','fichier_heures','source_heures','phase_du_modèle','profil_du_modèle','limite_semaine','absence','cellules_source_semaine','cellules_modélisées_jeudi_avant_sélection','cellules_estimées_si_option_activée','rangs_avec_heure','rangs_décomptables_jeudi']],
  cells=[['fiche','type','jour_ou_échantillon','origine','rangs_dans_l_ordre','heures_source_dans_le_même_ordre']], attachments=new Set(), byFamily={}
const head=['fiche','ligne','sens_variante','rang','libellé_original','nature','même_libellé_n°','heures_fournies','type_horaire','cellules_semaine','cellules_samedi','cellules_dimanche','repères_horaires_isolés','minutes_source_semaine','secondes_source_à_19h','modèle_existant','raison_ou_limite','état_à_19h','estimations_jeudi_si_option_activée']
// Do not mistake the earliest REMAINING transcribed course for the next
// service after a hole. First/last are the bounds of this transcription only.
function timeline(g,date) {
  if (!g) return new Map()
  const max=g.nextUntranscribedOrigin===null ? Infinity : date+minutes(g.nextUntranscribedOrigin)*MINUTE
  return new Map(g.ranks.map((r,i)=>[r,g.profiles.flatMap(p=>p.origins.map(t=>date+(minutes(t)+p.elapsed[i])*MINUTE)).filter(t=>t<=max).sort((a,b)=>a-b)]))
}
const blank=()=>({identities:0,sheets:0,empty:0,aliases:0,occurrences:0,stops:0,markers:0,origins:0,sourceStops:0,weeklyStops:0,active19:0,printed:[0,0,0],sampleCells:0,model:0,modelCells:0,optionalCells:0,onlySamples:0,missing:0,observed:0,dated:0,twoLists:[],twoWeekly:[],reasons:{}})
const app=await createServer({configFile:false,logLevel:'error',appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null,ws:false}})
try {
  const load=p=>app.ssrLoadModule(p), inventory=await busInventory(load)
  const {BUS_BOARD_LINES}=await load('/src/domain/busBoardCatalog.ts'),{compileSign}=await load('/src/domain/busSignReading.ts'),{sourceIssue}=await load('/src/domain/busSourceHours.ts')
  const {datedBusBoards,boardDay}=await load('/src/domain/busPassageBoard.ts'), {dakarNetwork}=await load('/src/routing/dakar.ts')
  for (const [family,lines] of Object.entries(BUS_BOARD_LINES)) {
    const inv=inventory.lines.filter(l=>l.network===family), t=summary[family]=blank(), ranks=perFamily[family]=[head], desc=byFamily[family]=[]
    assert.deepEqual(lines.map(l=>l.code).sort(),inv.map(l=>l.code).sort(),`Inventaire divergent: ${family}`)
    // Static app on this date, not the user's unpublished edition, nor GTFS 2023.
    const dated=datedBusBoards(dakarNetwork.patterns,family,day)
    assert.equal(dated.length,0,'Nouvelle édition locale datée : comptabiliser ses identifiants propres, sans les projeter par numéro')
    for(const l of lines){
      t.identities++;const two=new Set(),twoWeekly=new Set()
      for(const [idx,d] of l.directions.entries()){
        const id=`${l.key}/${idx+1}`,h=d.sourceHours, m=d.clock, n=d.points.length, label=d.label, side=label.split(' · ')[0]
        const hit=inv.find(r=>r.code===l.code).evidence.find(e=>e.labels && JSON.stringify(e.labels)===JSON.stringify(d.points))
        const fileFor = key => !key ? catalogueFile : key.includes('PUBLIC_LINE_CATALOG') ? 'src/domain/publicBusLineCatalog.ts'
          : ['passengerLineSheets','bidirectionalBusLines'].includes(key) ? `src/domain/${key}.ts` : `src/data/${key}${key.endsWith('.json')?'':'.ts'}`
        const orderFile=h?.file.includes('/bus-sheets/')?h.file:d.label.includes('Maristes')?'src/data/ddd12DirectionSheets.ts'
          :d.label.includes('RN 1')?'src/data/ddd311BoardSheets.ts':label.includes('2020')?'src/data/tataBoardReview.ts':fileFor(hit?.source)
        const where=`${h?.file??orderFile} : ${id} ${label} (${d.from} → ${d.to})`
        assert(d.source?.trim() && d.from?.trim() && d.to?.trim(),`${where} : source ou axe absent`)
        await readFile(orderFile)
        if(h){assert.equal(sourceIssue(h,n),undefined,where);attachments.add(h.file);await readFile(h.file)}
        const opposite=l.directions.filter(o=>o!==d && ((side==='Aller' && o.label.startsWith('Retour'))||(side==='Retour' && o.label.startsWith('Aller'))) && o.points.length>1 && n>1)
        const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
        const order=!opposite.length?'sans comparaison':opposite.some(o=>same(d.points,o.points))?'ordre identique à vérifier':opposite.some(o=>same(d.points,[...o.points].reverse()))?'ordre strictement inverse, vérifier la source':'listes différentes'
        const extent=l.aliasOf?'alias':!n?'sans liste':d.partialList?'liste partielle':d.pointKind==='départ seul'?'origine seule':d.reason?.includes('confirmer')?'variante à confirmer':d.pointKind==='arrêts'?'liste de la fiche':'repères / secteurs'
        if(n>1 && d.pointKind==='arrêts' && ['Aller','Retour'].includes(side)) two.add(side)
        if(l.aliasOf) t.aliases++; else {t.sheets++; if(!n)t.empty++}
        sheets.push([id,family,l.code,label,d.from,d.to,d.points[0],d.points.at(-1),d.pointKind,extent,n,sha(d.points),n-new Set(d.points).size,order,orderFile,d.source,h?.file,h?.source,m?.originBasis,m?.offsetBasis,h?.weekday ? h.weekday.nextUntranscribedOrigin??'journée des rangs saisis' : '',d.reason??''])
        const signs=days.map(v=>compileSign(d,v)), tables=kinds.map((k,i)=>timeline(h?.[k],days[i])), repeats=new Map()
        const model = m?.kind === 'model' ? boardDay(d,day) : null
        const modelRuns = model?.profiles.reduce((n,p)=>n+(p.today?.length??0),0)??0
        const signWithOption = compileSign(d,day,true)
        let provided=0,eligible=0,active=0,estimated=0,printed=0
        for(const k of kinds) if(h?.[k]) {
          const columns=h[k].profiles.flatMap(p=>p.origins.map(origin=>({origin,elapsed:p.elapsed})))
          for(const {origin,elapsed} of columns.sort((a,b)=>minutes(a.origin)-minutes(b.origin)))
            cells.push([id,'grille',k,origin,h[k].ranks.join(' '),elapsed.map(v=>hm(minutes(origin)+v)).join(' ')])
        }
        for(const s of h?.samples??[]) cells.push([id,'référence sans continuité',s.label,s.ranks[0]===1?s.times[0]:'',s.ranks.join(' '),s.times.join(' ')])
        for(const [i,name] of d.points.entries()){
          const r=i+1,loc=`${where} : rang ${r} ${name}`,src=h?.samples?.filter(s=>s.ranks.includes(r))??[], counts=kinds.map(k=>h?.[k]?.ranks.includes(r)?h[k].profiles.reduce((v,p)=>v+p.origins.length,0):0)
          assert(name.trim(),`${loc}: libellé vide`);assert(!l.aliasOf,`${loc}: alias dupliqué dans la matrice`)
          const reachable=tables.map((table,j)=>{
            const calls=table.get(r)??[], first=table.get(1)?.[0]??Infinity
            for(const t of new Set(calls)){
              const a=signs[j].at(r,t-1000),b=signs[j].at(r,t)
              assert.equal(a.kind,'weekly',loc);assert.equal(a.passage.at,t,loc);assert.equal(a.passage.state,t>first?'active':'upcoming',loc)
              if(t>first)assert.equal(a.passage.minutes,1,loc)
              assert.equal(b.passage.at,calls.find(v=>v>t),`${loc} ${kinds[j]} : passage manqué / départ ajouté`)
            }
            return calls.some(t=>t>first)
          })
          const seen=counts.some(Boolean)||!!src.length, available=reachable[0], observed=signs[0].at(r,at19).passage, sec=observed.state==='active'?(observed.at-at19)/1000:''
          assert.equal(observed.at,(tables[0].get(r)??[]).find(t=>t>at19),`${loc} : minute de 19 h non fournie`)
          const reason=available?(h.weekday.nextUntranscribedOrigin?'début de grille':'grille des rangs saisis'):counts[0]?'pas de prochaine cellule sûre':src.length?'heures isolées sans continuité':h?.weekday?'rang non transcrit':d.reason??(d.pointKind==='secteurs'?'secteur non horodaté':d.pointKind==='repères'?'repère sans heure de passage':d.pointKind==='départ seul'?'origine sans série de départs':'aucune heure source au rang')
          repeats.set(name,(repeats.get(name)??0)+1)
          const chosen = signWithOption.at(r,at19), optional = chosen.kind==='model' ? modelRuns : 0
          if (chosen.kind!=='model') assert.deepEqual(chosen.passage,observed,loc)
          const state19={active:'décompte',upcoming:'pas encore ouvert',finished:'dernier passage atteint',calendar:'jour non confirmé',closed:'sans service annoncé',unknown:'inconnu'}[observed.state]
          ranks.push([id,l.code,label,r,name,d.pointKind,repeats.get(name),seen?'oui':'non',counts.some(Boolean)?'hebdomadaire':src.length?'référence':'aucun',...counts,src.length,available?'oui':'non',sec,m?.kind==='model'?'oui':'non',reason,state19,optional])
          t.sampleCells+=src.length; counts.forEach((v,k)=>{t.printed[k]+=v}); printed+=counts[0]; estimated+=optional
          provided+=Number(seen);eligible+=Number(available);active+=Number(sec!=='');t.occurrences++;t.model+=Number(m?.kind==='model')
          if(d.pointKind==='arrêts'){t.stops++;t.sourceStops+=Number(seen);t.weeklyStops+=Number(available);t.onlySamples+=Number(!available&&seen);t.missing+=Number(!seen);if(!available)t.reasons[reason]=(t.reasons[reason]??0)+1}
          else if(d.pointKind==='départ seul') t.origins++;else t.markers++
        }
        if(eligible && n>1 && d.pointKind==='arrêts' && ['Aller','Retour'].includes(side))twoWeekly.add(side)
        t.modelCells+=modelRuns*n; t.optionalCells+=estimated
        sheets.at(-1).push(printed,modelRuns*n,estimated,provided,eligible)
        t.active19+=active
        desc.push([id,label,`${d.from} → ${d.to}`,`${n} ${d.pointKind}`,provided,eligible,m?n:0,extent+(d.reason?' · '+d.reason:'')])
      }
      if(two.size===2)t.twoLists.push(l.code);if(twoWeekly.size===2)t.twoWeekly.push(l.code)
    }
    assert.equal(t.stops,t.weeklyStops+t.onlySamples+t.missing);assert.equal(t.occurrences,t.stops+t.markers+t.origins)
  }
  for(const folder of ['src/data/weekly-cells','src/data/bus-sheets']) for(const file of await readdir(folder)) if(file.endsWith('.json'))assert(attachments.has(`${folder}/${file}`),`${folder}/${file} : fichier sans raccordement de panneau`)
  if(root){
    await mkdir(root,{recursive:true}); const save=(file,text)=>writeFile(join(root,file),text)
    const md=['# Couverture des panneaux bus par occurrence','',
      'Recette hors ligne, heure de Dakar : jeudi 19 novembre 2026, samedi 21 et dimanche 22. Elle porte sur le catalogue de l’application, **pas sur tous les arrêts physiques du Sénégal**. Pas d’édition opérateur datée chargée dans cette recette. Une minute de grille hebdomadaire est une heure **imprimée**, pas une observation du véhicule ni une course certifiée pour la date. Les observations CETUD par site ne sont pas attribuées aux lignes.','',
      '| Famille | Identités | Fiches hors alias (vides incluses) | Sans liste | Rangs d’arrêt | Avec heure fournie¹ | Décomptables en semaine² | % des rangs d’arrêt | Actifs à 19 h | Repères / secteurs exclus | Origines seules exclues |','|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|']
    let all=0,ok=0
    for(const [f,t] of Object.entries(summary)){md.push(`| ${f.toUpperCase()} | ${[t.identities,t.sheets,t.empty,t.stops,t.sourceStops,t.weeklyStops,pct(t.weeklyStops,t.stops),t.active19,t.markers,t.origins].join(' | ')} |`);all+=t.stops;ok+=t.weeklyStops}
    md.push('',`**${ok} / ${all} = ${pct(ok,all)}** des occurrences classées « arrêts » ont au moins un décompte de semaine vérifiable. Tous types de rangs affichables inclus, le dénominateur est **${Object.values(summary).reduce((n,t)=>n+t.occurrences,0)}**. Un même nom ou un même arrêt dans deux fiches conserve ses rangs. Les listes inconnues ne sont pas des arrêts de dénominateur zéro : les sens sans liste figurent ci-dessous. Un alias n’est pas une deuxième fiche. Une liste partielle n’est pas un trajet complet.`, '',
      '¹ Au moins une cellule sur fiche, y compris un échantillon non récurrent. ² Au moins un instant après ouverture auquel le panneau peut compter jusqu’à une cellule du rang sans franchir de lacune. Ce n’est pas une couverture de toute la journée. À 19 h, la colonne compte uniquement les temporisations actives par défaut. Une cadence ou le temps interpolé d’un rang ne satisfont pas ce critère. Pour TATA le pourcentage sur les seuls arrêts est indéfini, pas 100 %.','',
      '**Lire la matrice** : [DDD](ddd.csv), [AFTU](aftu.csv), [TATA](tata.csv). Chaque ligne donne le nom original, le rang, la variante, la provenance horaire, le nombre de cellules par jour, les secondes actives à 19 h et la raison du tiret. Par la clé `fiche`, consulter [les deux terminus, sources, portée et anomalies d’ordre](fiches.csv), puis [toutes les heures fournies, rangs et courses compris](heures.csv). La borne de transcription est la prochaine origine non recopiée : aucune promesse de dernier bus. Les 6 950 rangs des anciens modèles restent inventoriés [à part](../passages-bus-par-ligne.md). Les [quatre références 218/73](../releve-218-73.md), sans jour confirmé, restent hors voyageurs.','',
      'Reproduire sans réseau : `node scripts/audit_bus_signs.mjs --dir /tmp/panneaux` puis `diff -ru docs/panneaux /tmp/panneaux`. Le contrôle sonde chaque cellule utilisable à −1 s et à l’instant du passage, toutes les occurrences à 19 h et les fichiers non raccordés.','')
    md.push('### Cellules par type de source','',
      '| Famille | Grille semaine | Samedi | Dimanche | Références isolées¹ | Observations véhicule | Courses datées | Cellules du modèle jeudi² | Dont proposées avec l’option |',
      '|---|---:|---:|---:|---:|---:|---:|---:|---:|')
    for (const [f,t] of Object.entries(summary)) md.push(`| ${f.toUpperCase()} | ${[...t.printed,t.sampleCells,t.observed,t.dated,t.modelCells,t.optionalCells].join(' | ')} |`)
    md.push('','¹ Échantillons et bornes : ils peuvent recouper une colonne de la grille. Ne pas additionner ces catégories pour annoncer des passages uniques. ² Nombre de créneaux × nombre d’occurrences dans chaque variante, y compris les repères. Le choix « estimés » ne remplace jamais une grille épuisée ; le CSV par fiche distingue le modèle brut des estimations effectivement proposées. Une case vide à 19 h n’est pas zéro minute.','',
      '[Inventaire de toutes les sources, y compris hors attribution](../couverture-sources-bus.md) : notamment 26 noms opérateur à la fin du tableau de la 1, et 89 / 95 rangs d’une variante 85 non appariée. Les archives PassBi (calendrier régulier terminé en 2023) et les index secondaires [ne sont pas une liste actuelle des services](../bilan-bus-voyageurs.md). Les libellés génériques sont comptés au rang imprimé, pas comme des quais localisés.','')
    for(const [f,t] of Object.entries(summary)){
      md.push(`## ${f.toUpperCase()}`,'',`Deux listes avec au moins deux appels (inclut variantes et listes partielles) : **${t.twoLists.join(', ')||'aucune'}**. Deux sens avec au moins un rang décomptable en semaine : **${t.twoWeekly.join(', ')||'aucun'}**.`, '', `Rangs d’arrêt exclus : ${Object.entries(t.reasons).map(([why,n])=>`${why} : ${n}`).join(' ; ')||'aucun rang classé arrêt'}.`, '', '| Fiche | Sens / variante | De → vers | Rangs | Avec heure | Décompte semaine | Modèle séparé | Portée / manque |','|---|---|---|---|---:|---:|---:|---|')
      for(const row of byFamily[f]) md.push('| '+row.map(c=>String(c).replaceAll('|','\\|')).join(' | ')+' |');md.push('');await save(f+'.csv',csv(perFamily[f]))
    }
    await Promise.all([save('README.md',md.join('\n')),save('fiches.csv',csv(sheets)),save('heures.csv',csv(cells))])
  }
  console.log(JSON.stringify(summary,null,2))
}finally{await app.close()}
