import { Suspense } from "react";

import { FrontendQuestionsClient } from "@/components/frontend-questions-client";

export const metadata = {
  title: "Frontend Questions | PrepForge",
  description: "Frontend interview questions covering HTML, CSS, JavaScript, React and browsers, with detailed answers.",
};

export default function FrontendQuestionsPage() {
  return (
    <Suspense fallback={null}>
      <FrontendQuestionsClient />
    </Suspense>
  );
}
