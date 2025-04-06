"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useState } from "react";

interface Flashcard {
  id: string;
  title: string;
  content: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-gray-500">No flashcards available.</p>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={flashcards.length <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} of {flashcards.length}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={flashcards.length <= 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="perspective-1000 relative h-64 cursor-pointer" onClick={handleFlip}>
        <div
          className={`transform-style-3d absolute h-full w-full transition-transform duration-500 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card */}
          <Card className="backface-hidden absolute h-full w-full">
            <CardContent className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <h3 className="text-xl font-medium">{currentFlashcard.title}</h3>
                <p className="mt-2 text-sm text-gray-500">Click to flip</p>
              </div>
            </CardContent>
          </Card>

          {/* Back of card */}
          <Card className="backface-hidden rotate-y-180 absolute h-full w-full">
            <CardContent className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <p className="text-lg">{currentFlashcard.content}</p>
                <p className="mt-2 text-sm text-gray-500">Click to flip back</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFlip}
          className="flex items-center gap-1"
        >
          <RotateCw className="h-4 w-4" />
          Flip Card
        </Button>
      </div>
    </div>
  );
}
