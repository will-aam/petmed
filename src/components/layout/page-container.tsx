import * as React from "react"
import { cn } from "@/lib/utils"
import { Navbar } from "./navbar"

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}

export function PageContainer({
  children,
  className,
  title,
  description,
  action,
  ...props
}: PageContainerProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className={cn("container mx-auto px-4 py-8 sm:px-6 md:py-10", className)} {...props}>
          {(title || action) && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {title && <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>}
                {description && <p className="mt-2 text-muted-foreground">{description}</p>}
              </div>
              {action && <div>{action}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
