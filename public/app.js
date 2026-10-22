/**
 * AeroLearn OS - Client Application Logic
 * Grounded in Azure Data Engineering & Power BI Analytics Curriculums
 */

// Application State Store
const store = {
  curriculum: null,
  currentDay: 1,
  currentDayData: null,
  dayCache: {},
  studyTimerInterval: null,
  isTimerRunning: false,
  
  userState: {
    completedDays: [],
    taskProgress: {},
    quizScores: {},
    notes: {},
    bookmarks: [],
    revisionQueue: [],
    studyTimeSeconds: 0,
    studyStreak: 1,
    lastStudyDate: new Date().toISOString().split('T')[0],
    preferences: {
      language: 'English',
      level: 'beginner',
      studyGoalHours: 3
    }
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  loadUserState();
  initTheme();
  initStudyTimer();
  setupGlobalEvents();

  try {
    await fetchCurriculum();
    initRouter();
    await loadDay(store.currentDay);
    renderAllViews();
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('Failed to load curriculum manifest. Ensure backend is running.', 'error');
  }
});

// ----------------------------------------------------
// STORAGE & USER STATE
// ----------------------------------------------------
function loadUserState() {
  const saved = localStorage.getItem('aerolearn_user_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      store.userState = { ...store.userState, ...parsed };
      
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      if (store.userState.lastStudyDate !== today) {
        const lastDate = new Date(store.userState.lastStudyDate);
        const diffDays = Math.round((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          store.userState.studyStreak += 1;
        } else if (diffDays > 1) {
          store.userState.studyStreak = 1;
        }
        store.userState.lastStudyDate = today;
        saveUserState();
      }
    } catch (e) {
      console.warn('Could not parse saved user state, resetting to defaults.');
    }
  }

  // Load saved active day
  const savedDay = localStorage.getItem('aerolearn_active_day');
  if (savedDay) {
    const d = parseInt(savedDay, 10);
    if (!isNaN(d) && d >= 1 && d <= 60) {
      store.currentDay = d;
    }
  }
}

function saveUserState() {
  localStorage.setItem('aerolearn_user_state', JSON.stringify(store.userState));
  updateTopbarMetrics();
}

function initTheme() {
  const savedTheme = localStorage.getItem('aerolearn_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('aerolearn_theme', next);
  });
}

function initStudyTimer() {
  const display = document.getElementById('timerDisplay');
  const toggleBtn = document.getElementById('timerToggleBtn');

  function updateDisplay() {
    const sec = store.userState.studyTimeSeconds;
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    display.textContent = `${h}:${m}:${s}`;
  }
  updateDisplay();

  toggleBtn.addEventListener('click', () => {
    if (store.isTimerRunning) {
      clearInterval(store.studyTimerInterval);
      store.isTimerRunning = false;
      toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      toggleBtn.style.background = 'var(--primary)';
      saveUserState();
    } else {
      store.isTimerRunning = true;
      toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
      toggleBtn.style.background = 'var(--warning)';
      store.studyTimerInterval = setInterval(() => {
        store.userState.studyTimeSeconds += 1;
        updateDisplay();
        if (store.userState.studyTimeSeconds % 30 === 0) {
          saveUserState();
        }
      }, 1000);
    }
  });
}

function updateTopbarMetrics() {
  const streakEl = document.getElementById('topbarStreakCount');
  if (streakEl) streakEl.textContent = store.userState.studyStreak;

  const revBadge = document.getElementById('navRevisionDueBadge');
  if (revBadge) {
    const dueCount = getDueRevisions().length;
    revBadge.textContent = `Due: ${dueCount}`;
    revBadge.className = dueCount > 0 ? 'badge badge-warning' : 'badge';
  }

  const notesBadge = document.getElementById('navNotesCountBadge');
  if (notesBadge) {
    const count = Object.keys(store.userState.notes).filter(k => store.userState.notes[k]?.trim()).length;
    notesBadge.textContent = count;
  }
}

// ----------------------------------------------------
// CURRICULUM API CALLS
// ----------------------------------------------------
async function fetchCurriculum() {
  const res = await fetch('/api/curriculum');
  if (!res.ok) throw new Error('Could not fetch curriculum');
  store.curriculum = await res.json();
  
  const modBadge = document.getElementById('navModuleCountBadge');
  if (modBadge) modBadge.textContent = `${store.curriculum.modules.length} Mods`;

  populateDayJumpSelect();
  populateModuleFilters();
}

async function fetchDayDetail(dayNum) {
  if (store.dayCache[dayNum]) {
    return store.dayCache[dayNum];
  }
  const res = await fetch(`/api/day/${dayNum}`);
  if (!res.ok) throw new Error(`Could not fetch day ${dayNum}`);
  const data = await res.json();
  store.dayCache[dayNum] = data;
  return data;
}

async function loadDay(dayNum) {
  store.currentDay = dayNum;
  localStorage.setItem('aerolearn_active_day', dayNum);
  
  document.getElementById('navTodayBadge').textContent = `Day ${dayNum}`;
  document.getElementById('dayJumpSelect').value = dayNum;
  
  const data = await fetchDayDetail(dayNum);
  store.currentDayData = data;
  renderDayWorkspace(data);
  updateOverviewFocusCard(data);
}

// ----------------------------------------------------
// ROUTING
// ----------------------------------------------------
function initRouter() {
  window.addEventListener('hashchange', handleHashRoute);
  handleHashRoute();
}

function handleHashRoute() {
  const hash = window.location.hash.replace('#', '') || 'overview';
  const validViews = ['overview', 'today', 'calendar', 'curriculum', 'library', 'notes', 'revision', 'quizzes', 'interviews', 'projects', 'bookmarks', 'analytics', 'settings'];
  
  const targetView = validViews.includes(hash) ? hash : 'overview';
  switchView(targetView);
}

window.appRouter = function(viewName) {
  window.location.hash = `#${viewName}`;
};

function switchView(viewName) {
  // Update sidebar active link
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-view') === viewName);
  });

  // Update topbar title
  const titles = {
    overview: 'Dashboard Overview',
    today: `Today's Learning (Day ${store.currentDay})`,
    calendar: 'Learning Calendar & Schedule',
    curriculum: 'Complete 60-Day Curriculum',
    library: 'Topic Library & Catalog',
    notes: 'Personal Knowledge Base',
    revision: 'Spaced Repetition Centre',
    quizzes: 'Practice & Quiz Performance Hub',
    interviews: 'Technical Interview Question Hub',
    projects: 'Hands-On Projects & Portfolio',
    bookmarks: 'Bookmarks & Saved Resources',
    analytics: 'Learning Progress Analytics',
    settings: 'Settings & Data Management'
  };
  document.getElementById('currentViewTitle').textContent = titles[viewName] || 'AeroLearn OS';

  // Toggle active view panel
  document.querySelectorAll('.app-view').forEach(viewEl => {
    viewEl.classList.toggle('active', viewEl.id === `view-${viewName}`);
  });

  // Re-render specific dynamic view contents on entry
  if (viewName === 'overview') renderOverview();
  else if (viewName === 'curriculum') renderCurriculumView();
  else if (viewName === 'calendar') renderCalendarView();
  else if (viewName === 'library') renderLibraryView();
  else if (viewName === 'notes') renderNotesVault();
  else if (viewName === 'revision') renderRevisionView();
  else if (viewName === 'quizzes') renderQuizzesView();
  else if (viewName === 'interviews') renderInterviewHub();
  else if (viewName === 'projects') renderProjectsView();
  else if (viewName === 'bookmarks') renderBookmarksView();
  else if (viewName === 'analytics') renderAnalyticsView();
  else if (viewName === 'settings') renderSettingsView();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------------------------------------
// VIEW RENDERING: 1. OVERVIEW
// ----------------------------------------------------
function renderOverview() {
  const totalDays = 60;
  const completed = store.userState.completedDays.length;
  const pct = Math.round((completed / totalDays) * 100);

  // Progress Ring
  const circle = document.getElementById('overviewProgressCircle');
  const circumference = 2 * Math.PI * 50; // r=50
  const offset = circumference - (pct / 100) * circumference;
  if (circle) circle.style.strokeDashoffset = offset;

  const pctText = document.getElementById('overviewProgressPct');
  if (pctText) pctText.textContent = `${pct}%`;

  document.getElementById('statCompletedDays').textContent = `${completed} / ${totalDays}`;
  document.getElementById('statCurrentDay').textContent = `Day ${store.currentDay}`;
  
  const dueRevisions = getDueRevisions().length;
  document.getElementById('statRevisionCount').textContent = dueRevisions;

  // Metrics Bar
  document.getElementById('metricStreak').textContent = `${store.userState.studyStreak} Days`;
  const hours = (store.userState.studyTimeSeconds / 3600).toFixed(1);
  document.getElementById('metricStudyHours').textContent = `${hours} hrs`;

  // Quiz Average
  const quizScores = Object.values(store.userState.quizScores);
  let avgQuiz = 0;
  if (quizScores.length > 0) {
    const sum = quizScores.reduce((acc, q) => acc + (q.score / (q.total || 3)) * 100, 0);
    avgQuiz = Math.round(sum / quizScores.length);
  }
  document.getElementById('metricQuizAvg').textContent = `${avgQuiz}%`;

  // Notes Count
  const notesCount = Object.keys(store.userState.notes).filter(k => store.userState.notes[k]?.trim()).length;
  document.getElementById('metricNotesCount').textContent = notesCount;

  // Hero Button Label
  const startBtnLabel = document.getElementById('overviewStartLearningLabel');
  if (startBtnLabel) {
    const isTodayDone = store.userState.completedDays.includes(store.currentDay);
    startBtnLabel.textContent = isTodayDone ? `Review Day ${store.currentDay}` : `Continue Day ${store.currentDay}`;
  }

  // Modules mini list
  renderOverviewModulesList();
}

function updateOverviewFocusCard(dayData) {
  if (!dayData) return;
  document.getElementById('overviewDayPill').textContent = `Day ${dayData.day} of 60`;
  document.getElementById('overviewFocusModule').textContent = dayData.moduleName;
  document.getElementById('overviewFocusTitle').textContent = dayData.title;
  
  // PDF pills
  const pdfContainer = document.getElementById('overviewPdfPills');
  pdfContainer.innerHTML = (dayData.pdfReferences || []).map(r => {
    const tagClass = r.pdf.toLowerCase().includes('azure') ? 'tag-pdf1' : 'tag-pdf2';
    return `<span class="pdf-tag ${tagClass}">${r.pdf} &bull; p.${r.page}</span>`;
  }).join('');

  document.getElementById('overview8020Text').textContent = dayData.the8020Knowledge;

  // Checklist
  const checklistEl = document.getElementById('overviewChecklist');
  const dayProgress = store.userState.taskProgress[dayData.day] || {};
  checklistEl.innerHTML = (dayData.checklist || []).map((task, idx) => {
    const isChecked = Boolean(dayProgress[idx]);
    return `
      <li>
        <input type="checkbox" id="ovTask_${idx}" ${isChecked ? 'checked' : ''} onchange="window.toggleDayTask(${dayData.day}, ${idx}, this.checked)">
        <label for="ovTask_${idx}">${escapeHtml(task)}</label>
      </li>
    `;
  }).join('');
}

function renderOverviewModulesList() {
  const container = document.getElementById('overviewModuleList');
  if (!container || !store.curriculum) return;

  container.innerHTML = store.curriculum.modules.map(mod => {
    const [start, end] = mod.dayRange;
    const modDays = [];
    for (let i = start; i <= end; i++) modDays.push(i);
    const completedInMod = modDays.filter(d => store.userState.completedDays.includes(d)).length;
    const totalInMod = modDays.length;
    const pct = Math.round((completedInMod / totalInMod) * 100);

    return `
      <div class="module-mini-item" onclick="window.jumpToModule(${start})">
        <div class="module-mini-top">
          <span>${mod.name.split(':')[0]}: ${mod.name.split(':')[1]?.trim() || mod.name}</span>
          <span>${completedInMod}/${totalInMod} (${pct}%)</span>
        </div>
        <div class="module-progress-bar">
          <div class="module-progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// VIEW RENDERING: 2. TODAY'S LEARNING (DAY WORKSPACE)
// ----------------------------------------------------
function renderDayWorkspace(dayData) {
  if (!dayData) return;

  document.getElementById('dayPill').textContent = `Day ${dayData.day}`;
  document.getElementById('dayDuration').textContent = dayData.duration;
  document.getElementById('dayModuleName').textContent = dayData.moduleName.split(':')[0];
  document.getElementById('dayTitle').textContent = dayData.title;

  // PDF sources badges
  const pdfContainer = document.getElementById('dayPdfSources');
  pdfContainer.innerHTML = (dayData.pdfReferences || []).map(r => {
    const tagClass = r.pdf.toLowerCase().includes('azure') ? 'tag-pdf1' : 'tag-pdf2';
    return `<span class="pdf-tag ${tagClass}">${r.pdf} &bull; p.${r.page}</span>`;
  }).join('');

  // Update button states (Mark Complete & Bookmark)
  const isCompleted = store.userState.completedDays.includes(dayData.day);
  const markBtn = document.getElementById('markDayCompleteBtn');
  const markLabel = document.getElementById('markDayCompleteLabel');
  if (isCompleted) {
    markBtn.className = 'btn btn-secondary';
    markLabel.textContent = 'Completed ✓ (Click to Undo)';
  } else {
    markBtn.className = 'btn btn-success';
    markLabel.textContent = 'Mark Lesson Complete';
  }

  const isBookmarked = store.userState.bookmarks.some(b => b.type === 'day' && b.day === dayData.day);
  const bmBtn = document.getElementById('bookmarkDayBtn');
  const bmLabel = document.getElementById('bookmarkDayLabel');
  if (isBookmarked) {
    bmBtn.className = 'btn btn-accent';
    bmLabel.textContent = 'Bookmarked ★';
  } else {
    bmBtn.className = 'btn btn-secondary';
    bmLabel.textContent = 'Bookmark Day';
  }

  // TAB 1: CORE STUDY NOTES (Sections A to J)
  const exp = dayData.topicExplanation || {};
  document.getElementById('dayWhatIsIt').textContent = exp.whatIsIt || 'Fundamental data engineering concept.';
  document.getElementById('dayWhyLearnIt').textContent = exp.whyLearnIt || 'Crucial for scalable pipelines and enterprise analytics.';
  
  // Learning Objectives
  const objList = document.getElementById('dayObjectivesList');
  objList.innerHTML = (dayData.learningObjectives || []).map(o => `<li>${escapeHtml(o)}</li>`).join('');

  // Prerequisites
  const prereqBox = document.getElementById('dayPrerequisitesBox');
  prereqBox.innerHTML = (dayData.prerequisites || []).map(p => `
    <div class="prereq-item">
      <span>Prerequisite: <strong>${escapeHtml(p)}</strong></span>
    </div>
  `).join('');

  // Core Concepts
  const conceptsGrid = document.getElementById('dayCoreConceptsGrid');
  conceptsGrid.innerHTML = (exp.coreConcepts || []).map((c, i) => `
    <div class="concept-card">
      <strong>Concept ${i + 1}:</strong> ${escapeHtml(c)}
    </div>
  `).join('');

  // Technical Details
  document.getElementById('dayTechDetails').innerHTML = `
    <div class="tech-content">${escapeHtml(exp.importantTechnicalDetails || 'Syntax, schema definition, and engine architecture details.')}</div>
  `;

  // Real-world scenario
  document.getElementById('dayRealWorldApp').textContent = exp.realWorldApplication || 'Deployed in production high-throughput data processing workflows.';

  // Common mistakes
  document.getElementById('dayCommonMistakes').innerHTML = `
    <strong>⚠️ Watch Out For:</strong> ${escapeHtml(exp.commonMistakes || 'Configuration missteps or index misuse in high-volume environments.')}
  `;

  // Quick revision & completion criterion
  document.getElementById('dayQuickRevision').textContent = exp.quickRevision || 'Key rules and storage foundations.';
  document.getElementById('dayCompletionCriterion').textContent = exp.whatYouShouldBeAbleToDo || dayData.deliverable || 'Configure and validate the data flow.';

  // Sidebar Deliverable & Tasks
  document.getElementById('dayDeliverableText').textContent = dayData.deliverable || 'Complete hands-on task.';
  renderDayTasksSidebar(dayData);

  // TAB 2: 80/20 & EXPERT INSIGHTS
  document.getElementById('expert8020Content').textContent = dayData.the8020Knowledge;
  document.getElementById('expertDeepContent').textContent = dayData.whatExpertsUnderstand;

  // TAB 3: RESOURCES
  renderDayResources(dayData.resources || []);

  // TAB 4: KNOWLEDGE CHECK QUIZ
  renderDayQuiz(dayData);

  // TAB 5: INTERVIEW PREPARATION
  renderDayInterviews(dayData.interviewQuestions || []);

  // TAB 6: PERSONAL NOTES
  const notesTextarea = document.getElementById('dayNotesTextarea');
  notesTextarea.value = store.userState.notes[dayData.day] || '';

  // Update AI Drawer Context Tag
  const aiTag = document.getElementById('aiDrawerContextTag');
  if (aiTag) aiTag.textContent = `Context: Day ${dayData.day} (${dayData.title.substring(0, 24)}...)`;
}

function renderDayTasksSidebar(dayData) {
  const container = document.getElementById('dayTaskChecklist');
  const dayProgress = store.userState.taskProgress[dayData.day] || {};
  
  container.innerHTML = (dayData.checklist || []).map((task, idx) => {
    const isChecked = Boolean(dayProgress[idx]);
    return `
      <div class="task-row">
        <input type="checkbox" id="sideTask_${idx}" ${isChecked ? 'checked' : ''} onchange="window.toggleDayTask(${dayData.day}, ${idx}, this.checked)">
        <label for="sideTask_${idx}">${escapeHtml(task)}</label>
      </div>
    `;
  }).join('');
}

function renderDayResources(resources) {
  const container = document.getElementById('dayResourcesGrid');
  if (resources.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No external resources loaded. Click "Find More Resources" above.</p></div>`;
    return;
  }

  container.innerHTML = resources.map(r => {
    const isHindi = r.language.toLowerCase().includes('hindi') || r.language.toLowerCase().includes('hinglish');
    const pillClass = isHindi ? 'lang-hindi' : 'lang-english';

    return `
      <div class="resource-card" data-lang="${r.language}">
        <div class="resource-top">
          <span class="resource-lang-pill ${pillClass}">${r.language}</span>
          <span class="badge">${r.type} &bull; ${r.cost}</span>
        </div>
        <h4 class="resource-title">${escapeHtml(r.title)}</h4>
        <p class="resource-why">${escapeHtml(r.why)}</p>
        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm resource-btn">
          Open Resource &rarr;
        </a>
      </div>
    `;
  }).join('');
}

function renderDayQuiz(dayData) {
  const container = document.getElementById('dayQuizList');
  const scoreBadge = document.getElementById('dayQuizScoreBadge');
  const savedScore = store.userState.quizScores[dayData.day];

  if (savedScore) {
    scoreBadge.textContent = `Score: ${savedScore.score} / ${savedScore.total}`;
  } else {
    scoreBadge.textContent = `Score: -- / ${dayData.quiz?.length || 3}`;
  }

  const questions = dayData.quiz || [];
  container.innerHTML = questions.map((q, qIndex) => {
    const optionsHtml = (q.options || []).map((opt, oIndex) => {
      let extraClass = '';
      if (savedScore) {
        if (oIndex === q.correctIndex) extraClass = 'selected-correct';
        else if (savedScore.answers && savedScore.answers[qIndex] === oIndex) extraClass = 'selected-wrong';
      }
      return `
        <button class="mcq-option-btn ${extraClass}" onclick="window.handleQuizAnswer(${dayData.day}, ${qIndex}, ${oIndex}, ${q.correctIndex})">
          <span class="opt-label">${String.fromCharCode(65 + oIndex)}.</span>
          <span>${escapeHtml(opt)}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="mcq-card" id="mcqCard_${qIndex}">
        <div class="mcq-q-title"><strong>Q${qIndex + 1}:</strong> ${escapeHtml(q.question)}</div>
        <div class="mcq-options-grid">${optionsHtml}</div>
        <div class="mcq-explanation" id="mcqExp_${qIndex}" style="${savedScore ? 'display:block;' : 'display:none;'}">
          <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
        </div>
      </div>
    `;
  }).join('');
}

function renderDayInterviews(questions) {
  const container = document.getElementById('dayInterviewList');
  if (questions.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No interview questions loaded for this lesson.</p></div>`;
    return;
  }

  container.innerHTML = questions.map((iq, idx) => {
    return `
      <div class="interview-card">
        <div class="interview-card-header">
          <span class="badge badge-accent">${iq.difficulty || 'Intermediate'}</span>
          <span class="badge">Interview Q${idx + 1}</span>
        </div>
        <h4 class="interview-q-title">${escapeHtml(iq.question)}</h4>
        <button class="reveal-answer-btn" onclick="window.toggleInterviewAnswer(${idx})">
          Reveal Model Answer & Rubric
        </button>
        <div class="interview-answer-drawer" id="interviewAnswer_${idx}">
          <p><strong>Concise Answer:</strong> ${escapeHtml(iq.conciseAnswer)}</p>
          <div class="callout mt-2">
            <div class="callout-icon">💡</div>
            <div class="callout-text">
              <strong>Deconstruct with Interviewer:</strong><br>
              Focus on how this scales in real projects. Mention edge cases and monitoring.
            </div>
          </div>
          <button class="btn btn-sm btn-outline mt-2" onclick="window.openMockModalForQuestion('${escapeHtml(iq.question.replace(/'/g, "\\'"))}', '${escapeHtml(iq.conciseAnswer.replace(/'/g, "\\'"))}')">
            Practice Live with AI Feedback &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// VIEW RENDERING: 3. COMPLETE CURRICULUM VIEW
// ----------------------------------------------------
function renderCurriculumView() {
  const container = document.getElementById('curriculumModulesContainer');
  if (!container || !store.curriculum) return;

  const modFilter = document.getElementById('curriculumModuleFilter').value;
  const statusFilter = document.getElementById('curriculumStatusFilter').value;

  const modules = store.curriculum.modules.filter(m => {
    if (modFilter !== 'all' && m.id !== modFilter) return false;
    return true;
  });

  container.innerHTML = modules.map(mod => {
    const [start, end] = mod.dayRange;
    const daysInMod = store.curriculum.days.filter(d => d.day >= start && d.day <= end);

    const filteredDays = daysInMod.filter(d => {
      const isDone = store.userState.completedDays.includes(d.day);
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'pending' && isDone) return false;
      return true;
    });

    const completedCount = daysInMod.filter(d => store.userState.completedDays.includes(d.day)).length;
    const pct = Math.round((completedCount / daysInMod.length) * 100);

    const daysCardsHtml = filteredDays.map(d => {
      const isDone = store.userState.completedDays.includes(d.day);
      const isCurrent = d.day === store.currentDay;
      const statusPill = isDone ? '<span class="badge badge-success">Completed ✓</span>' : (isCurrent ? '<span class="badge badge-accent">Current Day</span>' : '<span class="badge">Pending</span>');

      const pdfTags = (d.pdfReferences || []).map(r => {
        const tagClass = r.pdf.toLowerCase().includes('azure') ? 'tag-pdf1' : 'tag-pdf2';
        return `<span class="pdf-tag ${tagClass}">${r.pdf} p.${r.page}</span>`;
      }).join(' ');

      return `
        <div class="curriculum-day-card ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}" onclick="window.jumpToDay(${d.day})">
          <div class="day-card-header">
            <span class="day-number">Day ${d.day}</span>
            ${statusPill}
          </div>
          <h4 class="day-card-title">${escapeHtml(d.title)}</h4>
          <div class="day-card-sources">${pdfTags}</div>
          <div class="day-card-footer">
            <span>⏱️ ${d.duration}</span>
            <span>🎯 ${d.quizCount || 3} Quizzes</span>
            <span class="link-arrow">&rarr;</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="curriculum-module-section">
        <div class="module-header-box">
          <div class="mod-header-left">
            <span class="badge badge-module">${mod.id.toUpperCase()}</span>
            <h3>${escapeHtml(mod.name)}</h3>
            <p class="mod-desc">${escapeHtml(mod.description)}</p>
          </div>
          <div class="mod-header-right">
            <span class="mod-progress-text">${completedCount} / ${daysInMod.length} Days (${pct}%)</span>
            <div class="module-progress-bar" style="width: 120px;">
              <div class="module-progress-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        </div>
        <div class="module-days-grid">${daysCardsHtml || '<p class="text-muted p-3">No days match filter.</p>'}</div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// VIEW RENDERING: 4. LEARNING CALENDAR VIEW
// ----------------------------------------------------
function renderCalendarView() {
  const grid = document.getElementById('calendarDaysGrid');
  if (!grid || !store.curriculum) return;

  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  document.getElementById('calendarMonthLabel').textContent = currentMonth;

  // Render a clean 60-day calendar schedule grid
  grid.innerHTML = store.curriculum.days.map(d => {
    const isCompleted = store.userState.completedDays.includes(d.day);
    const isCurrent = d.day === store.currentDay;
    const dateOffset = new Date();
    dateOffset.setDate(dateOffset.getDate() + (d.day - store.currentDay));
    const dayStr = dateOffset.toLocaleDateString('default', { month: 'short', day: 'numeric' });

    let statusClass = '';
    if (isCompleted) statusClass = 'cal-completed';
    else if (isCurrent) statusClass = 'cal-current';

    return `
      <div class="calendar-day-cell ${statusClass}" onclick="window.selectCalendarDay(${d.day})">
        <div class="cal-day-top">
          <span class="cal-day-num">Day ${d.day}</span>
          <span class="cal-date-label">${dayStr}</span>
        </div>
        <div class="cal-topic-name">${escapeHtml(d.title.substring(0, 32))}...</div>
        <div class="cal-status-dot"></div>
      </div>
    `;
  }).join('');
}

window.selectCalendarDay = function(dayNum) {
  const day = store.curriculum.days.find(d => d.day === dayNum);
  if (!day) return;

  const isDone = store.userState.completedDays.includes(dayNum);
  const panel = document.getElementById('calendarSelectedDayInfo');
  
  panel.innerHTML = `
    <div class="selected-day-details">
      <span class="badge badge-accent">Day ${day.day} &bull; ${day.moduleName.split(':')[0]}</span>
      <h4 class="mt-2">${escapeHtml(day.title)}</h4>
      <p class="text-muted mt-1">Duration: ${day.duration}</p>
      
      <div class="callout callout-8020 mt-2">
        <div class="callout-text"><strong>80/20:</strong> ${escapeHtml(day.the8020Knowledge || 'Focus on foundational concepts.')}</div>
      </div>

      <div class="mt-3">
        <button class="btn btn-primary btn-block btn-sm" onclick="window.jumpToDay(${day.day})">
          Open Lesson &rarr;
        </button>
        <button class="btn btn-outline btn-block btn-sm mt-2" onclick="window.toggleDayCompleted(${day.day})">
          ${isDone ? 'Mark as Incomplete' : 'Mark as Completed'}
        </button>
      </div>
    </div>
  `;
};

// ----------------------------------------------------
// VIEW RENDERING: 5. TOPIC LIBRARY
// ----------------------------------------------------
function renderLibraryView() {
  const container = document.getElementById('topicLibraryGrid');
  if (!container || !store.curriculum) return;

  const filterText = (document.getElementById('libraryFilterInput')?.value || '').toLowerCase();
  const activePill = document.querySelector('.cat-pill.active')?.getAttribute('data-cat') || 'all';

  const filtered = store.curriculum.days.filter(d => {
    // Category match
    if (activePill !== 'all') {
      const titleLower = d.title.toLowerCase();
      const modLower = d.moduleName.toLowerCase();
      if (activePill === 'sql' && !titleLower.includes('sql') && !titleLower.includes('t-sql') && !titleLower.includes('database')) return false;
      if (activePill === 'dwh' && !titleLower.includes('warehouse') && !titleLower.includes('scd') && !titleLower.includes('dimensional')) return false;
      if (activePill === 'python' && !titleLower.includes('python') && !titleLower.includes('pandas') && !titleLower.includes('numpy') && !titleLower.includes('eda')) return false;
      if (activePill === 'azure' && !titleLower.includes('azure') && !titleLower.includes('blob') && !titleLower.includes('factory') && !titleLower.includes('adf')) return false;
      if (activePill === 'spark' && !titleLower.includes('databricks') && !titleLower.includes('spark') && !titleLower.includes('delta')) return false;
      if (activePill === 'synapse' && !titleLower.includes('synapse') && !titleLower.includes('mpp') && !titleLower.includes('polybase')) return false;
      if (activePill === 'powerbi' && !titleLower.includes('power bi') && !titleLower.includes('dax') && !titleLower.includes('power query')) return false;
      if (activePill === 'ssas' && !titleLower.includes('ssas') && !titleLower.includes('ssis')) return false;
    }

    // Text match
    if (filterText) {
      const matchTitle = d.title.toLowerCase().includes(filterText);
      const matchMod = d.moduleName.toLowerCase().includes(filterText);
      const match8020 = (d.the8020Knowledge || '').toLowerCase().includes(filterText);
      if (!matchTitle && !matchMod && !match8020) return false;
    }

    return true;
  });

  container.innerHTML = filtered.map(d => {
    const isDone = store.userState.completedDays.includes(d.day);
    const pdfTags = (d.pdfReferences || []).map(r => {
      const tagClass = r.pdf.toLowerCase().includes('azure') ? 'tag-pdf1' : 'tag-pdf2';
      return `<span class="pdf-tag ${tagClass}">${r.pdf} p.${r.page}</span>`;
    }).join(' ');

    return `
      <div class="topic-library-card ${isDone ? 'done' : ''}" onclick="window.jumpToDay(${d.day})">
        <div class="lib-card-top">
          <span class="badge badge-accent">Day ${d.day}</span>
          <span class="lib-mod">${d.moduleName.split(':')[0]}</span>
        </div>
        <h4 class="lib-title">${escapeHtml(d.title)}</h4>
        <div class="lib-sources">${pdfTags}</div>
        <p class="lib-8020">${escapeHtml(d.the8020Knowledge || '')}</p>
        <div class="lib-footer">
          <span>${isDone ? 'Completed ✓' : 'Ready to study'}</span>
          <span class="link-arrow">&rarr;</span>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// VIEW RENDERING: 6. NOTES VAULT
// ----------------------------------------------------
function renderNotesVault() {
  const sidebar = document.getElementById('notesVaultSidebar');
  const viewer = document.getElementById('notesVaultViewer');
  if (!sidebar || !viewer) return;

  const notesEntries = Object.entries(store.userState.notes).filter(([day, note]) => note && note.trim());

  if (notesEntries.length === 0) {
    sidebar.innerHTML = `<p class="text-muted p-3">No personal notes created yet. Write notes in the Day workspace!</p>`;
    viewer.innerHTML = `
      <div class="empty-state">
        <h3>Your Knowledge Base is Empty</h3>
        <p>Open any day from the curriculum, switch to "My Personal Notes", and write your learnings.</p>
        <button class="btn btn-primary mt-3" onclick="window.appRouter('today')">Go to Today's Lesson</button>
      </div>
    `;
    return;
  }

  sidebar.innerHTML = notesEntries.map(([dayStr, note]) => {
    const dayNum = parseInt(dayStr, 10);
    const dayObj = store.curriculum?.days?.find(d => d.day === dayNum);
    const title = dayObj ? dayObj.title : `Day ${dayNum}`;

    return `
      <div class="note-sidebar-item" onclick="window.viewVaultNote(${dayNum})">
        <span class="badge badge-accent">Day ${dayNum}</span>
        <strong>${escapeHtml(title.substring(0, 28))}...</strong>
        <span class="note-preview-text">${escapeHtml(note.substring(0, 60))}...</span>
      </div>
    `;
  }).join('');

  // Default to first note
  const firstDay = parseInt(notesEntries[0][0], 10);
  viewVaultNote(firstDay);
}

window.viewVaultNote = function(dayNum) {
  const note = store.userState.notes[dayNum];
  const dayObj = store.curriculum?.days?.find(d => d.day === dayNum);
  const viewer = document.getElementById('notesVaultViewer');
  if (!viewer) return;

  viewer.innerHTML = `
    <div class="vault-note-header">
      <div>
        <span class="badge badge-accent">Day ${dayNum}</span>
        <h3>${escapeHtml(dayObj?.title || `Day ${dayNum}`)}</h3>
      </div>
      <div>
        <button class="btn btn-sm btn-outline" onclick="window.jumpToDay(${dayNum})">Edit in Workspace &rarr;</button>
      </div>
    </div>
    <div class="vault-note-body mt-3">
      <pre class="note-markdown-render">${escapeHtml(note || '')}</pre>
    </div>
  `;
};

// ----------------------------------------------------
// VIEW RENDERING: 7. REVISION CENTRE
// ----------------------------------------------------
function getDueRevisions() {
  const today = new Date().toISOString().split('T')[0];
  return store.userState.revisionQueue.filter(item => item.nextReview <= today);
}

function renderRevisionView() {
  const due = getDueRevisions();
  document.getElementById('revDueCount').textContent = due.length;
  document.getElementById('revCompletedCount').textContent = store.userState.completedDays.length;
  document.getElementById('revTotalTracked').textContent = store.userState.revisionQueue.length;

  const container = document.getElementById('revisionCardsList');
  if (store.userState.revisionQueue.length === 0) {
    container.innerHTML = `
      <div class="empty-state card p-4">
        <h3>Revision Queue is Empty</h3>
        <p>Click "Add to Revision Queue" on any completed lesson to track spaced repetition (1, 3, 7, 14, 30 days).</p>
      </div>
    `;
    return;
  }

  container.innerHTML = store.userState.revisionQueue.map(item => {
    const day = store.curriculum?.days?.find(d => d.day === item.day);
    const isDue = item.nextReview <= new Date().toISOString().split('T')[0];

    return `
      <div class="card p-3 mb-2 revision-card ${isDue ? 'border-warning' : ''}">
        <div class="d-flex justify-between align-center">
          <div>
            <span class="badge ${isDue ? 'badge-warning' : 'badge'}">${isDue ? 'DUE TODAY' : 'Next: ' + item.nextReview}</span>
            <span class="badge">Interval: Step ${item.reviewCount || 1}</span>
            <h4 class="mt-1">${escapeHtml(day?.title || `Day ${item.day}`)}</h4>
            <p class="text-muted small">${day?.the8020Knowledge || ''}</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-primary" onclick="window.jumpToDay(${item.day})">Revise Now &rarr;</button>
            <button class="btn btn-sm btn-success" onclick="window.advanceRevision(${item.day})">Mark Reviewed ✓</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.advanceRevision = function(dayNum) {
  const item = store.userState.revisionQueue.find(r => r.day === dayNum);
  if (!item) return;

  const intervals = [1, 3, 7, 14, 30, 60];
  item.reviewCount = (item.reviewCount || 1) + 1;
  const daysToAdd = intervals[Math.min(item.reviewCount - 1, intervals.length - 1)];

  const next = new Date();
  next.setDate(next.getDate() + daysToAdd);
  item.nextReview = next.toISOString().split('T')[0];

  saveUserState();
  renderRevisionView();
  showToast(`Revision scheduled for Day ${dayNum} in ${daysToAdd} days!`, 'success');
};

// ----------------------------------------------------
// VIEW RENDERING: 8. PRACTICE & QUIZZES HUB
// ----------------------------------------------------
function renderQuizzesView() {
  const tbody = document.getElementById('quizzesTableBody');
  if (!tbody || !store.curriculum) return;

  let totalQuestions = 0;
  let correctQuestions = 0;
  let passedQuizzes = 0;

  tbody.innerHTML = store.curriculum.days.map(d => {
    const scoreData = store.userState.quizScores[d.day];
    let scoreDisplay = '-- / 3';
    let statusPill = '<span class="badge">Unattempted</span>';

    if (scoreData) {
      totalQuestions += scoreData.total || 3;
      correctQuestions += scoreData.score || 0;
      scoreDisplay = `${scoreData.score} / ${scoreData.total || 3}`;
      const pct = Math.round((scoreData.score / (scoreData.total || 3)) * 100);
      if (pct >= 66) {
        passedQuizzes++;
        statusPill = `<span class="badge badge-success">Passed (${pct}%)</span>`;
      } else {
        statusPill = `<span class="badge badge-warning">Needs Review (${pct}%)</span>`;
      }
    }

    const pdfRef = d.pdfReferences?.[0] ? `${d.pdfReferences[0].pdf} p.${d.pdfReferences[0].page}` : 'Curriculum PDF';

    return `
      <tr>
        <td><strong>Day ${d.day}</strong></td>
        <td>${d.moduleName.split(':')[0]}</td>
        <td>${escapeHtml(d.title)}</td>
        <td><span class="small-text">${pdfRef}</span></td>
        <td>${statusPill}</td>
        <td><strong>${scoreDisplay}</strong></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="window.jumpToDayQuiz(${d.day})">
            Take Quiz &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join('');

  const overallAvg = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  document.getElementById('hubQuizAverage').textContent = `${overallAvg}%`;
  document.getElementById('hubQuizCompletedCount').textContent = `${passedQuizzes} / 60`;
}

// ----------------------------------------------------
// VIEW RENDERING: 9. INTERVIEW HUB
// ----------------------------------------------------
function renderInterviewHub() {
  const grid = document.getElementById('interviewHubGrid');
  if (!grid || !store.curriculum) return;

  const search = (document.getElementById('interviewSearchInput')?.value || '').toLowerCase();
  const diffFilter = document.getElementById('interviewDifficultyFilter')?.value || 'all';

  // Gather all interview questions across all 60 days
  const allQuestions = [];
  for (const day of store.curriculum.days) {
    if (day.interviewQuestions) {
      for (const iq of day.interviewQuestions) {
        allQuestions.push({ ...iq, day: day.day, dayTitle: day.title });
      }
    }
  }

  const filtered = allQuestions.filter(q => {
    if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
    if (search && !q.question.toLowerCase().includes(search) && !q.conciseAnswer.toLowerCase().includes(search)) return false;
    return true;
  });

  grid.innerHTML = filtered.slice(0, 30).map((q, idx) => {
    return `
      <div class="card p-3 interview-hub-card">
        <div class="d-flex justify-between align-center">
          <span class="badge badge-accent">${q.difficulty}</span>
          <span class="small-text text-muted">Day ${q.day}</span>
        </div>
        <h4 class="mt-2">${escapeHtml(q.question)}</h4>
        <div class="callout mt-2">
          <div class="callout-text"><strong>Model Answer:</strong> ${escapeHtml(q.conciseAnswer)}</div>
        </div>
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-sm btn-outline" onclick="window.jumpToDay(${q.day})">Open Day ${q.day}</button>
          <button class="btn btn-sm btn-primary" onclick="window.openMockModalForQuestion('${escapeHtml(q.question.replace(/'/g, "\\'"))}', '${escapeHtml(q.conciseAnswer.replace(/'/g, "\\'"))}')">
            Practice Answer &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// VIEW RENDERING: 10. PROJECTS & PORTFOLIO
// ----------------------------------------------------
function renderProjectsView() {
  const container = document.getElementById('projectsContainer');
  if (!container) return;

  const projects = [
    {
      id: 'proj-1',
      title: 'Real-Time Retail Analytics Pipeline (ADF + SQL Server + Blob Storage)',
      pdfSource: 'Azure Data Engineering (PDF 1: p.7)',
      overview: 'Design and deploy an end-to-end data ingestion pipeline moving retail sales transactions incrementally from SQL Server OLTP to Azure Blob Storage using Azure Data Factory pipelines, tumbling window triggers, and Azure Key Vault secrets.',
      deliverables: [
        'Configured ADF Linked Services with Azure Key Vault secrets',
        'Dynamic Copy Activity with LastModifiedDate parameterization',
        'Data Flow transformations for delta aggregation and schema validation',
        'Automated scheduled trigger with pipeline failure alert monitoring'
      ],
      relevantDays: 'Days 31 to 40'
    },
    {
      id: 'proj-2',
      title: 'Azure Databricks Medallion Lakehouse & Delta Lake Architecture',
      pdfSource: 'Azure Data Engineering (PDF 1: p.8)',
      overview: 'Implement a modern Lakehouse architecture on ADLS Gen2 using PySpark and Delta Lake. Ingest raw JSON/CSV feeds into Bronze, curate and deduplicate into Silver, and publish business data marts into Gold for reporting.',
      deliverables: [
        'ADLS Gen2 storage mounting via Service Principal and Key Vault scope',
        'Structured Streaming pipeline with checkpointing',
        'ACID transactions, Schema Enforcement, and MERGE INTO (Upsert) implementation',
        'Delta Lake Time Travel audit query notebook'
      ],
      relevantDays: 'Days 41 to 46'
    },
    {
      id: 'proj-3',
      title: 'Executive Sales & Churn Analytics Dashboard (Power BI Desktop + DAX + RLS)',
      pdfSource: 'Data Analytics Using Power BI (PDF 2: p.2-12)',
      overview: 'Build an executive-ready business intelligence solution connecting ERP data, shaping tables with Power Query M, constructing a Star Schema data model, writing complex DAX measures, and implementing Dynamic Row-Level Security.',
      deliverables: [
        'Star Schema data model with dedicated Date Dimension and 1:Many relationships',
        'Time Intelligence DAX measures (TOTALYTD, SAMEPERIODLASTYEAR, YoY Growth %)',
        'Dynamic Row-Level Security using USERPRINCIPALNAME() for department managers',
        'Interactive drill-through pages, bookmarks, and mobile-optimized layout'
      ],
      relevantDays: 'Days 51 to 59'
    },
    {
      id: 'proj-4',
      title: 'Enterprise SSIS Ingestion Pipeline & SSAS Tabular Analytical Cube',
      pdfSource: 'Data Analytics Using Power BI (PDF 2: p.13, 20-23)',
      overview: 'Extract legacy enterprise records using SQL Server Integration Services (SSIS), execute SCD Type 2 lookups, and load an SSAS Tabular data model deployed to SQL Server Analysis Services.',
      deliverables: [
        'SSIS Control Flow with Precedence Constraints and For Each Loop containers',
        'Data Flow with Slowly Changing Dimension (SCD) Transformation and Derived Columns',
        'SSAS Tabular Model deployed via SSMS with hierarchies and KPI definitions',
        'Automated package execution scheduled via SQL Server Agent jobs'
      ],
      relevantDays: 'Days 57 to 60'
    }
  ];

  container.innerHTML = projects.map(p => {
    return `
      <div class="card p-4 mb-3 project-spec-card">
        <div class="d-flex justify-between align-center">
          <span class="badge badge-accent">Portfolio Capstone</span>
          <span class="pdf-tag tag-pdf1">${escapeHtml(p.pdfSource)}</span>
        </div>
        <h3 class="mt-2">${escapeHtml(p.title)}</h3>
        <p class="text-secondary mt-1">${escapeHtml(p.overview)}</p>
        
        <h5 class="mt-3">Key Technical Deliverables:</h5>
        <ul class="styled-list mt-1">
          ${p.deliverables.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
        </ul>

        <div class="d-flex justify-between align-center mt-3 pt-2 border-top">
          <span class="small-text text-muted">Curriculum Mapping: <strong>${p.relevantDays}</strong></span>
          <button class="btn btn-sm btn-primary" onclick="window.appRouter('today')">Open Day Workspace</button>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// VIEW RENDERING: 11. BOOKMARKS VIEW
// ----------------------------------------------------
function renderBookmarksView() {
  const container = document.getElementById('bookmarksGrid');
  if (!container) return;

  const bookmarks = store.userState.bookmarks;
  if (bookmarks.length === 0) {
    container.innerHTML = `
      <div class="empty-state card p-4">
        <h3>No Bookmarks Saved Yet</h3>
        <p>Click "Bookmark Day" on any lesson to save it for rapid access.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = bookmarks.map(b => {
    const day = store.curriculum?.days?.find(d => d.day === b.day);
    return `
      <div class="card p-3 bookmark-card">
        <div class="d-flex justify-between align-center">
          <span class="badge badge-accent">Day ${b.day}</span>
          <button class="icon-btn" onclick="window.removeBookmark(${b.day})">&times;</button>
        </div>
        <h4 class="mt-2">${escapeHtml(day?.title || b.title)}</h4>
        <p class="text-muted small mt-1">${day?.moduleName.split(':')[0] || ''}</p>
        <button class="btn btn-sm btn-outline mt-3 btn-block" onclick="window.jumpToDay(${b.day})">
          Open Lesson &rarr;
        </button>
      </div>
    `;
  }).join('');
}

window.removeBookmark = function(dayNum) {
  store.userState.bookmarks = store.userState.bookmarks.filter(b => b.day !== dayNum);
  saveUserState();
  renderBookmarksView();
  showToast(`Bookmark for Day ${dayNum} removed.`, 'info');
};

// ----------------------------------------------------
// VIEW RENDERING: 12. PROGRESS ANALYTICS
// ----------------------------------------------------
function renderAnalyticsView() {
  const container = document.getElementById('analyticsModuleBars');
  if (!container || !store.curriculum) return;

  // Streak & Study stats
  document.getElementById('analyticsStreak').textContent = `${store.userState.studyStreak} days`;
  const hours = (store.userState.studyTimeSeconds / 3600).toFixed(1);
  document.getElementById('analyticsStudyHours').textContent = `${hours} hours`;
  
  const completedCount = store.userState.completedDays.length;
  document.getElementById('analyticsCompletedDays').textContent = `${completedCount} of 60`;

  // Estimate completion date based on 1 lesson per day
  const remaining = 60 - completedCount;
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + remaining);
  document.getElementById('analyticsEstimatedDate').textContent = finishDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });

  // Module breakdown bars
  container.innerHTML = store.curriculum.modules.map(mod => {
    const [start, end] = mod.dayRange;
    const total = (end - start) + 1;
    let done = 0;
    for (let i = start; i <= end; i++) {
      if (store.userState.completedDays.includes(i)) done++;
    }
    const pct = Math.round((done / total) * 100);

    return `
      <div class="mb-3">
        <div class="d-flex justify-between small-text mb-1">
          <strong>${mod.name.split(':')[0]}: ${mod.name.split(':')[1]?.trim() || mod.name}</strong>
          <span>${done}/${total} (${pct}%)</span>
        </div>
        <div class="module-progress-bar">
          <div class="module-progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// VIEW RENDERING: 13. SETTINGS & BACKUP
// ----------------------------------------------------
function renderSettingsView() {
  const prefs = store.userState.preferences;
  document.getElementById('settingLanguage').value = prefs.language || 'English';
  document.getElementById('settingLevel').value = prefs.level || 'beginner';
  document.getElementById('settingStudyGoal').value = prefs.studyGoalHours || 3;
}

// ----------------------------------------------------
// USER ACTIONS & HELPERS
// ----------------------------------------------------
window.jumpToDay = async function(dayNum) {
  await loadDay(dayNum);
  window.appRouter('today');
};

window.jumpToDayQuiz = async function(dayNum) {
  await loadDay(dayNum);
  window.appRouter('today');
  // Switch to quiz tab
  document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.day-tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelector('.day-tab[data-tab="tab-quiz"]').classList.add('active');
  document.getElementById('tab-quiz').classList.add('active');
};

window.jumpToModule = function(dayNum) {
  window.jumpToDay(dayNum);
};

window.toggleDayCompleted = function(dayNum) {
  const idx = store.userState.completedDays.indexOf(dayNum);
  if (idx >= 0) {
    store.userState.completedDays.splice(idx, 1);
    showToast(`Day ${dayNum} marked as incomplete.`, 'info');
  } else {
    store.userState.completedDays.push(dayNum);
    showToast(`Day ${dayNum} marked as completed! 🎉`, 'success');
  }
  saveUserState();
  renderAllViews();
  if (store.currentDayData) renderDayWorkspace(store.currentDayData);
};

window.toggleDayTask = function(dayNum, taskIdx, isChecked) {
  if (!store.userState.taskProgress[dayNum]) {
    store.userState.taskProgress[dayNum] = {};
  }
  store.userState.taskProgress[dayNum][taskIdx] = isChecked;
  saveUserState();
};

window.markCurrentDayTasksComplete = function() {
  const day = store.currentDay;
  if (!store.currentDayData) return;

  if (!store.userState.taskProgress[day]) {
    store.userState.taskProgress[day] = {};
  }
  (store.currentDayData.checklist || []).forEach((_, idx) => {
    store.userState.taskProgress[day][idx] = true;
  });

  if (!store.userState.completedDays.includes(day)) {
    store.userState.completedDays.push(day);
  }

  saveUserState();
  renderDayWorkspace(store.currentDayData);
  showToast(`All tasks for Day ${day} completed! 🎉`, 'success');
};

window.handleQuizAnswer = function(dayNum, qIndex, optionIndex, correctIndex) {
  const card = document.getElementById(`mcqCard_${qIndex}`);
  if (!card) return;

  const buttons = card.querySelectorAll('.mcq-option-btn');
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIndex) btn.classList.add('selected-correct');
    else if (idx === optionIndex && optionIndex !== correctIndex) btn.classList.add('selected-wrong');
  });

  const exp = document.getElementById(`mcqExp_${qIndex}`);
  if (exp) exp.style.display = 'block';

  // Record Score
  if (!store.userState.quizScores[dayNum]) {
    store.userState.quizScores[dayNum] = { score: 0, total: 3, answers: [] };
  }
  store.userState.quizScores[dayNum].answers[qIndex] = optionIndex;
  if (optionIndex === correctIndex) {
    store.userState.quizScores[dayNum].score += 1;
  }

  saveUserState();
  const scoreBadge = document.getElementById('dayQuizScoreBadge');
  if (scoreBadge) {
    scoreBadge.textContent = `Score: ${store.userState.quizScores[dayNum].score} / 3`;
  }
};

window.toggleInterviewAnswer = function(idx) {
  const drawer = document.getElementById(`interviewAnswer_${idx}`);
  if (drawer) {
    drawer.style.display = drawer.style.display === 'block' ? 'none' : 'block';
  }
};

window.openDayQuiz = function() {
  window.appRouter('today');
  document.querySelector('.day-tab[data-tab="tab-quiz"]')?.click();
};

// ----------------------------------------------------
// AI ASSISTANT DRAWER & INTERACTIVE TUTOR
// ----------------------------------------------------
function setupGlobalEvents() {
  // Mobile menu
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('appSidebar');
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Sidebar toggle button
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // AI Drawer
  const openAiBtn = document.getElementById('openAiDrawerBtn');
  const closeAiBtn = document.getElementById('closeAiDrawerBtn');
  const aiDrawer = document.getElementById('aiDrawer');

  openAiBtn?.addEventListener('click', () => aiDrawer.classList.add('open'));
  closeAiBtn?.addEventListener('click', () => aiDrawer.classList.remove('open'));

  // Day Tab navigation
  document.querySelectorAll('.day-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.day-tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const targetPane = document.getElementById(tab.getAttribute('data-tab'));
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Day navigation Prev/Next
  document.getElementById('prevDayBtn')?.addEventListener('click', () => {
    if (store.currentDay > 1) window.jumpToDay(store.currentDay - 1);
  });
  document.getElementById('nextDayBtn')?.addEventListener('click', () => {
    if (store.currentDay < 60) window.jumpToDay(store.currentDay + 1);
  });

  document.getElementById('dayJumpSelect')?.addEventListener('change', (e) => {
    window.jumpToDay(parseInt(e.target.value, 10));
  });

  // Mark Day Complete button
  document.getElementById('markDayCompleteBtn')?.addEventListener('click', () => {
    window.toggleDayCompleted(store.currentDay);
  });

  // Bookmark Day button
  document.getElementById('bookmarkDayBtn')?.addEventListener('click', () => {
    const isBookmarked = store.userState.bookmarks.some(b => b.type === 'day' && b.day === store.currentDay);
    if (isBookmarked) {
      store.userState.bookmarks = store.userState.bookmarks.filter(b => !(b.type === 'day' && b.day === store.currentDay));
      showToast(`Removed Day ${store.currentDay} from bookmarks.`, 'info');
    } else {
      store.userState.bookmarks.push({
        type: 'day',
        day: store.currentDay,
        title: store.currentDayData?.title || `Day ${store.currentDay}`,
        addedAt: new Date().toISOString()
      });
      showToast(`Saved Day ${store.currentDay} to bookmarks! ★`, 'success');
    }
    saveUserState();
    renderDayWorkspace(store.currentDayData);
  });

  // Add to Revision Queue
  document.getElementById('scheduleRevisionBtn')?.addEventListener('click', () => {
    const day = store.currentDay;
    if (store.userState.revisionQueue.some(r => r.day === day)) {
      showToast(`Day ${day} is already in your revision schedule.`, 'info');
      return;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    store.userState.revisionQueue.push({
      day,
      addedAt: new Date().toISOString().split('T')[0],
      nextReview: tomorrow.toISOString().split('T')[0],
      reviewCount: 1
    });
    saveUserState();
    showToast(`Added Day ${day} to Spaced Repetition queue!`, 'success');
  });

  // Personal Notes auto-save & actions
  let notesDebounce = null;
  const notesTextarea = document.getElementById('dayNotesTextarea');
  notesTextarea?.addEventListener('input', () => {
    clearTimeout(notesDebounce);
    const indicator = document.getElementById('notesAutoSaveStatus');
    if (indicator) indicator.textContent = 'Saving...';
    notesDebounce = setTimeout(() => {
      store.userState.notes[store.currentDay] = notesTextarea.value;
      saveUserState();
      if (indicator) indicator.innerHTML = '<span class="save-indicator"></span> Auto-saved to local storage';
    }, 600);
  });

  document.getElementById('copyNotesBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(notesTextarea.value);
    showToast('Notes copied to clipboard!', 'success');
  });

  document.getElementById('downloadNotesBtn')?.addEventListener('click', () => {
    const blob = new Blob([notesTextarea.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Day_${store.currentDay}_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Global search input
  const searchInput = document.getElementById('globalSearchInput');
  let searchTimeout = null;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      executeGlobalSearch(searchInput.value);
    }, 350);
  });

  document.getElementById('closeSearchOverlay')?.addEventListener('click', () => {
    document.getElementById('searchOverlayContainer').style.display = 'none';
  });

  // Library category pills
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderLibraryView();
    });
  });

  document.getElementById('libraryFilterInput')?.addEventListener('input', () => {
    renderLibraryView();
  });

  // Settings Save
  document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    store.userState.preferences = {
      language: document.getElementById('settingLanguage').value,
      level: document.getElementById('settingLevel').value,
      studyGoalHours: parseInt(document.getElementById('settingStudyGoal').value, 10)
    };
    saveUserState();
    showToast('Preferences updated successfully!', 'success');
  });

  // Export & Import Backup JSON
  document.getElementById('exportBackupJsonBtn')?.addEventListener('click', () => {
    const dataStr = JSON.stringify(store.userState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AeroLearn_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Complete backup exported successfully.', 'success');
  });

  document.getElementById('importBackupBtn')?.addEventListener('click', () => {
    const fileInput = document.getElementById('importBackupFileInput');
    if (!fileInput.files.length) {
      showToast('Please select a JSON backup file first.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported || typeof imported !== 'object') throw new Error('Invalid JSON');
        store.userState = { ...store.userState, ...imported };
        saveUserState();
        renderAllViews();
        showToast('Backup restored successfully!', 'success');
      } catch (err) {
        showToast('Invalid backup file. Could not parse JSON.', 'error');
      }
    };
    reader.readAsText(fileInput.files[0]);
  });

  // Reset Progress button
  document.getElementById('resetProgressBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all completed lessons, quiz scores, and streak? This action cannot be undone.')) {
      store.userState.completedDays = [];
      store.userState.taskProgress = {};
      store.userState.quizScores = {};
      store.userState.studyStreak = 1;
      store.userState.studyTimeSeconds = 0;
      saveUserState();
      renderAllViews();
      showToast('All progress has been reset.', 'info');
    }
  });

  // Send AI Prompt
  document.getElementById('sendAiPromptBtn')?.addEventListener('click', sendAiPrompt);
  document.getElementById('aiUserPrompt')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAiPrompt();
    }
  });

  // Dynamic Resource Finder Search
  document.getElementById('rfSearchBtn')?.addEventListener('click', executeResourceFinder);

  // Mock interview evaluation
  document.getElementById('evaluateMockBtn')?.addEventListener('click', evaluateMockAnswer);
}

// Global search
async function executeGlobalSearch(q) {
  const query = q.trim();
  const overlay = document.getElementById('searchOverlayContainer');
  const echo = document.getElementById('searchQueryEcho');
  const list = document.getElementById('searchResultsList');

  if (!query) {
    overlay.style.display = 'none';
    return;
  }

  echo.textContent = query;
  overlay.style.display = 'block';
  list.innerHTML = `<div class="p-3 text-muted">Searching across curriculum...</div>`;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      list.innerHTML = `<div class="p-3 text-muted">No topics or concepts found matching "${escapeHtml(query)}".</div>`;
      return;
    }

    list.innerHTML = data.results.map(r => `
      <div class="search-result-item" onclick="window.jumpToDay(${r.day}); document.getElementById('searchOverlayContainer').style.display='none';">
        <div class="d-flex justify-between">
          <strong>Day ${r.day}: ${escapeHtml(r.title)}</strong>
          <span class="badge badge-accent">${r.moduleName.split(':')[0]}</span>
        </div>
        <div class="search-snippets mt-1">
          ${r.matches.map(m => `<div class="small-text text-secondary">${escapeHtml(m)}</div>`).join('')}
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="p-3 text-danger">Search error. Please try again.</div>`;
  }
}

// AI Prompt Handler
async function sendAiPrompt() {
  const input = document.getElementById('aiUserPrompt');
  const question = input.value.trim();
  if (!question) return;

  const chatBody = document.getElementById('aiChatBody');
  const lang = document.getElementById('aiLangSelect').value;

  // Append user bubble
  chatBody.innerHTML += `
    <div class="chat-msg msg-user">
      <div class="msg-bubble">${escapeHtml(question)}</div>
    </div>
  `;
  input.value = '';
  chatBody.scrollTop = chatBody.scrollHeight;

  // Append loading indicator
  const loadingId = 'aiLoading_' + Date.now();
  chatBody.innerHTML += `
    <div class="chat-msg msg-ai" id="${loadingId}">
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble"><em>Consulting curriculum manifest...</em></div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;

  try {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day: store.currentDay,
        question,
        language: lang,
        level: store.userState.preferences.level,
        userNotes: store.userState.notes[store.currentDay] || ''
      })
    });
    const data = await res.json();

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble">
          <div class="ai-citation-bar">
            <span class="pdf-tag tag-pdf1">Source: ${escapeHtml(data.groundedIn || 'Curriculum')}</span>
          </div>
          <div class="ai-markdown-content mt-2">${formatMarkdown(data.answer)}</div>
        </div>
      `;
    }
  } catch (err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble text-danger">
          Could not communicate with AI Tutor. Please check your network connection or server status.
        </div>
      `;
    }
  }

  chatBody.scrollTop = chatBody.scrollHeight;
}

window.sendQuickPrompt = function(promptText) {
  document.getElementById('aiUserPrompt').value = promptText;
  sendAiPrompt();
};

window.askAiAboutCurrentDay = function() {
  const drawer = document.getElementById('aiDrawer');
  drawer.classList.add('open');
  document.getElementById('aiUserPrompt').value = `Explain the core concepts and 80/20 knowledge of today's lesson: "${store.currentDayData?.title || ''}"`;
  document.getElementById('aiUserPrompt').focus();
};

// Resource Finder Modal
window.openResourceFinder = function() {
  document.getElementById('resourceFinderModal').style.display = 'flex';
  const input = document.getElementById('rfTopicInput');
  if (store.currentDayData && !input.value) {
    input.value = store.currentDayData.title;
  }
};

window.closeResourceFinder = function() {
  document.getElementById('resourceFinderModal').style.display = 'none';
};

async function executeResourceFinder() {
  const topic = document.getElementById('rfTopicInput').value.trim();
  const container = document.getElementById('rfResultsContainer');
  if (!topic) return;

  container.innerHTML = `<div class="p-3 text-muted">Searching resources for "${escapeHtml(topic)}"...</div>`;

  try {
    const res = await fetch('/api/ai/find-resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        language: store.userState.preferences.language
      })
    });
    const data = await res.json();

    container.innerHTML = (data.resources || []).map(r => `
      <div class="card p-3 mb-2">
        <div class="d-flex justify-between align-center">
          <span class="badge badge-accent">${r.language} &bull; ${r.type}</span>
          <span class="small-text">${r.source}</span>
        </div>
        <h4 class="mt-1">${escapeHtml(r.title)}</h4>
        <p class="small-text text-secondary mt-1">${escapeHtml(r.why)}</p>
        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline mt-2">
          Open Link &rarr;
        </a>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="p-3 text-danger">Failed to find resources.</div>`;
  }
}

// Mock Interview Modal
let currentMockQuestion = '';
let currentMockCriteria = '';

window.openMockModalForQuestion = function(question, criteria) {
  currentMockQuestion = question;
  currentMockCriteria = criteria;

  document.getElementById('mockQText').textContent = question;
  document.getElementById('mockUserAnswer').value = '';
  document.getElementById('mockEvalResult').style.display = 'none';
  document.getElementById('mockInterviewModal').style.display = 'flex';
};

window.closeMockInterview = function() {
  document.getElementById('mockInterviewModal').style.display = 'none';
};

window.startMockInterviewRandom = function() {
  if (!store.curriculum) return;
  // Pick random day
  const randomDay = store.curriculum.days[Math.floor(Math.random() * store.curriculum.days.length)];
  const qList = randomDay.interviewQuestions || [];
  if (qList.length > 0) {
    const randomQ = qList[Math.floor(Math.random() * qList.length)];
    window.openMockModalForQuestion(randomQ.question, randomQ.conciseAnswer);
  } else {
    window.openMockModalForQuestion(`Explain how indexing improves query execution in SQL Server.`, `Indexes reduce table scans by providing B-tree pointers to data pages.`);
  }
};

window.startMockInterviewForCurrentDay = function() {
  const qList = store.currentDayData?.interviewQuestions || [];
  if (qList.length > 0) {
    window.openMockModalForQuestion(qList[0].question, qList[0].conciseAnswer);
  }
};

async function evaluateMockAnswer() {
  const answer = document.getElementById('mockUserAnswer').value.trim();
  const container = document.getElementById('mockEvalResult');
  if (!answer) {
    showToast('Please type an answer to evaluate.', 'error');
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `<div class="p-3 text-muted">Evaluating answer against syllabus rubric...</div>`;

  try {
    const res = await fetch('/api/ai/quiz-eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: currentMockQuestion,
        userAnswer: answer,
        correctAnswer: currentMockCriteria,
        day: store.currentDay
      })
    });
    const evalData = await res.json();

    const scoreColor = evalData.score >= 70 ? 'text-success' : 'text-warning';

    container.innerHTML = `
      <div class="card p-3">
        <div class="d-flex justify-between align-center">
          <h4>Interview Evaluation Verdict</h4>
          <span class="huge-stat ${scoreColor}" style="font-size:1.5rem;">${evalData.score} / 100</span>
        </div>
        <p class="mt-2"><strong>Feedback:</strong> ${escapeHtml(evalData.verdict)}</p>
        <div class="callout callout-8020 mt-2">
          <div class="callout-text">
            <strong>Key Strengths:</strong> ${escapeHtml(evalData.strengths)}<br>
            <strong>Areas for Growth:</strong> ${escapeHtml(evalData.improvements)}
          </div>
        </div>
        <div class="mt-2">
          <strong>Ideal Interview Model Answer:</strong>
          <p class="small-text text-secondary mt-1">${escapeHtml(evalData.modelAnswer)}</p>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-3 text-danger">Evaluation failed. Please try again.</div>`;
  }
}

// UI Helpers
function populateDayJumpSelect() {
  const select = document.getElementById('dayJumpSelect');
  if (!select || !store.curriculum) return;
  select.innerHTML = store.curriculum.days.map(d => `
    <option value="${d.day}">Day ${d.day}: ${escapeHtml(d.title.substring(0, 30))}...</option>
  `).join('');
}

function populateModuleFilters() {
  const modSelect = document.getElementById('curriculumModuleFilter');
  if (!modSelect || !store.curriculum) return;
  modSelect.innerHTML = `<option value="all">All 10 Modules</option>` + store.curriculum.modules.map(m => `
    <option value="${m.id}">${m.name.split(':')[0]}: ${m.name.split(':')[1]?.trim() || m.name}</option>
  `).join('');
}

function renderAllViews() {
  renderOverview();
  updateTopbarMetrics();
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h4 class="mt-2 mb-1">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="mt-3 mb-1">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="mt-3 mb-1">$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code class="inline-code">$1</code>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/gim, '<br><br>');
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
