const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['https://placa-safe-control.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco de dados:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite.');
  }
});

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'transportadora', 'portaria')),
    max_plates INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Plates table
  db.run(`CREATE TABLE IF NOT EXISTS plates (
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
  )`);

  // Insert default users if they don't exist
  const defaultUsers = [
    { username: 'admin', password: 'admin123', name: 'Administrador', role: 'admin' },
    { username: 'transportadora1', password: 'trans123', name: 'Transportes ABC', role: 'transportadora', max_plates: 5 },
    { username: 'transportadora2', password: 'trans456', name: 'Logística XYZ', role: 'transportadora', max_plates: 3 },
    { username: 'portaria', password: 'portaria123', name: 'Portaria Principal', role: 'portaria' }
  ];

  defaultUsers.forEach(async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    db.run(`INSERT OR IGNORE INTO users (username, password, name, role, max_plates) 
            VALUES (?, ?, ?, ?, ?)`, 
            [user.username, hashedPassword, user.name, user.role, user.max_plates || null]);
  });
});

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });
const clients = new Set();

console.log(`🔗 WebSocket server iniciado na porta ${WS_PORT}`);

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`🔗 Novo cliente WebSocket conectado de ${clientIP}`);
  clients.add(ws);

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'CONNECTION_CONFIRMED',
    message: 'Conectado ao servidor WebSocket',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    console.log(`🔌 Cliente WebSocket desconectado (${clientIP})`);
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ Erro no WebSocket:', error);
    clients.delete(ws);
  });

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  ws.on('pong', () => {
    console.log('💓 Heartbeat recebido do cliente');
  });
});

// Function to broadcast to all clients
function broadcast(data) {
  const message = JSON.stringify(data);
  console.log(`📡 Broadcasting para ${clients.size} clientes:`, data.type);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem para cliente:', error);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  });
}

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error('❌ Erro na consulta do usuário:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    websocket_clients: clients.size,
    database_status: 'Connected'
  });
});

// Login endpoint
app.post('/api/login', authenticateUser, (req, res) => {
  const { id, username, name, role, max_plates } = req.user;
  console.log(`✅ Login bem-sucedido: ${username} (${role})`);
  
  res.json({
    success: true,
    user: {
      id: id.toString(),
      username,
      name,
      type: role,
      maxPlates: max_plates
    }
  });
});

// Get all plates
app.get('/api/plates', (req, res) => {
  console.log('📋 Buscando todas as placas...');
  
  db.all(`
    SELECT p.*, u.name as transportadora_name 
    FROM plates p 
    JOIN users u ON p.transportadora_id = u.id 
    ORDER BY p.registration_date DESC
  `, (err, rows) => {
    if (err) {
      console.error('❌ Erro ao buscar placas:', err);
      return res.status(500).json({ error: 'Erro ao buscar placas' });
    }
    
    const plates = rows.map(row => ({
      id: row.id.toString(),
      number: row.plate_number,
      transportadoraId: row.transportadora_id.toString(),
      transportadoraName: row.transportadora_name,
      createdAt: row.registration_date,
      arrivalConfirmed: row.arrival_confirmed,
      departureConfirmed: row.departure_confirmed,
      scheduledDate: row.scheduled_date,
      observations: row.observations
    }));
    
    console.log(`✅ Retornando ${plates.length} placas`);
    res.json(plates);
  });
});

// Mark plate endpoint - only for transportadoras
app.post('/api/mark-plate', authenticateUser, (req, res) => {
  const { plate_number, scheduled_date, observations } = req.body;
  
  console.log(`🚛 Tentativa de marcar placa: ${plate_number} por ${req.user.username}`);
  
  if (req.user.role !== 'transportadora') {
    return res.status(403).json({ error: 'Apenas transportadoras podem marcar placas' });
  }

  if (!plate_number) {
    return res.status(400).json({ error: 'Número da placa é obrigatório' });
  }

  // Validate plate format
  // Formato antigo brasileiro: ABC1234 (sem hífen)
  // Formato Mercosul: ABC1D23 (sem hífen)
  const plateRegex = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;
  if (!plateRegex.test(plate_number.toUpperCase())) {
    return res.status(400).json({ error: 'Formato de placa inválido. Use ABC1234 (antiga) ou ABC1D23 (Mercosul)' });
  }

  // Check if plate already exists
  db.get('SELECT id FROM plates WHERE plate_number = ?', [plate_number.toUpperCase()], (err, existing) => {
    if (err) {
      console.error('❌ Erro ao verificar placa existente:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    
    if (existing) {
      return res.status(400).json({ error: 'Esta placa já está cadastrada' });
    }

    // Check user's plate limit
    db.get('SELECT COUNT(*) as count FROM plates WHERE transportadora_id = ?', [req.user.id], (err, result) => {
      if (err) {
        console.error('❌ Erro ao verificar limite de placas:', err);
        return res.status(500).json({ error: 'Erro no servidor' });
      }

      if (result.count >= req.user.max_plates) {
        return res.status(400).json({ error: `Limite de ${req.user.max_plates} placas atingido` });
      }

      // Insert new plate
      db.run(`
        INSERT INTO plates (plate_number, transportadora_id, scheduled_date, observations)
        VALUES (?, ?, ?, ?)
      `, [plate_number.toUpperCase(), req.user.id, scheduled_date || null, observations || null], function(err) {
        if (err) {
          console.error('❌ Erro ao inserir placa:', err);
          return res.status(500).json({ error: 'Erro ao cadastrar placa' });
        }

        console.log(`✅ Placa ${plate_number} cadastrada com ID ${this.lastID}`);

        // Get the inserted plate with transportadora name
        db.get(`
          SELECT p.*, u.name as transportadora_name 
          FROM plates p 
          JOIN users u ON p.transportadora_id = u.id 
          WHERE p.id = ?
        `, [this.lastID], (err, plate) => {
          if (err) {
            console.error('❌ Erro ao buscar placa cadastrada:', err);
            return res.status(500).json({ error: 'Erro ao buscar placa cadastrada' });
          }

          const newPlate = {
            id: plate.id.toString(),
            number: plate.plate_number,
            transportadoraId: plate.transportadora_id.toString(),
            transportadoraName: plate.transportadora_name,
            createdAt: plate.registration_date,
            arrivalConfirmed: plate.arrival_confirmed,
            departureConfirmed: plate.departure_confirmed,
            scheduledDate: plate.scheduled_date,
            observations: plate.observations
          };

          // Broadcast to all connected clients
          broadcast({
            type: 'PLATE_ADDED',
            plate: newPlate
          });

          res.json({
            success: true,
            plate: newPlate
          });
        });
      });
    });
  });
});

// Confirm arrival endpoint - only for portaria
app.post('/api/confirm-arrival/:plateId', authenticateUser, (req, res) => {
  if (req.user.role !== 'portaria') {
    return res.status(403).json({ error: 'Apenas portaria pode confirmar chegadas' });
  }

  const plateId = req.params.plateId;
  console.log(`🚪 Confirmando chegada da placa ID: ${plateId}`);
  
  db.run('UPDATE plates SET arrival_confirmed = CURRENT_TIMESTAMP WHERE id = ?', [plateId], function(err) {
    if (err) {
      console.error('❌ Erro ao confirmar chegada:', err);
      return res.status(500).json({ error: 'Erro ao confirmar chegada' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Placa não encontrada' });
    }

    console.log(`✅ Chegada confirmada para placa ID: ${plateId}`);

    // Get updated plate
    db.get(`
      SELECT p.*, u.name as transportadora_name 
      FROM plates p 
      JOIN users u ON p.transportadora_id = u.id 
      WHERE p.id = ?
    `, [plateId], (err, plate) => {
      if (err) {
        console.error('❌ Erro ao buscar placa atualizada:', err);
        return res.status(500).json({ error: 'Erro ao buscar placa atualizada' });
      }

      const updatedPlate = {
        id: plate.id.toString(),
        number: plate.plate_number,
        transportadoraId: plate.transportadora_id.toString(),
        transportadoraName: plate.transportadora_name,
        createdAt: plate.registration_date,
        arrivalConfirmed: plate.arrival_confirmed,
        departureConfirmed: plate.departure_confirmed,
        scheduledDate: plate.scheduled_date,
        observations: plate.observations
      };

      // Broadcast to all connected clients
      broadcast({
        type: 'PLATE_UPDATED',
        plate: updatedPlate
      });

      res.json({
        success: true,
        plate: updatedPlate
      });
    });
  });
});

// Confirm departure endpoint - only for portaria
app.post('/api/confirm-departure/:plateId', authenticateUser, (req, res) => {
  if (req.user.role !== 'portaria') {
    return res.status(403).json({ error: 'Apenas portaria pode confirmar saídas' });
  }

  const plateId = req.params.plateId;
  console.log(`🚪 Confirmando saída da placa ID: ${plateId}`);
  
  // Check if arrival was confirmed first
  db.get('SELECT arrival_confirmed FROM plates WHERE id = ?', [plateId], (err, plate) => {
    if (err) {
      console.error('❌ Erro ao verificar chegada:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    if (!plate) {
      return res.status(404).json({ error: 'Placa não encontrada' });
    }

    if (!plate.arrival_confirmed) {
      return res.status(400).json({ error: 'Confirmação de chegada é necessária antes da saída' });
    }

    db.run('UPDATE plates SET departure_confirmed = CURRENT_TIMESTAMP WHERE id = ?', [plateId], function(err) {
      if (err) {
        console.error('❌ Erro ao confirmar saída:', err);
        return res.status(500).json({ error: 'Erro ao confirmar saída' });
      }

      console.log(`✅ Saída confirmada para placa ID: ${plateId}`);

      // Get updated plate
      db.get(`
        SELECT p.*, u.name as transportadora_name 
        FROM plates p 
        JOIN users u ON p.transportadora_id = u.id 
        WHERE p.id = ?
      `, [plateId], (err, plate) => {
        if (err) {
          console.error('❌ Erro ao buscar placa atualizada:', err);
          return res.status(500).json({ error: 'Erro ao buscar placa atualizada' });
        }

        const updatedPlate = {
          id: plate.id.toString(),
          number: plate.plate_number,
          transportadoraId: plate.transportadora_id.toString(),
          transportadoraName: plate.transportadora_name,
          createdAt: plate.registration_date,
          arrivalConfirmed: plate.arrival_confirmed,
          departureConfirmed: plate.departure_confirmed,
          scheduledDate: plate.scheduled_date,
          observations: plate.observations
        };

        // Broadcast to all connected clients
        broadcast({
          type: 'PLATE_UPDATED',
          plate: updatedPlate
        });

        res.json({
          success: true,
          plate: updatedPlate
        });
      });
    });
  });
});

// WebSocket status endpoint
app.get('/api/websocket-status', (req, res) => {
  res.json({
    connected_clients: clients.size,
    server_status: 'running',
    port: WS_PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor Express rodando na porta ${PORT}`);
  console.log(`🔗 WebSocket rodando na porta ${WS_PORT}`);
  console.log(`👥 ${clients.size} clientes WebSocket conectados`);
  console.log(`📊 Status: http://localhost:${PORT}/api/health`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  
  // Close WebSocket connections
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1000, 'Server shutdown');
    }
  });
  
  wss.close(() => {
    console.log('✅ WebSocket server fechado.');
  });
  
  db.close((err) => {
    if (err) {
      console.error('❌ Erro ao fechar banco de dados:', err.message);
    } else {
      console.log('✅ Conexão com banco de dados fechada.');
    }
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});