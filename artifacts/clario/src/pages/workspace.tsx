import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useAnalyzeText, 
  useCreateDocument, 
  useListDocuments,
  useGetDocument,
  useDeleteDocument,
  getListDocumentsQueryKey,
  getGetDocumentQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Upload, Mail, Loader2, Play, CheckCircle2, 
  AlertCircle, ChevronRight, Save, Trash2, Edit3,
  Layout
} from "lucide-react";
import type { AnalysisResult, Document, Correction } from "@workspace/api-client-react/src/generated/api.schemas";

export function Workspace() {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useAnalyzeText();
  const createDocMutation = useCreateDocument();
  const deleteDocMutation = useDeleteDocument();
  
  const { data: documents, isLoading: isLoadingDocs } = useListDocuments();
  
  const handleAnalyze = () => {
    if (!text.trim()) {
      toast({ title: "Empty text", description: "Please enter some text to analyze", variant: "destructive" });
      return;
    }
    
    analyzeMutation.mutate({
      data: { text, sourceType: activeTab as any }
    }, {
      onSuccess: (result) => {
        setAnalysis(result);
        setSelectedDocId(null);
      },
      onError: (err) => {
        toast({ title: "Analysis failed", description: "An error occurred while analyzing the text", variant: "destructive" });
      }
    });
  };

  const handleSave = () => {
    if (!analysis) return;
    
    createDocMutation.mutate({
      data: {
        title: text.slice(0, 30) + "...",
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
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate extraction
      setText(`Extracted text from ${file.name}...\n\nThe quick brown fox jumps over the lazy dog. Its a good day to write something beautifully.`);
      toast({ title: "File loaded", description: `Successfully extracted text from ${file.name}` });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar - History */}
      <div className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border font-serif font-medium flex items-center justify-between">
          <span>Recent Documents</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setAnalysis(null); setText(""); setSelectedDocId(null); }}>
            <Edit3 size={16} />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoadingDocs ? (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Loading...
              </div>
            ) : documents?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No saved documents</div>
            ) : (
              documents?.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => loadDocument(doc)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors text-sm ${selectedDocId === doc.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                >
                  <div className="truncate mb-1">{doc.title}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={12}/> {doc.overallScore}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="text" className="text-xs"><FileText size={14} className="mr-2"/> Text</TabsTrigger>
              <TabsTrigger value="pdf" className="text-xs"><Upload size={14} className="mr-2"/> PDF / Doc</TabsTrigger>
              <TabsTrigger value="gmail" className="text-xs"><Mail size={14} className="mr-2"/> Gmail</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            {analysis && !selectedDocId && (
              <Button variant="outline" size="sm" onClick={handleSave} disabled={createDocMutation.isPending}>
                {createDocMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                Save
              </Button>
            )}
            <Button size="sm" onClick={handleAnalyze} disabled={analyzeMutation.isPending || !text.trim()}>
              {analyzeMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Play size={14} className="mr-2" />}
              Analyze
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col border-r border-border">
            {activeTab !== 'text' && !text && (
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-card">
                  <Upload size={32} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Upload a document</h3>
                  <p className="text-sm text-muted-foreground mb-4">Select a file to extract text for analysis.</p>
                  <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />
                  <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                    Choose File
                  </Button>
                </div>
              </div>
            )}
            <Textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start writing or paste your text here..."
              className="flex-1 resize-none border-0 focus-visible:ring-0 rounded-none p-6 text-base leading-relaxed bg-transparent"
            />
          </div>

          {/* Results Panel */}
          <div className="w-[400px] flex flex-col bg-card hidden lg:flex">
            {analysis ? (
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <h3 className="font-serif font-bold text-xl mb-6 flex items-center justify-between">
                    Analysis Results
                    <span className="text-3xl text-primary">{analysis.overallScore}</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <ScoreCard label="Grammar" score={analysis.grammarScore} color="text-chart-1" bg="bg-chart-1/10" />
                    <ScoreCard label="Fluency" score={analysis.fluencyScore} color="text-chart-2" bg="bg-chart-2/10" />
                    <ScoreCard label="Clarity" score={analysis.clarityScore} color="text-chart-3" bg="bg-chart-3/10" />
                    <ScoreCard label="Engagement" score={analysis.engagementScore} color="text-chart-4" bg="bg-chart-4/10" />
                  </div>

                  <Separator className="my-6" />
                  
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <AlertCircle size={16} className="text-muted-foreground" />
                    Suggested Corrections
                  </h4>
                  
                  <div className="space-y-4">
                    {analysis.corrections.length > 0 ? (
                      analysis.corrections.map((corr, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-background shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                              {corr.type}
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="line-through text-destructive mr-2">{corr.original}</span>
                            <span className="text-emerald-600 font-medium">{corr.corrected}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{corr.explanation}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6 text-muted-foreground bg-muted/50 rounded-xl border border-border">
                        <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                        <p className="text-sm">No issues found. Great job!</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
                <div>
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Layout size={24} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="font-serif font-medium text-foreground mb-2">Ready to analyze</h3>
                  <p className="text-sm">Enter your text and click analyze to see scores and corrections.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, color, bg }: { label: string, score: number, color: string, bg: string }) {
  return (
    <div className={`p-4 rounded-xl border border-border ${bg}`}>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className={`text-2xl font-serif font-bold ${color}`}>{score}</div>
    </div>
  );
}
