"use client";

import { motion } from "framer-motion";
import { useMemo, useEffect, useState } from "react";
import { FlipWords } from "../ui/flip-words";
import { customAuthClient } from "../../lib/auth/client-custom";

function getGreetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

// Translation function for greeting messages
function getGreetingMessage(key: string, name?: string) {
  const messages: Record<string, string> = {
    goodMorning: name ? `Good morning, ${name}` : "Good morning",
    goodAfternoon: name ? `Good afternoon, ${name}` : "Good afternoon", 
    goodEvening: name ? `Good evening, ${name}` : "Good evening",
    niceToSeeYouAgain: name ? `Nice to see you again, ${name}` : "Nice to see you again",
    whatAreYouWorkingOnToday: name ? `What are you working on today? ${name}` : "What are you working on today?",
    letMeKnowWhenYoureReadyToBegin: "Let me know when you're ready to begin.",
    whatAreYourThoughtsToday: "What are your thoughts today?",
    whereWouldYouLikeToStart: "Where would you like to start?",
    whatAreYouThinking: name ? `What are you thinking? ${name}` : "What are you thinking?",
  };
  return messages[key] || key;
}

export const ChatGreeting = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const getSessionData = async () => {
      try {
        const session = await customAuthClient.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      }
    };
    
    getSessionData();
  }, []);

  const word = useMemo(() => {
    if (!user?.name) return "";
    
    const words = [
      getGreetingMessage(getGreetingByTime(), user.name),
      getGreetingMessage("niceToSeeYouAgain", user.name),
      getGreetingMessage("whatAreYouWorkingOnToday", user.name),
      getGreetingMessage("letMeKnowWhenYoureReadyToBegin"),
      getGreetingMessage("whatAreYourThoughtsToday"),
      getGreetingMessage("whereWouldYouLikeToStart"),
      getGreetingMessage("whatAreYouThinking", user.name),
    ];
    return words[Math.floor(Math.random() * words.length)];
  }, [user?.name]);

  return (
    <motion.div
      key="welcome"
      className="max-w-3xl mx-auto my-4 h-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        delay: 0.2,
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-2 leading-relaxed text-center">
        <h1 className="text-2xl md:text-3xl">
          {word ? <FlipWords words={[word]} className="text-gray-700 dark:text-gray-300" /> : ""}
        </h1>
      </div>
    </motion.div>
  );
};