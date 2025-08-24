import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export function BusinessDepartmentalMetrics() {
  const { isBusinessAccount, companyName } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  const departments = [
    {
      name: "Vendas",
      budget: "R$ 25.000",
      spent: "R$ 21.500",
      percentage: 86,
      status: "warning",
      employees: 8,
      performance: "+12%"
    },
    {
      name: "Marketing",
      budget: "R$ 15.000", 
      spent: "R$ 12.800",
      percentage: 85,
      status: "success",
      employees: 5,
      performance: "+8%"
    },
    {
      name: "Tecnologia",
      budget: "R$ 35.000",
      spent: "R$ 28.900",
      percentage: 83,
      status: "success",
      employees: 12,
      performance: "+15%"
    },
    {
      name: "Recursos Humanos",
      budget: "R$ 12.000",
      spent: "R$ 11.200",
      percentage: 93,
      status: "danger",
      employees: 3,
      performance: "+3%"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'danger': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
          <Building className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Orçamento por Departamento</h3>
          <p className="text-sm text-slate-600 font-medium mt-1">{companyName} • Janeiro 2025</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => {
          const StatusIcon = getStatusIcon(dept.status);
          return (
            <Card key={dept.name} className="relative overflow-hidden border-l-4 border-slate-600 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full -translate-y-10 translate-x-10 opacity-30"></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800">
                    {dept.name}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(dept.status)}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Orçamento vs Gasto */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-slate-600 font-medium">Orçamento</span>
                    <span className="text-lg font-bold text-slate-800 tracking-tight">{dept.budget}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-slate-600 font-medium">Gasto</span>
                    <span className="text-lg font-bold text-slate-800 tracking-tight">{dept.spent}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        dept.percentage > 90 ? 'bg-red-500' : 
                        dept.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${dept.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-slate-500 text-center font-medium">
                    {dept.percentage}% do orçamento utilizado
                  </div>
                </div>

                {/* Métricas do Departamento */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 font-medium">{dept.employees} funcionários</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <Badge className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1">
                      {dept.performance}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}