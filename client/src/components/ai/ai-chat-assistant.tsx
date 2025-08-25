import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, MessageCircle, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  "Como estão meus gastos este mês?",
  "Em que categoria gasto mais?",
  "Onde posso economizar?",
  "Como está minha saúde financeira?",
  "Qual foi meu maior gasto recente?",
  "Estou gastando mais ou menos que mês passado?"
];

export function AIChatAssistant({ isOpen, onClose }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Sou seu assistente financeiro pessoal. Posso te ajudar analisando seus dados financeiros e respondendo perguntas sobre seus gastos, receitas e saúde financeira. Como posso ajudar hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (question?: string) => {
    const messageText = question || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: any = await apiRequest('POST', '/api/ai/chat', {
        question: messageText
      });

      console.log('AI Response received:', response);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response || 'Desculpe, não recebi uma resposta válida.',
        timestamp: response.timestamp ? new Date(response.timestamp) : new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro no Chat",
        description: "Não foi possível processar sua pergunta. Tente novamente.",
        variant: "destructive",
      });

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col shadow-2xl bg-white border border-gray-200">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Assistente Financeiro IA</CardTitle>
              <p className="text-sm text-slate-600">Pergunte sobre suas finanças</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-chat">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 bg-white">
          <ScrollArea className="flex-1 p-4 bg-white">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start gap-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-blue-500'
                          : 'bg-slate-100'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-70 block mt-1">
                        {message.timestamp && !isNaN(message.timestamp.getTime()) 
                          ? message.timestamp.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Analisando seus dados...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Sugestões de perguntas */}
          {messages.length === 1 && (
            <div className="px-4 py-3 border-t border-b bg-slate-50">
              <p className="text-sm font-medium text-slate-700 mb-2">Perguntas frequentes:</p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 justify-start"
                    onClick={() => handleSendMessage(question)}
                    disabled={isLoading}
                    data-testid={`suggestion-${index}`}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input de mensagem */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta sobre finanças..."
                disabled={isLoading}
                className="flex-1"
                data-testid="chat-input"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                size="sm"
                data-testid="send-message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Botão flutuante para abrir o chat
export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-40"
        data-testid="open-ai-chat"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      <AIChatAssistant 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}