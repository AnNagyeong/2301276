export function validPoint(p) { return p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat)<=90 && Math.abs(p.lon)<=180; }
export function haversine(a,b) {
  if(!validPoint(a)||!validPoint(b)) throw new RangeError('올바르지 않은 좌표');
  const rad=x=>x*Math.PI/180, dlat=rad(b.lat-a.lat), dlon=rad(b.lon-a.lon);
  const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;
  return 6371000*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export function clean(items) {
  const seen=new Set(), stores=[]; let invalid=0,duplicates=0;
  for(const x of items){
    const p={id:String(x.bizesId??''),name:String(x.bizesNm??''),lat:x.lat===''?NaN:Number(x.lat),lon:x.lon===''?NaN:Number(x.lon),code:String(x.indsSclsCd??''),category:String(x.indsSclsNm??''),address:String(x.rdnmAdr||x.lnoAdr||'')};
    if(!p.id||!p.code||x.lat==null||x.lon==null||!validPoint(p)){invalid++;continue;}
    if(seen.has(p.id)){duplicates++;continue;} seen.add(p.id);stores.push(p);
  }return {stores,invalid,duplicates};
}
export function analyze(stores,center,radius,code){
  if(![300,500,1000].includes(radius))throw new RangeError('지원하지 않는 반경');
  const rows=stores.filter(validPoint).filter(s=>haversine(center,s)<=radius+1e-7);
  const groups=new Map();for(const s of rows){const g=groups.get(s.code)||{code:s.code,name:s.category,count:0};g.count++;groups.set(s.code,g);}
  const distribution=[...groups.values()].sort((a,b)=>b.count-a.count);
  const total=rows.length,competitors=rows.filter(s=>s.code===code).length,area=Math.PI*(radius/1000)**2;
  const entropy=total?-distribution.reduce((s,g)=>s+(g.count/total)*Math.log(g.count/total),0):null;
  return {rows,total,competitors,area,density:competitors/area,entropy,diversity:!total?null:groups.size<=1?0:entropy/Math.log(groups.size),distribution};
}
export function difference(a,b){return {absolute:a-b,percent:b===0?null:(a-b)/b*100};}
