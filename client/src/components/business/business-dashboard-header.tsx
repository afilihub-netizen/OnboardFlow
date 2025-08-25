import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Zap, Users, TrendingUp } from "lucide-react";

export function BusinessDashboardHeader() {
  const { isBusinessAccount, companyName, industry, cnpj } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background Pattern Sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-white to-slate-50"></div>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400 rounded-full translate-x-16 -translate-y-16"></div>
      </div>
      
      <Card className="relative bg-transparent border border-slate-200/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Info Essencial da Empresa */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center shadow-md">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">{companyName}</h2>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs px-2 py-1">
                    <Building2 className="w-3 h-3 mr-1" />
                    {industry}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 font-medium">CNPJ: {cnpj}</p>
              </div>
            </div>
            
            {/* Status e Indicadores Rápidos */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-700">Sistema Ativo</span>
                </div>
                <p className="text-xs text-slate-500">Janeiro 2025</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-slate-700">Performance</span>
                </div>
                <p className="text-xs text-green-600 font-bold">+8% vs mês anterior</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">Equipe</span>
                </div>
                <p className="text-xs text-slate-600 font-bold">24 funcionários</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}