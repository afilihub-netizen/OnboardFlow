import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Mail, Eye, EyeOff, AlertCircle, User, Users, Building, Loader2, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    accountType: 'individual' as 'individual' | 'family' | 'business',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          window.location.href = '/';
        } else {
          setSuccess(data.message);
          setIsLogin(true);
          setFormData({ email: '', password: '', firstName: '', lastName: '', accountType: 'individual' });
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                <TrendingUp className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                FinanceFlow
              </h1>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Seguro & Confiável</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta gratuita'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isLogin ? 'Entre para acessar seu painel financeiro' : 'Comece a organizar suas finanças hoje mesmo'}
            </p>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl shadow-gray-900/10 dark:shadow-black/20">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {isLogin 
                ? 'Entre com seu email ou conta Google' 
                : 'Cadastre-se para começar a organizar suas finanças'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Login Button */}
            <Button
              variant="outline"
              className="w-full h-12 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
              onClick={handleGoogleLogin}
              type="button"
              data-testid="button-google-login"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Continuar com Google</span>
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com email
                </span>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nome</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Sobrenome</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Tipo de Conta</Label>
                    <RadioGroup
                      value={formData.accountType}
                      onValueChange={(value) => setFormData({ ...formData, accountType: value as any })}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <RadioGroupItem value="individual" id="individual" />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <Label htmlFor="individual" className="font-medium cursor-pointer">Individual</Label>
                            <p className="text-sm text-gray-500">Para uso pessoal</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <RadioGroupItem value="family" id="family" />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <Label htmlFor="family" className="font-medium cursor-pointer">Familiar</Label>
                            <p className="text-sm text-gray-500">Para gerenciar finanças da família</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <RadioGroupItem value="business" id="business" />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Building className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <Label htmlFor="business" className="font-medium cursor-pointer">Empresarial</Label>
                            <p className="text-sm text-gray-500">Para gestão financeira de empresas</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200"
                  placeholder="seu@email.com"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 pr-12"
                    placeholder="Sua senha segura"
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo de 6 caracteres</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-70"
                disabled={loading}
                data-testid="button-submit"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Carregando...</span>
                  </div>
                ) : (
                  <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              {isLogin ? (
                <p>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Cadastre-se
                  </button>
                </p>
              ) : (
                <p>
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Entre aqui
                  </button>
                </p>
              )}
            </div>

            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => {
                    // TODO: Implement forgot password
                    alert('Funcionalidade de recuperação de senha será implementada em breve');
                  }}
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}