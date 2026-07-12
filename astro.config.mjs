// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

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
 * 把 ```dot（Graphviz digraph 的一个小子集）代码块转成等价的 mermaid
 * flowchart 语法，复用 mermaid 的渲染管线（见 PostLayout.astro），
 * 这样 Skill 文档里常见的 dot 决策图也能在文章里直接渲染。
 *
 * 支持的语法：
 *   digraph name { ... }
 *   "节点文本" [shape=diamond|box];   // shape 可省略，默认当作矩形
 *   "节点 A" -> "节点 B" [label="文案"];
 * 节点名/边两端也可以是不带引号的标识符。
 */
function remarkDot() {
  const NODE_TOKEN = /"(?:[^"\\]|\\.)*"|[A-Za-z_][\w]*/;
  const EDGE_RE = new RegExp(
    `^(${NODE_TOKEN.source})\\s*->\\s*(${NODE_TOKEN.source})\\s*(?:\\[\\s*label\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*\\])?$`
  );
  const NODE_DECL_RE = new RegExp(
    `^(${NODE_TOKEN.source})\\s*\\[\\s*shape\\s*=\\s*(\\w+)\\s*\\]$`
  );

  /** @param {string} tok */
  const unquote = (tok) =>
    tok.startsWith('"') && tok.endsWith('"')
      ? tok.slice(1, -1).replace(/\\"/g, '"')
      : tok;

  /** @param {string} text */
  const escapeLabel = (text) =>
    text.replace(/"/g, '&quot;').replace(/\n/g, '<br/>');

  /** @type {Record<string, (id: string, label: string) => string>} */
  const SHAPE_WRAP = {
    diamond: (id, label) => `${id}{"${label}"}`,
    box: (id, label) => `${id}["${label}"]`,
  };
  /**
   * @param {string} id
   * @param {string} label
   * @param {string | undefined} shape
   */
  const wrapNode = (id, label, shape) =>
    (SHAPE_WRAP[shape || 'box'] || SHAPE_WRAP.box)(id, escapeLabel(label));

  /** @param {string} source */
  function dotToMermaid(source) {
    const body = source
      .replace(/^\s*(strict\s+)?digraph\b[^{]*\{/, '')
      .replace(/\}\s*$/, '');

    /** @type {string[]} */
    const nodeOrder = [];
    /** @type {Map<string, string>} */
    const nodeIds = new Map();
    /** @type {Map<string, string>} */
    const nodeShapes = new Map();
    /** @type {{ from: string, to: string, label: string | undefined }[]} */
    const edges = [];

    /** @param {string} label */
    const ensureNode = (label) => {
      if (!nodeIds.has(label)) {
        nodeIds.set(label, `n${nodeOrder.length}`);
        nodeOrder.push(label);
      }
      return nodeIds.get(label);
    };

    for (const rawStatement of body.split(';')) {
      const statement = rawStatement.replace(/\s+/g, ' ').trim();
      if (!statement) continue;

      const edgeMatch = statement.match(EDGE_RE);
      if (edgeMatch) {
        const from = unquote(edgeMatch[1]);
        const to = unquote(edgeMatch[2]);
        ensureNode(from);
        ensureNode(to);
        edges.push({ from, to, label: edgeMatch[3] });
        continue;
      }

      const declMatch = statement.match(NODE_DECL_RE);
      if (declMatch) {
        const label = unquote(declMatch[1]);
        ensureNode(label);
        nodeShapes.set(label, declMatch[2]);
      }
      // 其余语句（图属性等）直接忽略。
    }

    if (!nodeOrder.length) return null;

    const lines = ['flowchart TD'];
    for (const label of nodeOrder) {
      const id = /** @type {string} */ (nodeIds.get(label));
      lines.push(`  ${wrapNode(id, label, nodeShapes.get(label))}`);
    }
    for (const { from, to, label } of edges) {
      const arrow = label ? `-->|"${escapeLabel(label)}"|` : '-->';
      lines.push(`  ${nodeIds.get(from)} ${arrow} ${nodeIds.get(to)}`);
    }
    return lines.join('\n');
  }

  /** @param {string} s */
  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** @param {import('mdast').Parent} node */
  const walk = (node) => {
    node.children.forEach((child, i) => {
      if (child.type === 'code' && child.lang === 'dot') {
        const mermaidSource = dotToMermaid(child.value);
        if (mermaidSource) {
          /** @type {import('mdast').Html} */
          const html = {
            type: 'html',
            value: `<pre class="mermaid">${escapeHtml(mermaidSource)}</pre>`,
          };
          node.children[i] = html;
        }
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
  // 站点整体仍是 output: 'static'（默认值），仅 src/pages/api/ 下的接口通过
  // `export const prerender = false` 按需渲染，因此需要 adapter 才能部署这部分函数。
  adapter: vercel(),
  integrations: [
    mdx(),
    sitemap({
      // /zen/ 没有公开入口（不在导航中出现，本质是彩蛋页面），不应出现在 sitemap 里被搜索引擎发现。
      filter: (page) => !new URL(page).pathname.startsWith('/zen/'),
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMermaid, remarkDot],
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
