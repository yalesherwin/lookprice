// GET /api/config  - 公开，返回所有共享配置（含基础价格）
// POST /api/config - 管理员更新配置（需 Bearer token）

async function getConfig(env) {
  const raw = await env.CNU_PRICE.get('config');
  const basePricesRaw = await env.CNU_PRICE.get('base_prices');
  const config = raw
    ? JSON.parse(raw)
    : { adj: [[], [], [], [], []], fob_markup: 250, fob_rate: 6.80, version: Date.now() };
  if (basePricesRaw) {
    config.base_prices = JSON.parse(basePricesRaw);
  }
  return config;
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

  // 基础价格单独存储（数据量较大，分开存）
  if (body.base_prices !== undefined) {
    if (!Array.isArray(body.base_prices)) {
      return Response.json({ ok: false, error: 'base_prices must be an array' }, { status: 400 });
    }
    await context.env.CNU_PRICE.put('base_prices', JSON.stringify(body.base_prices));
  }

  config.version = Date.now();
  // 存config时不含base_prices，避免重复存储
  const { base_prices, ...configWithoutBase } = config;
  await context.env.CNU_PRICE.put('config', JSON.stringify(configWithoutBase));

  return Response.json({ ok: true, data: config });
}
