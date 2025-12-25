import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

export class Helpers {
  // Hash de senha
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
    return await bcrypt.hash(password, salt);
  }

  // Verificar senha
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Gerar token JWT
  static generateToken(payload: any, expiresIn: string = process.env.JWT_EXPIRES_IN || '24h'): string {
    return jwt.sign(payload, process.env.JWT_SECRET || '', { expiresIn });
  }

  // Verificar token JWT
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || '');
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  // Gerar refresh token
  static generateRefreshToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || '', { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' 
    });
  }

  // Extrair token do header
  static extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  // Formatar data
  static formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Gerar número de processo único
  static generateProcessNumber(tipo: string, count: number): string {
    const prefix = tipo === 'aluno' ? 'AL' : tipo === 'professor' ? 'PROF' : tipo === 'admin' ? 'ADMIN' : 'USER';
    const sequence = (count + 1).toString().padStart(6, '0');
    return `${prefix}${sequence}`;
  }

  // Calcular média
  static calculateAverage(notas: any[]): number {
    if (notas.length === 0) return 0;
    
    const total = notas.reduce((sum, nota) => {
      return sum + (nota.valor * nota.peso);
    }, 0);
    
    const totalPeso = notas.reduce((sum, nota) => sum + nota.peso, 0);
    
    return totalPeso > 0 ? total / totalPeso : 0;
  }

  // Validar email
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Sanitizar dados
  static sanitize(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const key in data) {
        sanitized[key] = this.sanitize(data[key]);
      }
      return sanitized;
    }
    return data;
  }

  // Gerar resposta padronizada
  static apiResponse(success: boolean, data?: any, message?: string, error?: any) {
    return {
      success,
      data: data || null,
      message: message || (success ? 'Operação realizada com sucesso' : 'Erro na operação'),
      error: error || null,
      timestamp: new Date().toISOString()
    };
  }
}

export default Helpers;