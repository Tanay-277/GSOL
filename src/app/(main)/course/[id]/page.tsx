import { CoursePage } from "@/features/course/course";
import React from "react";

type Props = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
  const { id } = await params;
  return <CoursePage id={id} />;
};

export default Page;
