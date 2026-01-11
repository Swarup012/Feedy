
"use client"

import { useEffect, useState } from "react"

type ThinkingBubbleProps = {
  text?: string
  speed?: number
}

export function ThinkingBubble({
  text = "Hi ! we here to manage your product . feel free to signup",
  speed = 120,
}: ThinkingBubbleProps) {
  const [visibleText, setVisibleText] = useState("")
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev >= text.length) return 0
        return prev + 1
      })
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  useEffect(() => {
    setVisibleText(text.slice(0, index))
  }, [index, text])

  return (
    <div
      style={{
        background: "#ABDADC",
        padding: "8px 12px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        whiteSpace: "nowrap",
      }}
    >
      {visibleText}
      <span className="blink">|</span>

      <style>{`
        .blink {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1 }
          51%, 100% { opacity: 0 }
        }
      `}</style>
    </div>
  )
}
