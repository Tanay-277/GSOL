"use client";

import { FlashcardViewer } from "@/components/flashcard-viewer";
import { GenerateFlashcardsButton } from "@/components/generate-flashcards-button";
import { BlurFade } from "@/components/ui/blur";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { H3, P } from "@/components/ui/typography";
import { ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Video {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnail?: string;
  videoUrl?: string;
}

interface Flashcard {
  id: string;
  title: string;
  content: string;
}

interface CourseContentProps {
  course: {
    id: string;
    name: string;
    description: string;
    topic: string;
    level: string;
    duration?: string | null;
    flashcards: Flashcard[];
  };
  videos: Video[];
}

export function CourseContent({ course, videos }: CourseContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("videos");

  const handleFlashcardsGenerated = () => {
    // Refresh the page to show the new flashcards
    router.refresh();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <H3 className="text-2xl font-bold tracking-tight md:text-3xl">{course.name}</H3>
        <P className="mt-2 text-muted-foreground">{course.description}</P>
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800">
            {course.level}
          </span>
          {course.duration && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-sm text-green-800">
              {course.duration}
            </span>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
        </TabsList> */}

        <TabsContent value="videos" className="mt-6">
          <BlurFade inView>
            <div className="flex flex-col gap-8">
              {/* <div className="flex flex-col space-y-2 text-left">
                <H3 className="text-xl font-bold tracking-tight">Educational Videos</H3>
                <P className="text-muted-foreground">Learn more about {course.topic}</P>
              </div> */}

              {videos && videos.length > 0 ? (
                <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <Card key={video.id} className="overflow-hidden">
                      <div className="relative">
                        <Image
                          src={
                            video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
                          }
                          alt={video.title}
                          className="h-48 w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            asChild
                          >
                            <a
                              href={video.videoUrl || `https://www.youtube.com/watch?v=${video.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Play className="h-6 w-6 fill-current" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between gap-2 text-base">
                          <span className="line-clamp-2">{video.title}</span>
                          <a
                            href={video.videoUrl || `https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 shrink-0"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {video.channelTitle}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <P className="line-clamp-2 text-sm text-muted-foreground">
                          {video.description}
                        </P>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-48 rounded-none" />
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </BlurFade>
        </TabsContent>

        <TabsContent value="flashcards" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Flashcards</CardTitle>
              <CardDescription>Test your knowledge with these flashcards</CardDescription>
            </CardHeader>
            <CardContent>
              {course.flashcards && course.flashcards.length > 0 ? (
                <FlashcardViewer flashcards={course.flashcards} />
              ) : (
                <div className="py-6 text-center">
                  <P className="mb-4 text-muted-foreground">
                    No flashcards available for this course yet.
                  </P>
                  <GenerateFlashcardsButton
                    courseId={course.id}
                    topic={course.topic}
                    onFlashcardsGenerated={handleFlashcardsGenerated}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
