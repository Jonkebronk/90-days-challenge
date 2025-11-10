'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

type MDXPreviewProps = {
  content: string
}

export function MDXPreview({ content }: MDXPreviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="text-muted-foreground">Laddar förhandsgranskning...</div>
  }

  return (
    <div className="bg-white text-black p-6 rounded-lg prose prose-sm max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-3xl font-bold mb-4 text-black" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-2xl font-bold mb-3 text-black" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-xl font-bold mb-2 text-black" {...props} />
          ),
          p: ({ ...props }) => <p className="mb-4 text-black" {...props} />,
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside mb-4 text-black" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside mb-4 text-black" {...props} />
          ),
          li: ({ ...props }) => <li className="mb-1 text-black" {...props} />,
          code: ({ ...props }) => (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm text-black" {...props} />
          ),
          pre: ({ ...props }) => (
            <pre className="bg-gray-100 p-3 rounded mb-4 overflow-x-auto text-black" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 italic mb-4 text-black"
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a className="text-blue-600 hover:underline" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
