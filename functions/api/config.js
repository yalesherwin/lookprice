// GET /api/config  - 公开，返回所有共享配置
// POST /api/config - 管理员更新配置（需 Bearer token）

async function getConfig(env) {
  const raw = await env.CNU_PRICE.get('config');
  if (!raw) {
    return { adj: [[], [], [], [], []], fob_markup: 250, fob_rate: 6.80, version: Date.now() };
  }
  return JSON.parse(raw);
}

async function verifyToken(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  return (await env.CNU_PRICE.get('token:' + token)) !== null;
}

export async function onRequestGet(context) {
  const config = await getConfig(context.env);
  return Response.json({ ok: true, data: config });
}

export async function onRequestPost(context) {
  if (!(await verifyToken(context.request, context.env))) {
    return Response.json({ ok: false, error: '未授权' }, { status: 401 });
  }

  const body = await context.request.json();
  const config = await getConfig(context.env);

  if (body.adj !== undefined) {
    if (!Array.isArray(body.adj)) {
      return Response.json({ ok: false, error: 'adj must be an array' }, { status: 400 });
    }
    config.adj = body.adj;
  }
  if (body.fob_markup !== undefined) config.fob_markup = parseFloat(body.fob_markup);
  if (body.fob_rate !== undefined) config.fob_rate = parseFloat(body.fob_rate);

  config.version = Date.now();
  await context.env.CNU_PRICE.put('config', JSON.stringify(config));

  return Response.json({ ok: true, data: config });
}
