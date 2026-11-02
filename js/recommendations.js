// Supply comparison heuristic, not a demand or profitability forecast.
export function startupCategory(g){return /^(I2|G2|S2)/.test(g.code)&&!/기타|그 외/.test(g.name);}
export function recommend(target, benchmark, limit=3,eligible=()=>true) {
  if(target.total<30||benchmark.total<30)return [];
  const local=new Map(target.distribution.map(g=>[g.code,g]));
  return benchmark.distribution.filter(g=>g.count>=10&&eligible(g)).map(g=>{
    const count=local.get(g.code)?.count||0;
    const localShare=count/target.total,peerShare=g.count/benchmark.total;
    const localDensity=count/target.area,peerDensity=g.count/benchmark.area;
    const shareGap=1-localShare/peerShare,densityGap=1-localDensity/peerDensity;
    return {code:g.code,name:g.name,count,peerCount:g.count,localShare,peerShare,localDensity,peerDensity,shareGap,densityGap,score:(shareGap+densityGap)/2};
  }).filter(g=>g.count>=1&&g.shareGap>=.2-1e-10&&g.densityGap>=.2-1e-10)
    .sort((a,b)=>b.score-a.score||b.peerCount-a.peerCount||a.code.localeCompare(b.code)).slice(0,limit);
}
