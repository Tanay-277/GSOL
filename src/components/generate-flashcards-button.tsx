"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GenerateFlashcardsButtonProps {
  courseId: string;
  topic: string;
  onFlashcardsGenerated?: () => void;
}

export function GenerateFlashcardsButton({
  courseId,
  topic,
  onFlashcardsGenerated,
}: GenerateFlashcardsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const generateFlashcards = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId, topic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate flashcards");
      }

      const data = await response.json();

      toast.success(`Generated ${data.flashcards.length} flashcards successfully!`);

      if (onFlashcardsGenerated) {
        onFlashcardsGenerated();
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate flashcards");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={generateFlashcards}
      disabled={isLoading}
      className="flex items-center gap-1"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        "Generate Flashcards"
      )}
    </Button>
  );
}
