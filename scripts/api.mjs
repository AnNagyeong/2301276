import {XMLParser,XMLValidator} from 'fast-xml-parser';
export class ApiError extends Error {constructor(kind){super(kind);this.kind=kind;}}
export function parseResponse(text){
  let data;try{if(text.trim().startsWith('<')){if(XMLValidator.validate(text)!==true)throw Error();data=new XMLParser({ignoreAttributes:true,parseTagValue:false}).parse(text);}else data=JSON.parse(text);}catch{throw new ApiError('PARSE_ERROR');}
  if(data.OpenAPI_ServiceResponse)throw new ApiError('AUTH_OR_SERVICE_ERROR');
  const root=data.response||data,header=root.header;
  if(!header)throw new ApiError('SCHEMA_ERROR');
  const code=String(header.resultCode??'');
  if(!['00','0','NORMAL_SERVICE'].includes(code))throw new ApiError(['20','21','22','30','31','32'].includes(code)?'AUTH_ERROR':'API_ERROR');
  const body=root.body;if(!body)throw new ApiError('SCHEMA_ERROR');
  let items=body.items?.item??body.items??[];
  if(items===''||items==null)items=[];
  if(!Array.isArray(items))items=[items];
  const total=Number(body.totalCount);if(!Number.isInteger(total)||total<0)throw new ApiError('SCHEMA_ERROR');
  const referenceMonths=[...new Set([body.stdrYm,...items.map(x=>x.stdrYm)].filter(x=>x!=null&&String(x).trim()).map(String))];
  return {items,total,referenceMonths};
}
export async function collectPages(request,{limit=1000,maxPages=100}={}){
  const items=[],months=new Set();let total=null,pages=0;
  for(let page=1;page<=maxPages;page++){
    const result=await request(page,limit);pages++;
    if(total===null)total=result.total;
    if(result.total!==total)throw new ApiError('DATA_CHANGED');
    items.push(...result.items);for(const m of result.referenceMonths||[])months.add(m);
    if(items.length>=total){if(items.length!==total)throw new ApiError('COUNT_MISMATCH');return {items,total,pages,referenceMonths:[...months].sort()};}
    if(!result.items.length)throw new ApiError('INCOMPLETE_DATA');
  }throw new ApiError('PAGE_LIMIT');
}
