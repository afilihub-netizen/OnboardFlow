import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, PieChart, BarChart3, AlertTriangle, CheckCircle } from "lucide-react";

export function BusinessFinancialHealth() {
  const { isBusinessAccount, companyName } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  const healthMetrics = [
    {
      title: "Liquidez Corrente",
      value: "2.45",
      target: "2.00",
      percentage: 98,
      status: "excellent",
      description: "Capacidade de pagamento de curto prazo",
      icon: DollarSign
    },
    {
      title: "Margem EBITDA",
      value: "28.5%",
      target: "25.0%",
      percentage: 95,
      status: "good",
      description: "Rentabilidade operacional da empresa",
      icon: TrendingUp
    },
    {
      title: "Giro de Estoque",
      value: "6.2x",
      target: "8.0x",
      percentage: 78,
      status: "warning",
      description: "Eficiência na gestão de estoque",
      icon: BarChart3
    },
    {
      title: "ROI",
      value: "15.8%",
      target: "12.0%",
      percentage: 100,
      status: "excellent",
      description: "Retorno sobre investimento",
      icon: PieChart
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'excellent':
        return { 
          color: 'bg-green-100 text-green-700 border-green-200', 
          icon: CheckCircle,
          label: 'Excelente',
          progressColor: 'bg-green-500'
        };
      case 'good':
        return { 
          color: 'bg-blue-100 text-blue-700 border-blue-200', 
          icon: CheckCircle,
          label: 'Bom',
          progressColor: 'bg-blue-500'
        };
      case 'warning':
        return { 
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
          icon: AlertTriangle,
          label: 'Atenção',
          progressColor: 'bg-yellow-500'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-700 border-gray-200', 
          icon: CheckCircle,
          label: 'Normal',
          progressColor: 'bg-gray-500'
        };
    }
  };

  // Cálculo da saúde financeira geral
  const overallHealth = Math.round(
    healthMetrics.reduce((sum, metric) => sum + metric.percentage, 0) / healthMetrics.length
  );

  const getOverallStatus = (health: number) => {
    if (health >= 90) return { label: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (health >= 75) return { label: 'Boa', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (health >= 60) return { label: 'Regular', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Atenção', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const overallStatus = getOverallStatus(overallHealth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Saúde Financeira</h3>
            <p className="text-sm text-slate-600">{companyName} • Análise em tempo real</p>
          </div>
        </div>
        
        {/* Score Geral */}
        <Card className={`${overallStatus.bgColor} border-0`}>
          <CardContent className="p-4 text-center">
            <div className={`text-3xl font-bold ${overallStatus.color}`}>{overallHealth}%</div>
            <div className={`text-sm font-medium ${overallStatus.color}`}>{overallStatus.label}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {healthMetrics.map((metric) => {
          const statusConfig = getStatusConfig(metric.status);
          const StatusIcon = statusConfig.icon;
          const MetricIcon = metric.icon;
          
          return (
            <Card key={metric.title} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-slate-600">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <MetricIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800">
                        {metric.title}
                      </CardTitle>
                      <p className="text-xs text-slate-500">{metric.description}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Valor Atual vs Meta */}
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{metric.value}</div>
                    <div className="text-xs text-slate-500">Atual</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium text-slate-600">{metric.target}</div>
                    <div className="text-xs text-slate-500">Meta</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progresso</span>
                    <span>{metric.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${statusConfig.progressColor}`}
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Análise Rápida */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {metric.percentage >= 90 ? 'Superando expectativas' :
                       metric.percentage >= 75 ? 'Dentro do esperado' :
                       'Precisa de atenção'}
                    </span>
                    <TrendingUp className={`w-3 h-3 ${
                      metric.percentage >= 75 ? 'text-green-500' : 'text-yellow-500'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo Executivo */}
      <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <CardContent className="p-6">
          <h4 className="text-lg font-bold mb-4">Resumo Executivo</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold mb-1">{overallHealth}%</div>
              <div className="text-slate-300 text-sm">Score Geral</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">
                {healthMetrics.filter(m => m.status === 'excellent').length}
              </div>
              <div className="text-slate-300 text-sm">Métricas Excelentes</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">
                {healthMetrics.filter(m => m.status === 'warning').length}
              </div>
              <div className="text-slate-300 text-sm">Requer Atenção</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}