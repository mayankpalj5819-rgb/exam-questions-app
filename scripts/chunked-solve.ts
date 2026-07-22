import { PrismaClient } from '@prisma/client';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const WORKERS = 3;
const CHUNK = 200;
const MAX_RETRIES = 2;
const DELAY_MS = 500;
const TIMEOUT_MS = 50_000;

const SYS = `JEE expert. Solve the question. Return ONLY JSON no markdown:
{"answer":"A","explanation":"brief"}
MCQ: answer=A/B/C/D/E. Numerical: answer=number only.`;

const db = new PrismaClient({ datasourceUrl: 'file:/home/z/my-project/db/custom.db' });

function zai(prompt: string): Promise<{answer:string;explanation:string}|null> {
  return new Promise(res => {
    const f = path.join(os.tmpdir(), `z${Date.now()}-${Math.random().toString(36).slice(2,6)}.json`);
    execFile('z-ai',['chat','--prompt',prompt.slice(0,4000),'--system',SYS,'-o',f],
      {timeout:TIMEOUT_MS,encoding:'utf-8'as const},(err)=>{
      try{
        if(err){res(null);return;}
        if(!fs.existsSync(f)){res(null);return;}
        const raw=fs.readFileSync(f,'utf-8').trim();
        if(!raw){res(null);return;}
        const c=JSON.parse(raw).choices?.[0]?.message?.content||'';
        if(!c){res(null);return;}
        let js=c;const fm=c.match(/```(?:json)?\s*([\s\S]*?)```/);
        if(fm)js=fm[1].trim();else{const bm=c.match(/\{[\s\S]*\}/);if(bm)js=bm[0];}
        const p=JSON.parse(js);
        if(!p.answer){res(null);return;}
        let a=p.answer.trim().toUpperCase();
        const m=a.match(/([A-E])/);
        res(m?{answer:m[1],explanation:p.explanation||''}:{answer:p.answer.trim(),explanation:p.explanation||''});
      }catch{res(null)}
      finally{try{fs.unlinkSync(f)}catch{}}
    });
  });
}

const wait=ms=>new Promise(r=>setTimeout(r,ms));
let totalSolved=0,totalFail=0,totalDone=0;

async function solve(q:{id:string;questionText:string;options:string|null}){
  try {
    let prompt=q.questionText.slice(0,3500);
    if(q.options?.trim())prompt+=`\nOptions: ${q.options.slice(0,1000)}`;
    for(let i=0;i<MAX_RETRIES;i++){
      await wait(DELAY_MS);
      const r=await zai(prompt);
      if(!r)continue;
      try{await db.question.update({where:{id:q.id},data:{correctAnswer:r.answer,solution:r.explanation}});totalSolved++;return}catch{}
    }
    totalFail++;
  } catch(e) { totalFail++; }
}

async function worker(queue:Array<{id:string;questionText:string;options:string|null}>){
  while(queue.length>0){
    try {
      const q=queue.shift()!;
      await solve(q);
      totalDone++;
      if(totalDone%5===0)process.stdout.write(`\r  ✅${totalSolved} ❌${totalFail} | Done: ${totalDone}   `);
    } catch { totalDone++; totalFail++; }
  }
}

async function main(){
  const total0=await db.question.count({where:{correctAnswer:null}});
  console.log(`\n  Chunked Solver | ${total0} remaining | ${WORKERS} workers\n`);
  
  let offset=0;
  while(true){
    const qs=await db.question.findMany({
      where:{correctAnswer:null},
      select:{id:true,questionText:true,options:true},
      orderBy:{id:'asc'},
      take:CHUNK,
    });
    if(!qs.length)break;
    offset+=qs.length;
    
    await Promise.all(Array.from({length:Math.min(WORKERS,qs.length)},()=>worker([...qs])));
    
    console.log(`\n  Chunk done (${offset} processed). ✅${totalSolved} ❌${totalFail}\n`);
    // Check if next batch would overlap with already-solved
    if(qs.length<CHUNK)break;
  }
  
  const rem=await db.question.count({where:{correctAnswer:null}});
  const ans=await db.question.count({where:{correctAnswer:{not:null}}});
  console.log(`\n  Final: ${ans} answered, ${rem} remaining\n`);
  await db.$disconnect();
}

main().catch(async e=>{console.error(e);await db.$disconnect();process.exit(1)});
