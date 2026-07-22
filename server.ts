import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { storageService } from './src/services/storageService';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5000mb' }));
  app.use(express.urlencoded({ limit: '5000mb', extended: true }));

  const PORT = 3000;

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API Endpoint for AI Business Assistant
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, context, history, apiKey: clientApiKey, model: clientModel, persona } = req.body;

      const activeApiKey = clientApiKey || apiKey;

      if (!activeApiKey) {
        return res.status(503).json({
          error: 'Gemini API key is not configured. Please supply a valid Gemini API Key via the System Administration settings page.'
        });
      }

      // Initialize dynamic instance if client provided a key, or fallback to default
      const activeAi = clientApiKey ? new GoogleGenAI({
        apiKey: clientApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      }) : ai;

      if (!activeAi) {
        return res.status(503).json({
          error: 'Gemini AI client failed to initialize. Please verify your API key.'
        });
      }

      const activeModel = clientModel || 'gemini-3.5-flash';
      const basePersona = persona || `You are an expert Retail Business Intelligence & Financial Analyst for a retail shop.
Your goal is to analyze the shop's operational metrics, sales performance, debts, and inventory levels, and provide deep, data-grounded insights and operational advice.`;

      // Formulate system instruction to ground the model on local business data
      const systemInstruction = `
${basePersona}

You are provided with a read-only snapshot context of the local database (IndexedDB statistics).

--- REAL-TIME BUSINESS METRICS CONTEXT ---
${JSON.stringify(context, null, 2)}
--- END OF CONTEXT ---

CRITICAL COMPLIANCE RULES:
1. Ground your answers strictly on the above numbers, lists, or metrics.
2. If the user asks about revenue, profit, low stock items, or credit, reference the specific facts from the context.
3. If some data is missing or zero, point it out gently and suggest next steps (e.g., adding sales, recording purchases).
4. Provide structured, clean, and highly readable advice. Use bullet points or mini-tables where helpful.
5. Keep your tone professional, encouraging, objective, and expert.
6. Format all currency values elegantly (e.g., $1,234.56).
`;

      // Format chat history for Gemini's SDK format
      const contents = [
        ...(history || []).map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        })),
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ];

      const response = await activeAi.models.generateContent({
        model: activeModel,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.6,
        }
      });

      res.json({
        text: response.text || 'No response generated.'
      });

    } catch (err: any) {
      console.error('AI Processing Error:', err);
      res.status(500).json({
        error: err.message || 'An error occurred during AI processing.'
      });
    }
  });

  // ==========================================
  // JSON DATABASE STORAGE & SYNC API ENDPOINTS
  // ==========================================

  // Load entire database
  app.get(['/api/db/load', '/api/database'], async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      res.json({ status: 'success', database: dbData });
    } catch (err: any) {
      console.error('Error loading database:', err);
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // Save entire database (full overwrite)
  app.post(['/api/db/save', '/api/database'], async (req, res) => {
    try {
      const database = req.body.database || req.body;
      if (!database || typeof database !== 'object') {
        return res.status(400).json({ status: 'error', error: 'Missing database payload' });
      }
      await storageService.saveDatabase(database);
      res.json({ status: 'success', message: 'Database saved successfully' });
    } catch (err: any) {
      console.error('Error saving database:', err);
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // Validate JSON database
  app.post('/api/database/validate', async (req, res) => {
    try {
      const database = req.body.database || req.body;
      const validation = storageService.validateDatabase(database);
      res.json({
        valid: validation.valid,
        errors: validation.errors,
        warnings: [],
        repairableRecords: []
      });
    } catch (err: any) {
      res.status(500).json({ valid: false, errors: [err.message || err] });
    }
  });

  // Sync client-side changes (Last Updated Wins & soft delete processing)
  app.post('/api/db/sync', async (req, res) => {
    try {
      const { payload } = req.body; // Array of { table: string, records: any[] }
      if (!payload || !Array.isArray(payload)) {
        return res.status(400).json({ status: 'error', error: 'Payload must be an array' });
      }
      const syncResult = await storageService.syncDatabase(payload);
      res.json({ status: 'success', ...syncResult });
    } catch (err: any) {
      console.error('Error syncing database:', err);
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // List available backups
  app.get('/api/db/backups', async (req, res) => {
    try {
      const backups = await storageService.listBackups();
      res.json({ status: 'success', backups });
    } catch (err: any) {
      console.error('Error listing backups:', err);
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // Create timestamped backup (manual trigger)
  app.post(['/api/db/backup', '/api/database/backup'], async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const fileName = await storageService.backupDatabase(dbData);
      res.json({ status: 'success', fileName, message: `Backup created successfully: ${fileName}` });
    } catch (err: any) {
      console.error('Error creating backup:', err);
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // Restore database from specific backup file
  app.post(['/api/db/restore', '/api/database/restore'], async (req, res) => {
    try {
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ status: 'error', error: 'Missing fileName parameter' });
      }
      const restoredDb = await storageService.restoreDatabase(fileName);
      res.json({ status: 'success', database: restoredDb, message: `Database restored from backup: ${fileName}` });
    } catch (err: any) {
      console.error('Error restoring backup:', err);
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // Export full database JSON as downloadable attachment
  app.get(['/api/db/export', '/api/database/export'], async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="database_export.json"');
      res.send(JSON.stringify(dbData, null, 2));
    } catch (err: any) {
      console.error('Error exporting database:', err);
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // Import full database JSON
  app.post('/api/db/import', async (req, res) => {
    try {
      const { database } = req.body;
      if (!database) {
        return res.status(400).json({ status: 'error', error: 'Missing database import payload' });
      }
      await storageService.importDatabase(database);
      res.json({ status: 'success', message: 'Database imported successfully' });
    } catch (err: any) {
      console.error('Error importing database:', err);
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // Entity-specific REST endpoints
  app.post('/api/customers', async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const newCustomer = req.body;
      dbData.customers = dbData.customers || [];
      dbData.customers.push(newCustomer);
      await storageService.saveDatabase(dbData);
      res.json({ status: 'success', customer: newCustomer });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const id = req.params.id;
      dbData.customers = (dbData.customers || []).map((c: any) => String(c.id) === String(id) ? { ...c, ...req.body } : c);
      await storageService.saveDatabase(dbData);
      res.json({ status: 'success' });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  app.post('/api/sales', async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const { sale, items, creditAccount } = req.body;
      if (sale) {
        dbData.sales = dbData.sales || [];
        dbData.sales.push(sale);
      }
      if (items && Array.isArray(items)) {
        dbData.saleItems = dbData.saleItems || [];
        dbData.saleItems.push(...items);
      }
      if (creditAccount) {
        dbData.creditAccounts = dbData.creditAccounts || [];
        dbData.creditAccounts.push(creditAccount);
      }
      await storageService.saveDatabase(dbData);
      res.json({ status: 'success' });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  app.post('/api/loans/:id/payments', async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const payment = req.body;
      dbData.creditPayments = dbData.creditPayments || [];
      dbData.creditPayments.push(payment);
      await storageService.saveDatabase(dbData);
      res.json({ status: 'success', payment });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const newProduct = req.body;
      dbData.products = dbData.products || [];
      dbData.products.push(newProduct);
      await storageService.saveDatabase(dbData);
      res.json({ status: 'success', product: newProduct });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const id = req.params.id;
      dbData.products = (dbData.products || []).map((p: any) => String(p.id) === String(id) ? { ...p, ...req.body } : p);
      await storageService.saveDatabase(dbData);
      res.json({ status: 'success' });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const expense = req.body;
      dbData.expenses = dbData.expenses || [];
      dbData.expenses.push(expense);
      await storageService.saveDatabase(dbData);
      res.json({ status: 'success', expense });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  app.post('/api/purchases', async (req, res) => {
    try {
      const dbData = await storageService.loadDatabase();
      const { purchase, items } = req.body;
      if (purchase) {
        dbData.purchases = dbData.purchases || [];
        dbData.purchases.push(purchase);
      }
      if (items && Array.isArray(items)) {
        dbData.purchaseItems = dbData.purchaseItems || [];
        dbData.purchaseItems.push(...items);
      }
      await storageService.saveDatabase(dbData);
      res.json({ status: 'success' });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message || err });
    }
  });

  // Vite dev integration or static files serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
