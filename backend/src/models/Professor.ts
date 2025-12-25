import database from '../config/database';

export interface IProfessor {
  id: number;
  usuario_id: number;
  numero_funcionario: string;
  departamento: string;
  especialidade?: string;
  data_contratacao: Date;
  tipo_contrato: 'efetivo' | 'contratado' | 'horista';
  carga_horaria_semanal: number;
  qualificacoes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class ProfessorModel {
  // Buscar professor por ID
  static async findById(id: number): Promise<IProfessor | null> {
    const [professor] = await database.query<IProfessor>(
      'SELECT * FROM professores WHERE id = ?',
      [id]
    );
    return professor || null;
  }

  // Buscar professor por ID de usuário
  static async findByUsuarioId(usuario_id: number): Promise<IProfessor | null> {
    const [professor] = await database.query<IProfessor>(
      'SELECT * FROM professores WHERE usuario_id = ?',
      [usuario_id]
    );
    return professor || null;
  }

  // Buscar turmas do professor
  static async getTurmas(professor_id: number) {
    return await database.query(`
      SELECT t.*, 
             d.nome as disciplina_nome,
             COUNT(DISTINCT m.aluno_id) as total_alunos
      FROM turmas t
      JOIN turma_disciplina_professor tdp ON t.id = tdp.turma_id
      JOIN disciplinas d ON tdp.disciplina_id = d.id
      LEFT JOIN matriculas m ON t.id = m.turma_id
      WHERE tdp.professor_id = ?
      GROUP BY t.id, d.id
      ORDER BY t.ano_letivo DESC, t.nome
    `, [professor_id]);
  }

  // Buscar alunos da turma
  static async getAlunosTurma(professor_id: number, turma_id: number) {
    return await database.query(`
      SELECT a.*,
             u.nome_completo,
             u.email,
             u.telefone,
             ROUND((
               SELECT AVG(n.valor) 
               FROM notas n 
               WHERE n.aluno_id = a.id 
               AND n.disciplina_id IN (
                 SELECT disciplina_id 
                 FROM turma_disciplina_professor 
                 WHERE professor_id = ? AND turma_id = ?
               )
             ), 1) as media_geral
      FROM alunos a
      JOIN usuarios u ON a.usuario_id = u.id
      JOIN matriculas m ON a.id = m.aluno_id
      WHERE m.turma_id = ?
      ORDER BY u.nome_completo
    `, [professor_id, turma_id, turma_id]);
  }

  // Registrar nota
  static async registrarNota(notaData: {
    aluno_id: number;
    disciplina_id: number;
    professor_id: number;
    valor: number;
    tipo_avaliacao: string;
    peso: number;
    descricao?: string;
    data_avaliacao: Date;
  }) {
    const query = `
      INSERT INTO notas (
        aluno_id, disciplina_id, professor_id, valor, 
        tipo_avaliacao, peso, descricao, data_avaliacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await database.execute(query, [
      notaData.aluno_id,
      notaData.disciplina_id,
      notaData.professor_id,
      notaData.valor,
      notaData.tipo_avaliacao,
      notaData.peso,
      notaData.descricao || null,
      notaData.data_avaliacao
    ]);

    return { id: result.insertId, ...notaData };
  }

  // Registrar frequência em massa
  static async registrarFrequenciasMassa(frequenciasData: {
    turma_id: number;
    disciplina_id: number;
    professor_id: number;
    data_aula: Date;
    presencas: Array<{
      aluno_id: number;
      status: string;
      justificativa?: string;
    }>;
  }) {
    return await database.transaction(async (connection) => {
      const values = frequenciasData.presencas.map(presenca => [
        presenca.aluno_id,
        frequenciasData.disciplina_id,
        frequenciasData.professor_id,
        frequenciasData.data_aula,
        presenca.status,
        presenca.justificativa || null
      ]);

      if (values.length === 0) return [];

      const query = `
        INSERT INTO frequencias 
          (aluno_id, disciplina_id, professor_id, data_aula, status, justificativa) 
        VALUES ?
      `;

      const [result] = await connection.execute(query, [values]);
      return result;
    });
  }

  // Buscar materiais do professor
  static async getMateriais(professor_id: number) {
    return await database.query(`
      SELECT m.*,
             d.nome as disciplina_nome
      FROM materiais_didaticos m
      LEFT JOIN disciplinas d ON m.disciplina_id = d.id
      WHERE m.professor_id = ?
      ORDER BY m.created_at DESC
    `, [professor_id]);
  }

  // Adicionar material
  static async adicionarMaterial(materialData: {
    professor_id: number;
    titulo: string;
    descricao: string;
    tipo: string;
    disciplina_id?: number;
    turma_id?: number;
    arquivo_url: string;
    tamanho_arquivo?: number;
  }) {
    const query = `
      INSERT INTO materiais_didaticos (
        professor_id, titulo, descricao, tipo, 
        disciplina_id, turma_id, arquivo_url, tamanho_arquivo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await database.execute(query, [
      materialData.professor_id,
      materialData.titulo,
      materialData.descricao,
      materialData.tipo,
      materialData.disciplina_id || null,
      materialData.turma_id || null,
      materialData.arquivo_url,
      materialData.tamanho_arquivo || null
    ]);

    return { id: result.insertId, ...materialData };
  }

  // Gerar relatório da turma
  static async getRelatorioTurma(professor_id: number, turma_id: number) {
    // Notas por aluno
    const notas = await database.query(`
      SELECT 
        a.id as aluno_id,
        u.nome_completo as aluno_nome,
        d.nome as disciplina_nome,
        COUNT(n.id) as total_avaliacoes,
        AVG(n.valor) as media_geral,
        MIN(n.valor) as nota_minima,
        MAX(n.valor) as nota_maxima
      FROM alunos a
      JOIN usuarios u ON a.usuario_id = u.id
      JOIN matriculas m ON a.id = m.aluno_id
      JOIN turma_disciplina_professor tdp ON m.turma_id = tdp.turma_id
      JOIN disciplinas d ON tdp.disciplina_id = d.id
      LEFT JOIN notas n ON a.id = n.aluno_id AND d.id = n.disciplina_id
      WHERE m.turma_id = ? AND tdp.professor_id = ?
      GROUP BY a.id, d.id
      ORDER BY u.nome_completo
    `, [turma_id, professor_id]);

    // Frequências por aluno
    const frequencias = await database.query(`
      SELECT 
        a.id as aluno_id,
        u.nome_completo as aluno_nome,
        COUNT(f.id) as total_aulas,
        SUM(CASE WHEN f.status = 'presente' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN f.status = 'falta' THEN 1 ELSE 0 END) as faltas,
        ROUND((SUM(CASE WHEN f.status = 'presente' THEN 1 ELSE 0 END) / COUNT(f.id)) * 100, 1) as percentagem_presenca
      FROM alunos a
      JOIN usuarios u ON a.usuario_id = u.id
      JOIN matriculas m ON a.id = m.aluno_id
      JOIN frequencias f ON a.id = f.aluno_id
      JOIN turma_disciplina_professor tdp ON f.disciplina_id = tdp.disciplina_id 
        AND f.professor_id = tdp.professor_id
      WHERE m.turma_id = ? AND tdp.professor_id = ?
      GROUP BY a.id
      ORDER BY u.nome_completo
    `, [turma_id, professor_id]);

    // Estatísticas gerais
    const [estatisticas] = await database.query<any>(`
      SELECT 
        COUNT(DISTINCT a.id) as total_alunos,
        COUNT(DISTINCT n.id) as total_notas,
        AVG(n.valor) as media_geral_turma,
        (SELECT COUNT(DISTINCT f.id) FROM frequencias f 
         JOIN turma_disciplina_professor tdp ON f.disciplina_id = tdp.disciplina_id 
         WHERE tdp.turma_id = ? AND tdp.professor_id = ?) as total_aulas
      FROM alunos a
      JOIN matriculas m ON a.id = m.aluno_id
      LEFT JOIN notas n ON a.id = n.aluno_id
      JOIN turma_disciplina_professor tdp ON n.disciplina_id = tdp.disciplina_id 
        AND n.professor_id = tdp.professor_id
      WHERE m.turma_id = ? AND tdp.professor_id = ?
    `, [turma_id, professor_id, turma_id, professor_id]);

    return {
      notas,
      frequencias,
      estatisticas: {
        total_alunos: estatisticas.total_alunos || 0,
        total_notas: estatisticas.total_notas || 0,
        media_geral_turma: parseFloat(estatisticas.media_geral_turma || 0).toFixed(1),
        total_aulas: estatisticas.total_aulas || 0
      }
    };
  }

  // Buscar horário do professor
  static async getHorario(professor_id: number) {
    return await database.query(`
      SELECT 
        h.dia_semana,
        h.hora_inicio,
        h.hora_fim,
        d.nome as disciplina_nome,
        s.nome as sala_nome,
        t.nome as turma_nome
      FROM horarios h
      JOIN disciplinas d ON h.disciplina_id = d.id
      JOIN salas s ON h.sala_id = s.id
      JOIN turma_disciplina_professor tdp ON d.id = tdp.disciplina_id 
        AND h.professor_id = tdp.professor_id
      JOIN turmas t ON tdp.turma_id = t.id
      WHERE h.professor_id = ?
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
    `, [professor_id]);
  }
}

export default ProfessorModel;