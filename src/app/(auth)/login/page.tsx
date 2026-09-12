import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { DemoAccounts } from "@/components/auth/demo-accounts";

export const metadata: Metadata = {
  title: "Sign in — Naano",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Naano account.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <DemoAccounts />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Naano?{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
