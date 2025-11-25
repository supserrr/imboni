"use client"

import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Empty className="max-w-2xl">
        <EmptyHeader>
          <EmptyTitle className="text-[6.4rem] sm:text-[9.6rem] md:text-[14.4rem] lg:text-[19.2rem] font-bold tracking-tight leading-none text-accent">404</EmptyTitle>
          <EmptyDescription className="text-lg">
            Page Not Found
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col gap-3 w-full mt-4">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}

