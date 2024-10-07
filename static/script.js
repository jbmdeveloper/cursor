let projetos = [];
let projetosPagina = [];
const projetosPorPagina = 10;
let paginaAtual = 1;

async function carregarProjetos() {
    try {
        const response = await axios.get('/api/projetos');
        projetos = response.data;
        atualizarPaginacao();
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        mostrarNotificacao('Erro ao carregar projetos');
    }
}

function atualizarPaginacao() {
    const totalPaginas = Math.ceil(projetos.length / projetosPorPagina);
    const inicio = (paginaAtual - 1) * projetosPorPagina;
    const fim = inicio + projetosPorPagina;
    projetosPagina = projetos.slice(inicio, fim);
    exibirProjetos();
    atualizarBotoesPaginacao(totalPaginas);
}

function exibirProjetos() {
    const tbody = document.querySelector('#listaProjetos tbody');
    tbody.innerHTML = '';
    projetosPagina.forEach(projeto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${projeto.id}</td>
            <td>${projeto.nome}</td>
            <td>${formatarData(projeto.data_criacao)}</td>
        `;
        tr.addEventListener('click', () => {
            window.location.href = `/projeto/${projeto.id}`;
        });
        tbody.appendChild(tr);
    });
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function atualizarBotoesPaginacao(totalPaginas) {
    const paginacao = document.getElementById('paginacao');
    paginacao.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => mudarPagina(i));
        if (i === paginaAtual) {
            button.classList.add('active');
        }
        paginacao.appendChild(button);
    }
}

function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    atualizarPaginacao();
}

function mostrarFormProjeto() {
    document.getElementById('formProjeto').style.display = 'block';
}

function fecharFormProjeto() {
    document.getElementById('formProjeto').style.display = 'none';
}

function mostrarNotificacao(mensagem) {
    const notificacao = document.getElementById('notificacao');
    notificacao.textContent = mensagem;
    notificacao.style.display = 'block';
    setTimeout(() => {
        notificacao.style.display = 'none';
    }, 3000);
}

async function criarProjeto(dadosProjeto) {
    try {
        const response = await axios.post('/api/projeto', dadosProjeto, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Resposta do servidor:', response.data);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar projeto:', error);
        if (error.response) {
            // O servidor respondeu com um status de erro
            console.error('Resposta de erro do servidor:', error.response.data);
            throw new Error(error.response.data.erro || 'Erro desconhecido do servidor');
        } else if (error.request) {
            // A requisição foi feita mas não houve resposta
            console.error('Nenhuma resposta recebida:', error.request);
            throw new Error('Não foi possível conectar ao servidor');
        } else {
            // Algo aconteceu na configuração da requisição que causou o erro
            console.error('Erro na configuração da requisição:', error.message);
            throw error;
        }
    }
}

// Uso da função
document.getElementById('formCriarProjeto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nomeProjeto').value;
    const valorBruto = document.getElementById('valorBruto').value;
    const dataCriacao = document.getElementById('dataCriacao').value;

    try {
        const resultado = await criarProjeto({ nome, valor_bruto: valorBruto, data_criacao: dataCriacao });
        console.log('Projeto criado:', resultado);
        // Atualize a UI ou redirecione conforme necessário
    } catch (erro) {
        console.error('Falha ao criar projeto:', erro.message);
        // Mostre uma mensagem de erro para o usuário
    }
});

// Inicialização
window.addEventListener('load', carregarProjetos);