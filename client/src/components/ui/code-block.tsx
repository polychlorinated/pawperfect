import React from "react";
import { Copy } from "lucide-react";
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  language: string;
  code: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ language, code, showLineNumbers = false }: CodeBlockProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
      duration: 3000,
    });
  };

  return (
    <div className="relative rounded-md bg-zinc-950 text-zinc-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <pre
        className={`p-4 overflow-x-auto text-sm ${showLineNumbers ? "line-numbers" : ""}`}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}