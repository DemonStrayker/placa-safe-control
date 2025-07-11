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
# Na raiz do projeto
npm install express sqlite3 ws bcrypt cors
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
- **API HTTP**: `https://abc123-def456.ngrok-free.app`
- **WebSocket**: `wss://ghi789-jkl012.ngrok-free.app`

### 4. Configurar URLs no Frontend

Atualize os arquivos:

#### `src/contexts/AuthContext.tsx`
```typescript
const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  // Substitua pela sua URL ngrok HTTP
  return 'https://abc123-def456.ngrok-free.app';
};
```

#### `src/hooks/useWebSocket.ts`
```typescript
const getWebSocketUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:8080';
  }
  // Substitua pela sua URL ngrok WebSocket
  return 'wss://ghi789-jkl012.ngrok-free.app';
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

### WebSocket
- `GET /api/websocket-status` - Status das conexões WebSocket

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
  type: 'PLATE_ADDED' | 'PLATE_UPDATED' | 'PLATE_REMOVED' | 'CONNECTION_CONFIRMED';
  plate?: Plate;
  message?: string;
  timestamp?: string;
}
```

### Eventos
- **CONNECTION_CONFIRMED**: Confirmação de conexão estabelecida
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
ws.onopen = () => console.log('✅ WebSocket conectado');
ws.onmessage = (event) => {
  console.log('📨 Mensagem recebida:', JSON.parse(event.data));
};
ws.onerror = (error) => console.error('❌ Erro WebSocket:', error);
```

### 3. Teste de Marcação em Tempo Real
1. Abra duas abas do navegador
2. Faça login como transportadora em uma aba
3. Faça login como portaria na outra aba
4. Cadastre uma placa na aba da transportadora
5. ✅ Verifique se a placa aparece instantaneamente na aba da portaria

### 4. Teste de Confirmações
1. Na aba da portaria, confirme a chegada da placa
2. ✅ Verifique se o status é atualizado em tempo real na aba da transportadora
3. Confirme a saída da placa
4. ✅ Verifique se o status final é sincronizado

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

# Logs do WebSocket aparecem no console quando clientes conectam/desconectam
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. WebSocket não conecta
**Sintomas**: Badge mostra "Desconectado", console mostra erros de conexão

**Soluções**:
```bash
# Verificar se o servidor está rodando
curl http://localhost:3000/api/health

# Verificar WebSocket
curl http://localhost:3000/api/websocket-status

# Verificar portas
netstat -tulpn | grep :8080
```

#### 2. CORS Error
**Sintomas**: Erro de CORS no console do navegador

**Solução**: Verificar se o domínio está na lista de origens permitidas no `server.js`

#### 3. Banco de dados travado
```bash
# Verificar processos usando o banco
lsof database.db

# Reiniciar servidor se necessário
pm2 restart placa-backend
```

#### 4. ngrok URLs não funcionam
**Sintomas**: Erro 502 ou timeout

**Soluções**:
```bash
# Verificar se ngrok está rodando
ngrok status

# Verificar se as URLs estão corretas no código
# Verificar se o servidor local está rodando antes do ngrok
```

### Monitoramento

#### Status do Sistema
```bash
# Verificar status da API
curl https://SEU_NGROK_URL.ngrok-free.app/api/health

# Verificar conexões WebSocket
curl https://SEU_NGROK_URL.ngrok-free.app/api/websocket-status
```

#### Logs de Debug
```javascript
// No console do navegador - testar WebSocket
const ws = new WebSocket('wss://SEU_NGROK_WS_URL.ngrok-free.app');
ws.onopen = () => console.log('✅ Conectado');
ws.onmessage = (e) => console.log('📨', JSON.parse(e.data));
ws.onerror = (e) => console.error('❌', e);
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
├── database.db              # Banco SQLite (criado automaticamente)
├── src/
│   ├── contexts/AuthContext.tsx    # Context com integração backend
│   ├── hooks/useWebSocket.ts       # Hook para WebSocket
│   ├── components/
│   │   ├── WebSocketStatus.tsx     # Status da conexão
│   │   └── TransportadoraDashboard.tsx # Dashboard atualizado
└── REALTIME_IMPLEMENTATION_README.md # Esta documentação
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

### 1. Verificar Logs
```bash
# Logs do servidor
pm2 logs placa-backend

# Logs do navegador
# F12 → Console → Procurar erros em vermelho
```

### 2. Testar Endpoints
```bash
# Testar API
curl https://SEU_NGROK_URL.ngrok-free.app/api/health

# Testar WebSocket
curl https://SEU_NGROK_URL.ngrok-free.app/api/websocket-status
```

### 3. Verificar Configuração
- URLs do ngrok estão corretas no código?
- Servidor local está rodando antes do ngrok?
- Firewall não está bloqueando as portas?

**Status do Sistema**: Use `/api/health` para verificar se tudo está funcionando.

**Tempo Real**: O badge no canto superior direito mostra o status da conexão WebSocket.

## ✅ Checklist de Implementação

- [ ] Instalar dependências: `npm install express sqlite3 ws bcrypt cors`
- [ ] Executar servidor: `node server.js`
- [ ] Configurar ngrok para portas 3000 e 8080
- [ ] Atualizar URLs no frontend (`AuthContext.tsx` e `useWebSocket.ts`)
- [ ] Testar conexão WebSocket no console do navegador
- [ ] Testar cadastro de placa em tempo real
- [ ] Verificar sincronização entre múltiplas abas
- [ ] Confirmar persistência no banco SQLite