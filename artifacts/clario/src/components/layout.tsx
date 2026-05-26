import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser, Show } from "@clerk/react";
import { Feather, LayoutDashboard, User, LogOut, LogIn } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const isLanding = location === "/";
  const isAuthPage = location.startsWith("/sign-in") || location.startsWith("/sign-up");
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  if (isAuthPage) {
    return <div className="min-h-[100dvh] bg-background">{children}</div>;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className={`${isLanding ? "container max-w-6xl mx-auto" : "w-full px-6"} h-16 flex items-center justify-between px-6`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-75 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary border border-primary/20">
              <Feather size={16} strokeWidth={2.5} />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Clario</span>
            {!isLanding && (
              <span className="hidden sm:block text-xs text-muted-foreground font-light ml-1 border-l border-border/60 pl-3">
                Grammar, perfected.
              </span>
            )}
          </Link>

          {/* Nav */}
          {isLanding ? (
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
              <Link href="/workspace" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Workspace</Link>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">About</a>
            </nav>
          ) : null}

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              {isLanding ? null : (
                <Link href="/workspace" className={`text-sm font-medium transition-colors hidden sm:flex items-center gap-1.5 ${location === '/workspace' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  <LayoutDashboard size={15} />
                  <span>Workspace</span>
                </Link>
              )}
              <Link href="/profile" className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary hover:bg-primary/25 transition-colors overflow-hidden shrink-0" data-testid="link-profile">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user.firstName ?? "Profile"} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User size={16} />
                )}
              </Link>
              <button
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-signout"
              >
                <LogOut size={14} />
                <span className="hidden md:inline">Sign out</span>
              </button>
            </Show>

            <Show when="signed-out">
              <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="link-signin">
                <LogIn size={15} />
                <span>Sign in</span>
              </Link>
              <Link href="/sign-up" className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors" data-testid="link-signup">
                Get started
              </Link>
            </Show>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {isLanding ? (
        <footer className="border-t border-border/50 bg-background/60 py-10">
          <div className="container max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 opacity-60">
              <Feather size={14} />
              <span className="font-serif font-semibold text-sm">Clario</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Clario. All rights reserved.</p>
          </div>
        </footer>
      ) : (
        <footer className="border-t border-border/40 py-4 text-center">
          <p className="text-xs text-muted-foreground">© 2026 Clario. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
}
