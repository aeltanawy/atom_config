import * as MathJax from "@nteract/mathjax";
import { Source } from "@nteract/presentational-components";
import React from "react";
import ReactMarkdown from "react-markdown";

import RemarkMathPlugin from "./remark-math";

const math = (props: { value: string }): React.ReactNode => (
  <MathJax.Node>{props.value}</MathJax.Node>
);

const inlineMath = (props: { value: string }): React.ReactNode => (
  <MathJax.Node inline>{props.value}</MathJax.Node>
);

const code = (props: { language: string; value: string }): React.ReactNode => (
  <Source language={props.language}>{props.value}</Source>
);

const MarkdownRender = (props: ReactMarkdown.ReactMarkdownProps) => {
  const newProps = {
    // https://github.com/rexxars/react-markdown#options
    ...props,
    escapeHtml: false,
    plugins: [RemarkMathPlugin],
    renderers: {
      ...props.renderers,
      math,
      inlineMath,
      code
    } as any
  };

  return <ReactMarkdown {...newProps} />;
};

export default MarkdownRender;
