import { redirect } from "next/navigation";

// Root path redirects to dashboard
export default function Home() {
  redirect("/dashboard");
}
