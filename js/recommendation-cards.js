import {analyze} from './algorithms.js';
import {recommend,startupCategory} from './recommendations.js';
import {$,el,options,snapshot,num} from './ui.js';
export function setupRecommendations(meta,data,radius,target){
 const select=$('recommend-peer'),box=$('recommend-cards'),note=$('recommend-status');
 const peers=meta.regions.filter(r=>r.id!==data.id&&r.complete&&r.radius>=radius);
 if(!peers.length){note.textContent='같은 배치에서 완전 수집된 비교 지역이 없어 후보를 제시할 수 없습니다.';return;}
 options(select,peers);select.disabled=false;let sequence=0;
 async function update(){
  const current=++sequence;box.replaceChildren();note.textContent='비교 지역 데이터를 확인하고 있습니다…';
  try{
   const peer=await snapshot(meta,select.value);if(current!==sequence)return;
   const reference=analyze(peer.stores,peer,radius,'');const candidates=recommend(target,reference,3,startupCategory);
   note.textContent=`${data.name} ↔ ${peer.name} · 동일 반경 ${num(radius)}m · 음식·숙박·소매·생활서비스 중 검토 후보 ${candidates.length}개. 선택한 희망 업종에 한정하지 않습니다.`;
   if(target.total<30||reference.total<30){note.textContent='반경 내 전체 점포가 30곳 미만인 지역이 있어 후보 산출을 보류합니다.';return;}
   if(!candidates.length){box.append(el('p','점포 비중과 밀도가 모두 20% 이상 낮은 업종이 없습니다. 조건에 맞지 않는 후보를 채워 넣지 않습니다.','muted'));return;}
   for(const [index,g] of candidates.entries()){
    const card=el('article',null,'candidate-card');
    card.append(el('span',`검토 후보 ${index+1}`,'step'),el('h3',g.name),el('p',`${data.name} ${g.count}곳 · ${peer.name} ${g.peerCount}곳`,'candidate-count'));
    const list=document.createElement('ul');
    list.append(el('li',`점포 비중 ${num(g.localShare*100,1)}% ↔ ${num(g.peerShare*100,1)}% · ${num(g.shareGap*100,1)}% 낮음`),el('li',`밀도 ${num(g.localDensity,1)} ↔ ${num(g.peerDensity,1)}곳/km² · ${num(g.densityGap*100,1)}% 낮음`));card.append(list);
    card.append(el('p',g.count===0?'이 반경에서 관측된 점포가 없습니다. 수요 부족이나 분류 누락 가능성부터 확인하세요.':'상대적으로 공급이 적게 관측됐습니다. 고객 수요와 임대료를 별도로 확인하세요.','candidate-caution'));
    const link=el('a','이 업종 비교 →','candidate-link');link.href='./compare.html?'+new URLSearchParams({region:data.id,peer:peer.id,radius,code:g.code});card.append(link);box.append(card);
   }
  }catch{if(current===sequence)note.textContent='비교 지역 데이터를 불러오지 못했습니다. 비교 기준을 다시 선택해 주세요. 기존 분석 결과는 계속 볼 수 있습니다.';}
 }
 select.addEventListener('change',update);update();
}
