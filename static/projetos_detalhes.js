let projetoAtual = null;

async function carregarDetalhes() {
    console.log('Iniciando carregamento de detalhes');
    const projetoId = window.location.pathname.split('/').pop();
    console.log('ID do projeto:', projetoId);
    
    try {
        console.log('Fazendo requisição para a API');
        const response = await axios.get(`/api/projeto/${projetoId}`);
        console.log('Resposta da API:', response.data);
        
        projetoAtual = response.data;
        exibirDetalhes(projetoAtual);
    } catch (error) {
        console.error('Erro ao carregar detalhes do projeto:', error);
        if (error.response) {
            console.error('Resposta de erro:', error.response.data);
        }
        mostrarNotificacao('Erro ao carregar detalhes do projeto');
    }
}

function exibirDetalhes(projeto) {
    console.log('Exibindo detalhes do projeto:', projeto);

    const nomeProjeto = document.getElementById('nomeProjeto');
    if (nomeProjeto) {
        console.log('Elemento nomeProjeto encontrado');
        if (projeto && projeto.nome) {
            nomeProjeto.textContent = projeto.nome;
            console.log('Nome do projeto definido:', projeto.nome);
        } else {
            nomeProjeto.textContent = 'Nome do projeto não disponível';
            console.log('Nome do projeto não disponível');
        }
    } else {
        console.error('Elemento com id "nomeProjeto" não encontrado');
    }

    exibirValor('valorBruto', projeto.valor_bruto, 'Valor Bruto');
    exibirValor('valorGasto', projeto.total_gasto, 'Valor Gasto');
    exibirValor('valorRestante', projeto.valor_restante, 'Valor Restante');
}

function exibirValor(id, valor, label) {
    const elemento = document.getElementById(id);
    if (elemento) {
        if (valor !== undefined) {
            elemento.textContent = formatarMoeda(valor);
            console.log(`${label} definido:`, valor);
        } else {
            elemento.textContent = `${label} não disponível`;
            console.log(`${label} não disponível`);
        }
    } else {
        console.error(`Elemento com id "${id}" não encontrado`);
    }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function voltarParaInicio() {
    window.location.href = '/';
}

function mostrarFormCompra() {
    document.getElementById('formCompra').style.display = 'block';
}

function fecharFormCompra() {
    document.getElementById('formAdicionarCompra').reset();
    document.getElementById('formCompra').style.display = 'none';
}

function mostrarNotificacao(mensagem) {
    document.getElementById('mensagemNotificacao').textContent = mensagem;
    document.getElementById('notificacao').style.display = 'block';
}

function fecharNotificacao() {
    document.getElementById('notificacao').style.display = 'none';
}

document.getElementById('formAdicionarCompra').addEventListener('submit', async (e) => {
    e.preventDefault();
    const valor = document.getElementById('valorCompra').value;
    const descricao = document.getElementById('descricaoCompra').value;
    const data = document.getElementById('dataCompra').value;
    try {
        await axios.post('/api/compra', { 
            projeto_id: projetoAtual.id, 
            valor: parseFloat(valor), 
            descricao, 
            data 
        });
        mostrarNotificacao('Compra adicionada com sucesso!');
        await carregarDetalhes();
        fecharFormCompra();
    } catch (error) {
        console.error('Erro ao adicionar compra:', error);
        mostrarNotificacao('Erro ao adicionar compra');
    }
});

window.addEventListener('load', () => {
    console.log('Página carregada, chamando carregarDetalhes');
    carregarDetalhes();
});