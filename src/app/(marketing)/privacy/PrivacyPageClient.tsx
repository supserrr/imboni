"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Menu } from "@/components/ui/animated-icons"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { FlickeringFooter } from "@/components/ui/flickering-footer"
import { useState, useEffect } from "react"

const navigationItems = [
  { title: "HOME", href: "/" },
  { title: "ABOUT", href: "/about" },
  { title: "CONTACT", href: "/contact" },
]

/**
 * Privacy Policy page client component
 * Displays comprehensive privacy policy following industry standards
 */
export function PrivacyPageClient() {
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
  }, [])

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
            <h1 className="text-4xl md:text-5xl font-mono font-bold mb-4 text-primary">
              Privacy Policy
            </h1>
            
            <p className="text-muted-foreground font-mono text-sm mb-8">
              {lastUpdated && `Last updated: ${lastUpdated}`}
            </p>

            <div className="space-y-8 font-mono text-sm leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">1. Introduction</h2>
                <p className="mb-4">
                  Welcome to Imboni ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI vision assistance platform designed to help blind and low vision users understand their surroundings.
                </p>
                <p className="mb-4">
                  This platform was created by Shima Serein for summative assessment purposes. By using Imboni, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-primary">2.1 Personal Information</h3>
                <p className="mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>Email address and password for account creation</li>
                  <li>Profile information and preferences</li>
                  <li>Settings and configuration data</li>
                  <li>Communication preferences</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-primary">2.2 Camera and Video Data</h3>
                <p className="mb-4">
                  When you use our live video analysis features:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>Video streams are processed in real-time on your device or through our services</li>
                  <li>Video data is not stored by default unless you explicitly enable recording features</li>
                  <li>Frame captures may be temporarily processed for AI analysis</li>
                  <li>Analysis results and descriptions are stored in your account history</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-primary">2.3 Usage Data</h3>
                <p className="mb-4">
                  We automatically collect certain information about your use of the service:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>Device information (type, operating system, browser)</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Error logs and performance data</li>
                  <li>IP address and general location data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">3. How We Use Your Information</h2>
                <p className="mb-4">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>To provide, maintain, and improve our AI vision assistance services</li>
                  <li>To process and analyze video content for real-time descriptions</li>
                  <li>To personalize your experience and settings</li>
                  <li>To send you service-related notifications and updates</li>
                  <li>To respond to your inquiries and provide customer support</li>
                  <li>To monitor and analyze usage patterns to improve our services</li>
                  <li>To detect, prevent, and address technical issues</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">4. Third-Party Services</h2>
                <p className="mb-4">
                  We use the following third-party services that may process your data:
                </p>
                
                <h3 className="text-xl font-semibold mb-3 text-primary">4.1 Supabase</h3>
                <p className="mb-4">
                  We use Supabase for user authentication, database storage, and backend services. Your account information and preferences are stored securely in Supabase's infrastructure. Please review Supabase's privacy policy for more information.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">4.2 ElevenLabs</h3>
                <p className="mb-4">
                  We use ElevenLabs for text-to-speech functionality. When you use narration features, your text may be sent to ElevenLabs for voice synthesis. Audio data is processed according to ElevenLabs' privacy policy.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">4.3 Moondream AI</h3>
                <p className="mb-4">
                  We use Moondream AI for image and video analysis. Video frames may be processed by Moondream AI to generate descriptions. Processing occurs according to Moondream's data handling practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">5. Data Storage and Security</h2>
                <p className="mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>Encrypted data transmission using HTTPS</li>
                  <li>Secure authentication and authorization systems</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication requirements</li>
                </ul>
                <p className="mb-4">
                  However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">6. Your Rights and Choices</h2>
                <p className="mb-4">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                
                <h3 className="text-xl font-semibold mb-3 text-primary">6.1 Access and Portability</h3>
                <p className="mb-4">
                  You have the right to access and receive a copy of your personal data that we hold.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">6.2 Correction</h3>
                <p className="mb-4">
                  You can update or correct your personal information through your account settings.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">6.3 Deletion</h3>
                <p className="mb-4">
                  You can request deletion of your account and associated data by contacting us or using account deletion features.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">6.4 Data Processing Controls</h3>
                <p className="mb-4">
                  You can control camera permissions, video recording, and data processing through your device settings and application preferences.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">6.5 Opt-Out</h3>
                <p className="mb-4">
                  You can opt out of non-essential communications and certain data processing activities through your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">7. Data Retention</h2>
                <p className="mb-4">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we will delete or anonymize your personal data, except where we are required to retain it for legal or regulatory purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">8. Children's Privacy</h2>
                <p className="mb-4">
                  Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">9. Changes to This Privacy Policy</h2>
                <p className="mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-primary">10. Contact Us</h2>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us through the support channels available in the application.
                </p>
                <p className="mb-4">
                  This platform was created by Shima Serein for summative assessment purposes.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t">
              <Link 
                href="/terms" 
                className="text-primary hover:underline font-mono text-sm"
              >
                View Terms of Service →
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <FlickeringFooter />
    </div>
  )
}

