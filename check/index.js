const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pdf = require('html-pdf');
const path = require('path');
path.resolve();

const app = express();
const port = 3000;

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Mock database for simplicity
let checksDatabase = [];


app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});
// Endpoint to create a new check
app.post('/create-check', (req, res) => {
  try {
    // Your existing code...

    console.log('Check created successfully');
  } catch (error) {
    console.error('Error creating check:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }



  const { payee, amount, date } = req.body;

  // Validate input (add more validation as needed)
  if (!payee || !amount || !date) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Create a new check
  const newCheck = {
    payee,
    amount,
    date,
  };

  // Add the check to the database
  checksDatabase.push(newCheck);

  return res.status(201).json({ message: 'Check created successfully' });
});

// Endpoint to get all checks
app.get('/get-checks', (req, res) => {
  return res.status(200).json(checksDatabase);
});

// Endpoint to print a check (generates a simple PDF for demonstration purposes)
app.post('/print-check', (req, res) => {
  const { payee, amount, date } = req.body;

  // Generate a simple HTML for the check
  const html = `
    <h2>Check Details</h2>
    <p><strong>Payee:</strong> ${payee}</p>
    <p><strong>Amount:</strong> ${amount}</p>
    <p><strong>Date:</strong> ${date}</p>
  `;

  // Generate PDF from HTML (you might want to use a more sophisticated library for production)
  pdf.create(html).toFile('/printed-check.pdf', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error generating PDF' });
    }

    return res.status(200).json({ message: 'Check printed successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
