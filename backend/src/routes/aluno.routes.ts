import express from 'express';
import { AlunoController } from '../controllers/aluno.controller';
import { authenticate, authorize, authorizeSelfOrAdmin } from '../middleware/auth';

const router = express.Router();

// Todas as rotas exigem autenticação e permissão de aluno
router.use(authenticate);
router.use(authorize('aluno'));

// Dashboard e informações gerais
router.get('/dashboard', AlunoController.getDashboard);
router.get('/notas', AlunoController.getNotas);
router.get('/frequencias', AlunoController.getFrequencias);
router.get('/horario', AlunoController.getHorario);
router.get('/documentos', AlunoController.getDocumentos);

// Mensagens
router.get('/mensagens', AlunoController.getMensagens);
router.post('/mensagens', AlunoController.enviarMensagem);
router.put('/mensagens/:mensagem_id/ler', AlunoController.marcarMensagemComoLida);

export default router;