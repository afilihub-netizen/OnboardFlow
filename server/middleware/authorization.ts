import type { RequestHandler } from "express";
import { storage } from "../storage";

export interface AuthorizedRequest extends Express.Request {
  user: {
    id: string;
    email: string;
    accountType: 'individual' | 'family' | 'business';
    organizationId?: string;
    familyGroupId?: string;
    role?: string;
    permissions?: any;
  };
}

// Middleware para verificar tipo de conta específico
export const requireAccountType = (accountTypes: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const user = await storage.getUser(req.user.claims.sub);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    if (!accountTypes.includes(user.accountType || 'individual')) {
      return res.status(403).json({ 
        message: `Esta funcionalidade requer conta do tipo: ${accountTypes.join(', ')}` 
      });
    }

    // Adiciona informações do usuário ao request
    req.user = {
      ...req.user,
      id: user.id,
      email: user.email || '',
      accountType: user.accountType || 'individual',
      organizationId: user.organizationId,
      familyGroupId: user.familyGroupId,
      role: user.role
    };

    next();
  };
};

// Middleware para funcionalidades empresariais
export const requireBusiness: RequestHandler = requireAccountType(['business']);

// Middleware para funcionalidades familiares
export const requireFamily: RequestHandler = requireAccountType(['family']);

// Middleware para funcionalidades empresariais e familiares
export const requireMultiUser: RequestHandler = requireAccountType(['family', 'business']);

// Middleware para verificar permissões específicas
export const requirePermission = (permission: string): RequestHandler => {
  return async (req: any, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // Para contas individuais, permitir todas as operações
    if (req.user.accountType === 'individual') {
      return next();
    }

    // Para contas family/business, implementar verificação de permissões futuramente
    // Por enquanto, permitir acesso se for owner ou admin
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({ 
      message: `Acesso negado. Permissão necessária: ${permission}` 
    });
  };
};

// Filtros de isolamento de dados por tipo de conta
export const getDataFilter = (userId: string, accountType: string, organizationId?: string, familyGroupId?: string) => {
  const baseFilter = { userId };

  switch (accountType) {
    case 'business':
      return organizationId ? { ...baseFilter, organizationId } : baseFilter;
    case 'family':
      return familyGroupId ? { ...baseFilter, familyGroupId } : baseFilter;
    default:
      return { ...baseFilter, organizationId: null, familyGroupId: null };
  }
};