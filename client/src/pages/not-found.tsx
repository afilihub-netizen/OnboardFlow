import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <BackButton to="/" label="Voltar ao Início" className="mb-4" />
        <Card className="w-full">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 - Página Não Encontrada</h1>
              <p className="text-sm text-gray-600">
                A página que você está procurando não existe ou foi movida.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
