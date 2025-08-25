import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Calculator,
  Target,
  TrendingUp,
  Zap,
  DollarSign,
  Calendar,
  PieChart,
  Play,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScenarioResult {
  scenario_name: string;
  monthly_savings: number;
  months_to_goal: number;
  probability_success: number;
  projected_balance: number;
  recommendations: string[];
  risks: string[];
}

export function ScenarioSimulator() {
  const [activeScenario, setActiveScenario] = useState<'savings' | 'purchase' | 'investment'>('savings');
  const [savingsGoal, setSavingsGoal] = useState(10000);
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(3500);
  const [timeframe, setTimeframe] = useState(12);
  const [purchaseValue, setPurchaseValue] = useState(25000);
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [expectedReturn, setExpectedReturn] = useState([8]); // Slider array
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const simulateScenario = async () => {
    setIsCalculating(true);
    
    // Simular cálculo (replace with real API call)
    setTimeout(() => {
      let scenarioResult: ScenarioResult;
      
      switch (activeScenario) {
        case 'savings':
          scenarioResult = simulateSavingsScenario();
          break;
        case 'purchase':
          scenarioResult = simulatePurchaseScenario();
          break;
        case 'investment':
          scenarioResult = simulateInvestmentScenario();
          break;
        default:
          scenarioResult = simulateSavingsScenario();
      }
      
      setResult(scenarioResult);
      setIsCalculating(false);
      
      toast({
        title: "Simulação Concluída",
        description: "Confira os resultados e recomendações abaixo",
      });
    }, 1500);
  };

  const simulateSavingsScenario = (): ScenarioResult => {
    const availableForSavings = monthlyIncome - monthlyExpenses;
    const monthlySavingsNeeded = savingsGoal / timeframe;
    const probabilitySuccess = availableForSavings >= monthlySavingsNeeded ? 
      Math.min(0.95, (availableForSavings / monthlySavingsNeeded) * 0.8) : 
      (availableForSavings / monthlySavingsNeeded) * 0.6;
    
    return {
      scenario_name: `Meta de Poupança: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(savingsGoal)}`,
      monthly_savings: Math.min(availableForSavings, monthlySavingsNeeded),
      months_to_goal: availableForSavings >= monthlySavingsNeeded ? timeframe : Math.ceil(savingsGoal / availableForSavings),
      probability_success: probabilitySuccess,
      projected_balance: availableForSavings * timeframe,
      recommendations: [
        probabilitySuccess > 0.8 ? 
          "✅ Meta realista! Continue com disciplina" : 
          "⚠️ Meta desafiadora - considere aumentar a receita ou reduzir gastos",
        `💡 Economize R$ ${Math.round(monthlySavingsNeeded)} por mês`,
        "🎯 Configure transferência automática para poupança",
        "📊 Monitore mensalmente o progresso"
      ],
      risks: probabilitySuccess < 0.6 ? [
        "Risco alto de não atingir a meta no prazo",
        "Gastos inesperados podem comprometer o plano",
        "Necessário revisão do orçamento"
      ] : []
    };
  };

  const simulatePurchaseScenario = (): ScenarioResult => {
    const availableForSavings = monthlyIncome - monthlyExpenses;
    const monthsNeeded = Math.ceil(purchaseValue / availableForSavings);
    const probability = availableForSavings > 0 ? Math.min(0.9, 1 / (monthsNeeded / 12)) : 0.1;
    
    return {
      scenario_name: `Compra: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(purchaseValue)}`,
      monthly_savings: availableForSavings,
      months_to_goal: monthsNeeded,
      probability_success: probability,
      projected_balance: availableForSavings * monthsNeeded,
      recommendations: [
        monthsNeeded <= 24 ? "✅ Prazo realista para a compra" : "⚠️ Considere financiamento ou aumentar a renda",
        "💡 Pesquise preços e aguarde promoções",
        "🎯 Avalie se é realmente necessário ou apenas desejo",
        "📅 Planeje a compra para evitar comprometer outras metas"
      ],
      risks: monthsNeeded > 36 ? [
        "Muito tempo para juntar o valor",
        "Inflação pode aumentar o preço",
        "Outras emergências podem surgir"
      ] : []
    };
  };

  const simulateInvestmentScenario = (): ScenarioResult => {
    const annualReturn = expectedReturn[0] / 100;
    const monthlyReturn = annualReturn / 12;
    const futureValue = investmentAmount * Math.pow(1 + annualReturn, timeframe / 12);
    const totalProfit = futureValue - investmentAmount;
    
    return {
      scenario_name: `Investimento: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investmentAmount)}`,
      monthly_savings: investmentAmount / timeframe,
      months_to_goal: timeframe,
      probability_success: expectedReturn[0] <= 10 ? 0.8 : expectedReturn[0] <= 15 ? 0.6 : 0.4,
      projected_balance: futureValue,
      recommendations: [
        expectedReturn[0] <= 12 ? "✅ Expectativa de retorno conservadora" : "⚠️ Retorno otimista - considere cenários mais conservadores",
        "💰 Diversifique os investimentos",
        "📈 Reinvista os dividendos/juros",
        "⏰ Mantenha disciplina e não resgate antes do prazo"
      ],
      risks: expectedReturn[0] > 12 ? [
        "Volatilidade alta do mercado",
        "Possibilidade de perdas temporárias",
        "Retornos podem ser menores que o esperado"
      ] : [
        "Inflação pode corroer o poder de compra",
        "Oportunidades melhores podem surgir"
      ]
    };
  };

  const resetSimulation = () => {
    setResult(null);
    setSavingsGoal(10000);
    setMonthlyIncome(5000);
    setMonthlyExpenses(3500);
    setTimeframe(12);
    setPurchaseValue(25000);
    setInvestmentAmount(1000);
    setExpectedReturn([8]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-green-600';
    if (probability >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProbabilityLabel = (probability: number) => {
    if (probability >= 0.8) return 'Alta';
    if (probability >= 0.6) return 'Média';
    return 'Baixa';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              Simulador de Cenários Financeiros
            </div>
            <Button onClick={resetSimulation} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Simule diferentes cenários financeiros e veja a probabilidade de sucesso de suas metas
          </p>
          
          {/* Dados Base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="income">Renda Mensal</Label>
              <Input
                id="income"
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="expenses">Gastos Mensais</Label>
              <Input
                id="expenses"
                type="number"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-sm text-slate-600">
              💰 Disponível para objetivos: <span className="font-bold text-green-600">
                {formatCurrency(monthlyIncome - monthlyExpenses)}
              </span> por mês
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cenários */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeScenario} onValueChange={(value) => setActiveScenario(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="savings" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Poupança
              </TabsTrigger>
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Compra
              </TabsTrigger>
              <TabsTrigger value="investment" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Investimento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="savings" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="savings-goal">Meta de Poupança</Label>
                  <Input
                    id="savings-goal"
                    type="number"
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeframe">Prazo (meses)</Label>
                  <Input
                    id="timeframe"
                    type="number"
                    value={timeframe}
                    onChange={(e) => setTimeframe(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="purchase" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="purchase-value">Valor da Compra</Label>
                <Input
                  id="purchase-value"
                  type="number"
                  value={purchaseValue}
                  onChange={(e) => setPurchaseValue(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="investment" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investment-amount">Valor do Investimento</Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeframe-investment">Prazo (meses)</Label>
                  <Input
                    id="timeframe-investment"
                    type="number"
                    value={timeframe}
                    onChange={(e) => setTimeframe(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Retorno Anual Esperado: {expectedReturn[0]}%</Label>
                <Slider
                  value={expectedReturn}
                  onValueChange={setExpectedReturn}
                  max={20}
                  min={3}
                  step={0.5}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>3%</span>
                  <span>20%</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button 
              onClick={simulateScenario} 
              disabled={isCalculating}
              className="w-full"
              data-testid="simulate-scenario"
            >
              {isCalculating ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Calculando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Simular Cenário
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <div className="space-y-6">
          <Card data-testid="scenario-results">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                Resultados da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{result.scenario_name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.months_to_goal}
                    </div>
                    <div className="text-sm text-blue-700">meses para atingir</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(result.projected_balance)}
                    </div>
                    <div className="text-sm text-green-700">valor projetado</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getProbabilityColor(result.probability_success)}`}>
                      {Math.round(result.probability_success * 100)}%
                    </div>
                    <div className="text-sm text-purple-700">
                      probabilidade {getProbabilityLabel(result.probability_success)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recomendações e Riscos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Target className="w-5 h-5" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {result.risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Calendar className="w-5 h-5" />
                    Riscos e Considerações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.risks.map((risk, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm">{risk}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}