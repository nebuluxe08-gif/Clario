import { Link, useLocation } from "wouter";
import { Feather, User, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isLandingPage = location === "/";

  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all duration-300">
        <div className={`mx-auto flex items-center justify-between px-6 transition-all duration-300 ${isLandingPage ? "container max-w-6xl h-16" : "w-full h-14"}`}>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <Feather size={18} strokeWidth={2} />
              </div>
              <span className="font-serif font-semibold text-xl tracking-tight">Clario</span>
            </Link>
            {!isLandingPage && (
              <>
                <div className="w-px h-4 bg-border/60 hidden sm:block"></div>
                <span className="text-xs text-muted-foreground font-medium hidden sm:block">Grammar, perfected.</span>
              </>
            )}
          </div>
          
          <nav className="flex items-center gap-6">
            {isLandingPage ? (
              <>
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Features</a>
                <Link href="/workspace" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Workspace</Link>
                <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">About</a>
              </>
            ) : (
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <History size={16} />
              </button>
            )}
            
            <Link href="/profile" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <User size={16} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative">
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
        <div className={`mx-auto px-6 text-sm flex flex-col sm:flex-row items-center gap-4 ${isLandingPage ? "container max-w-6xl justify-between" : "w-full justify-center"}`}>
          {isLandingPage ? (
            <>
              <div className="flex items-center gap-2 opacity-50">
                <Feather size={16} />
                <span className="font-serif font-medium">Clario</span>
              </div>
              <div className="flex items-center gap-6 text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Contact</a>
                <span>© 2026 Clario. All rights reserved.</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              © 2026 Clario. All rights reserved.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}