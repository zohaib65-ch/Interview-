import { CategoryGridClient } from "@/components/category-grid-client";

export const metadata = {
  title: "Frontend Questions | PrepForge",
  description: "Frontend interview questions organized by category: React, Next.js, Vue and more.",
};

export default function FrontendQuestionsPage() {
  return <CategoryGridClient bank="frontend" />;
}
