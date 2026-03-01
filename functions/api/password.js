// POST /api/password - 修改管理员密码（需 Bearer token）

async function verifyToken(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  return (await env.CNU_PRICE.get('token:' + token)) !== null;
}

export async function onRequestPost(context) {
  if (!(await verifyToken(context.request, context.env))) {
    return Response.json({ ok: false, error: '未授权' }, { status: 401 });
  }

  const body = await context.request.json();
  const newPwd = body.password || '';

  if (!newPwd || newPwd.length < 4 || !/^\d+$/.test(newPwd)) {
    return Response.json({ ok: false, error: '密码需4-6位数字' }, { status: 400 });
  }

  await context.env.CNU_PRICE.put('admin_pwd', newPwd);
  return Response.json({ ok: true });
}
