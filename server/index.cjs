const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'vouchers');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { tripId, voucherId } = req.body;

        // Create trip-specific folder
        const tripFolder = path.join(uploadsDir, 'trips', tripId || 'general');
        if (!fs.existsSync(tripFolder)) {
            fs.mkdirSync(tripFolder, { recursive: true });
        }

        cb(null, tripFolder);
    },
    filename: (req, file, cb) => {
        const { voucherId } = req.body;
        const timestamp = Date.now();
        const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${voucherId || timestamp}_${cleanFilename}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo PDF e imágenes.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Upload endpoint
app.post('/api/upload/voucher', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }

        const { tripId } = req.body;
        const relativePath = `/uploads/vouchers/trips/${tripId || 'general'}/${req.file.filename}`;

        res.json({
            success: true,
            fileUrl: relativePath,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete file endpoint
app.delete('/api/delete/voucher', (req, res) => {
    try {
        const { fileUrl } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: 'No se especificó la URL del archivo' });
        }

        const filePath = path.join(__dirname, '..', fileUrl);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Archivo eliminado' });
        } else {
            res.status(404).json({ error: 'Archivo no encontrado' });
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Triex File Server Running',
        uploadsDir: uploadsDir
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande (máx 10MB)' });
        }
        return res.status(400).json({ error: err.message });
    }

    console.error('Server error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`🚀 Triex File Server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
});
