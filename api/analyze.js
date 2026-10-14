import { validateCase } from '../lib/audit.js';
import { promptFor, parseModel } from '../lib/ai-contract.js';
import { EXISTING_AI_URL, EXISTING_AI_PUBLISHABLE_KEY } from '../lib/existing-ai.js';

const attempts=new Map();
export default async function handler(req,res) {
 res.setHeader('Cache-Control','private, no-store');
 const direct=Boolean(process.env.GEMINI_API_KEY||(process.env.AUDIT_AI_API_KEY&&process.env.AUDIT_AI_MODEL));
 const legacyUrl=process.env.HEVRUTAI_SUPABASE_URL||EXISTING_AI_URL;
 const legacyKey=process.env.HEVRUTAI_SUPABASE_PUBLISHABLE_KEY||EXISTING_AI_PUBLISHABLE_KEY;
 const legacy=Boolean(legacyUrl&&legacyKey);
 if(req.method==='GET')return res.status(200).json({configured:direct||legacy,scope:'Supplied text and evidence passages only; human review required.'});
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
 const origin=req.headers.origin;
 let originHost;try{originHost=new URL(origin).host;}catch{}
 if(!originHost||originHost!==req.headers.host)return res.status(403).json({error:'Submit from the HevrutAI site.'});
 if(!direct&&!legacy)return res.status(503).json({error:'AI assistance has not been activated. Text scanning, evidence review, and report export remain available.'});
 const ip=req.headers['x-forwarded-for']?.split(',')[0]||'unknown';
 const now=Date.now();for(const[k,v]of attempts)if(now-v.start>60000)attempts.delete(k);
 const limit=attempts.get(ip)||{start:now,count:0};if(++limit.count>4)return res.status(429).json({error:'Please wait a minute before another AI request.'});attempts.set(ip,limit);
 try {
  let body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(JSON.stringify(body).length>90000)return res.status(413).json({error:'Keep the evidence packet under 90,000 characters.'});
  const input=validateCase(body);
  if(input.text.trim().length<20)return res.status(400).json({error:'Supply at least 20 characters of text.'});
  const prompt=promptFor(input);let response,raw;
  if(process.env.GEMINI_API_KEY) {
   const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
   if(!/^[\w.-]+$/.test(model))throw new Error('Invalid AI configuration.');
   response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.2,maxOutputTokens:12000}}),signal:AbortSignal.timeout(115000)});
   if(response.ok){const d=await response.json();raw=d.candidates?.[0]?.content?.parts?.filter(x=>!x.thought).map(x=>x.text||'').join('');}
  } else if(process.env.AUDIT_AI_API_KEY&&process.env.AUDIT_AI_MODEL) {
   response=await fetch((process.env.AUDIT_AI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.AUDIT_AI_API_KEY},body:JSON.stringify({model:process.env.AUDIT_AI_MODEL,messages:[{role:'user',content:prompt}],response_format:{type:'json_object'}}),signal:AbortSignal.timeout(115000)});
   if(response.ok){const d=await response.json();raw=d.choices?.[0]?.message?.content;}
  } else {
   const url=new URL(legacyUrl);if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))throw new Error('Invalid AI configuration.');
   let repair='';
   for(let attempt=0;attempt<2;attempt++) {
    response=await fetch(url.origin+'/functions/v1/audit',{method:'POST',headers:{'Content-Type':'application/json',apikey:legacyKey,Authorization:'Bearer '+legacyKey},body:JSON.stringify({query:prompt+'\nOUTPUT TRANSPORT: In your required forensic_audit_result tool call, set vindicated_output to a JSON STRING containing the complete required report object above. Do not put prose in that field. Do not put the report in any other field. The envelope’s numerical scores are discarded, not used as evidence. Keep the review concise.'+repair,mode:'forensic'}),signal:AbortSignal.timeout(70000)});
    if(!response.ok)break;
    const d=await response.json();raw=d.vindicated_output;
    try{return res.status(200).json({result:parseModel(raw||'',input)});}catch(e){
     if(attempt===1)throw e;
     repair='\nFORMAT REPAIR: The preceding response was rejected: '+e.message+'. Regenerate the required report from the original supplied record. Return 28 unique facets. If no evidence passages are supplied, use only Evidence deficient or Context review for claims and empty sourceIds. No invented quotes, evidence IDs, or definitive factual standings. The vindicated_output field MUST begin with { and end with } and contain valid JSON, not ordinary prose.';
    }
   }
  }
  if(!response.ok)return res.status(response.status===429?429:502).json({error:'The AI service is unavailable. Your case is intact; try again later.'});
  const result=parseModel(raw||'',input);return res.status(200).json({result});
 } catch(e) {
  const safe=['AI response did not','AI report','AI supplied','AI asserted','AI claim','AI facet','AI synthesis','This is not a supported'];
  const message=safe.some(s=>e.message?.startsWith(s))?e.message:'AI analysis could not be completed. Your case is intact.';
  return res.status(502).json({error:message});
 }
}
