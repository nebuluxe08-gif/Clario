import React from "react";
import { Link, useLocation } from "wouter";
import { Feather, User, Layout as LayoutIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container max-w-6xl mx-auto h-16 flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Feather size={18} strokeWidth={2.5} />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Clario</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="/workspace" 
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${location === '/workspace' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutIcon size={16} />
              <span className="hidden sm:inline">Workspace</span>
            </Link>
            <Link 
              href="/profile" 
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${location === '/profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <User size={16} />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border/40 bg-background/50 mt-auto py-8">
        <div className="container max-w-6xl mx-auto px-6 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <Feather size={16} />
            <span className="font-serif font-medium">Clario</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Clario. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
