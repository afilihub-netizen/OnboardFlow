import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Shield, 
  Smartphone, 
  Zap, 
  ArrowRight, 
  CheckCircle,
  Building2,
  PieChart,
  Target,
  Brain,
  Star,
  PlayCircle,
  BarChart3,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">FinanceFlow</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Recursos</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Como Funciona</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Preços</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                  Entrar
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 mb-8">
                <Zap className="w-4 h-4 mr-2" />
                Controle Total das Suas Finanças
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Controle Total das Suas{" "}
                <span className="text-blue-600">Finanças</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                Gerencie suas receitas, despesas e investimentos de forma inteligente. 
                Tome decisões financeiras mais assertivas com dados em tempo real.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/login">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg w-full sm:w-auto"
                >
                  Começar Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg rounded-xl w-full sm:w-auto"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Ver Demo
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-500 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 border-2 border-white"></div>
                </div>
                <span>Mais de 10 mil usuários</span>
              </div>
              
              <div className="flex items-center space-x-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tudo que você precisa para ter controle completo da sua vida financeira
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Transações",
                description: "Registre receitas e despesas com categorização automática e relatórios detalhados.",
                color: "bg-blue-50 text-blue-600"
              },
              {
                icon: PieChart,
                title: "Investimentos",
                description: "Acompanhe o desempenho dos seus investimentos com gráficos interativos.",
                color: "bg-green-50 text-green-600"
              },
              {
                icon: Target,
                title: "Metas",
                description: "Defina metas orçamentárias e acompanhe seu progresso em tempo real.",
                color: "bg-purple-50 text-purple-600"
              },
              {
                icon: Shield,
                title: "Segurança",
                description: "Seus dados estão protegidos com autenticação segura e criptografia.",
                color: "bg-orange-50 text-orange-600"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-8 h-8`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Pronto para Começar?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Junte-se a milhares de usuários que já transformaram sua vida financeira com o FinanceFlow.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            {[
              {
                step: "01",
                title: "Conecte e sincronize",
                description: "Integre todas as suas contas financeiras de forma segura e automática"
              },
              {
                step: "02", 
                title: "Organize e categorize",
                description: "Nossa tecnologia organiza e categoriza seus dados automaticamente"
              },
              {
                step: "03",
                title: "Conquiste seus objetivos",
                description: "Receba insights personalizados e tome decisões financeiras inteligentes"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg"
              >
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <div className="flex items-center justify-center space-x-8 mt-8 text-sm text-gray-500">
              {[
                "✓ Gratuito para começar",
                "✓ Sem compromisso inicial", 
                "✓ Configuração em minutos"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-gray-200">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">FinanceFlow</span>
            </div>
            
            <div className="text-gray-500 text-sm">
              © 2025 FinanceFlow. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}