import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Target, 
  Star, 
  TrendingUp, 
  Award, 
  Zap,
  Crown,
  Medal,
  Flame,
  CheckCircle2
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  category: 'revenue' | 'cost' | 'efficiency' | 'quality';
  difficulty: 'easy' | 'medium' | 'hard';
  sector: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

export function BusinessGamification() {
  const [selectedSector] = useState('varejo'); // Em produção seria dinâmico
  const [streak, setStreak] = useState(7);
  const [totalScore, setTotalScore] = useState(2850);
  const [level, setLevel] = useState(12);

  // Desafios específicos por setor
  const sectorChallenges: Record<string, Challenge[]> = {
    varejo: [
      {
        id: '1',
        title: 'Acelere o Giro de Estoque',
        description: 'Aumente o giro de estoque em 8% este mês',
        target: 8,
        current: 5.2,
        reward: '150 pontos + Badge Eficiência',
        category: 'efficiency',
        difficulty: 'medium',
        sector: 'varejo'
      },
      {
        id: '2',
        title: 'Margem de Lucro Premium',
        description: 'Mantenha margem acima de 25% por 15 dias',
        target: 15,
        current: 11,
        reward: '200 pontos + Badge Lucratividade',
        category: 'revenue',
        difficulty: 'hard',
        sector: 'varejo'
      }
    ],
    ecommerce: [
      {
        id: '3',
        title: 'ROI de Marketing Turbinado',
        description: 'Alcance ROI de marketing de 350%',
        target: 350,
        current: 285,
        reward: '180 pontos + Badge Marketing',
        category: 'efficiency',
        difficulty: 'medium',
        sector: 'ecommerce'
      }
    ],
    consultoria: [
      {
        id: '4',
        title: 'Receita Recorrente Sólida',
        description: 'Aumente receita recorrente em 12%',
        target: 12,
        current: 8.5,
        reward: '220 pontos + Badge Recorrência',
        category: 'revenue',
        difficulty: 'hard',
        sector: 'consultoria'
      }
    ]
  };

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Gestor Financeiro',
      description: 'Complete 10 desafios financeiros',
      icon: '💰',
      unlocked: true,
      date: '2025-01-15'
    },
    {
      id: '2',
      title: 'Eficiência Master',
      description: 'Reduza custos operacionais em 15%',
      icon: '⚡',
      unlocked: true,
      date: '2025-01-10'
    },
    {
      id: '3',
      title: 'Visionário de Crescimento',
      description: 'Mantenha crescimento de 20% por 3 meses',
      icon: '🚀',
      unlocked: false
    },
    {
      id: '4',
      title: 'Rei da Lucratividade',
      description: 'Alcance 30% de margem líquida',
      icon: '👑',
      unlocked: false
    }
  ];

  const currentChallenges = sectorChallenges[selectedSector] || [];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue': return 'bg-green-100 text-green-700 border-green-200';
      case 'cost': return 'bg-red-100 text-red-700 border-red-200';
      case 'efficiency': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'quality': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Score e Progresso Geral */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            Sistema de Conquistas Empresariais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalScore.toLocaleString()}</div>
              <div className="text-sm opacity-90">Pontos Totais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Nível {level}</div>
              <div className="text-sm opacity-90">Gestor Expert</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-orange-300" />
                <span className="text-2xl font-bold">{streak}</span>
              </div>
              <div className="text-sm opacity-90">Dias Consecutivos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {achievements.filter(a => a.unlocked).length}/{achievements.length}
              </div>
              <div className="text-sm opacity-90">Conquistas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desafios Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Desafios do Setor {selectedSector.charAt(0).toUpperCase() + selectedSector.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentChallenges.map((challenge) => (
              <div key={challenge.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm">{challenge.title}</h3>
                      <div className={`w-2 h-2 rounded-full ${getDifficultyColor(challenge.difficulty)}`} />
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{challenge.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progresso: {challenge.current}% de {challenge.target}%</span>
                        <span>{Math.round((challenge.current / challenge.target) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(challenge.current / challenge.target) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${getCategoryColor(challenge.category)}`}>
                    {challenge.reward}
                  </Badge>
                  {(challenge.current / challenge.target) * 100 >= 100 && (
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Coletar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conquistas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Galeria de Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`border rounded-lg p-3 text-center transition-all duration-200 ${
                    achievement.unlocked 
                      ? 'border-yellow-200 bg-yellow-50 hover:scale-105' 
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <h3 className={`font-semibold text-xs mb-1 ${
                    achievement.unlocked ? 'text-yellow-700' : 'text-gray-500'
                  }`}>
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                  {achievement.unlocked && achievement.date && (
                    <Badge variant="outline" className="text-xs">
                      {achievement.date}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Simulado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            Ranking de Gestores (Setor {selectedSector.charAt(0).toUpperCase() + selectedSector.slice(1)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { position: 1, name: 'Sua Empresa', score: totalScore, isUser: true },
              { position: 2, name: 'TechCorp Solutions', score: 2720, isUser: false },
              { position: 3, name: 'InnovateMax Ltd', score: 2680, isUser: false },
              { position: 4, name: 'Digital Masters', score: 2590, isUser: false },
              { position: 5, name: 'Growth Partners', score: 2510, isUser: false }
            ].map((entry) => (
              <div 
                key={entry.position}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  entry.isUser ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.position === 1 ? 'bg-yellow-100 text-yellow-700' :
                    entry.position === 2 ? 'bg-gray-100 text-gray-700' :
                    entry.position === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {entry.position}
                  </div>
                  <div>
                    <div className={`font-semibold ${entry.isUser ? 'text-blue-700' : 'text-slate-700'}`}>
                      {entry.name}
                    </div>
                    {entry.isUser && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs">Você</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{entry.score.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">pontos</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}