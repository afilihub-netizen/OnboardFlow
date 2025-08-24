import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

export function BusinessCashFlow() {
  const { isBusinessAccount, companyName } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  const cashFlowData = [
    { month: 'Jul', entrada: 85000, saida: 62000, saldo: 23000 },
    { month: 'Ago', entrada: 92000, saida: 68000, saldo: 24000 },
    { month: 'Set', entrada: 88000, saida: 71000, saldo: 17000 },
    { month: 'Out', entrada: 95000, saida: 69000, saldo: 26000 },
    { month: 'Nov', entrada: 102000, saida: 75000, saldo: 27000 },
    { month: 'Dez', entrada: 98000, saida: 73000, saldo: 25000 },
    { month: 'Jan', entrada: 105000, saida: 78000, saldo: 27000 }
  ];

  const weeklyFlow = [
    { week: 'Sem 1', saldo: 12500 },
    { week: 'Sem 2', saldo: 15800 },
    { week: 'Sem 3', saldo: 18200 },
    { week: 'Sem 4', saldo: 21000 }
  ];

  const currentMonth = cashFlowData[cashFlowData.length - 1];
  const previousMonth = cashFlowData[cashFlowData.length - 2];
  const growthRate = ((currentMonth.saldo - previousMonth.saldo) / previousMonth.saldo * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Fluxo de Caixa Empresarial</h3>
          <p className="text-sm text-slate-600 font-medium mt-1">{companyName} • Últimos 7 meses</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-green-500 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium uppercase tracking-wide mb-2">Entradas</p>
                <p className="text-3xl font-bold text-green-600 tracking-tight">
                  R$ {(currentMonth.entrada / 1000).toFixed(0)}k
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium uppercase tracking-wide mb-2">Saídas</p>
                <p className="text-3xl font-bold text-red-600 tracking-tight">
                  R$ {(currentMonth.saida / 1000).toFixed(0)}k
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium uppercase tracking-wide mb-2">Saldo Atual</p>
                <p className="text-3xl font-bold text-blue-600 tracking-tight">
                  R$ {(currentMonth.saldo / 1000).toFixed(0)}k
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Crescimento</p>
                <div className="flex items-center gap-1">
                  <p className={`text-2xl font-bold ${parseFloat(growthRate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growthRate}%
                  </p>
                  <Badge className={parseFloat(growthRate) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {parseFloat(growthRate) >= 0 ? '+' : ''}{growthRate}%
                  </Badge>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800">
            Evolução do Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${(Number(value) / 1000).toFixed(0)}k`, '']} />
              <Line 
                type="monotone" 
                dataKey="entrada" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Entradas"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="saida" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Saídas"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Saldo"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fluxo Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800">
            Saldo por Semana - Janeiro 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${(Number(value) / 1000).toFixed(1)}k`, 'Saldo']} />
              <Bar 
                dataKey="saldo" 
                fill="#64748b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Projeções */}
      <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <CardContent className="p-6">
          <h4 className="text-lg font-bold mb-4">Projeções Financeiras</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold mb-1">R$ 112k</div>
              <div className="text-slate-300 text-sm">Previsão Fevereiro</div>
              <div className="text-green-300 text-xs">+7% vs Janeiro</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">R$ 32k</div>
              <div className="text-slate-300 text-sm">Saldo Projetado</div>
              <div className="text-green-300 text-xs">+18% crescimento</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">3.2x</div>
              <div className="text-slate-300 text-sm">Múltiplo de Cobertura</div>
              <div className="text-green-300 text-xs">Situação excelente</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}