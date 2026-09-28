"use client";

import type { Message } from "../types";

type MessageBubbleProps = {
  message: Message;
};

function markdownToHtml(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <article className={`chat-message ${isUser ? "user-message" : "assistant-message"}`}>
      <span className="message-role">{isUser ? "You" : "CodeReview AI"}</span>
      <div className="message-bubble" dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }} />
    </article>
  );
}
