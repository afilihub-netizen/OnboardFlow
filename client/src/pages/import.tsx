import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Brain, CheckCircle, AlertCircle, Download, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  confidence: number;
}

export default function Import() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [extractText, setExtractText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  // Fetch categories for mapping
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Import transactions mutation
  const importTransactionsMutation = useMutation({
    mutationFn: async (transactions: any[]) => {
      const promises = transactions.map(transaction =>
        fetch("/api/transactions", {
          method: "POST",
          credentials: 'include',
          body: JSON.stringify(transaction),
          headers: { "Content-Type": "application/json" },
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to import transaction: ${res.status}`);
          return res.json();
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Transações importadas",
        description: `${selectedTransactions.size} transações foram importadas com sucesso.`,
      });
      setCurrentStep(1);
      setParsedTransactions([]);
      setSelectedTransactions(new Set());
      setExtractText("");
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "Erro na importação",
        description: "Falha ao importar transações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['text/plain', 'text/csv', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Formato não suportado",
          description: "Por favor, envie arquivos PDF, TXT ou CSV.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      if (file.type === 'application/pdf') {
        toast({
          title: "PDF selecionado",
          description: "Clique em 'Carregar e Analisar Arquivo' para processar o PDF.",
        });
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    // For text files, read content directly
    if (selectedFile.type === 'text/plain' || selectedFile.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setExtractText(content);
        
        toast({
          title: "Arquivo carregado",
          description: "Iniciando análise automática do extrato...",
        });
        
        // Automatically analyze the extract after loading
        setTimeout(() => {
          if (content.trim()) {
            analyzeExtractWithAI();
          }
        }, 500); // Small delay to ensure state is updated
      };
      reader.readAsText(selectedFile);
    } 
    // For PDF files, show message to paste text manually
    else if (selectedFile.type === 'application/pdf') {
      toast({
        title: "PDF selecionado",
        description: "Para arquivos PDF, copie o texto do extrato e cole na área de texto ao lado.",
        variant: "default",
      });
    }
  };

  // Function to connect to SSE for progress tracking
  const connectToProgressStream = (sessionId: string) => {
    const eventSource = new EventSource(`/api/analyze-extract-progress/${sessionId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setAnalysisProgress(data.progress);
        setProgressMessage(data.message);
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };

    return eventSource;
  };

  const analyzeExtractWithAI = async () => {
    if (!extractText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, adicione o texto do extrato bancário.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(2);
    setAnalysisProgress(0);
    setProgressMessage("Iniciando análise...");

    // Generate unique session ID for progress tracking
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Connect to progress stream
    const eventSource = connectToProgressStream(sessionId);

    try {
      // Call OpenAI API to analyze the bank statement
      const response = await fetch("/api/analyze-extract", {
        method: "POST",
        credentials: 'include',
        body: JSON.stringify({ 
          extractText,
          availableCategories: categories.map((cat: any) => cat.name),
          sessionId
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const analyzedTransactions = result.transactions || [];
      
      console.log("Raw result from server:", result);
      console.log("Analyzed transactions received:", analyzedTransactions.slice(0, 3));
      
      setParsedTransactions(analyzedTransactions);
      // Seleciona todas as transações por padrão
      setSelectedTransactions(new Set(Array.from({ length: analyzedTransactions.length }, (_, i) => i)));
      setCurrentStep(3);
      
      toast({
        title: "Análise concluída",
        description: `${analyzedTransactions.length} transações foram identificadas.`,
      });
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Falha ao analisar o extrato. Verifique o formato e tente novamente.",
        variant: "destructive",
      });
      setCurrentStep(1);
    } finally {
      eventSource.close();
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setProgressMessage("");
    }
  };

  // Funções para gerenciar seleção de transações
  const toggleTransaction = (index: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAll = () => {
    setSelectedTransactions(new Set(Array.from({ length: parsedTransactions.length }, (_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedTransactions(new Set());
  };

  const handleImportTransactions = () => {
    // Filtra apenas as transações selecionadas
    const selectedParsedTransactions = parsedTransactions.filter((_, index) => 
      selectedTransactions.has(index)
    );
    
    console.log("Selected transactions before import:", selectedParsedTransactions.slice(0, 3));
    
    const transactionsToImport = selectedParsedTransactions.map(transaction => {
      // Ensure we have valid data
      const amount = transaction.amount ? Math.abs(Number(transaction.amount)) : 0;
      const date = transaction.date || "2024-12-10";
      const description = transaction.description || "Transação importada";
      const type = transaction.type || "expense";
      
      console.log("Processing transaction:", { 
        original: transaction, 
        amount, 
        date, 
        description, 
        type 
      });
      
      return {
        amount: amount.toString(),
        type: type,
        description: description,
        date: date,
        categoryId: categories.find((cat: any) => 
          cat.name.toLowerCase().includes((transaction.category || "outros").toLowerCase())
        )?.id || null,
        paymentMethod: "transfer"
      };
    });

    console.log("Final transactions to import:", transactionsToImport.slice(0, 3));
    importTransactionsMutation.mutate(transactionsToImport);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStepProgress = () => {
    return (currentStep / 3) * 100;
  };

  if (!isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Importação de Extratos" 
          subtitle="Importe seus extratos bancários com análise inteligente" 
        />
        
        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <Card className="financial-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className={currentStep >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}>
                    1. Upload do Extrato
                  </span>
                  <span className={currentStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}>
                    2. Análise IA
                  </span>
                  <span className={currentStep >= 3 ? "text-blue-600 font-medium" : "text-gray-500"}>
                    3. Revisão e Importação
                  </span>
                </div>
                <Progress value={getStepProgress()} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="financial-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload de Arquivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Selecione seu extrato bancário</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.txt,.csv"
                      onChange={handleFileSelect}
                      data-testid="input-file-upload"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Formatos suportados: PDF, TXT, CSV
                    </p>
                  </div>
                  
                  {selectedFile && (
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                      </div>
                      <Button
                        onClick={handleFileUpload}
                        disabled={!selectedFile || selectedFile.type === 'application/pdf'}
                        className="w-full"
                        data-testid="button-upload-file"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {selectedFile?.type === 'application/pdf' 
                          ? 'Para PDF, cole o texto manualmente' 
                          : 'Carregar e Analisar Arquivo'
                        }
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="financial-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Texto do Extrato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="extract-text">Cole ou edite o texto aqui</Label>
                    <Textarea
                      id="extract-text"
                      value={extractText}
                      onChange={(e) => setExtractText(e.target.value)}
                      placeholder="Cole aqui o texto do seu extrato bancário..."
                      className="min-h-[200px] font-mono text-sm"
                      data-testid="textarea-extract"
                    />
                  </div>
                  
                  <Button 
                    onClick={analyzeExtractWithAI}
                    disabled={!extractText.trim() || isAnalyzing}
                    className="w-full"
                    data-testid="button-analyze"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {isAnalyzing ? "Analisando..." : "Analisar com IA"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Analysis */}
          {currentStep === 2 && (
            <Card className="financial-card">
              <CardContent className="p-12 text-center">
                <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold mb-2">Analisando seu extrato...</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  A IA está identificando e categorizando suas transações
                </p>
                <div className="w-96 mx-auto space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progresso da análise</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-3" data-testid="progress-analysis" />
                  {progressMessage && (
                    <p className="text-sm text-muted-foreground mt-2" data-testid="text-progress-message">
                      {progressMessage}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review and Import */}
          {currentStep === 3 && parsedTransactions.length > 0 && (
            <Card className="financial-card">
              <CardHeader className="space-y-4">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Transações Identificadas ({parsedTransactions.length})
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Analisar Novamente
                    </Button>
                    <Button 
                      onClick={handleImportTransactions}
                      disabled={importTransactionsMutation.isPending || selectedTransactions.size === 0}
                      data-testid="button-import-transactions"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {importTransactionsMutation.isPending 
                        ? "Importando..." 
                        : `Importar ${selectedTransactions.size} transação${selectedTransactions.size !== 1 ? 'ões' : ''}`
                      }
                    </Button>
                  </div>
                </div>
                
                {/* Controles de seleção */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">
                      {selectedTransactions.size} de {parsedTransactions.length} selecionadas
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      disabled={selectedTransactions.size === parsedTransactions.length}
                      data-testid="button-select-all"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Selecionar Tudo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAll}
                      disabled={selectedTransactions.size === 0}
                      data-testid="button-deselect-all"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Desmarcar Tudo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedTransactions.map((transaction, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTransactions.has(index)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => toggleTransaction(index)}
                      data-testid={`transaction-item-${index}`}
                    >
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedTransactions.has(index)}
                          onChange={() => toggleTransaction(index)}
                          className="mr-4"
                          data-testid={`checkbox-transaction-${index}`}
                        />
                        
                        <div className="flex items-center justify-between flex-1">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">{transaction.description}</span>
                              <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                                {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                              </Badge>
                              <Badge variant="outline">
                                {transaction.category}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                              <span className="flex items-center">
                                Confiança: {Math.round((transaction.confidence || 0.9) * 100)}%
                                {(transaction.confidence || 0.9) < 0.7 && (
                                  <AlertCircle className="w-4 h-4 ml-1 text-yellow-500" />
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-semibold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Como usar a importação inteligente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <p className="text-sm">Faça upload do seu extrato bancário (PDF, TXT ou CSV) ou cole o texto diretamente</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <p className="text-sm">Nossa IA analisará o texto e identificará automaticamente as transações</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <p className="text-sm">Revise as transações categorizadas e importe para seu sistema</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}