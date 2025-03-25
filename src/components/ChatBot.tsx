"use client";

import { Send, X } from "@mynaui/icons-react";
import { Bot } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChatbot = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (userInput.trim() === "") return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: userInput, sender: "User" },
    ]);
    setUserInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInput }),
      });

      const data = await response.json();
      const botResponse =
        data.generatedText || "Sorry, I couldn't generate content.";
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: botResponse, sender: "Bot" },
      ]);
    } catch (error) {
      console.error("Error generating content:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Sorry, something went wrong.", sender: "Bot" },
      ]);
    }

    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute bottom-16 right-0 h-[32rem] w-96 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
          >
            <motion.div
              className="flex h-full flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <motion.div
                className="flex items-center justify-between bg-indigo-600 p-4"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
              >
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="rounded-full bg-white p-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Bot className="text-xl text-indigo-600" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-white">
                    AI Assistant
                  </h2>
                </div>
                <motion.button
                  onClick={toggleChatbot}
                  className="text-white transition-colors hover:text-gray-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="text-2xl" />
                </motion.button>
              </motion.div>

              <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.sender === "User" ? "justify-end" : "justify-start"}`}
                    >
                      <motion.div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "User"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {message.text}
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              <motion.div
                className="border-t border-gray-200 p-4"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
              >
                <div className="flex items-center overflow-hidden rounded-full bg-gray-100 shadow-inner">
                  <motion.input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent p-3 text-gray-800 focus:outline-none"
                    initial={{ width: "80%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    className="rounded-full bg-indigo-600 p-3 text-white transition-colors hover:bg-indigo-700"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Send className="text-xl" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChatbot}
        className="rounded-full bg-indigo-600 p-4 text-white shadow-lg transition-colors hover:bg-indigo-700"
      >
        <Bot className="text-2xl" />
      </motion.button>
    </div>
  );
};

const TypingIndicator = () => (
  <motion.div
    className="flex items-center space-x-2"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="h-2 w-2 rounded-full bg-gray-400"
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        repeatType: "loop",
        delay: 0,
      }}
    />
    <motion.div
      className="h-2 w-2 rounded-full bg-gray-400"
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        repeatType: "loop",
        delay: 0.2,
      }}
    />
    <motion.div
      className="h-2 w-2 rounded-full bg-gray-400"
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        repeatType: "loop",
        delay: 0.4,
      }}
    />
  </motion.div>
);

export default Chatbot;
