import { useAuth } from "./useAuth";
import { useEffect } from "react";

export function useBusinessTheme() {
  const { user } = useAuth();
  const isBusinessAccount = user?.accountType === 'business';

  useEffect(() => {
    const root = document.documentElement;
    
    if (isBusinessAccount) {
      // Tema empresarial - cores azul corporativo
      root.style.setProperty('--primary', '27 100% 20%'); // Azul escuro
      root.style.setProperty('--primary-foreground', '0 0% 98%');
      root.style.setProperty('--secondary', '210 40% 95%'); // Azul muito claro
      root.style.setProperty('--secondary-foreground', '27 100% 20%');
      root.style.setProperty('--accent', '210 100% 50%'); // Azul vibrante
      root.style.setProperty('--accent-foreground', '0 0% 98%');
      root.style.setProperty('--muted', '210 20% 94%');
      root.style.setProperty('--muted-foreground', '215 25% 27%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '224 71% 4%');
      root.style.setProperty('--border', '210 20% 82%');
      root.style.setProperty('--ring', '27 100% 20%');
      
      // Adicionar classe ao body para estilos empresariais
      document.body.classList.add('business-theme');
    } else {
      // Tema padrão - cores originais
      root.style.setProperty('--primary', '142 86% 28%'); // Verde original
      root.style.setProperty('--primary-foreground', '355 100% 97%');
      root.style.setProperty('--secondary', '210 40% 95%');
      root.style.setProperty('--secondary-foreground', '222 47% 11%');
      root.style.setProperty('--accent', '210 40% 95%');
      root.style.setProperty('--accent-foreground', '222 47% 11%');
      root.style.setProperty('--muted', '210 40% 95%');
      root.style.setProperty('--muted-foreground', '215 25% 27%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '224 71% 4%');
      root.style.setProperty('--border', '214 32% 91%');
      root.style.setProperty('--ring', '142 86% 28%');
      
      document.body.classList.remove('business-theme');
    }
  }, [isBusinessAccount]);

  return {
    isBusinessAccount,
    companyName: user?.companyName,
    industry: user?.industry,
    cnpj: user?.cnpj
  };
}