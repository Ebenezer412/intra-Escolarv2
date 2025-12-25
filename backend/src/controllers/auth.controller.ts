import { Request, Response } from 'express';
import UsuarioModel from '../models/Usuario';
import Helpers from '../utils/helpers';
import { validate, loginValidation, registerValidation } from '../utils/validators';
import database from '../config/database';

export class AuthController {
  // Login de usuário
  static async login(req: Request, res: Response) {
    try {
      await validate(loginValidation)(req, res, async () => {
        const { numero_processo, senha } = req.body;

        // Verificar credenciais
        const usuario = await UsuarioModel.verifyCredentials(numero_processo, senha);
        
        if (!usuario) {
          return res.status(401).json({
            success: false,
            message: 'Credenciais inválidas'
          });
        }

        // Gerar tokens
        const tokens = UsuarioModel.generateUserToken(usuario);

        // Registrar login
        await database.execute(
          'INSERT INTO log_acessos (usuario_id, ip_address, user_agent) VALUES (?, ?, ?)',
          [usuario.id, req.ip, req.headers['user-agent']]
        );

        res.json({
          success: true,
          message: 'Login realizado com sucesso',
          ...tokens
        });
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro no servidor',
        error: error.message
      });
    }
  }

  // Registro de usuário (primeiro acesso)
  static async register(req: Request, res: Response) {
    try {
      await validate(registerValidation)(req, res, async () => {
        const { numero_processo, senha, confirmar_senha } = req.body;

        // Verificar se o usuário já existe
        const usuarioExistente = await UsuarioModel.findByProcessNumber(numero_processo);
        
        if (!usuarioExistente) {
          return res.status(404).json({
            success: false,
            message: 'Número de processo não encontrado'
          });
        }

        // Verificar se já tem senha definida
        if (usuarioExistente.senha_hash !== '') {
          return res.status(400).json({
            success: false,
            message: 'Usuário já possui senha definida'
          });
        }

        // Verificar status
        if (usuarioExistente.status !== 'pendente') {
          return res.status(400).json({
            success: false,
            message: 'Usuário não está pendente de ativação'
          });
        }

        // Atualizar senha
        const senha_hash = await Helpers.hashPassword(senha);
        const atualizado = await UsuarioModel.update(usuarioExistente.id!, {
          senha_hash,
          status: 'ativo'
        });

        if (!atualizado) {
          return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar senha'
          });
        }

        // Gerar tokens
        const tokens = UsuarioModel.generateUserToken({
          ...usuarioExistente,
          senha_hash,
          status: 'ativo'
        });

        res.json({
          success: true,
          message: 'Registro realizado com sucesso',
          ...tokens
        });
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro no servidor',
        error: error.message
      });
    }
  }

  // Verificar token
  static async verifyToken(req: Request, res: Response) {
    try {
      const token = Helpers.extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      const decoded = Helpers.verifyToken(token);
      
      // Buscar usuário atualizado
      const [usuario] = await database.query(
        'SELECT id, numero_processo, nome_completo, email, tipo, status FROM usuarios WHERE id = ?',
        [decoded.id]
      );

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        usuario,
        message: 'Token válido'
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: error.message
      });
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token não fornecido'
        });
      }

      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || '') as any;
      
      // Buscar usuário
      const [usuario] = await database.query(
        'SELECT id, numero_processo, nome_completo, email, tipo, status FROM usuarios WHERE id = ?',
        [decoded.id]
      );

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Gerar novo token
      const payload = {
        id: usuario.id,
        numero_processo: usuario.numero_processo,
        tipo: usuario.tipo,
        nome: usuario.nome_completo
      };

      const newToken = Helpers.generateToken(payload);
      const newRefreshToken = Helpers.generateRefreshToken(payload);

      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        user: usuario
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: 'Refresh token inválido',
        error: error.message
      });
    }
  }

  // Logout
  static async logout(req: Request, res: Response) {
    try {
      const token = Helpers.extractToken(req);
      
      if (token) {
        // Aqui você poderia adicionar o token a uma blacklist
        // Para implementação simples, apenas retornamos sucesso
      }

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro no servidor',
        error: error.message
      });
    }
  }

  // Perfil do usuário
  static async getProfile(req: Request, res: Response) {
    try {
      // O middleware de autenticação já adicionou o usuário ao request
      const usuario = (req as any).user;
      
      // Buscar informações adicionais baseadas no tipo
      let informacoesAdicionais = {};
      
      switch (usuario.tipo) {
        case 'aluno':
          const [aluno] = await database.query(
            'SELECT * FROM alunos WHERE usuario_id = ?',
            [usuario.id]
          );
          informacoesAdicionais = aluno || {};
          break;
          
        case 'professor':
          const [professor] = await database.query(
            'SELECT * FROM professores WHERE usuario_id = ?',
            [usuario.id]
          );
          informacoesAdicionais = professor || {};
          break;
          
        case 'encarregado':
          // Buscar alunos vinculados
          const [alunosVinculados] = await database.query(`
            SELECT a.*, u.nome_completo as aluno_nome
            FROM alunos a
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.nome_encarregado LIKE ? OR a.telefone_encarregado = ?
          `, [`%${usuario.nome_completo}%`, usuario.telefone]);
          informacoesAdicionais = { alunos: alunosVinculados || [] };
          break;
      }

      res.json({
        success: true,
        usuario: {
          ...usuario,
          ...informacoesAdicionais
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar perfil',
        error: error.message
      });
    }
  }

  // Atualizar perfil
  static async updateProfile(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      const updates = req.body;

      // Campos permitidos para atualização
      const allowedFields = ['nome_completo', 'email', 'telefone', 'data_nascimento', 'foto_perfil'];
      const filteredUpdates: any = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo válido para atualização'
        });
      }

      const atualizado = await UsuarioModel.update(usuario.id, filteredUpdates);

      if (!atualizado) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar perfil'
        });
      }

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        updates: filteredUpdates
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar perfil',
        error: error.message
      });
    }
  }

  // Alterar senha
  static async changePassword(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      const { senha_atual, nova_senha, confirmar_senha } = req.body;

      // Validações
      if (!senha_atual || !nova_senha || !confirmar_senha) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      if (nova_senha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ter no mínimo 6 caracteres'
        });
      }

      if (nova_senha !== confirmar_senha) {
        return res.status(400).json({
          success: false,
          message: 'As senhas não coincidem'
        });
      }

      // Verificar senha atual
      const [usuarioDB] = await database.query(
        'SELECT senha_hash FROM usuarios WHERE id = ?',
        [usuario.id]
      );

      const senhaValida = await Helpers.comparePassword(senha_atual, usuarioDB.senha_hash);

      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Atualizar senha
      const atualizado = await UsuarioModel.changePassword(usuario.id, nova_senha);

      if (!atualizado) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao alterar senha'
        });
      }

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao alterar senha',
        error: error.message
      });
    }
  }

  // Recuperar senha (iniciar processo)
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email, tipo } = req.body;

      if (!email || !tipo) {
        return res.status(400).json({
          success: false,
          message: 'Email e tipo de usuário são obrigatórios'
        });
      }

      // Buscar usuário
      const [usuario] = await database.query(
        'SELECT id, numero_processo, nome_completo FROM usuarios WHERE email = ? AND tipo = ?',
        [email, tipo]
      );

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Gerar token de recuperação (válido por 1 hora)
      const resetToken = Helpers.generateToken(
        { id: usuario.id, action: 'reset_password' },
        '1h'
      );

      // Salvar token na base de dados
      await database.execute(
        'INSERT INTO password_resets (usuario_id, token, expires_at) VALUES (?, ?, ?)',
        [usuario.id, resetToken, new Date(Date.now() + 3600000)]
      );

      // TODO: Enviar email com link de recuperação
      // Em ambiente de desenvolvimento, retornamos o token
      
      res.json({
        success: true,
        message: 'Instruções de recuperação enviadas para o email',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao processar recuperação de senha',
        error: error.message
      });
    }
  }

  // Redefinir senha (com token)
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, nova_senha, confirmar_senha } = req.body;

      if (!token || !nova_senha || !confirmar_senha) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      if (nova_senha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ter no mínimo 6 caracteres'
        });
      }

      if (nova_senha !== confirmar_senha) {
        return res.status(400).json({
          success: false,
          message: 'As senhas não coincidem'
        });
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
      
      if (decoded.action !== 'reset_password') {
        return res.status(400).json({
          success: false,
          message: 'Token inválido'
        });
      }

      // Verificar se o token está na base de dados e é válido
      const [resetRecord] = await database.query(
        'SELECT * FROM password_resets WHERE token = ? AND used = false AND expires_at > NOW()',
        [token]
      );

      if (!resetRecord) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }

      // Atualizar senha
      const atualizado = await UsuarioModel.changePassword(decoded.id, nova_senha);

      if (!atualizado) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao redefinir senha'
        });
      }

      // Marcar token como usado
      await database.execute(
        'UPDATE password_resets SET used = true, used_at = NOW() WHERE token = ?',
        [token]
      );

      res.json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Token inválido',
        error: error.message
      });
    }
  }
}

export default AuthController;