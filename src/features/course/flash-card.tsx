"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flashcard } from "@prisma/client";
import { motion } from "framer-motion";
import { useState } from "react";

interface FlashCardProps {
  data: Flashcard[];
}

const FlashCard: React.FC<FlashCardProps> = ({ data }) => {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {data.map((card) => (
        <div
          key={card.id}
          className="perspective-1000 h-64 w-full cursor-pointer"
          onClick={() => toggleFlip(card.id)}
        >
          <motion.div
            className="relative h-full w-full rounded-xl border"
            style={{
              transformStyle: "preserve-3d",
            }}
            animate={{ rotateY: flipped[card.id] ? 180 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              className="absolute inset-0 rounded-xl border-none"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
              }}
            >
              <CardContent className="flex h-full items-center justify-center bg-background p-6">
                <h3 className="text-center text-xl font-semibold">{card.title}</h3>
              </CardContent>
            </Card>

            <Card
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <CardContent className="flex h-full items-center justify-center bg-background p-6">
                <p className="max-h-full overflow-y-auto text-sm">{card.content}</p>
              </CardContent>
            </Card>

            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/20" />
          </motion.div>
        </div>
      ))}
    </>
  );
};

export default FlashCard;
