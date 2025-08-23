import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { DEFAULT_CATEGORIES, getIconForCategory } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function Categories() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: "#2563eb",
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const categoryData = {
        ...data,
        icon: getIconForCategory(data.name)
      };
      await apiRequest('POST', '/api/categories', categoryData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao criar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      const categoryData = {
        ...data,
        icon: getIconForCategory(data.name)
      };
      await apiRequest('PUT', `/api/categories/${id}`, categoryData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });
      form.reset();
      setIsDialogOpen(false);
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao atualizar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/categories/${id}`, null);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao excluir categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      color: category.color,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const handleCreateFromDefault = (defaultCategory: any) => {
    createCategoryMutation.mutate({
      name: defaultCategory.name,
      color: defaultCategory.color,
    });
  };

  if (isLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Categorias" 
          subtitle="Organize seus gastos e receitas" 
        />
        
        <div className="p-6 space-y-6">
          {/* Create Category Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suas Categorias
            </h3>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => {
                    setEditingCategory(null);
                    form.reset();
                  }}
                  data-testid="button-new-category"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Mercado, Transporte..." data-testid="input-category-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Preview do ícone que será atribuído automaticamente */}
                    <div className="space-y-2">
                      <FormLabel>Ícone (Automático)</FormLabel>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: form.watch('color') + '20', color: form.watch('color') }}
                        >
                          <i className={`${form.watch('name') ? getIconForCategory(form.watch('name')) : 'fas fa-tag'} text-sm`}></i>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {form.watch('name') ? 
                            `Ícone será: ${getIconForCategory(form.watch('name'))}` : 
                            'Digite o nome para ver o ícone'
                          }
                        </span>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor</FormLabel>
                          <FormControl>
                            <Input {...field} type="color" data-testid="input-category-color" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel-category"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        data-testid="button-save-category"
                      >
                        {createCategoryMutation.isPending || updateCategoryMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* User Categories */}
          <Card className="financial-card">
            <CardContent className="p-6">
              {categoriesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div 
                      key={category.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                      data-testid={`category-card-${category.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: category.color + '20', color: category.color }}
                          >
                            <i className={`${category.icon} text-sm`}></i>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white" data-testid={`category-name-${category.id}`}>
                            {category.name}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(category)}
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Tag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhuma categoria encontrada
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Crie suas primeiras categorias para organizar melhor suas finanças
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Default Categories Suggestions */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Categorias Sugeridas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEFAULT_CATEGORIES.map((defaultCategory, index) => {
                  const alreadyExists = categories?.some(cat => 
                    cat.name.toLowerCase() === defaultCategory.name.toLowerCase()
                  );
                  
                  return (
                    <div 
                      key={index}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                      data-testid={`suggested-category-${index}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: defaultCategory.color + '20', color: defaultCategory.color }}
                          >
                            <i className={`${defaultCategory.icon} text-sm`}></i>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {defaultCategory.name}
                          </span>
                        </div>
                        
                        {alreadyExists ? (
                          <span className="text-xs text-green-600 font-medium">Adicionada</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateFromDefault(defaultCategory)}
                            disabled={createCategoryMutation.isPending}
                            data-testid={`button-add-suggested-${index}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
