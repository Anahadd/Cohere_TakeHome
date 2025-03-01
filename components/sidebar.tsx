"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings, MessageCircle } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-20 md:w-24 h-full bg-gray-900/80 backdrop-blur-lg border-r border-purple-900/20 flex flex-col items-center py-8 shadow-xl shadow-black/20">
      <div className="flex flex-col items-center gap-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-purple-900/30 mb-6">
          A
        </div>

        <SidebarItem icon={<Home size={24} />} label="Home" href="/" active={pathname === "/"} />
        <SidebarItem
          icon={<Settings size={24} />}
          label="Preferences"
          href="/preferences"
          active={pathname.startsWith("/preferences")}
        />
        <SidebarItem
          icon={<MessageCircle size={24} />}
          label="Chat"
          href="/chat"
          active={pathname.startsWith("/chat")}
        />
      </div>
    </div>
  )
}

function SidebarItem({
  icon,
  label,
  href,
  active = false,
}: { icon: React.ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`sidebar-item relative flex flex-col items-center group ${
        active ? "text-purple-400" : "text-gray-400"
      }`}
    >
      <div
        className={`sidebar-icon-container w-12 h-12 flex items-center justify-center rounded-xl ${
          active ? "bg-purple-900/20 shadow-lg shadow-purple-900/10" : "bg-transparent"
        }`}
      >
        {icon}
      </div>
      <span className="text-xs mt-2 font-medium opacity-80">{label}</span>
    </Link>
  )
}

