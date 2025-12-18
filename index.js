const express = require('express');
const path = require('path');
const ktpGenerator = require('./ktp');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files dari folder public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

// Endpoint API untuk generate KTP
app.post('/api/ktp', async (req, res) => {
  try {
    console.log('Generating KTP for:', req.body.nama || 'Unknown');
    
    // Validasi
    const requiredFields = ['nama', 'nik', 'pas_photo', 'provinsi', 'kota'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: `Field berikut diperlukan: ${missingFields.join(', ')}`
      });
    }
    
    if (!/^\d{16}$/.test(req.body.nik)) {
      return res.status(400).json({ 
        error: 'Invalid NIK',
        message: 'NIK harus 16 digit angka'
      });
    }
    
    // Generate KTP
    const ktpBuffer = await ktpGenerator(req.body);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', ktpBuffer.length);
    res.send(ktpBuffer);
    
  } catch (error) {
    console.error('Error generating KTP:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Terjadi kesalahan saat generate KTP'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Semua route lainnya serve index.html (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/ktp`);
});