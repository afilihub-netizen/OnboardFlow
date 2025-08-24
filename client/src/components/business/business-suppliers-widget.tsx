import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Star, AlertCircle, Clock, CheckCircle } from "lucide-react";

export function BusinessSuppliersWidget() {
  const { isBusinessAccount, companyName } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  const suppliers = [
    {
      name: "TechCorp Solutions",
      category: "Software",
      totalValue: "R$ 45.000",
      status: "active",
      rating: 4.8,
      lastOrder: "2 dias",
      pendingInvoices: 0
    },
    {
      name: "Office Supply Ltda",
      category: "Material de Escritório",
      totalValue: "R$ 12.500",
      status: "warning",
      rating: 4.2,
      lastOrder: "1 semana",
      pendingInvoices: 2
    },
    {
      name: "Equipamentos Pro",
      category: "Hardware",
      totalValue: "R$ 28.900",
      status: "active",
      rating: 4.9,
      lastOrder: "3 dias",
      pendingInvoices: 1
    },
    {
      name: "Serviços Gerais S.A.",
      category: "Manutenção",
      totalValue: "R$ 8.200",
      status: "pending",
      rating: 3.8,
      lastOrder: "2 semanas",
      pendingInvoices: 3
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Ativo' };
      case 'warning':
        return { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Atenção' };
      case 'pending':
        return { color: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Pendente' };
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: 'Ativo' };
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Fornecedores Principais</h3>
          <p className="text-sm text-slate-600">{companyName} • Últimos 30 dias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {suppliers.map((supplier, index) => {
          const statusConfig = getStatusConfig(supplier.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <Card key={supplier.name} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-blue-500">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -translate-y-8 translate-x-8 opacity-50"></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800 mb-1">
                      {supplier.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {supplier.category}
                    </Badge>
                  </div>
                  
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Valor Total */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Valor Total</span>
                  <span className="text-lg font-bold text-slate-800">{supplier.totalValue}</span>
                </div>

                {/* Avaliação */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Avaliação</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(supplier.rating)}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{supplier.rating}</span>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Último Pedido</div>
                    <div className="text-sm font-medium text-slate-700">{supplier.lastOrder}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">NFs Pendentes</div>
                    <div className={`text-sm font-medium ${
                      supplier.pendingInvoices > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {supplier.pendingInvoices}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo dos Fornecedores */}
      <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <div className="text-slate-300 text-sm">Fornecedores Ativos</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {suppliers.reduce((sum, s) => sum + s.pendingInvoices, 0)}
              </div>
              <div className="text-slate-300 text-sm">NFs Pendentes</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4.4</div>
              <div className="text-slate-300 text-sm">Avaliação Média</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}