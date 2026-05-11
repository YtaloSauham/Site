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

    const convidados =
      values.slice(1).map(
        (row, index) => ({

          row:
            index + 2,

          nome:
            row[0] || '',

          apelido:
            row[1] || '',

          status:
            row[2] || 'PENDENTE',

          data:
            row[3] || ''

        })
      );

    res.status(200).json({
      convidados
    });

  } catch(error){

    console.log(error);

    res.status(500).json({
      error:
        'Erro ao obter convidados'
    });

  }

};