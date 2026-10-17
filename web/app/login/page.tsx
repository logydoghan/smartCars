import type { Metadata } from "next";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthPage
      mode="login"
      title="Log in"
      intro="Log in to save cars you are considering and join the conversation on each car page."
      searchParams={searchParams}
    />
  );
}
