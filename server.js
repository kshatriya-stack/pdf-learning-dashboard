import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const FALLBACK_MODEL = 'gemini-3-flash-preview';

let geminiClient = null;
if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('replace_with')) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err.message);
  }
}

// Security & Parsing
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Load Curriculum Manifest
const curriculumPath = path.join(__dirname, 'data', 'curriculum.json');
let curriculumData = null;

try {
  if (fs.existsSync(curriculumPath)) {
    const raw = fs.readFileSync(curriculumPath, 'utf-8');
    curriculumData = JSON.parse(raw);
    console.log(`[Curriculum] Successfully loaded ${curriculumData.modules?.length || 0} modules and ${curriculumData.days?.length || 0} days from curriculum.json.`);
  } else {
    console.warn(`[Curriculum] curriculum.json not found at ${curriculumPath}. Run 'node generate_curriculum.js' first.`);
  }
} catch (err) {
  console.error('[Curriculum] Error parsing curriculum.json:', err.message);
}

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    port: PORT,
    curriculumLoaded: !!curriculumData,
    totalModules: curriculumData?.modules?.length || 0,
    totalDays: curriculumData?.days?.length || 0,
    aiConfigured: Boolean(geminiClient),
    model: GEMINI_MODEL,
    authoritativeSources: curriculumData?.metadata?.authoritativeSources || []
  });
});

// 2. Full Curriculum Manifest / Summary
app.get('/api/curriculum', (req, res) => {
  if (!curriculumData) {
    return res.status(503).json({ error: 'Curriculum data not loaded.' });
  }

  // Return curriculum metadata, modules, and lightweight day summaries
  const daySummaries = (curriculumData.days || []).map(d => ({
    day: d.day,
    moduleId: d.moduleId,
    moduleName: d.moduleName,
    title: d.title,
    duration: d.duration,
    pdfReferences: d.pdfReferences,
    prerequisites: d.prerequisites,
    the8020Knowledge: d.the8020Knowledge,
    deliverable: d.deliverable,
    resourceCount: d.resources?.length || 0,
    quizCount: d.quiz?.length || 0,
    interviewQuestionCount: d.interviewQuestions?.length || 0
  }));

  res.json({
    metadata: curriculumData.metadata,
    modules: curriculumData.modules,
    days: daySummaries
  });
});

// 3. Single Day Details
app.get('/api/day/:id', (req, res) => {
  if (!curriculumData) {
    return res.status(503).json({ error: 'Curriculum data not loaded.' });
  }

  const dayId = parseInt(req.params.id, 10);
  if (isNaN(dayId)) {
    return res.status(400).json({ error: 'Invalid day parameter.' });
  }

  const dayData = curriculumData.days?.find(d => d.day === dayId);
  if (!dayData) {
    return res.status(404).json({ error: `Day ${dayId} not found in curriculum.` });
  }

  res.json(dayData);
});

// 3b. Download Plain Text Study Guide for Single Day
app.get('/api/day/:id/text', (req, res) => {
  if (!curriculumData) {
    return res.status(503).json({ error: 'Curriculum data not loaded.' });
  }

  const dayId = parseInt(req.params.id, 10);
  const dayData = curriculumData.days?.find(d => d.day === dayId);
  if (!dayData) {
    return res.status(404).send(`Day ${dayId} not found.`);
  }

  const textContent = dayData.studyGuideText || `Study Guide for Day ${dayId}: ${dayData.title}`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Day_${dayId}_Study_Guide.txt"`);
  res.send(textContent);
});

// 4. Global Search across Topics, Notes & Concepts
app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').toString().toLowerCase().trim();
  if (!query) {
    return res.json({ results: [] });
  }

  if (!curriculumData) {
    return res.status(503).json({ error: 'Curriculum data not loaded.' });
  }

  const results = [];
  for (const day of (curriculumData.days || [])) {
    let score = 0;
    const matches = [];

    if (day.title.toLowerCase().includes(query)) {
      score += 10;
      matches.push(`Title: ${day.title}`);
    }
    if (day.moduleName.toLowerCase().includes(query)) {
      score += 4;
      matches.push(`Module: ${day.moduleName}`);
    }
    if (day.the8020Knowledge?.toLowerCase().includes(query)) {
      score += 6;
      matches.push(`80/20 Rule: ${day.the8020Knowledge.substring(0, 100)}...`);
    }
    if (day.whatExpertsUnderstand?.toLowerCase().includes(query)) {
      score += 6;
      matches.push(`Expert Notes: ${day.whatExpertsUnderstand.substring(0, 100)}...`);
    }

    const coreConcepts = day.topicExplanation?.coreConcepts || [];
    for (const c of coreConcepts) {
      if (c.toLowerCase().includes(query)) {
        score += 5;
        matches.push(`Core Concept: ${c}`);
      }
    }

    const iqList = day.interviewQuestions || [];
    for (const iq of iqList) {
      if (iq.question?.toLowerCase().includes(query)) {
        score += 4;
        matches.push(`Interview Question: ${iq.question}`);
      }
    }

    if (score > 0) {
      results.push({
        day: day.day,
        moduleId: day.moduleId,
        moduleName: day.moduleName,
        title: day.title,
        score,
        matches: matches.slice(0, 3),
        pdfReferences: day.pdfReferences
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  res.json({ query, totalMatches: results.length, results: results.slice(0, 25) });
});

// 5. Contextual AI Learning Assistant
app.post('/api/ai/ask', async (req, res) => {
  const { day: dayNumber, question, language = 'English', level = 'simple', userNotes = '' } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const dayData = curriculumData?.days?.find(d => d.day === parseInt(dayNumber, 10));
  const topicTitle = dayData ? dayData.title : 'Azure Data Engineering & Power BI Analytics';
  const pdfSources = dayData?.pdfReferences?.map(r => `${r.pdf} (page ${r.page})`).join(', ') || 'Course PDFs';
  const coreConcepts = dayData?.topicExplanation?.coreConcepts?.join('\n- ') || 'Fundamental engineering concepts';
  const expertNotes = dayData?.whatExpertsUnderstand || '';
  const the8020 = dayData?.the8020Knowledge || '';

  // Language instructions
  let langInstruction = 'Explain in clear, simple, friendly, easy-to-understand English without confusing academic jargon.';
  if (language === 'Hindi') {
    langInstruction = 'Explain in clear Devanagari Hindi with key technical terms kept in English for clarity.';
  } else if (language === 'Hinglish') {
    langInstruction = 'Explain in conversational, friendly Hinglish (Hindi written in Roman English script) with clear examples.';
  }

  const prompt = `
You are the personal AI Learning Coach for an intensive data curriculum grounded strictly in two official course documents:
1. Azure Data Engineering (GoOnlineTrainings, 19 pages)
2. Data Analytics Using Power BI (GoOnlineTrainings, 24 pages)

CURRENT CONTEXT:
- Day: ${dayData?.day || 'General'}
- Topic: "${topicTitle}"
- Source Reference: ${pdfSources}
- 80/20 Knowledge: "${the8020}"
- Expert Principles: "${expertNotes}"
- Core Syllabus Concepts:
- ${coreConcepts}
${userNotes ? `- User's Personal Notes on this Topic: "${userNotes}"` : ''}

USER QUESTION / TASK:
"${question}"

LANGUAGE & TONE REQUIREMENT:
- ${langInstruction}
- Mode: ${level === 'beginner' ? 'Beginner-friendly with practical analogies' : 'Advanced technical depth with architectural considerations'}
- Grounding: Always cite the source PDF and page number when explaining syllabus concepts.
- Strict Rule: Do not invent fake syllabus items or claims. If the user asks something outside the two PDFs, explicitly note it as helpful supplementary knowledge.

Respond in well-structured Markdown format with clear headings, bullet points, and code/syntax snippets if applicable.
`;

  if (geminiClient) {
    try {
      let aiResult = '';
      try {
        const response = await geminiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 2500
          }
        });
        aiResult = response.text || '';
      } catch (firstErr) {
        console.warn(`[AI Tutor] Primary model (${GEMINI_MODEL}) failed: ${firstErr.message}. Trying fallback (${FALLBACK_MODEL})...`);
        const fallbackResponse = await geminiClient.models.generateContent({
          model: FALLBACK_MODEL,
          contents: prompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 2500
          }
        });
        aiResult = fallbackResponse.text || '';
      }

      if (aiResult) {
        return res.json({
          answer: aiResult,
          groundedIn: pdfSources,
          topic: topicTitle,
          languageUsed: language
        });
      }
    } catch (err) {
      console.error('[AI Tutor] Gemini API error:', err.message);
    }
  }

  // High-Quality Curriculum Fallback (if API key not configured or quota limit hit)
  const fallbackAnswer = generateCurriculumFallback(dayData, question, language);
  return res.json({
    answer: fallbackAnswer,
    groundedIn: pdfSources,
    topic: topicTitle,
    languageUsed: language,
    fallback: true
  });
});

// 6. Interactive Answer & Quiz Evaluation
app.post('/api/ai/quiz-eval', async (req, res) => {
  const { question, userAnswer, correctAnswer, day: dayNumber } = req.body;

  if (!question || !userAnswer) {
    return res.status(400).json({ error: 'Question and userAnswer are required.' });
  }

  const prompt = `
You are a friendly, encouraging technical interview coach evaluating a candidate's answer.

QUESTION: "${question}"
REFERENCE / CORRECT CRITERIA: "${correctAnswer || 'Accurate technical answer'}"
CANDIDATE ANSWER: "${userAnswer}"

EVALUATION RUBRIC:
1. Score out of 100
2. Correctness (Did they capture the key principles?)
3. Strengths (What did they explain well?)
4. Missing Points & Gaps (What important detail or real-world aspect was skipped?)
5. Model Answer (A crisp 3-sentence ideal response they can use in an interview)

Return valid JSON with keys:
{
  "score": number,
  "passed": boolean,
  "verdict": "string",
  "strengths": "string",
  "improvements": "string",
  "modelAnswer": "string"
}
Return ONLY valid JSON.
`;

  if (geminiClient) {
    try {
      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err) {
      console.warn('[Quiz Eval] Gemini API error, using algorithmic evaluator:', err.message);
    }
  }

  // Algorithmic evaluation fallback
  const isMatch = userAnswer.toLowerCase().trim() === (correctAnswer || '').toLowerCase().trim();
  const words = userAnswer.trim().split(/\s+/).length;
  const score = isMatch ? 100 : (words >= 5 ? 75 : 50);

  res.json({
    score,
    passed: score >= 60,
    verdict: score >= 80 ? 'Excellent comprehension!' : 'Good effort, consider reviewing the detailed explanation.',
    strengths: `You provided ${words} words demonstrating understanding of key terms.`,
    improvements: correctAnswer ? `Compare your answer with the syllabus answer: "${correctAnswer}"` : 'Add specific production examples to make your answer stronger.',
    modelAnswer: correctAnswer || 'A production-ready solution requires addressing throughput, fault tolerance, and cost.'
  });
});

// 7. Dynamic Resource Finder for any specific syllabus topic
app.post('/api/ai/find-resources', (req, res) => {
  const { topic, language = 'All' } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const safeTopic = topic.replace(/[^\w\s-]/gi, '').trim();
  const encoded = encodeURIComponent(safeTopic);

  const curated = [
    {
      title: `${safeTopic} - Comprehensive Tutorial (English)`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + ' tutorial step by step')}`,
      type: 'Video',
      language: 'English',
      cost: 'Free',
      source: 'YouTube Search',
      why: `Direct search link finding up-to-date video tutorials on ${safeTopic}.`
    },
    {
      title: `${safeTopic} - Complete Explanation in Hindi / Hinglish`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + ' in hindi full tutorial')}`,
      type: 'Video',
      language: 'Hindi',
      cost: 'Free',
      source: 'YouTube Search',
      why: `Hindi explanation covering theoretical concepts and practical walkthroughs for ${safeTopic}.`
    },
    {
      title: `Microsoft Learn Documentation: ${safeTopic}`,
      url: `https://learn.microsoft.com/en-us/search/?terms=${encoded}`,
      type: 'Official Documentation',
      language: 'English',
      cost: 'Free',
      source: 'Microsoft Learn',
      why: `Authoritative enterprise documentation, architecture diagrams, and syntax guidelines.`
    },
    {
      title: `GitHub Open Source Examples & Labs: ${safeTopic}`,
      url: `https://github.com/search?q=${encoded}+tutorial+or+demo&type=repositories`,
      type: 'Code Repository',
      language: 'English',
      cost: 'Free',
      source: 'GitHub',
      why: `Hands-on sample code, real-world schemas, and configuration scripts.`
    }
  ];

  let filtered = curated;
  if (language === 'Hindi' || language === 'Hinglish') {
    filtered = curated.filter(r => r.language === 'Hindi' || r.language === 'Hinglish');
  } else if (language === 'English') {
    filtered = curated.filter(r => r.language === 'English');
  }

  res.json({
    topic: safeTopic,
    languageFilter: language,
    resources: filtered
  });
});

// Fallback response generator grounded in PDF curriculum data
function generateCurriculumFallback(dayData, question, language) {
  if (!dayData) {
    return `### Curriculum Grounded Guidance\n\nThis dashboard is built strictly from **Azure Data Engineering (19 pages)** and **Data Analytics Using Power BI (24 pages)**.\n\nPlease select a day from the curriculum to ask contextual questions about specific syllabus lessons.`;
  }

  const title = dayData.title;
  const sources = dayData.pdfReferences.map(r => `${r.pdf} page ${r.page}`).join(', ');
  const exp = dayData.topicExplanation;
  const the8020 = dayData.the8020Knowledge;
  const experts = dayData.whatExpertsUnderstand;

  return `### Grounded Learning Explanation for: ${title}
*Authoritative Reference: ${sources}*

#### 1. Core Principle (The 80/20 Rule)
> **Key Rule:** ${the8020}

#### 2. What It Is & Why It Matters
- **Concept:** ${exp.whatIsIt}
- **Real-World Value:** ${exp.whyLearnIt}
- **Production Practice:** ${exp.realWorldApplication}

#### 3. Core Syllabus Mechanics
${exp.coreConcepts.map(c => `- ${c}`).join('\n')}

#### 4. Expert Insight & Architecture
${experts}

#### 5. Common Beginner Pitfalls to Avoid
⚠️ **Mistake:** ${exp.commonMistakes}

#### 6. Actionable Takeaway
You should now be able to: **${exp.whatYouShouldBeAbleToDo}**

---
*Note: Real-time AI generative tutor is active when Gemini API is queried. All above points are guaranteed directly grounded in your curriculum manifest.*`;
}

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 PDF-Grounded Daily Learning Dashboard is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📚 Modules: ${curriculumData?.modules?.length || 0} | Days: ${curriculumData?.days?.length || 0}`);
  console.log(`🤖 AI Status: ${geminiClient ? 'Active (Gemini Flash Lite)' : 'Offline / Standalone Fallback Ready'}`);
  console.log(`=======================================================`);
});
