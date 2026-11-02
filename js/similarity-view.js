import {similarRegions} from './similarity.js';
import {$,json,el,num,table} from './ui.js';
export async function setupSimilarity(meta,data,radius,result,selectedCode){
 const status=$('similar-status'),choices=$('similar-choices'),detail=$('similar-detail');
 try{
  const profiles=await json('./data/profiles.json');
  if(meta.scope!=='seoul'||profiles.batch!==meta.batch)throw Error('유사도 데이터 버전이 일치하지 않습니다. 새로고침해 주세요.');
  const target={id:data.id,name:data.name,radius,total:result.total,distribution:result.distribution};
  const pool=profiles.profiles.filter(p=>p.radius===radius);
  const ranked=similarRegions(target,pool);choices.replaceChildren();
  if(!ranked.length){status.textContent='점포 30곳 이상인 비교 지역이 부족해 유사도를 계산하지 않습니다.';return;}
  status.textContent=`${data.name} · 반경 ${num(radius)}m · 동일 배치의 ${pool.filter(p=>p.id!==data.id&&p.total>=30).length}곳과 소분류별 점포 비중을 비교했습니다. 선택한 희망 업종 외 전체 업종을 사용합니다.`;
  function select(index){
   const {profile,explanation}=ranked[index];
   [...choices.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
   detail.hidden=false;$('similar-title').textContent=`${data.name} ↔ ${profile.name} · 닮은 비중과 다른 비중`;
   $('similar-legend-a').textContent=data.name;$('similar-legend-b').textContent=profile.name;
   const shared=explanation.shared.slice(0,6),bars=$('similar-bars');bars.replaceChildren();
   const max=Math.max(.01,...shared.flatMap(g=>[g.shareA,g.shareB]));
   if(!shared.length)bars.append(el('p','공통으로 관측된 업종이 없어 유사도는 0입니다.','muted'));
   for(const g of shared){
    const row=el('div',null,'share-row');const heading=el('div',null,'share-heading');
    heading.append(el('strong',g.name),el('span',`산식 기여 ${num(g.contributionShare*100,1)}%`));row.append(heading);
    for(const [name,share,kind] of [[data.name,g.shareA,'a'],[profile.name,g.shareB,'b']]){
     const line=el('div',null,'share-line');line.append(el('span',name,'share-place'));
     const track=el('span',null,'share-track');track.setAttribute('aria-hidden','true');const bar=el('i',null,`share-fill ${kind}`);bar.style.width=`${share/max*100}%`;track.append(bar);
     line.append(track,el('span',num(share*100,1)+'%','share-number'));row.append(line);
    }bars.append(row);
   }
   const coverage=shared.reduce((s,g)=>s+g.contributionShare,0);
   $('similar-explanation').textContent=`공통으로 큰 비중을 차지하는 업종이 코사인 유사도의 내적에 크게 기여합니다. 표시한 ${shared.length}개 업종의 산식 기여 합계는 ${num(coverage*100,1)}%입니다. 기여가 크다는 것이 두 비중이 같다는 뜻은 아닙니다. 막대는 선택한 업종들의 공통 축척이며, 숫자는 전체 점포 대비 비중입니다.`;
   $('similar-differences').replaceChildren(...explanation.differences.filter(g=>Math.abs(g.gapPoints)>1e-9).slice(0,4).map(g=>{
    const row=el('div',null,'difference-row');row.append(el('strong',g.name),el('span',`${num(g.shareA*100,1)}% ↔ ${num(g.shareB*100,1)}%`),el('b',`${g.gapPoints>0?'+':''}${num(g.gapPoints,1)}%p`));return row;
   }));
   $('similar-difference-note').textContent=`차이 = ${data.name} 비중 − ${profile.name} 비중. 구성 유사도는 점포 수·매출 규모·입지 조건의 유사성을 의미하지 않습니다.`;
   table($('similar-table'),['소분류 업종',`${data.name} 비중`,`${profile.name} 비중`,'비중 차이','산식 기여 비율'],explanation.differences.map(g=>[g.name,num(g.shareA*100,2)+'%',num(g.shareB*100,2)+'%',num(g.gapPoints,2)+'%p',num(g.contributionShare*100,2)+'%']));
   $('similar-compare').href='./compare.html?'+new URLSearchParams({region:data.id,peer:profile.id,radius,code:selectedCode});
  }
  ranked.forEach(({profile,explanation},i)=>{const button=el('button',null,'similar-choice');button.type='button';button.append(el('span',`${i+1}. ${profile.district} · ${profile.name}`),el('strong',num(explanation.score*100,1)+' / 100'),el('small',`구성 유사도 · ${num(profile.total)}곳`));button.setAttribute('aria-controls','similar-detail');button.onclick=()=>select(i);choices.append(button);});
  select(0);
 }catch(e){status.textContent='닮은 동네를 불러오지 못했습니다. '+e.message;}
}
