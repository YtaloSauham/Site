require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const cors =
  require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// Carregar credenciais da conta de serviço
//const credentialsPath = process.env.SERVICE_ACCOUNT_FILE;
//const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const credentials =
  JSON.parse(
    process.env.GOOGLE_CREDENTIALS
  );
  
// Configurar autenticação
const auth = new google.auth.GoogleAuth({
  credentials,

  scopes: [
    'https://www.googleapis.com/auth/spreadsheets'
  ],

});

// ID da planilha e nome da aba
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;

// Middleware
app.use(express.json());
app.use(express.static('.')); // Servir arquivos estáticos como index.html

// Endpoint para obter lista de convidados
app.get('/convidados', async (req, res) => {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`, // Coluna Convidados
    });
    const values = response.data.values || [];
    const convidados = values.slice(1).map(row => row[0]).filter(name => name); // Ignorar header
    res.json({ convidados });
  } catch (error) {
    console.error('Erro ao obter convidados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para confirmar presença
app.post('/confirmar', async (req, res) => {
  const { nome, status } = req.body;
  if (!nome || !status) {
    return res.status(400).json({ error: 'Nome e status são obrigatórios' });
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    // Obter todas as linhas
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
    });
    const values = response.data.values || [];

    // Encontrar a linha com o nome
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) { // Começar da linha 1 (após header)
      if (values[i][0] === nome) {
        rowIndex = i + 1; // +1 porque ranges são 1-based
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Nome não encontrado na lista' });
    }

    // Data e hora atual
   const now = new Date();

const brasilTime =
  new Date(
    now.toLocaleString(
      'en-US',
      {
        timeZone:
          'America/Sao_Paulo'
      }
    )
  );

const dataConfirmacao =
  brasilTime.toLocaleString(
    'pt-BR',
    {

      year:
        'numeric',

      month:
        '2-digit',

      day:
        '2-digit',

      hour:
        '2-digit',

      minute:
        '2-digit',

      second:
        '2-digit'

    }
  );

    // Atualizar Status (coluna C) e Data_Confirmação (coluna D)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!C${rowIndex}:D${rowIndex}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[status, dataConfirmacao]],
      },
    });

    res.json({ message: 'Confirmação registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao confirmar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});