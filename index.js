const express = require('express');
const slashes = require('connect-slashes');
const cors = require('cors');
const { default: axios } = require('axios');

const PORT = process.env.PORT || 5000;

// Setting up the server
const app = express();
app.use(cors())
app.use(express.json()) 
app.use(express.urlencoded({ extended: true })) 
app.use(slashes(false));
app.listen(PORT, () => console.log(`Althsis server is up and running on port ${PORT}`));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

app.post('/api/createConsent/:phone', (req, res) => {
  const phone = req.params.phone;
  if(phone.length != 10){
    return res.json({err: "invalid phone number"});
  }
  axios.post(
    'https://fiu-uat.setu.co/consents',
    {
      "Detail": {
          "consentStart": `${(new Date()).toISOString()}`,
          "consentExpiry": "2022-04-23T05:44:53.822Z",
          "Customer": {
              "id": `${phone}@onemoney`
          },
          "FIDataRange": {
              "from": "2021-01-01T00:00:00Z",
              "to": "2022-01-01T00:00:00Z"
          },
          "consentMode": "STORE",
          "consentTypes": [
              "TRANSACTIONS",
              "PROFILE",
              "SUMMARY"
          ],
          "fetchType": "PERIODIC",
          "Frequency": {
              "value": 30,
              "unit": "MONTH"
          },
          "DataFilter": [
              {
                  "type": "TRANSACTIONAMOUNT",
                  "value": "5000",
                  "operator": ">="
              }
          ],
          "DataLife": {
              "value": 1,
              "unit": "MONTH"
          },
          "DataConsumer": {
              "id": "setu-fiu-id"
          },
          "Purpose": {
              "Category": {
                  "type": "string"
              },
              "code": "101",
              "text": "Loan underwriting",
              "refUri": "https://api.rebit.org.in/aa/purpose/101.xml"
          },
          "fiTypes": [
              "DEPOSIT"
          ]
      },
      "redirectUrl": "https://althsis.netlify.app/dash?fromSetu=true"
    },
    {
      headers: {
        "x-client-id": CLIENT_ID,
        "x-client-secret": CLIENT_SECRET
      }
    }
  )
  .then(setuResponse => {
    res.json(setuResponse.data)
  })
  .catch(err => {
    res.json({error: err})
  });
});

app.get('/api/getConsent/:consentID', (req, res) => {
  const consentID = req.params.consentID;
  if(!consentID){
    return res.json({err: "invalid consent ID"});
  }
  axios.get(
    `https://fiu-uat.setu.co/consents/${consentID}`,
    {
      headers: {
        "x-client-id": CLIENT_ID,
        "x-client-secret": CLIENT_SECRET
      }
    }
  )
  .then(setuResponse => {
    res.json(setuResponse.data)
  })
  .catch(err => {
    res.json({error: err})
  });
});

app.post('/api/createDataSession/:consentID', (req, res) => {
  const consentID = req.params.consentID;
  if(!consentID){
    return res.json({err: "invalid consent ID"});
  }
  axios.post(
    `https://fiu-uat.setu.co/sessions`,
    {
      "consentId": consentID,
      "DataRange": {
        "from": "2021-01-01T00:00:00Z",
        "to": "2022-01-01T00:00:00Z"
      },
      "format": "json"
    },
    {
      headers: {
        "x-client-id": CLIENT_ID,
        "x-client-secret": CLIENT_SECRET
      }
    }
  )
  .then(setuResponse => {
    res.json(setuResponse.data)
  })
  .catch(err => {
    res.json({error: err})
  });
});

app.get('/api/getData/:dataSessionID', (req, res) => {
  const dataSessionID = req.params.dataSessionID;
  if(!dataSessionID){
    return res.json({err: "invalid consent ID"});
  }
  axios.get(
    `https://fiu-uat.setu.co/sessions/${dataSessionID}`,
    {
      headers: {
        "x-client-id": CLIENT_ID,
        "x-client-secret": CLIENT_SECRET
      }
    }
  )
  .then(setuResponse => {
    res.json(setuResponse.data)
  })
  .catch(err => {
    res.json({error: err})
  });
});

app.get('/responses/ping', (req, res)=>{
    res.status(200).send('-- ok --');
});

// 404 pages for development
app.get('*', (req, res)=>{
    res.status(404).send("API not found :(  <br> ¯\\_(ツ)_/¯");
});
