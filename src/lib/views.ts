import { contentFieldKey, getRedisClient } from './redis';

/**
 * 阅读量计数的服务端存取层，只应该被 `src/pages/api/**` 下的接口 import。
 *
 * 存储结构：单个 Redis Hash（`page_views`），field 为 `${contentType}:${slug}`，
 * value 为累计阅读数。选 Hash 而不是每篇文章一个 key，是为了后续做「批量查询多篇
 * 文章阅读量」时只需一次 HMGET，不用为每篇文章单独发一次 Redis 请求。
 */

const HASH_KEY = 'page_views';

/** 给某篇内容的阅读量 +1，返回自增后的最新值。 */
export async function incrementViews(contentType: string, slug: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;
  try {
    return await redis.hincrby(HASH_KEY, contentFieldKey(contentType, slug), 1);
  } catch {
    // 缺少凭证时不会在构造阶段抛错，而是在真正发请求时才失败
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

  const redis = getRedisClient();
  if (!redis) return result;

  const fields = slugs.map((slug) => contentFieldKey(contentType, slug));
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
