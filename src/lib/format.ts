/** 把计数格式化为易读文案，超过一万显示为「x.x万」。供阅读量、点赞数等展示复用。 */
export function formatCount(n: number): string {
  if (n >= 10000) {
    const wan = (n / 10000).toFixed(1).replace(/\.0$/, '');
    return `${wan}万`;
  }
  return String(n);
}

/** 统一的中文日期格式（YYYY/MM/DD），供博客、talks 卡片和详情页复用。 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
