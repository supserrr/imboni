"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Menu } from "@/components/ui/animated-icons"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { FlickeringFooter } from "@/components/ui/flickering-footer"

const navigationItems = [
  { title: "HOME", href: "/" },
  { title: "ABOUT", href: "/about" },
  { title: "CONTACT", href: "/contact" },
]

/**
 * About page client component
 * Displays information about Imboni and its mission
 */
export function AboutPageClient() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="pt-6 md:pt-9">
        <div className="container mx-auto px-4">
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
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-mono font-bold mb-8">
              About Imboni
            </h1>

            <div className="space-y-8 font-mono text-sm md:text-base leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="mb-4">
                  Imboni is an AI-powered vision assistance platform designed to empower blind and low vision users by transforming their visual surroundings into clear, helpful descriptions in real-time.
                </p>
                <p className="mb-4">
                  Our mission is to make visual information accessible to everyone, regardless of their ability to see. We believe that technology should break down barriers and create opportunities for independence and empowerment.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">What We Do</h2>
                <p className="mb-4">
                  Built with cutting-edge artificial intelligence and machine learning technologies, Imboni provides:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>Live video analysis and real-time object detection</li>
                  <li>Audio descriptions of visual content</li>
                  <li>Customizable triggers and alerts for important moments</li>
                  <li>Text-to-speech narration with multiple voice options</li>
                  <li>Analysis history and personalized preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Technology</h2>
                <p className="mb-4">
                  Imboni leverages advanced AI models including Moondream for image and video analysis, and ElevenLabs for natural-sounding text-to-speech. Our platform is built on modern web technologies to ensure fast, reliable, and accessible experiences.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Accessibility First</h2>
                <p className="mb-4">
                  Every feature in Imboni is designed with accessibility in mind. We support screen readers, keyboard navigation, and customizable settings to ensure the platform works the way you need it to.
                </p>
              </section>

              <section>
                <p className="text-muted-foreground">
                  This platform was created by Shima Serein for summative assessment purposes.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      <FlickeringFooter />
    </div>
  )
}

