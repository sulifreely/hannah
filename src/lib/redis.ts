import { Redis } from '@upstash/redis';

/**
 * Upstash Redis 客户端的共享解析逻辑，供 `src/lib/views.ts`、`src/lib/likes.ts`
 * 等服务端存取层复用。只应该被 `src/pages/api/**` 下的接口间接 import——
 * Upstash 的访问凭证只应该留在服务端环境变量里，不要在 .astro 组件的
 * frontmatter 或客户端 <script> 里直接引入。
 */

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

/** 拿到共享的 Redis 客户端；没有配置凭证（比如本地未接 Upstash）时返回 null。 */
export function getRedisClient(): Redis | null {
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

/** Hash 存储里统一用的 field 命名：`${contentType}:${slug}`。 */
export function contentFieldKey(contentType: string, slug: string): string {
  return `${contentType}:${slug}`;
}
