const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { generateInsights, askAI, predictRisk } = require('./services/genai');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

// --- MOCK DATABASE ---
const statsData = {
  avgRisk: 43, highRisk: 1, mediumRisk: 2, lowRisk: 2, totalStudents: 1250,
};

const courses = [
  { id: 1, name: 'Intro to Computer Science', risk: 'Low', students: 450, avgScore: 82.5, trend: '+2.1%', riskScore: 12 },
  { id: 2, name: 'Linear Algebra', risk: 'Medium', students: 320, avgScore: 71.2, trend: '-1.5%', riskScore: 45 },
  { id: 3, name: 'Cell Biology', risk: 'Medium', students: 180, avgScore: 75.8, trend: '+0.5%', riskScore: 58 },
  { id: 4, name: 'Modern Literature', risk: 'High', students: 210, avgScore: 68.4, trend: '+5.2%', riskScore: 89 },
  { id: 5, name: 'Strategic Management', risk: 'Low', students: 90, avgScore: 88.1, trend: '+1.0%', riskScore: 15 },
];

const detailedDataMap = {
  4: {
    stats: { avgScore: '68.4%', stdDev: '14.2', lateSub: '24.5%', dupScores: '42.1%' },
    insights: 'Abnormal clustering of identical scores detected in Midterm Essay submissions. 42% of students submitted within a 15-minute window with unusually high similarity in structural formatting.',
    recommendations: [
      'Diversify question banks for future essay prompts.',
      'Implement randomized variants for exam sections.',
      'Review the 15-minute submission window logs for IP matching.',
      'Improve grading consistency checks across TAs.'
    ],
    gradeDist: [
      { grade: 'A', count: 15 }, { grade: 'B', count: 45 }, { grade: 'C', count: 85 }, { grade: 'D', count: 40 }, { grade: 'F', count: 25 },
    ],
    timingDist: [
      { time: 'Day 1', submissions: 10 }, { time: 'Day 2', submissions: 25 }, { time: 'Day 3', submissions: 35 }, { time: 'Day 4', submissions: 120 }, { time: 'Late', submissions: 20 },
    ],
    trendData: [
      { week: 'Wk 1', performance: 75, risk: 20 }, { week: 'Wk 2', performance: 72, risk: 25 }, { week: 'Wk 3', performance: 74, risk: 30 }, { week: 'Wk 4', performance: 65, risk: 65 }, { week: 'Wk 5', performance: 68, risk: 89 },
    ]
  }
};

const defaultDetailedData = {
  stats: { avgScore: '78.2%', stdDev: '8.4', lateSub: '5.2%', dupScores: '12.4%' },
  insights: 'Normal distribution detected. Submissions follow expected timing patterns. No significant anomalies found in recent assessments.',
  recommendations: [
    'Maintain current assessment protocols.',
    'Continue regular monitoring of submission timings.'
  ],
  gradeDist: [
    { grade: 'A', count: 45 }, { grade: 'B', count: 80 }, { grade: 'C', count: 60 }, { grade: 'D', count: 15 }, { grade: 'F', count: 5 },
  ],
  timingDist: [
    { time: 'Day 1', submissions: 40 }, { time: 'Day 2', submissions: 60 }, { time: 'Day 3', submissions: 75 }, { time: 'Day 4', submissions: 25 }, { time: 'Late', submissions: 5 },
  ],
  trendData: [
    { week: 'Wk 1', performance: 76, risk: 15 }, { week: 'Wk 2', performance: 78, risk: 12 }, { week: 'Wk 3', performance: 77, risk: 14 }, { week: 'Wk 4', performance: 79, risk: 10 }, { week: 'Wk 5', performance: 78, risk: 12 },
  ]
};

// --- ROUTES ---

app.get('/api/stats', (req, res) => {
  res.json(statsData);
});

app.get('/api/courses', (req, res) => {
  res.json(courses);
});

app.get('/api/course/:id', (req, res) => {
  const courseId = parseInt(req.params.id);
  const details = detailedDataMap[courseId] || defaultDetailedData;
  res.json(details);
});

// AI Endpoints
app.post('/api/analyze', async (req, res) => {
  try {
    const data = req.body;
    const insights = await generateInsights(data);
    res.json({ insights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { question, context } = req.body;
    const answer = await askAI(question, context);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to communicate with AI' });
  }
});

app.post('/api/predict', async (req, res) => {
  try {
    const { data } = req.body;
    const prediction = await predictRisk(data);
    res.json({ prediction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to predict risk' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
