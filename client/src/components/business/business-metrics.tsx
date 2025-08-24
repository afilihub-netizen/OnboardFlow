import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, Target, DollarSign } from "lucide-react";

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
      color: "text-green-600"
    },
    {
      title: "Despesas Operacionais", 
      value: "R$ 32.150",
      change: "-3%",
      icon: TrendingUp,
      color: "text-blue-600"
    },
    {
      title: "Margem de Lucro",
      value: "28.9%",
      change: "+5%",
      icon: Target,
      color: "text-purple-600"
    },
    {
      title: "Funcionários Ativos",
      value: "24",
      change: "+2",
      icon: Users,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-slate-600" />
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Métricas Empresariais</h3>
          <p className="text-sm text-slate-600">{companyName} • {industry}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="business-theme border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{metric.value}</div>
                <div className="flex items-center space-x-1">
                  <Badge 
                    variant={metric.change.startsWith('+') ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.change}
                  </Badge>
                  <p className="text-xs text-slate-600">vs mês anterior</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}