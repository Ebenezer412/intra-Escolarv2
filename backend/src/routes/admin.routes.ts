import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Apenas admin e diretor podem acessar estas rotas
router.use(authenticate);
router.use(authorize('admin', 'diretor'));

// Dashboard administrativo
router.get('/dashboard', AdminController.getDashboard);

// Gestão de usuários
router.get('/usuarios', AdminController.getUsuarios);
router.get('/usuarios/:id', AdminController.getUsuario);
router.post('/usuarios', AdminController.criarUsuario);
router.put('/usuarios/:id', AdminController.atualizarUsuario);
router.put('/usuarios/:id/redefinir-senha', AdminController.redefinirSenhaUsuario);
router.delete('/usuarios/:id', AdminController.desativarUsuario);

// Gestão de turmas
router.get('/turmas', AdminController.getTurmas);
router.get('/turmas/:id', AdminController.getTurma);
router.post('/turmas', AdminController.criarTurma);
router.put('/turmas/:id', AdminController.atualizarTurma);
router.delete('/turmas/:id', AdminController.excluirTurma);

// Gestão de disciplinas
router.get('/disciplinas', AdminController.getDisciplinas);
router.post('/disciplinas', AdminController.criarDisciplina);
router.put('/disciplinas/:id', AdminController.atualizarDisciplina);
router.delete('/disciplinas/:id', AdminController.excluirDisciplina);

// Matrículas
router.post('/matriculas/massa', AdminController.realizarMatriculas);
router.get('/matriculas/turma/:turma_id', AdminController.getMatriculasTurma);

// Configurações do sistema
router.get('/configuracoes', AdminController.getConfiguracoes);
router.put('/configuracoes', AdminController.atualizarConfiguracoes);

// Relatórios
router.get('/relatorios/estatisticas', AdminController.getEstatisticas);
router.get('/relatorios/financeiro', AdminController.getRelatorioFinanceiro);

export default router;