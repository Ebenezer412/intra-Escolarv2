-- ========== BASE DE DADOS IMEL INTRANET ==========
-- Criação da base de dados
CREATE DATABASE IF NOT EXISTS imel_intranet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE imel_intranet;

-- ========== TABELA DE USUÁRIOS ==========
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_processo VARCHAR(20) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE,
    tipo ENUM('aluno', 'professor', 'admin', 'diretor', 'coordenador', 'encarregado') NOT NULL,
    status ENUM('ativo', 'inativo', 'pendente') DEFAULT 'ativo',
    foto_perfil VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE ALUNOS ==========
CREATE TABLE alunos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE NOT NULL,
    numero_estudante VARCHAR(20) UNIQUE NOT NULL,
    turma_id INT,
    ano_matricula YEAR NOT NULL,
    turno ENUM('manha', 'tarde', 'noite') DEFAULT 'manha',
    morada TEXT,
    nome_encarregado VARCHAR(100),
    telefone_encarregado VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_turma (turma_id),
    INDEX idx_ano_matricula (ano_matricula)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE PROFESSORES ==========
CREATE TABLE professores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE NOT NULL,
    numero_funcionario VARCHAR(20) UNIQUE NOT NULL,
    departamento VARCHAR(50) NOT NULL,
    especialidade VARCHAR(100),
    data_contratacao DATE NOT NULL,
    tipo_contrato ENUM('efetivo', 'contratado', 'horista') DEFAULT 'contratado',
    carga_horaria_semanal INT DEFAULT 40,
    qualificacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_departamento (departamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE TURMAS ==========
CREATE TABLE turmas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    ano_letivo YEAR NOT NULL,
    curso VARCHAR(100) NOT NULL,
    sala VARCHAR(20),
    capacidade_maxima INT DEFAULT 30,
    horario_turno ENUM('manha', 'tarde', 'noite') DEFAULT 'manha',
    coordenador_id INT,
    status ENUM('ativa', 'inativa', 'concluida') DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coordenador_id) REFERENCES professores(id),
    UNIQUE KEY uk_turma_ano (nome, ano_letivo),
    INDEX idx_ano_curso (ano_letivo, curso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE MATRÍCULAS ==========
CREATE TABLE matriculas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aluno_id INT NOT NULL,
    turma_id INT NOT NULL,
    ano_letivo YEAR NOT NULL,
    data_matricula DATE DEFAULT (CURRENT_DATE),
    status ENUM('ativa', 'concluida', 'trancada', 'cancelada') DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    UNIQUE KEY uk_aluno_turma_ano (aluno_id, turma_id, ano_letivo),
    INDEX idx_turma_status (turma_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE DISCIPLINAS ==========
CREATE TABLE disciplinas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    carga_horaria_semanal INT NOT NULL,
    carga_horaria_total INT NOT NULL,
    area_conhecimento VARCHAR(50),
    descricao TEXT,
    status ENUM('ativa', 'inativa') DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome (nome),
    INDEX idx_area (area_conhecimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE TURMA-DISCIPLINA-PROFESSOR ==========
CREATE TABLE turma_disciplina_professor (
    id INT PRIMARY KEY AUTO_INCREMENT,
    turma_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,
    ano_letivo YEAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    UNIQUE KEY uk_turma_disciplina_ano (turma_id, disciplina_id, ano_letivo),
    INDEX idx_professor (professor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE NOTAS ==========
CREATE TABLE notas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aluno_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,
    valor DECIMAL(4,2) NOT NULL CHECK (valor >= 0 AND valor <= 20),
    tipo_avaliacao ENUM('teste1', 'teste2', 'projeto', 'participacao', 'exame') NOT NULL,
    peso DECIMAL(3,2) DEFAULT 1.00 CHECK (peso > 0 AND peso <= 1),
    descricao VARCHAR(255),
    data_avaliacao DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    INDEX idx_aluno_disciplina (aluno_id, disciplina_id),
    INDEX idx_data_avaliacao (data_avaliacao),
    INDEX idx_tipo (tipo_avaliacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE FREQUÊNCIAS ==========
CREATE TABLE frequencias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aluno_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,
    data_aula DATE NOT NULL,
    status ENUM('presente', 'falta', 'justificado', 'atraso') NOT NULL,
    justificativa TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    UNIQUE KEY uk_aluno_disciplina_data (aluno_id, disciplina_id, data_aula),
    INDEX idx_data_aula (data_aula),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE HORÁRIOS ==========
CREATE TABLE horarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    turma_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,
    sala_id INT NOT NULL,
    dia_semana ENUM('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    FOREIGN KEY (sala_id) REFERENCES salas(id),
    INDEX idx_dia_hora (dia_semana, hora_inicio),
    INDEX idx_professor_dia (professor_id, dia_semana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE SALAS ==========
CREATE TABLE salas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(20) UNIQUE NOT NULL,
    capacidade INT NOT NULL,
    tipo ENUM('sala_aula', 'laboratorio', 'auditorio', 'biblioteca') DEFAULT 'sala_aula',
    equipamentos TEXT,
    status ENUM('disponivel', 'manutencao', 'reservada') DEFAULT 'disponivel',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE MENSAGENS ==========
CREATE TABLE mensagens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    remetente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    data_leitura TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_destinatario (destinatario_id, lida),
    INDEX idx_remetente (remetente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE DOCUMENTOS ==========
CREATE TABLE documentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo ENUM('livro', 'artigo', 'video', 'apostila', 'software', 'outro') NOT NULL,
    arquivo_url VARCHAR(500) NOT NULL,
    tamanho_arquivo BIGINT,
    disciplina_id INT,
    turma_id INT,
    professor_id INT,
    aluno_id INT,
    downloads INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE SET NULL,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE SET NULL,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    INDEX idx_tipo (tipo),
    INDEX idx_disciplina (disciplina_id),
    INDEX idx_turma (turma_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE MATERIAIS DIDÁTICOS ==========
CREATE TABLE materiais_didaticos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    professor_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo ENUM('apostila', 'slides', 'exercicios', 'prova', 'roteiro', 'outro') NOT NULL,
    disciplina_id INT,
    turma_id INT,
    arquivo_url VARCHAR(500) NOT NULL,
    tamanho_arquivo BIGINT,
    downloads INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE SET NULL,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    INDEX idx_professor (professor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE LOG DE ACESSOS ==========
CREATE TABLE log_acessos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_data (usuario_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE RESET DE SENHAS ==========
CREATE TABLE password_resets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY uk_token (token),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== TABELA DE EVENTOS/CALENDÁRIO ==========
CREATE TABLE eventos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo ENUM('academico', 'administrativo', 'feriado', 'reuniao') NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME,
    local VARCHAR(100),
    turma_id INT,
    disciplina_id INT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_data_tipo (data_inicio, tipo),
    INDEX idx_turma (turma_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== VIEWS ÚTEIS ==========

-- View para alunos com suas turmas
CREATE VIEW vw_alunos_turmas AS
SELECT 
    a.id as aluno_id,
    u.numero_processo,
    u.nome_completo,
    u.email,
    u.telefone,
    a.numero_estudante,
    t.nome as turma_nome,
    t.ano_letivo,
    t.curso,
    m.status as status_matricula
FROM alunos a
JOIN usuarios u ON a.usuario_id = u.id
LEFT JOIN matriculas m ON a.id = m.aluno_id
LEFT JOIN turmas t ON m.turma_id = t.id
WHERE u.tipo = 'aluno' AND u.status = 'ativo';

-- View para professores com suas disciplinas
CREATE VIEW vw_professores_disciplinas AS
SELECT 
    p.id as professor_id,
    u.numero_processo,
    u.nome_completo,
    u.email,
    p.numero_funcionario,
    p.departamento,
    p.especialidade,
    d.nome as disciplina_nome,
    t.nome as turma_nome,
    tdp.ano_letivo
FROM professores p
JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN turma_disciplina_professor tdp ON p.id = tdp.professor_id
LEFT JOIN disciplinas d ON tdp.disciplina_id = d.id
LEFT JOIN turmas t ON tdp.turma_id = t.id
WHERE u.tipo = 'professor' AND u.status = 'ativo';

-- View para notas com detalhes
CREATE VIEW vw_notas_detalhadas AS
SELECT 
    n.id,
    n.aluno_id,
    u_a.nome_completo as aluno_nome,
    n.disciplina_id,
    d.nome as disciplina_nome,
    n.professor_id,
    u_p.nome_completo as professor_nome,
    n.valor,
    n.tipo_avaliacao,
    n.peso,
    n.data_avaliacao,
    (n.valor * n.peso) as valor_ponderado
FROM notas n
JOIN alunos a ON n.aluno_id = a.id
JOIN usuarios u_a ON a.usuario_id = u_a.id
JOIN disciplinas d ON n.disciplina_id = d.id
JOIN professores p ON n.professor_id = p.id
JOIN usuarios u_p ON p.usuario_id = u_p.id;

-- View para estatísticas de frequência
CREATE VIEW vw_estatisticas_frequencia AS
SELECT 
    a.id as aluno_id,
    u.nome_completo as aluno_nome,
    t.nome as turma_nome,
    COUNT(f.id) as total_aulas,
    SUM(CASE WHEN f.status = 'presente' THEN 1 ELSE 0 END) as presentes,
    SUM(CASE WHEN f.status = 'falta' THEN 1 ELSE 0 END) as faltas,
    SUM(CASE WHEN f.status = 'justificado' THEN 1 ELSE 0 END) as justificadas,
    SUM(CASE WHEN f.status = 'atraso' THEN 1 ELSE 0 END) as atrasos,
    ROUND((SUM(CASE WHEN f.status = 'presente' THEN 1 ELSE 0 END) / COUNT(f.id)) * 100, 1) as percentagem_presenca
FROM alunos a
JOIN usuarios u ON a.usuario_id = u.id
JOIN matriculas m ON a.id = m.aluno_id
JOIN turmas t ON m.turma_id = t.id
LEFT JOIN frequencias f ON a.id = f.aluno_id
WHERE u.tipo = 'aluno' AND u.status = 'ativo'
GROUP BY a.id, u.nome_completo, t.nome;

-- View para médias dos alunos
CREATE VIEW vw_medias_alunos AS
SELECT 
    a.id as aluno_id,
    u.nome_completo as aluno_nome,
    t.nome as turma_nome,
    d.nome as disciplina_nome,
    COUNT(n.id) as total_avaliacoes,
    ROUND(AVG(n.valor), 2) as media_simples,
    ROUND(SUM(n.valor * n.peso) / SUM(n.peso), 2) as media_ponderada
FROM alunos a
JOIN usuarios u ON a.usuario_id = u.id
JOIN matriculas m ON a.id = m.aluno_id
JOIN turmas t ON m.turma_id = t.id
JOIN turma_disciplina_professor tdp ON t.id = tdp.turma_id
JOIN disciplinas d ON tdp.disciplina_id = d.id
LEFT JOIN notas n ON a.id = n.aluno_id AND d.id = n.disciplina_id
WHERE u.tipo = 'aluno' AND u.status = 'ativo'
GROUP BY a.id, u.nome_completo, t.nome, d.nome;

-- ========== TRIGGERS ==========

-- Trigger para atualizar updated_at automaticamente
DELIMITER //
CREATE TRIGGER update_usuarios_timestamp 
BEFORE UPDATE ON usuarios 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Trigger para garantir que aluno só pode ter uma matrícula ativa por ano
DELIMITER //
CREATE TRIGGER check_matricula_unica 
BEFORE INSERT ON matriculas 
FOR EACH ROW 
BEGIN
    DECLARE matricula_existente INT;
    
    SELECT COUNT(*) INTO matricula_existente
    FROM matriculas 
    WHERE aluno_id = NEW.aluno_id 
      AND ano_letivo = NEW.ano_letivo 
      AND status = 'ativa';
    
    IF matricula_existente > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Aluno já possui uma matrícula ativa para este ano letivo';
    END IF;
END//
DELIMITER ;

-- Trigger para evitar notas fora do intervalo
DELIMITER //
CREATE TRIGGER check_valor_nota 
BEFORE INSERT ON notas 
FOR EACH ROW 
BEGIN
    IF NEW.valor < 0 OR NEW.valor > 20 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Valor da nota deve estar entre 0 e 20';
    END IF;
END//
DELIMITER ;

-- Trigger para atualizar contador de downloads
DELIMITER //
CREATE TRIGGER increment_downloads 
AFTER INSERT ON log_downloads 
FOR EACH ROW 
BEGIN
    UPDATE documentos 
    SET downloads = downloads + 1 
    WHERE id = NEW.documento_id;
END//
DELIMITER ;

-- ========== PROCEDURES ==========

-- Procedure para calcular média final do aluno
DELIMITER //
CREATE PROCEDURE sp_calcular_media_final(
    IN p_aluno_id INT,
    IN p_disciplina_id INT,
    OUT p_media_final DECIMAL(4,2)
)
BEGIN
    SELECT ROUND(SUM(valor * peso) / SUM(peso), 2)
    INTO p_media_final
    FROM notas
    WHERE aluno_id = p_aluno_id 
      AND disciplina_id = p_disciplina_id;
END//
DELIMITER ;

-- Procedure para gerar relatório de turma
DELIMITER //
CREATE PROCEDURE sp_relatorio_turma(
    IN p_turma_id INT,
    IN p_ano_letivo YEAR
)
BEGIN
    -- Alunos da turma
    SELECT 
        a.id,
        u.nome_completo,
        u.email,
        COUNT(DISTINCT n.id) as total_notas,
        ROUND(AVG(n.valor), 2) as media_geral,
        COUNT(DISTINCT f.id) as total_aulas,
        SUM(CASE WHEN f.status = 'presente' THEN 1 ELSE 0 END) as presencas
    FROM alunos a
    JOIN usuarios u ON a.usuario_id = u.id
    JOIN matriculas m ON a.id = m.aluno_id
    LEFT JOIN notas n ON a.id = n.aluno_id
    LEFT JOIN frequencias f ON a.id = f.aluno_id
    WHERE m.turma_id = p_turma_id 
      AND m.ano_letivo = p_ano_letivo
    GROUP BY a.id, u.nome_completo, u.email;
END//
DELIMITER ;

-- Procedure para estatísticas do sistema
DELIMITER //
CREATE PROCEDURE sp_estatisticas_sistema()
BEGIN
    -- Total de usuários por tipo
    SELECT 
        tipo,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as ativos
    FROM usuarios
    GROUP BY tipo;
    
    -- Total de turmas ativas
    SELECT COUNT(*) as turmas_ativas
    FROM turmas
    WHERE status = 'ativa';
    
    -- Média geral de notas
    SELECT 
        ROUND(AVG(valor), 2) as media_geral_notas,
        COUNT(*) as total_notas
    FROM notas;
    
    -- Taxa de presença geral
    SELECT 
        ROUND((SUM(CASE WHEN status = 'presente' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as taxa_presenca
    FROM frequencias;
END//
DELIMITER ;

-- ========== DADOS INICIAIS ==========

-- Inserir tipos de usuário (exemplo)
INSERT INTO usuarios (numero_processo, senha_hash, nome_completo, email, tipo, status) VALUES
-- Admin
('ADMIN001', '$2a$12$YourHashHere', 'Administrador Sistema', 'admin@imel.edu.ao', 'admin', 'ativo'),
-- Diretor
('DIR001', '$2a$12$YourHashHere', 'Dr. Manuel António', 'diretor@imel.edu.ao', 'diretor', 'ativo'),
-- Coordenador
('COORD001', '$2a$12$YourHashHere', 'Eng. João Silva', 'coordenador@imel.edu.ao', 'coordenador', 'ativo'),
-- Professores
('PROF001', '$2a$12$YourHashHere', 'Prof. Maria Silva', 'maria.silva@imel.edu.ao', 'professor', 'ativo'),
('PROF002', '$2a$12$YourHashHere', 'Prof. Carlos Mendes', 'carlos.mendes@imel.edu.ao', 'professor', 'ativo'),
-- Alunos (pendentes para primeiro acesso)
('AL000001', '', 'João Mendes', 'joao.mendes@imel.edu.ao', 'aluno', 'pendente'),
('AL000002', '', 'Ana Santos', 'ana.santos@imel.edu.ao', 'aluno', 'pendente'),
-- Encarregado
('ENC001', '$2a$12$YourHashHere', 'Carlos Santos', 'carlos.santos@email.com', 'encarregado', 'ativo');

-- Inserir professores
INSERT INTO professores (usuario_id, numero_funcionario, departamento, data_contratacao) VALUES
(4, 'PROF001', 'Informática', '2020-01-15'),
(5, 'PROF002', 'Matemática', '2019-08-20');

-- Inserir turmas
INSERT INTO turmas (nome, ano_letivo, curso, capacidade_maxima) VALUES
('12ª A', 2024, 'Informática de Gestão', 30),
('11ª B', 2024, 'Contabilidade', 25),
('10ª C', 2024, 'Economia', 28);

-- Inserir disciplinas
INSERT INTO disciplinas (codigo, nome, carga_horaria_semanal, carga_horaria_total) VALUES
('INF101', 'Programação I', 4, 120),
('INF102', 'Bases de Dados', 3, 90),
('MAT101', 'Matemática I', 5, 150),
('ECO101', 'Economia Geral', 4, 120),
('CON101', 'Contabilidade Geral', 4, 120);

-- Inserir relação turma-disciplina-professor
INSERT INTO turma_disciplina_professor (turma_id, disciplina_id, professor_id, ano_letivo) VALUES
(1, 1, 1, 2024), -- 12ª A - Programação I - Prof. Maria
(1, 2, 1, 2024), -- 12ª A - Bases de Dados - Prof. Maria
(1, 3, 2, 2024), -- 12ª A - Matemática I - Prof. Carlos
(2, 4, 1, 2024), -- 11ª B - Economia Geral - Prof. Maria
(2, 5, 2, 2024); -- 11ª B - Contabilidade Geral - Prof. Carlos

-- Inserir salas
INSERT INTO salas (nome, capacidade, tipo) VALUES
('Sala 01', 30, 'sala_aula'),
('Sala 02', 30, 'sala_aula'),
('Sala 03', 25, 'sala_aula'),
('Laboratório 01', 20, 'laboratorio'),
('Auditório', 100, 'auditorio');

-- Inserir horários
INSERT INTO horarios (turma_id, disciplina_id, professor_id, sala_id, dia_semana, hora_inicio, hora_fim) VALUES
(1, 1, 1, 1, 'segunda', '08:00:00', '09:30:00'),
(1, 2, 1, 2, 'terca', '10:00:00', '11:30:00'),
(1, 3, 2, 1, 'quarta', '08:00:00', '09:30:00'),
(2, 4, 1, 3, 'quinta', '14:00:00', '15:30:00'),
(2, 5, 2, 2, 'sexta', '10:00:00', '11:30:00');

-- Inserir eventos no calendário
INSERT INTO eventos (titulo, descricao, tipo, data_inicio, data_fim, created_by) VALUES
('Início do Ano Letivo', 'Início das aulas do ano letivo 2024', 'academico', '2024-02-05 08:00:00', '2024-02-05 17:00:00', 1),
('Teste de Programação', 'Primeiro teste da disciplina de Programação I', 'academico', '2024-03-15 08:00:00', '2024-03-15 09:30:00', 4),
('Reunião de Pais', 'Reunião geral com encarregados de educação', 'administrativo', '2024-03-20 18:00:00', '2024-03-20 20:00:00', 2),
('Feriado Nacional', 'Dia da Independência Nacional', 'feriado', '2024-11-11 00:00:00', '2024-11-11 23:59:59', 1);

-- Inserir documentos na biblioteca
INSERT INTO documentos (titulo, descricao, tipo, arquivo_url, disciplina_id, downloads) VALUES
('Apostila de Programação', 'Material completo de Programação I', 'apostila', '/uploads/apostila_programacao.pdf', 1, 45),
('Exercícios de Matemática', 'Lista de exercícios com soluções', 'exercicios', '/uploads/exercicios_matematica.pdf', 3, 32),
('Manual de Bases de Dados', 'Guia prático de SQL', 'livro', '/uploads/manual_bd.pdf', 2, 28),
('Vídeo Aula - Economia', 'Introdução à Economia Geral', 'video', '/uploads/video_economia.mp4', 4, 15);

-- Nota: As senhas hash devem ser geradas com bcrypt
-- Para testes, use a senha "senha123" que gera hash: $2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW

-- Criar usuário para a aplicação (opcional)
CREATE USER IF NOT EXISTS 'imel_app'@'localhost' IDENTIFIED BY 'AppPassword123!';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON imel_intranet.* TO 'imel_app'@'localhost';
FLUSH PRIVILEGES;

-- ========== FIM DO SCRIPT ==========