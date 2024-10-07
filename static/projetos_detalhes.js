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
        carregarCompras(projetoId);
    } catch (error) {
        console.error('Erro ao carregar detalhes do projeto:', error);
        mostrarNotificacao('Erro ao carregar detalhes do projeto');
    }
}

async function carregarCompras(projetoId) {
    try {
        const response = await axios.get(`/api/projeto/${projetoId}/compras`);
        const compras = response.data;
        atualizarTabelaCompras(compras);
    } catch (error) {
        console.error('Erro ao carregar compras:', error);
        mostrarNotificacao('Erro ao carregar compras do projeto');
    }
}

function atualizarTabelaCompras(compras) {
    const tbody = document.getElementById('compras-body');
    tbody.innerHTML = ''; // Limpa a tabela antes de adicionar as compras
    compras.forEach(compra => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${compra.nome}</td>
            <td>${compra.descricao}</td>
            <td>${formatarData(compra.data)}</td>
            <td>${formatarMoeda(compra.valor)}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function adicionarCompra(compra) {
    try {
        const response = await axios.post(`/api/projeto/${projetoAtual.id}/compras`, compra);
        console.log('Resposta do servidor ao adicionar compra:', response.data);
        mostrarNotificacao('Compra adicionada com sucesso');
    } catch (error) {
        console.error('Erro ao adicionar compra:', error);
        throw error; // Propaga o erro para ser tratado no evento de submit
    }
}

function exibirDetalhes(projeto) {
    console.log('Exibindo detalhes do projeto:', projeto);

    document.getElementById('nome-projeto').textContent = projeto.nome || 'Nome não disponível';
    document.getElementById('valor-bruto').textContent = formatarMoeda(projeto.valor_bruto);
    document.getElementById('valor-gasto').textContent = formatarMoeda(projeto.total_gasto);
    document.getElementById('valor-restante').textContent = formatarMoeda(projeto.valor_restante);
    document.getElementById('data-criacao').textContent = formatarData(projeto.data_criacao);
}

function formatarMoeda(valor) {
    if (valor == null || isNaN(valor)) return 'Valor não disponível';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    
    const [ano, mes, dia] = dataString.split('-');
    const data = new Date(ano, mes - 1, dia);
    
    if (isNaN(data.getTime())) {
        console.error('Data inválida:', dataString);
        return 'Data inválida';
    }
    
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function voltarParaLista() {
    window.location.href = '/';
}

function mostrarNotificacao(mensagem) {
    // Implementar lógica de notificação, se necessário
    console.log(mensagem);
}

function abrirModalCompra() {
    document.getElementById('modal-compra').style.display = 'block';
}

function fecharModalCompra() {
    document.getElementById('modal-compra').style.display = 'none';
}

document.getElementById('form-compra').addEventListener('submit', async function(e) {
    e.preventDefault();
    const novaCompra = {
        nome: document.getElementById('nome-compra').value,
        valor: parseFloat(document.getElementById('valor-compra').value),
        descricao: document.getElementById('descricao-compra').value,
        data: document.getElementById('data-compra').value
    };
    console.log('Dados da nova compra:', novaCompra); // Adicione este log
    try {
        await adicionarCompra(novaCompra);
        fecharModalCompra();
        document.getElementById('form-compra').reset();
        await carregarCompras(projetoAtual.id); // Recarrega as compras após adicionar
    } catch (error) {
        console.error('Erro ao adicionar compra:', error);
        alert('Erro ao adicionar compra. Por favor, tente novamente.');
    }
});

window.addEventListener('load', () => {
    console.log('Página carregada, chamando carregarDetalhes');
    carregarDetalhes();
});