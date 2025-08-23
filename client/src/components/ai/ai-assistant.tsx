import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, User, TrendingUp, PiggyBank, Target, AlertCircle, Lightbulb } from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantProps {
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function AIAssistant({ className = "", isMinimized = false, onToggleMinimize }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Olá! Sou seu assistente financeiro IA. Posso ajudar você a analisar suas finanças, definir metas e dar conselhos personalizados. Como posso ajudá-lo hoje?",
      timestamp: new Date(),
      suggestions: [
        "Como posso melhorar minha situação financeira?",
        "Analise meus gastos do mês",
        "Quais são minhas maiores categorias de despesa?",
        "Defina uma meta de economia para mim"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user financial data for context
  const { data: financialSummary } = useQuery({
    queryKey: ['/api/financial-summary'],
    queryFn: async () => {
      const response = await fetch('/api/financial-summary', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch financial summary');
      return response.json();
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // AI Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            financialSummary,
            recentTransactions: transactions?.slice(-10),
          }
        }),
      });
      if (!response.ok) throw new Error('Failed to get AI response');
      return response.json();
    },
    onSuccess: (response) => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions || []
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: () => {
      toast({
        title: "Erro na conversa",
        description: "Não foi possível obter resposta do assistente IA.",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  const handleSendMessage = (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Send to AI
    chatMutation.mutate(text);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 ${className}`}>
        <Button
          onClick={onToggleMinimize}
          size="lg"
          className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
          data-testid="ai-assistant-toggle"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`${className} flex flex-col h-full max-h-[600px]`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center">
          <Bot className="w-5 h-5 mr-2 text-blue-600" />
          Assistente Financeiro IA
          <Badge variant="outline" className="ml-2">Beta</Badge>
        </CardTitle>
        {onToggleMinimize && (
          <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
            −
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.type}-${message.id}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white ml-4'
                      : 'bg-gray-100 dark:bg-gray-800 mr-4'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'assistant' && (
                      <Bot className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
                    </div>
                  </div>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs opacity-70">Sugestões:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-auto py-1 px-2 text-xs"
                            onClick={() => handleSuggestionClick(suggestion)}
                            data-testid={`suggestion-${index}`}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mr-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua pergunta sobre finanças..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isTyping}
              data-testid="ai-message-input"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              size="icon"
              data-testid="ai-send-button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => handleSendMessage("Analise meus gastos")}
              data-testid="quick-action-expenses"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Analisar Gastos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => handleSendMessage("Como economizar mais?")}
              data-testid="quick-action-savings"
            >
              <PiggyBank className="w-3 h-3 mr-1" />
              Dicas de Economia
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => handleSendMessage("Defina metas financeiras")}
              data-testid="quick-action-goals"
            >
              <Target className="w-3 h-3 mr-1" />
              Metas Financeiras
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}