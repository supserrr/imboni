// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)
// This layout is dynamic by default with Cache Components - no explicit flag needed

export default function CallbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

