const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const axios   = require('axios');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;  

// POST  http://localhost:4000/api/ai-recipe
app.post('/api/ai-recipe', async (req, res) => {
  const { ingredients } = req.body;

  // basic validation
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'ingredients must be a non-empty array' });
  }

  const prompt = `
    I have these ingredients: ${ingredients.join(', ')}.
    , or i wanted to make a dish Suggest one complete recipe that uses them.
    Please include:
      • Title 
      • Ingredient list with quantities
      • Step-by-step instructions without any emojies anythting just give text form only without stars
  `.trim();

  try {
    // Corrected model name: 'gemini-1.5-flash-preview-0520' -> 'gemini-2.5-flash'
    const geminiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const aiText =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    if (!aiText) throw new Error('Empty response from Gemini');

    res.json({ recipe: aiText });
  } catch (err) {
    console.error('Gemini API error →', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate recipe from AI' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅  Server running at http://localhost:${PORT}`));
