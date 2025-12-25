-- ========== SEED DE DADOS PARA TESTES ==========
USE imel_intranet;

-- Limpar dados existentes (cuidado: isso apaga tudo!)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE log_acessos;
TRUNCATE TABLE password_resets;
TRUNCATE TABLE mensagens;
TRUNCATE TABLE documentos;
TRUNCATE TABLE materiais_didaticos;
TRUNCATE TABLE eventos;
TRUNCATE TABLE frequencias;
TRUNCATE TABLE notas;
TRUNCATE TABLE horarios;
TRUNCATE TABLE turma_disciplina_professor;
TRUNCATE TABLE matriculas;
TRUNCATE TABLE alunos;
TRUNCATE TABLE professores;
TRUNCATE TABLE disciplinas;
TRUNCATE TABLE turmas;
TRUNCATE TABLE salas;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ========== USUÁRIOS ==========
-- Senha padrão para todos: "senha123" (hash: $2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW)
INSERT INTO usuarios (numero_processo, senha_hash, nome_completo, email, telefone, data_nascimento, tipo, status, foto_perfil) VALUES
-- Administradores
('ADMIN001', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Administrador Principal', 'admin@imel.edu.ao', '+244 922 123 456', '1980-01-15', 'admin', 'ativo', NULL),
('ADMIN002', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Suporte Técnico', 'suporte@imel.edu.ao', '+244 923 456 789', '1985-03-22', 'admin', 'ativo', NULL),

-- Diretores
('DIR001', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Dr. Manuel António', 'diretor@imel.edu.ao', '+244 924 111 222', '1975-05-10', 'diretor', 'ativo', NULL),

-- Coordenadores
('COORD001', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Eng. João Silva', 'coordenador@imel.edu.ao', '+244 925 333 444', '1978-08-18', 'coordenador', 'ativo', NULL),

-- Professores
('PROF001', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Prof. Maria Silva', 'maria.silva@imel.edu.ao', '+244 926 555 666', '1982-11-30', 'professor', 'ativo', NULL),
('PROF002', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Prof. Carlos Mendes', 'carlos.mendes@imel.edu.ao', '+244 927 777 888', '1979-04-25', 'professor', 'ativo', NULL),
('PROF003', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Prof. Ana Paula', 'ana.paula@imel.edu.ao', '+244 928 999 000', '1983-07-12', 'professor', 'ativo', NULL),
('PROF004', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Prof. Pedro Costa', 'pedro.costa@imel.edu.ao', '+244 929 111 333', '1980-09-05', 'professor', 'ativo', NULL),

-- Alunos (pendentes para primeiro acesso)
('AL000001', '', 'João Mendes', 'joao.mendes@email.com', '+244 921 444 555', '2006-02-14', 'aluno', 'pendente', NULL),
('AL000002', '', 'Ana Santos', 'ana.santos@email.com', '+244 921 666 777', '2006-05-20', 'aluno', 'pendente', NULL),
('AL000003', '', 'Miguel Oliveira', 'miguel.oliveira@email.com', '+244 921 888 999', '2005-11-03', 'aluno', 'pendente', NULL),
('AL000004', '', 'Sofia Pereira', 'sofia.pereira@email.com', '+244 921 000 111', '2006-08-25', 'aluno', 'pendente', NULL),
('AL000005', '', 'Ricardo Fernandes', 'ricardo.fernandes@email.com', '+244 921 222 333', '2005-12-08', 'aluno', 'pendente', NULL),
('AL000006', '', 'Beatriz Rodrigues', 'beatriz.rodrigues@email.com', '+244 921 444 666', '2006-03-17', 'aluno', 'pendente', NULL),
('AL000007', '', 'Tiago Martins', 'tiago.martins@email.com', '+244 921 777 888', '2005-10-22', 'aluno', 'pendente', NULL),
('AL000008', '', 'Carolina Sousa', 'carolina.sousa@email.com', '+244 921 999 000', '2006-01-30', 'aluno', 'pendente', NULL),
('AL000009', '', 'Daniel Lima', 'daniel.lima@email.com', '+244 921 111 222', '2005-09-14', 'aluno', 'pendente', NULL),
('AL000010', '', 'Mariana Gomes', 'mariana.gomes@email.com', '+244 921 333 444', '2006-07-19', 'aluno', 'pendente', NULL),

-- Encarregados de Educação
('ENC001', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Carlos Santos', 'carlos.santos@email.com', '+244 922 555 666', '1975-04-15', 'encarregado', 'ativo', NULL),
('ENC002', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Teresa Mendes', 'teresa.mendes@email.com', '+244 922 777 888', '1978-11-22', 'encarregado', 'ativo', NULL);

-- ========== PROFESSORES ==========
INSERT INTO professores (usuario_id, numero_funcionario, departamento, especialidade, data_contratacao, tipo_contrato, carga_horaria_semanal, qualificacoes) VALUES
(5, 'PROF001', 'Informática', 'Programação e Bases de Dados', '2020-01-15', 'efetivo', 40, 'Mestrado em Engenharia Informática'),
(6, 'PROF002', 'Matemática', 'Matemática Aplicada', '2019-08-20', 'efetivo', 40, 'Licenciatura em Matemática'),
(7, 'PROF003', 'Economia', 'Macroeconomia', '2021-03-10', 'contratado', 35, 'Mestrado em Economia'),
(8, 'PROF004', 'Gestão', 'Contabilidade e Finanças', '2018-11-05', 'efetivo', 40, 'Licenciatura em Contabilidade');

-- ========== TURMAS ==========
INSERT INTO turmas (nome, ano_letivo, curso, sala, capacidade_maxima, horario_turno, coordenador_id, status) VALUES
('12ª A', 2024, 'Informática de Gestão', 'Sala 01', 30, 'manha', 1, 'ativa'),
('12ª B', 2024, 'Contabilidade', 'Sala 02', 25, 'tarde', 4, 'ativa'),
('11ª A', 2024, 'Informática de Gestão', 'Sala 03', 28, 'manha', 1, 'ativa'),
('11ª B', 2024, 'Economia', 'Sala 04', 26, 'tarde', 3, 'ativa'),
('10ª A', 2024, 'Informática de Gestão', 'Sala 05', 30, 'manha', 1, 'ativa');

-- ========== DISCIPLINAS ==========
INSERT INTO disciplinas (codigo, nome, carga_horaria_semanal, carga_horaria_total, area_conhecimento, descricao, status) VALUES
('INF101', 'Programação I', 4, 120, 'Informática', 'Introdução à programação com Python', 'ativa'),
('INF102', 'Bases de Dados', 3, 90, 'Informática', 'Fundamentos de bases de dados relacionais', 'ativa'),
('INF103', 'Sistemas Operativos', 3, 90, 'Informática', 'Windows e Linux', 'ativa'),
('MAT101', 'Matemática I', 5, 150, 'Matemática', 'Álgebra e cálculo', 'ativa'),
('MAT102', 'Matemática II', 4, 120, 'Matemática', 'Estatística e probabilidades', 'ativa'),
('ECO101', 'Economia Geral', 4, 120, 'Economia', 'Introdução à economia', 'ativa'),
('ECO102', 'Microeconomia', 3, 90, 'Economia', 'Teoria do consumidor e produtor', 'ativa'),
('CON101', 'Contabilidade Geral', 4, 120, 'Contabilidade', 'Princípios fundamentais', 'ativa'),
('CON102', 'Contabilidade Analítica', 3, 90, 'Contabilidade', 'Custos e orçamentos', 'ativa'),
('GES101', 'Gestão', 3, 90, 'Gestão', 'Princípios de gestão', 'ativa'),
('POR101', 'Português', 4, 120, 'Línguas', 'Gramática e comunicação', 'ativa'),
('ING101', 'Inglês Técnico', 2, 60, 'Línguas', 'Inglês para negócios', 'ativa');

-- ========== RELAÇÃO TURMA-DISCIPLINA-PROFESSOR ==========
INSERT INTO turma_disciplina_professor (turma_id, disciplina_id, professor_id, ano_letivo) VALUES
-- 12ª A - Informática de Gestão
(1, 1, 1, 2024), -- Programação I - Prof. Maria
(1, 2, 1, 2024), -- Bases de Dados - Prof. Maria
(1, 3, 1, 2024), -- Sistemas Operativos - Prof. Maria
(1, 4, 2, 2024), -- Matemática I - Prof. Carlos
(1, 10, 4, 2024), -- Gestão - Prof. Pedro
(1, 11, 3, 2024), -- Português - Prof. Ana
(1, 12, 3, 2024), -- Inglês - Prof. Ana

-- 12ª B - Contabilidade
(2, 8, 4, 2024), -- Contabilidade Geral - Prof. Pedro
(2, 9, 4, 2024), -- Contabilidade Analítica - Prof. Pedro
(2, 4, 2, 2024), -- Matemática I - Prof. Carlos
(2, 5, 2, 2024), -- Matemática II - Prof. Carlos
(2, 10, 4, 2024), -- Gestão - Prof. Pedro
(2, 11, 3, 2024), -- Português - Prof. Ana

-- 11ª A - Informática de Gestão
(3, 1, 1, 2024), -- Programação I - Prof. Maria
(3, 2, 1, 2024), -- Bases de Dados - Prof. Maria
(3, 4, 2, 2024), -- Matemática I - Prof. Carlos
(3, 10, 4, 2024), -- Gestão - Prof. Pedro

-- 11ª B - Economia
(4, 6, 3, 2024), -- Economia Geral - Prof. Ana
(4, 7, 3, 2024), -- Microeconomia - Prof. Ana
(4, 4, 2, 2024), -- Matemática I - Prof. Carlos
(4, 5, 2, 2024), -- Matemática II - Prof. Carlos
(4, 10, 4, 2024); -- Gestão - Prof. Pedro

-- ========== SALAS ==========
INSERT INTO salas (nome, capacidade, tipo, equipamentos, status) VALUES
('Sala 01', 30, 'sala_aula', 'Quadro branco, projetor', 'disponivel'),
('Sala 02', 25, 'sala_aula', 'Quadro branco, TV', 'disponivel'),
('Sala 03', 28, 'sala_aula', 'Quadro branco', 'disponivel'),
('Sala 04', 26, 'sala_aula', 'Quadro branco, projetor', 'disponivel'),
('Sala 05', 30, 'sala_aula', 'Quadro branco', 'disponivel'),
('Laboratório 01', 20, 'laboratorio', '20 computadores, projetor', 'disponivel'),
('Laboratório 02', 20, 'laboratorio', '20 computadores', 'disponivel'),
('Auditório', 100, 'auditorio', 'Palco, som, projetor', 'disponivel'),
('Sala de Professores', 15, 'sala_aula', 'Mesa de reunião', 'disponivel'),
('Biblioteca', 50, 'biblioteca', 'Estantes, mesas, computadores', 'disponivel');

-- ========== HORÁRIOS ==========
INSERT INTO horarios (turma_id, disciplina_id, professor_id, sala_id, dia_semana, hora_inicio, hora_fim) VALUES
-- Segunda-feira
(1, 1, 1, 6, 'segunda', '08:00:00', '09:30:00'), -- 12ª A - Programação I - Lab 01
(1, 4, 2, 1, 'segunda', '10:00:00', '11:30:00'), -- 12ª A - Matemática I - Sala 01
(2, 8, 4, 2, 'segunda', '14:00:00', '15:30:00'), -- 12ª B - Contabilidade Geral - Sala 02
(2, 4, 2, 2, 'segunda', '16:00:00', '17:30:00'), -- 12ª B - Matemática I - Sala 02

-- Terça-feira
(1, 2, 1, 6, 'terca', '08:00:00', '09:30:00'), -- 12ª A - Bases de Dados - Lab 01
(1, 10, 4, 1, 'terca', '10:00:00', '11:30:00'), -- 12ª A - Gestão - Sala 01
(3, 1, 1, 7, 'terca', '14:00:00', '15:30:00'), -- 11ª A - Programação I - Lab 02
(3, 4, 2, 3, 'terca', '16:00:00', '17:30:00'), -- 11ª A - Matemática I - Sala 03

-- Quarta-feira
(1, 3, 1, 6, 'quarta', '08:00:00', '09:30:00'), -- 12ª A - Sistemas Operativos - Lab 01
(1, 11, 3, 1, 'quarta', '10:00:00', '11:30:00'), -- 12ª A - Português - Sala 01
(4, 6, 3, 4, 'quarta', '14:00:00', '15:30:00'), -- 11ª B - Economia Geral - Sala 04
(4, 4, 2, 4, 'quarta', '16:00:00', '17:30:00'), -- 11ª B - Matemática I - Sala 04

-- Quinta-feira
(1, 12, 3, 1, 'quinta', '08:00:00', '09:30:00'), -- 12ª A - Inglês - Sala 01
(2, 9, 4, 2, 'quinta', '10:00:00', '11:30:00'), -- 12ª B - Contabilidade Analítica - Sala 02
(3, 2, 1, 7, 'quinta', '14:00:00', '15:30:00'), -- 11ª A - Bases de Dados - Lab 02
(3, 10, 4, 3, 'quinta', '16:00:00', '17:30:00'), -- 11ª A - Gestão - Sala 03

-- Sexta-feira
(1, 4, 2, 1, 'sexta', '08:00:00', '09:30:00'), -- 12ª A - Matemática I - Sala 01
(2, 5, 2, 2, 'sexta', '10:00:00', '11:30:00'), -- 12ª B - Matemática II - Sala 02
(4, 7, 3, 4, 'sexta', '14:00:00', '15:30:00'), -- 11ª B - Microeconomia - Sala 04
(4, 10, 4, 4, 'sexta', '16:00:00', '17:30:00'); -- 11ª B - Gestão - Sala 04

-- ========== ALUNOS ==========
INSERT INTO alunos (usuario_id, numero_estudante, turma_id, ano_matricula, turno, morada, nome_encarregado, telefone_encarregado) VALUES
(9, 'AL000001', 1, 2024, 'manha', 'Rua dos Estudantes, 123, Luanda', 'Carlos Santos', '+244 922 555 666'),
(10, 'AL000002', 1, 2024, 'manha', 'Av. 4 de Fevereiro, 456, Luanda', 'Teresa Mendes', '+244 922 777 888'),
(11, 'AL000003', 2, 2024, 'tarde', 'Rua da Música, 789, Luanda', 'António Oliveira', '+244 922 999 000'),
(12, 'AL000004', 2, 2024, 'tarde', 'Av. Brasil, 321, Luanda', 'Maria Pereira', '+244 923 111 222'),
(13, 'AL000005', 3, 2024, 'manha', 'Rua do Comércio, 654, Luanda', 'José Fernandes', '+244 923 333 444'),
(14, 'AL000006', 3, 2024, 'manha', 'Av. de Portugal, 987, Luanda', 'Isabel Rodrigues', '+244 923 555 666'),
(15, 'AL000007', 4, 2024, 'tarde', 'Rua das Flores, 159, Luanda', 'Manuel Martins', '+244 923 777 888'),
(16, 'AL000008', 4, 2024, 'tarde', 'Av. Cidade do Porto, 753, Luanda', 'Catarina Sousa', '+244 923 999 000'),
(17, 'AL000009', 5, 2024, 'manha', 'Rua do Jardim, 852, Luanda', 'Fernando Lima', '+244 924 111 222'),
(18, 'AL000010', 5, 2024, 'manha', 'Av. Revolução, 963, Luanda', 'Helena Gomes', '+244 924 333 444');

-- ========== MATRÍCULAS ==========
INSERT INTO matriculas (aluno_id, turma_id, ano_letivo, data_matricula, status) VALUES
(1, 1, 2024, '2024-02-01', 'ativa'),
(2, 1, 2024, '2024-02-01', 'ativa'),
(3, 2, 2024, '2024-02-02', 'ativa'),
(4, 2, 2024, '2024-02-02', 'ativa'),
(5, 3, 2024, '2024-02-03', 'ativa'),
(6, 3, 2024, '2024-02-03', 'ativa'),
(7, 4, 2024, '2024-02-04', 'ativa'),
(8, 4, 2024, '2024-02-04', 'ativa'),
(9, 5, 2024, '2024-02-05', 'ativa'),
(10, 5, 2024, '2024-02-05', 'ativa');

-- ========== NOTAS (para demonstração) ==========
-- Notas para João Mendes (AL000001) - 12ª A
INSERT INTO notas (aluno_id, disciplina_id, professor_id, valor, tipo_avaliacao, peso, descricao, data_avaliacao) VALUES
(1, 1, 1, 16.5, 'teste1', 0.3, 'Primeiro teste de Programação I', '2024-03-10'),
(1, 1, 1, 17.0, 'teste2', 0.3, 'Segundo teste de Programação I', '2024-04-15'),
(1, 1, 1, 18.0, 'projeto', 0.4, 'Projeto final de Programação I', '2024-05-20'),
(1, 2, 1, 14.0, 'teste1', 0.5, 'Teste de Bases de Dados', '2024-03-12'),
(1, 2, 1, 15.5, 'projeto', 0.5, 'Projeto de Bases de Dados', '2024-04-25'),
(1, 4, 2, 12.0, 'teste1', 0.4, 'Primeiro teste de Matemática', '2024-03-08'),
(1, 4, 2, 13.5, 'teste2', 0.4, 'Segundo teste de Matemática', '2024-04-12'),
(1, 4, 2, 11.0, 'participacao', 0.2, 'Participação em aula', '2024-05-30');

-- Notas para Ana Santos (AL000002) - 12ª A
INSERT INTO notas (aluno_id, disciplina_id, professor_id, valor, tipo_avaliacao, peso, descricao, data_avaliacao) VALUES
(2, 1, 1, 18.0, 'teste1', 0.3, 'Primeiro teste de Programação I', '2024-03-10'),
(2, 1, 1, 19.0, 'teste2', 0.3, 'Segundo teste de Programação I', '2024-04-15'),
(2, 1, 1, 17.5, 'projeto', 0.4, 'Projeto final de Programação I', '2024-05-20'),
(2, 2, 1, 16.0, 'teste1', 0.5, 'Teste de Bases de Dados', '2024-03-12'),
(2, 2, 1, 17.0, 'projeto', 0.5, 'Projeto de Bases de Dados', '2024-04-25'),
(2, 4, 2, 15.0, 'teste1', 0.4, 'Primeiro teste de Matemática', '2024-03-08'),
(2, 4, 2, 16.5, 'teste2', 0.4, 'Segundo teste de Matemática', '2024-04-12'),
(2, 4, 2, 14.0, 'participacao', 0.2, 'Participação em aula', '2024-05-30');

-- ========== FREQUÊNCIAS (último mês) ==========
-- Frequências para Março 2024
INSERT INTO frequencias (aluno_id, disciplina_id, professor_id, data_aula, status, justificativa) VALUES
-- João Mendes - Março
(1, 1, 1, '2024-03-04', 'presente', NULL),
(1, 1, 1, '2024-03-11', 'presente', NULL),
(1, 1, 1, '2024-03-18', 'falta', 'Doente'),
(1, 1, 1, '2024-03-25', 'presente', NULL),
(1, 4, 2, '2024-03-04', 'presente', NULL),
(1, 4, 2, '2024-03-11', 'atraso', 'Trânsito'),
(1, 4, 2, '2024-03-18', 'presente', NULL),
(1, 4, 2, '2024-03-25', 'presente', NULL),

-- Ana Santos - Março
(2, 1, 1, '2024-03-04', 'presente', NULL),
(2, 1, 1, '2024-03-11', 'presente', NULL),
(2, 1, 1, '2024-03-18', 'presente', NULL),
(2, 1, 1, '2024-03-25', 'presente', NULL),
(2, 4, 2, '2024-03-04', 'presente', NULL),
(2, 4, 2, '2024-03-11', 'presente', NULL),
(2, 4, 2, '2024-03-18', 'presente', NULL),
(2, 4, 2, '2024-03-25', 'justificado', 'Consulta médica');

-- ========== DOCUMENTOS DA BIBLIOTECA ==========
INSERT INTO documentos (titulo, descricao, tipo, arquivo_url, disciplina_id, downloads) VALUES
('Python para Iniciantes', 'Guia completo de Python com exemplos práticos', 'livro', '/uploads/python_iniciantes.pdf', 1, 125),
('SQL Básico ao Avançado', 'Tudo sobre SQL e bases de dados relacionais', 'apostila', '/uploads/sql_completo.pdf', 2, 89),
('Exercícios de Matemática I', 'Coleção de exercícios com resoluções', 'exercicios', '/uploads/exercicios_matematica1.pdf', 4, 156),
('Introdução à Economia', 'Conceitos fundamentais de economia', 'livro', '/uploads/introducao_economia.pdf', 6, 67),
('Manual de Contabilidade', 'Princípios e práticas contabilísticas', 'livro', '/uploads/manual_contabilidade.pdf', 8, 92),
('Vídeo Aula: Programação Orientada a Objetos', 'Conceitos de OOP em Python', 'video', '/uploads/video_poo.mp4', 1, 45),
('Slides de Gestão', 'Apresentação dos principais conceitos de gestão', 'slides', '/uploads/slides_gestao.pdf', 10, 78),
('Provas Anteriores', 'Coletânea de provas dos últimos 3 anos', 'outro', '/uploads/provas_anteriores.zip', NULL, 210),
('Guia de Estudo para Exames', 'Dicas e técnicas para preparação de exames', 'outro', '/uploads/guia_estudo.pdf', NULL, 134),
('Normas de Formatação de Trabalhos', 'Manual de normas ABNT para trabalhos académicos', 'outro', '/uploads/normas_formatacao.pdf', NULL, 87);

-- ========== MATERIAIS DIDÁTICOS ==========
INSERT INTO materiais_didaticos (professor_id, titulo, descricao, tipo, disciplina_id, turma_id, arquivo_url, downloads) VALUES
(1, 'Exercícios de Programação I', 'Lista de exercícios para prática', 'exercicios', 1, 1, '/uploads/exercicios_programacao1.pdf', 56),
(1, 'Slides de Bases de Dados', 'Material de apoio para aulas', 'slides', 2, 1, '/uploads/slides_bd.pdf', 42),
(2, 'Prova Modelo Matemática I', 'Exemplo de prova com gabarito', 'prova', 4, 1, '/uploads/prova_matematica1.pdf', 38),
(2, 'Roteiro de Estudo', 'Plano de estudo para Matemática', 'roteiro', 4, NULL, '/uploads/roteiro_estudo.pdf', 29),
(3, 'Casos de Estudo Economia', 'Análise de casos reais', 'outro', 6, 4, '/uploads/casos_economia.pdf', 31),
(4, 'Exercícios Contabilidade', 'Problemas práticos de contabilidade', 'exercicios', 8, 2, '/uploads/exercicios_contabilidade.pdf', 47),
(4, 'Modelo de Balanço', 'Template para elaboração de balanços', 'outro', 8, NULL, '/uploads/modelo_balanco.xlsx', 24);

-- ========== EVENTOS NO CALENDÁRIO ==========
INSERT INTO eventos (titulo, descricao, tipo, data_inicio, data_fim, local, turma_id, disciplina_id, created_by) VALUES
('Início do Ano Letivo 2024', 'Início das aulas do 2º semestre', 'academico', '2024-02-05 08:00:00', '2024-02-05 17:00:00', 'IMEL', NULL, NULL, 1),
('Teste de Programação I', 'Primeira avaliação da disciplina', 'academico', '2024-03-10 08:00:00', '2024-03-10 09:30:00', 'Laboratório 01', 1, 1, 5),
('Reunião de Pais 12º Ano', 'Reunião com encarregados de educação', 'administrativo', '2024-03-20 18:00:00', '2024-03-20 20:00:00', 'Auditório', 1, NULL, 3),
('Feriado: Dia da Mulher', 'Feriado nacional', 'feriado', '2024-03-08 00:00:00', '2024-03-08 23:59:59', NULL, NULL, NULL, 1),
('Workshop: Preparação para Exames', 'Workshop sobre técnicas de estudo', 'academico', '2024-04-15 14:00:00', '2024-04-15 17:00:00', 'Sala 01', NULL, NULL, 5),
('Entrega de Projetos BD', 'Data limite para entrega de projetos', 'academico', '2024-04-25 23:59:59', '2024-04-25 23:59:59', 'Online', 1, 2, 5),
('Reunião Pedagógica', 'Reunião do corpo docente', 'reuniao', '2024-04-30 16:00:00', '2024-04-30 18:00:00', 'Sala de Professores', NULL, NULL, 3);

-- ========== MENSAGENS ==========
INSERT INTO mensagens (remetente_id, destinatario_id, assunto, conteudo, lida, data_leitura) VALUES
-- Mensagens para João Mendes (aluno 1)
(5, 9, 'Aviso: Teste de Programação', 'Lembramos que o teste de Programação I está marcado para dia 10/03 às 08:00 no Laboratório 01.', false, NULL),
(5, 9, 'Projeto de BD', 'Seu projeto de Bases de Dados foi recebido. Bom trabalho!', true, '2024-04-26 10:30:00'),
(2, 9, 'Falta justificada', 'Sua falta de dia 18/03 foi justificada com sucesso.', true, '2024-03-19 09:15:00'),

-- Mensagens para Ana Santos (aluno 2)
(5, 10, 'Excelente desempenho', 'Parabéns pelo excelente desempenho no último teste!', false, NULL),
(2, 10, 'Consulta médica', 'Sua justificativa de consulta médica foi aceite.', true, '2024-03-26 14:20:00'),

-- Mensagens entre professores
(5, 6, 'Reunião de departamento', 'Lembramos da reunião de departamento amanhã às 16:00.', true, '2024-04-29 15:45:00'),
(6, 5, 'Material de Matemática', 'Partilhei novo material de apoio para Matemática I.', false, NULL),

-- Mensagens para encarregados
(5, 19, 'Desempenho do João', 'O João tem apresentado bom desempenho em Programação. Continuem o bom trabalho!', false, NULL),
(2, 19, 'Falta do João', 'Informamos que o João faltou à aula de dia 18/03. A justificativa foi aceite.', true, '2024-03-19 11:30:00');

-- ========== LOG DE ACESSOS (exemplo) ==========
INSERT INTO log_acessos (usuario_id, ip_address, user_agent) VALUES
(1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(5, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(9, '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

-- ========== RESETS DE SENHA (exemplo) ==========
-- Token válido por 1 hora
INSERT INTO password_resets (usuario_id, token, expires_at) VALUES
(9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiYWN0aW9uIjoicmVzZXRfcGFzc3dvcmQiLCJpYXQiOjE3MTIwMDAwMDAsImV4cCI6MTcxMjAwMzYwMH0.fake-token-for-test', '2024-04-02 11:00:00');

-- ========== FIM DO SEED ==========
SELECT 'Seed concluído com sucesso!' as Status;