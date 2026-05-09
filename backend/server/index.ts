import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  authenticateUser,
  createUser,
  getUserById,
  findUserByEmail,
} from './authService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN || true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI missing in .env');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const MODEL_NAME = 'gemini-2.5-flash';
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const requireGenerativeAI = () => {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is missing. AI features are unavailable until it is configured.');
  }

  return genAI;
};

app.get('/', (_req, res) => {
  res.send('Backend is running successfully');
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const user = await createUser(email, name, password);

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: unknown) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Signup failed',
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

app.get('/api/auth/me/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error: unknown) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get user',
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, section } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = requireGenerativeAI().getGenerativeModel({
      model: MODEL_NAME,
    });

    const prompt = `
You are ScholarFlow, an expert academic research assistant.

Context: The user is writing the "${section}" section of a research paper.
User Request: ${message}

Guidelines:
1. Use formal, academic English.
2. Suggest structure and citations where appropriate.
3. Be encouraging but rigorous.
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return res.json({ text: response });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'AI failed',
    });
  }
});

app.post('/api/analyze-document', async (req, res) => {
  try {
    const { fileName, content } = req.body;

    if (!fileName || !content) {
      return res.status(400).json({ error: 'fileName and content are required' });
    }

    const model = requireGenerativeAI().getGenerativeModel({
      model: MODEL_NAME,
    });

    const analysisPrompt = `
You are an expert academic document reviewer for ScholarFlow.

DOCUMENT TO ANALYZE:
File: ${fileName}
Content:
${content}

---

Analyze this research document and provide structured feedback in JSON format ONLY (no markdown, no extra text).

Return a JSON object with this exact structure:
{
  "fileName": "${fileName}",
  "documentStructure": [
    {
      "section": "Abstract",
      "exists": boolean,
      "feedback": "string",
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    },
    {
      "section": "Introduction",
      "exists": boolean,
      "feedback": "string",
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    },
    {
      "section": "Literature Review",
      "exists": boolean,
      "feedback": "string",
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    },
    {
      "section": "Methodology",
      "exists": boolean,
      "feedback": "string",
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    },
    {
      "section": "Results",
      "exists": boolean,
      "feedback": "string",
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    },
    {
      "section": "Discussion",
      "exists": boolean,
      "feedback": "string",
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    },
    {
      "section": "Conclusion",
      "exists": boolean,
      "feedback": "string",
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    },
    {
      "section": "References",
      "exists": boolean,
      "feedback": "string",
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "overallQuality": {
    "clarity": number 0-100,
    "academicTone": number 0-100,
    "structure": number 0-100,
    "completeness": number 0-100,
    "overall": number 0-100
  },
  "majorIssues": ["issue1", "issue2", "issue3"],
  "improvementSuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "rewrites": [
    {
      "section": "section name",
      "original": "weak sentence",
      "improved": "better version"
    }
  ]
}

Guidelines:
1. Check if each section exists and is properly labeled
2. Identify clarity issues, grammar mistakes, academic tone problems
3. Be constructive and specific with suggestions
4. Provide 3-5 rewrites for weak sentences if found
5. Evaluate overall structure, flow, and completeness
6. Scores should be realistic (40-90 range for most documents)
7. Return ONLY valid JSON, no extra text

Return the JSON object only.`;

    const result = await model.generateContent(analysisPrompt);
    const responseText = result.response.text();

    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', responseText);
      return res.status(500).json({ error: 'Failed to parse analysis response' });
    }

    return res.json({ analysis });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Analysis failed',
    });
  }
});

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();
