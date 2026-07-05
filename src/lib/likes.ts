import { contentFieldKey, getRedisClient } from './redis';

/**
 * 点赞数计数的服务端存取层，只应该被 `src/pages/api/**` 下的接口 import。
 * 存储结构与 `views.ts` 一致：单个 Redis Hash（`post_likes`），field 为
 * `${contentType}:${slug}`，value 为累计点赞数。
 *
 * 点赞可以取消（前端按钮是切换态，见 `LikeButton.astro`），所以这里既有
 * 自增也有自减；没有登录体系，无法做到「同一用户只能点一次」的强校验，
 * 计数以浏览器本地记录的点赞状态为准（与阅读量统计同样的信任假设，量级
 * 是个人博客，可接受）。
 */

const HASH_KEY = 'post_likes';

async function bump(contentType: string, slug: string, delta: 1 | -1): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;
  const field = contentFieldKey(contentType, slug);
  try {
    const next = await redis.hincrby(HASH_KEY, field, delta);
    if (next < 0) {
      // 取消点赞的请求重复到达（比如网络重试）时可能把计数打到负数，钳制回 0。
      await redis.hset(HASH_KEY, { [field]: 0 });
      return 0;
    }
    return next;
  } catch {
    // 缺少凭证 / 网络异常时兜底为 0，避免接口 500。
    return 0;
  }
}

/** 给某篇内容的点赞数 +1，返回自增后的最新值。 */
export function incrementLikes(contentType: string, slug: string): Promise<number> {
  return bump(contentType, slug, 1);
}

/** 给某篇内容的点赞数 -1（取消点赞），返回自减后的最新值，最小为 0。 */
export function decrementLikes(contentType: string, slug: string): Promise<number> {
  return bump(contentType, slug, -1);
}

/** 批量查询多篇同类型内容的点赞数，缺失的 slug 记为 0。 */
export async function getLikesMap(
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
