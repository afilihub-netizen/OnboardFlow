import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { Building2 } from "lucide-react";

export function BusinessModeIndicator() {
  const { isBusinessAccount } = useBusinessTheme();

  if (!isBusinessAccount) {
    return null;
  }

  return (
    <div className="business-mode-indicator">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        <span>MODO EMPRESARIAL</span>
      </div>
    </div>
  );
}