"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function PrivacyTermsPage() {
  const [accepted, setAccepted] = useState(false)
  const router = useRouter()

  const handleContinue = () => {
    if (accepted) {
      router.push("/signup")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Privacy Policy & Terms of Service</CardTitle>
          <CardDescription>
            Please read and accept to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-2">Privacy Policy</h3>
              <p className="text-sm text-muted-foreground">
                Your privacy is important to us. We collect and use your
                personal information to provide our visual assistance services.
                We do not share your information with third parties without your
                consent. All video calls are peer-to-peer and not recorded by
                default.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Terms of Service</h3>
              <p className="text-sm text-muted-foreground">
                By using Imboni, you agree to use the service responsibly and
                respectfully. Volunteers commit to providing helpful assistance,
                and users commit to using the service appropriately. We reserve
                the right to suspend accounts that violate these terms.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <Label htmlFor="accept" className="cursor-pointer">
              I agree to the Privacy Policy and Terms of Service
            </Label>
          </div>
          <Button
            onClick={handleContinue}
            disabled={!accepted}
            className="w-full"
          >
            Agree and Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

