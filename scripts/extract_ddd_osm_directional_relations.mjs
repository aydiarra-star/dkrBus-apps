#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
const out='artifacts/ddd/osm-217-218-219-228';
const query='[out:json][timeout:90];\n(\n relation["type"="route"]["route"="bus"]["ref"~"^(217|218|219|228)$"](12.0,-17.9,15.2,-16.0);\n relation["type"="route_master"]["route_master"="bus"]["ref"~"^(217|218|219|228)$"](12.0,-17.9,15.2,-16.0);\n relation["type"="route"]["ref"~"^(217|218|219|228)$"](12.0,-17.9,15.2,-16.0);\n);\nout body geom;';
const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
let data=null,usedEndpoint=null,lastError=null;
for(const endpoint of endpoints){
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','User-Agent':'DakarBus-read-only-OSM-audit/1.0'},body:'data='+encodeURIComponent(query),signal:AbortSignal.timeout(100000)});
  if(!response.ok)throw new Error('HTTP '+response.status);
  data=await response.json();
  if(data.remark)throw new Error('Overpass remark: '+data.remark);
  usedEndpoint=endpoint;break;
 }catch(error){lastError=String(error);}
}
if(!data)throw new Error('All Overpass endpoints failed: '+lastError);
const relations=data.elements.filter(e=>e.type==='relation');
const report={retrievedAt:new Date().toISOString(),endpoint:usedEndpoint,query,relationCount:relations.length,relations:relations.map(r=>({id:r.id,tags:r.tags||{},memberCount:(r.members||[]).length,memberTypes:(r.members||[]).reduce((a,m)=>(a[m.type]=(a[m.type]||0)+1,a),{})})),warning:'An empty result does not prove that a commercial route is absent from OSM; it means this tag-and-area query found no matching relation. Relation geometry and members are evidence only, not proof of current service.'};
await mkdir(out,{recursive:true});
await writeFile(out+'/overpass-217-218-219-228.raw.json',JSON.stringify(data,null,2)+'\n');
await writeFile(out+'/overpass-217-218-219-228-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({endpoint:usedEndpoint,relationCount:relations.length,relations:report.relations},null,2));
