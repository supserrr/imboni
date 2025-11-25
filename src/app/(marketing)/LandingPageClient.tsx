"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { MynaHero } from "@/components/ui/myna-hero";
import { FlickeringFooter } from "@/components/ui/flickering-footer";
import { PlusIcon } from "lucide-react";

export function LandingPageClient() {
  const supportRef = React.useRef(null);
  const isSupportInView = useInView(supportRef, { once: true, amount: 0.1 });
  const [canAnimateSupport, setCanAnimateSupport] = React.useState(false);

  // Wait for feature cards to finish animating before allowing support section to animate
  // Feature cards: 3s (canAnimateFeatures) + 0.8s (last card delay) + 0.6s (duration) = 4.4s
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCanAnimateSupport(true);
    }, 4500); // Slightly after feature cards complete
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <MynaHero />

      {/* Support Section */}
      <section 
        ref={supportRef}
        className="pt-8 md:pt-12 pb-16 md:pb-24"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isSupportInView && canAnimateSupport ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 10,
            }}
            className="mx-auto max-w-6xl border p-8 md:p-12 text-center relative"
          >
            <PlusIcon className="absolute -top-3 -left-3 h-6 w-6 text-accent" />
            <PlusIcon className="absolute -top-3 -right-3 h-6 w-6 text-accent" />
            <PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6 text-accent" />
            <PlusIcon className="absolute -right-3 -bottom-3 h-6 w-6 text-accent" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isSupportInView && canAnimateSupport ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                delay: 0.2,
                duration: 0.6,
              }}
              className="text-2xl md:text-4xl font-mono text-foreground"
            >
              We're here for you. Reach out with any questions or support you need. Our team is ready to help you every step of the way.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isSupportInView && canAnimateSupport ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                delay: 0.4,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              className="mt-8 flex justify-center"
            >
              <Button
                asChild
                variant="default"
                className="rounded-none font-mono"
              >
                <Link href="/contact">GET IN TOUCH</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <FlickeringFooter />
    </div>
  );
}

