import {$,json,options,status,fail,remember,recalled,categories,snapshot} from './ui.js';
import {makeMap} from './map.js';
try{
 const [regions,meta]=await Promise.all([json('./data/regions.json'),json('./data/metadata.json')]);status(meta);
 const old=recalled();options($('district'),[{id:'all',name:'서울 전체'},...Array.from(new Set(regions.map(r=>r.district))).sort((a,b)=>a.localeCompare(b,'ko')).map(name=>({id:name,name}))]);
 const collected=meta.scope==='seoul'?meta.regions.filter(r=>r.complete).length:0;$('region-coverage').textContent=`서울 ${new Set(regions.map(r=>r.district)).size}개 구 · 대표 역세권 ${regions.length}곳 중 ${collected}곳 수집 완료. 각 역 반경 1km 이내의 서울 점포를 분석합니다.`;
 options($('region'),regions,old.region);$('radius').value=[300,500,1000].includes(Number(old.radius))?old.radius:500;
 let map,sequence=0;
 async function update(){const current=++sequence;const r=regions.find(x=>x.id===$('region').value);if(map)map.remove();map=makeMap('map',r,Number($('radius').value));$('place-name').textContent=r.name+' 중심';$('start').disabled=true;
  const entry=meta.regions.find(x=>x.id===r.id);if(!entry?.complete){options($('industry'),[{id:'',name:'실제 데이터 수집 후 선택 가능'}]);return;}
  const data=await snapshot(meta,r.id);if(current!==sequence)return;options($('industry'),categories(data.stores),old.code);$('start').disabled=!$('industry').value;
 }
 $('region').addEventListener('change',()=>update().catch(fail));$('radius').addEventListener('change',()=>update().catch(fail));
 $('district').addEventListener('change',()=>{options($('region'),regions.filter(r=>$('district').value==='all'||r.district===$('district').value));update().catch(fail);});
 await update();
 $('search').addEventListener('submit',e=>{e.preventDefault();const values={region:$('region').value,code:$('industry').value,radius:$('radius').value};remember(values);location.href='./analysis.html?'+new URLSearchParams(values);});
}catch(e){fail(e);}
