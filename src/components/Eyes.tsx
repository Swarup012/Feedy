
"use client"

import { useEffect, useRef } from "react"

type EyesProps = {
  scale?: number
  eyeColor?: string
  pupilColor?: string
}

export default function Eyes({
  scale = 1,
  eyeColor = "#fff",
  pupilColor = "#000",
}: EyesProps) {
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const moveEye = (eyeEl: HTMLDivElement | null) => {
        if (!eyeEl) return
        const rect = eyeEl.getBoundingClientRect()
        const dx = e.clientX - (rect.left + rect.width / 2)
        const dy = e.clientY - (rect.top + rect.height / 2)
        const angle = Math.atan2(dy, dx)
        eyeEl.style.transform = `translate(${Math.cos(angle) * 6}px, ${Math.sin(angle) * 6}px)`
      }

      moveEye(left.current)
      moveEye(right.current)
    }

    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [])

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        transform: `scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      {[left, right].map((ref, i) => (
        <div
          key={i}
          style={{
            width: 40,
            height: 56,
            background: eyeColor,   // 👈 configurable
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            ref={ref}
            style={{
              width: 16,
              height: 16,
              background: pupilColor, // 👈 configurable
              borderRadius: "50%",
              transition: "transform 0.08s linear",
            }}
          />
        </div>
      ))}
    </div>
  )
}




