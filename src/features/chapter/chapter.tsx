"use client";

import { BlurFade } from "@/components/ui/blur";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { H3, P } from "@/components/ui/typography";
import { Chapter as ChapterPrisma, Course } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Play } from "lucide-react";
import { getRecommendation } from "./action/get-video-recommendation";
import Image from "next/image";

type Props = {
  data: Course;
  chapter: ChapterPrisma;
};

interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  videoUrl: string;
}

export const Chapter = ({ data, chapter }: Props) => {
  const { data: result, isLoading } = useQuery<VideoData[]>({
    queryKey: ["chapter-data", data.id],
    queryFn: () =>
      getRecommendation(
        `${chapter.name} ${chapter.topic} ${chapter.level}  ${chapter.description}`,
      ),
  });

  return (
    <BlurFade inView>
      <section className="mx-auto max-w-6xl py-8 pt-4 md:px-4 md:pb-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col space-y-2 text-left">
            <H3 className="text-2xl font-bold tracking-tight md:text-3xl">{chapter.name}</H3>
            <P className="text-muted-foreground">{chapter.description}</P>
          </div>

          {isLoading ? (
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
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result?.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative">
                    <Image
                      src={video.thumbnail}
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
                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="h-6 w-6 fill-current" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-2 text-base">
                      <span className="line-clamp-2">{video.title}</span>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 shrink-0"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{video.channelTitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <P className="line-clamp-2 text-sm text-muted-foreground">
                      {video.description}
                    </P>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </BlurFade>
  );
};
