import { query } from './db.js';
import { emailOrderPasses } from './passService.js';

let running=false;
export async function processEmailQueueOnce(){
  if(running)return false;running=true;
  try{
    const job=(await query("SELECT * FROM email_jobs WHERE status IN ('pending','failed') AND attempt_count<8 AND next_attempt_at<=NOW() ORDER BY id LIMIT 1"))[0];
    if(!job)return false;
    const claimed=await query("UPDATE email_jobs SET status='processing',attempt_count=attempt_count+1 WHERE id=? AND status IN ('pending','failed')",[job.id]);if(!claimed.affectedRows)return false;
    try{
      if(job.kind!=='delegate_passes')throw new Error(`Unsupported email job kind: ${job.kind}`);
      const result=await emailOrderPasses(job.order_id);if(!result.sent)throw new Error(result.reason);
      await query("UPDATE email_jobs SET status='sent',sent_at=NOW(),last_error=NULL WHERE id=?",[job.id]);
    }catch(error){const delay=Math.min(3600,30*(2**Math.min(job.attempt_count,7))),next=new Date(Date.now()+delay*1000);await query("UPDATE email_jobs SET status='failed',next_attempt_at=?,last_error=? WHERE id=?",[next,String(error.message||error).slice(0,1000),job.id]);}
    return true;
  }finally{running=false}
}

export function startEmailWorker(){
  let stopped=false;const run=async()=>{if(stopped)return;try{while(await processEmailQueueOnce()){} }catch(error){console.error('Email worker failure',error)}};
  run();const timer=setInterval(run,15000);timer.unref();return()=>{stopped=true;clearInterval(timer)};
}
