import { AutoChart, BackEndChartType, getChartType } from '@/components/chart';
import { formatSql } from '@/utils';
import { LinkOutlined, ReadOutlined, SyncOutlined } from '@ant-design/icons';
import { Datum } from '@antv/ava';
import { GPTVis, withDefaultChartCode } from '@antv/gpt-vis';
import { Image, Table, Tabs, TabsProps, Tag } from 'antd';
import React from 'react';
import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import ReferencesContent from './ReferencesContent';
import VisAppLink from './VisAppLink';
import VisChatLink from './VisChatLink';
import VisResponse from './VisResponse';
import AgentMessages from './agent-messages';
import AgentPlans from './agent-plans';
import { CodePreview } from './code-preview';
import HtmlPreview from './html-preview';
import SvgPreview from './svg-preview';
import VisChart from './vis-chart';
import VisCode from './vis-code';
import VisConvertError from './vis-convert-error';
import VisDashboard from './vis-dashboard';
import VisPlugin from './vis-plugin';
import { VisThinking } from './vis-thinking';

type MarkdownComponent = Parameters<typeof GPTVis>['0']['components'];

const customeTags: (keyof JSX.IntrinsicElements)[] = ['custom-view', 'chart-view', 'references', 'summary'];

function matchCustomeTagValues(context: string) {
  const matchValues = customeTags.reduce<string[]>((acc, tagName) => {
    // eslint-disable-next-line no-useless-escape
    const tagReg = new RegExp(`<${tagName}[^>]*\/?>`, 'gi');
    context = context.replace(tagReg, matchVal => {
      acc.push(matchVal);
      return '';
    });
    return acc;
  }, []);
  return { context, matchValues };
}
/**
 * Preprocess LaTeX syntax, convert \[ \] and \( \) to $$ $$ and $ $
 * Also handle some common edge cases
 * @param content
 */
export function preprocessLaTeX(content: any): string {
  if (typeof content !== 'string') {
    return content;
  }
  // Extract code blocks
  const codeBlocks: string[] = [];
  content = content.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, match => {
    codeBlocks.push(match);
    return `<<CODE_BLOCK_${codeBlocks.length - 1}>>`;
  });

  // Replace common LaTeX delimiters with KaTeX supported format
  content = content
    .replace(/\\\\\[/g, '$$') // Replace \\[ with $$
    .replace(/\\\\\]/g, '$$') // Replace \\] with $$
    .replace(/\\\\\(/g, '$') //  Replace \\( with $
    .replace(/\\\\\)/g, '$') //  Replace \\) with $
    .replace(/\\\[/g, '$$') //   Replace \[ with $$
    .replace(/\\\]/g, '$$') // Replace \] with $$
    .replace(/\\\(/g, '$') // Replace \( with $
    .replace(/\\\)/g, '$'); // Replaces \( with $

  // Make sure there is enough line breaks before and after the block formula
  content = content
    .replace(/([^\n])\$\$/g, '$1\n\n$$') // Add a blank line before $$
    .replace(/\$\$([^\n])/g, '$$\n\n$1'); // Add a blank line after $$

  // Handle currency symbols - escape $ that are obviously currency
  content = content.replace(/\$(?=\d)/g, '\\$');

  // Recover code blocks
  content = content.replace(/<<CODE_BLOCK_(\d+)>>/g, (_: any, index: string) => codeBlocks[parseInt(index)]);

  return content;
}

const codeComponents = {
  /**
   * @description
   * Custom code block rendering, which can be used to render custom components in the code block.
   * Is it defined in gpt-vis, and the default rendering contains `vis-chart`.
   */
  code: withDefaultChartCode({
    languageRenderers: {
      'agent-plans': ({ className, children }) => {
        const content = String(children);
        /**
         * @description
         * In some cases, tags are nested within code syntax,
         * so it is necessary to extract the tags present in the code block and render them separately.
         */
        const lang = className?.replace('language-', '') || 'javascript';
        try {
          const data = JSON.parse(content) as Parameters<typeof AgentPlans>[0]['data'];
          return <AgentPlans data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'agent-messages': ({ className, children }) => {
        const content = String(children);
        const lang = className?.replace('language-', '') || 'javascript';
        try {
          const data = JSON.parse(content) as Parameters<typeof AgentMessages>[0]['data'];
          return <AgentMessages data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'vis-convert-error': ({ className, children }) => {
        const content = String(children);
        const lang = className?.replace('language-', '') || 'javascript';
        try {
          const data = JSON.parse(content) as Parameters<typeof VisConvertError>[0]['data'];
          return <VisConvertError data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'vis-dashboard': ({ className, children }) => {
        const content = String(children);
        const lang = className?.replace('language-', '') || 'javascript';
        try {
          const data = JSON.parse(content) as Parameters<typeof VisDashboard>[0]['data'];
          return <VisDashboard data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'vis-db-chart': ({ className, children }) => {
        const content = String(children);
        const lang = className?.replace('language-', '') || 'javascript';
        try {
          const data = JSON.parse(content) as Parameters<typeof VisChart>[0]['data'];
          return <VisChart data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'vis-plugin': ({ className, children }) => {
        const content = String(children);
        const lang = className?.replace('language-', '') || 'javascript';
        try {
          const data = JSON.parse(content) as Parameters<typeof VisPlugin>[0]['data'];
          return <VisPlugin data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'vis-code': ({ className, children }) => {
        const content = String(children);
        const lang = className?.replace('language-', '') || 'javascript';

        try {
          const data = JSON.parse(content) as Parameters<typeof VisCode>[0]['data'];
          return <VisCode data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'vis-app-link': ({ className, children }) => {
        const content = String(children);
        const lang = className?.replace('language-', '') || 'javascript';
        try {
          const data = JSON.parse(content) as Parameters<typeof VisAppLink>[0]['data'];
          return <VisAppLink data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'vis-api-response': ({ className, children }) => {
        const content = String(children);
        const lang = className?.replace('language-', '') || 'javascript';
        try {
          const data = JSON.parse(content) as Parameters<typeof VisResponse>[0]['data'];
          return <VisResponse data={data} />;
        } catch {
          return <CodePreview language={lang} code={content} />;
        }
      },
      'vis-thinking': ({ className, children }) => {
        const content = String(children);
        const _lang = className?.replace('language-', '') || 'javascript';
        return <VisThinking content={content} />;
      },
      // Add HTML language processor
      html: ({ className, children }) => {
        const content = String(children);
        const _lang = className;
        return <HtmlPreview code={content} language='html' />;
      },
      // Support for Web languages that mix HTML, CSS, and JS
      web: ({ className, children }) => {
        const content = String(children);
        const _lang = className;
        return <HtmlPreview code={content} language='html' />;
      },
      svg: ({ className, children }) => {
        const content = String(children);
        const _lang = className;
        return <SvgPreview code={content} language='svg' />;
      },
      xml: ({ className, children }) => {
        const content = String(children);
        const _lang = className;
        // Check if the content is SVG
        if (content.includes('<svg') && content.includes('</svg>')) {
          return <SvgPreview code={content} language='svg' />;
        }
        // If it is not SVG, use normal XML highlighting
        return <CodePreview code={content} language='xml' />;
      },
    },
    defaultRenderer({ node, className, children, style, ...props }) {
      const content = String(children);
      const lang = className?.replace('language-', '') || '';
      const { context, matchValues } = matchCustomeTagValues(content);

      return (
        <>
          {lang ? (
            <CodePreview code={context} language={lang || 'javascript'} />
          ) : (
            <code {...props} style={style} className='p-1 mx-1 rounded bg-theme-light dark:bg-theme-dark text-sm'>
              {children}
            </code>
          )}
          <GPTVis
            components={markdownComponents}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            remarkPlugins={[remarkGfm, remarkMath]}
          >
            {matchValues.join('\n')}
          </GPTVis>
        </>
      );
    },
  }),
};

const basicComponents: MarkdownComponent = {
  ...codeComponents,
  p({ children }) {
    // Check if children contains block-level elements or chart-view components
    const childrenArray = React.Children.toArray(children);
    const hasBlockElements = childrenArray.some(child => {
      if (React.isValidElement(child)) {
        // Check for div elements or React components
        return child.type === 'div' || 
               (typeof child.type === 'function') ||
               (typeof child.type === 'object' && child.type !== null);
      }
      return false;
    });
    
    // Check if any child is a string that contains chart-view or other block elements
    const hasChartView = childrenArray.some(child => 
      typeof child === 'string' && child.includes('<chart-view')
    );
    
    // If it contains block elements or chart-view, return fragment to avoid p > div nesting
    if (hasBlockElements || hasChartView) {
      return <div>{children}</div>;
    }
    
    // Otherwise, return normal paragraph
    return <p>{children}</p>;
  },
  ul({ children }) {
    return <ul className='py-1'>{children}</ul>;
  },
  ol({ children }) {
    return <ol className='py-1'>{children}</ol>;
  },
  li({ children, ordered, ...props }: any) {
    return (
      <li
        className={`text-sm leading-7 ml-5 pl-2 text-gray-600 dark:text-gray-300 ${
          ordered ? 'list-decimal' : 'list-disc'
        }`}
      >
        {children}
      </li>
    );
  },
  table({ children }) {
    return (
      <div className='my-4 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 inline-block'>
        <table className='bg-white dark:bg-gray-800 text-sm'>
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className='bg-gray-50 dark:bg-gray-900 font-semibold'>{children}</thead>;
  },
  th({ children }) {
    return <th className='!text-left px-4 py-3 text-gray-700 dark:text-gray-300 font-medium'>{children}</th>;
  },
  td({ children }) {
    return <td className='px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200'>{children}</td>;
  },
  h1({ children }) {
    return <h3 className='text-2xl font-bold my-4 border-b border-slate-300 pb-4'>{children}</h3>;
  },
  h2({ children }) {
    return <h3 className='text-xl font-bold my-3'>{children}</h3>;
  },
  h3({ children }) {
    return <h3 className='text-lg font-semibold my-2'>{children}</h3>;
  },
  h4({ children }) {
    return <h3 className='text-base font-semibold my-1'>{children}</h3>;
  },
  a({ children, href }) {
    return (
      <div className='inline-block text-black-600 dark:text-black-400'>
        <LinkOutlined className='mr-1' />
        <a href={href} target='_blank' rel='noreferrer'>
          {children}
        </a>
      </div>
    );
  },
  img({ src, alt }) {
    return (
      <div>
        <Image
          className='min-h-[1rem] max-w-full max-h-full border rounded'
          src={src}
          alt={alt}
          placeholder={
            <Tag icon={<SyncOutlined spin />} color='processing'>
              Image Loading...
            </Tag>
          }
          fallback='/pictures/fallback.png'
        />
      </div>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className='py-4 px-6 border-l-4 border-blue-600 rounded bg-white my-2 text-gray-500 dark:bg-slate-800 dark:text-gray-200 dark:border-white shadow-sm'>
        {children}
      </blockquote>
    );
  },
  button({ children, className, ...restProps }) {
    if (className === 'chat-link') {
      const msg = (restProps as any)?.['data-msg'];
      return <VisChatLink msg={msg}>{children}</VisChatLink>;
    }
    return (
      <button className={className} {...restProps}>
        {children}
      </button>
    );
  },
};

const returnSqlVal = (val: string) => {
  const punctuationMap: any = {
    '，': ',',
    '。': '.',
    '？': '?',
    '！': '!',
    '：': ':',
    '；': ';',
    '“': '"',
    '”': '"',
    '‘': "'",
    '’': "'",
    '（': '(',
    '）': ')',
    '【': '[',
    '】': ']',
    '《': '<',
    '》': '>',
    '—': '-',
    '、': ',',
    '…': '...',
  };
  const regex = new RegExp(Object.keys(punctuationMap).join('|'), 'g');
  return val.replace(regex, match => punctuationMap[match]);
};

const extraComponents: MarkdownComponent = {
  'chart-view': function ({ content, children }) {
    let data: {
      data: Datum[];
      type: BackEndChartType;
      sql: string;
    };
    try {
      data = JSON.parse(content as string);
    } catch (e) {
      console.log(e, content);
      data = {
        type: 'response_table',
        sql: '',
        data: [],
      };
    }

    const columns = data?.data?.[0]
      ? Object.keys(data?.data?.[0])?.map((item, index, array) => {
          // Calculate width based on content length and distribute evenly
          const minWidth = 120;
          const maxWidth = 300;
          const contentLength = Math.max(
            item.length,
            ...data.data.map(row => String(row[item] || '').length)
          );
          const calculatedWidth = Math.min(maxWidth, Math.max(minWidth, contentLength * 8));
          
          return {
            title: item,
            dataIndex: item,
            key: item,
            width: calculatedWidth,
            ellipsis: {
              showTitle: false,
            },
            render: (text: any) => (
              <div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {String(text || '')}
              </div>
            ),
          };
        })
      : [];

    const ChartItem = {
      key: 'chart',
      label: 'Chart',
      children: <AutoChart data={data?.data} chartType={getChartType(data?.type)} />,
    };
    const SqlItem = {
      key: 'sql',
      label: 'SQL',
      children: <CodePreview code={formatSql(returnSqlVal(data?.sql), 'mysql') as string} language={'sql'} />,
    };
    const DataItem = {
      key: 'data',
      label: 'Data',
      children: <Table 
        dataSource={data?.data} 
        columns={columns} 
        scroll={{ x: 'max-content' }} 
        virtual={false}
        rowKey={(record) => JSON.stringify(record)}
        size="small"
        tableLayout="fixed"
        style={{ width: '100%' }}
      />,
    };
    const TabItems: TabsProps['items'] =
      data?.type === 'response_table' ? [DataItem, SqlItem] : [ChartItem, SqlItem, DataItem];

    return (
      <div className='overflow-x-auto'>
        <Tabs defaultActiveKey={data?.type === 'response_table' ? 'data' : 'chart'} items={TabItems} size='small' />
        {children}
      </div>
    );
  },
  references: function ({ children }) {
    if (children) {
      try {
        const referenceData = JSON.parse(children as string);
        const references = referenceData.references;
        return <ReferencesContent references={references} />;
      } catch {
        return null;
      }
    }
  },
  summary: function ({ children }) {
    return (
      <div>
        <p className='mb-2'>
          <ReadOutlined className='mr-2' />
          <span className='font-semibold'>Document Summary</span>
        </p>
        <div>{children}</div>
      </div>
    );
  },
};

const markdownComponents = {
  ...basicComponents,
  ...extraComponents,
};

export const markdownPlugins = {
  remarkPlugins: [remarkGfm, [remarkMath, { singleDollarTextMath: true }]],
  rehypePlugins: [rehypeRaw, [rehypeKatex, { output: 'htmlAndMathml' }]],
};
export default markdownComponents;
