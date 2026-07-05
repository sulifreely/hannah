import { Redis } from '@upstash/redis';

/**
 * 阅读量计数的服务端存取层，只应该被 `src/pages/api/**` 下的接口 import。
 * 不要在 .astro 组件的 frontmatter 或客户端 <script> 里直接引入这个文件——
 * Upstash 的访问凭证只应该留在服务端环境变量里。
 *
 * 存储结构：单个 Redis Hash（`page_views`），field 为 `${contentType}:${slug}`，
 * value 为累计阅读数。选 Hash 而不是每篇文章一个 key，是为了后续做「批量查询多篇
 * 文章阅读量」时只需一次 HMGET，不用为每篇文章单独发一次 Redis 请求。
 */

const HASH_KEY = 'page_views';

let cachedClient: Redis | null | undefined;

interface Credentials {
  url: string;
  token: string;
}

/**
 * 找 Upstash 的连接凭证。除了标准命名（`UPSTASH_REDIS_REST_*` /
 * `KV_REST_API_*`，`Redis.fromEnv()` 能直接识别），Vercel Marketplace 的原生
 * 集成还会按你给 store 起的名字加前缀注入变量（例如这个项目连的 store 叫
 * "hannah-blog"，实际变量名是 `HANNAH_BLOG_KV_REST_API_URL` /
 * `HANNAH_BLOG_KV_REST_API_TOKEN`），所以需要额外做一次通配匹配，而不是把
 * 具体前缀硬编码在代码里（万一之后重建/改名 store，代码不用跟着改）。
 */
function resolveCredentials(): Credentials | null {
  // 生产环境（Vercel Serverless Function）里凭证会在 `process.env` 上；
  // 本地 `astro dev` 由 Vite 驱动，非 `PUBLIC_` 前缀的变量只会出现在
  // `import.meta.env` 里，不会同步写回 `process.env`，所以两边都要查。
  const env: Record<string, string | undefined> = {
    ...(import.meta.env as unknown as Record<string, string | undefined>),
    ...process.env,
  };

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN };
  }
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    return { url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN };
  }

  const urlKey = Object.keys(env).find(
    (key) => key.endsWith('_KV_REST_API_URL') || key.endsWith('_REDIS_REST_URL'),
  );
  if (urlKey) {
    const prefix = urlKey.replace(/_KV_REST_API_URL$|_REDIS_REST_URL$/, '');
    const tokenKey = [`${prefix}_KV_REST_API_TOKEN`, `${prefix}_REDIS_REST_TOKEN`].find(
      (key) => env[key],
    );
    const url = env[urlKey];
    const token = tokenKey ? env[tokenKey] : undefined;
    if (url && token) return { url, token };
  }

  return null;
}

function getRedis(): Redis | null {
  if (cachedClient !== undefined) return cachedClient;

  // 提前判断凭证是否存在：Redis.fromEnv() 在没有 url/token 时不会抛错，而是
  // 生成一个「注定失败」的客户端，实际发请求时才报错（本地开发没配置 Upstash
  // 时会遇到），提前拦截可以避免每次请求都白等一轮网络超时重试。
  const credentials = resolveCredentials();
  if (!credentials) {
    cachedClient = null;
    return cachedClient;
  }

  try {
    cachedClient = new Redis({ url: credentials.url, token: credentials.token });
  } catch {
    cachedClient = null;
  }
  return cachedClient;
}

function fieldName(contentType: string, slug: string) {
  return `${contentType}:${slug}`;
}

/** 给某篇内容的阅读量 +1，返回自增后的最新值。 */
export async function incrementViews(contentType: string, slug: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  try {
    return await redis.hincrby(HASH_KEY, fieldName(contentType, slug), 1);
  } catch {
    // Redis.fromEnv() 在缺少凭证时不会在构造阶段抛错，而是在真正发请求时才失败
    // （比如本地未配置 Upstash 环境变量），这里兜底为 0，避免接口 500。
    return 0;
  }
}

/** 批量查询多篇同类型内容的阅读量，缺失的 slug 记为 0。 */
export async function getViewsMap(
  contentType: string,
  slugs: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (slugs.length === 0) return result;
  slugs.forEach((slug) => (result[slug] = 0));

  const redis = getRedis();
  if (!redis) return result;

  const fields = slugs.map((slug) => fieldName(contentType, slug));
  try {
    const raw = await redis.hmget<Record<string, string>>(HASH_KEY, ...fields);
    slugs.forEach((slug, i) => {
      const value = raw?.[fields[i]];
      result[slug] = value ? Number(value) || 0 : 0;
    });
  } catch {
    // 同上：凭证缺失/网络异常时保持默认的 0，不让整个接口报错。
  }
  return result;
}
