import type { Metadata } from "next";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthPage
      mode="signup"
      title="Create an account"
      intro="A free account lets you save cars you are considering and share what owning one is like."
      searchParams={searchParams}
    />
  );
}
