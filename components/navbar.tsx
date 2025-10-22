"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const games = [
    { name: "League of Legends", slug: "league-of-legends" },
    { name: "Valorant", slug: "valorant" },
    { name: "CS2", slug: "cs2" },
    { name: "Rocket League", slug: "rocket-league" },
    { name: "Overwatch 2", slug: "overwatch-2" },
    { name: "Apex Legends", slug: "apex-legends" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/#" scroll={true} className="text-xl font-black uppercase tracking-tight">
            <span className="text-primary">CCC</span> Esports
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors">
              Home
            </Link>
            <div className="relative group">
              <button className="text-sm font-semibold hover:text-primary transition-colors">Teams</button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-primary/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {games.map((game) => (
                  <Link
                    key={game.slug}
                    href={`/teams/${game.slug}`}
                    className="block px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {game.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/#about" className="text-sm font-semibold hover:text-primary transition-colors">
              About
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary/20">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                Home
              </Link>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Teams</p>
                {games.map((game) => (
                  <Link
                    key={game.slug}
                    href={`/teams/${game.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="block pl-4 text-sm hover:text-primary transition-colors"
                  >
                    {game.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/#about"
                onClick={() => setIsOpen(false)}
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
