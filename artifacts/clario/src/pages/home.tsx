import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Feather, FileText, CheckCircle, Layout, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="container max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-col items-start text-left"
            >
              <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Feather size={14} />
                <span>Your intelligent writing companion</span>
              </motion.div>
              <motion.h1 variants={item} className="text-5xl lg:text-7xl font-serif font-bold text-foreground leading-[1.1] mb-6">
                Write with absolute <span className="text-primary italic">clarity.</span>
              </motion.h1>
              <motion.p variants={item} className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
                Clario analyzes your writing for grammar, fluency, clarity, and engagement. Like a brilliant editor in your pocket, it shows exactly what to improve and why.
              </motion.p>
              <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/workspace">
                  <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-8 font-medium hover-elevate">
                    Get Started <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/workspace">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 font-medium">
                    Try Demo
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 aspect-[4/3] bg-card flex items-center justify-center">
                <img src="/src/assets/hero-studio.png" alt="Writer's studio" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/20 to-transparent mix-blend-overlay"></div>
                
                {/* Floating UI element */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="absolute bottom-6 left-6 right-6 bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-2 w-1/3 bg-muted rounded-full mb-2"></div>
                      <div className="h-2 w-full bg-muted rounded-full mb-2"></div>
                      <div className="h-2 w-2/3 bg-muted rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Clarity</span>
                        <span className="text-xl font-serif text-chart-2">98</span>
                      </div>
                      <div className="w-px h-8 bg-border"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Grammar</span>
                        <span className="text-xl font-serif text-chart-1">100</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card border-y border-border/50">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-serif font-bold mb-4">A complete suite of editing tools</h2>
            <p className="text-muted-foreground">More than just spellcheck. Clario understands nuance, tone, and structure to elevate your prose.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<CheckCircle className="text-chart-1" size={24} />}
              title="Grammar"
              description="Eliminate errors, fix punctuation, and ensure structural perfection in every sentence."
            />
            <FeatureCard 
              icon={<Layout className="text-chart-2" size={24} />}
              title="Fluency"
              description="Improve flow and readability. Make your writing sound natural and effortless."
            />
            <FeatureCard 
              icon={<FileText className="text-chart-3" size={24} />}
              title="Clarity"
              description="Remove ambiguity and jargon. Deliver your message with precision and directness."
            />
            <FeatureCard 
              icon={<Feather className="text-chart-4" size={24} />}
              title="Engagement"
              description="Captivate your audience with varied sentence structure and compelling vocabulary."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border/50 bg-background/50 hover:bg-background transition-colors">
      <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
