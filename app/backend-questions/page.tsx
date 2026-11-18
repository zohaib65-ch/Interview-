import { CategoryGridClient } from "@/components/category-grid-client";

export const metadata = {
  title: "Backend Questions | PrepForge",
  description: "Backend interview questions organized by category: Node.js, databases, system design and more.",
};

export default function BackendQuestionsPage() {
  return <CategoryGridClient bank="backend" />;
}
