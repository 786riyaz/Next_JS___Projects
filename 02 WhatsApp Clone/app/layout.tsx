// app/layout.tsx
export const metadata = {
  title: "WhatsApp Clone",
  description: "Realtime Chat App",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b141a", color: "white" }}>
        {children}
      </body>
    </html>
  )
}