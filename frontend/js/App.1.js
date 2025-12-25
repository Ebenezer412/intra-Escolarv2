// Sistema Intranet IMEL - JavaScript Atualizado com Integração Real
document.addEventListener('DOMContentLoaded', function() {
    // Configuração da API
    const API_BASE_URL = 'http://localhost:3000/api';
    
    // Estado Global
    const state = {
        currentUser: null,
        currentUserType: null,
        isLoggedIn: false,
        theme: localStorage.getItem('theme') || 'dark',
        token: localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken')
    };

    // ========== FUNÇÕES DE API COM INTEGRAÇÃO REAL ==========
    const api = {
        // Requisição genérica com tratamento de erros
        async request(endpoint, options = {}) {
            const url = `${API_BASE_URL}${endpoint}`;
            
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            if (state.token) {
                headers['Authorization'] = `Bearer ${state.token}`;
            }
            
            try {
                const response = await fetch(url, {
                    ...options,
                    headers,
                    credentials: 'include'
                });
                
                // Se token expirou, tentar refresh
                if (response.status === 401 && state.refreshToken) {
                    const refreshed = await this.refreshAuthToken();
                    if (refreshed) {
                        // Re-tentar a requisição original com novo token
                        headers['Authorization'] = `Bearer ${state.token}`;
                        const retryResponse = await fetch(url, {
                            ...options,
                            headers
                        });
                        
                        if (!retryResponse.ok) {
                            throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
                        }
                        
                        return await retryResponse.json();
                    }
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { message: errorText || 'Erro na requisição' };
                    }
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('Erro na requisição:', error);
                throw error;
            }
        },
        
        // Refresh token
        async refreshAuthToken() {
            try {
                if (!state.refreshToken) return false;
                
                const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refreshToken: state.refreshToken })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to refresh token');
                }
                
                const data = await response.json();
                
                if (data.success) {
                    state.token = data.token;
                    state.refreshToken = data.refreshToken;
                    
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    
                    return true;
                }
            } catch (error) {
                console.error('Erro ao renovar token:', error);
                this.logout();
                return false;
            }
        },

        // Autenticação
        async login(numero_processo, senha) {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ numero_processo, senha })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Credenciais inválidas');
            }
            
            return await response.json();
        },
        
        async registrar(numero_processo, senha, confirmar_senha) {
            return this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ numero_processo, senha, confirmar_senha })
            });
        },
        
        async verificarToken() {
            return this.request('/auth/verify');
        },
        
        async obterPerfil() {
            return this.request('/auth/perfil');
        },
        
        async atualizarPerfil(dados) {
            return this.request('/auth/perfil', {
                method: 'PUT',
                body: JSON.stringify(dados)
            });
        },
        
        async alterarSenha(senha_atual, nova_senha, confirmar_senha) {
            return this.request('/auth/alterar-senha', {
                method: 'PUT',
                body: JSON.stringify({ senha_atual, nova_senha, confirmar_senha })
            });
        },
        
        async forgotPassword(email, tipo) {
            return this.request('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email, tipo })
            });
        },
        
        // Aluno
        async obterDashboardAluno() {
            return this.request('/aluno/dashboard');
        },
        
        async obterNotasAluno(disciplina_id) {
            const query = disciplina_id ? `?disciplina_id=${disciplina_id}` : '';
            return this.request(`/aluno/notas${query}`);
        },
        
        async obterFrequenciasAluno(mes, ano) {
            const query = `?mes=${mes || new Date().getMonth() + 1}&ano=${ano || new Date().getFullYear()}`;
            return this.request(`/aluno/frequencias${query}`);
        },
        
        async obterHorarioAluno() {
            return this.request('/aluno/horario');
        },
        
        async obterDocumentosAluno() {
            return this.request('/aluno/documentos');
        },
        
        async obterMensagensAluno(nao_lidas = false) {
            const query = nao_lidas ? '?nao_lidas=true' : '';
            return this.request(`/aluno/mensagens${query}`);
        },
        
        async enviarMensagem(destinatario_id, assunto, conteudo) {
            return this.request('/aluno/mensagens', {
                method: 'POST',
                body: JSON.stringify({ destinatario_id, assunto, conteudo })
            });
        },
        
        async marcarMensagemComoLida(mensagem_id) {
            return this.request(`/aluno/mensagens/${mensagem_id}/ler`, {
                method: 'PUT'
            });
        },
        
        // Professor
        async obterDashboardProfessor() {
            return this.request('/professor/dashboard');
        },
        
        async obterTurmasProfessor() {
            return this.request('/professor/turmas');
        },
        
        async obterAlunosTurma(turma_id) {
            return this.request(`/professor/turmas/${turma_id}/alunos`);
        },
        
        async registrarNota(notaData) {
            return this.request('/professor/notas', {
                method: 'POST',
                body: JSON.stringify(notaData)
            });
        },
        
        async registrarFrequenciasMassa(frequenciaData) {
            return this.request('/professor/frequencias/massa', {
                method: 'POST',
                body: JSON.stringify(frequenciaData)
            });
        },
        
        async obterMateriaisProfessor() {
            return this.request('/professor/materiais');
        },
        
        async adicionarMaterial(materialData) {
            return this.request('/professor/materiais', {
                method: 'POST',
                body: JSON.stringify(materialData)
            });
        },
        
        async obterRelatorioTurma(turma_id) {
            return this.request(`/professor/relatorios/turma/${turma_id}`);
        },
        
        // Admin
        async obterDashboardAdmin() {
            return this.request('/admin/dashboard');
        },
        
        async obterUsuarios(filtros = {}) {
            const query = new URLSearchParams(filtros).toString();
            return this.request(`/admin/usuarios${query ? '?' + query : ''}`);
        },
        
        async obterUsuario(id) {
            return this.request(`/admin/usuarios/${id}`);
        },
        
        async criarUsuario(usuarioData) {
            return this.request('/admin/usuarios', {
                method: 'POST',
                body: JSON.stringify(usuarioData)
            });
        },
        
        async atualizarUsuario(id, dados) {
            return this.request(`/admin/usuarios/${id}`, {
                method: 'PUT',
                body: JSON.stringify(dados)
            });
        },
        
        async redefinirSenhaUsuario(id, nova_senha) {
            return this.request(`/admin/usuarios/${id}/redefinir-senha`, {
                method: 'PUT',
                body: JSON.stringify({ nova_senha })
            });
        },
        
        async desativarUsuario(id) {
            return this.request(`/admin/usuarios/${id}`, {
                method: 'DELETE'
            });
        },
        
        async obterTurmas() {
            return this.request('/admin/turmas');
        },
        
        async criarTurma(turmaData) {
            return this.request('/admin/turmas', {
                method: 'POST',
                body: JSON.stringify(turmaData)
            });
        },
        
        async obterDisciplinas() {
            return this.request('/admin/disciplinas');
        },
        
        async criarDisciplina(disciplinaData) {
            return this.request('/admin/disciplinas', {
                method: 'POST',
                body: JSON.stringify(disciplinaData)
            });
        },
        
        async realizarMatriculas(matriculaData) {
            return this.request('/admin/matriculas/massa', {
                method: 'POST',
                body: JSON.stringify(matriculaData)
            });
        },
        
        async obterConfiguracoes() {
            return this.request('/admin/configuracoes');
        },
        
        async atualizarConfiguracoes(configuracoes) {
            return this.request('/admin/configuracoes', {
                method: 'PUT',
                body: JSON.stringify({ configuracoes })
            });
        },
        
        // Biblioteca
        async obterItensBiblioteca(filtros = {}) {
            const query = new URLSearchParams(filtros).toString();
            return this.request(`/biblioteca${query ? '?' + query : ''}`);
        },
        
        async obterItemBiblioteca(id) {
            return this.request(`/biblioteca/${id}`);
        },
        
        async registrarDownloadItem(id) {
            return this.request(`/biblioteca/${id}/download`, {
                method: 'POST'
            });
        },
        
        async obterEstatisticasBiblioteca() {
            return this.request('/biblioteca/estatisticas');
        },

        // Logout
        logout() {
            return this.request('/auth/logout', {
                method: 'POST'
            });
        }
    };

    // ========== SISTEMA DE ALERTAS MELHORADO ==========
    function showAlert(message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        let icon = 'info-circle';
        switch(type) {
            case 'success': icon = 'check-circle'; break;
            case 'warning': icon = 'exclamation-triangle'; break;
            case 'danger': icon = 'times-circle'; break;
            case 'info': icon = 'info-circle'; break;
        }
        
        alert.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        alertContainer.appendChild(alert);
        
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }, duration);
    }

    // ========== THEME TOGGLE ==========
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    function setTheme(theme) {
        if (theme === 'light') {
            body.classList.add('light-mode');
            body.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.remove('light-mode');
            body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        localStorage.setItem('theme', theme);
        state.theme = theme;
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            setTheme(state.theme === 'dark' ? 'light' : 'dark');
        });
    }
    
    setTheme(state.theme);

    // ========== NAVEGAÇÃO ==========
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const navLinksContainer = document.querySelector('.nav-links');
    
    function navigateToPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            window.scrollTo(0, 0);
        }
        
        if (!state.isLoggedIn && navLinksContainer) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${pageId}`) {
                    link.classList.add('active');
                }
            });
        }
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('href').substring(1);
            navigateToPage(pageId);
        });
    });

    // ========== SISTEMA DE LOGIN ==========
    const loginModal = document.getElementById('loginModal');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const firstAccessModal = document.getElementById('firstAccessModal');
    const accessIntraBtn = document.getElementById('accessIntraBtn');
    const accessDashboardBtn = document.getElementById('accessDashboardBtn');
    
    // Elementos do modal de login
    const loginClose = document.getElementById('loginClose');
    const loginSubmit = document.getElementById('loginSubmit');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const toggleCredentialsBtn = document.getElementById('toggleCredentialsBtn');
    const demoCredentialsToggle = document.getElementById('demoCredentialsToggle');
    const demoCredentialsContent = document.getElementById('demoCredentialsContent');
    const firstAccessLink = document.getElementById('firstAccessLink');

    // Elementos do modal de primeiro acesso
    const firstAccessClose = document.getElementById('firstAccessClose');
    const firstAccessSubmit = document.getElementById('firstAccessSubmit');
    const backToLoginFromFirst = document.getElementById('backToLoginFromFirst');

    // Elementos do modal de recuperação
    const resetPasswordClose = document.getElementById('resetPasswordClose');
    const resetPasswordSubmit = document.getElementById('resetPasswordSubmit');
    const backToLogin = document.getElementById('backToLogin');

    // Inicializar funcionalidades do login
    function initLoginSystem() {
        if (!loginModal) return;

        // Mostrar/ocultar credenciais de demonstração
        if (toggleCredentialsBtn) {
            toggleCredentialsBtn.addEventListener('click', function() {
                demoCredentialsContent.classList.toggle('collapsed');
                const isCollapsed = demoCredentialsContent.classList.contains('collapsed');
                demoCredentialsToggle.innerHTML = `<i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i> Credenciais de Demonstração`;
                this.innerHTML = `<i class="fas fa-eye${isCollapsed ? '' : '-slash'}"></i> ${isCollapsed ? 'Ver' : 'Ocultar'} Credenciais de Demonstração`;
            });
        }

        if (demoCredentialsToggle) {
            demoCredentialsToggle.addEventListener('click', function() {
                demoCredentialsContent.classList.toggle('collapsed');
                const isCollapsed = demoCredentialsContent.classList.contains('collapsed');
                this.innerHTML = `<i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i> Credenciais de Demonstração`;
                if (toggleCredentialsBtn) {
                    toggleCredentialsBtn.innerHTML = `<i class="fas fa-eye${isCollapsed ? '' : '-slash'}"></i> ${isCollapsed ? 'Ver' : 'Ocultar'} Credenciais de Demonstração`;
                }
            });
        }

        // Copiar credenciais
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('copy-btn')) {
                const credential = e.target.closest('.credential');
                const user = credential.getAttribute('data-user');
                const pass = credential.getAttribute('data-pass');
                
                if (usernameInput) usernameInput.value = user;
                if (passwordInput) passwordInput.value = pass;
                
                const originalText = e.target.textContent;
                e.target.textContent = 'Copiado!';
                e.target.style.backgroundColor = 'var(--primary)';
                e.target.style.color = 'white';
                
                setTimeout(() => {
                    e.target.textContent = originalText;
                    e.target.style.backgroundColor = '';
                    e.target.style.color = '';
                }, 1500);
                
                showAlert('Credenciais copiadas para os campos de login', 'success');
            }
        });

        // Mostrar/ocultar palavra-passe
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }

        // Abrir modal de login
        if (accessIntraBtn) {
            accessIntraBtn.addEventListener('click', () => loginModal.classList.add('active'));
        }
        if (accessDashboardBtn) {
            accessDashboardBtn.addEventListener('click', () => loginModal.classList.add('active'));
        }

        // Fechar modais
        if (loginClose) {
            loginClose.addEventListener('click', () => loginModal.classList.remove('active'));
        }
        if (firstAccessClose) {
            firstAccessClose.addEventListener('click', () => firstAccessModal.classList.remove('active'));
        }
        if (resetPasswordClose) {
            resetPasswordClose.addEventListener('click', () => resetPasswordModal.classList.remove('active'));
        }

        // Navegação entre modais
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                loginModal.classList.remove('active');
                resetPasswordModal.classList.add('active');
            });
        }

        if (firstAccessLink) {
            firstAccessLink.addEventListener('click', function(e) {
                e.preventDefault();
                loginModal.classList.remove('active');
                firstAccessModal.classList.add('active');
            });
        }

        if (backToLogin) {
            backToLogin.addEventListener('click', function(e) {
                e.preventDefault();
                resetPasswordModal.classList.remove('active');
                loginModal.classList.add('active');
            });
        }

        if (backToLoginFromFirst) {
            backToLoginFromFirst.addEventListener('click', function(e) {
                e.preventDefault();
                firstAccessModal.classList.remove('active');
                loginModal.classList.add('active');
            });
        }

        // Submeter login
        if (loginSubmit) {
            loginSubmit.addEventListener('click', async function() {
                const username = usernameInput ? usernameInput.value.trim() : '';
                const password = passwordInput ? passwordInput.value.trim() : '';
                
                if (!username || !password) {
                    showAlert('Por favor, preencha todos os campos', 'warning');
                    return;
                }

                const btn = this;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A verificar...';

                try {
                    const resultado = await api.login(username, password);
                    
                    if (resultado.success) {
                        state.currentUser = resultado.user;
                        state.currentUserType = resultado.user.tipo;
                        state.isLoggedIn = true;
                        state.token = resultado.token;
                        state.refreshToken = resultado.refreshToken;
                        
                        localStorage.setItem('token', resultado.token);
                        localStorage.setItem('refreshToken', resultado.refreshToken);
                        localStorage.setItem('user', JSON.stringify(resultado.user));
                        
                        loginModal.classList.remove('active');
                        usernameInput.value = '';
                        passwordInput.value = '';
                        
                        if (navLinksContainer) {
                            navLinksContainer.classList.add('hidden');
                        }
                        
                        redirectToDashboard(resultado.user.tipo, resultado.user);
                        
                        showAlert(`Bem-vindo, ${resultado.user.nome_completo}!`, 'success');
                    }
                } catch (error) {
                    showAlert(error.message || 'Credenciais inválidas. Tente novamente.', 'danger');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        }

        // Primeiro acesso
        if (firstAccessSubmit) {
            firstAccessSubmit.addEventListener('click', async function() {
                const numero = document.getElementById('firstAccessNumero')?.value.trim();
                const senha = document.getElementById('firstAccessSenha')?.value.trim();
                const confirmar = document.getElementById('firstAccessConfirmar')?.value.trim();
                
                if (!numero || !senha || !confirmar) {
                    showAlert('Por favor, preencha todos os campos', 'warning');
                    return;
                }

                if (senha.length < 6) {
                    showAlert('A senha deve ter no mínimo 6 caracteres', 'warning');
                    return;
                }

                if (senha !== confirmar) {
                    showAlert('As senhas não coincidem', 'warning');
                    return;
                }

                const btn = this;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A processar...';

                try {
                    const resultado = await api.registrar(numero, senha, confirmar);
                    
                    if (resultado.success) {
                        state.currentUser = resultado.user;
                        state.currentUserType = resultado.user.tipo;
                        state.isLoggedIn = true;
                        state.token = resultado.token;
                        state.refreshToken = resultado.refreshToken;
                        
                        localStorage.setItem('token', resultado.token);
                        localStorage.setItem('refreshToken', resultado.refreshToken);
                        localStorage.setItem('user', JSON.stringify(resultado.user));
                        
                        firstAccessModal.classList.remove('active');
                        showAlert('Conta criada com sucesso!', 'success');
                        
                        if (navLinksContainer) {
                            navLinksContainer.classList.add('hidden');
                        }
                        
                        redirectToDashboard(resultado.user.tipo, resultado.user);
                    }
                } catch (error) {
                    showAlert(error.message || 'Erro ao criar conta', 'danger');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        }

        // Recuperar senha
        if (resetPasswordSubmit) {
            resetPasswordSubmit.addEventListener('click', async function() {
                const email = document.getElementById('resetEmail')?.value.trim();
                const userType = document.getElementById('userTypeReset')?.value;
                
                if (!email || !userType) {
                    showAlert('Por favor, preencha todos os campos', 'warning');
                    return;
                }

                const btn = this;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A enviar...';

                try {
                    const resultado = await api.forgotPassword(email, userType);
                    
                    if (resultado.success) {
                        showAlert(resultado.message || 'Instruções enviadas para o seu email', 'success');
                        setTimeout(() => {
                            resetPasswordModal.classList.remove('active');
                            loginModal.classList.add('active');
                        }, 2000);
                    }
                } catch (error) {
                    showAlert(error.message || 'Erro ao processar pedido', 'danger');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        }
    }

    // ========== LOGOUT ==========
    async function logout() {
        try {
            await api.logout();
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            state.currentUser = null;
            state.currentUserType = null;
            state.isLoggedIn = false;
            state.token = null;
            state.refreshToken = null;
            
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            if (navLinksContainer) {
                navLinksContainer.classList.remove('hidden');
            }
            
            navigateToPage('home');
            showAlert('Sessão terminada com sucesso', 'info');
        }
    }

    function setupLogoutButtons() {
        document.querySelectorAll('[id^="logoutBtn"]').forEach(btn => {
            btn.addEventListener('click', function() {
                logout();
            });
        });
    }

    // ========== REDIRECIONAMENTO PARA DASHBOARDS ==========
    function redirectToDashboard(userType, user) {
        navigateToPage(`dashboard-${userType}`);
        updateUserInfo(userType, user);
        loadDashboardContent(userType, 'overview');
    }

    function updateUserInfo(userType, user) {
        // Atualizar avatar (iniciais do nome)
        const avatar = document.querySelector(`#dashboard-${userType} .avatar`);
        if (avatar && user.nome_completo) {
            const initials = user.nome_completo
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            avatar.textContent = initials;
        }
        
        // Atualizar nome
        document.querySelectorAll(`#dashboard-${userType} .user-name`).forEach(name => {
            name.textContent = user.nome_completo;
        });
        
        // Atualizar cargo
        document.querySelectorAll(`#dashboard-${userType} .user-role`).forEach(role => {
            let roleText = '';
            switch(userType) {
                case 'aluno':
                    roleText = user.turma_nome || 'Aluno';
                    break;
                case 'professor':
                    roleText = user.departamento ? `Professor - ${user.departamento}` : 'Professor';
                    break;
                case 'admin':
                    roleText = 'Administrador do Sistema';
                    break;
                case 'diretor':
                    roleText = 'Diretor';
                    break;
                case 'coordenador':
                    roleText = 'Coordenador';
                    break;
                case 'encarregado':
                    roleText = 'Encarregado de Educação';
                    break;
            }
            role.textContent = roleText;
        });
    }

    // ========== SISTEMA DE DASHBOARDS ==========
    const dashboardContent = {
        'aluno': {
            'overview': getAlunoOverview,
            'grades': getAlunoGrades,
            'schedule': getAlunoSchedule,
            'attendance': getAlunoAttendance,
            'documents': getAlunoDocuments,
            'messages': getAlunoMessages,
            'calendar': getAlunoCalendar,
            'library': getAlunoLibrary,
            'settings': getAlunoSettings
        },
        'professor': {
            'overview': getProfessorOverview,
            'classes': getProfessorClasses,
            'grades': getProfessorGrades,
            'attendance': getProfessorAttendance,
            'materials': getProfessorMaterials,
            'schedule': getProfessorSchedule,
            'messages': getProfessorMessages,
            'calendar': getProfessorCalendar,
            'library': getProfessorLibrary,
            'reports': getProfessorReports
        },
        'admin': {
            'overview': getAdminOverview,
            'students': getAdminStudents,
            'teachers': getAdminTeachers,
            'classes': getAdminClasses,
            'resources': getAdminResources,
            'reports': getAdminReports,
            'system': getAdminSystem,
            'calendar': getAdminCalendar,
            'library': getAdminLibrary
        },
        'diretor': {
            'overview': getAdminOverview,
            'students': getAdminStudents,
            'teachers': getAdminTeachers,
            'classes': getAdminClasses,
            'reports': getAdminReports,
            'calendar': getAdminCalendar
        },
        'coordenador': {
            'overview': getProfessorOverview,
            'classes': getProfessorClasses,
            'grades': getProfessorGrades,
            'attendance': getProfessorAttendance,
            'reports': getProfessorReports,
            'calendar': getProfessorCalendar
        },
        'encarregado': {
            'overview': getEncarregadoOverview,
            'students': getEncarregadoStudents,
            'grades': getEncarregadoGrades,
            'attendance': getEncarregadoAttendance,
            'messages': getEncarregadoMessages,
            'documents': getEncarregadoDocuments,
            'calendar': getEncarregadoCalendar
        }
    };

    async function loadDashboardContent(userType, view) {
        const contentContainer = document.getElementById(`${userType}DashboardContent`);
        if (!contentContainer) return;
        
        // Mostrar skeleton loading
        contentContainer.innerHTML = `
            <div class="skeleton" style="height: 120px; margin-bottom: 1.5rem;"></div>
            <div class="skeleton" style="height: 300px; margin-bottom: 1.5rem;"></div>
            <div class="skeleton" style="height: 200px;"></div>
        `;
        
        try {
            if (dashboardContent[userType] && dashboardContent[userType][view]) {
                contentContainer.innerHTML = await dashboardContent[userType][view]();
                
                // Inicializar calendário se necessário
                if (view === 'calendar') {
                    initCalendar(userType);
                }
                
                // Configurar botões de ação
                setupActionButtons();
            } else {
                contentContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Conteúdo não disponível para esta visualização</span>
                    </div>
                `;
            }
            
            // Atualizar menu ativo
            document.querySelectorAll(`#dashboard-${userType} .menu-item`).forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-dashboard') === view) {
                    item.classList.add('active');
                }
            });
            
            // Configurar eventos de menu
            setupMenuEvents(userType);
            
            // Adicionar eventos aos botões de ação
            setupActionButtons();
            setupLogoutButtons();
        } catch (error) {
            console.error('Erro ao carregar conteúdo:', error);
            contentContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Erro ao carregar conteúdo: ${error.message}</span>
                </div>
            `;
        }
    }

    function setupMenuEvents(userType) {
        document.querySelectorAll(`#dashboard-${userType} .menu-item`).forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const view = this.getAttribute('data-dashboard');
                loadDashboardContent(userType, view);
            });
        });
    }

    // ========== CONTEÚDO DOS DASHBOARDS ==========
    async function getAlunoOverview() {
        try {
            const data = await api.obterDashboardAluno();
            
            if (!data.success) {
                throw new Error(data.message || 'Erro ao carregar dashboard');
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Visão Geral - ${data.aluno.nome_completo}</h2>
                            <p class="card-subtitle">${data.aluno.turma_nome || 'Aluno'} | Ano Letivo ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</p>
                        </div>
                        <button class="btn btn-primary" id="printReport">
                            <i class="fas fa-print"></i> Imprimir Boletim
                        </button>
                    </div>
                    
                    <div class="stats-grid" style="margin-bottom: 2rem;">
                        <div class="stat-card">
                            <div class="stat-value">${data.estatisticas.media_geral || '0.0'}</div>
                            <div class="stat-label">Média Geral</div>
                            ${parseFloat(data.estatisticas.media_geral) >= 10 ? 
                                `<div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                                    <span class="badge badge-success">Aprovado</span>
                                </div>` :
                                `<div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                                    <span class="badge badge-danger">Reprovado</span>
                                </div>`
                            }
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.estatisticas.percentagem_presenca || '0'}%</div>
                            <div class="stat-label">Presença</div>
                            <div style="margin-top: 0.5rem;">
                                <span style="font-size: 0.8rem;">${data.estatisticas.total_disciplinas || 0} disciplinas</span>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.estatisticas.total_disciplinas || 0}</div>
                            <div class="stat-label">Disciplinas</div>
                            <div style="margin-top: 0.5rem;">
                                <span style="font-size: 0.8rem;">Todas ativas</span>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.estatisticas.total_notas || 0}</div>
                            <div class="stat-label">Avaliações</div>
                            <div style="margin-top: 0.5rem;">
                                <span style="font-size: 0.8rem;">Este período</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                        <div class="card">
                            <h3 class="card-title" style="margin-bottom: 1rem;">Próximas Avaliações</h3>
                            ${data.proximos_eventos && data.proximos_eventos.length > 0 ?
                                `<table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Evento</th>
                                            <th>Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.proximos_eventos.slice(0, 5).map(evento => `
                                            <tr>
                                                <td>${new Date(evento.data_inicio).toLocaleDateString('pt-PT')}</td>
                                                <td>${evento.titulo}</td>
                                                <td><span class="badge ${evento.tipo === 'academico' ? 'badge-danger' : evento.tipo === 'administrativo' ? 'badge-info' : 'badge-warning'}">${evento.tipo}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>` :
                                '<p style="text-align: center; padding: 2rem; color: var(--dark-text-secondary);">Sem avaliações próximas</p>'
                            }
                        </div>
                        
                        <div class="card">
                            <h3 class="card-title" style="margin-bottom: 1rem;">Disciplinas Atuais</h3>
                            ${data.disciplinas && data.disciplinas.length > 0 ?
                                `<div style="display: flex; flex-direction: column; gap: 1rem;">
                                    ${data.disciplinas.slice(0, 3).map(disciplina => `
                                        <div style="padding: 1rem; background-color: var(--dark-card); border-radius: var(--radius);">
                                            <div style="font-weight: 600; margin-bottom: 0.25rem;">${disciplina.nome}</div>
                                            <div style="font-size: 0.85rem; color: var(--dark-text-secondary);">
                                                Média: ${disciplina.media_geral || '--'}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>` :
                                '<p style="text-align: center; padding: 2rem; color: var(--dark-text-secondary);">Nenhuma disciplina matriculada</p>'
                            }
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3 class="card-title" style="margin-bottom: 1rem;">Ações Rápidas</h3>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="loadDashboardContent('aluno', 'grades')">
                                <i class="fas fa-chart-line"></i> Ver Notas
                            </button>
                            <button class="btn btn-secondary" onclick="loadDashboardContent('aluno', 'attendance')">
                                <i class="fas fa-clipboard-check"></i> Ver Frequências
                            </button>
                            <button class="btn btn-secondary" onclick="loadDashboardContent('aluno', 'schedule')">
                                <i class="fas fa-calendar-alt"></i> Ver Horário
                            </button>
                            <button class="btn btn-secondary" onclick="loadDashboardContent('aluno', 'messages')">
                                <i class="fas fa-envelope"></i> Ver Mensagens
                            </button>
                        </div>
                    </div>
                </div>
                
                <script>
                    document.getElementById('printReport')?.addEventListener('click', function() {
                        showAlert('Funcionalidade de impressão em desenvolvimento', 'info');
                    });
                </script>
            `;
        } catch (error) {
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Erro ao carregar dashboard: ${error.message}</span>
                </div>
            `;
        }
    }

    async function getAlunoGrades() {
        try {
            const data = await api.obterNotasAluno();
            
            if (!data.success) {
                throw new Error(data.message || 'Erro ao carregar notas');
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Notas e Avaliações</h2>
                            <p class="card-subtitle">Ano Letivo ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</p>
                        </div>
                        <div class="action-buttons-table">
                            <button class="btn btn-primary" id="exportGrades">
                                <i class="fas fa-download"></i> Exportar
                            </button>
                            <button class="btn btn-secondary" id="printGrades">
                                <i class="fas fa-print"></i> Imprimir
                            </button>
                        </div>
                    </div>
                    
                    ${data.notas_por_disciplina && data.notas_por_disciplina.length > 0 ?
                        data.notas_por_disciplina.map(disciplina => `
                            <div style="margin-bottom: 2rem;">
                                <h3 style="font-weight: 600; margin-bottom: 1rem;">
                                    ${disciplina.disciplina_nome} - Média: ${disciplina.media || '0.0'}
                                </h3>
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Tipo</th>
                                            <th>Valor</th>
                                            <th>Peso</th>
                                            <th>Data</th>
                                            <th>Professor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${disciplina.notas && disciplina.notas.map(nota => `
                                            <tr>
                                                <td>
                                                    ${nota.tipo_avaliacao === 'teste1' ? '1º Teste' : 
                                                      nota.tipo_avaliacao === 'teste2' ? '2º Teste' : 
                                                      nota.tipo_avaliacao === 'projeto' ? 'Projeto' : 
                                                      nota.tipo_avaliacao === 'participacao' ? 'Participação' : 'Exame'}
                                                </td>
                                                <td><strong>${nota.valor}</strong></td>
                                                <td>${nota.peso}</td>
                                                <td>${new Date(nota.data_avaliacao).toLocaleDateString('pt-PT')}</td>
                                                <td>${nota.professor_nome || '--'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `).join('') :
                        '<p style="text-align: center; padding: 2rem; color: var(--dark-text-secondary);">Nenhuma nota registrada</p>'
                    }
                </div>
                
                <script>
                    document.getElementById('exportGrades')?.addEventListener('click', function() {
                        showAlert('Exportação em desenvolvimento', 'info');
                    });
                    
                    document.getElementById('printGrades')?.addEventListener('click', function() {
                        window.print();
                    });
                </script>
            `;
        } catch (error) {
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Erro ao carregar notas: ${error.message}</span>
                </div>
            `;
        }
    }

    async function getAlunoSchedule() {
        try {
            const data = await api.obterHorarioAluno();
            
            if (!data.success) {
                throw new Error(data.message || 'Erro ao carregar horário');
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Horário Semanal</h2>
                            <p class="card-subtitle">Turma ${state.currentUser?.turma_nome || ''} | Ano Letivo ${new Date().getFullYear()}</p>
                        </div>
                        <div class="action-buttons-table">
                            <button class="btn btn-secondary" id="viewMonth">
                                <i class="fas fa-calendar-alt"></i> Ver Mês
                            </button>
                            <button class="btn btn-primary" id="downloadSchedule">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                    
                    ${data.horario && data.horario.length > 0 ?
                        `<div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Segunda</th>
                                        <th>Terça</th>
                                        <th>Quarta</th>
                                        <th>Quinta</th>
                                        <th>Sexta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderHorario(data.horario)}
                                </tbody>
                            </table>
                        </div>` :
                        '<p style="text-align: center; padding: 2rem; color: var(--dark-text-secondary);">Horário não disponível</p>'
                    }
                </div>
                
                <script>
                    document.getElementById('downloadSchedule')?.addEventListener('click', function() {
                        showAlert('Download em desenvolvimento', 'info');
                    });
                    
                    document.getElementById('viewMonth')?.addEventListener('click', function() {
                        loadDashboardContent('aluno', 'calendar');
                    });
                </script>
            `;
        } catch (error) {
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Erro ao carregar horário: ${error.message}</span>
                </div>
            `;
        }
    }

    function renderHorario(horario) {
        // Organizar horário por dia e hora
        const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
        const horas = {};
        
        // Agrupar por hora
        horario.forEach(aula => {
            const horaKey = `${aula.hora_inicio}-${aula.hora_fim}`;
            if (!horas[horaKey]) {
                horas[horaKey] = {};
            }
            horas[horaKey][aula.dia_semana] = aula;
        });
        
        // Gerar linhas da tabela
        let html = '';
        Object.keys(horas).sort().forEach(horaKey => {
            const [horaInicio, horaFim] = horaKey.split('-');
            html += '<tr>';
            html += `<td>${horaInicio.substring(0, 5)}-${horaFim.substring(0, 5)}</td>`;
            
            dias.forEach(dia => {
                const aula = horas[horaKey][dia];
                if (aula) {
                    html += `<td>
                        <div style="padding: 0.5rem; background-color: rgba(59, 130, 246, 0.1); border-radius: var(--radius);">
                            <div style="font-weight: 600;">${aula.disciplina_nome}</div>
                            <div style="font-size: 0.85rem;">${aula.sala_nome} - ${aula.professor_nome}</div>
                        </div>
                    </td>`;
                } else {
                    html += '<td></td>';
                }
            });
            
            html += '</tr>';
        });
        
        return html;
    }

    async function getAlunoAttendance() {
        try {
            const hoje = new Date();
            const data = await api.obterFrequenciasAluno(hoje.getMonth() + 1, hoje.getFullYear());
            
            if (!data.success) {
                throw new Error(data.message || 'Erro ao carregar frequências');
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Registo de Frequências</h2>
                            <p class="card-subtitle">${hoje.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })} | Presença: ${data.estatisticas?.percentagem_presenca || 0}%</p>
                        </div>
                        <div class="action-buttons-table">
                            <button class="btn btn-primary" id="exportAttendance">
                                <i class="fas fa-download"></i> Exportar
                            </button>
                        </div>
                    </div>
                    
                    ${data.frequencias && data.frequencias.length > 0 ?
                        `<div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Disciplina</th>
                                        <th>Estado</th>
                                        <th>Justificação</th>
                                        <th>Professor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.frequencias.slice(0, 20).map(freq => `
                                        <tr>
                                            <td>${new Date(freq.data_aula).toLocaleDateString('pt-PT')}</td>
                                            <td>${freq.disciplina_nome || '--'}</td>
                                            <td>
                                                ${freq.status === 'presente' ? '<span class="badge badge-success">Presente</span>' :
                                                  freq.status === 'falta' ? '<span class="badge badge-danger">Falta</span>' :
                                                  freq.status === 'justificado' ? '<span class="badge badge-warning">Justificado</span>' :
                                                  '<span class="badge badge-info">Atraso</span>'}
                                            </td>
                                            <td>${freq.justificativa || '--'}</td>
                                            <td>${freq.professor_nome || '--'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>` :
                        '<p style="text-align: center; padding: 2rem; color: var(--dark-text-secondary);">Nenhuma frequência registrada este mês</p>'
                    }
                    
                    ${data.estatisticas && data.estatisticas.total_aulas > 0 ?
                        `<div style="margin-top: 2rem; padding: 1.5rem; background-color: var(--dark-card); border-radius: var(--radius);">
                            <h4 style="font-weight: 600; margin-bottom: 1rem;">Estatísticas do Mês</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Total de Aulas</div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 100%;"></div>
                                    </div>
                                    <div style="font-size: 0.85rem; margin-top: 0.5rem;">${data.estatisticas.total_aulas} aulas</div>
                                </div>
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Presenças</div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(data.estatisticas.presentes / data.estatisticas.total_aulas) * 100}%; background: var(--accent);"></div>
                                    </div>
                                    <div style="font-size: 0.85rem; margin-top: 0.5rem;">${data.estatisticas.presentes} (${((data.estatisticas.presentes / data.estatisticas.total_aulas) * 100).toFixed(1)}%)</div>
                                </div>
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Faltas</div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(data.estatisticas.faltas / data.estatisticas.total_aulas) * 100}%; background: var(--danger);"></div>
                                    </div>
                                    <div style="font-size: 0.85rem; margin-top: 0.5rem;">${data.estatisticas.faltas} (${((data.estatisticas.faltas / data.estatisticas.total_aulas) * 100).toFixed(1)}%)</div>
                                </div>
                            </div>
                        </div>` : ''
                    }
                </div>
                
                <script>
                    document.getElementById('exportAttendance')?.addEventListener('click', function() {
                        showAlert('Exportação em desenvolvimento', 'info');
                    });
                </script>
            `;
        } catch (error) {
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Erro ao carregar frequências: ${error.message}</span>
                </div>
            `;
        }
    }

    // Funções dos outros dashboards (professor, admin, etc.)
    // Devem seguir o mesmo padrão de integração real

    async function getProfessorOverview() {
        try {
            const data = await api.obterDashboardProfessor();
            
            if (!data.success) {
                throw new Error(data.message || 'Erro ao carregar dashboard');
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Dashboard do Professor</h2>
                            <p class="card-subtitle">${state.currentUser?.nome_completo || 'Professor'} | ${state.currentUser?.departamento || ''}</p>
                        </div>
                    </div>
                    
                    <div class="stats-grid" style="margin-bottom: 2rem;">
                        <div class="stat-card">
                            <div class="stat-value">${data.turmas?.length || 0}</div>
                            <div class="stat-label">Turmas</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.total_alunos || 0}</div>
                            <div class="stat-label">Alunos</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.disciplinas?.length || 0}</div>
                            <div class="stat-label">Disciplinas</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.aulas_semana || 0}</div>
                            <div class="stat-label">Aulas/Semana</div>
                        </div>
                    </div>
                    
                    ${data.turmas && data.turmas.length > 0 ?
                        `<div class="card">
                            <h3 class="card-title" style="margin-bottom: 1rem;">Minhas Turmas</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
                                ${data.turmas.map(turma => `
                                    <div style="padding: 1rem; background-color: var(--dark-card); border-radius: var(--radius); cursor: pointer;" 
                                         onclick="loadTurmaDetalhes(${turma.id})">
                                        <div style="font-weight: 600; margin-bottom: 0.5rem;">${turma.nome} - ${turma.disciplina_nome}</div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                                            <span>${turma.total_alunos || 0} alunos</span>
                                            <span>${turma.ano_letivo}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>` : ''
                    }
                    
                    ${data.proximas_aulas && data.proximas_aulas.length > 0 ?
                        `<div class="card" style="margin-top: 1.5rem;">
                            <h3 class="card-title" style="margin-bottom: 1rem;">Próximas Aulas</h3>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Turma</th>
                                        <th>Disciplina</th>
                                        <th>Sala</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.proximas_aulas.slice(0, 5).map(aula => `
                                        <tr>
                                            <td>${new Date(aula.data).toLocaleString('pt-PT')}</td>
                                            <td>${aula.turma_nome}</td>
                                            <td>${aula.disciplina_nome}</td>
                                            <td>${aula.sala_nome}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>` : ''
                    }
                </div>
                
                <script>
                    window.loadTurmaDetalhes = function(turmaId) {
                        loadDashboardContent('professor', 'classes');
                        // Aqui poderia carregar detalhes específicos da turma
                        showAlert('Carregando detalhes da turma...', 'info');
                    };
                </script>
            `;
        } catch (error) {
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Erro ao carregar dashboard: ${error.message}</span>
                </div>
            `;
        }
    }

    async function getAdminOverview() {
        try {
            const data = await api.obterDashboardAdmin();
            
            if (!data.success) {
                throw new Error(data.message || 'Erro ao carregar dashboard');
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">Dashboard Administrativo</h2>
                            <p class="card-subtitle">Sistema Intranet IMEL</p>
                        </div>
                        <div class="action-buttons-table">
                            <button class="btn btn-primary" id="refreshDashboard">
                                <i class="fas fa-sync-alt"></i> Atualizar
                            </button>
                        </div>
                    </div>
                    
                    <div class="stats-grid" style="margin-bottom: 2rem;">
                        <div class="stat-card">
                            <div class="stat-value">${data.total_usuarios || 0}</div>
                            <div class="stat-label">Usuários</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.total_alunos || 0}</div>
                            <div class="stat-label">Alunos</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.total_professores || 0}</div>
                            <div class="stat-label">Professores</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">${data.total_turmas || 0}</div>
                            <div class="stat-label">Turmas</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                        <div class="card">
                            <h3 class="card-title" style="margin-bottom: 1rem;">Últimas Atividades</h3>
                            ${data.ultimas_atividades && data.ultimas_atividades.length > 0 ?
                                `<div style="max-height: 300px; overflow-y: auto;">
                                    ${data.ultimas_atividades.map(atividade => `
                                        <div style="padding: 1rem; border-bottom: 1px solid var(--dark-border);">
                                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                                <div style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--primary); display: flex; align-items: center; justify-content: center; color: white;">
                                                    <i class="fas fa-user"></i>
                                                </div>
                                                <div style="flex: 1;">
                                                    <div style="font-weight: 600;">${atividade.usuario_nome}</div>
                                                    <div style="font-size: 0.85rem; color: var(--dark-text-secondary);">${atividade.acao}</div>
                                                </div>
                                                <span style="font-size: 0.75rem; color: var(--dark-text-secondary);">${formatRelativeTime(atividade.data)}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>` :
                                '<p style="text-align: center; padding: 2rem; color: var(--dark-text-secondary);">Nenhuma atividade recente</p>'
                            }
                        </div>
                        
                        <div class="card">
                            <h3 class="card-title" style="margin-bottom: 1rem;">Estatísticas do Sistema</h3>
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                <div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <span>Usuários Ativos</span>
                                        <span>${data.usuarios_ativos || 0}</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(data.usuarios_ativos / data.total_usuarios) * 100 || 0}%;"></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <span>Turmas Ativas</span>
                                        <span>${data.turmas_ativas || 0}</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(data.turmas_ativas / data.total_turmas) * 100 || 0}%; background: var(--accent);"></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <span>Média Geral</span>
                                        <span>${data.media_geral || '0.0'}</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(parseFloat(data.media_geral) / 20) * 100 || 0}%; background: var(--warning);"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3 class="card-title" style="margin-bottom: 1rem;">Ações Rápidas</h3>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="loadDashboardContent('admin', 'students')">
                                <i class="fas fa-user-graduate"></i> Gerir Alunos
                            </button>
                            <button class="btn btn-secondary" onclick="loadDashboardContent('admin', 'teachers')">
                                <i class="fas fa-chalkboard-teacher"></i> Gerir Professores
                            </button>
                            <button class="btn btn-secondary" onclick="loadDashboardContent('admin', 'classes')">
                                <i class="fas fa-school"></i> Gerir Turmas
                            </button>
                            <button class="btn btn-secondary" onclick="loadDashboardContent('admin', 'system')">
                                <i class="fas fa-cogs"></i> Configurações
                            </button>
                        </div>
                    </div>
                </div>
                
                <script>
                    function formatRelativeTime(dateString) {
                        const date = new Date(dateString);
                        const now = new Date();
                        const diff = now - date;
                        const minutes = Math.floor(diff / (1000 * 60));
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        
                        if (minutes < 60) return 'há ' + minutes + ' min';
                        if (hours < 24) return 'há ' + hours + ' h';
                        if (days < 7) return 'há ' + days + ' dias';
                        return date.toLocaleDateString('pt-PT');
                    }
                    
                    document.getElementById('refreshDashboard')?.addEventListener('click', function() {
                        loadDashboardContent('admin', 'overview');
                    });
                </script>
            `;
        } catch (error) {
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Erro ao carregar dashboard: ${error.message}</span>
                </div>
            `;
        }
    }

    // ========== FUNÇÕES AUXILIARES ==========
    function setupActionButtons() {
        // Configurar botões comuns
        document.querySelectorAll('.action-btn-view').forEach(btn => {
            btn.addEventListener('click', function() {
                showAlert('Visualizando detalhes...', 'info');
            });
        });
        
        document.querySelectorAll('.action-btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                showAlert('Modo de edição ativado', 'warning');
            });
        });
        
        document.querySelectorAll('.action-btn-delete').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (confirm('Tem certeza que deseja eliminar este item?')) {
                    try {
                        // Aqui implementaria a chamada API para eliminar
                        showAlert('Item eliminado com sucesso', 'success');
                    } catch (error) {
                        showAlert('Erro ao eliminar item', 'danger');
                    }
                }
            });
        });
    }

    // ========== CALENDÁRIO ==========
    function initCalendar(userType) {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl || typeof FullCalendar === 'undefined') return;
        
        const calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'pt',
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: async function(fetchInfo, successCallback, failureCallback) {
                try {
                    // Aqui implementaria a busca de eventos da API
                    // Por enquanto, eventos de exemplo
                    const events = [
                        {
                            title: 'Teste de Programação',
                            start: new Date(new Date().setDate(new Date().getDate() + 2)),
                            end: new Date(new Date().setDate(new Date().getDate() + 2)),
                            color: '#EF4444'
                        },
                        {
                            title: 'Entrega de Projeto',
                            start: new Date(new Date().setDate(new Date().getDate() + 5)),
                            end: new Date(new Date().setDate(new Date().getDate() + 5)),
                            color: '#10B981'
                        }
                    ];
                    successCallback(events);
                } catch (error) {
                    failureCallback(error);
                }
            },
            eventClick: function(info) {
                showAlert(`Evento: ${info.event.title}`, 'info');
            }
        });
        
        calendar.render();
    }

    // ========== VERIFICAÇÃO INICIAL ==========
    async function verificarAutenticacao() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                const resultado = await api.verificarToken();
                
                if (resultado.success) {
                    state.currentUser = resultado.usuario;
                    state.currentUserType = resultado.usuario.tipo;
                    state.isLoggedIn = true;
                    
                    if (navLinksContainer) {
                        navLinksContainer.classList.add('hidden');
                    }
                    
                    redirectToDashboard(state.currentUserType, state.currentUser);
                }
            } catch (error) {
                // Token inválido, limpar localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }
        }
    }

    // ========== INICIALIZAÇÃO ==========
    function init() {
        // Verificar autenticação
        verificarAutenticacao();
        
        // Inicializar sistema de login
        initLoginSystem();
        
        // Configurar logout
        setupLogoutButtons();
        
        // Configurar mapa da escola
        const schoolLocation = document.getElementById('schoolLocation');
        const openMapBtn = document.getElementById('openMapBtn');
        
        function openSchoolMap() {
            window.open('https://www.google.com/maps?q=56CW%2B38V+Luanda+Angola', '_blank');
        }
        
        if (schoolLocation) schoolLocation.addEventListener('click', openSchoolMap);
        if (openMapBtn) openMapBtn.addEventListener('click', openSchoolMap);
        
        // Configurar botões de ação
        setupActionButtons();
        
        // Testar conexão com API
        testAPIConnection();
    }

    async function testAPIConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (response.ok) {
                console.log('✅ API conectada com sucesso');
            } else {
                console.warn('⚠️ API pode não estar disponível');
            }
        } catch (error) {
            console.error('❌ Não foi possível conectar à API:', error);
            showAlert('Não foi possível conectar ao servidor. Verifique se o backend está em execução.', 'warning', 10000);
        }
    }

    // Iniciar aplicação
    init();

    // Exportar funções globais
    window.showAlert = showAlert;
    window.loadDashboardContent = loadDashboardContent;
    window.api = api;
    window.state = state;
});