
"use client"

import { useEffect, useRef } from "react"

type EyesProps = {
  scale?: number
}

export default function Eyes({
  scale = 1,
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
      className="flex gap-5 origin-center"
      style={{ transform: `scale(${scale})` }}
    >
      {[left, right].map((ref, i) => (
        <div
          key={i}
          className="w-10 h-14 bg-white dark:bg-slate-100 rounded-full flex items-center justify-center"
        >
          <div
            ref={ref}
            className="w-4 h-4 bg-black dark:bg-slate-900 rounded-full transition-transform duration-75 linear"
          />
        </div>
      ))}
    </div>
  )
}




