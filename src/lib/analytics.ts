import { track } from '@vercel/analytics';

/**
 * 站点自定义埋点的统一出口。
 *
 * 目的：新增一种互动事件（点赞、分享、收藏……）时，只需要在这里补充
 * 一个类型化的事件定义，调用方（各组件的 <script>）不用关心 Vercel
 * Analytics 的事件名拼写、字段命名是否一致，也方便以后集中调整埋点方案
 * （比如统一加上 locale、ab-test bucket 等公共字段）。
 *
 * Vercel Custom Events 的限制（详见文档）：
 * - 自定义数据只能是 string / number / boolean / null，不支持嵌套对象
 * - 事件名、字段名、字段值长度都不能超过 255 字符
 * https://vercel.com/docs/analytics/custom-events
 */

export type ContentType = 'blog' | 'talk';

type EventValue = string | number | boolean | null;

/** 所有自定义事件共享的基础字段，方便后续统一扩展。 */
interface BaseEventProps {
  contentType: ContentType;
  slug: string;
  title: string;
  path: string;
  /** 允许具体事件按需附加字段，同时仍受 Vercel 支持的数据类型约束。 */
  [key: string]: EventValue;
}

export type LikeEventProps = BaseEventProps;

function safeTrack(name: string, props: Record<string, EventValue>) {
  try {
    track(name, props);
  } catch {
    // 埋点失败（例如被广告拦截插件拦截）不应该影响页面正常交互
  }
}

export const AnalyticsEvents = {
  postLike: (props: LikeEventProps) => safeTrack('post_like', props),
  postUnlike: (props: LikeEventProps) => safeTrack('post_unlike', props),

  // 预留位置：后续新增互动方式时，在这里追加即可，例如：
  // postShare: (props: BaseEventProps & { channel: string }) =>
  //   safeTrack('post_share', props),
  // postBookmark: (props: BaseEventProps) => safeTrack('post_bookmark', props),
} as const;
