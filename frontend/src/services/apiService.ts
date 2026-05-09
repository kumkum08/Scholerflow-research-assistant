const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    if (error.message === 'Failed to fetch') {
      return 'Cannot reach the server. Start the backend and open the app from the same device or network.';
    }

    return error.message;
  }

  return fallback;
};

export const signupUser = async (email: string, name: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Signup failed with status ${response.status}`);
    }

    return data;
  } catch (error: unknown) {
    console.error('Signup error:', error);
    throw new Error(getErrorMessage(error, 'Signup failed. Please try again.'));
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Login failed with status ${response.status}`);
    }

    return data;
  } catch (error: unknown) {
    console.error('Login error:', error);
    throw new Error(getErrorMessage(error, 'Login failed. Please try again.'));
  }
};

export const getUserInfo = async (userId: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/me/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to get user info'));
  }
};

export const sendMessageToAI = async (message: string, section: string) => {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, section }),
    });

    if (!response.ok) {
      throw new Error('Server unreachable');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.warn('Using offline fallback templates...');
    return getOfflineTemplate(section);
  }
};

export const analyzeDocument = async (fileName: string, content: string) => {
  try {
    const response = await fetch(`${API_URL}/analyze-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, content }),
    });

    if (!response.ok) {
      throw new Error('Server unreachable');
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.warn('Using offline document analysis...');
    return getOfflineDocumentAnalysis(fileName, content);
  }
};

const getOfflineTemplate = (section: string) => {
  const templates: Record<string, string> = {
    Abstract:
      'Offline Mode: Your abstract should summarize your research question, methodology, results, and conclusions in about 250 words.',
    Introduction:
      'Offline Mode: Start with a hook, define the problem, and clearly state your thesis statement.',
    Methodology:
      'Offline Mode: Detail your research design, participants or data sources, and step-by-step procedures.',
    Default:
      "I'm currently in offline mode. Please check your server connection for full AI assistance.",
  };

  return templates[section] || templates.Default;
};

const getOfflineDocumentAnalysis = (fileName: string, content: string) => {
  const sections = [
    'Abstract',
    'Introduction',
    'Literature Review',
    'Methodology',
    'Results',
    'Discussion',
    'Conclusion',
    'References',
  ];

  const documentStructure = sections.map((section) => {
    const lowerSection = section.toLowerCase();
    const exists = content.toLowerCase().includes(lowerSection);

    return {
      section,
      exists,
      feedback: exists
        ? `The ${section} section is present in the document.`
        : `The ${section} section appears to be missing or not clearly labeled.`,
      issues: exists
        ? [
            `Verify that the ${section} section meets academic standards.`,
            `Check for clear and coherent writing in this section.`,
          ]
        : [`${section} section needs to be added`],
      suggestions: exists
        ? [
            `Ensure the ${section} follows standard academic conventions.`,
            `Review for clarity, grammar, and academic tone.`,
          ]
        : [`Create a comprehensive ${section} section`],
    };
  });

  return {
    fileName,
    documentStructure,
    overallQuality: {
      clarity: content.length > 500 ? 70 : 50,
      academicTone: 65,
      structure: 60,
      completeness: Math.min(100, (content.length / 5000) * 100),
      overall: 65,
    },
    majorIssues: [
      'Consider server-based AI analysis for more detailed feedback.',
      'Some sections may need expansion or restructuring.',
    ],
    improvementSuggestions: [
      'Ensure each section is clearly labeled and separated.',
      'Maintain a consistent academic tone throughout.',
      'Use proper citations and references.',
      'Proofread for grammatical errors and clarity.',
    ],
    rewrites: [],
  };
};
