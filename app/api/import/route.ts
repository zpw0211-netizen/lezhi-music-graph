// GitHub Pages is static and cannot persist uploads. The original D1 handler
// is retained at server/cloudflare-import-route.ts for an independent backend.
export const dynamic = 'force-static';

export async function POST() {
  return Response.json(
    { ok: false, message: 'GitHub Pages 静态版不支持在线写入；请使用标准 JSON 导入包或连接独立后端。' },
    { status: 501 },
  );
}
