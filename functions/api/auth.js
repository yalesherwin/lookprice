// POST /api/auth - 验证管理员密码，返回 session token

export async function onRequestPost(context) {
  const body = await context.request.json();
  const pwd = body.password || '';
  const stored = (await context.env.CNU_PRICE.get('admin_pwd')) || '8888';

  if (pwd !== stored) {
    return Response.json({ ok: false, error: '密码错误' }, { status: 401 });
  }

  const token = btoa(Date.now() + ':' + crypto.randomUUID());
  await context.env.CNU_PRICE.put('token:' + token, '1', { expirationTtl: 3600 });

  return Response.json({ ok: true, token });
}
