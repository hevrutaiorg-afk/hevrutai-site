export const VERSION = 'HevrutAI Review 1.0 · Machloket 28';
export const FACETS = [
 ['FAC-01','Chronological precede test','Do the dated records support the claimed order of cause and effect?'],
 ['FAC-02','Primary source verification','Does the original record support this exact claim?'],
 ['FAC-03','Passive sycophancy detection','Does wording hide agency or mirror assumptions without evidence?'],
 ['FAC-04','Institutional authority check','What evidence supports the institution’s assertion?'],
 ['FAC-05','Rebranding / false reform','Is claimed reform supported by changed conduct?'],
 ['FAC-06','Financial conflict screen','Are material financial interests documented and disclosed?'],
 ['FAC-07','Partnership timeline audit','Do partnership dates precede the claimed outcomes?'],
 ['FAC-08','Chazakah continuity test','What documented continuity or change bears on this claim? Continuity alone does not prove motive.'],
 ['FAC-09','Lex Prior application','What earlier records bear on the claim? Earlier presence alone does not settle current legal rights.'],
 ['FAC-10','False balance detection','Does equal presentation obscure a difference in evidentiary support?'],
 ['FAC-11','Source tier assignment','Is each source classified for this claim, with its limitations stated?'],
 ['FAC-12','Curriculum content audit','What is taught, omitted, or altered in the actual material?'],
 ['FAC-13','FTO designation check','Is the designation verified for the relevant jurisdiction and date?'],
 ['FAC-14','Credibility laundering','Is repetition or affiliation being mistaken for corroboration?'],
 ['FAC-15','Historical erasure detection','Which documented identities, events, or connections are omitted?'],
 ['FAC-16','Structural framing audit','What does selection, wording, or sequencing encourage the reader to infer?'],
 ['FAC-17','Nonpartisan claim verification','Does documented conduct support the stated institutional position?'],
 ['FAC-18','FARA foreign agent check','What do the relevant registration records establish? Registration alone does not establish wrongdoing.'],
 ['FAC-19','False equivalency detection','Are materially different actions or evidence treated as equivalent?'],
 ['FAC-20','Archaeological record check','What do dated archaeological records establish, and what remains uncertain?'],
 ['FAC-21','Institutional sycophancy','Does institutional deference replace independent examination?'],
 ['FAC-22','Authority overreach','Is authority being applied outside the evidence or subject it covers?'],
 ['FAC-23','Proxy sourcing detection','Does the citation reach an original source or merely another retelling?'],
 ['FAC-24','Credential laundering','Does the cited credential establish competence for this specific claim?'],
 ['FAC-25','Weaponized definition detection','Is a definition applied consistently, with context and limits?'],
 ['FAC-26','Narrative substitution detection','Has an explanation replaced the documented event or been presented as justification?'],
 ['FAC-27','Selective minority recognition','Is collective identity or equal protection applied inconsistently?'],
 ['FAC-28','Survivorship erasure detection','Are victims’ identities, testimony, or documented harms obscured?']
].map(([id,name,question])=>({id,name,question}));
export const STATUSES = ['Not examined','Question raised','Supported in supplied record','Contradicted in supplied record','Not applicable'];
export function safeUrl(value) {try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function sentences(text) {return String(text).match(/[^.!?\n]+(?:[.!?]+|$)/g)?.map(s=>s.trim()).filter(Boolean)||[];}
export function scanText(text) {
 const findings=[];
 for(const quote of sentences(text)) {
  if(/\b(?:was|were|is|are|been|being)\s+(?:\w+ly\s+)?(?:killed|attacked|murdered|displaced|expelled|arrested|destroyed|targeted|kidnapped|abducted|injured)\b/i.test(quote)&&! /\bby\s+\S/i.test(quote))findings.push({facet:'FAC-03',quote,title:'Actor not named in this sentence',question:'Who carried out the action? Check the surrounding text and evidence; do not infer an actor.',kind:'Structural flag'});
  if(/\b(?:all|every|the)\s+jews?\b|\bjews?\s+(?:control|own|run|are responsible|must pay|should be killed|should die)\b|\b(?:jewish|zionist)\s+(?:cabal|conspiracy)\b/i.test(quote))findings.push({facet:'FAC-27',quote,title:'Possible collective blame or conspiracy language',question:'Does this assert collective responsibility or a conspiracy about Jews? Is it quoted, condemned, or endorsed? Record the surrounding context.',kind:'Context review'});
  if(/\b(?:holocaust.{0,35}(?:hoax|fabricat|never happened)|(?:hoax|fabricat).{0,35}holocaust)\b/i.test(quote))findings.push({facet:'FAC-28',quote,title:'Possible Holocaust denial language',question:'Determine whether the speaker endorses or reports this language. Document exact wording and primary evidence.',kind:'Context review'});
  if(/\b(?:because|in response to|retaliat\w*|after|before|led to|caused)\b/i.test(quote))findings.push({facet:'FAC-01',quote,title:'Causal or temporal claim to test',question:'Add dated events and identify the evidence connecting them. Sequence alone does not establish causation.',kind:'Evidence needed'});
  if(/\b(?:experts|studies|research|scholars|officials)\s+(?:say|show|suggest|agree|believe|confirm)\b/i.test(quote))findings.push({facet:'FAC-02',quote,title:'Source attribution to resolve',question:'Which expert, study, or original record supports the precise claim? Add the source and relevant passage.',kind:'Evidence needed'});
 }
 return findings.slice(0,40);
}
export function newCase(mode='article') {return {schema:1,id:'HVR-'+Date.now().toString(36).toUpperCase(),createdAt:new Date().toISOString(),version:VERSION,mode,title:'',text:'',url:'',context:'',claims:[],sources:[],timeline:[],facets:Object.fromEntries(FACETS.map(f=>[f.id,{status:'Not examined',note:''}])),conclusion:'',reviewer:'',reviewedAt:'',ai:null};}
export function validateCase(input) {
 if(!input||input.schema!==1||typeof input.text!=='string'||input.text.length>30000)throw new Error('This is not a supported HevrutAI case file.');
 const out=newCase(['article','ai','incident'].includes(input.mode)?input.mode:'article');
 for(const key of ['title','text','url','context','conclusion','reviewer','reviewedAt','createdAt','id'])if(typeof input[key]==='string')out[key]=input[key].slice(0,key==='text'?30000:6000);
 for(const key of ['claims','sources','timeline'])if(Array.isArray(input[key]))out[key]=input[key].slice(0,100).map(item=>{const clean={};if(item&&typeof item==='object')for(const [k,v]of Object.entries(item))if(['id','text','status','note','name','url','quote','relation','tier','date','event','sourceId'].includes(k)&&typeof v==='string')clean[k]=v.slice(0,6000);return clean;});
 for(const f of FACETS) {const v=input.facets?.[f.id];if(v&&STATUSES.includes(v.status))out.facets[f.id]={status:v.status,note:typeof v.note==='string'?v.note.slice(0,6000):''};}
 // Importing a case does not certify AI claims or reviewer identity.
 return out;
}
export function reportText(c) {
 const flags=scanText(c.text),done=Object.values(c.facets).filter(x=>x.status!=='Not examined').length;
 return `${VERSION}\n${c.title||'Untitled review'} · ${c.id}\nCreated: ${c.createdAt}\nStanding: ${c.reviewedAt?'Reviewer notes recorded (self-reported)':'Working report — human review pending'}\nScope: supplied text and user-added evidence. External sources are not independently verified.\n\nSOURCE\n${safeUrl(c.url)||'No source URL supplied'}\n\nSUBMITTED TEXT\n${c.text}\n\nCONTEXT\n${c.context||'None supplied'}\n\nSTRUCTURAL FLAGS (${flags.length})\n${flags.map(f=>`${f.facet}: ${f.title}\nPassage: ${f.quote}\nQuestion: ${f.question}`).join('\n\n')||'No configured text patterns detected. This is not a clearance or verdict.'}\n\nCLAIMS\n${c.claims.map(x=>`${x.id}: ${x.text}\nStanding: ${x.status}\nNotes: ${x.note||''}`).join('\n\n')||'No claims recorded.'}\n\nEVIDENCE LEDGER\n${c.sources.map(s=>`${s.id}: ${s.name}\nURL: ${safeUrl(s.url)||'No valid URL'}\nType (user assigned): ${s.tier}\nRelevant passage (user supplied): ${s.quote}\nRelation: ${s.relation}\nLimitations: ${s.note||'Not recorded'}`).join('\n\n')||'No evidence supplied.'}\n\nTIMELINE\n${[...c.timeline].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(t=>`${t.date||'Undated'}: ${t.event} [${t.sourceId||'No source linked'}]`).join('\n')||'No dated events supplied.'}\n\nMACHLOKET CHECKLIST (${done}/28 examined)\n${FACETS.map(f=>`${f.id} ${f.name}: ${c.facets[f.id].status}\n${c.facets[f.id].note||'No finding recorded.'}`).join('\n\n')}\n\nAI ASSISTANCE\n${c.ai?JSON.stringify(c.ai,null,2):'No AI analysis recorded.'}\n\nPROVISIONAL CONCLUSION\n${c.conclusion||'Evidence deficient — no conclusion entered.'}\n\nREVIEW\n${c.reviewer||'No reviewer recorded'} · ${c.reviewedAt||'Pending'}\nReviewer identity and findings have not been certified by HevrutAI. This report is not an approved Opposition Library entry.\n\n© 2026 Stacy La Mell · HevrutAI\nThe evidence is the authority.\n`;
}
