import {analyze} from './algorithms.js';
import {$,json,status,fail,snapshot,num,chart,table} from './ui.js';
import {makeMap,markers} from './map.js';
try{
 const meta=await json('./data/metadata.json');status(meta);const q=new URLSearchParams(location.search),id=q.get('region')||meta.regions[0]?.id,radius=Number(q.get('radius')||500);
 if(!meta.regions.length)throw Error('아직 분석할 실제 데이터가 없습니다. 검색 페이지의 수집 안내를 확인하세요.');
 const data=await snapshot(meta,id);if(radius>data.radius)throw Error('수집 범위를 벗어났습니다.');const code=q.get('code')||data.stores[0]?.code;
 if(!data.stores.some(s=>s.code===code))throw Error('수집 데이터에 없는 업종입니다. 검색 페이지에서 선택해 주세요.');
 const result=analyze(data.stores,data,radius,code),category=data.stores.find(s=>s.code===code).category;
 $('title').textContent=data.name+' 상권 분석';$('subtitle').textContent=`${category} · 반경 ${radius.toLocaleString()}m · 소분류 ${code}`;
 for(const [key,value] of Object.entries({total:result.total,competitors:result.competitors,density:result.density,diversity:result.diversity}))$(key).textContent=num(value,key==='diversity'?3:key==='density'?1:0);
 const map=makeMap('map',data,radius);let layer=markers(map,result.rows,code);
 $('only').addEventListener('change',()=>{if(layer)map.removeLayer(layer);layer=markers(map,$('only').checked?result.rows.filter(s=>s.code===code):result.rows,code);});
 if(result.total)chart($('distribution'),'doughnut',result.distribution.map(g=>g.name),[{data:result.distribution.map(g=>g.count),backgroundColor:['#2865ed','#16b7a6','#9db7f8','#f3bd65','#9c91d8','#4d91bc']}]);
 else $('distribution').parentElement.textContent='반경 내 점포가 없습니다. 다양성은 계산할 수 없습니다.';
 table($('distribution-table'),['소분류 업종','점포 수','비율'],result.distribution.map(g=>[g.name,num(g.count),num(g.count/result.total*100,1)+'%']));
 $('interpretation').textContent=`분석 반경의 면적은 ${num(result.area,3)}km²이며, ${category} ${num(result.competitors)}곳의 밀도는 ${num(result.density,1)}곳/km²입니다. `+(result.total?`관측된 ${result.distribution.length}개 소분류의 정규화 다양성은 ${num(result.diversity,3)}입니다.`:'데이터가 없어 다양성은 계산할 수 없습니다.');
 $('quality').textContent=`API 전체 ${num(data.apiTotal)}건 / 수집 ${num(data.rawCount)}건 / 유효 ${num(data.validCount)}건 · 중복 ${data.duplicates}건, 제외 ${data.invalid}건. 제외된 데이터가 있으므로 유효 점포 기준 통계입니다.`;
 $('csv').disabled=false;$('csv').onclick=()=>{const escape=x=>'"'+String(x).replace(/^[=+@\-\t\r]/,"'"+'$&').replaceAll('"','""')+'"';const rows=[['상가업소번호','상호','업종코드','업종','주소','위도','경도'],...result.rows.map(s=>[s.id,s.name,s.code,s.category,s.address,s.lat,s.lon])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(escape).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='상권분석.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('compare-link').href='./compare.html?'+new URLSearchParams({region:id,radius,code});
}catch(e){fail(e);$('interpretation').textContent='실제 데이터가 준비되면 분석 결과를 표시합니다.';$('map').classList.add('empty');$('map').textContent='분석할 점포 데이터가 없습니다.';$('distribution').parentElement.replaceChildren(document.createTextNode('데이터 수집 후 업종 분포가 표시됩니다.'));}
