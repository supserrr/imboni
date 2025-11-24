"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart,
  Eye,
  Heart,
  Menu,
  Plug,
  Sparkles,
  Zap,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { motion, useAnimation, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const navigationItems = [
  { title: "HOME", href: "/" },
  { title: "ABOUT", href: "#about" },
  { title: "CONTACT", href: "#contact" },
];

const labels = [
  { icon: Sparkles, label: "Live Video Analysis" },
  { icon: Plug, label: "Object Detection" },
  { icon: Activity, label: "AI-Powered Insights" },
];

const features = [
  {
    icon: Eye,
    label: "Object Detection",
    description:
      "Identify objects, people, text, and scenes to help you understand your environment with clarity.",
  },
  {
    icon: Sparkles,
    label: "Smart Triggers",
    description:
      "Set up personalized triggers that alert you to important moments, gestures, or events when you need them most.",
  },
  {
    icon: Heart,
    label: "Accessible Design",
    description:
      "Built with your needs in mind, supporting screen readers, keyboard navigation, and your preferred way of interacting.",
  },
];

/**
 * Myna Hero component adapted for Imboni - A modern, animated hero section
 * with navigation, animated title, feature highlights, and call-to-action buttons.
 */
export function MynaHero() {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [canAnimateFeatures, setCanAnimateFeatures] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        y: 0,
      });
    }
  }, [controls, isInView]);

  // Wait for hero animations to complete (last animation at 2.4s + 0.6s duration = 3.0s)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCanAnimateFeatures(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const titleWords = [
    "ADVANCED",
    "AI",
    "VISION",
    "FOR",
    "EVERYONE",
  ];

  return (
    <div className="container mx-auto px-4 min-h-screen bg-background">
      <header className="pt-6 md:pt-9">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="text-sm font-mono text-foreground hover:text-primary transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              asChild
              variant="default"
              className="rounded-none hidden md:inline-flex font-mono"
            >
              <Link href="/signup">
                GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
            {mounted && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Mobile navigation menu with links to different sections
                  </SheetDescription>
                  <nav className="flex flex-col gap-6 mt-6">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="text-sm font-mono text-foreground hover:text-primary transition-colors"
                      >
                        {item.title}
                      </Link>
                    ))}
                    <Button
                      asChild
                      className="cursor-pointer rounded-none font-mono"
                    >
                      <Link href="/signup">
                        GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
                      </Link>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            )}
            {!mounted && (
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="container pt-24 pb-8">
          <div className="flex flex-col items-center text-center">
            <motion.h1
              initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative font-mono text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto leading-tight"
            >
              {titleWords.map((text, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.15,
                    duration: 0.6,
                  }}
                  className="inline-block mx-2 md:mx-4"
                >
                  {text}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mx-auto mt-8 max-w-2xl text-xl text-foreground font-mono"
            >
              We empower blind and low vision users with cutting-edge AI technology to transform visual surroundings into clear, helpful descriptions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="mt-12 flex flex-wrap justify-center gap-6"
            >
              {labels.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1.8 + index * 0.15,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                  className="flex items-center gap-2 px-6"
                >
                  <feature.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-mono">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 2.4,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
            >
              <Button asChild size="lg" className="cursor-pointer rounded-none mt-8 font-mono">
                <Link href="/signup">
                  GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="container pt-8 pb-8 md:pb-12" ref={ref} id="features">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView && canAnimateFeatures ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              delay: 0.2,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 10,
            }}
            className="text-center text-4xl font-mono font-bold mb-12"
          >
            Your AI Companion
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView && canAnimateFeatures ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid md:grid-cols-3 max-w-6xl mx-auto gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView && canAnimateFeatures ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{
                  delay: 0.4 + index * 0.2,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                }}
                className="flex flex-col items-center text-center p-8 bg-background border"
              >
                <div className="mb-6 rounded-full bg-primary/10 p-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-xl font-mono font-bold">
                  {feature.label}
                </h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
    </div>
  );
}

