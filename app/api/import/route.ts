import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';

type Book = { key:string; title:string; grade:number; semester:string; pages:number; entityCount:number; tripleCount:number; evidenceCount:number; entities?:Array<Record<string,unknown>>; triples?:Array<Record<string,unknown>>; evidenceByTriple?:Record<string,Array<Record<string,unknown>>> };
const json = (body:Record<string,unknown>, status=200) => new Response(JSON.stringify(body), { status, headers:{ 'content-type':'application/json; charset=utf-8' } });

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ ok:false, message:'请登录后再导入教材数据。' }, 401);
  if (!env.DB) return json({ ok:false, message:'当前预览环境未绑定 D1；部署到 Sites 后即可持久化。' }, 503);
  const payload = await request.json() as { books?:Book[] };
  const books = Array.isArray(payload.books) ? payload.books : [];
  if (!books.length) return json({ ok:false, message:'导入包中没有 books 数组。' }, 400);
  const now = Date.now();
  const statements: D1PreparedStatement[] = [];
  for (const book of books) {
    statements.push(env.DB.prepare(`INSERT INTO graph_books (key,title,grade,semester,pages,entity_count,triple_count,evidence_count,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET title=excluded.title,grade=excluded.grade,semester=excluded.semester,pages=excluded.pages,entity_count=excluded.entity_count,triple_count=excluded.triple_count,evidence_count=excluded.evidence_count,updated_at=excluded.updated_at`).bind(book.key,book.title,book.grade,book.semester,book.pages,book.entityCount,book.tripleCount,book.evidenceCount,now));
    for (const entity of book.entities ?? []) statements.push(env.DB.prepare(`INSERT OR REPLACE INTO graph_entities (id,book_key,name,type,aliases,description,first_page,confidence) VALUES (?,?,?,?,?,?,?,?)`).bind(entity.id,book.key,entity.name,entity.type,JSON.stringify(entity.aliases ?? []),entity.description ?? null,entity.firstPage ?? null,entity.confidence ?? null));
    for (const triple of book.triples ?? []) statements.push(env.DB.prepare(`INSERT OR REPLACE INTO graph_triples (id,book_key,subject,predicate,object_id,literal,object_kind,source_page,section,confidence) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(triple.id,book.key,triple.subject,triple.predicate,triple.objectId ?? null,triple.literal ?? null,triple.objectKind ?? null,triple.sourcePage ?? null,triple.section ?? null,triple.confidence ?? null));
    for (const triple of book.triples ?? []) for (const evidence of book.evidenceByTriple?.[String(triple.id)] ?? []) statements.push(env.DB.prepare(`INSERT OR REPLACE INTO graph_evidence (id,triple_id,book_key,pdf_page,textbook_page,summary,region,confidence) VALUES (?,?,?,?,?,?,?,?)`).bind(`${String(triple.id)}:${String(evidence.pdfPage ?? 'x')}:${String(evidence.region ?? '')}`,triple.id,book.key,evidence.pdfPage ?? null,evidence.textbookPage ?? null,evidence.summary ?? null,evidence.region ?? null,evidence.confidence ?? null));
  }
  for (let i=0; i<statements.length; i+=100) await env.DB.batch(statements.slice(i,i+100));
  return json({ ok:true, importedBooks:books.length, statements:statements.length, importedBy:user.id ?? 'current-user' });
}
