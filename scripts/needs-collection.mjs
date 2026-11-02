import {readFile,access,appendFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
let collect=true;
try{
 const regions=JSON.parse(await readFile('data/regions.json','utf8')),meta=JSON.parse(await readFile('data/metadata.json','utf8'));
 const signature=rows=>JSON.stringify(rows.map(({id,name,district,lat,lon,radius})=>({id,name,district,lat,lon,radius})));
 const diff=spawnSync('git',['diff','--quiet','HEAD^','HEAD','--','data/regions.json','scripts/fetch-data.mjs','scripts/api.mjs'],{stdio:'ignore'});
 if(meta.status==='ready'&&meta.scope==='seoul'&&signature(regions)===signature(meta.regions)&&meta.regions.every(r=>r.complete)&&diff.status===0){
  for(const r of meta.regions)await access(r.file);
  collect=false;
 }
}catch{/* Missing, outdated or incompatible caches require a real collection. */}
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`collect=${collect}\n`);
console.log(collect?'실제 API 수집 필요':'동일 범위의 마지막 정상 수집본 재사용');
