import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import rehypeHighlight from 'rehype-highlight';

interface OptimizedMarkdownProps {
  content: string;
}

const markdownComponents = {
  code: ({ children, className, ...props }: any) => {
    const isInline = !className?.includes('language-');
    if (isInline) {
      return (
        <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 border rounded text-sm" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: any) => (
    <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-lg overflow-x-auto my-4" {...props}>
      {children}
    </pre>
  ),
  p: ({ children, ...props }: any) => (
    <p className="mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),
  h1: ({ children, ...props }: any) => (
    <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside mb-2 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside mb-2 space-y-1" {...props}>
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 my-2 italic" {...props}>
      {children}
    </blockquote>
  ),
};

export const OptimizedMarkdown = React.memo<OptimizedMarkdownProps>(({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkEmoji]}
      rehypePlugins={[rehypeHighlight]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
});

OptimizedMarkdown.displayName = 'OptimizedMarkdown';
