import database from '../config/database';
import Helpers from '../utils/helpers';

export interface IUsuario {
  id?: number;
  numero_processo: string;
  senha_hash: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  data_nascimento?: Date;
  tipo: 'aluno' | 'professor' | 'admin' | 'diretor' | 'coordenador' | 'encarregado';
  status: 'ativo' | 'inativo' | 'pendente';
  foto_perfil?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class UsuarioModel {
  // Criar usuário
  static async create(usuario: Omit<IUsuario, 'id' | 'created_at' | 'updated_at'>): Promise<IUsuario> {
    const query = `
      INSERT INTO usuarios (
        numero_processo, senha_hash, nome_completo, email, telefone, 
        data_nascimento, tipo, status, foto_perfil
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      usuario.numero_processo,
      usuario.senha_hash,
      usuario.nome_completo,
      usuario.email,
      usuario.telefone || null,
      usuario.data_nascimento || null,
      usuario.tipo,
      usuario.status || 'ativo',
      usuario.foto_perfil || null
    ];

    const result = await database.execute(query, params);
    
    return {
      id: result.insertId,
      ...usuario,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  // Encontrar por ID
  static async findById(id: number): Promise<IUsuario | null> {
    const [usuario] = await database.query<IUsuario>(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );
    return usuario || null;
  }

  // Encontrar por número de processo
  static async findByProcessNumber(numero_processo: string): Promise<IUsuario | null> {
    const [usuario] = await database.query<IUsuario>(
      'SELECT * FROM usuarios WHERE numero_processo = ?',
      [numero_processo]
    );
    return usuario || null;
  }

  // Encontrar por email
  static async findByEmail(email: string): Promise<IUsuario | null> {
    const [usuario] = await database.query<IUsuario>(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return usuario || null;
  }

  // Atualizar usuário
  static async update(id: number, updates: Partial<IUsuario>): Promise<boolean> {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date());
    values.push(id);

    const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
    
    const result = await database.execute(query, values);
    return result.affectedRows > 0;
  }

  // Desativar usuário
  static async deactivate(id: number): Promise<boolean> {
    const result = await database.execute(
      'UPDATE usuarios SET status = "inativo", updated_at = ? WHERE id = ?',
      [new Date(), id]
    );
    return result.affectedRows > 0;
  }

  // Listar usuários com filtros
  static async list(filters: {
    tipo?: string;
    status?: string;
    turma_id?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<{ usuarios: IUsuario[]; total: number }> {
    const { tipo, status, turma_id, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    
    let whereClauses: string[] = [];
    const params: any[] = [];

    if (tipo) {
      whereClauses.push('tipo = ?');
      params.push(tipo);
    }

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (turma_id && tipo === 'aluno') {
      whereClauses.push('EXISTS (SELECT 1 FROM matriculas WHERE aluno_id = usuarios.id AND turma_id = ?)');
      params.push(turma_id);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Contar total
    const [countResult] = await database.query<any>(
      `SELECT COUNT(*) as total FROM usuarios ${where}`,
      params
    );

    // Buscar usuários
    const query = `
      SELECT * FROM usuarios 
      ${where}
      ORDER BY nome_completo
      LIMIT ? OFFSET ?
    `;

    const usuarios = await database.query<IUsuario>(query, [...params, limit, offset]);

    return {
      usuarios,
      total: countResult.total
    };
  }

  // Alterar senha
  static async changePassword(id: number, newPassword: string): Promise<boolean> {
    const senha_hash = await Helpers.hashPassword(newPassword);
    
    const result = await database.execute(
      'UPDATE usuarios SET senha_hash = ?, updated_at = ? WHERE id = ?',
      [senha_hash, new Date(), id]
    );
    
    return result.affectedRows > 0;
  }

  // Verificar credenciais
  static async verifyCredentials(numero_processo: string, password: string): Promise<IUsuario | null> {
    const usuario = await this.findByProcessNumber(numero_processo);
    
    if (!usuario || usuario.status !== 'ativo') {
      return null;
    }

    const isValid = await Helpers.comparePassword(password, usuario.senha_hash);
    
    return isValid ? usuario : null;
  }

  // Gerar token para usuário
  static generateUserToken(usuario: IUsuario): { token: string; refreshToken: string; user: any } {
    const payload = {
      id: usuario.id,
      numero_processo: usuario.numero_processo,
      tipo: usuario.tipo,
      nome: usuario.nome_completo
    };

    return {
      token: Helpers.generateToken(payload),
      refreshToken: Helpers.generateRefreshToken(payload),
      user: {
        id: usuario.id,
        numero_processo: usuario.numero_processo,
        nome_completo: usuario.nome_completo,
        email: usuario.email,
        tipo: usuario.tipo,
        status: usuario.status
      }
    };
  }
}

export default UsuarioModel;