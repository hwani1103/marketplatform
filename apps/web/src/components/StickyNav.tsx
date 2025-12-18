'use client'

import { useEffect, useState } from 'react'

interface StickyNavProps {
  sections: { id: string; label: string }[]
}

export default function StickyNav({ sections }: StickyNavProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '')

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (!element) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(section.id)
            }
          })
        },
        {
          rootMargin: '-20% 0px -60% 0px', // 화면 상단 20% 지점에서 활성화
          threshold: 0,
        }
      )

      observer.observe(element)
      observers.push(observer)
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [sections])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 120 // sticky header 높이만큼 오프셋
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Market Regime Platform
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          거시경제 지표 기반 시장 국면 분석
        </p>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-2 overflow-x-auto pb-3 -mb-px">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg
                transition-all duration-200
                ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
