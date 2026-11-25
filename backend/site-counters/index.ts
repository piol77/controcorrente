const cors = {'access-control-allow-origin':'https://piol77.github.io'};
const isoDay=/^\d{4}-\d{2}-\d{2}$/;

function validDay(value: string) {
  const date=new Date(value+'T12:00:00Z');
  return isoDay.test(value)&&Number.isFinite(+date)&&date.toISOString().slice(0,10)===value;
}

async function authenticated(header: string) {
  const expected=Deno.env.get('CC_WORK_WORKER_KEY')||'';
  const provided=header.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if(!provided||!(/^[a-f0-9]{64}$/i.test(expected)))return false;
  const encode=new TextEncoder();
  const digest=async(value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(value)));
  const [a,b]=await Promise.all([digest(expected),digest(provided)]);
  let difference=0;
  for(let i=0;i<a.length;i++)difference|=a[i]^b[i];
  return difference===0;
}

async function rpc(functionName:string,data:unknown) {
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)throw Error('Database unavailable');
  const response=await fetch(url+'/rest/v1/rpc/cc_confirmed_lunch_'+functionName,{method:'POST',
    headers:{apikey:key,authorization:'Bearer '+key,'content-type':'application/json'},
    body:JSON.stringify(data),signal:AbortSignal.timeout(4500)});
  if(!response.ok)throw Error('Database unavailable');
  return response;
}

const output=(body:unknown,status=200,cache='no-store')=>new Response(JSON.stringify(body),{status,
 headers:{...cors,'content-type':'application/json; charset=utf-8','cache-control':cache}});


const allowedCounter = /^(?:piol77_controcorrente_visits_6ae6fd00_(?:total|day_\d{8})|piol77_controcorrente_radio_unique_on_20261105_(?:total|day_\d{8})|piol77_controcorrente_(?:share|referral)_unique_browsers_v2|controcorrente_natale_2026_(?:adulti|bimbi)_v1)$/;
async function counterRequest(req:Request) {
  const path=new URL(req.url).pathname.split('/counter/')[1]||'';
  const [action,key,...rest]=path.split('/');
  if(req.method!=='GET'||rest.length||!['get','hit'].includes(action)||!allowedCounter.test(key||''))return output({error:'Contatore non valido'},400);
  if(action==='hit'&&req.headers.get('origin')!=='https://piol77.github.io')return output({error:'Origine non consentita'},403);
  const call=async(name:string,args:unknown)=>{
    const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const response=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',
      headers:{apikey:key!,authorization:'Bearer '+key,'content-type':'application/json'},
      body:JSON.stringify(args),signal:AbortSignal.timeout(4000)});
    if(!response.ok)throw Error('Counter storage unavailable');
    return response.json();
  };
  try {
    let data=await call('cc_site_counter',{p_key:key,p_increment:action==='hit'});
    if(data.sync){
      // A failed legacy read never prevents recording new events or becomes a false zero.
      try{
        const legacy=await fetch('https://countapi.mileshilliard.com/api/v1/get/'+key,{signal:AbortSignal.timeout(1800)});
        const old=legacy.status===404?0:legacy.ok?Number((await legacy.json()).value):NaN;
        if(Number.isSafeInteger(old)&&old>=0)data=await call('cc_site_counter_seed',{p_key:key,p_value:old});
      }catch{}
    }
    delete data.sync;
    return output(data);
  }catch{return output({error:'Contatore temporaneamente non disponibile'},503);}

}

export async function handle(req:Request) {
  if(new URL(req.url).pathname.includes('/counter/'))return counterRequest(req);
  try {
    if(req.method==='GET'){
      const date=new URL(req.url).searchParams.get('date')||'';
      if(!validDay(date))return output({error:'Data non valida'},400);
      const body=await (await rpc('read',{p_day:date})).json();
      return output(body||{date,confirmed:null,synced_at:null},200,'public, max-age=15');
    }
    if(req.method!=='POST')return output({error:'Metodo non consentito'},405);
    if(!await authenticated(req.headers.get('authorization')||''))return output({error:'Accesso negato'},401);
    const raw=await req.text();
    if(raw.length>1024)return output({error:'Dati troppo estesi'},413);
    let days,observedAt;
    try{({days,observedAt}=JSON.parse(raw));}catch{return output({error:'Totali non validi'},400);}
    if(typeof observedAt!=='string'||!Number.isFinite(Date.parse(observedAt))||!days||typeof days!=='object'||Array.isArray(days)||Object.keys(days).length!==7||
      Object.entries(days).some(([day,n])=>!validDay(day)||typeof n!=='number'||!Number.isSafeInteger(n)||n<0||n>999999))
      return output({error:'Totali non validi'},400);
    await rpc('publish',{p_days:days,p_observed_at:observedAt});
    return output({saved:true});
  }catch{
    return output({error:'Contatore temporaneamente non disponibile'},503);
  }
}

Deno.serve(handle);
