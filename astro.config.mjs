// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/**
 * 把 ```mermaid 代码块转成 <pre class="mermaid">，跳过 Shiki 高亮，
 * 交给客户端的 mermaid 渲染成图（见 PostLayout.astro）。
 */
function remarkMermaid() {
  /** @param {string} s */
  const escape = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** @param {import('mdast').Parent} node */
  const walk = (node) => {
    node.children.forEach((child, i) => {
      if (child.type === 'code' && child.lang === 'mermaid') {
        /** @type {import('mdast').Html} */
        const html = {
          type: 'html',
          value: `<pre class="mermaid">${escape(child.value)}</pre>`,
        };
        node.children[i] = html;
      } else if ('children' in child) {
        walk(child);
      }
    });
  };

  /** @param {import('mdast').Root} tree */
  return (tree) => walk(tree);
}

/**
 * 文章内 Markdown 链接默认新页面打开；页内锚点仍保持当前页跳转。
 */
function rehypeArticleLinks() {
  /** @param {import('hast').Root | import('hast').Element} node */
  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'a') {
      const href = node.properties.href;
      if (typeof href === 'string' && !href.startsWith('#')) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }
    }
    if ('children' in node) {
      node.children.forEach((child) => {
        if (child.type === 'element') {
          walk(child);
        }
      });
    }
  };

  /** @param {import('hast').Root} tree */
  return (tree) => walk(tree);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://yanguangjie.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMermaid],
    rehypePlugins: [rehypeArticleLinks],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
