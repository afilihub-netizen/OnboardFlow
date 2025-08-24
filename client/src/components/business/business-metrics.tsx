import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, Target, DollarSign, ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react";

export function BusinessMetrics() {
  const { isBusinessAccount, companyName, industry } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  const metrics = [
    {
      title: "Receita Mensal",
      value: "R$ 45.230",
      change: "+12%",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      trend: "up"
    },
    {
      title: "Despesas Operacionais", 
      value: "R$ 32.150",
      change: "-3%",
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      trend: "down"
    },
    {
      title: "Margem de Lucro",
      value: "28.9%",
      change: "+5%",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      trend: "up"
    },
    {
      title: "Funcionários Ativos",
      value: "24",
      change: "+2",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      trend: "up"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Indicadores Empresariais</h3>
          <p className="text-sm text-slate-600">{companyName} • {industry} • Janeiro 2025</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={metric.title} className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 ${metric.borderColor} border-l-4`}>
              <div className={`absolute top-0 right-0 w-16 h-16 ${metric.bgColor} rounded-full -translate-y-8 translate-x-8 opacity-50`}></div>
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  {metric.title}
                </CardTitle>
                <div className={`w-10 h-10 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-2">{metric.value}</div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                    metric.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    <span className="text-xs font-bold">{metric.change}</span>
                  </div>
                  <p className="text-xs text-slate-500">vs mês anterior</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}