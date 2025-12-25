import { Request, Response, NextFunction } from 'express';
import Helpers from '../utils/helpers';
import database from '../config/database';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

// Middleware para verificar token JWT
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = Helpers.extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    // Verificar token
    const decoded = Helpers.verifyToken(token);
    
    // Verificar se o usuário ainda existe na base de dados
    const [user] = await database.query(
      'SELECT id, numero_processo, nome_completo, email, tipo, status FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.status !== 'ativo') {
      return res.status(403).json({
        success: false,
        message: 'Usuário desativado'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    req.token = token;

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado',
      error: error.message
    });
  }
};

// Middleware para verificar permissões por tipo de usuário
export const authorize = (...allowedTypes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!allowedTypes.includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado para este tipo de usuário'
      });
    }

    next();
  };
};

// Middleware para verificar se é o próprio usuário ou admin
export const authorizeSelfOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id || req.body.id || '0');
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  // Admin tem acesso total
  if (req.user.tipo === 'admin' || req.user.tipo === 'diretor') {
    return next();
  }

  // Usuário só pode acessar seus próprios dados
  if (req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Acesso não autorizado'
    });
  }

  next();
};

// Middleware para professores acessarem seus alunos
export const authorizeTeacherAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const alunoId = parseInt(req.params.alunoId || req.body.aluno_id || '0');
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  // Admin e diretor têm acesso total
  if (req.user.tipo === 'admin' || req.user.tipo === 'diretor') {
    return next();
  }

  // Professor só pode acessar alunos das suas turmas
  if (req.user.tipo === 'professor' || req.user.tipo === 'coordenador') {
    try {
      // Verificar se o professor leciona para este aluno
      const [hasAccess] = await database.query(`
        SELECT 1 
        FROM turma_disciplina_professor tdp
        JOIN matriculas m ON tdp.turma_id = m.turma_id
        WHERE tdp.professor_id = ? AND m.aluno_id = ?
        LIMIT 1
      `, [req.user.id, alunoId]);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Professor não tem acesso a este aluno'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões',
        error
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: 'Acesso não autorizado'
    });
  }
};

// Middleware para rate limiting
export const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde'
};

// Middleware para sanitização de dados
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = Helpers.sanitize(req.body);
  }
  if (req.query) {
    req.query = Helpers.sanitize(req.query);
  }
  if (req.params) {
    req.params = Helpers.sanitize(req.params);
  }
  next();
};

// Middleware para logging de requisições
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};