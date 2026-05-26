import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { 
  useAnalyzeText, 
  useCreateDocument, 
  useListDocuments,
  useDeleteDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, Upload, Mail, Loader2, Play, CheckCircle2, 
  AlertCircle, Save, X, Copy, ChevronDown, ChevronUp, CheckCheck
} from "lucide-react";
import type { AnalysisResult, Document, Correction } from "@workspace/api-client-react";

const FREE_USE_KEY = "clario_free_use_consumed";

export function Workspace() {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState<"text" | "pdf" | "gmail">("text");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [activeCorrection, setActiveCorrection] = useState<{corr: Correction, index: number, x: number, y: number} | null>(null);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(true);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { isSignedIn } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useAnalyzeText();
  const createDocMutation = useCreateDocument();
  
  const { data: documents, isLoading: isLoadingDocs } = useListDocuments();
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setActiveCorrection(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast({ title: "Empty text", description: "Please enter some text to analyze", variant: "destructive" });
      return;
    }

    // Free-use gate: non-signed-in users get one free analysis
    if (!isSignedIn) {
      const consumed = localStorage.getItem(FREE_USE_KEY);
      if (consumed) {
        setShowAuthGate(true);
        return;
      }
    }
    
    analyzeMutation.mutate({
      data: { text, sourceType: activeTab as any }
    }, {
      onSuccess: (result) => {
        setAnalysis(result);
        setSelectedDocId(null);
        setActiveCorrection(null);
        // Mark free use as consumed for non-signed-in users
        if (!isSignedIn) {
          localStorage.setItem(FREE_USE_KEY, "1");
        }
      },
      onError: () => {
        toast({ title: "Analysis failed", description: "An error occurred while analyzing the text", variant: "destructive" });
      }
    });
  };

  const handleAcceptAll = () => {
    if (!analysis || analysis.corrections.length === 0) return;
    let newText = text;
    for (const corr of analysis.corrections) {
      newText = newText.replace(corr.original, corr.corrected);
    }
    setText(newText);
    setAnalysis({ ...analysis, corrections: [] });
    setActiveCorrection(null);
    toast({ title: "All suggestions accepted", description: "Your text has been fully corrected." });
  };

  const handleSave = () => {
    if (!analysis) return;
    createDocMutation.mutate({
      data: {
        title: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
        originalText: text,
        correctedText: analysis.correctedText,
        grammarScore: analysis.grammarScore,
        fluencyScore: analysis.fluencyScore,
        clarityScore: analysis.clarityScore,
        engagementScore: analysis.engagementScore,
        overallScore: analysis.overallScore,
        sourceType: activeTab,
        corrections: analysis.corrections
      }
    }, {
      onSuccess: () => {
        toast({ title: "Document saved", description: "Your analysis has been saved to your workspace" });
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      }
    });
  };

  const loadDocument = (doc: Document) => {
    setSelectedDocId(doc.id);
    setText(doc.originalText);
    setAnalysis({
      correctedText: doc.correctedText,
      grammarScore: doc.grammarScore,
      fluencyScore: doc.fluencyScore,
      clarityScore: doc.clarityScore,
      engagementScore: doc.engagementScore,
      overallScore: doc.overallScore,
      corrections: doc.corrections || []
    });
    setActiveCorrection(null);
  };

  const extractFileText = async (file: File) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = file.name.toLowerCase();
    if (!allowed.some((a) => ext.endsWith(a))) {
      toast({ title: "Unsupported file", description: "Please upload a PDF, DOC, or DOCX file.", variant: "destructive" });
      return;
    }

    setIsExtracting(true);
    setUploadedFileName(null);
    setAnalysis(null);
    setText("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-text", { method: "POST", body: formData });
      const data = await res.json() as { text?: string; error?: string; filename?: string; wordCount?: number };

      if (!res.ok) {
        throw new Error(data.error ?? "Extraction failed");
      }

      setText(data.text ?? "");
      setUploadedFileName(data.filename ?? file.name);
      toast({
        title: "Text extracted",
        description: `${data.wordCount?.toLocaleString() ?? "?"} words from "${data.filename}"`,
      });
    } catch (err) {
      toast({
        title: "Extraction failed",
        description: err instanceof Error ? err.message : "Could not read the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractFileText(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) extractFileText(file);
  };

  const handleAcceptCorrection = (corr: Correction, idx: number) => {
    if (!analysis) return;
    // Simple replace - in a real app would use offsets
    const newText = text.replace(corr.original, corr.corrected);
    setText(newText);
    
    // Remove correction from list
    const newCorrections = [...analysis.corrections];
    newCorrections.splice(idx, 1);
    
    setAnalysis({
      ...analysis,
      corrections: newCorrections
    });
    setActiveCorrection(null);
  };

  const handleDismissCorrection = (idx: number) => {
    if (!analysis) return;
    const newCorrections = [...analysis.corrections];
    newCorrections.splice(idx, 1);
    setAnalysis({
      ...analysis,
      corrections: newCorrections
    });
    setActiveCorrection(null);
  };

  const getCorrectionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'grammar': return 'text-emerald-500 border-emerald-500 bg-emerald-500/10';
      case 'fluency': return 'text-amber-500 border-amber-500 bg-amber-500/10';
      case 'clarity': return 'text-blue-500 border-blue-500 bg-blue-500/10';
      case 'engagement': return 'text-purple-500 border-purple-500 bg-purple-500/10';
      case 'spelling': return 'text-red-500 border-red-500 bg-red-500/10';
      default: return 'text-primary border-primary bg-primary/10';
    }
  };
  
  const getCorrectionUnderlineColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'grammar': return '#10b981'; // emerald-500
      case 'fluency': return '#f59e0b'; // amber-500
      case 'clarity': return '#3b82f6'; // blue-500
      case 'engagement': return '#a855f7'; // purple-500
      case 'spelling': return '#ef4444'; // red-500
      default: return '#888';
    }
  };

  const renderHighlightedText = () => {
    if (!analysis || analysis.corrections.length === 0) return <p className="whitespace-pre-wrap">{text}</p>;

    let result: React.ReactNode[] = [];
    let currentText = text;
    let lastIndex = 0;
    
    // Sort corrections by finding their first occurrence in currentText to render somewhat linearly
    // In a real app we would have start/end offsets from backend
    const sortedCorrections = [...analysis.corrections].map((c, i) => ({...c, originalIndex: i}))
      .filter(c => currentText.includes(c.original))
      .sort((a, b) => currentText.indexOf(a.original) - currentText.indexOf(b.original));

    if (sortedCorrections.length === 0) return <p className="whitespace-pre-wrap">{text}</p>;

    let currentIndex = 0;
    
    sortedCorrections.forEach((corr) => {
      const matchIndex = currentText.indexOf(corr.original, currentIndex);
      if (matchIndex === -1) return;

      // Add text before correction
      if (matchIndex > currentIndex) {
        result.push(<span key={`text-${currentIndex}`}>{currentText.substring(currentIndex, matchIndex)}</span>);
      }

      // Add highlighted correction
      result.push(
        <span 
          key={`corr-${corr.originalIndex}`}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveCorrection({
              corr: analysis.corrections[corr.originalIndex],
              index: corr.originalIndex,
              x: rect.left,
              y: rect.top - 10
            });
          }}
          className="cursor-pointer font-medium relative group"
          style={{ 
            textDecoration: `underline 2px ${getCorrectionUnderlineColor(corr.type)}`,
            textUnderlineOffset: '4px'
          }}
        >
          {corr.original}
          <span className="absolute hidden group-hover:block -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10 border border-border">
            {corr.type}
          </span>
        </span>
      );

      currentIndex = matchIndex + corr.original.length;
    });

    // Add remaining text
    if (currentIndex < currentText.length) {
      result.push(<span key={`text-end`}>{currentText.substring(currentIndex)}</span>);
    }

    return <p className="whitespace-pre-wrap leading-relaxed">{result}</p>;
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Editor Column */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border/50">
        <div className="p-6 pb-0">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              AI-powered grammar
            </span>
            <h1 className="text-3xl font-serif tracking-tight mb-1 text-foreground">Polish your writing in one click.</h1>
            <p className="text-muted-foreground text-sm font-light">Draft, analyze, and refine your text seamlessly.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
              <button onClick={() => setActiveTab("text")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'text' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <FileText size={14} /> Text
              </button>
              <button onClick={() => setActiveTab("pdf")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'pdf' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <Upload size={14} /> PDF/DOCX
              </button>
              <button onClick={() => setActiveTab("gmail")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'gmail' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <Mail size={14} /> Gmail
              </button>
            </div>
            
            <div className="text-xs text-muted-foreground flex items-center gap-4">
              <span>{text.length} chars</span>
              <span>{wordCount} words</span>
              <span>~{readingTime} min read</span>
              
              <div className="flex items-center gap-2 ml-2 border-l border-border/50 pl-4">
                <Button size="sm" variant="ghost" onClick={() => { setAnalysis(null); setText(""); setSelectedDocId(null); }} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  Clear
                </Button>
                {analysis && !selectedDocId && (
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={createDocMutation.isPending} className="h-8 rounded-md">
                    {createDocMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                    Save
                  </Button>
                )}
                <Button size="sm" onClick={handleAnalyze} disabled={analyzeMutation.isPending || !text.trim()} className="h-8 rounded-md shadow-sm">
                  {analyzeMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Play size={14} className="mr-1.5" />}
                  Analyze
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden px-6 pb-6 relative">
          {activeTab !== 'text' && !text && !analysis && (
            <div
              className={`mb-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/8 scale-[1.01]"
                  : isExtracting
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-muted/20 hover:bg-muted/30 hover:border-border"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isExtracting && document.getElementById('file-upload')?.click()}
            >
              {isExtracting ? (
                <>
                  <Loader2 size={32} className="mx-auto text-primary mb-4 animate-spin" />
                  <h3 className="font-medium text-foreground mb-1">Extracting text…</h3>
                  <p className="text-sm text-muted-foreground font-light">Reading your document, please wait.</p>
                </>
              ) : isDragging ? (
                <>
                  <Upload size={32} className="mx-auto text-primary mb-4" />
                  <h3 className="font-medium text-primary mb-1">Drop to upload</h3>
                  <p className="text-sm text-muted-foreground font-light">Release to extract text</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-muted border border-border/60 flex items-center justify-center mx-auto mb-4">
                    <FileText size={26} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Upload a document</h3>
                  <p className="text-sm text-muted-foreground mb-5 font-light">
                    Drop a <span className="font-medium text-foreground">PDF</span> or <span className="font-medium text-foreground">DOCX</span> file here, or click to browse.
                  </p>
                  <p className="text-xs text-muted-foreground/70">Supports PDF, DOC, DOCX · Max 20 MB</p>
                </>
              )}
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Uploaded file badge — shown when text is loaded from a file */}
          {activeTab === 'pdf' && uploadedFileName && (text || analysis) && (
            <div className="mb-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/8 border border-primary/20 text-sm w-fit">
              <FileText size={14} className="text-primary shrink-0" />
              <span className="text-foreground font-medium truncate max-w-xs">{uploadedFileName}</span>
              <button
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setText(""); setAnalysis(null); setUploadedFileName(null); }}
                title="Remove file"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {analyzeMutation.isPending && (
            <div className="absolute inset-x-6 top-0 bottom-6 z-10 bg-background/50 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl border border-border/50 overflow-hidden">
              <motion.div 
                className="w-full h-1 bg-primary/20 absolute top-0"
                initial={{ opacity: 1 }}
              >
                <motion.div 
                  className="h-full bg-primary"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              </motion.div>
              <Loader2 size={32} className="animate-spin text-primary mb-4" />
              <p className="font-medium text-foreground">Analyzing your writing...</p>
              <p className="text-sm text-muted-foreground mt-1 font-light">Checking grammar, clarity, and engagement.</p>
            </div>
          )}

          <div className="flex-1 rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col shadow-sm">
            {analysis && !analyzeMutation.isPending ? (
              <div className="flex-1 overflow-auto p-6 text-foreground font-light text-[15px]">
                {renderHighlightedText()}
              </div>
            ) : (
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start writing or paste your text here..."
                className="flex-1 resize-none border-0 focus-visible:ring-0 rounded-none p-6 text-[15px] font-light leading-relaxed bg-transparent"
              />
            )}
          </div>

          {analysis && !analyzeMutation.isPending && (
            <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Corrected Preview
                </span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => navigator.clipboard.writeText(analysis.correctedText)}>
                  <Copy size={12} className="mr-1.5" /> Copy
                </Button>
              </div>
              <div className="text-sm text-muted-foreground font-light line-clamp-3">
                {analysis.correctedText}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[380px] flex flex-col bg-background/50 border-l border-border/30 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            
            {/* Writing Scores Card */}
            <div>
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">Analysis Score</h3>
              {analysis ? (
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif font-medium text-lg">Overall Score</span>
                    <span className="text-3xl font-serif text-primary">{analysis.overallScore}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <ScoreBar label="Grammar" score={analysis.grammarScore} color="bg-emerald-500" />
                    <ScoreBar label="Fluency" score={analysis.fluencyScore} color="bg-amber-500" />
                    <ScoreBar label="Clarity" score={analysis.clarityScore} color="bg-blue-500" />
                    <ScoreBar label="Engagement" score={analysis.engagementScore} color="bg-purple-500" />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center text-muted-foreground shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={20} className="text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-light">Run analysis to see your scores</p>
                </div>
              )}
            </div>

            {/* Suggestions Panel */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Suggestions</h3>
                <div className="flex items-center gap-2">
                  {analysis && analysis.corrections.length > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-full px-3 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={handleAcceptAll}
                        data-testid="button-accept-all"
                      >
                        <CheckCheck size={12} className="mr-1.5" />
                        Accept all
                      </Button>
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                        {analysis.corrections.length}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {analyzeMutation.isPending ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border border-border/30 bg-card/50 p-4">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse mb-3"></div>
                      <div className="h-4 w-full bg-muted rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : analysis ? (
                analysis.corrections.length > 0 ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {analysis.corrections.map((corr: Correction, idx: number) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="overflow-hidden"
                        >
                          <div className={`p-4 rounded-xl border border-border/50 bg-card shadow-sm border-l-4 ${getCorrectionColor(corr.type).split(' ')[1]}`}>
                            <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm mb-2 ${getCorrectionColor(corr.type)}`}>
                              {corr.type}
                            </span>
                            <div className="mb-2 text-sm">
                              <span className="line-through text-muted-foreground mr-2 font-light">{corr.original}</span>
                              <span className="font-medium text-foreground">{corr.corrected}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-light mb-3">{corr.explanation}</p>
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs rounded-md flex-1" onClick={() => handleAcceptCorrection(corr, idx)}>Accept</Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs rounded-md flex-1" onClick={() => handleDismissCorrection(idx)}>Dismiss</Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center text-muted-foreground shadow-sm">
                    <CheckCircle2 size={24} className="mx-auto mb-3 text-emerald-500/50" />
                    <p className="text-sm font-light">No issues found. Your writing is perfect!</p>
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center text-muted-foreground shadow-sm">
                  <p className="text-sm font-light">Suggestions will appear here after analysis.</p>
                </div>
              )}
            </div>

            {/* Recent Documents */}
            <div>
              <button 
                onClick={() => setIsDocumentsOpen(!isDocumentsOpen)}
                className="flex items-center justify-between w-full text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4 hover:text-foreground transition-colors"
              >
                Recent Documents
                {isDocumentsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              <AnimatePresence>
                {isDocumentsOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      {isLoadingDocs ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                      ) : documents?.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground font-light border border-dashed border-border/50 rounded-xl">No saved documents</div>
                      ) : (
                        documents?.map(doc => (
                          <div 
                            key={doc.id} 
                            onClick={() => loadDocument(doc)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer text-sm flex flex-col gap-1.5 ${selectedDocId === doc.id ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-card border-border/50 hover:border-border'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate pr-2 text-foreground">{doc.title}</span>
                              <span className="shrink-0 flex items-center gap-1 text-xs font-serif bg-muted px-1.5 py-0.5 rounded text-foreground">
                                <CheckCircle2 size={10} className="text-primary"/> {doc.overallScore}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-light">{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </ScrollArea>
      </div>

      {/* Auth Gate Modal */}
      <AnimatePresence>
        {showAuthGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setShowAuthGate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-5">
                <CheckCheck size={24} className="text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">You've used your free analysis</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Create a free account to continue using Clario — unlimited analyses, document history, and your full writing profile.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/sign-up" onClick={() => setShowAuthGate(false)}>
                  <Button className="w-full rounded-full" size="lg" data-testid="button-gate-signup">
                    Create free account
                  </Button>
                </Link>
                <Link href="/sign-in" onClick={() => setShowAuthGate(false)}>
                  <Button variant="outline" className="w-full rounded-full" size="lg" data-testid="button-gate-signin">
                    Sign in to existing account
                  </Button>
                </Link>
              </div>
              <button
                onClick={() => setShowAuthGate(false)}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Correction Popup */}
      <AnimatePresence>
        {activeCorrection && (
          <motion.div 
            ref={popupRef}
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 w-72 bg-popover border border-border shadow-xl rounded-xl p-4"
            style={{ 
              top: activeCorrection.y - 120, // offset up
              left: Math.max(20, activeCorrection.x - 140) // center roughly but keep on screen
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${getCorrectionColor(activeCorrection.corr.type)}`}>
                {activeCorrection.corr.type}
              </span>
              <button onClick={() => setActiveCorrection(null)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <div className="mb-2 text-sm">
              <span className="line-through text-muted-foreground mr-2 font-light">{activeCorrection.corr.original}</span>
              <span className="font-medium text-foreground">{activeCorrection.corr.corrected}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-light mb-3">{activeCorrection.corr.explanation}</p>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs rounded-md flex-1" onClick={() => handleAcceptCorrection(activeCorrection.corr, activeCorrection.index)}>Accept</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs rounded-md flex-1" onClick={() => handleDismissCorrection(activeCorrection.index)}>Dismiss</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string, score: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-serif">{score}/100</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
}