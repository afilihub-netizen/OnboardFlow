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
  PlayCircle
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">FinanceFlow</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Recursos</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">Como Funciona</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Preços</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Entrar
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-none">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-400 border-green-500/30 px-4 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Sistema Nexo Avançado
                </Badge>
                
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight font-heading">
                  Transforme suas
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent block">
                    finanças
                  </span>
                  para sempre
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                  Descubra o poder da inteligência artificial aplicada às suas finanças. 
                  Gestão completa, insights preditivos e controle total em suas mãos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-none px-8 py-6 text-lg font-semibold rounded-2xl w-full sm:w-auto"
                  >
                    Começar Gratuitamente
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-gray-600 bg-transparent text-white hover:bg-white/10 hover:border-gray-500 px-8 py-6 text-lg rounded-2xl w-full sm:w-auto"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Ver Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-green-400"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                  </div>
                  <span className="text-sm text-gray-400">Mais de 10 mil usuários</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-400 ml-2">4.9/5</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold font-heading">Patrimônio Total</h3>
                      <Badge className="bg-green-500/20 text-green-400">+12.5%</Badge>
                    </div>
                    
                    <div className="text-4xl font-bold">
                      R$ 847.520,00
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium">Imóveis</div>
                            <div className="text-sm text-gray-400">2 ativos</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">R$ 650.000</div>
                          <div className="text-sm text-green-400">+8.2%</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                            <PieChart className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium">Investimentos</div>
                            <div className="text-sm text-gray-400">Diversificado</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">R$ 197.520</div>
                          <div className="text-sm text-green-400">+15.4%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background Effects */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-heading">
              Recursos que 
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">revolucionam</span> suas finanças
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Tecnologia avançada e inteligência artificial trabalhando para o seu crescimento financeiro
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Brain,
                title: "Inteligência Preditiva",
                description: "Nossa IA analisa seus padrões e antecipa suas necessidades financeiras com precisão",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Building2,
                title: "Visão Patrimonial 360º",
                description: "Monitore todos os seus investimentos e ativos em tempo real, onde quer que estejam",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Target,
                title: "Objetivos Personalizados",
                description: "Defina suas metas e acompanhe o progresso com orientações inteligentes",
                gradient: "from-green-500 to-teal-500"
              },
              {
                icon: Shield,
                title: "Proteção Máxima",
                description: "Segurança bancária avançada protege seus dados com tecnologia de ponta",
                gradient: "from-orange-500 to-red-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-white/5 border-gray-700 hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-heading">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-heading">
              Simplicidade que 
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">potencializa</span> resultados
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Conecte e sincronize",
                description: "Integre todas as suas contas financeiras de forma segura e automática"
              },
              {
                step: "02", 
                title: "Deixe a IA trabalhar",
                description: "Nossa tecnologia organiza, categoriza e analisa seus dados em tempo real"
              },
              {
                step: "03",
                title: "Conquiste seus objetivos",
                description: "Receba orientações personalizadas e tome decisões financeiras mais inteligentes"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold mb-4 font-heading">{step.title}</h3>
                <p className="text-gray-400 text-lg">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl p-12 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-heading">
              Sua jornada financeira começa agora
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Milhares de pessoas já descobriram como a tecnologia pode revolucionar sua vida financeira
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button 
                  size="lg" 
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-2xl"
                >
                  Começar Gratuitamente
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-8 mt-8 pt-8 border-t border-white/20">
              {[
                "✓ Gratuito para começar",
                "✓ Sem compromisso inicial",
                "✓ Configuração em minutos"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm opacity-90">
                  <CheckCircle className="w-4 h-4" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">FinanceFlow</span>
            </div>
            
            <div className="text-gray-400 text-sm">
              © 2025 FinanceFlow. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}