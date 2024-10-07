from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import logging
import os
from flask_cors import CORS  # Importe o CORS

# Configuração de logging
logging.basicConfig(level=logging.DEBUG)

# Criação da aplicação Flask
app = Flask(__name__)
CORS(app)  # Habilite o CORS para todas as rotas

# Configuração do banco de dados
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'instance', 'construtora.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Criação da instância do SQLAlchemy
db = SQLAlchemy()
db.init_app(app)

# Definição dos modelos
class Projeto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    valor_bruto = db.Column(db.Float, nullable=False)
    data_criacao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    compras = db.relationship('Compra', backref='projeto', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'valor_bruto': self.valor_bruto,
            'data_criacao': self.data_criacao.strftime('%Y-%m-%d'),
            'compras': [compra.to_dict() for compra in self.compras]
        }

class Compra(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    descricao = db.Column(db.String(200), nullable=False)
    data = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projeto.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'valor': self.valor,
            'descricao': self.descricao,
            'data': self.data.strftime('%Y-%m-%d'),
            'projeto_id': self.projeto_id
        }

# Rotas da aplicação
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/projeto/<int:projeto_id>')
def projeto_detalhes(projeto_id):
    return render_template('projeto_detalhes.html')

@app.route('/api/projetos', methods=['GET'])
def listar_projetos():
    projetos = Projeto.query.all()
    projetos_lista = [{
        'id': p.id, 
        'nome': p.nome, 
        'data_criacao': p.data_criacao.strftime('%Y-%m-%d') if p.data_criacao else 'N/A'
    } for p in projetos]
    logging.info(f"Projetos listados: {projetos_lista}")
    return jsonify(projetos_lista)

@app.route('/api/projeto/<int:projeto_id>', methods=['GET'])
def obter_projeto(projeto_id):
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        total_gasto = sum(compra.valor for compra in projeto.compras)
        valor_restante = projeto.valor_bruto - total_gasto
        
        return jsonify({
            'id': projeto.id,
            'nome': projeto.nome,
            'valor_bruto': projeto.valor_bruto,
            'data_criacao': projeto.data_criacao.strftime('%Y-%m-%d'),
            'total_gasto': total_gasto,
            'valor_restante': valor_restante,
            'compras': [{
                'id': compra.id,
                'valor': compra.valor,
                'descricao': compra.descricao,
                'data': compra.data.strftime('%Y-%m-%d')
            } for compra in projeto.compras]
        })
    except Exception as e:
        logging.error(f"Erro ao obter detalhes do projeto {projeto_id}: {str(e)}")
        return jsonify({'erro': 'Erro ao carregar detalhes do projeto'}), 500

@app.route('/api/projeto', methods=['POST'])
def criar_projeto():
    try:
        dados = request.json
        logging.info(f"Dados recebidos para criar projeto: {dados}")
        
        if not dados:
            return jsonify({'erro': 'Nenhum dado recebido'}), 400
        
        if 'nome' not in dados or not dados['nome']:
            return jsonify({'erro': 'Nome do projeto não fornecido'}), 400
        
        if 'valor_bruto' not in dados or not dados['valor_bruto']:
            return jsonify({'erro': 'Valor bruto não fornecido'}), 400
        
        if 'data_criacao' not in dados or not dados['data_criacao']:
            return jsonify({'erro': 'Data de criação não fornecida'}), 400
        
        data_criacao = datetime.strptime(dados['data_criacao'], '%Y-%m-%d').date()
        
        if data_criacao > date.today():
            return jsonify({'erro': 'A data de criação não pode ser no futuro'}), 400
        
        novo_projeto = Projeto(
            nome=dados['nome'],
            valor_bruto=float(dados['valor_bruto']),
            data_criacao=data_criacao
        )
        db.session.add(novo_projeto)
        db.session.commit()
        
        logging.info(f"Projeto criado com sucesso: {novo_projeto.id}, Data: {novo_projeto.data_criacao}")
        
        return jsonify({
            'mensagem': 'Projeto criado com sucesso',
            'id': novo_projeto.id,
            'data_criacao': novo_projeto.data_criacao.strftime('%Y-%m-%d')
        }), 201
    except Exception as e:
        logging.error(f"Erro ao criar projeto: {str(e)}")
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@app.route('/api/projeto/<int:projeto_id>/compras', methods=['GET'])
def get_compras(projeto_id):
    projeto = Projeto.query.get_or_404(projeto_id)
    return jsonify([compra.to_dict() for compra in projeto.compras])

@app.route('/api/projeto/<int:projeto_id>/compras', methods=['POST'])
def add_compra(projeto_id):
    print(f"Recebida requisição para adicionar compra ao projeto {projeto_id}")
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        data = request.json
        print(f"Dados recebidos: {data}")
        
        if not all(key in data and data[key] for key in ['nome', 'valor', 'descricao', 'data']):
            missing_or_empty = [key for key in ['nome', 'valor', 'descricao', 'data'] if key not in data or not data[key]]
            error_msg = f'Dados incompletos ou vazios. Problemas com: {", ".join(missing_or_empty)}'
            print(error_msg)
            return jsonify({'erro': error_msg}), 400
        
        nova_compra = Compra(
            nome=data['nome'],
            valor=float(data['valor']),
            descricao=data['descricao'],
            data=datetime.strptime(data['data'], '%Y-%m-%d'),
            projeto_id=projeto_id
        )
        print(f"Nova compra criada: {nova_compra}")
        db.session.add(nova_compra)
        db.session.commit()
        print("Compra adicionada com sucesso ao banco de dados")
        return jsonify(nova_compra.to_dict()), 201
    except Exception as e:
        print(f"Erro ao adicionar compra: {str(e)}")
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
