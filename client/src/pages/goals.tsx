import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Goals() {
  const { user, isAuthenticated } = useAuth();
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);

  // Mock data for goals
  const goals = [
    {
      id: "1",
      name: "Reserva de Emergência",
      targetAmount: 10000,
      currentAmount: 6200,
      category: "Poupança",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      progress: 62
    },
    {
      id: "2", 
      name: "Viagem de Férias",
      targetAmount: 5000,
      currentAmount: 2800,
      category: "Lazer",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      progress: 56
    },
    {
      id: "3",
      name: "Novo Notebook",
      targetAmount: 3000,
      currentAmount: 1500,
      category: "Tecnologia",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      progress: 50
    }
  ];

  const totalGoals = goals.reduce((acc, goal) => acc + goal.targetAmount, 0);
  const totalSaved = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const overallProgress = Math.round((totalSaved / totalGoals) * 100);

  if (!isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto md:ml-0">
        <Header 
          title="Metas Financeiras" 
          subtitle="Defina e acompanhe suas metas de economia" 
        />
        
        <div className="p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Metas Ativas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Poupado</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totalSaved.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Meta Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totalGoals.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progresso Geral</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals List */}
          <Card className="financial-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Suas Metas
              </CardTitle>
              
              <Dialog open={isNewGoalDialogOpen} onOpenChange={setIsNewGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Meta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Meta</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="goalName">Nome da Meta</Label>
                      <Input id="goalName" placeholder="Ex: Reserva de emergência" />
                    </div>
                    <div>
                      <Label htmlFor="targetAmount">Valor Objetivo</Label>
                      <Input id="targetAmount" type="number" placeholder="5000" />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="savings">Poupança</SelectItem>
                          <SelectItem value="travel">Viagem</SelectItem>
                          <SelectItem value="tech">Tecnologia</SelectItem>
                          <SelectItem value="emergency">Emergência</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="month">Mês</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="year">Ano</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full">Criar Meta</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {goals.map((goal) => (
                  <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{goal.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          R$ {goal.currentAmount.toLocaleString()} / R$ {goal.targetAmount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{goal.progress}% concluído</p>
                      </div>
                    </div>
                    <Progress value={goal.progress} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}