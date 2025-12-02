'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MDXPreviewProps = {
  content: string
  theme?: 'light' | 'dark'
}

export function MDXPreview({ content, theme = 'light' }: MDXPreviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="text-muted-foreground">Laddar förhandsgranskning...</div>
  }

  const isDark = theme === 'dark'

  return (
    <div className={`${isDark ? 'bg-transparent text-gray-200' : 'bg-white text-black'} p-6 rounded-lg prose prose-sm max-w-none`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-amber-500' : 'text-black'}`} {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-amber-500' : 'text-black'}`} {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-amber-500' : 'text-black'}`} {...props} />
          ),
          p: ({ ...props }) => <p className={`mb-4 ${isDark ? 'text-gray-200' : 'text-black'}`} {...props} />,
          ul: ({ ...props }) => (
            <ul className={`list-disc list-inside mb-4 ${isDark ? 'text-gray-200' : 'text-black'}`} {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className={`list-decimal list-inside mb-4 ${isDark ? 'text-gray-200' : 'text-black'}`} {...props} />
          ),
          li: ({ ...props }) => <li className={`mb-1 ${isDark ? 'text-gray-200' : 'text-black'}`} {...props} />,
          code: ({ ...props }) => (
            <code className={`${isDark ? 'bg-gray-800 text-amber-300' : 'bg-gray-100 text-black'} px-1 py-0.5 rounded text-sm`} {...props} />
          ),
          pre: ({ ...props }) => (
            <pre className={`${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-black'} p-3 rounded mb-4 overflow-x-auto`} {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className={`border-l-4 ${isDark ? 'border-amber-500 text-gray-300' : 'border-gray-300 text-black'} pl-4 italic mb-4`}
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a className={`${isDark ? 'text-amber-500' : 'text-blue-600'} hover:underline`} {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className={`min-w-full border-collapse ${isDark ? 'border-gray-600' : 'border-gray-300'}`} {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} {...props} />
          ),
          tbody: ({ ...props }) => (
            <tbody className={`${isDark ? 'divide-y divide-gray-600' : 'divide-y divide-gray-200'}`} {...props} />
          ),
          tr: ({ ...props }) => (
            <tr className={`${isDark ? 'border-gray-600' : 'border-gray-200'}`} {...props} />
          ),
          th: ({ ...props }) => (
            <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-amber-500 border border-gray-600' : 'text-gray-900 border border-gray-300'}`} {...props} />
          ),
          td: ({ ...props }) => (
            <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-200 border border-gray-600' : 'text-gray-700 border border-gray-300'}`} {...props} />
          ),
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt || ''}
              className="max-w-full h-auto rounded-lg my-4 mx-auto shadow-md"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
