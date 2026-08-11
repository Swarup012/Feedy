
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
    <div className="bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-sm font-medium shadow-md whitespace-nowrap">
      {visibleText}
      <span className="animate-pulse">|</span>
    </div>
  )
}
