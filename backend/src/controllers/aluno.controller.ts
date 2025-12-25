import { Request, Response } from 'express';
import AlunoModel from '../models/Aluno';
import { validate } from '../utils/validators';
import database from '../config/database';

export class AlunoController {
  // Dashboard do aluno
  static async getDashboard(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      
      // Buscar aluno pelo usuário
      const aluno = await AlunoModel.findByUsuarioId(usuario.id);
      
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado'
        });
      }

      // Buscar estatísticas
      const estatisticas = await AlunoModel.getEstatisticas(aluno.id);
      
      // Buscar disciplinas
      const disciplinas = await AlunoModel.getDisciplinas(aluno.id);
      
      // Buscar próximos eventos (avaliações, etc.)
      const hoje = new Date();
      const proximaSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const [proximosEventos] = await database.query(`
        SELECT 
          'avaliacao' as tipo,
          'Avaliação: ' || d.nome as titulo,
          n.data_avaliacao as data_inicio,
          n.data_avaliacao as data_fim
        FROM notas n
        JOIN disciplinas d ON n.disciplina_id = d.id
        WHERE n.aluno_id = ? 
          AND n.data_avaliacao BETWEEN ? AND ?
        UNION ALL
        SELECT 
          'aula' as tipo,
          'Aula: ' || d.nome as titulo,
          DATE_ADD(CURDATE(), INTERVAL 
            CASE h.dia_semana 
              WHEN 'segunda' THEN 0
              WHEN 'terca' THEN 1
              WHEN 'quarta' THEN 2
              WHEN 'quinta' THEN 3
              WHEN 'sexta' THEN 4
              WHEN 'sabado' THEN 5
              ELSE 6
            END DAY) as data_inicio,
          DATE_ADD(CURDATE(), INTERVAL 
            CASE h.dia_semana 
              WHEN 'segunda' THEN 0
              WHEN 'terca' THEN 1
              WHEN 'quarta' THEN 2
              WHEN 'quinta' THEN 3
              WHEN 'sexta' THEN 4
              WHEN 'sabado' THEN 5
              ELSE 6
            END DAY) as data_fim
        FROM horarios h
        JOIN disciplinas d ON h.disciplina_id = d.id
        JOIN turma_disciplina_professor tdp ON d.id = tdp.disciplina_id
        JOIN turmas t ON tdp.turma_id = t.id
        JOIN alunos a ON a.turma_id = t.id
        WHERE a.id = ?
        ORDER BY data_inicio
        LIMIT 10
      `, [aluno.id, hoje, proximaSemana, aluno.id]);

      res.json({
        success: true,
        aluno: {
          ...aluno,
          usuario: {
            nome_completo: usuario.nome_completo,
            email: usuario.email,
            telefone: usuario.telefone
          }
        },
        estatisticas,
        disciplinas: disciplinas.slice(0, 5),
        proximos_eventos: proximosEventos
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar dashboard',
        error: error.message
      });
    }
  }

  // Notas do aluno
  static async getNotas(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      const { disciplina_id } = req.query;
      
      const aluno = await AlunoModel.findByUsuarioId(usuario.id);
      
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado'
        });
      }

      const disciplinaId = disciplina_id ? parseInt(disciplina_id as string) : undefined;
      const notas = await AlunoModel.getNotas(aluno.id, disciplinaId);

      // Agrupar notas por disciplina
      const notasPorDisciplina: any = {};
      
      for (const nota of notas) {
        if (!notasPorDisciplina[nota.disciplina_id]) {
          notasPorDisciplina[nota.disciplina_id] = {
            disciplina_id: nota.disciplina_id,
            disciplina_nome: nota.disciplina_nome,
            notas: [],
            media: 0
          };
        }
        
        notasPorDisciplina[nota.disciplina_id].notas.push(nota);
      }

      // Calcular média por disciplina
      const result = Object.values(notasPorDisciplina).map((disciplina: any) => {
        const soma = disciplina.notas.reduce((total: number, nota: any) => 
          total + (nota.valor * nota.peso), 0);
        const totalPeso = disciplina.notas.reduce((total: number, nota: any) => 
          total + nota.peso, 0);
        
        disciplina.media = totalPeso > 0 ? parseFloat((soma / totalPeso).toFixed(1)) : 0;
        return disciplina;
      });

      res.json({
        success: true,
        notas_por_disciplina: result,
        total_notas: notas.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar notas',
        error: error.message
      });
    }
  }

  // Frequências do aluno
  static async getFrequencias(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      const { mes, ano } = req.query;
      
      const aluno = await AlunoModel.findByUsuarioId(usuario.id);
      
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado'
        });
      }

      const mesAtual = mes ? parseInt(mes as string) : new Date().getMonth() + 1;
      const anoAtual = ano ? parseInt(ano as string) : new Date().getFullYear();
      
      const frequencias = await AlunoModel.getFrequencias(aluno.id, mesAtual, anoAtual);
      const estatisticas = await AlunoModel.getEstatisticas(aluno.id);

      res.json({
        success: true,
        frequencias,
        estatisticas
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar frequências',
        error: error.message
      });
    }
  }

  // Horário do aluno
  static async getHorario(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      
      const aluno = await AlunoModel.findByUsuarioId(usuario.id);
      
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado'
        });
      }

      const horario = await AlunoModel.getHorario(aluno.id);

      res.json({
        success: true,
        horario
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar horário',
        error: error.message
      });
    }
  }

  // Documentos do aluno
  static async getDocumentos(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      
      const aluno = await AlunoModel.findByUsuarioId(usuario.id);
      
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado'
        });
      }

      const documentos = await AlunoModel.getDocumentos(aluno.id);

      // Buscar boletins mensais
      const [boletins] = await database.query(`
        SELECT 
          DATE_FORMAT(n.data_avaliacao, '%Y-%m') as mes,
          d.nome as disciplina_nome,
          ROUND(AVG(n.valor), 1) as media_mensal,
          COUNT(n.id) as total_avaliacoes
        FROM notas n
        JOIN disciplinas d ON n.disciplina_id = d.id
        WHERE n.aluno_id = ?
        GROUP BY DATE_FORMAT(n.data_avaliacao, '%Y-%m'), d.id
        ORDER BY mes DESC
      `, [aluno.id]);

      res.json({
        success: true,
        documentos,
        boletins
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar documentos',
        error: error.message
      });
    }
  }

  // Mensagens do aluno
  static async getMensagens(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      const { nao_lidas } = req.query;
      
      const aluno = await AlunoModel.findByUsuarioId(usuario.id);
      
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado'
        });
      }

      const apenasNaoLidas = nao_lidas === 'true';
      const mensagens = await AlunoModel.getMensagens(aluno.id, apenasNaoLidas);

      // Contar mensagens não lidas
      const [naoLidasResult] = await database.query<any>(`
        SELECT COUNT(*) as total FROM mensagens 
        WHERE destinatario_id = ? AND lida = false
      `, [aluno.id]);

      res.json({
        success: true,
        mensagens,
        total_nao_lidas: naoLidasResult.total || 0
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar mensagens',
        error: error.message
      });
    }
  }

  // Enviar mensagem
  static async enviarMensagem(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      const { destinatario_id, assunto, conteudo } = req.body;

      if (!destinatario_id || !assunto || !conteudo) {
        return res.status(400).json({
          success: false,
          message: 'Destinatário, assunto e conteúdo são obrigatórios'
        });
      }

      // Verificar se o destinatário existe
      const [destinatario] = await database.query(
        'SELECT id FROM usuarios WHERE id = ?',
        [destinatario_id]
      );

      if (!destinatario) {
        return res.status(404).json({
          success: false,
          message: 'Destinatário não encontrado'
        });
      }

      // Inserir mensagem
      const result = await database.execute(`
        INSERT INTO mensagens (remetente_id, destinatario_id, assunto, conteudo) 
        VALUES (?, ?, ?, ?)
      `, [usuario.id, destinatario_id, assunto, conteudo]);

      res.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        mensagem_id: result.insertId
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar mensagem',
        error: error.message
      });
    }
  }

  // Marcar mensagem como lida
  static async marcarMensagemComoLida(req: Request, res: Response) {
    try {
      const usuario = (req as any).user;
      const { mensagem_id } = req.params;
      
      const aluno = await AlunoModel.findByUsuarioId(usuario.id);
      
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado'
        });
      }

      // Verificar se a mensagem pertence ao aluno
      const [mensagem] = await database.query(
        'SELECT * FROM mensagens WHERE id = ? AND destinatario_id = ?',
        [mensagem_id, aluno.id]
      );

      if (!mensagem) {
        return res.status(404).json({
          success: false,
          message: 'Mensagem não encontrada'
        });
      }

      // Marcar como lida
      await database.execute(
        'UPDATE mensagens SET lida = true, data_leitura = NOW() WHERE id = ?',
        [mensagem_id]
      );

      res.json({
        success: true,
        message: 'Mensagem marcada como lida'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao marcar mensagem como lida',
        error: error.message
      });
    }
  }
}

export default AlunoController;