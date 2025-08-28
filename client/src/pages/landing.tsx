import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Target, Users, BarChart3, PiggyBank } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FinanceFlow</h1>
          </div>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            data-testid="button-login"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Controle suas finanças com 
            <span className="text-blue-600"> inteligência</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Sistema completo de gestão financeira pessoal e familiar com insights de IA, 
            relatórios detalhados e controle de investimentos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
              data-testid="button-start"
            >
              Começar Agora
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="px-8 py-4 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-2xl border-2 hover:border-blue-300 transition-all duration-200"
              data-testid="button-learn-more"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Funcionalidades Completas
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tudo que você precisa para organizar, controlar e fazer suas finanças crescerem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <CardTitle>Dashboard Inteligente</CardTitle>
              <CardDescription>
                Visão completa das suas finanças com gráficos interativos e métricas em tempo real
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <PiggyBank className="w-7 h-7 text-green-600" />
              </div>
              <CardTitle>Controle de Gastos</CardTitle>
              <CardDescription>
                Categorize e monitore todos os seus gastos com alertas automáticos e metas personalizadas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
              <CardTitle>Investimentos</CardTitle>
              <CardDescription>
                Acompanhe a evolução dos seus investimentos com gráficos de performance e análises
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Target className="w-7 h-7 text-orange-600" />
              </div>
              <CardTitle>Metas e Objetivos</CardTitle>
              <CardDescription>
                Defina metas financeiras e acompanhe seu progresso com insights de IA
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <CardTitle>Segurança Total</CardTitle>
              <CardDescription>
                Seus dados protegidos com criptografia de ponta e backup automático
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Users className="w-7 h-7 text-indigo-600" />
              </div>
              <CardTitle>Controle Familiar</CardTitle>
              <CardDescription>
                Gerencie as finanças da família com perfis separados e relatórios unificados
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Pronto para transformar suas finanças?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já organizaram suas finanças com o FinanceFlow
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            data-testid="button-cta-start"
          >
            Começar Gratuitamente
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FinanceFlow</span>
            </div>
            <p className="text-sm text-center">
              © 2024 FinanceFlow. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
