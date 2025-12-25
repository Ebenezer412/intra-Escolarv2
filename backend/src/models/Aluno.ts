import database from '../config/database';

export interface IAluno {
  id: number;
  usuario_id: number;
  numero_estudante: string;
  turma_id?: number;
  ano_matricula: number;
  turno: 'manha' | 'tarde' | 'noite';
  morada?: string;
  nome_encarregado?: string;
  telefone_encarregado?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IAlunoDetalhado extends IAluno {
  usuario: {
    nome_completo: string;
    email: string;
    telefone: string;
    data_nascimento: Date;
    foto_perfil?: string;
  };
  turma?: {
    nome: string;
    ano_letivo: number;
    curso: string;
  };
}

export class AlunoModel {
  // Buscar aluno por ID
  static async findById(id: number): Promise<IAlunoDetalhado | null> {
    const [aluno] = await database.query<IAlunoDetalhado>(`
      SELECT a.*, 
             u.nome_completo, u.email, u.telefone, u.data_nascimento, u.foto_perfil,
             t.nome as turma_nome, t.ano_letivo, t.curso
      FROM alunos a
      JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN turmas t ON a.turma_id = t.id
      WHERE a.id = ?
    `, [id]);

    return aluno || null;
  }

  // Buscar aluno por ID de usuário
  static async findByUsuarioId(usuario_id: number): Promise<IAluno | null> {
    const [aluno] = await database.query<IAluno>(
      'SELECT * FROM alunos WHERE usuario_id = ?',
      [usuario_id]
    );
    return aluno || null;
  }

  // Buscar turma do aluno
  static async getTurma(aluno_id: number) {
    const [turma] = await database.query(`
      SELECT t.* 
      FROM turmas t
      JOIN alunos a ON t.id = a.turma_id
      WHERE a.id = ?
    `, [aluno_id]);

    return turma || null;
  }

  // Buscar disciplinas do aluno
  static async getDisciplinas(aluno_id: number) {
    return await database.query(`
      SELECT d.*, 
             p.nome_completo as professor_nome,
             ROUND((
               SELECT AVG(n.valor) 
               FROM notas n 
               WHERE n.disciplina_id = d.id 
               AND n.aluno_id = ?
             ), 1) as media_geral
      FROM disciplinas d
      JOIN turma_disciplina_professor tdp ON d.id = tdp.disciplina_id
      JOIN turmas t ON tdp.turma_id = t.id
      JOIN alunos a ON a.turma_id = t.id
      JOIN usuarios p ON tdp.professor_id = p.id
      WHERE a.id = ?
      GROUP BY d.id
    `, [aluno_id, aluno_id]);
  }

  // Buscar notas do aluno
  static async getNotas(aluno_id: number, disciplina_id?: number) {
    let query = `
      SELECT n.*, 
             d.nome as disciplina_nome,
             u.nome_completo as professor_nome
      FROM notas n
      JOIN disciplinas d ON n.disciplina_id = d.id
      JOIN usuarios u ON n.professor_id = u.id
      WHERE n.aluno_id = ?
    `;
    
    const params: any[] = [aluno_id];
    
    if (disciplina_id) {
      query += ' AND n.disciplina_id = ?';
      params.push(disciplina_id);
    }
    
    query += ' ORDER BY n.data_avaliacao DESC';
    
    return await database.query(query, params);
  }

  // Buscar frequências do aluno
  static async getFrequencias(aluno_id: number, mes?: number, ano?: number) {
    let query = `
      SELECT f.*,
             d.nome as disciplina_nome,
             u.nome_completo as professor_nome
      FROM frequencias f
      JOIN disciplinas d ON f.disciplina_id = d.id
      JOIN usuarios u ON f.professor_id = u.id
      WHERE f.aluno_id = ?
    `;
    
    const params: any[] = [aluno_id];
    
    if (mes && ano) {
      query += ' AND MONTH(f.data_aula) = ? AND YEAR(f.data_aula) = ?';
      params.push(mes, ano);
    }
    
    query += ' ORDER BY f.data_aula DESC';
    
    return await database.query(query, params);
  }

  // Calcular estatísticas do aluno
  static async getEstatisticas(aluno_id: number) {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // Notas
    const [notasResult] = await database.query<any>(`
      SELECT 
        COUNT(*) as total_notas,
        AVG(valor) as media_geral,
        MIN(valor) as nota_minima,
        MAX(valor) as nota_maxima
      FROM notas 
      WHERE aluno_id = ?
    `, [aluno_id]);

    // Frequências do mês atual
    const [frequenciasResult] = await database.query<any>(`
      SELECT 
        COUNT(*) as total_aulas,
        SUM(CASE WHEN status = 'presente' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN status = 'falta' THEN 1 ELSE 0 END) as faltas,
        SUM(CASE WHEN status = 'justificado' THEN 1 ELSE 0 END) as justificadas,
        SUM(CASE WHEN status = 'atraso' THEN 1 ELSE 0 END) as atrasos
      FROM frequencias 
      WHERE aluno_id = ? 
      AND MONTH(data_aula) = ? 
      AND YEAR(data_aula) = ?
    `, [aluno_id, mesAtual, anoAtual]);

    // Disciplinas
    const [disciplinasResult] = await database.query<any>(`
      SELECT COUNT(DISTINCT d.id) as total_disciplinas
      FROM disciplinas d
      JOIN turma_disciplina_professor tdp ON d.id = tdp.disciplina_id
      JOIN turmas t ON tdp.turma_id = t.id
      JOIN alunos a ON a.turma_id = t.id
      WHERE a.id = ?
    `, [aluno_id]);

    // Cálculo da percentagem de presença
    const totalAulas = frequenciasResult.total_aulas || 0;
    const presentes = frequenciasResult.presentes || 0;
    const percentagemPresenca = totalAulas > 0 ? (presentes / totalAulas) * 100 : 0;

    return {
      total_notas: notasResult.total_notas || 0,
      media_geral: parseFloat(notasResult.media_geral || 0).toFixed(1),
      nota_minima: notasResult.nota_minima || 0,
      nota_maxima: notasResult.nota_maxima || 0,
      total_disciplinas: disciplinasResult.total_disciplinas || 0,
      total_aulas: totalAulas,
      presentes: presentes,
      faltas: frequenciasResult.faltas || 0,
      justificadas: frequenciasResult.justificadas || 0,
      atrasos: frequenciasResult.atrasos || 0,
      percentagem_presenca: parseFloat(percentagemPresenca.toFixed(1))
    };
  }

  // Buscar horário do aluno
  static async getHorario(aluno_id: number) {
    return await database.query(`
      SELECT 
        h.dia_semana,
        h.hora_inicio,
        h.hora_fim,
        d.nome as disciplina_nome,
        s.nome as sala_nome,
        u.nome_completo as professor_nome
      FROM horarios h
      JOIN disciplinas d ON h.disciplina_id = d.id
      JOIN salas s ON h.sala_id = s.id
      JOIN usuarios u ON h.professor_id = u.id
      JOIN turma_disciplina_professor tdp ON d.id = tdp.disciplina_id 
        AND h.professor_id = tdp.professor_id
      JOIN turmas t ON tdp.turma_id = t.id
      JOIN alunos a ON a.turma_id = t.id
      WHERE a.id = ?
      ORDER BY 
        CASE h.dia_semana 
          WHEN 'segunda' THEN 1
          WHEN 'terca' THEN 2
          WHEN 'quarta' THEN 3
          WHEN 'quinta' THEN 4
          WHEN 'sexta' THEN 5
          WHEN 'sabado' THEN 6
          ELSE 7
        END,
        h.hora_inicio
    `, [aluno_id]);
  }

  // Buscar documentos do aluno
  static async getDocumentos(aluno_id: number) {
    return await database.query(`
      SELECT d.*
      FROM documentos d
      WHERE d.aluno_id = ? OR d.turma_id IN (
        SELECT turma_id FROM alunos WHERE id = ?
      )
      ORDER BY d.created_at DESC
    `, [aluno_id, aluno_id]);
  }

  // Buscar mensagens do aluno
  static async getMensagens(aluno_id: number, nao_lidas: boolean = false) {
    let query = `
      SELECT m.*,
             u_rem.nome_completo as remetente_nome,
             u_rem.tipo as remetente_tipo
      FROM mensagens m
      JOIN usuarios u_rem ON m.remetente_id = u_rem.id
      WHERE m.destinatario_id = ?
    `;
    
    const params: any[] = [aluno_id];
    
    if (nao_lidas) {
      query += ' AND m.lida = false';
    }
    
    query += ' ORDER BY m.created_at DESC';
    
    return await database.query(query, params);
  }
}

export default AlunoModel;