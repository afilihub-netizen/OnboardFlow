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
    <div className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
      </div>
      
      <Card className="relative bg-transparent border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex items-start justify-between text-white">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-white to-slate-200 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-8 h-8 text-slate-800" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{companyName}</h2>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Building2 className="w-3 h-3 mr-1" />
                    {industry}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-200 border-blue-300/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Sistema Empresarial
                  </Badge>
                </div>
                <p className="text-slate-300 text-sm">CNPJ: {cnpj}</p>
              </div>
            </div>
            
            <div className="text-right space-y-3">
              <div className="flex items-center gap-2 text-slate-200">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">Crescimento: +15%</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">24 Funcionários</span>
              </div>
              <div className="px-3 py-1 bg-green-500/20 rounded-full">
                <span className="text-green-300 text-xs font-medium">● ATIVO</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}