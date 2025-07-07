# Sistema de Gestão de Placas

Sistema web para gestão de placas de veículos com múltiplos tipos de usuário: administrador, transportadoras e portaria.

## Funcionalidades

### Administrador
- Gerenciar configurações do sistema (limites, horários, dias permitidos)
- Visualizar todas as placas cadastradas
- Gerenciar transportadoras (adicionar, remover, definir limites)
- Controle total do sistema

### Transportadoras
- Cadastrar placas de veículos
- Visualizar suas próprias placas
- Remover placas cadastradas
- Respeitar limites e horários configurados

### Portaria
- Visualizar todas as placas cadastradas no sistema
- Confirmar chegada de veículos
- Confirmar saída de veículos (apenas após chegada confirmada)
- Filtrar placas por status (pendente, presente, saiu)
- Buscar por placa ou transportadora

## Credenciais de Acesso

### Administrador
- Usuário: `admin`
- Senha: `admin123`

### Transportadoras
- Usuário: `transportadora1` / Senha: `trans123`
- Usuário: `transportadora2` / Senha: `trans456`

### Portaria
- Usuário: `portaria`
- Senha: `portaria123`

## Como Usar

### Configuração do Sistema (Admin)
1. Faça login com as credenciais de administrador
2. Configure os limites de placas (total do sistema e por transportadora)
3. Defina horários e dias permitidos para cadastro
4. Gerencie transportadoras conforme necessário

### Cadastro de Placas (Transportadoras)
1. Faça login com as credenciais da transportadora
2. Use o formulário para adicionar novas placas
3. Formatos aceitos: ABC-1234 ou ABC1D23
4. Respeite os limites e horários configurados

### Controle de Portaria
1. Faça login com as credenciais da portaria
2. Visualize todas as placas cadastradas
3. Use os filtros para organizar por status
4. Confirme chegadas e saídas conforme os veículos chegam
5. A saída só pode ser confirmada após a chegada

## Status das Placas

- **Pendente**: Placa cadastrada, aguardando chegada
- **Presente**: Chegada confirmada, veículo no local
- **Saiu**: Saída confirmada, processo finalizado

## Validações de Segurança

- Apenas portaria pode confirmar chegadas/saídas
- Saída só é permitida após confirmação de chegada
- Confirmações são imutáveis (não podem ser editadas)
- Cada tipo de usuário tem acesso apenas às suas funcionalidades
- Dados são armazenados localmente no navegador

## Estrutura de Dados

### Usuário
```typescript
interface User {
  id: string;
  username: string;
  type: 'admin' | 'transportadora' | 'portaria';
  name: string;
  maxPlates?: number;
}
```

### Placa
```typescript
interface Plate {
  id: string;
  number: string;
  transportadoraId: string;
  createdAt: Date;
  transportadoraName: string;
  arrivalConfirmed?: Date;
  departureConfirmed?: Date;
}
```

### Configuração do Sistema
```typescript
interface SystemConfig {
  maxTotalPlates: number;
  maxPlatesPerTransportadora: number;
  allowedHours: { start: string; end: string };
  allowedDays: number[]; // 0-6 (Domingo-Sábado)
}
```

## Project info

**URL**: https://lovable.dev/projects/2949290b-4cb5-46c3-9342-ec4f1bc3e531

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2949290b-4cb5-46c3-9342-ec4f1bc3e531) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2949290b-4cb5-46c3-9342-ec4f1bc3e531) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
