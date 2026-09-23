import { AiChatClient } from "@/components/ai-chat-client";

export const metadata = {
  title: "AI Interview Chat | PrepForge",
  description: "Chat with an AI interview coach powered by Gemini.",
};

export default function AiChatPage() {
  return <AiChatClient />;
}
