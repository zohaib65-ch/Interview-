import { Suspense } from "react";

import { ScenarioQuestionsClient } from "@/components/scenario-questions-client";

export const metadata = {
  title: "Scenario Questions | PrepForge",
  description: "Scenario-based technical interview questions and real-world resolutions.",
};

export default function ScenarioQuestionsPage() {
  return (
    <Suspense fallback={null}>
      <ScenarioQuestionsClient />
    </Suspense>
  );
}
