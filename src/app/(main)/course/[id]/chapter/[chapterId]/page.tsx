import { db } from "@/db";
import { Chapter } from "@/features/chapter/chapter";
import { Course } from "@prisma/client";

type Props = {
  params: Promise<{ id: string; chapterId: string }>;
};

const ChapterPage = async ({ params }: Props) => {
  const { id, chapterId } = await params;

  const data = await db.course.findUnique({
    where: { id },
    include: { chapters: true },
  });

  if (!data) {
    throw new Error(`Course with id ${id} not found`);
  }

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
  });

  if (!chapter) {
    throw new Error(`Chapter with id ${chapterId} not found`);
  }

  if (!chapter.completed) {
    await db.chapter.update({
      where: { id: chapterId },
      data: { completed: true },
    });
  }

  return <Chapter data={data as Course} chapter={chapter} />;
};

export default ChapterPage;
