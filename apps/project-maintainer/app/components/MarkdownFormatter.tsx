// npm install react-markdown rehype-raw remark-gfm rehype-sanitize
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import React from "react";

interface ProductionMarkdownFormatterProps {
    body: string;
    className?: string;
}

const MarkdownFormatter = ({ body, className = "" }: ProductionMarkdownFormatterProps) => {

    const customComponents = {
        h1: ({ children }: React.ComponentPropsWithoutRef<"h1">) => (
            <h1 className="text-2xl font-bold text-light-100 mb-4 mt-6">
                {children}
            </h1>
        ),
        h2: ({ children }: React.ComponentPropsWithoutRef<"h2">) => (
            <h2 className="text-xl font-bold text-light-100 mb-3 mt-6">
                {children}
            </h2>
        ),
        h3: ({ children }: React.ComponentPropsWithoutRef<"h3">) => (
            <h3 className="text-lg font-semibold text-light-100 mb-2 mt-4">
                {children}
            </h3>
        ),
        p: ({ children }: React.ComponentPropsWithoutRef<"p">) => (
            <p className="mb-3 text-light-100 leading-relaxed">
                {children}
            </p>
        ),
        ul: ({ children }: React.ComponentPropsWithoutRef<"ul">) => (
            <ul className="list-disc list-inside space-y-1 mb-4 text-light-100 ml-4">
                {children}
            </ul>
        ),
        ol: ({ children }: React.ComponentPropsWithoutRef<"ol">) => (
            <ol className="list-decimal list-inside space-y-1 mb-4 text-light-100 ml-4">
                {children}
            </ol>
        ),
        li: ({ children }: React.ComponentPropsWithoutRef<"li">) => (
            <li className="mb-1">
                {children}
            </li>
        ),
        strong: ({ children }: React.ComponentPropsWithoutRef<"strong">) => (
            <strong className="font-bold text-light-100">
                {children}
            </strong>
        ),
        em: ({ children }: React.ComponentPropsWithoutRef<"em">) => (
            <em className="italic">
                {children}
            </em>
        ),
        code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && props.inline;
            return isInline ? (
                <code className="bg-dark-300 text-light-100 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                </code>
            ) : (
                <pre className="bg-dark-300 p-4 rounded-lg overflow-x-auto mb-4">
                    <code className="text-light-100 text-sm font-mono">
                        {children}
                    </code>
                </pre>
            );
        },
        a: ({ href, children }: React.ComponentPropsWithoutRef<"a">) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-light-200 underline transition-colors duration-200"
            >
                {children}
            </a>
        ),
        blockquote: ({ children }: React.ComponentPropsWithoutRef<"blockquote">) => (
            <blockquote className="border-l-4 border-primary-400 pl-4 py-2 mb-4 bg-dark-300 rounded-r">
                <div className="text-light-100">
                    {children}
                </div>
            </blockquote>
        )
    };

    return (
        <div className={`prose prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                components={customComponents}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
                {body}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownFormatter;
