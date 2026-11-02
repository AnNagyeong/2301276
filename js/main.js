import {$,json,options,status,fail,remember,recalled,categories,snapshot} from './ui.js';
import {makeMap} from './map.js';
try{
 const [regions,meta]=await Promise.all([json('./data/regions.json'),json('./data/metadata.json')]);status(meta);
 const old=recalled();options($('region'),regions,old.region);$('radius').value=[300,500,1000].includes(Number(old.radius))?old.radius:500;
 let map;
 async function update(){const r=regions.find(x=>x.id===$('region').value);if(map)map.remove();map=makeMap('map',r,Number($('radius').value));$('place-name').textContent=r.name+' 중심';$('start').disabled=true;
  const entry=meta.regions.find(x=>x.id===r.id);if(!entry?.complete){options($('industry'),[{id:'',name:'실제 데이터 수집 후 선택 가능'}]);return;}
  const data=await snapshot(meta,r.id);options($('industry'),categories(data.stores),old.code);$('start').disabled=!$('industry').value;
 }
 $('region').addEventListener('change',()=>update().catch(fail));$('radius').addEventListener('change',()=>update().catch(fail));await update();
 $('search').addEventListener('submit',e=>{e.preventDefault();const values={region:$('region').value,code:$('industry').value,radius:$('radius').value};remember(values);location.href='./analysis.html?'+new URLSearchParams(values);});
}catch(e){fail(e);}
