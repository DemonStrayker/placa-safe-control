const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const WS_PORT = 8080;

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

wss.on('connection', (ws) => {
  console.log('🔗 Novo cliente WebSocket conectado');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔌 Cliente WebSocket desconectado');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ Erro no WebSocket:', error);
    clients.delete(ws);
  });
});

// Function to broadcast to all clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
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

// Login endpoint
app.post('/api/login', authenticateUser, (req, res) => {
  const { id, username, name, role, max_plates } = req.user;
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
  db.all(`
    SELECT p.*, u.name as transportadora_name 
    FROM plates p 
    JOIN users u ON p.transportadora_id = u.id 
    ORDER BY p.registration_date DESC
  `, (err, rows) => {
    if (err) {
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
    
    res.json(plates);
  });
});

// Mark plate endpoint - only for transportadoras
app.post('/api/mark-plate', authenticateUser, (req, res) => {
  const { plate_number, scheduled_date, observations } = req.body;
  
  if (req.user.role !== 'transportadora') {
    return res.status(403).json({ error: 'Apenas transportadoras podem marcar placas' });
  }

  if (!plate_number) {
    return res.status(400).json({ error: 'Número da placa é obrigatório' });
  }

  // Validate plate format
  const plateRegex = /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;
  if (!plateRegex.test(plate_number.toUpperCase())) {
    return res.status(400).json({ error: 'Formato de placa inválido. Use ABC-1234 ou ABC1D23' });
  }

  // Check if plate already exists
  db.get('SELECT id FROM plates WHERE plate_number = ?', [plate_number.toUpperCase()], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    
    if (existing) {
      return res.status(400).json({ error: 'Esta placa já está cadastrada' });
    }

    // Check user's plate limit
    db.get('SELECT COUNT(*) as count FROM plates WHERE transportadora_id = ?', [req.user.id], (err, result) => {
      if (err) {
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
          return res.status(500).json({ error: 'Erro ao cadastrar placa' });
        }

        // Get the inserted plate with transportadora name
        db.get(`
          SELECT p.*, u.name as transportadora_name 
          FROM plates p 
          JOIN users u ON p.transportadora_id = u.id 
          WHERE p.id = ?
        `, [this.lastID], (err, plate) => {
          if (err) {
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
  
  db.run('UPDATE plates SET arrival_confirmed = CURRENT_TIMESTAMP WHERE id = ?', [plateId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao confirmar chegada' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Placa não encontrada' });
    }

    // Get updated plate
    db.get(`
      SELECT p.*, u.name as transportadora_name 
      FROM plates p 
      JOIN users u ON p.transportadora_id = u.id 
      WHERE p.id = ?
    `, [plateId], (err, plate) => {
      if (err) {
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
  
  // Check if arrival was confirmed first
  db.get('SELECT arrival_confirmed FROM plates WHERE id = ?', [plateId], (err, plate) => {
    if (err) {
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
        return res.status(500).json({ error: 'Erro ao confirmar saída' });
      }

      // Get updated plate
      db.get(`
        SELECT p.*, u.name as transportadora_name 
        FROM plates p 
        JOIN users u ON p.transportadora_id = u.id 
        WHERE p.id = ?
      `, [plateId], (err, plate) => {
        if (err) {
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    websocket_clients: clients.size
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor Express rodando na porta ${PORT}`);
  console.log(`🔗 WebSocket rodando na porta ${WS_PORT}`);
  console.log(`👥 ${clients.size} clientes WebSocket conectados`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  db.close((err) => {
    if (err) {
      console.error('❌ Erro ao fechar banco de dados:', err.message);
    } else {
      console.log('✅ Conexão com banco de dados fechada.');
    }
  });
  wss.close(() => {
    console.log('✅ WebSocket server fechado.');
  });
  process.exit(0);
});