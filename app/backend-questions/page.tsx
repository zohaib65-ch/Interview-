import { Suspense } from "react";

import { BackendQuestionsClient } from "@/components/backend-questions-client";

export const metadata = {
  title: "Backend Questions | PrepForge",
  description: "Backend interview questions covering APIs, databases, authentication, system design and scalability, with detailed answers.",
};

export default function BackendQuestionsPage() {
  return (
    <Suspense fallback={null}>
      <BackendQuestionsClient />
    </Suspense>
  );
}
