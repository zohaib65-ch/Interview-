import { Suspense } from "react";

import { BackendQuestionsClient } from "@/components/backend-questions-client";

export const metadata = {
  title: "Backend Questions | PrepForge",
  description: "Backend interview questions with detailed answers.",
};

type BackendCategoryPageProps = {
  params: Promise<{ category: string }>;
};

export default async function BackendCategoryPage({ params }: BackendCategoryPageProps) {
  const { category } = await params;

  // `key` remounts the client when moving between categories, so no state leaks from the previous one.
  return (
    <Suspense fallback={null}>
      <BackendQuestionsClient key={category} categorySlug={category} />
    </Suspense>
  );
}
