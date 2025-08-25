import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, MessageCircle, X, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: any;
}

interface AIChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS_INDIVIDUAL = [
  "Como estão meus gastos este mês?",
  "Em que categoria gasto mais?",
  "Onde posso economizar?",
  "Como está minha saúde financeira?",
  "Qual foi meu maior gasto recente?",
  "Estou gastando mais ou menos que mês passado?"
];

const SUGGESTED_QUESTIONS_BUSINESS = [
  "Como está o fluxo de caixa da empresa?",
  "Qual departamento tem maior gasto?",
  "Como estão as vendas este mês?",
  "Onde a empresa pode reduzir custos?",
  "Qual fornecedor tem maior volume?",
  "Como está a margem de lucro?"
];

export function AIChatAssistant({ isOpen, onClose }: AIChatAssistantProps) {
  const { user } = useAuth();
  const accountType = user?.accountType || 'individual';
  
  // Chave do localStorage baseada no tipo de conta
  const getStorageKey = () => `financeflow_chat_${accountType}`;
  
  // Mensagem inicial baseada no tipo de conta
  const getInitialMessage = (): ChatMessage => {
    if (accountType === 'business') {
      return {
        role: 'assistant',
        content: '🏢 Olá! Sou seu assistente financeiro empresarial. Posso te ajudar analisando dados financeiros da empresa, fluxo de caixa, departamentos, fornecedores e muito mais. Como posso ajudar sua empresa hoje?',
        timestamp: new Date()
      };
    }
    return {
      role: 'assistant',
      content: '👋 Olá! Sou seu assistente financeiro pessoal. Posso te ajudar analisando seus dados financeiros e respondendo perguntas sobre seus gastos, receitas e saúde financeira. Como posso ajudar hoje?',
      timestamp: new Date()
    };
  };
  
  const [messages, setMessages] = useState<ChatMessage[]>([getInitialMessage()]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar mensagens do localStorage quando o tipo de conta mudar
  useEffect(() => {
    const storageKey = getStorageKey();
    const savedMessages = localStorage.getItem(storageKey);
    
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Erro ao carregar mensagens do chat:', error);
        setMessages([getInitialMessage()]);
      }
    } else {
      setMessages([getInitialMessage()]);
    }
  }, [accountType]);

  // Salvar mensagens no localStorage sempre que mudarem
  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, accountType]);

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
        timestamp: response?.timestamp ? new Date(response.timestamp) : new Date(),
        action: response?.action
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
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {accountType === 'business' ? 'Assistente Empresarial IA' : 'Assistente Financeiro IA'}
              </CardTitle>
              <p className="text-sm text-slate-600">
                {accountType === 'business' ? 'Pergunte sobre as finanças da empresa' : 'Pergunte sobre suas finanças'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-chat">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 bg-white overflow-hidden">
          <ScrollArea className="flex-1 p-4 bg-white">
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
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      ) : (
                        <div className="text-sm prose prose-sm max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({children}) => <h1 className="text-lg font-bold text-gray-800 mb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-semibold text-gray-800 mb-1">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-semibold text-gray-800 mb-1">{children}</h3>,
                              p: ({children}) => <p className="text-sm text-gray-700 mb-2 last:mb-0">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside text-sm text-gray-700 mb-2 ml-2">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside text-sm text-gray-700 mb-2 ml-2">{children}</ol>,
                              li: ({children}) => <li className="mb-1">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                              em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                              code: ({children}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-blue-400 pl-3 italic text-gray-600 mb-2">{children}</blockquote>
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                          {message.action && (
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">
                                Ação executada: {message.action.description}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <span className="text-xs opacity-70 block mt-2">
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
            <div className="px-4 py-3 border-t border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <p className="text-sm font-medium text-slate-700 mb-3">💡 Experimente perguntar:</p>
              <div className="grid grid-cols-1 gap-2">
                {(accountType === 'business' ? SUGGESTED_QUESTIONS_BUSINESS : SUGGESTED_QUESTIONS_INDIVIDUAL)
                  .slice(0, 4)
                  .map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 justify-start text-left hover:bg-white/70 border-blue-200 hover:border-blue-300 transition-all"
                      onClick={() => handleSendMessage(question)}
                      disabled={isLoading}
                      data-testid={`suggestion-${index}`}
                    >
                      <span className="truncate">{question}</span>
                    </Button>
                  )
                )}
              </div>
              <div className="mt-3 text-xs text-slate-600">
                <strong>🤖 Posso ajudar você a:</strong> {accountType === 'business' 
                  ? 'analisar departamentos, gerar relatórios empresariais, controlar fluxo de caixa e muito mais!' 
                  : 'adicionar gastos, gerar relatórios, analisar finanças e muito mais!'}
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