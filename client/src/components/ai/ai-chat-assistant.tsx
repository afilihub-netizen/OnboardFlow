import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, User, Send, Loader2, MessageCircle, X, Palette } from 'lucide-react';
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

const CHAT_THEMES = {
  default: {
    name: 'Padrão',
    background: 'bg-white',
    chatBackground: 'bg-white',
    icon: '💬'
  },
  gradient: {
    name: 'Gradiente Azul',
    background: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    chatBackground: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    icon: '🌊'
  },
  dark: {
    name: 'Escuro',
    background: 'bg-gray-900',
    chatBackground: 'bg-gray-900',
    icon: '🌙'
  },
  nature: {
    name: 'Natureza',
    background: 'bg-gradient-to-br from-green-50 to-emerald-100',
    chatBackground: 'bg-gradient-to-br from-green-50 to-emerald-100',
    icon: '🌿'
  },
  sunset: {
    name: 'Pôr do Sol',
    background: 'bg-gradient-to-br from-orange-50 to-pink-100',
    chatBackground: 'bg-gradient-to-br from-orange-50 to-pink-100',
    icon: '🌅'
  },
  professional: {
    name: 'Profissional',
    background: 'bg-gradient-to-br from-slate-50 to-gray-100',
    chatBackground: 'bg-gradient-to-br from-slate-50 to-gray-100',
    icon: '💼'
  }
};

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
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('chat-theme') || 'default';
  });
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    localStorage.setItem('chat-theme', theme);
    setShowThemeSelector(false);
    toast({
      title: "Tema atualizado!",
      description: `Tema "${CHAT_THEMES[theme as keyof typeof CHAT_THEMES].name}" aplicado com sucesso.`,
    });
  };

  const currentTheme = CHAT_THEMES[selectedTheme as keyof typeof CHAT_THEMES] || CHAT_THEMES.default;

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
      const res = await apiRequest('POST', '/api/ai/chat', {
        question: messageText
      });

      const response = await res.json();

      console.log('Full AI Response received:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));

      let responseText = '';
      if (response && typeof response === 'object') {
        responseText = response.response || response.message || '';
      } else if (typeof response === 'string') {
        responseText = response;
      }

      if (!responseText) {
        responseText = 'Desculpe, não recebi uma resposta válida da IA. Tente novamente.';
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: response?.timestamp ? new Date(response.timestamp) : new Date()
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
      <Card className="w-full max-w-2xl h-[600px] flex flex-col shadow-2xl bg-white border-2 border-blue-200 rounded-xl overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Assistente Financeiro IA</CardTitle>
              <p className="text-sm text-slate-600">Pergunte sobre suas finanças</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              data-testid="theme-selector"
              title="Alterar tema"
            >
              <Palette className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-chat">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {showThemeSelector && (
          <div className="border-b bg-white/90 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Escolha um tema:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CHAT_THEMES).map(([key, theme]) => (
                <Button
                  key={key}
                  variant={selectedTheme === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange(key)}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                  data-testid={`theme-${key}`}
                >
                  <span className="text-lg">{theme.icon}</span>
                  <span className="text-xs">{theme.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <CardContent className={`flex-1 flex flex-col p-0 overflow-hidden ${currentTheme.chatBackground}`}>
          <ScrollArea className={`flex-1 p-4 ${currentTheme.chatBackground}`}>
            <div className="space-y-4 pr-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start gap-3 max-w-[75%] ${
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
                      className={`rounded-lg px-4 py-2 break-words ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white shadow-md'
                          : selectedTheme === 'dark' 
                            ? 'bg-gray-800 text-white border border-gray-700'
                            : 'bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
                <div className="flex justify-start w-full">
                  <div className="flex items-start gap-3 max-w-[75%]">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${
                      selectedTheme === 'dark' 
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className={`text-sm ${
                          selectedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Analisando seus dados...</span>
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
          <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
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