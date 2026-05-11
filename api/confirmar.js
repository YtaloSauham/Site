require('dotenv').config();

const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({

  credentials: {

    type:
      process.env.GOOGLE_TYPE,

    project_id:
      process.env.GOOGLE_PROJECT_ID,

    private_key_id:
      process.env.GOOGLE_PRIVATE_KEY_ID,

    private_key:
      process.env.GOOGLE_PRIVATE_KEY
        .replace(/\\n/g, '\n'),

    client_email:
      process.env.GOOGLE_CLIENT_EMAIL,

    client_id:
      process.env.GOOGLE_CLIENT_ID,

  },

  scopes: [
    'https://www.googleapis.com/auth/spreadsheets'
  ],

});

const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID;

const SHEET_NAME =
  process.env.SHEET_NAME;

module.exports = async (req, res) => {

  try {

    const { nome, status } =
      req.body;

    if(!nome || !status){

      return res.status(400).json({
        error:
          'Nome e status obrigatórios'
      });

    }

    const sheets =
      google.sheets({
        version: 'v4',
        auth
      });

    const response =
      await sheets.spreadsheets.values.get({

        spreadsheetId:
          SPREADSHEET_ID,

        range:
          `${SHEET_NAME}!A:D`

      });

    const values =
      response.data.values || [];

    let rowIndex = -1;

    for(
      let i = 1;
      i < values.length;
      i++
    ){

      if(values[i][0] === nome){

        rowIndex = i + 1;

        break;

      }

    }

    if(rowIndex === -1){

      return res.status(404).json({
        error:
          'Convidado não encontrado'
      });

    }

    const now =
      new Date()
        .toLocaleString('pt-BR');

    await sheets
      .spreadsheets
      .values
      .update({

        spreadsheetId:
          SPREADSHEET_ID,

        range:
          `${SHEET_NAME}!C${rowIndex}:D${rowIndex}`,

        valueInputOption:
          'RAW',

        requestBody: {

          values: [[
            status,
            now
          ]]

        }

      });

    res.status(200).json({
      success: true
    });

  } catch(error){

    console.log(error);

    res.status(500).json({
      error:
        'Erro ao confirmar'
    });

  }

};