"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Gamepad2 } from "lucide-react"
import { JoinModal } from "./join-modal"
import Link from "next/link"

export function Hero() {
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/esports-gaming-arena-with-dramatic-lighting.jpg"
            alt="Esports Arena"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-primary uppercase tracking-wider">Collegiate Esports</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase mb-6 text-balance">
            <span className="block">Compete</span>
            <span className="block text-primary">Dominate</span>
            <span className="block">Win</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Join our competitive gaming community and represent your college in the biggest esports titles
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#games">
              <Button
                size="lg"
                className="text-lg font-bold uppercase tracking-wide cursor-pointer transition-transform hover:scale-105"
              >
                <Gamepad2 className="mr-2 h-5 w-5" />
                View Teams
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-lg font-bold uppercase tracking-wide bg-transparent cursor-pointer"
              onClick={() => setJoinModalOpen(true)}
            >
              Join Us
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      <JoinModal open={joinModalOpen} onOpenChange={setJoinModalOpen} />
    </>
  )
}
