"use client";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Simple markdown parser for common patterns
  const parseMarkdown = (text: string) => {
    // Split into lines for processing
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = (index: number) => {
      if (currentList.length > 0) {
        elements.push(
          listType === "ol" ? (
            <ol
              key={`list-${index}`}
              className="list-decimal list-inside space-y-1 my-3 ml-4"
            >
              {currentList.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
          ) : (
            <ul
              key={`list-${index}`}
              className="list-disc list-inside space-y-1 my-3 ml-4"
            >
              {currentList.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          )
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith("# ")) {
        flushList(index);
        elements.push(
          <h1 key={index} className="text-2xl font-bold mt-6 mb-3">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        flushList(index);
        elements.push(
          <h2 key={index} className="text-xl font-semibold mt-5 mb-2">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        flushList(index);
        elements.push(
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2">
            {line.slice(4)}
          </h3>
        );
      }
      // Horizontal rule
      else if (line.trim() === "---") {
        flushList(index);
        elements.push(<hr key={index} className="my-4 border-border" />);
      }
      // Unordered list
      else if (line.match(/^[\-\*]\s/)) {
        if (listType !== "ul") {
          flushList(index);
          listType = "ul";
        }
        currentList.push(line.slice(2).trim());
      }
      // Ordered list
      else if (line.match(/^\d+\.\s/)) {
        if (listType !== "ol") {
          flushList(index);
          listType = "ol";
        }
        currentList.push(line.replace(/^\d+\.\s/, "").trim());
      }
      // Regular paragraph
      else if (line.trim()) {
        flushList(index);
        // Process inline formatting
        const formatted = formatInline(line);
        elements.push(
          <p key={index} className="mb-3 leading-relaxed">
            {formatted}
          </p>
        );
      }
      // Empty line
      else {
        flushList(index);
      }
    });

    flushList(lines.length);
    return elements;
  };

  const formatInline = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let currentText = text;
    let key = 0;

    // Bold: **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(currentText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(currentText.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < currentText.length) {
      parts.push(currentText.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <div className="markdown-content">{parseMarkdown(content)}</div>;
}
