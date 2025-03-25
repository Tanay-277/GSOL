"use client";

import { usePathname } from "next/navigation";
import Chatbot from "@/components/ChatBot";

export default function ClientChatbot() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <Chatbot />;
}
