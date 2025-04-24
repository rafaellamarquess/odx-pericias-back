# ODX Backend

Este é um projeto backend para um sistema de gestão de casos forenses.

🔗 **API em Produção**: [https://odx-pericias-back.onrender.com](https://odx-pericias-back.onrender.com)

🔗 **Documentação da API**: [https://odx-pericias-back.onrender.com/api-docs](https://odx-pericias-back.onrender.com/api-docs)

## Principais Tecnologias Utilizadas
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
   npm install
   ```

3. Configure as variáveis de ambiente criando um arquivo `.env` e preenchendo-o conforme necessário.
    Exemplo:
   ```env
   PORT=5000
   MONGO_URI=sua_string_de_conexao
   ```

4. Inicie o servidor:
   ```sh
   npm run dev
   ```

## Modelo do Banco de Dados

```mermaid
classDiagram
   direction LR
    %% =================== USUÁRIOS =====================
    class User {
        +String nome
        +String email
        +String senha
        +String perfil
        +String rg
        +String cro (opcional para Perito)
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
        +cadastrarEvidencias()
        +gerarRelatório()
    }
    Perito --|> User

    class Assistente {
        +cadastrarEvidencias()
    }
    Assistente --|> User

    %% =================== CASO =====================
    class Case {
        +String id
        +String titulo
        +String descricao
        +String status
        +String responsavel
        +String cidade
        +String estado
        +String casoReferencia
        +Date dataCriacao
        +List~Evidence~ evidencias
        +addCase()
        +updateCase()
        +deleteCase()
    }

    %% =================== EVIDÊNCIAS =====================
    class Evidence {
        +String id
        +String tipo
        +String categoria
        +Date dataUpload
        +String vitima
        +String sexo
        +String estadoCorpo
        +String lesoes
        +String coletadoPor
        +String conteudo (para TextEvidence)
        +String imagemURL (para ImageEvidence)
        +String laudo
         +addEvidence()
        +updateEvidence()
        +deleteEvidence()
    }

    class ImageEvidence {
        +processarImagem()
    }
    ImageEvidence --|> Evidence

    class TextEvidence {
        +analiseDeTexto()
    }
    TextEvidence --|> Evidence

    class Report {
        +String id
        +String titulo
        +String descricao
        +String objetoPericia
        +String analiseTecnica
        +String metodoUtilizado
        +String destinatario
        +String materiaisUtilizados
        +String examesRealizados
        +String consideracoesTecnicoPericiais
        +String conclusaoTecnica
        +Date criadoEm
        +Boolean assinadoDigitalmente
        +List~Evidence~ evidencias
        +Case caso
         +generateReport()
        +assinarDigital()
    }

    %% =================== RELAÇÕES =====================
    Evidence --> Case : pertence a
    Case --> User : responsavel
    Report --> Case : refere-se a
    Report --> Evidence : analisa
    Evidence --> User : coletadoPor
```

