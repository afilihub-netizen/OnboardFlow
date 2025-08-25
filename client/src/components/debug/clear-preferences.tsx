import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";

interface ClearPreferencesProps {
  onClear: () => void;
}

export function ClearPreferences({ onClear }: ClearPreferencesProps) {
  const handleClear = () => {
    localStorage.removeItem('financeflow_business_preferences');
    onClear();
    window.location.reload();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset Configuração
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resetar Configurações?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá remover todas as suas preferências salvias e exibir o wizard de configuração novamente.
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear} className="bg-red-600 hover:bg-red-700">
            Resetar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}