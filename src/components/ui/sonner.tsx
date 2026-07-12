"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      gap={10}
      visibleToasts={5}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "aply-toast",
          title: "aply-toast-title",
          description: "aply-toast-desc",
          success: "aply-toast-success",
          error: "aply-toast-error",
          info: "aply-toast-info",
          warning: "aply-toast-warning",
          loading: "aply-toast-loading",
          closeButton: "aply-toast-close",
          icon: "aply-toast-icon",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--card)",
          "--success-text": "var(--foreground)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--card)",
          "--error-text": "var(--foreground)",
          "--error-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
