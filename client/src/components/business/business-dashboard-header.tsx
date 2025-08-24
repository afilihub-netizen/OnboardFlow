import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Globe } from "lucide-react";

export function BusinessDashboardHeader() {
  const { isBusinessAccount, companyName, industry, cnpj } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  return (
    <Card className="business-header bg-gradient-to-r from-slate-700 to-slate-800 text-white border-slate-600">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{companyName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-slate-100 text-slate-800 border-slate-300">
                  {industry}
                </Badge>
                <span className="text-slate-300 text-sm">CNPJ: {cnpj}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 text-slate-200 text-sm">
              <Globe className="w-4 h-4" />
              <span>Sistema Empresarial Ativo</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200 text-sm mt-1">
              <MapPin className="w-4 h-4" />
              <span>Multi-departamental</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}