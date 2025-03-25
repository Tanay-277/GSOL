import { BlurFade } from "@/components/ui/blur";
import { H3, P } from "@/components/ui/typography";
import { db } from "@/db";
import FlashCard from "@/features/course/flash-card";

type Props = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
  const { id } = await params;

  const flashCards = await db.flashcard.findMany({
    where: { courseId: id },
  });

  const course = await db.course.findUnique({
    where: { id },
    include: { chapters: true },
  });

  return (
    <BlurFade inView>
      <section className="mx-auto max-w-6xl py-8 pt-4 md:px-4 md:pb-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col space-y-2 text-left">
            <H3 className="text-2xl font-bold tracking-tight md:text-3xl">
              Flashcards
            </H3>
            <P className="text-muted-foreground">
              Your personalized and generated flashcards for {course?.name}.
            </P>
          </div>

          {flashCards.length > 0 ? (
            <div className="grid gap-6 pt-6 md:grid-cols-2 lg:grid-cols-3">
              <FlashCard data={flashCards} />
            </div>
          ) : (
            <div className="py-8 text-center text-red-600">
              No flashcards found for this course.
            </div>
          )}
        </div>
      </section>
    </BlurFade>
  );
};

export default Page;
