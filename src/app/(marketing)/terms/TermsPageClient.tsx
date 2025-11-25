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
 * Terms of Service page client component
 * Displays comprehensive terms of service following industry standards
 */
export function TermsPageClient() {
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
            <h1 className="text-4xl md:text-5xl font-mono font-bold mb-4">
              Terms of Service
            </h1>
            
            <p className="text-muted-foreground font-mono text-sm mb-8">
              {lastUpdated && `Last updated: ${lastUpdated}`}
            </p>

            <div className="space-y-8 font-mono text-sm leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
                <p className="mb-4">
                  By accessing or using Imboni ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.
                </p>
                <p className="mb-4">
                  This platform was created by Shima Serein for summative assessment purposes. These Terms constitute a legally binding agreement between you and the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
                <p className="mb-4">
                  Imboni is an AI-powered vision assistance platform designed to help blind and low vision users understand their surroundings through real-time video analysis and audio descriptions. The Service includes:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>Live video analysis and object detection</li>
                  <li>Real-time audio descriptions of visual content</li>
                  <li>Customizable triggers and alerts</li>
                  <li>Text-to-speech narration</li>
                  <li>Analysis history and preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                
                <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
                <p className="mb-4">
                  To use certain features of the Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information as necessary</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">3.2 Account Security</h3>
                <p className="mb-4">
                  You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Acceptable Use Policy</h2>
                <p className="mb-4">
                  You agree not to use the Service:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>In any way that violates any applicable law or regulation</li>
                  <li>To transmit, store, or process any content that is illegal, harmful, or violates others' rights</li>
                  <li>To attempt to gain unauthorized access to the Service or related systems</li>
                  <li>To interfere with or disrupt the Service or servers</li>
                  <li>To use the Service for any commercial purpose without authorization</li>
                  <li>To reverse engineer, decompile, or disassemble any part of the Service</li>
                  <li>To use automated systems to access the Service without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. User Responsibilities</h2>
                <p className="mb-4">
                  You are responsible for:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>Obtaining and maintaining all necessary equipment and permissions to use the Service</li>
                  <li>Ensuring you have proper camera and microphone permissions when using video features</li>
                  <li>Using the Service in compliance with all applicable laws and regulations</li>
                  <li>Respecting the privacy and rights of others when using video analysis features</li>
                  <li>Not recording or analyzing content without proper consent where required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Intellectual Property Rights</h2>
                
                <h3 className="text-xl font-semibold mb-3">6.1 Service Ownership</h3>
                <p className="mb-4">
                  The Service and its original content, features, and functionality are owned by the creators and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold mb-3">6.2 User Content</h3>
                <p className="mb-4">
                  You retain ownership of any content you create or upload through the Service. By using the Service, you grant us a license to use, process, and store your content as necessary to provide the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. AI Accuracy and Disclaimers</h2>
                
                <h3 className="text-xl font-semibold mb-3">7.1 AI Limitations</h3>
                <p className="mb-4">
                  The Service uses artificial intelligence and machine learning technologies that may not always be accurate. Descriptions, analyses, and recommendations provided by the Service are generated by AI systems and may contain errors, inaccuracies, or omissions.
                </p>

                <h3 className="text-xl font-semibold mb-3">7.2 No Guarantee of Accuracy</h3>
                <p className="mb-4">
                  We do not guarantee the accuracy, completeness, or reliability of any information provided by the Service. You should not rely solely on the Service for critical decisions, especially those related to safety, navigation, or medical matters.
                </p>

                <h3 className="text-xl font-semibold mb-3">7.3 Accessibility Disclaimer</h3>
                <p className="mb-4">
                  While we strive to make the Service accessible, we cannot guarantee that it will work perfectly with all assistive technologies or in all situations. The Service is provided "as is" without warranties of any kind.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
                <p className="mb-4">
                  To the maximum extent permitted by law:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                  <li>The Service is provided "as is" and "as available" without warranties of any kind</li>
                  <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>We shall not be liable for any loss or damage resulting from your use of or inability to use the Service</li>
                  <li>We shall not be liable for any decisions made based on information provided by the Service</li>
                  <li>Our total liability shall not exceed the amount you paid to use the Service, if any</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Indemnification</h2>
                <p className="mb-4">
                  You agree to indemnify, defend, and hold harmless the Service and its creators from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any rights of another.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Service Modifications and Termination</h2>
                
                <h3 className="text-xl font-semibold mb-3">10.1 Service Changes</h3>
                <p className="mb-4">
                  We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. We may also impose limits on certain features or restrict access to parts of the Service without notice.
                </p>

                <h3 className="text-xl font-semibold mb-3">10.2 Account Termination</h3>
                <p className="mb-4">
                  We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. You may also terminate your account at any time through your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
                <p className="mb-4">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
                <p className="mb-4">
                  These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved through appropriate legal channels.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">13. Severability</h2>
                <p className="mb-4">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please contact us through the support channels available in the application.
                </p>
                <p className="mb-4">
                  This platform was created by Shima Serein for summative assessment purposes.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t">
              <Link 
                href="/privacy" 
                className="text-primary hover:underline font-mono text-sm"
              >
                View Privacy Policy →
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <FlickeringFooter />
    </div>
  )
}

