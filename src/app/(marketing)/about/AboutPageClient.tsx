"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { 
  ArrowRight, 
  Menu, 
  Heart, 
  Sparkles, 
  Zap, 
  Globe
} from "@/components/ui/animated-icons"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { FlickeringFooter } from "@/components/ui/flickering-footer"

const navigationItems = [
  { title: "HOME", href: "/" },
  { title: "ABOUT", href: "/about" },
  { title: "CONTACT", href: "/contact" },
]

const values = [
  {
    icon: Globe,
    title: "Free for All",
    description: "Our tools and services are provided to the blind and low-vision community at no cost.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description: "Leveraging cutting-edge technology to create innovative solutions that make a real difference.",
  },
  {
    icon: Zap,
    title: "Builders & Owners",
    description: "We operate efficiently, pay attention to details, and take responsibility for everything we do.",
  },
  {
    icon: Heart,
    title: "Leading Forward",
    description: "We push boundaries and lead because the community we serve deserves the best.",
  },
  {
    icon: Sparkles,
    title: "Embrace Failure",
    description: "Mistakes are part of learning and growth. No risk means no progress.",
  },
  {
    icon: Globe,
    title: "Positive Environment",
    description: "We're serious about being kind, with laughter and fun always part of the mix.",
  },
]

/**
 * About page client component
 * Displays information about Imboni and its mission with modern, award-winning design patterns
 */
export function AboutPageClient() {
  const [mounted, setMounted] = React.useState(false)
  const missionRef = React.useRef(null)
  const valuesRef = React.useRef(null)
  const storyRef = React.useRef(null)

  const missionInView = useInView(missionRef, { once: true, amount: 0.2 })
  const valuesInView = useInView(valuesRef, { once: true, amount: 0.1 })
  const storyInView = useInView(storyRef, { once: true, amount: 0.2 })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="pt-6 md:pt-9 border-b border-border">
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
        {/* Mission Section */}
        <section ref={missionRef} className="container mx-auto px-4 pt-20 md:pt-32 pb-12 md:pb-20">
          <div className="max-w-6xl mx-auto text-center">
            <motion.h1
              initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
              animate={missionInView ? { filter: "blur(0px)", opacity: 1, y: 0 } : { filter: "blur(10px)", opacity: 0, y: 50 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl lg:text-7xl font-mono font-bold mb-12 md:mb-16 leading-tight"
            >
              Empowering people through AI technology
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={missionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-xl md:text-2xl text-muted-foreground font-mono max-w-6xl mx-auto leading-relaxed"
            >
              Our mission is to use technology as a tool for inclusion and empowerment in Africa. Through Imboni, we want to contribute to accessibility by creating a platform that gives visually impaired individuals more independence and dignity in their daily lives.
            </motion.p>
          </div>
        </section>

        {/* Values Section */}
        <section ref={valuesRef} className="container mx-auto px-4 pt-12 md:pt-16 pb-16 md:pb-24">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                delay: 0.2,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              className="text-center text-4xl font-mono font-bold mb-12"
            >
              Our Values
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={valuesInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-6"
            >
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{
                    delay: 0.4 + index * 0.1,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                  className="flex flex-col items-center text-center p-8 bg-background border"
                >
                  <div className="mb-6 rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-4 text-xl font-mono font-bold">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section ref={storyRef} className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={storyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              className="p-8 bg-background border"
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={storyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  delay: 0.2,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                }}
                className="text-3xl md:text-4xl font-mono font-bold mb-8 text-center"
              >
                The Imboni story
              </motion.h2>
              <div className="space-y-6 text-base md:text-lg leading-relaxed font-mono">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={storyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{
                    delay: 0.4,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                >
                  Imboni was created by <strong>Shima Serein</strong> to address a critical challenge facing visually impaired individuals across Africa.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={storyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{
                    delay: 0.5,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                >
                  Across Africa, millions of visually impaired individuals face significant barriers in performing everyday tasks such as reading medication labels, navigating unfamiliar environments, or identifying objects. They struggle with accessibility due to lack of affordable assistive tools and limited availability of trained human assistance. Existing solutions are either too expensive, not localized for African languages and cultures, or unavailable in certain regions.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={storyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{
                    delay: 0.6,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                >
                  Imboni leverages cutting-edge AI technology for image and video analysis and natural-sounding text-to-speech. By providing real-time visual descriptions, Imboni offers a practical, accessible solution that gives visually impaired individuals more independence and dignity in their daily lives – all for free.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={storyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{
                    delay: 0.7,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                >
                  Today, Imboni represents a step forward in making visual information accessible through intelligent, intuitive, and inclusive design, specifically tailored for the unique needs of African communities.
                </motion.p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <FlickeringFooter 
        initialDelay={1400}
        animationDuration={0.3}
      />
    </div>
  )
}

