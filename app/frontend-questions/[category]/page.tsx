import { Suspense } from "react";

import { FrontendQuestionsClient } from "@/components/frontend-questions-client";

export const metadata = {
  title: "Frontend Questions | PrepForge",
  description: "Frontend interview questions with detailed answers.",
};

type FrontendCategoryPageProps = {
  params: Promise<{ category: string }>;
};

export default async function FrontendCategoryPage({ params }: FrontendCategoryPageProps) {
  const { category } = await params;

  // `key` remounts the client when moving between categories, so no state leaks from the previous one.
  return (
    <Suspense fallback={null}>
      <FrontendQuestionsClient key={category} categorySlug={category} />
    </Suspense>
  );
}
