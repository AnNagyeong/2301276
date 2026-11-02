import {analyze,difference} from './algorithms.js';
import {$,json,status,fail,options,snapshot,categories,chart,num,table} from './ui.js';
try{
 const meta=await json('./data/metadata.json');status(meta);const q=new URLSearchParams(location.search),regions=meta.regions.filter(r=>r.complete);
 if(regions.length<2)throw Error('비교에는 동일한 수집 배치의 완전 수집 지역이 2곳 이상 필요합니다.');
 const data=await Promise.all(regions.map(r=>snapshot(meta,r.id)));
 options($('region-a'),regions,q.get('region')||regions[0].id);options($('region-b'),regions,q.get('peer')||regions.find(r=>r.id!==$('region-a').value).id);
 options($('industry'),categories(data.flatMap(r=>r.stores)),q.get('code'));if(['300','500','1000'].includes(q.get('radius')))$('radius').value=q.get('radius');$('compare-button').disabled=false;
 let plot;
 function update(e){e?.preventDefault();const a=data.find(r=>r.id===$('region-a').value),b=data.find(r=>r.id===$('region-b').value),radius=Number($('radius').value),code=$('industry').value;
  if(a.id===b.id){fail(Error('서로 다른 두 지역을 선택하세요.'));return;}if(radius>Math.min(a.radius,b.radius))throw Error('공통 수집 범위를 벗어났습니다.');status(meta);
  const x=analyze(a.stores,a,radius,code),y=analyze(b.stores,b,radius,code);
  table($('comparison-table'),['동일 조건 지표',a.name,b.name,'A − B'],[['경쟁업체 수',num(x.competitors),num(y.competitors),num(x.competitors-y.competitors)],['밀도 (곳/km²)',num(x.density,1),num(y.density,1),num(x.density-y.density,1)],['전체 점포 수',num(x.total),num(y.total),num(x.total-y.total)],['다양성 (0–1)',num(x.diversity,3),num(y.diversity,3),x.diversity==null||y.diversity==null?'계산 불가':num(x.diversity-y.diversity,3)]]);
  if(plot)plot.destroy();plot=chart($('comparison-chart'),'bar',[a.name,b.name],[{label:'경쟁업체 수 (곳)',data:[x.competitors,y.competitors],backgroundColor:['#2865ed','#16b7a6'],borderRadius:8}]);
  const delta=difference(x.density,y.density);$('summary').textContent=delta.percent===null?`${b.name}의 경쟁업체 밀도가 0이므로 백분율 비교는 계산하지 않습니다. 밀도 차이는 ${num(delta.absolute,1)}곳/km²입니다.`:`${a.name}의 선택 업종 밀도는 ${b.name}보다 ${num(Math.abs(delta.percent),1)}% ${delta.percent>=0?'높습니다':'낮습니다'}. 두 지역 모두 반경 ${radius}m, 같은 소분류로 비교했습니다.`;
  $('quality').textContent=data.filter(r=>r.id===a.id||r.id===b.id).map(r=>`${r.name}: API ${r.apiTotal}건 / 유효 ${r.validCount}건 / 제외 ${r.invalid}건 / 중복 ${r.duplicates}건`).join(' · ');
 }
 $('compare-form').addEventListener('submit',e=>{try{update(e);}catch(err){fail(err);}});update();
}catch(e){fail(e);$('comparison-chart').parentElement.classList.add('empty');$('comparison-chart').parentElement.textContent='비교할 실제 데이터가 없습니다.';}
