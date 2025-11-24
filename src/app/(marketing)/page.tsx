"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { MynaHero } from "@/components/ui/myna-hero";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MynaHero />

      {/* Support Section */}
      <section className="pt-8 md:pt-12 pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl border p-8 md:p-12 text-center">
            <p className="text-2xl md:text-4xl font-mono text-foreground">
              Reach out with questions or any support you need. Our team is ready to help
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                asChild
                variant="default"
                className="rounded-none font-mono"
              >
                <Link href="#support">GET IN TOUCH</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Logo variant="full" className="h-6 w-auto opacity-60" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Imboni. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

