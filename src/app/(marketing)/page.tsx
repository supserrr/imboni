"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { MynaHero } from "@/components/ui/myna-hero";
import { FlickeringFooter } from "@/components/ui/flickering-footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MynaHero />

      {/* Support Section */}
      <section className="pt-8 md:pt-12 pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl border p-8 md:p-12 text-center">
            <p className="text-2xl md:text-4xl font-mono text-foreground">
              We're here for you. Reach out with any questions or support you need. Our team is ready to help you every step of the way.
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
      <FlickeringFooter />
    </div>
  );
}

