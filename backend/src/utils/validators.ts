import { body, param, query, validationResult } from 'express-validator';

export const validate = (validations: any[]) => {
  return async (req: any, res: any, next: any) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array()
    });
  };
};

// Validações para autenticação
export const loginValidation = [
  body('numero_processo')
    .notEmpty().withMessage('Número de processo é obrigatório')
    .isLength({ min: 5, max: 20 }).withMessage('Número de processo deve ter entre 5 e 20 caracteres'),
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

export const registerValidation = [
  body('numero_processo')
    .notEmpty().withMessage('Número de processo é obrigatório')
    .isLength({ min: 5, max: 20 }).withMessage('Número de processo deve ter entre 5 e 20 caracteres'),
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Senha deve conter letras e números'),
  body('confirmar_senha')
    .notEmpty().withMessage('Confirmação de senha é obrigatória')
    .custom((value, { req }) => value === req.body.senha)
    .withMessage('As senhas não coincidem')
];

// Validações para notas
export const notaValidation = [
  body('aluno_id').isInt().withMessage('ID do aluno inválido'),
  body('disciplina_id').isInt().withMessage('ID da disciplina inválido'),
  body('valor').isFloat({ min: 0, max: 20 }).withMessage('Nota deve estar entre 0 e 20'),
  body('tipo_avaliacao').isIn(['teste1', 'teste2', 'projeto', 'participacao', 'exame']).withMessage('Tipo de avaliação inválido'),
  body('peso').isFloat({ min: 0.1, max: 1 }).withMessage('Peso deve estar entre 0.1 e 1'),
  body('data_avaliacao').isISO8601().withMessage('Data de avaliação inválida')
];

// Validações para frequências
export const frequenciaValidation = [
  body('aluno_id').isInt().withMessage('ID do aluno inválido'),
  body('disciplina_id').isInt().withMessage('ID da disciplina inválido'),
  body('data_aula').isISO8601().withMessage('Data da aula inválida'),
  body('status').isIn(['presente', 'falta', 'justificado', 'atraso']).withMessage('Status inválido')
];

// Validações para usuários
export const usuarioValidation = [
  body('nome_completo')
    .notEmpty().withMessage('Nome completo é obrigatório')
    .isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres'),
  body('email')
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido'),
  body('tipo').isIn(['aluno', 'professor', 'admin', 'diretor', 'coordenador', 'encarregado']).withMessage('Tipo de usuário inválido')
];