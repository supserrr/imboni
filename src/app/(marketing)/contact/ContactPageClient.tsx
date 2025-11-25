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
 * Contact page client component
 * Displays contact information and support options
 */
export function ContactPageClient() {
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
              Contact Us
            </h1>

            <div className="space-y-8 font-mono text-sm md:text-base leading-relaxed">
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="border p-8 md:p-12 text-center"
                >
                  <p className="text-2xl md:text-4xl font-mono text-foreground mb-8">
                    We're here for you. Reach out with any questions or support you need. Our team is ready to help you every step of the way.
                  </p>
                  <div className="mt-8">
                    <p className="text-muted-foreground mb-4">
                      For support, questions, or feedback, please use the support channels available in the application.
                    </p>
                    <p className="text-muted-foreground">
                      This platform was created by Shima Serein for summative assessment purposes.
                    </p>
                  </div>
                </motion.div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Get Support</h2>
                <p className="mb-4">
                  If you need assistance with Imboni, have questions about features, or want to provide feedback, we're here to help.
                </p>
                <p className="mb-4">
                  Support is available through the application's built-in support channels. Our team is committed to ensuring you have the best possible experience with Imboni.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Feedback</h2>
                <p className="mb-4">
                  Your feedback helps us improve Imboni. If you have suggestions, feature requests, or encounter any issues, please don't hesitate to reach out.
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

