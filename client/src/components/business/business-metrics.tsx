import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, TrendingUp, TrendingDown, Users, Target, DollarSign, ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react";

export function BusinessMetrics() {
  const { isBusinessAccount, companyName, industry } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  const kpis = [
    {
      title: "Entradas",
      value: "R$ 105.230",
      change: "+8%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up"
    },
    {
      title: "Saídas", 
      value: "R$ 78.150",
      change: "-2%",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: "down"
    },
    {
      title: "Saldo Atual",
      value: "R$ 27.080",
      change: "+15%",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "up"
    },
    {
      title: "Lucro Líquido",
      value: "25.7%",
      change: "+3%",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "up"
    },
    {
      title: "ROI Geral",
      value: "18.9%",
      change: "+7%",
      icon: Building2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: "up"
    }
  ];

  const scoreEmpresarial = 87;

  return (
    <div className="space-y-4">
      {/* Título da Seção */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Painel Executivo</h3>
          <p className="text-sm text-slate-600 font-medium">{companyName} • {industry} • Janeiro 2025</p>
        </div>
      </div>
      
      {/* KPIs Compactos - Estilo Painel Executivo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <Card 
              key={kpi.title} 
              className="relative overflow-hidden hover:shadow-md transition-all duration-200 border-0 shadow-sm bg-white"
              data-testid={`kpi-card-${kpi.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-8 h-8 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                    kpi.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    {kpi.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{kpi.title}</p>
                  <p className="text-lg font-bold text-slate-900" data-testid={`kpi-value-${kpi.title.toLowerCase().replace(/\s+/g, '-')}`}>{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Score Empresarial - Card Especial */}
        <Card className="relative overflow-hidden hover:shadow-md transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                +5 pts
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Score Empresarial</p>
              <div className="flex items-end gap-2">
                <p className="text-lg font-bold text-slate-900" data-testid="score-empresarial">{scoreEmpresarial}</p>
                <p className="text-xs text-slate-500 pb-0.5">/ 100</p>
              </div>
              <Progress value={scoreEmpresarial} className="h-2" data-testid="progress-score-empresarial" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}