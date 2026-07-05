import type { APIRoute } from 'astro';
import { decrementLikes, getLikesMap, incrementLikes } from '../../lib/likes';

// 站点其余页面都是纯静态（output: 'static'），只有这一个接口需要按需渲染。
export const prerender = false;

const DEFAULT_CONTENT_TYPE = 'blog';
const MAX_SLUGS_PER_REQUEST = 50;

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
}

/** GET /api/likes?slugs=a,b,c&contentType=blog — 批量只读查询，不计数。 */
export const GET: APIRoute = async ({ url }) => {
  const contentType = url.searchParams.get('contentType') || DEFAULT_CONTENT_TYPE;
  const slugs = (url.searchParams.get('slugs') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SLUGS_PER_REQUEST);

  if (slugs.length === 0) {
    return json({ error: 'Missing "slugs" query param' }, { status: 400 });
  }

  const likes = await getLikesMap(contentType, slugs);
  return json(
    { contentType, likes },
    // 读接口允许 CDN 短暂缓存，减少给 Redis 的直接请求量；写接口（POST）不缓存。
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' } },
  );
};

interface ToggleBody {
  slug?: string;
  contentType?: string;
  liked?: boolean;
}

/** POST /api/likes { slug, contentType, liked } — liked=true 点赞 +1，liked=false 取消点赞 -1。 */
export const POST: APIRoute = async ({ request }) => {
  let body: ToggleBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug) {
    return json({ error: 'Missing "slug"' }, { status: 400 });
  }
  const contentType = body.contentType || DEFAULT_CONTENT_TYPE;

  const likes = body.liked === false
    ? await decrementLikes(contentType, slug)
    : await incrementLikes(contentType, slug);

  return json({ slug, contentType, likes });
};
