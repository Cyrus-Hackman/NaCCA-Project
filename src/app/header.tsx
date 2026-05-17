"use client";

import { Button } from "@/components/ui/button";
import {
  OrganizationSwitcher,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const clerkAppearance = isDark ? { baseTheme: dark } : undefined;

  return (
    <div className="sticky top-0 z-50 border-b py-3 backdrop-blur-md bg-background/60">
      <div className="items-center container mx-auto justify-between flex gap-2 px-4">
        <Link href="/" className="flex gap-2 items-center text-xl font-semibold text-foreground">
          <Image src="/logo.png" width="40" height="40" alt="file drive logo" className="rounded-xl" />
          <span className="hidden sm:inline">NaCCA FileDrive</span>
        </Link>

        <SignedIn>
          <Button variant={"outline"} asChild>
            <Link href="/dashboard/files">Your Files</Link>
          </Button>
        </SignedIn>

        <div className="flex gap-2 items-center">
          <OrganizationSwitcher appearance={clerkAppearance} />
          <UserButton appearance={clerkAppearance} />
          <ModeToggle />
          <SignedOut>
            <SignInButton>
              <Button>Sign In</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
