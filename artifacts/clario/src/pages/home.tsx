import { Link } from "wouter";
import { motion } from "framer-motion";
import { Feather, FileText, Layout, Mail, Clipboard, LineChart, Edit3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-32 overflow-hidden bg-background">
        <div className="container max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-col items-start text-left"
            >
              <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-muted-foreground text-xs font-medium mb-8">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--olive))]"></div>
                <span>AI-powered writing</span>
              </motion.div>
              <motion.h1 variants={item} className="text-5xl lg:text-7xl font-serif text-foreground leading-[1.1] mb-6 tracking-tight">
                Write with clarity & grace.
              </motion.h1>
              <motion.p variants={item} className="text-lg text-muted-foreground mb-10 max-w-md leading-relaxed font-light">
                Elevate your documents, PDFs, and emails. Clario analyzes your text for grammar, fluency, clarity, and engagement, turning raw thoughts into polished prose.
              </motion.p>
              <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/workspace">
                  <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full px-8 font-medium shadow-sm">
                    Start for free <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/workspace">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 rounded-full px-8 font-medium bg-transparent border-border hover:bg-muted/50">
                    See it in action
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Supported Formats Section */}
      <section className="py-16 bg-muted/30 border-y border-border/50">
        <div className="container max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">Works everywhere you write</h3>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
            {['PDF Documents', 'Word/Docs', 'Gmail', 'Pasted Text', 'Web Pages'].map((format, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border/50 shadow-sm text-sm font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--olive))]"></div>
                {format}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four Dimensions Section */}
      <section id="features" className="py-32 bg-background">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-serif mb-6 tracking-tight">Four dimensions, one perfect score.</h2>
            <p className="text-muted-foreground text-lg font-light leading-relaxed">
              Every piece of writing is scored across four dimensions, so you know exactly where to improve.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <DimensionCard title="Grammar" score={97} color="#22c55e" tagline="Flawless mechanics." />
            <DimensionCard title="Fluency" score={91} color="#f59e0b" tagline="Natural rhythm." />
            <DimensionCard title="Clarity" score={98} color="#3b82f6" tagline="Crystal clear meaning." />
            <DimensionCard title="Engagement" score={88} color="#a855f7" tagline="Captivating tone." />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-card border-t border-border/40">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-serif mb-6 tracking-tight">Everything your writing needs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<FileText size={20} className="text-primary" />}
              title="PDF Analysis"
              description="Upload PDFs and extract text for comprehensive editing and analysis."
            />
            <FeatureCard 
              icon={<Layout size={20} className="text-primary" />}
              title="Document Support"
              description="Seamlessly analyze Word documents while preserving their original structure."
            />
            <FeatureCard 
              icon={<Mail size={20} className="text-primary" />}
              title="Gmail Integration"
              description="Draft and perfect your emails before hitting send with our deep integration."
            />
            <FeatureCard 
              icon={<Clipboard size={20} className="text-primary" />}
              title="Paste & Correct"
              description="Instantly paste raw text and watch it transform into polished, professional prose."
            />
            <FeatureCard 
              icon={<LineChart size={20} className="text-primary" />}
              title="Progress Tracking"
              description="Monitor your improvement over time with detailed writing statistics."
            />
            <FeatureCard 
              icon={<Edit3 size={20} className="text-primary" />}
              title="Inline Highlights"
              description="Review corrections right where they happen, with beautiful contextual highlights."
            />
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-32 bg-background border-t border-border/40">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-8">
            <Feather size={20} className="text-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif italic mb-10 leading-tight tracking-tight text-foreground">
            "Clario is the writing editor I always wished existed."
          </h2>
          <div className="flex flex-col items-center">
            <p className="font-medium text-foreground">Sofia M.</p>
            <p className="text-sm text-muted-foreground">Senior Content Strategist</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function DimensionCard({ title, score, color, tagline }: { title: string, score: number, color: string, tagline: string }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="p-8 rounded-3xl bg-background border border-border/50 shadow-sm flex items-center gap-6"
    >
      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/30" />
          <motion.circle 
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            cx="48" cy="48" r={radius} stroke={color} strokeWidth="4" fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
          />
        </svg>
        <span className="absolute text-xl font-serif font-bold" style={{ color }}>{score}</span>
      </div>
      <div>
        <h3 className="text-xl font-medium mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm font-light">{tagline}</p>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="p-8 rounded-3xl border border-border/40 bg-card hover:bg-muted/20 transition-colors shadow-sm"
    >
      <div className="w-12 h-12 rounded-2xl bg-background border border-border/50 flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed font-light">{description}</p>
    </motion.div>
  );
}