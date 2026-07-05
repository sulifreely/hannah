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

function hasCredentials(): boolean {
  const env = process.env;
  return Boolean(
    (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) ||
      (env.KV_REST_API_URL && env.KV_REST_API_TOKEN),
  );
}

function getRedis(): Redis | null {
  if (cachedClient !== undefined) return cachedClient;

  // 提前判断凭证是否存在：Redis.fromEnv() 在没有 url/token 时不会抛错，而是
  // 生成一个「注定失败」的客户端，实际发请求时才报错（本地开发没配置 Upstash
  // 时会遇到），提前拦截可以避免每次请求都白等一轮网络超时重试。
  if (!hasCredentials()) {
    cachedClient = null;
    return cachedClient;
  }

  try {
    // Redis.fromEnv() 自动识别 UPSTASH_REDIS_REST_* 或 KV_REST_API_*
    // （Vercel Marketplace 安装 Upstash 集成后自动注入，二者兼容）。
    cachedClient = Redis.fromEnv();
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
