const express = require('express');
const slashes = require('connect-slashes');
const cors = require('cors');
const { default: axios } = require('axios');

if(process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

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
  const clientURL = req.body.clientURL || "https://althsis.netlify.app";
  if(phone.length != 10){
    return res.json({err: "invalid phone number"});
  }
  console.log("Setu request:", { phone, CLIENT_ID, CLIENT_SECRET, clientURL });

  const CONSENT_DEADLINE = 2;
  let expiryDate = new Date(Date.now() + ( 3600 * 1000 * 24 * CONSENT_DEADLINE));

  axios.post(
    'https://fiu-uat.setu.co/consents',
    {
      "Detail": {
          "consentStart": `${(new Date()).toISOString()}`,
          "consentExpiry": expiryDate.toISOString(),
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
      "redirectUrl": `${clientURL}/dash?fromSetu=true`,
    },
    {
      headers: {
        "x-client-id": CLIENT_ID,
        "x-client-secret": CLIENT_SECRET
      }
    }
  )
  .then(setuResponse => {
    // console.log("Setu response:", setuResponse);
    res.json(setuResponse.data)
  })
  .catch(err => {
    // console.log("Setu error:", err);
    res.status(500).json({error: "Some issue accessing SETU APIs !!"})
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
  console.log("Get data: ", { dataSessionID, CLIENT_ID, CLIENT_SECRET });
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
      console.log("setu response", setuResponse.data);
      res.json(setuResponse.data)
    })
    .catch(err => {
      console.log("setu getData err", err);
      res.status(500).json({error: "Some error fetching data"});
    });
});

app.get('/responses/ping', (req, res)=>{
    res.status(200).send('-- ok --');
});

// 404 pages for development
app.get('*', (req, res)=>{
    res.status(404).send("API not found :(  <br> ¯\\_(ツ)_/¯");
});
