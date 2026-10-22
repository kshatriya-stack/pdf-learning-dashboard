# AeroLearn OS | PDF-Grounded Daily Learning Dashboard

An interactive, AI-powered personal learning operating system strictly grounded in two authoritative course syllabi:
1. **Azure Data Engineering** (GoOnlineTrainings, 19 pages)
2. **Data Analytics Using Power BI** (GoOnlineTrainings, 24 pages)

Every day, you know exactly what to learn, why it matters, which resources to use (in simple English, Hindi, and Hinglish), what notes to create, how to practice, and how to measure your progress.

---

## 📚 Authoritative Curriculum Structure (10 Modules & 60 Days)

| Module | Core Topics Grounded in PDFs | Source References | Day Range |
| :--- | :--- | :--- | :---: |
| **Module 1** | **Relational Database Architecture & SQL Server / T-SQL**<br>DBMS vs File systems, pages/extents, constraints, indexing, CTEs, window functions, stored procedures, transactions, concurrency | Azure Data Eng: p.9–15<br>Power BI: p.14–19 | Days 1–9 |
| **Module 2** | **Enterprise Data Warehousing & Slowly Changing Dimensions**<br>OLTP vs OLAP, ODS, EDWH, Star vs Snowflake schema, Fact & Dimension types, SCD Types 1, 2, 3 | Azure Data Eng: p.3<br>Power BI: p.24 | Days 10–14 |
| **Module 3** | **Python Programming for Data Engineering**<br>Core syntax, collections (lists, dicts, sets), OOP, file I/O, custom modules, REST APIs with Flask | Azure Data Eng: p.15–17 | Days 15–20 |
| **Module 4** | **Scientific Computing, Data Wrangling & EDA**<br>NumPy multidimensional arrays, Pandas DataFrames & window functions, Matplotlib/Seaborn/Plotly, feature engineering | Azure Data Eng: p.17–19 | Days 21–26 |
| **Module 5** | **Azure Cloud Infrastructure & Storage Accounts**<br>Cloud models, Resource Groups, Subscriptions, Blob storage tiers, ADLS Gen2 hierarchical namespace, Azure Key Vault | Azure Data Eng: p.3–4, 6 | Days 27–30 |
| **Module 6** | **Azure Data Factory (ADF) Architecture & ETL Pipelines**<br>Linked Services, Datasets, Integration Runtimes (Azure IR vs Self-Hosted), Data Flow transformations, triggers | Azure Data Eng: p.2, 4–7 | Days 31–40 |
| **Module 7** | **Azure Databricks, PySpark & Delta Lake**<br>Cluster modes, DBFS, Databricks secrets, PySpark DataFrames, Delta Lake ACID transactions, Structured Streaming, Medallion Architecture | Azure Data Eng: p.7–8 | Days 41–46 |
| **Module 8** | **Azure Synapse Analytics & MPP Architecture**<br>Massive Parallel Processing (MPP), Dedicated SQL Pools, table distributions (Hash, Round Robin, Replicated), PolyBase, Serverless SQL | Azure Data Eng: p.8–9 | Days 47–50 |
| **Module 9** | **Power BI Desktop, Power Query & DAX Modeling**<br>Data shaping in Power Query (M code), Star Schema modeling in Power Pivot, DAX Calculated Columns vs Measures, CALCULATE, Time Intelligence | Power BI: p.2–10 | Days 51–56 |
| **Module 10** | **Power BI Service, Data Gateways, RLS, SSAS & SSIS**<br>App Workspaces, Enterprise Data Gateways, Dynamic Row-Level Security, SSAS Tabular Cubes, SSIS ETL packages, Capstone Project | Power BI: p.10–13, 20–23<br>Azure Data Eng: p.7, 19 | Days 57–60 |

---

## 🚀 Key Features

- **Strict Source-of-Truth Grounding:** Every topic, objective, and concept traces directly to PDF 1 or PDF 2 with exact page citations.
- **12 Integrated Dashboard Views:**
  1. *Dashboard Overview* (streaks, real completion rings, daily focus card)
  2. *Today's Learning* (A-to-J reading sections, 80/20 knowledge, interactive checklist, notes editor)
  3. *Complete Curriculum* (filter by module and completion status)
  4. *Learning Calendar* (monthly schedule and day inspector)
  5. *Topic Library* (searchable catalog across all technologies)
  6. *Notes & Knowledge Base* (centralized markdown notes vault with export)
  7. *Revision Centre* (spaced repetition: 1, 3, 7, 14, 30 days)
  8. *Practice & Quizzes* (60 daily 3-question assessments with instant feedback)
  9. *Interview Preparation* (master bank of 180+ questions, progressive reveal, and AI mock interview evaluator)
  10. *Projects & Portfolio* (4 production-grade capstone project specifications)
  11. *Bookmarks & Saved Resources*
  12. *Progress Analytics* (module progress bars, study habit velocity, exportable report)
- **Multi-Lingual Curated Resources:** Simple English, Hindi, and Hinglish YouTube search links with verified parameters and official Microsoft Learn docs.
- **Contextual AI Tutor Drawer:** Powered by Google Gemini (`gemini-flash-lite-latest` and `gemini-3-flash-preview`), answers questions grounded in the active day's syllabus with zero hallucinations. Standalone curriculum fallback included.
- **Live Study Stopwatch:** Track exact hours invested in real time.
- **Data Persistence & Portable Backup:** Auto-saves to browser localStorage with one-click JSON backup export and restore.

---

## ⚡ Quick Start (Local Setup)

### Option 1: One-Click Windows Launcher
Double-click `start.bat` in the project root. It will:
1. Verify Node.js and dependencies
2. Ensure `curriculum.json` is generated
3. Open `http://localhost:3001` in your browser
4. Start the server

### Option 2: Terminal / Command Line
```powershell
# 1. Navigate to directory
cd C:\Users\SHUBH\.gemini\antigravity-ide\scratch\pdf-learning-dashboard

# 2. Install dependencies (if not already installed)
npm install

# 3. Generate authoritative curriculum manifest (if not generated)
node generate_curriculum.js

# 4. Start the server
npm start
```
Open **`http://localhost:3001`** in your browser.

---

## 🔒 Security & Privacy Notice
- API keys are stored exclusively in `.env` and loaded on the server side.
- No secret keys are embedded in frontend HTML or JavaScript.
- `.env` is listed in `.gitignore` to prevent leaks.
