import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderOpen, TrendingUp, Calendar, Users, Target, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export function BusinessProjectsROI() {
  const { isBusinessAccount, companyName } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  const projects = [
    {
      name: "Sistema CRM Integrado",
      investment: 85000,
      currentReturn: 142000,
      roi: 67.1,
      duration: "8 meses",
      status: "completed",
      team: 6,
      progress: 100,
      category: "Tecnologia"
    },
    {
      name: "Expansão E-commerce",
      investment: 125000,
      currentReturn: 89000,
      roi: -28.8,
      duration: "5 meses",
      status: "in_progress",
      team: 8,
      progress: 75,
      category: "Marketing"
    },
    {
      name: "Automação Produção",
      investment: 220000,
      currentReturn: 298000,
      roi: 35.5,
      duration: "12 meses",
      status: "completed",
      team: 12,
      progress: 100,
      category: "Operações"
    },
    {
      name: "Treinamento Equipe",
      investment: 45000,
      currentReturn: 68000,
      roi: 51.1,
      duration: "6 meses",
      status: "in_progress",
      team: 24,
      progress: 85,
      category: "RH"
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'bg-green-100 text-green-700 border-green-200', 
          icon: CheckCircle,
          label: 'Concluído'
        };
      case 'in_progress':
        return { 
          color: 'bg-blue-100 text-blue-700 border-blue-200', 
          icon: Clock,
          label: 'Em Andamento'
        };
      case 'delayed':
        return { 
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
          icon: AlertTriangle,
          label: 'Atrasado'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-700 border-gray-200', 
          icon: Clock,
          label: 'Planejado'
        };
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Tecnologia': return 'bg-blue-500';
      case 'Marketing': return 'bg-purple-500';
      case 'Operações': return 'bg-green-500';
      case 'RH': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const totalInvestment = projects.reduce((sum, p) => sum + p.investment, 0);
  const totalReturn = projects.reduce((sum, p) => sum + p.currentReturn, 0);
  const overallROI = ((totalReturn - totalInvestment) / totalInvestment * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">ROI por Projeto</h3>
            <p className="text-sm text-slate-600">{companyName} • Análise de investimentos</p>
          </div>
        </div>

        {/* ROI Geral */}
        <Card className={`${parseFloat(overallROI) >= 0 ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${parseFloat(overallROI) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallROI}%
            </div>
            <div className="text-sm text-slate-600">ROI Geral</div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Investimento Total</p>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {(totalInvestment / 1000).toFixed(0)}k
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Retorno Atual</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(totalReturn / 1000).toFixed(0)}k
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Projetos Ativos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {projects.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
              <FolderOpen className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Projetos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project, index) => {
          const statusConfig = getStatusConfig(project.status);
          const StatusIcon = statusConfig.icon;
          const categoryColor = getCategoryColor(project.category);
          
          return (
            <Card key={project.name} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-slate-600">
              <div className={`absolute top-0 right-0 w-2 h-full ${categoryColor}`}></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-bold text-slate-800 mb-2">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {project.category}
                      </Badge>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* ROI Destaque */}
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className={`text-3xl font-bold ${project.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {project.roi >= 0 ? '+' : ''}{project.roi.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600">ROI do Projeto</div>
                </div>

                {/* Detalhes Financeiros */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Investimento</div>
                    <div className="text-sm font-bold text-slate-800">
                      R$ {(project.investment / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Retorno</div>
                    <div className="text-sm font-bold text-slate-800">
                      R$ {(project.currentReturn / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progresso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Informações do Projeto */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{project.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{project.team} pessoas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Análise Executiva */}
      <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <CardContent className="p-6">
          <h4 className="text-lg font-bold mb-4">Análise Executiva de Projetos</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold mb-1">{projects.length}</div>
              <div className="text-slate-300 text-sm">Total de Projetos</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">
                {projects.filter(p => p.roi > 0).length}
              </div>
              <div className="text-slate-300 text-sm">Com ROI Positivo</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">
                {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
              </div>
              <div className="text-slate-300 text-sm">Progresso Médio</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">
                R$ {Math.round((totalReturn - totalInvestment) / 1000)}k
              </div>
              <div className="text-slate-300 text-sm">Lucro Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}