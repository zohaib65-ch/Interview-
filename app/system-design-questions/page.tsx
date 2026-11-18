import { Suspense } from "react";

import { SystemDesignQuestionsClient } from "@/components/system-design-questions-client";

export const metadata = {
  title: "System Design / Database | PrepForge",
  description: "System design and database interview questions with detailed answers.",
};

export default function SystemDesignQuestionsPage() {
  return (
    <Suspense fallback={null}>
      <SystemDesignQuestionsClient />
    </Suspense>
  );
}
