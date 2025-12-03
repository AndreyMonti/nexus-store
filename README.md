# Nexus Store - E-commerce App

Um aplicativo e-commerce moderno com tema verde, suporte a modo claro/escuro e funcionalidades completas para compradores e vendedores.

## Configuração do Supabase

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha as informações do projeto
5. Aguarde a criação do banco de dados

### 2. Executar o Schema SQL
1. No painel do Supabase, vá para "SQL Editor"
2. Clique em "New Query"
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor SQL
5. Clique em "Run" para executar

### 3. Configurar Variáveis de Ambiente
1. No painel do Supabase, vá para "Settings" > "API"
2. Copie a "URL" do projeto
3. Copie a chave "anon/public"
4. Crie um arquivo `.env` na raiz do projeto
5. Adicione as seguintes linhas:

```env
EXPO_PUBLIC_SUPABASE_URL=sua-url-aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

## Funcionalidades

### Comprador
- ✅ Visualizar produtos com filtros por categoria
- ✅ Buscar produtos
- ✅ Ver detalhes do produto
- ✅ Adicionar ao carrinho
- ✅ Finalizar compra
- ✅ Gerenciar perfil
- ✅ Alternar entre modo claro/escuro

### Vendedor
- ✅ Cadastrar produtos
- ✅ Visualizar lista de produtos
- ✅ Ver pedidos recebidos
- ✅ Informações de entrega
- ✅ Gerenciar perfil
- ✅ Alternar entre modo claro/escuro

## Tecnologias

- React Native
- Expo
- TypeScript
- Expo Router
- Supabase
- AsyncStorage

## Como Usar

1. Faça a configuração do Supabase conforme instruções acima
2. Execute `npm install` ou `yarn install`
3. Execute `npm start` ou `yarn start`
4. Escaneie o QR code com o app Expo Go

## Estrutura do Banco de Dados

- **users**: Usuários (compradores e vendedores)
- **categories**: Categorias de produtos
- **products**: Produtos cadastrados
- **orders**: Pedidos realizados
- **order_items**: Itens dos pedidos
