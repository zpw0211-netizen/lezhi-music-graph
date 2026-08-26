type Fact={subject:string;predicate:string;object:string;bookTitle:string;page?:number|null};

export const dynamic='force-dynamic';

export async function POST(request:Request){
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey)return Response.json({ok:false,message:'GPT 服务尚未配置'}, {status:503});
  try{
    const body=await request.json() as {question?:string;entityName?:string;bookTitle?:string;facts?:Fact[];previousAnswer?:string};
    const question=(body.question??'').trim().slice(0,500);
    const facts=(body.facts??[]).slice(0,12);
    if(!question||!facts.length)return Response.json({ok:false,message:'缺少问题或教材证据'}, {status:400});
    const evidence=facts.map((fact,index)=>`${index+1}. ${fact.subject}｜${fact.predicate}｜${fact.object}｜${fact.bookTitle}｜PDF第${fact.page??'—'}页`).join('\n');
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||'gpt-5.4',
        store:false,
        max_output_tokens:420,
        instructions:'你是中小学音乐教材知识图谱助手。只能使用用户提供的教材证据回答，严禁补充证据之外的作者、年代、体裁或历史事实。不要逐条复制三元组；请先直接回答问题，再把多条关系组织成2至4句连贯、适合教师和学生阅读的中文。自然说明教材名称和PDF页码。证据不足时必须明确说“现有教材证据不足”。不要使用Markdown表格。',
        input:`用户问题：${question}\n当前实体：${body.entityName??''}\n教材：${body.bookTitle??''}\n上一轮回答（仅用于理解追问，不得作为事实来源）：${(body.previousAnswer??'').slice(0,600)}\n\n可用教材证据：\n${evidence}`
      })
    });
    if(!response.ok)return Response.json({ok:false,message:'模型暂时无法回答'}, {status:502});
    const payload=await response.json() as {output?:Array<{content?:Array<{type?:string;text?:string}>}>};
    const answer=payload.output?.flatMap(item=>item.content??[]).find(item=>item.type==='output_text')?.text?.trim();
    if(!answer)return Response.json({ok:false,message:'模型没有返回文本'}, {status:502});
    return Response.json({ok:true,answer,poweredBy:'gpt'});
  }catch{return Response.json({ok:false,message:'请求格式无法识别'}, {status:400});}
}
