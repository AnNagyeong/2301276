// Cosine similarity on aligned small-class shop-share vectors.
export function explainSimilarity(a,b){
 if(!a.total||!b.total)return null;
 const vector=p=>new Map(p.distribution.map(g=>[g.code,{name:g.name,share:g.count/p.total}]));
 const x=vector(a),y=vector(b),codes=new Set([...x.keys(),...y.keys()]);
 const normX=Math.sqrt([...x.values()].reduce((s,g)=>s+g.share**2,0));
 const normY=Math.sqrt([...y.values()].reduce((s,g)=>s+g.share**2,0));
 if(!normX||!normY)return null;
 const rows=[...codes].map(code=>{const p=x.get(code)?.share||0,q=y.get(code)?.share||0;return {code,name:x.get(code)?.name||y.get(code)?.name,shareA:p,shareB:q,gapPoints:(p-q)*100,product:p*q};});
 const dot=rows.reduce((sum,g)=>sum+g.product,0),denominator=normX*normY;
 for(const g of rows){g.contribution=g.product/denominator;g.contributionShare=dot?g.product/dot:0;}
 const shared=rows.filter(g=>g.product>0).sort((p,q)=>q.contribution-p.contribution||p.code.localeCompare(q.code));
 const differences=[...rows].sort((p,q)=>Math.abs(q.gapPoints)-Math.abs(p.gapPoints)||p.code.localeCompare(q.code));
 return {score:Math.max(0,Math.min(1,dot/denominator)),rows,shared,differences};
}
export function similarRegions(target,profiles,limit=3){
 if(target.total<30)return [];
 return profiles.filter(p=>p.id!==target.id&&p.radius===target.radius&&p.total>=30)
  .map(profile=>({profile,explanation:explainSimilarity(target,profile)})).filter(x=>x.explanation)
  .sort((a,b)=>b.explanation.score-a.explanation.score||a.profile.id.localeCompare(b.profile.id)).slice(0,limit);
}
