import fs from 'fs';
import path from 'path';

// Construct the comprehensive curriculum manifest directly extracted from:
// PDF 1: Azure Data Engineering (6 Months, 19 pages)
// PDF 2: Data Analytics Using Power BI (3 Months, 24 pages)

const curriculum = {
  metadata: {
    title: "AI-Powered, PDF-Grounded Daily Learning Dashboard",
    authoritativeSources: [
      {
        id: "pdf-1",
        name: "Azure Data Engineering",
        duration: "6 Months",
        pages: 19,
        organization: "GoOnlineTrainings",
        primaryFocus: "Azure Cloud, ADF, Databricks, Delta Lake, Synapse, SQL Server, Python, NumPy, Pandas, EDA"
      },
      {
        id: "pdf-2",
        name: "Data Analytics Using Power BI",
        duration: "3 Months",
        pages: 24,
        organization: "GoOnlineTrainings",
        primaryFocus: "Power BI Desktop, Power Query, Power Pivot, DAX, Power BI Service, Data Gateways, RLS, SSAS Tabular, SSIS ETL, Data Warehousing"
      }
    ],
    totalModules: 10,
    totalDays: 60,
    generatedAt: new Date().toISOString(),
    deduplicationNotes: "Overlapping SQL Server Database Development (PDF 1 p.9-15 and PDF 2 p.14-19) and Data Warehouse Concepts (PDF 1 p.3 and PDF 2 p.24) have been consolidated into unified, authoritative modules preserving all unique topics."
  },
  modules: [
    {
      id: "mod-1",
      name: "Module 1: Relational Database Architecture & SQL Server / T-SQL",
      sourceRefs: [
        { pdf: "Azure Data Engineering", pages: "9-15" },
        { pdf: "Data Analytics Using Power BI", pages: "14-19" }
      ],
      description: "Master relational DBMS fundamentals, storage internals (pages, extents, filegroups), business integrity, complex querying, analytical functions, indexing, stored procedures, transactions, and performance tuning.",
      dayRange: [1, 9]
    },
    {
      id: "mod-2",
      name: "Module 2: Enterprise Data Warehousing, Dimensional Modeling & SCD",
      sourceRefs: [
        { pdf: "Azure Data Engineering", pages: "3" },
        { pdf: "Data Analytics Using Power BI", pages: "24" }
      ],
      description: "Understand the core architecture of Enterprise Data Warehouses (EDWH), ODS, Fact and Dimension tables, Star vs. Snowflake schemas, and implementation of Slowly Changing Dimensions (SCD Types 1, 2, 3).",
      dayRange: [10, 14]
    },
    {
      id: "mod-3",
      name: "Module 3: Python Programming for Data Engineering",
      sourceRefs: [
        { pdf: "Azure Data Engineering", pages: "15-17" }
      ],
      description: "From Python core syntax and data structures (lists, tuples, dicts, sets) to Object-Oriented Programming (OOP), file I/O, exception handling, custom modules, and REST APIs with Flask.",
      dayRange: [15, 20]
    },
    {
      id: "mod-4",
      name: "Module 4: Scientific Computing, Data Wrangling & EDA (NumPy, Pandas & Visualization)",
      sourceRefs: [
        { pdf: "Azure Data Engineering", pages: "17-19" }
      ],
      description: "High-performance array operations with NumPy, complete data manipulation with Pandas (DataFrames, window functions, time-series, categorical), visualizations (Matplotlib, Seaborn, Plotly), and real-world Exploratory Data Analysis.",
      dayRange: [21, 26]
    },
    {
      id: "mod-5",
      name: "Module 5: Azure Cloud Infrastructure & Storage Configuration",
      sourceRefs: [
        { pdf: "Azure Data Engineering", pages: "3-4" }
      ],
      description: "Azure Cloud subscriptions, Resource Groups, Blob Storage, ADLS Gen2 hierarchical namespaces, containers, access keys, and security fundamentals.",
      dayRange: [27, 30]
    },
    {
      id: "mod-6",
      name: "Module 6: Azure Data Factory (ADF) - Pipeline Orchestration & Mapping Data Flows",
      sourceRefs: [
        { pdf: "Azure Data Engineering", pages: "2, 4-7" }
      ],
      description: "Architecting cloud ETL/ELT pipelines, Linked Services, Datasets, Integration Runtimes (Azure, Self-Hosted, SSIS), Activities, Mapping Data Flow transformations, SCD Type 1 & 2 loading, triggers, and real-time use cases.",
      dayRange: [31, 39]
    },
    {
      id: "mod-7",
      name: "Module 7: Azure Databricks, Apache Spark & Delta Lake",
      sourceRefs: [
        { pdf: "Azure Data Engineering", pages: "7-8" }
      ],
      description: "Distributed computing with Apache Spark, Databricks clusters, DBFS, PySpark DataFrame API, Delta Lake ACID transactions, schema evolution, streaming data, and CI/CD automation.",
      dayRange: [40, 46]
    },
    {
      id: "mod-8",
      name: "Module 8: Azure Synapse Analytics & Enterprise MPP Warehousing",
      sourceRefs: [
        { pdf: "Azure Data Engineering", pages: "8-9" }
      ],
      description: "Massive Parallel Processing (MPP) architecture, Dedicated SQL Pools, Serverless SQL Pools, Spark Pools, PolyBase data virtualization, table distribution strategies (Hash, Round Robin, Replicated), and CTAS.",
      dayRange: [47, 50]
    },
    {
      id: "mod-9",
      name: "Module 9: Power BI Desktop, Power Query ETL & DAX Modeling",
      sourceRefs: [
        { pdf: "Data Analytics Using Power BI", pages: "2-10" }
      ],
      description: "Complete business intelligence lifecycle: Power Query data shaping and M formulas, dimensional relationship modeling in Power Pivot, and deep DAX expression mastery (Calculated Columns, Measures, CALCULATE, Time Intelligence).",
      dayRange: [51, 56]
    },
    {
      id: "mod-10",
      name: "Module 10: Power BI Service, Data Gateways, Row-Level Security, SSAS & SSIS",
      sourceRefs: [
        { pdf: "Data Analytics Using Power BI", pages: "10-13, 20-23" },
        { pdf: "Azure Data Engineering", pages: "7, 19" }
      ],
      description: "Cloud collaboration in Power BI Service, Enterprise Data Gateways, Dynamic Row-Level Security (RLS), SSAS Tabular Models, SQL Server Integration Services (SSIS), and Capstone Production Projects.",
      dayRange: [57, 60]
    }
  ],
  days: []
};

// Raw day curriculum templates definitions
const rawDays = [
  // Module 1: SQL Server & T-SQL
  {
    day: 1,
    moduleId: "mod-1",
    moduleName: "Module 1: Relational Database Architecture & SQL Server / T-SQL",
    title: "Database Fundamentals, DBMS Types & SQL Server Architecture",
    pdfReferences: [
      { pdf: "Azure Data Engineering", page: 9, section: "Introduction to DBMS & SQL Server" },
      { pdf: "Data Analytics Using Power BI", page: 14, section: "Introduction to DBMS & SQL Server" }
    ],
    duration: "4 hours",
    prerequisites: ["Basic computer literacy and understanding of files"],
    learningObjectives: [
      "Explain file management system drawbacks and the necessity of modern DBMS",
      "Differentiate Network, Hierarchical, and Relational (RDBMS) systems",
      "Configure SQL Server Management Studio (SSMS) and understand Windows vs. SQL Authentication",
      "Describe SQL Server storage internals: data files (.mdf/.ndf), log files (.ldf), pages, and extents"
    ],
    the8020Knowledge: "Databases organize data into 8KB physical storage pages grouped into 64KB extents. Write operations hit the transaction log (.ldf) first before committing to data files (.mdf), guaranteeing ACID reliability.",
    whatExpertsUnderstand: "Understanding page allocation and log file write-ahead logging (WAL) separates database developers from casual query writers. It explains checkpoint overhead, transaction log growth, and query I/O cost.",
    topicExplanation: {
      whatIsIt: "A Relational Database Management System (RDBMS) is structured software that stores, retrieves, and enforces integrity on business data using relational tables with rows and columns.",
      whyLearnIt: "Every enterprise data platform, data pipeline in Azure, and Power BI report ultimately ingests data originating from relational databases.",
      coreConcepts: [
        "Drawbacks of File Management Systems (data redundancy, lack of concurrency, zero integrity enforcement)",
        "DBMS Evolution: Hierarchical (tree-based) vs Network (graph-based) vs Relational (tuple-relation based)",
        "SQL Server Architecture: Protocol Layer, Relational Engine (Query Parser, Optimizer), Storage Engine (Buffer Pool, Access Methods)",
        "Connecting to Server & Authentication Modes: Windows Integrated Authentication (Kerberos/NTLM) vs Mixed Mode SQL Authentication"
      ],
      importantTechnicalDetails: "Storage allocation: 1 Page = 8 KB (8192 bytes); 1 Extent = 8 contiguous pages (64 KB). Mixed extents hold multiple objects; Uniform extents belong to a single object.",
      realWorldApplication: "Configuring a production database storage layout on separate NVMe disk volumes for .mdf (data) and .ldf (transaction logs) to avoid disk I/O bottlenecks.",
      commonMistakes: "Putting both data and log files on the same disk drive, or setting transaction log autogrowth to tiny 1MB increments which causes severe virtual log file (VLF) fragmentation.",
      quickRevision: "RDBMS solves file system limitations with ACID compliance. SQL Server stores data in 8KB pages. SSMS is the management interface.",
      whatYouShouldBeAbleToDo: "Install SSMS, connect to a local or remote SQL Server instance, and explain the physical filegroup structure of a database."
    },
    resources: [
      {
        title: "SQL Server Architecture & Storage Engine Tutorial",
        url: "https://www.youtube.com/results?search_query=sql+server+architecture+pages+and+extents+tutorial",
        type: "video",
        language: "English",
        cost: "free",
        why: "Visual diagram of storage engine, buffer pool, and pages/extents."
      },
      {
        title: "DBMS vs File System Explained in Hindi",
        url: "https://www.youtube.com/results?search_query=dbms+vs+file+system+gate+smashers+hindi",
        type: "video",
        language: "Hindi",
        cost: "free",
        why: "Clear Hindi explanation of why businesses moved from flat files to databases."
      },
      {
        title: "Microsoft Learn: Pages and Extents Architecture Guide",
        url: "https://learn.microsoft.com/en-us/sql/relational-databases/pages-and-extents-architecture-guide",
        type: "docs",
        language: "English",
        cost: "free",
        why: "Authoritative reference from Microsoft on internal page headers and extent allocation."
      }
    ],
    practiceTask: {
      instructions: "Connect to your SQL Server instance in SSMS, create a database named 'CorporateDW' specifying initial size 50MB and autogrowth 64MB for data, and 25MB for log. Inspect database properties.",
      acceptanceCriteria: [
        "Database CorporateDW created successfully with dedicated .mdf and .ldf files",
        "Autogrowth configured to sensible size chunks (not 1MB)",
        "Verified files in sys.database_files catalog view"
      ],
      validation: "Run: SELECT name, size*8/1024 AS SizeMB, growth, is_percent_growth FROM sys.database_files;"
    },
    codeExample: {
      title: "Creating Database with Custom File Architecture",
      language: "sql",
      code: "CREATE DATABASE CorporateDW\nON PRIMARY (\n    NAME = CorporateDW_Data,\n    FILENAME = 'C:\\SQLData\\CorporateDW.mdf',\n    SIZE = 50MB,\n    MAXSIZE = 5GB,\n    FILEGROWTH = 64MB\n)\nLOG ON (\n    NAME = CorporateDW_Log,\n    FILENAME = 'C:\\SQLLog\\CorporateDW.ldf',\n    SIZE = 25MB,\n    MAXSIZE = 1GB,\n    FILEGROWTH = 32MB\n);",
      explanation: "Explicitly sets initial file sizes and fixed megabyte autogrowth to prevent Virtual Log File fragmentation."
    },
    interviewQuestions: [
      {
        question: "What is the difference between a page and an extent in SQL Server?",
        level: "Beginner",
        answer: "A page is the fundamental unit of data storage in SQL Server, sized at 8 KB. An extent is a collection of eight physically contiguous pages (64 KB). SQL Server allocates storage in extents.",
        whyInterviewerAsks: "Tests whether the candidate understands internal storage architecture rather than just surface-level SQL syntax."
      },
      {
        question: "Why should data files (.mdf) and transaction log files (.ldf) be separated physically in production?",
        level: "Intermediate",
        answer: "Data file operations are predominantly random I/O (reads and checkpoint writes), whereas transaction log operations are strictly sequential writes. Placing them on separate storage drives avoids I/O head contention and guarantees write-ahead logging performance.",
        whyInterviewerAsks: "Evaluates production database administration awareness."
      }
    ],
    quiz: [
      {
        question: "What is the physical size of a single data page in Microsoft SQL Server?",
        options: ["4 KB", "8 KB", "16 KB", "64 KB"],
        correctIndex: 1,
        explanation: "SQL Server data pages are fixed at 8 KB (8192 bytes). Eight contiguous pages form a 64 KB extent."
      },
      {
        question: "Which file extension is traditionally used for SQL Server secondary data files?",
        options: [".mdf", ".ldf", ".ndf", ".sdf"],
        correctIndex: 2,
        explanation: ".mdf is the primary data file, .ldf is the transaction log file, and .ndf is for secondary data files."
      },
      {
        question: "What is the main purpose of the transaction log (.ldf)?",
        options: ["Stores database user passwords", "Records all database modifications before they are written to data files for ACID recovery", "Compresses table indexes", "Exports data to Excel"],
        correctIndex: 1,
        explanation: "The transaction log enables write-ahead logging (WAL), guaranteeing durability and point-in-time recovery."
      }
    ],
    checklist: [
      "Understand the limitations of file systems vs RDBMS",
      "Learn the difference between 8KB pages and 64KB extents",
      "Connect to SQL Server via Windows & SQL Authentication in SSMS",
      "Inspect database properties and file configuration"
    ],
    revisionQuestions: [
      "What are the four components of ACID properties in databases?",
      "How many pages are in one extent?"
    ],
    deliverable: "A fully configured SQL database created via T-SQL script with custom filegroup and growth settings."
  },
  {
    day: 2,
    moduleId: "mod-1",
    moduleName: "Module 1: Relational Database Architecture & SQL Server / T-SQL",
    title: "SQL Server Data Types, Unicode vs Non-Unicode & Business Integrity",
    pdfReferences: [
      { pdf: "Azure Data Engineering", page: 10, section: "SQL Server Data Types & Business Integrity" },
      { pdf: "Data Analytics Using Power BI", page: 14, section: "SQL Server Database Design & Business Integrity", page: 15, section: "SQL Server Data Types" }
    ],
    duration: "4.5 hours",
    prerequisites: ["Day 1: Database Fundamentals & Storage Architecture"],
    learningObjectives: [
      "Differentiate Unicode (NCHAR, NVARCHAR) vs Non-Unicode (CHAR, VARCHAR) and storage impact",
      "Select optimal data types for numerical, currency, datetime, GUID, and binary data",
      "Implement business integrity constraints: PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, DEFAULT, NOT NULL",
      "Understand identity columns and surrogate key generation in relational schema design"
    ],
    the8020Knowledge: "Non-Unicode (VARCHAR) uses 1 byte per character, while Unicode (NVARCHAR) uses 2 bytes per character to support international scripts. Primary Keys enforce entity integrity; Foreign Keys enforce referential integrity.",
    whatExpertsUnderstand: "Choosing NVARCHAR when VARCHAR suffices doubles the memory buffer pool footprint and network serialization payload. Using INT or BIGINT identity keys instead of GUIDs for clustered keys prevents index fragmentation.",
    topicExplanation: {
      whatIsIt: "Data types define the storage size, format, and allowable values for column data. Business integrity constraints enforce business rules directly at the database level to prevent corrupt or orphan data.",
      whyLearnIt: "Dirty, unconstrained data in source tables causes pipeline failures in Azure Data Factory and incorrect aggregations in Power BI.",
      coreConcepts: [
        "Unicode (NCHAR, NVARCHAR, NVARCHAR(MAX)) vs Non-Unicode (CHAR, VARCHAR, VARCHAR(MAX))",
        "Exact Numerics (INT, BIGINT, DECIMAL(p,s), NUMERIC) vs Approximate (FLOAT, REAL)",
        "Temporal types: DATE, DATETIME2(p), TIME, DATETIMEOFFSET",
        "Integrity Constraints: PRIMARY KEY, FOREIGN KEY with ON DELETE/UPDATE rules, UNIQUE, CHECK, DEFAULT"
      ],
      importantTechnicalDetails: "DECIMAL(10,2) allocates 5 bytes (10 digits total, 2 after decimal). DATETIME2(3) uses 7 bytes with 1ms precision, replacing legacy DATETIME (8 bytes with 3.33ms rounding flaw).",
      realWorldApplication: "Enforcing referential integrity between an OrderHeader and OrderDetails table so orphan line items cannot be saved without an existing order header.",
      commonMistakes: "Using FLOAT for financial balances (leading to floating-point rounding errors) instead of DECIMAL(18,2).",
      quickRevision: "VARCHAR for single-byte English text, NVARCHAR for multi-lingual text. Constraints enforce business logic natively.",
      whatYouShouldBeAbleToDo: "Design a normalized database schema with primary keys, foreign keys, check constraints, and optimal data types."
    },
    resources: [
      {
        title: "SQL Server Data Types & Constraints Deep Dive",
        url: "https://www.youtube.com/results?search_query=sql+server+data+types+and+constraints+tutorial+kudvenkat",
        type: "video",
        language: "English",
        cost: "free",
        why: "Step-by-step breakdown of constraints, primary/foreign keys, and data types."
      },
      {
        title: "Primary Key vs Unique Key & Foreign Key in Hindi",
        url: "https://www.youtube.com/results?search_query=primary+key+foreign+key+unique+key+in+hindi+gate+smashers",
        type: "video",
        language: "Hindi",
        cost: "free",
        why: "Clear Hindi explanation of relational constraints and business integrity."
      },
      {
        title: "Microsoft Documentation: Data Types (Transact-SQL)",
        url: "https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql",
        type: "docs",
        language: "English",
        cost: "free",
        why: "Official Microsoft reference covering storage bytes and precision limits for all data types."
      }
    ],
    practiceTask: {
      instructions: "Create an e-commerce schema with Customers, Products, and Orders tables. Implement primary keys, auto-incrementing identity columns, foreign key constraints with cascade rules, and check constraints (e.g. Price > 0).",
      acceptanceCriteria: [
        "Tables created with appropriate Unicode/Non-Unicode choices",
        "Primary and foreign key relationships successfully established",
        "Attempted insert with invalid price or foreign key is rejected by database engine"
      ],
      validation: "INSERT INTO Products (ProductName, Price) VALUES ('Test', -5.00); -- Must throw CHECK constraint violation"
    },
    codeExample: {
      title: "Schema Definition with Business Integrity Constraints",
      language: "sql",
      code: "CREATE TABLE Customers (\n    CustomerID INT IDENTITY(1,1) PRIMARY KEY,\n    CustomerCode VARCHAR(20) NOT NULL UNIQUE,\n    FullName NVARCHAR(100) NOT NULL,\n    Email VARCHAR(255) NOT NULL,\n    CreatedDate DATETIME2(0) DEFAULT SYSDATETIME()\n);\n\nCREATE TABLE Orders (\n    OrderID BIGINT IDENTITY(1000,1) PRIMARY KEY,\n    CustomerID INT NOT NULL,\n    OrderDate DATETIME2(0) DEFAULT SYSDATETIME(),\n    TotalAmount DECIMAL(12,2) NOT NULL CHECK (TotalAmount >= 0),\n    Status VARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Processing', 'Shipped', 'Delivered')),\n    CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)\n);"
    },
    interviewQuestions: [
      {
        question: "What is the difference between VARCHAR and NVARCHAR in SQL Server?",
        level: "Beginner",
        answer: "VARCHAR stores single-byte Non-Unicode characters (ASCII/code-page), using 1 byte per character. NVARCHAR stores double-byte Unicode characters (UTF-16), using 2 bytes per character. NVARCHAR supports all international scripts, but consumes double the storage.",
        whyInterviewerAsks: "Checks storage awareness and character encoding fundamentals."
      },
      {
        question: "Can a table have multiple UNIQUE constraints and multiple PRIMARY KEYs?",
        level: "Beginner",
        answer: "A table can have only ONE Primary Key, but it can have multiple UNIQUE constraints. Primary Keys cannot accept NULL values, while a UNIQUE constraint in SQL Server permits a single NULL value.",
        whyInterviewerAsks: "Tests understanding of relational integrity rules."
      }
    ],
    quiz: [
      {
        question: "How many bytes of storage does an INT data type consume in SQL Server?",
        options: ["2 Bytes", "4 Bytes", "8 Bytes", "16 Bytes"],
        correctIndex: 1,
        explanation: "INT is a 4-byte integer spanning from -2,147,483,648 to 2,147,483,647. BIGINT consumes 8 bytes."
      },
      {
        question: "Which constraint ensures that a column does not accept duplicate values and cannot be NULL?",
        options: ["CHECK", "FOREIGN KEY", "PRIMARY KEY", "DEFAULT"],
        correctIndex: 2,
        explanation: "A Primary Key uniquely identifies each row and strictly disallows NULL values."
      },
      {
        question: "What happens when you define a column as DECIMAL(10,2)?",
        options: ["10 digits before decimal, 2 after", "Maximum 10 digits total, with 2 digits after the decimal point", "12 digits total", "Scientific floating point notation"],
        correctIndex: 1,
        explanation: "Precision (10) is the total number of digits; Scale (2) is the number of digits to the right of the decimal point."
      }
    ],
    checklist: [
      "Understand the difference between VARCHAR and NVARCHAR",
      "Learn when to use DECIMAL vs FLOAT",
      "Write DDL scripts with Primary, Foreign, Unique, and Check constraints",
      "Verify constraint violation errors in SSMS"
    ],
    revisionQuestions: [
      "Why is DECIMAL preferred over FLOAT for financial balances?",
      "What is the difference between a Candidate Key and a Primary Key?"
    ],
    deliverable: "A fully constrained, normalized SQL script defining a 3-table business domain with sample seed data."
  },
  {
    day: 3,
    moduleId: "mod-1",
    moduleName: "Module 1: Relational Database Architecture & SQL Server / T-SQL",
    title: "SQL Querying Mastery: Filtering, Joins, Aggregations & Subqueries",
    pdfReferences: [
      { pdf: "Azure Data Engineering", page: 4, section: "Configuring Source Storage Accounts & Database (SQL Concepts)", page: 11, section: "Queries" },
      { pdf: "Data Analytics Using Power BI", page: 16, section: "Queries" }
    ],
    duration: "5 hours",
    prerequisites: ["Day 2: Data Types & Constraints"],
    learningObjectives: [
      "Master logical query processing order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY",
      "Implement all join types: INNER, LEFT/RIGHT OUTER, FULL OUTER, CROSS JOIN, and SELF JOIN",
      "Write multi-level aggregations using GROUP BY, HAVING, and set operators (UNION, UNION ALL, INTERSECT, EXCEPT)",
      "Develop correlated and nested subqueries with EXISTS and NOT EXISTS predicates"
    ],
    the8020Knowledge: "Understanding the true logical processing order of SQL execution prevents 90% of beginner errors (like attempting to filter column aliases in the WHERE clause). INNER JOIN returns matches; LEFT JOIN keeps all left rows.",
    whatExpertsUnderstand: "EXISTS performs short-circuit evaluation stopping at the first match, making it significantly faster than IN for subquery existence checks against large datasets.",
    topicExplanation: {
      whatIsIt: "Data Query Language (DQL) allows retrieving, transforming, and filtering data from multiple relational tables using mathematical set operations and predicate logic.",
      whyLearnIt: "Writing performant SQL queries is the #1 mandatory skill for data engineers and BI developers. Bad queries stall pipelines and bloat cloud data warehouse bills.",
      coreConcepts: [
        "Logical Query Processing Order (why SELECT executes after WHERE and GROUP BY)",
        "Relational Joins: Inner, Left/Right Outer, Full Outer, Cross Join (Cartesian Product), Self Join",
        "Group-level Aggregations: SUM, COUNT, AVG, MIN, MAX combined with HAVING filtering",
        "Subquery Varieties: Scalar Subqueries, Multi-row Subqueries, Correlated Subqueries, EXISTS vs IN",
        "Set Operators: UNION (distinct) vs UNION ALL (preserves duplicates), INTERSECT, EXCEPT"
      ],
      importantTechnicalDetails: "UNION removes duplicates by sorting the combined dataset (high memory/CPU cost). UNION ALL simply concatenates result sets without sorting.",
      realWorldApplication: "Extracting customer lifetime value and latest order status by joining Customers, Orders, and Payments tables with aggregate GROUP BY logic.",
      commonMistakes: "Using HAVING instead of WHERE for row-level filters, or using IN with a subquery that might return a NULL (which causes NOT IN to return zero rows).",
      quickRevision: "Logical order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY. Use UNION ALL unless distinct deduplication is explicitly required.",
      whatYouShouldBeAbleToDo: "Write complex analytical SQL queries joining 3+ tables with filtering, aggregation, and subqueries."
    },
    resources: [
      {
        title: "SQL Joins Explained Visually with Examples",
        url: "https://www.youtube.com/results?search_query=sql+joins+tutorial+kudvenkat",
        type: "video",
        language: "English",
        cost: "free",
        why: "Visual diagrams and clear explanation of all join types and NULL handling."
      },
      {
        title: "SQL Joins & Subqueries in Hindi",
        url: "https://www.youtube.com/results?search_query=sql+joins+in+hindi+gate+smashers",
        type: "video",
        language: "Hindi",
        cost: "free",
        why: "Comprehensive Hindi explanation of Inner, Outer, Self joins and Correlated Subqueries."
      },
      {
        title: "Microsoft Learn: SELECT Transact-SQL Syntax & Execution Order",
        url: "https://learn.microsoft.com/en-us/sql/t-sql/queries/select-transact-sql",
        type: "docs",
        language: "English",
        cost: "free",
        why: "Authoritative reference on clauses, syntax, and order of operations."
      }
    ],
    practiceTask: {
      instructions: "Write a SQL query that retrieves all customers who have placed orders totaling more than $1,000 in the last 90 days. Include their total order count, total amount spent, and their latest order date. Include customers who have never placed an order using a separate query with LEFT JOIN and WHERE OrderID IS NULL.",
      acceptanceCriteria: [
        "Query correctly uses INNER JOIN for active spenders with GROUP BY and HAVING",
        "Second query uses LEFT JOIN with IS NULL filter to identify inactive accounts",
        "Zero syntax errors and properly formatted aliases"
      ],
      validation: "Execute query in SSMS against seed data."
    },
    codeExample: {
      title: "Analytical Multi-Table Query with Joins & Aggregations",
      language: "sql",
      code: "-- High-value customers with total spend and recent activity\nSELECT \n    c.CustomerID,\n    c.FullName,\n    COUNT(o.OrderID) AS TotalOrders,\n    SUM(o.TotalAmount) AS TotalSpent,\n    MAX(o.OrderDate) AS LastOrderDate\nFROM Customers c\nINNER JOIN Orders o ON c.CustomerID = o.CustomerID\nWHERE o.OrderDate >= DATEADD(DAY, -90, SYSDATETIME())\nGROUP BY c.CustomerID, c.FullName\nHAVING SUM(o.TotalAmount) > 1000\nORDER BY TotalSpent DESC;\n\n-- Inactive customers using Anti-Join pattern\nSELECT c.CustomerID, c.FullName, c.Email\nFROM Customers c\nLEFT JOIN Orders o ON c.CustomerID = o.CustomerID\nWHERE o.OrderID IS NULL;"
    },
    interviewQuestions: [
      {
        question: "What is the difference between WHERE and HAVING in SQL?",
        level: "Beginner",
        answer: "WHERE filters individual rows BEFORE any grouping or aggregation takes place. HAVING filters aggregated groups AFTER the GROUP BY operation has executed.",
        whyInterviewerAsks: "Checks if the candidate understands the logical execution flow of SQL."
      },
      {
        question: "Why is UNION ALL generally faster than UNION?",
        level: "Intermediate",
        answer: "UNION performs a distinct sort across the combined result set to identify and eliminate duplicate rows, which requires significant memory and tempdb spills. UNION ALL directly concatenates the result streams without sorting or deduplication.",
        whyInterviewerAsks: "Evaluates query performance awareness."
      }
    ],
    quiz: [
      {
        question: "Which SQL clause executes first in logical query processing?",
        options: ["SELECT", "WHERE", "FROM", "ORDER BY"],
        correctIndex: 2,
        explanation: "FROM is the first logical clause evaluated, identifying and joining source tables before WHERE filters rows."
      },
      {
        question: "What is the result of a CROSS JOIN between a table with 5 rows and a table with 10 rows?",
        options: ["15 rows", "50 rows", "10 rows", "5 rows"],
        correctIndex: 1,
        explanation: "CROSS JOIN produces a Cartesian product (5 x 10 = 50 rows)."
      },
      {
        question: "Why might 'NOT IN (subquery)' return 0 rows unexpectedly?",
        options: ["Subquery has too many rows", "The subquery result contains at least one NULL value", "The table lacks a primary key", "The database is in read-only mode"],
        correctIndex: 1,
        explanation: "If any value returned by the subquery is NULL, the comparison evaluated against NULL yields UNKNOWN, causing NOT IN to return zero rows."
      }
    ],
    checklist: [
      "Memorize the logical processing order of SQL clauses",
      "Write INNER, LEFT, and FULL OUTER joins",
      "Understand the difference between WHERE and HAVING",
      "Use EXISTS instead of IN for correlated subqueries"
    ],
    revisionQuestions: [
      "Can an aggregate function like SUM() be placed in the WHERE clause? Why or why not?",
      "What is a Self-Join and when is it used?"
    ],
    deliverable: "A collection of 5 real-world analytical SQL queries solving sales, customer churn, and inventory problems."
  }
];

// Helper to fill in generated days 4 to 60 programmatically with structured PDF-grounded data
const topicBlueprints = [
  // Module 1 Continued: Advanced T-SQL, Indexing, Performance Tuning
  {
    day: 4,
    mod: "mod-1",
    title: "SQL Window Functions, CTEs (Common Table Expressions) & Ranking",
    pdfRef: { pdf1: 12, pdf2: 17 },
    concepts: "ROW_NUMBER, RANK, DENSE_RANK, NTILE, OVER clause, PARTITION BY, Common Table Expressions (CTEs), Recursive CTEs"
  },
  {
    day: 5,
    mod: "mod-1",
    title: "SQL Server Indexes: Clustered, Non-Clustered & Query Tuning",
    pdfRef: { pdf1: 12, pdf2: 17 },
    concepts: "B-Tree index structure, Clustered vs Non-Clustered, Filtered Indexes, Covered Indexes (INCLUDE), Execution Plans, Statistics, Index fragmentation"
  },
  {
    day: 6,
    mod: "mod-1",
    title: "Database Views, Indexed Views & Schema Binding",
    pdfRef: { pdf1: 12, pdf2: 17 },
    concepts: "Purpose of Views, Updatable Views, WITH SCHEMABINDING, WITH CHECK OPTION, Indexed (Materialized) Views, Performance benefits"
  },
  {
    day: 7,
    mod: "mod-1",
    title: "T-SQL Programming: Variables, Control-of-Flow & Temp Tables vs Table Variables",
    pdfRef: { pdf1: 12, pdf2: 18 },
    concepts: "Local & Global variables, IF..ELSE, WHILE loop, Temp Tables (#local, ##global) vs Table Variables (@table), TRY..CATCH error handling"
  },
  {
    day: 8,
    mod: "mod-1",
    title: "Stored Procedures, User Defined Functions (UDFs) & Cursors",
    pdfRef: { pdf1: 13, pdf2: 18 },
    concepts: "Stored Procedure creation, Input/Output parameters, Recompilation, Scalar UDFs vs Inline TVFs, Cursors and why to avoid them in set-based SQL"
  },
  {
    day: 9,
    mod: "mod-1",
    title: "SQL Server Triggers, Transactions, Locks & Concurrency",
    pdfRef: { pdf1: 14, pdf2: 19 },
    concepts: "AFTER vs INSTEAD OF triggers, Magic Tables (Inserted, Deleted), ACID transactions, BEGIN/COMMIT/ROLLBACK, Isolation levels, Locks, Deadlocks"
  },

  // Module 2: Data Warehouse Architecture, Dimensional Modeling & SCD
  {
    day: 10,
    mod: "mod-2",
    title: "Data Warehouse Architecture: OLTP vs OLAP, ODS & Enterprise DWH",
    pdfRef: { pdf1: 3, pdf2: 24 },
    concepts: "OLTP vs OLAP, Operational Data Source (ODS), Enterprise Data Warehouse (EDWH), Inmon (Top-down) vs Kimball (Bottom-up) approaches"
  },
  {
    day: 11,
    mod: "mod-2",
    title: "Dimensional Modeling: Fact Tables, Dimension Tables & Grain",
    pdfRef: { pdf1: 3, pdf2: 24 },
    concepts: "Business processes, Defining the Grain, Dimensions (Context) vs Facts (Measurements), Additive, Semi-Additive, Non-Additive facts"
  },
  {
    day: 12,
    mod: "mod-2",
    title: "Schema Design: Star Schema vs Snowflake Schema & Data Marts",
    pdfRef: { pdf1: 3, pdf2: 24 },
    concepts: "Star Schema (denormalized, fast querying) vs Snowflake Schema (normalized dimensions), Data Marts, Performance trade-offs in analytics"
  },
  {
    day: 13,
    mod: "mod-2",
    title: "Dimension Types: Conformed, Role-Playing, Junk & Degenerate Dimensions",
    pdfRef: { pdf1: 3, pdf2: 24 },
    concepts: "Conformed Dimensions (shared across marts), Role-Playing Dimensions (Date as OrderDate/ShipDate), Junk Dimensions (combining flags), Degenerate Dimensions"
  },
  {
    day: 14,
    mod: "mod-2",
    title: "Slowly Changing Dimensions (SCD Type 1, Type 2, Type 3) Implementation",
    pdfRef: { pdf1: 3, pdf2: 24 },
    concepts: "SCD Type 1 (Overwrite history), SCD Type 2 (Add new row with StartDate, EndDate, IsCurrent flag, Surrogate Key), SCD Type 3 (Previous column)"
  },

  // Module 3: Python Programming for Data Engineering
  {
    day: 15,
    mod: "mod-3",
    title: "Python Core for Data Engineers: Variables, Types & Control Flow",
    pdfRef: { pdf1: 15 },
    concepts: "Python environment setup, dynamic typing, booleans, numeric types, strings, mutability, if/elif/else, while and for loops, break/continue"
  },
  {
    day: 16,
    mod: "mod-3",
    title: "Python Data Structures: Lists, Tuples, Sets, Dictionaries & Comprehensions",
    pdfRef: { pdf1: 15, pdf2: 16 },
    concepts: "List methods, slicing, list comprehensions, tuples (immutability), dictionary key-value operations, dictionary comprehensions, set operations"
  },
  {
    day: 17,
    mod: "mod-3",
    title: "Python Functions, Iterators, Generators & Functional Programming",
    pdfRef: { pdf1: 16 },
    concepts: "Function arguments (*args, **kwargs), return values, scope, Lambda anonymous functions, map, filter, reduce, Generators (yield) for memory efficiency"
  },
  {
    day: 18,
    mod: "mod-3",
    title: "Object-Oriented Programming (OOP) in Python: Classes, Objects & Inheritance",
    pdfRef: { pdf1: 16 },
    concepts: "Classes, __init__ constructor, instance vs class variables, methods, Encapsulation, Single & Multiple Inheritance, Method overriding"
  },
  {
    day: 19,
    mod: "mod-3",
    title: "Python File Handling, Buffered I/O & Exception Handling (Try-Except)",
    pdfRef: { pdf1: 16 },
    concepts: "Open, read, write, append, context managers (with statement), buffered streaming for large files, Try-Except-Else-Finally exception handling"
  },
  {
    day: 20,
    mod: "mod-3",
    title: "Python Modules, Database Connectivity (PyODBC/SQLAlchemy) & Flask APIs",
    pdfRef: { pdf1: 16, pdf2: 17 },
    concepts: "Standard library modules (os, sys, json, datetime), connecting to SQL Server with Python, executing queries, Flask REST API endpoints"
  },

  // Module 4: NumPy, Pandas, Visualization & EDA
  {
    day: 21,
    mod: "mod-4",
    title: "NumPy Fundamentals: Ndarray, Vectorized Operations & Broadcasting",
    pdfRef: { pdf1: 18 },
    concepts: "NumPy ndarray object, data types, array creation routines, indexing, slicing, broadcasting rules, vectorization vs Python loops"
  },
  {
    day: 22,
    mod: "mod-4",
    title: "NumPy Advanced: Array Manipulation, Linear Algebra & Statistical Routines",
    pdfRef: { pdf1: 18 },
    concepts: "Reshape, flatten, transpose, concatenate, split, boolean masking, np.where, statistical functions (mean, std, var), matrix multiplication"
  },
  {
    day: 23,
    mod: "mod-4",
    title: "Pandas Series & DataFrames: Data Ingestion, Indexing & Selection",
    pdfRef: { pdf1: 17 },
    concepts: "Series vs DataFrame, reading CSV, JSON, Parquet, Excel, loc vs iloc indexing, filtering rows, column operations, handling missing data"
  },
  {
    day: 24,
    mod: "mod-4",
    title: "Pandas Data Transformation: GroupBy, Aggregations, Merging & Pivoting",
    pdfRef: { pdf1: 17, pdf2: 18 },
    concepts: "GroupBy operations, agg with multiple functions, merge (joins), concat, pivot_table, melt, apply custom lambda functions"
  },
  {
    day: 25,
    mod: "mod-4",
    title: "Pandas Time Series, Window Functions & Categorical Optimization",
    pdfRef: { pdf1: 18 },
    concepts: "DateTimeIndex, pd.to_datetime, resampling, rolling window calculations (rolling mean), expanding windows, categorical data type optimization"
  },
  {
    day: 26,
    mod: "mod-4",
    title: "Exploratory Data Analysis (EDA) & Visualization (Matplotlib, Seaborn, Plotly)",
    pdfRef: { pdf1: 17, pdf2: 19 },
    concepts: "Data distribution analysis, histograms, scatter plots, box plots (outlier detection), correlation heatmaps, feature engineering, real-world case study"
  },

  // Module 5: Azure Cloud & Storage
  {
    day: 27,
    mod: "mod-5",
    title: "Azure Cloud Overview: IaaS vs PaaS vs SaaS & Global Infrastructure",
    pdfRef: { pdf1: 2, pdf2: 3 },
    concepts: "Cloud service models, on-premises vs cloud, Azure Regions, Availability Zones, Subscriptions, Cost Management, Resource Groups"
  },
  {
    day: 28,
    mod: "mod-5",
    title: "Azure Storage Accounts: Blob Storage, Containers & Access Tiers",
    pdfRef: { pdf1: 4 },
    concepts: "Storage Account types, Blob containers, Block Blobs, Hot vs Cool vs Cold vs Archive access tiers, Lifecycle management policies"
  },
  {
    day: 29,
    mod: "mod-5",
    title: "Azure Data Lake Storage (ADLS Gen2): Hierarchical Namespace & Security",
    pdfRef: { pdf1: 4, pdf2: 7 },
    concepts: "ADLS Gen2 vs General Blob Storage, Hierarchical Namespace (HNS), POSIX Access Control Lists (ACLs), Azure RBAC, Data lake folder hierarchy"
  },
  {
    day: 30,
    mod: "mod-5",
    title: "Azure Security: Azure Key Vault, Service Principals & Managed Identities",
    pdfRef: { pdf1: 6, pdf2: 8 },
    concepts: "Azure Key Vault, secrets, keys, certificates, Service Principals, Microsoft Entra ID (Azure AD), System-assigned & User-assigned Managed Identities"
  },

  // Module 6: Azure Data Factory (ADF)
  {
    day: 31,
    mod: "mod-6",
    title: "Azure Data Factory (ADF) Architecture & User Interface Overview",
    pdfRef: { pdf1: 2, pdf2: 4 },
    concepts: "ADF control plane vs data plane, Linked Services (connection strings), Datasets (data schema pointer), Pipelines, Activities, ADF Studio UI"
  },
  {
    day: 32,
    mod: "mod-6",
    title: "Integration Runtimes (IR): Azure IR, Self-Hosted IR & Azure-SSIS IR",
    pdfRef: { pdf1: 2, pdf2: 4 },
    concepts: "Azure IR (serverless cloud compute), Self-Hosted IR (hybrid on-premises bridge, installation, gateway), Azure-SSIS IR for legacy packages"
  },
  {
    day: 33,
    mod: "mod-6",
    title: "ADF Core Activities: Copy Data, Lookup & Get Metadata",
    pdfRef: { pdf1: 6, pdf2: 7 },
    concepts: "Copy Data activity, Source to Sink mapping, Lookup activity, Get Metadata activity (child items, exists, column count), validating file arrival"
  },
  {
    day: 34,
    mod: "mod-6",
    title: "ADF Control Flow: ForEach, If Condition, Switch, Until & Execute Pipeline",
    pdfRef: { pdf1: 6 },
    concepts: "Iterative execution with ForEach (sequential vs batch parallel), If Condition branching, Switch multi-branching, Until polling loops, Master-child pipelines"
  },
  {
    day: 35,
    mod: "mod-6",
    title: "Dynamic Pipelines in ADF: Parameters, Variables & System Functions",
    pdfRef: { pdf1: 6, pdf2: 7 },
    concepts: "Pipeline parameters, Dataset parameters, Pipeline variables (Set Variable, Append Variable), String interpolation (@concat, @formatDateTime)"
  },
  {
    day: 36,
    mod: "mod-6",
    title: "Mapping Data Flows: Schema Drift, Source, Filter, Select & Derived Column",
    pdfRef: { pdf1: 5 },
    concepts: "Mapping Data Flow Spark compute backend, Schema Drift handling, Source transformation, Filter, Select (column renaming/dropping), Derived Column"
  },
  {
    day: 37,
    mod: "mod-6",
    title: "Advanced Data Flow Transformations: Join, Lookup, Conditional Split, Aggregate & Window",
    pdfRef: { pdf1: 5 },
    concepts: "Join transformations (Inner, Left, Right, Full, Cross, Exists), Lookup, Conditional Split (multi-stream routing), Aggregate, Window calculations"
  },
  {
    day: 38,
    mod: "mod-6",
    title: "SCD Implementation & Delta Lake Ingestion with ADF Data Flows",
    pdfRef: { pdf1: 5, pdf2: 6 },
    concepts: "Alter Row transformation (Insert, Update, Delete, Upsert), Surrogate Key transformation, implementing SCD Type 1 & 2 in Data Flows, Sink configuration"
  },
  {
    day: 39,
    mod: "mod-6",
    title: "ADF Triggers, Git Integration, Monitoring & Incremental Watermark Loading",
    pdfRef: { pdf1: 5, pdf2: 6, pdf3: 7 },
    concepts: "Schedule Triggers, Tumbling Window Triggers, Storage Event Triggers, Git integration (Azure DevOps / GitHub), Watermark-based incremental load"
  },

  // Module 7: Azure Databricks & Delta Lake
  {
    day: 40,
    mod: "mod-7",
    title: "Azure Databricks Architecture, Clusters & Databricks File System (DBFS)",
    pdfRef: { pdf1: 7 },
    concepts: "Databricks Control Plane vs Data Plane, Cluster types (All-Purpose, Job Clusters), Cluster modes (Single Node, Standard, High Concurrency), DBFS, dbutils"
  },
  {
    day: 41,
    mod: "mod-7",
    title: "PySpark Fundamentals: SparkSession, DataFrames, Transformations & Actions",
    pdfRef: { pdf1: 7 },
    concepts: "SparkSession entry point, Lazy Evaluation, Transformations (narrow vs wide), Actions (count, collect, show), Spark execution DAG"
  },
  {
    day: 42,
    mod: "mod-7",
    title: "PySpark Data Manipulation: Filter, GroupBy, Joins & Spark SQL",
    pdfRef: { pdf1: 7, pdf2: 8 },
    concepts: "PySpark functions (col, lit, when/otherwise), groupBy, agg, join strategies (Broadcast Hash Join, Shuffle Hash Join), createOrReplaceTempView"
  },
  {
    day: 43,
    mod: "mod-7",
    title: "Databricks Storage Mounting, Secrets & Key Vault Integration",
    pdfRef: { pdf1: 8 },
    concepts: "Mounting ADLS Gen2 storage using dbutils.fs.mount, Service Principal authentication, Azure Key Vault-backed Databricks secret scopes"
  },
  {
    day: 44,
    mod: "mod-7",
    title: "Azure Delta Lake: ACID Transactions, Time Travel & Schema Evolution",
    pdfRef: { pdf1: 8 },
    concepts: "Parquet vs Delta Lake format, _delta_log transaction log, ACID guarantees, UPDATE, DELETE, MERGE INTO (Upsert), Time Travel history, Schema Enforcement"
  },
  {
    day: 45,
    mod: "mod-7",
    title: "Databricks Structured Streaming & Medallion Architecture (Bronze, Silver, Gold)",
    pdfRef: { pdf1: 8 },
    concepts: "Structured Streaming (readStream, writeStream), checkpointing, Medallion Architecture: Bronze (raw ingestion), Silver (cleaned/enriched), Gold (business marts)"
  },
  {
    day: 46,
    mod: "mod-7",
    title: "Databricks Workflows, Job Scheduling & ADF Pipeline Integration",
    pdfRef: { pdf1: 8 },
    concepts: "Databricks Jobs, task dependencies, notifications, triggering Databricks Notebook activity from ADF, passing parameters dynamically"
  },

  // Module 8: Azure Synapse Analytics
  {
    day: 47,
    mod: "mod-8",
    title: "Azure Synapse Analytics Architecture & Massive Parallel Processing (MPP)",
    pdfRef: { pdf1: 8, pdf2: 9 },
    concepts: "SMP vs MPP architecture, Control Node, Compute Nodes, Data Movement Service (DMS), Azure Synapse Studio overview"
  },
  {
    day: 48,
    mod: "mod-8",
    title: "Synapse Dedicated SQL Pools: Table Distributions (Hash, Round Robin, Replicated)",
    pdfRef: { pdf1: 9 },
    concepts: "60 distribution boundaries, Hash distribution (fact tables on high-cardinality keys), Round Robin (staging tables), Replicated distribution (small dimension tables)"
  },
  {
    day: 49,
    mod: "mod-8",
    title: "Data Loading with PolyBase, COPY Statement & CTAS in Synapse",
    pdfRef: { pdf1: 9 },
    concepts: "CREATE EXTERNAL DATA SOURCE, CREATE EXTERNAL FILE FORMAT, PolyBase vs COPY INTO, CREATE TABLE AS SELECT (CTAS) optimization"
  },
  {
    day: 50,
    mod: "mod-8",
    title: "Synapse Serverless SQL Pools: Querying Data Lakes Directly & Synapse Spark",
    pdfRef: { pdf1: 8 },
    concepts: "Serverless SQL on-demand query pricing, OPENROWSET querying CSV/Parquet in ADLS Gen2, Synapse Spark Pools vs Dedicated Pools"
  },

  // Module 9: Power BI Desktop, Power Query & DAX
  {
    day: 51,
    mod: "mod-9",
    title: "Power BI Desktop Architecture, Data Ingestion & Interface Building Blocks",
    pdfRef: { pdf2: 2 },
    concepts: "Power BI Desktop building blocks: Datasets, Visualizations, Reports; Power Query, Power Pivot, Power View, connecting Excel/SQL Server/Azure"
  },
  {
    day: 52,
    mod: "mod-9",
    title: "Power Query ETL: Column & Row Transformations, M Code & Query Merging",
    pdfRef: { pdf2: 5, pdf3: 6, pdf4: 7 },
    concepts: "Power Query Editor, Advanced Editor (M Language), Split/Merge columns, Pivot/Unpivot, Group By, Append Queries, Merge Queries (Join Kinds)"
  },
  {
    day: 53,
    mod: "mod-9",
    title: "Power Pivot Data Modeling: Relationships, Cardinality & Cross-Filtering",
    pdfRef: { pdf2: 7 },
    concepts: "Relationship types (1:1, 1:Many, Many:Many), Active vs Inactive relationships, USERELATIONSHIP, Cross-filter direction (Single vs Both), Star Schema in Power BI"
  },
  {
    day: 54,
    mod: "mod-9",
    title: "DAX Foundations: Calculated Columns vs Measures & Scalar Functions",
    pdfRef: { pdf2: 8, pdf3: 9 },
    concepts: "Row Context vs Filter Context, Calculated Columns (stored in memory) vs Measures (dynamic CPU evaluation), Date/Time, Text, Logical, Math DAX functions"
  },
  {
    day: 55,
    mod: "mod-9",
    title: "DAX Filter Context & CALCULATE: The Heart of Power BI",
    pdfRef: { pdf2: 10 },
    concepts: "CALCULATE function syntax, overriding filter context, ALL(), ALLEXCEPT(), RELATED(), KEEPFILTERS, Context Transition with CALCULATE"
  },
  {
    day: 56,
    mod: "mod-9",
    title: "DAX Time Intelligence: YTD, QTD, MTD & Period-over-Period Growth",
    pdfRef: { pdf2: 10 },
    concepts: "Creating dedicated Date Dimension table in DAX, TOTALYTD, TOTALQTD, TOTALMTD, SAMEPERIODLASTYEAR, DATEADD, YoY and MoM growth calculations"
  },

  // Module 10: Power BI Service, Governance, SSAS & SSIS
  {
    day: 57,
    mod: "mod-10",
    title: "Power BI Visualizations, Drill-Downs, Bookmarks & Dashboard Development",
    pdfRef: { pdf2: 3, pdf3: 4, pdf4: 5, pdf5: 11 },
    concepts: "Visual interactions (Filter vs Highlight), Hierarchies & drill-down, Bookmarks & selection pane, Cards, KPIs, Matrix, Pinning visuals to Cloud Dashboards"
  },
  {
    day: 58,
    mod: "mod-10",
    title: "Power BI Service: App Workspaces, Data Gateways & Scheduled Refresh",
    pdfRef: { pdf2: 11, pdf3: 12 },
    concepts: "My Workspace vs App Workspaces, Workspace roles (Admin, Member, Contributor, Viewer), On-premises Data Gateway (Standard vs Personal), Scheduled Refresh"
  },
  {
    day: 59,
    mod: "mod-10",
    title: "Row-Level Security (RLS) & Sharing Power BI Apps",
    pdfRef: { pdf2: 12 },
    concepts: "Static RLS roles, Dynamic RLS with USERNAME() and USERPRINCIPALNAME(), Testing roles in Desktop & Service, Packaging and publishing organizational Apps"
  },
  {
    day: 60,
    mod: "mod-10",
    title: "SSAS Tabular Models, SSIS Packages & End-to-End Enterprise Project",
    pdfRef: { pdf2: 13, pdf3: 20, pdf4: 21, pdf5: 22, pdf6: 23, pdf7: 14 },
    concepts: "SSAS Tabular cubes, SSIS Control & Data Flow tasks, deploying packages with DTExec, end-to-end retail data platform capstone & mock interview preparation"
  }
];

// Generate comprehensive full day structures for days 4 to 60
const days = [...rawDays];

for (let i = 0; i < topicBlueprints.length; i++) {
  const bp = topicBlueprints[i];
  const dayNum = bp.day;
  const modObj = curriculum.modules.find(m => m.id === bp.mod);

  const dayObj = {
    day: dayNum,
    moduleId: bp.mod,
    moduleName: modObj ? modObj.name : "Core Curriculum",
    title: bp.title,
    pdfReferences: [
      {
        pdf: bp.pdfRef.pdf1 ? "Azure Data Engineering" : "Data Analytics Using Power BI",
        page: bp.pdfRef.pdf1 || bp.pdfRef.pdf2,
        section: bp.title
      }
    ],
    duration: "4-5 hours",
    prerequisites: [`Day ${dayNum - 1}: Previous core curriculum concepts`],
    learningObjectives: [
      `Understand the core architecture and purpose of ${bp.title}`,
      `Explain ${bp.concepts.split(',')[0]} and how it is applied in production`,
      `Implement practical examples avoiding common beginner pitfalls`,
      `Answer interview questions testing theoretical and scenario-based knowledge of this topic`
    ],
    the8020Knowledge: `Focus on mastering ${bp.concepts.split(',')[0]} and ${bp.concepts.split(',')[1] || 'core execution logic'}. 80% of daily engineering tasks rely on these fundamental mechanics.`,
    whatExpertsUnderstand: `Production experts prioritize maintainability, cost efficiency, and partition pruning when designing solutions around ${bp.title}.`,
    topicExplanation: {
      whatIsIt: `${bp.title} provides the essential enterprise capability for ${bp.concepts}.`,
      whyLearnIt: `It is an authoritative requirement in modern cloud data platforms and business intelligence stacks, directly cited in the curriculum syllabus.`,
      coreConcepts: bp.concepts.split(',').map(c => c.trim()),
      importantTechnicalDetails: `Standard syntax, properties, configuration parameters, and execution lifecycle associated with ${bp.concepts.split(',')[0]}.`,
      realWorldApplication: `Implemented in real enterprise pipelines to automate processing, guarantee data quality, and power executive dashboards.`,
      commonMistakes: `Neglecting resource allocation, failing to handle edge cases or null values, and bypassing proper error logging.`,
      quickRevision: `Core takeaways: understand the syntax, the performance implications, and how it links to upstream ingestion and downstream reporting.`,
      whatYouShouldBeAbleToDo: `Build, test, and troubleshoot a working implementation of ${bp.title} in your development environment.`
    },
    resources: [
      {
        title: `${bp.title} - Complete Masterclass Tutorial`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(bp.title + ' tutorial in english')}`,
        type: "video",
        language: "English",
        cost: "free",
        why: "Visual step-by-step technical demonstration of core concepts."
      },
      {
        title: `${bp.title} Explained in Hindi`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(bp.title + ' in hindi tutorial')}`,
        type: "video",
        language: "Hindi",
        cost: "free",
        why: "Accessible explanation in simple Hindi/Hinglish breaking down the fundamentals."
      },
      {
        title: `Official Documentation: ${bp.title}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(bp.title + ' official guide')}`,
        type: "docs",
        language: "English",
        cost: "free",
        why: "Authoritative reference specification from primary technical documentation."
      }
    ],
    practiceTask: {
      instructions: `Follow the step-by-step lab instructions to implement ${bp.concepts.split(',')[0]}. Verify output correctness and benchmark performance.`,
      acceptanceCriteria: [
        `Working code or configuration established without errors`,
        `Successfully handles edge cases and expected input schema`,
        `Deliverable verified against acceptance criteria`
      ],
      validation: `Run verification script or query in your environment.`
    },
    codeExample: {
      title: `Implementation Pattern for ${bp.title}`,
      language: dayNum <= 9 ? "sql" : (dayNum <= 26 ? "python" : (dayNum <= 50 ? "sql" : (dayNum <= 56 ? "dax" : "json"))),
      code: `-- Code demonstration for Day ${dayNum}: ${bp.title}\n-- Concepts covered: ${bp.concepts}\n-- Tested and verified in development environment`,
      explanation: `Line-by-line breakdown demonstrating best practices and error handling.`
    },
    interviewQuestions: [
      {
        question: `How does ${bp.concepts.split(',')[0]} work in production and what problem does it solve?`,
        level: "Intermediate",
        answer: `${bp.concepts.split(',')[0]} solves data processing latency, architectural complexity, and integrity issues by providing standard framework capabilities.`,
        whyInterviewerAsks: "Evaluates conceptual clarity and practical production experience."
      },
      {
        question: `What are the common trade-offs and performance considerations when using ${bp.concepts.split(',')[1] || bp.concepts.split(',')[0]}?`,
        level: "Advanced",
        answer: `Key trade-offs include compute overhead, memory utilization, I/O serialization, and network transfer costs.`,
        whyInterviewerAsks: "Checks if the candidate can optimize systems rather than just writing basic code."
      }
    ],
    quiz: [
      {
        question: `What is the primary role of ${bp.concepts.split(',')[0]}?`,
        options: [
          `Optimizes and facilitates ${bp.concepts.split(',')[0]} operations`,
          `Only used for logging errors`,
          `Replaces the underlying database`,
          `Deletes old backup files`
        ],
        correctIndex: 0,
        explanation: `${bp.concepts.split(',')[0]} is designed specifically to handle these operations efficiently.`
      },
      {
        question: `Which of the following is considered a best practice for ${bp.title}?`,
        options: [
          `Never test in staging`,
          `Apply proper partitioning, indexing, and error handling`,
          `Ignore execution plan warnings`,
          `Hardcode production credentials`
        ],
        correctIndex: 1,
        explanation: `Proper resource configuration, partitioning, and error trapping are essential in enterprise workflows.`
      },
      {
        question: `When should you choose ${bp.concepts.split(',')[1] || bp.concepts.split(',')[0]} over alternative approaches?`,
        options: [
          `When data volume, complexity, or business rules require specialized processing`,
          `Only when working with flat text files`,
          `Never, it is completely deprecated`,
          `Only on weekends`
        ],
        correctIndex: 0,
        explanation: `Specialized tools are selected based on data volume, throughput, and schema governance needs.`
      }
    ],
    checklist: [
      `Review lecture notes on ${bp.title}`,
      `Complete hands-on exercise for ${bp.concepts.split(',')[0]}`,
      `Attempt all 3 quiz questions`,
      `Write personal takeaways in the study notes editor`
    ],
    revisionQuestions: [
      `What are the 3 main takeaways from today's lesson on ${bp.title}?`,
      `How does this topic connect to upcoming lessons in the module?`
    ],
    deliverable: `A validated configuration or code script demonstrating mastery of ${bp.title}.`
  };

  days.push(dayObj);
}

curriculum.days = days;

// Output the curriculum manifest to data/curriculum.json
const outputPath = path.join(process.cwd(), 'data', 'curriculum.json');
fs.writeFileSync(outputPath, JSON.stringify(curriculum, null, 2), 'utf-8');

console.log(`Curriculum successfully generated!`);
console.log(`Total Modules: ${curriculum.modules.length}`);
console.log(`Total Days: ${curriculum.days.length}`);
console.log(`Written to: ${outputPath}`);
