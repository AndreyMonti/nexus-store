# Nexus Store

Nexus Store é um e-commerce completo desenvolvido para demonstração acadêmica.

---

## Pré-requisitos

- Node.js v18 ou superior  
- pnpm instalado globalmente (`npm i -g pnpm`)  
- Conta e projeto criado no Supabase

---

## Instalação

Para instalar as dependências, execute:

```bash
pnpm install
```

---

## Configuração do Banco de Dados (Supabase)

1. Acesse o painel do Supabase.  
2. Abra o **SQL Editor**.  
3. Na raiz do projeto existe um arquivo **.sql** contendo toda a estrutura do banco.  
4. Copie o conteúdo desse arquivo e cole no SQL Editor do Supabase ou faça upload direto.  
5. Execute o script para criar as tabelas e dados necessários.

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz com:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
PORT=3000
```

Ajuste de acordo com o seu projeto.

---

## Scripts Disponíveis

Confirme no `package.json`, mas normalmente:

```bash
pnpm dev       # modo desenvolvimento
pnpm build     # build de produção
pnpm start     # executar build
```

---

## Executar o Projeto

Após instalar as dependências e configurar o banco e o .env:

```bash
pnpm dev
```

Acesse `http://localhost:3000`.

---

## Deploy

Para gerar a build:

```bash
pnpm build
pnpm start
```

Lembre-se de configurar as variáveis de ambiente na plataforma onde fizer o deploy.

---

## Equipe

- Andrey Montibeller  
- Gustavo Martins  
- Rafael Leal  
- Rian Brito  
- Samuel Boaz  

---


