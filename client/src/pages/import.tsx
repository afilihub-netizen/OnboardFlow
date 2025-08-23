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
import { Upload, FileText, Brain, CheckCircle, AlertCircle, Download } from "lucide-react";
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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
        description: `${parsedTransactions.length} transações foram importadas com sucesso.`,
      });
      setCurrentStep(1);
      setParsedTransactions([]);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // For text files, read content directly
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setExtractText(content);
        };
        reader.readAsText(file);
      } else {
        // For PDF files, you would typically use a PDF parsing library
        toast({
          title: "PDF detectado",
          description: "Para arquivos PDF, cole o texto do extrato na área de texto abaixo.",
        });
      }
    }
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

    try {
      // Call OpenAI API to analyze the bank statement
      const response = await fetch("/api/analyze-extract", {
        method: "POST",
        credentials: 'include',
        body: JSON.stringify({ 
          extractText,
          availableCategories: categories.map(cat => cat.name)
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const analyzedTransactions = result.transactions || [];
      setParsedTransactions(analyzedTransactions);
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
      setIsAnalyzing(false);
    }
  };

  const handleImportTransactions = () => {
    const transactionsToImport = parsedTransactions.map(transaction => ({
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.type,
      description: transaction.description,
      date: transaction.date,
      categoryId: categories.find(cat => cat.name.toLowerCase().includes(transaction.category.toLowerCase()))?.id || null,
      paymentMethod: "bank_transfer"
    }));

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
                      onChange={handleFileUpload}
                      data-testid="input-file-upload"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Formatos suportados: PDF, TXT, CSV
                    </p>
                  </div>
                  
                  {selectedFile && (
                    <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
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
                <div className="w-64 mx-auto">
                  <Progress value={85} className="h-3" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review and Import */}
          {currentStep === 3 && parsedTransactions.length > 0 && (
            <Card className="financial-card">
              <CardHeader className="flex flex-row items-center justify-between">
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
                    disabled={importTransactionsMutation.isPending}
                    data-testid="button-import-transactions"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {importTransactionsMutation.isPending ? "Importando..." : "Importar Transações"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedTransactions.map((transaction, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
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
                              Confiança: {Math.round(transaction.confidence * 100)}%
                              {transaction.confidence < 0.7 && (
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