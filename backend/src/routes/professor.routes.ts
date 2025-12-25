import express from 'express';
import { ProfessorController } from '../controllers/professor.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Middleware para professor, coordenador, admin e diretor
router.use(authenticate);
router.use(authorize('professor', 'coordenador', 'admin', 'diretor'));

// Dashboard do professor
router.get('/dashboard', ProfessorController.getDashboard);

// Turmas
router.get('/turmas', ProfessorController.getTurmas);
router.get('/turmas/:turma_id/alunos', ProfessorController.getAlunosTurma);

// Notas
router.post('/notas', ProfessorController.registrarNota);
router.put('/notas/:nota_id', ProfessorController.atualizarNota);
router.delete('/notas/:nota_id', ProfessorController.excluirNota);

// Frequências
router.post('/frequencias/massa', ProfessorController.registrarFrequenciasMassa);
router.get('/frequencias/turma/:turma_id', ProfessorController.getFrequenciasTurma);

// Materiais didáticos
router.get('/materiais', ProfessorController.getMateriais);
router.post('/materiais', ProfessorController.adicionarMaterial);
router.delete('/materiais/:material_id', ProfessorController.excluirMaterial);

// Horário
router.get('/horario', ProfessorController.getHorario);

// Relatórios
router.get('/relatorios/turma/:turma_id', ProfessorController.getRelatorioTurma);

export default router;