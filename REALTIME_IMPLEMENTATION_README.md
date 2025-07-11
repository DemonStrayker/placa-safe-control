# Sistema de Controle de Placas com Atualizações em Tempo Real

## 📋 Visão Geral

Este projeto implementa um sistema completo de controle de placas de veículos com atualizações em tempo real usando WebSockets. O sistema permite que transportadoras cadastrem placas e que todas as mudanças sejam refletidas instantaneamente para todos os usuários conectados (transportadoras, portaria e administradores).

## 🏗️ Arquitetura

- **Frontend**: React + TypeScript (hospedado na Vercel)
- **Backend**: Node.js + Express + SQLite
- **Tempo Real**: WebSockets (ws)
- **Autenticação**: bcrypt para senhas
- **Banco de Dados**: SQLite local

## 🚀 Instalação e Configuração

### 1. Configuração do Backend

#### Instalar Dependências
```bash
# Na raiz do projeto, crie o package.json do backend
cp server-package.json package.json
npm install
```

#### Dependências do Backend
- `express`: Servidor web
- `sqlite3`: Banco de dados SQLite
- `ws`: WebSocket server
- `bcrypt`: Criptografia de senhas
- `cors`: CORS para comunicação com frontend

### 2. Configuração do Banco de Dados

O banco SQLite será criado automaticamente na primeira execução. Estrutura das tabelas:

#### Tabela `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'transportadora', 'portaria')),
    max_plates INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela `plates`
```sql
CREATE TABLE plates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL,
    transportadora_id INTEGER NOT NULL,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    arrival_confirmed DATETIME NULL,
    departure_confirmed DATETIME NULL,
    scheduled_date DATETIME NULL,
    observations TEXT NULL,
    FOREIGN KEY(transportadora_id) REFERENCES users(id),
    UNIQUE(plate_number)
);
```

### 3. Usuários Padrão

O sistema vem com usuários pré-configurados:

| Username | Senha | Tipo | Nome |
|----------|-------|------|------|
| admin | admin123 | admin | Administrador |
| transportadora1 | trans123 | transportadora | Transportes ABC |
| transportadora2 | trans456 | transportadora | Logística XYZ |
| portaria | portaria123 | portaria | Portaria Principal |

## 🔧 Configuração para Produção com ngrok

### 1. Instalar ngrok
```bash
# Download do ngrok
# https://ngrok.com/download
```

### 2. Executar o Backend
```bash
node server.js
```

O servidor iniciará em:
- **HTTP API**: http://localhost:3000
- **WebSocket**: ws://localhost:8080

### 3. Expor com ngrok
```bash
# Terminal 1 - Expor API HTTP
ngrok http 3000

# Terminal 2 - Expor WebSocket
ngrok http 8080
```

Você receberá URLs como:
- **API HTTP**: `https://abc123.ngrok.io`
- **WebSocket**: `wss://def456.ngrok.io`

### 4. Configurar URLs no Frontend

Atualize os arquivos:

#### `src/contexts/AuthContext.tsx`
```typescript
const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  // Substitua pela sua URL ngrok HTTP
  return 'https://SEU_NGROK_HTTP_URL.ngrok.io';
};
```

#### `src/hooks/useWebSocket.ts`
```typescript
const getWebSocketUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:8080';
  }
  // Substitua pela sua URL ngrok WebSocket
  return 'wss://SEU_NGROK_WS_URL.ngrok.io';
};
```

## 📡 API Endpoints

### Autenticação
- `POST /api/login` - Login de usuário
- `GET /api/health` - Status do servidor

### Placas
- `GET /api/plates` - Listar todas as placas
- `POST /api/mark-plate` - Marcar nova placa (só transportadoras)
- `POST /api/confirm-arrival/:plateId` - Confirmar chegada (só portaria)
- `POST /api/confirm-departure/:plateId` - Confirmar saída (só portaria)

### Exemplos de Requisições

#### Login
```json
POST /api/login
{
  "username": "transportadora1",
  "password": "trans123"
}
```

#### Marcar Placa
```json
POST /api/mark-plate
{
  "username": "transportadora1",
  "password": "trans123",
  "plate_number": "ABC-1234",
  "scheduled_date": "2024-01-15T10:00:00Z",
  "observations": "Carga frágil"
}
```

## 🔄 WebSocket - Tempo Real

### Tipos de Mensagens
```typescript
interface WebSocketMessage {
  type: 'PLATE_ADDED' | 'PLATE_UPDATED' | 'PLATE_REMOVED';
  plate: Plate;
}
```

### Eventos
- **PLATE_ADDED**: Nova placa cadastrada
- **PLATE_UPDATED**: Placa atualizada (chegada/saída confirmada)
- **PLATE_REMOVED**: Placa removida do sistema

## 🛡️ Segurança

### 1. Criptografia de Senhas
- Senhas são criptografadas com bcrypt (salt rounds: 10)

### 2. Validação de Permissões
- **Transportadoras**: Só podem marcar suas próprias placas
- **Portaria**: Só pode confirmar chegadas/saídas
- **Admin**: Acesso total ao sistema

### 3. Validação de Placas
- Formato brasileiro: ABC-1234 ou ABC1D23
- Verificação de duplicatas
- Limite por transportadora

### 4. CORS
```javascript
app.use(cors({
  origin: ['https://placa-safe-control.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## 🧪 Testes

### 1. Teste Local
```bash
# Iniciar servidor
node server.js

# Acessar http://localhost:3000/api/health
# Deve retornar: {"status": "OK", "timestamp": "...", "websocket_clients": 0}
```

### 2. Teste de WebSocket
```javascript
// No console do navegador
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  console.log('Mensagem recebida:', JSON.parse(event.data));
};
```

### 3. Teste de Marcação
1. Faça login como transportadora
2. Cadastre uma placa
3. Verifique se outros usuários veem a atualização em tempo real

## 📦 Deploy e Manutenção

### 1. Manter Backend Ativo
```bash
# Usar PM2 para produção
npm install -g pm2
pm2 start server.js --name placa-backend
pm2 save
pm2 startup
```

### 2. Backup do Banco
```bash
# Backup automático
cp database.db database_backup_$(date +%Y%m%d_%H%M%S).db
```

### 3. Logs
```bash
# Ver logs do PM2
pm2 logs placa-backend

# Logs do WebSocket
# Conectados: aparece no console quando clientes conectam/desconectam
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. WebSocket não conecta
- Verificar se o servidor está rodando na porta 8080
- Verificar firewall
- Confirmar URL do ngrok

#### 2. CORS Error
- Verificar se o domínio está na lista de origens permitidas
- Confirmar configuração do CORS no servidor

#### 3. Banco de dados travado
```bash
# Verificar processos usando o banco
lsof database.db

# Reiniciar servidor se necessário
pm2 restart placa-backend
```

#### 4. Sincronização Frontend/Backend
- O frontend funciona offline (localStorage)
- O backend sincroniza quando disponível
- Verificar logs do console para erros

### Monitoramento

#### Status do Sistema
```bash
# Verificar status da API
curl https://SEU_NGROK_URL.ngrok.io/api/health

# Verificar conexões WebSocket
# O endpoint /api/health retorna o número de clientes conectados
```

## 📚 Documentação Adicional

### Fluxo de Dados
1. **Cadastro de Placa**: Frontend → Backend → Banco → WebSocket → Todos os Clientes
2. **Confirmação**: Portaria → Backend → Banco → WebSocket → Todos os Clientes
3. **Fallback**: Se backend offline, usa localStorage

### Estrutura de Arquivos
```
projeto/
├── server.js                 # Backend principal
├── server-package.json       # Dependências do backend
├── database.db              # Banco SQLite (criado automaticamente)
├── src/
│   ├── contexts/AuthContext.tsx    # Context com integração backend
│   ├── hooks/useWebSocket.ts       # Hook para WebSocket
│   ├── components/
│   │   ├── WebSocketStatus.tsx     # Status da conexão
│   │   └── TransportadoraDashboard.tsx # Dashboard atualizado
└── README.md                # Esta documentação
```

## 🎯 Próximos Passos

1. **Implementar notificações push** para mobile
2. **Dashboard de analytics** para administradores
3. **Backup automático** para nuvem
4. **Rate limiting** para evitar spam
5. **Logs de auditoria** para todas as ações

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do servidor (`pm2 logs`)
2. Verificar console do navegador
3. Testar endpoints com Postman/curl
4. Verificar status do ngrok

**Status do Sistema**: Use `/api/health` para verificar se tudo está funcionando.

**Tempo Real**: O badge no canto superior direito mostra o status da conexão WebSocket.