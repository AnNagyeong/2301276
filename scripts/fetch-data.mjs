import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {parseResponse,collectPages,ApiError} from './api.mjs';
import {clean} from '../js/algorithms.js';
const root=new URL('../',import.meta.url),path=p=>new URL(p,root);
const regions=JSON.parse(await readFile(path('data/regions.json'),'utf8'));
const metadata=JSON.parse(await readFile(path('data/metadata.json'),'utf8'));
const attempt=new Date().toISOString(),key=process.env.DATA_GO_KR_KEY;
try{
 if(!key)throw new ApiError('KEY_MISSING');
 const batch=randomUUID(),entries=[];await mkdir(path('data/snapshots/'),{recursive:true});
 for(const region of regions){
  const result=await collectPages(async(page,limit)=>{
   const url=new URL('https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius');
   for(const [k,v] of Object.entries({ServiceKey:key,radius:region.radius,cx:region.lon,cy:region.lat,numOfRows:limit,pageNo:page,type:process.env.API_FORMAT==='xml'?'xml':'json'}))url.searchParams.set(k,v);
   await new Promise(r=>setTimeout(r,250));
   let response;try{response=await fetch(url,{signal:AbortSignal.timeout(30000)});}catch{throw new ApiError('NETWORK_ERROR');}
   if(!response.ok)throw new ApiError([401,403].includes(response.status)?'AUTH_ERROR':'HTTP_ERROR');
   return parseResponse(await response.text());
  });
  const normalized=clean(result.items),file=`data/snapshots/${batch}-${region.id}.json`;
  const referenceMonths=result.referenceMonths;
  const entry={...region,file,referenceMonths,apiTotal:result.total,rawCount:result.items.length,validCount:normalized.stores.length,invalid:normalized.invalid,duplicates:normalized.duplicates,pages:result.pages,complete:true};
  await writeFile(path(file),JSON.stringify({batch,stores:normalized.stores}));entries.push(entry);
 }
 const months=[...new Set(entries.flatMap(r=>r.referenceMonths))].sort();
 const next={status:'ready',batch,collectedAt:new Date().toISOString(),referenceDate:months.length?months.join(', '):null,regions:entries,lastAttempt:attempt,message:null};
 await writeFile(path('data/metadata.tmp'),JSON.stringify(next,null,2));await rename(path('data/metadata.tmp'),path('data/metadata.json'));
 console.log('수집 완료: '+entries.length+'개 지역. 인증키는 저장하지 않았습니다.');
}catch(error){
 metadata.lastAttempt=attempt;metadata.status=metadata.collectedAt?'stale':'error';metadata.message=error instanceof ApiError?error.kind:'COLLECTION_ERROR';
 await writeFile(path('data/metadata.json'),JSON.stringify(metadata,null,2));console.error('수집 실패: '+metadata.message);process.exitCode=1;
}
