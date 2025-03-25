import { QuizPage } from "@/features/quiz/quiz";

type Props = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
  const { id } = await params;

  return <QuizPage id={id} />;
};

export default Page;
