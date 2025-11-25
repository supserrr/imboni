"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Menu } from "@/components/ui/animated-icons"
import { Mail, Phone } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { FlickeringFooter } from "@/components/ui/flickering-footer"
import { ContactCard } from "@/components/ui/contact-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const navigationItems = [
  { title: "HOME", href: "/" },
  { title: "ABOUT", href: "/about" },
  { title: "CONTACT", href: "/contact" },
]

/**
 * Contact page client component
 * Displays contact information and support options
 */
type FormData = {
  name: string
  email: string
  phone: string
  message: string
}

export function ContactPageClient() {
  const [mounted, setMounted] = React.useState(false)
  const [showFooter, setShowFooter] = React.useState(false)
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handleScroll = () => {
      // Show footer when user scrolls down more than 100px
      const scrollY = window.scrollY || window.pageYOffset
      setShowFooter(scrollY > 100)
    }

    // Check initial scroll position
    handleScroll()
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields (Name, Email, and Message)")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      toast.success(data.message || "Thank you for contacting us! We'll get back to you soon.")
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to send message. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
    }))
  }

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
      
      <main 
        className="flex-1 flex items-center justify-center min-h-[calc(100vh-8rem)]"
      >
        <div className="container mx-auto px-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <ContactCard
              title="Get in touch"
              description="If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day."
              contactInfo={[
                {
                  icon: Mail,
                  label: 'Email',
                  value: 'contact@imboni.app',
                },
                {
                  icon: Phone,
                  label: 'Phone',
                  value: '+250788335935',
                }
              ]}
            >
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name ?? ""}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email ?? ""}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+250 788 123 456"
                    value={formData.phone ?? ""}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Your message here..."
                    rows={4}
                    value={formData.message ?? ""}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  className="w-full !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-black/90 dark:hover:!bg-white/90"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Submit"}
                </Button>
              </form>
            </ContactCard>
          </motion.div>
        </div>
      </main>

      <motion.div
        initial={false}
        animate={{
          opacity: showFooter ? 1 : 0,
          y: showFooter ? 0 : 20,
          pointerEvents: showFooter ? 'auto' : 'none',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ 
          visibility: showFooter ? 'visible' : 'hidden',
        }}
      >
        <FlickeringFooter 
          initialDelay={0}
          animationDuration={0.3}
          forceAnimate={showFooter}
        />
      </motion.div>
    </div>
  )
}

