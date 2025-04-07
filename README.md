# ODX Backend

Este é um projeto backend para um sistema de gestão de casos forenses, desenvolvido com **Node.js**, **Express**, e **MongoDB**.

## Tecnologias Utilizadas
- Node.js
- Express
- MongoDB
- TypeScript
- bcryptjs (para hashing de senhas)
- cors (para controle de acessos)
- dotenv (para configuração de variáveis de ambiente)

## Como Rodar o Projeto

1. Clone este repositório:
   ```sh
   git clone https://github.com/seu-usuario/odx-backend.git
   cd odx-backend
   ```

2. Instale as dependências:
   ```sh
   npm install express mongoose dotenv cors bcryptjs jsonwebtoken
   ```

3. Configure as variáveis de ambiente criando um arquivo `.env` e preenchendo-o conforme necessário:
   ```env
   PORT=5000
   MONGO_URI=sua_string_de_conexao
   ```

4. Inicie o servidor:
   ```sh
   npm run dev
   ```

## Rotas Disponíveis até o momento

- `POST /api/auth/register` - Registra um usuário
- `GET /api/users` - Lista todos os usuários cadastrados

## Modelo do Banco de Dados

```mermaid
classDiagram

    class User {
        +String nome
        +String email
        +String senha
        +String role
        +String RG
        +String CRO (opcional para Perito)
        +login()
        +logout()
    }

    class Admin {
        +gerenciarUsuarios()
        +configurarSistema()
    }
    Admin --|> User

    class Perito {
        +cadastrarCaso()
        +analisarEvidencias()
        +gerarLaudo()
    }
    Perito --|> User

    class Assistente {
        +coletarEvidencias()
        +enviarDados()
    }
    Assistente --|> User

    class Case {
        +String id
        +String titulo
        +String descricao
        +String status
        +Date dataAbertura
        +Date dataFechamento
        +addEvidence()
        +generateReport()
        +updateStatus()
    }

    class Evidence {
        +String id
        +String tipo
        +Date dataColeta
        +User coletadoPor
        +upload()
    }

    class ImageEvidence {
        +String imagemURL
        +processarImagem()
    }
    ImageEvidence --|> Evidence

    class TextEvidence {
        +String conteudo
        +analiseDeTexto()
    }
    TextEvidence --|> Evidence

    class Report {
        +String id
        +String titulo
        +String conteudo
        +User peritoResponsavel
        +Date dataCriacao
        +assinarDigital()
        +exportarPDF()
    }

    class ComparisonResult {
        +String id
        +String resultado
        +Float precisao
        +User analisadoPor
        +Date dataAnalise
        +visualizarComparacao()
    }
```
