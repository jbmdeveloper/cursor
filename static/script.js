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

document.getElementById('formNovoProjeto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nomeProjeto').value;
    const valor_bruto = document.getElementById('valorBruto').value;
    const data_criacao = document.getElementById('dataCriacao').value;

    try {
        const response = await axios.post('/api/projeto', { nome, valor_bruto, data_criacao });
        mostrarNotificacao(`Projeto criado com sucesso! ID: ${response.data.id}`);
        fecharFormProjeto();
        await carregarProjetos();
    } catch (error) {
        console.error('Erro ao criar projeto:', error);
        mostrarNotificacao('Erro ao criar projeto: ' + (error.response ? error.response.data.erro : error.message));
    }
});

// Inicialização
// window.addEventListener('load', carregarProjetos);