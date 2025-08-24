import { useAuth } from "./useAuth";
import { useEffect, useState } from "react";

export function useBusinessTheme() {
  const { user } = useAuth();
  const isBusinessAccount = user?.accountType === 'business';
  
  // Manual business theme toggle - persisted in localStorage
  const [manualBusinessMode, setManualBusinessMode] = useState(() => {
    return localStorage.getItem('manual-business-mode') === 'true';
  });
  
  // Business theme is active if either account type is business OR manual mode is enabled
  const isBusinessThemeActive = isBusinessAccount || manualBusinessMode;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (isBusinessThemeActive) {
      // Tema empresarial - cores escuras profissionais
      root.style.setProperty('--primary', '215 28% 17%'); // Azul muito escuro
      root.style.setProperty('--primary-foreground', '0 0% 98%');
      root.style.setProperty('--secondary', '210 40% 98%');
      root.style.setProperty('--secondary-foreground', '215 28% 17%');
      root.style.setProperty('--accent', '210 100% 50%');
      root.style.setProperty('--accent-foreground', '0 0% 98%');
      root.style.setProperty('--muted', '220 13% 91%');
      root.style.setProperty('--muted-foreground', '215 25% 27%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '224 71% 4%');
      root.style.setProperty('--border', '220 13% 91%');
      root.style.setProperty('--ring', '215 28% 17%');
      
      // Estilo do corpo para tema empresarial
      body.classList.add('business-theme');
      body.style.backgroundColor = 'rgb(248, 250, 252)'; // slate-50
    } else {
      // Tema padrão - cores originais
      root.style.setProperty('--primary', '203.8863 88.2845% 53.1373%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '210 40% 95%');
      root.style.setProperty('--secondary-foreground', '210 25% 7.8431%');
      root.style.setProperty('--accent', '210 40% 98%');
      root.style.setProperty('--accent-foreground', '203.8863 88.2845% 53.1373%');
      root.style.setProperty('--muted', '210 40% 98%');
      root.style.setProperty('--muted-foreground', '210 25% 7.8431%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '210 25% 7.8431%');
      root.style.setProperty('--border', '214.3 31.8% 91.4%');
      root.style.setProperty('--ring', '203.8863 88.2845% 53.1373%');
      
      body.classList.remove('business-theme');
      body.style.backgroundColor = 'rgb(249, 250, 251)'; // gray-50
    }
  }, [isBusinessThemeActive]);

  const toggleBusinessMode = () => {
    const newMode = !manualBusinessMode;
    setManualBusinessMode(newMode);
    localStorage.setItem('manual-business-mode', newMode.toString());
  };

  return {
    isBusinessAccount,
    isBusinessThemeActive,
    manualBusinessMode,
    toggleBusinessMode,
    companyName: user?.companyName,
    industry: user?.industry,
    cnpj: user?.cnpj
  };
}