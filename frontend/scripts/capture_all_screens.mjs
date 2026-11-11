import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve("../output/playwright/screenshots");
const ARTIFACT_DIR = "C:/Users/Anand/.gemini/antigravity/brain/4708f5c7-3ce0-4b46-9774-28aceeeb0cd6/screenshots";

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

console.log("Starting vite preview server on port " + PORT + "...");
const srv = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  cwd: path.resolve("."),
  stdio: "ignore",
  shell: true,
});

await new Promise((r) => setTimeout(r, 4000));

// Realistic Mock Data
const studentUser = {
  _id: "u1",
  id: "u1",
  firstName: "Asha",
  lastName: "Rao",
  email: "asha.rao@recruitready.edu",
  role: "student",
  college: "National Institute of Technology",
  branch: "Computer Science & Engineering",
  graduationYear: 2027,
  onboardingCompleted: true,
  createdAt: "2026-08-01T10:00:00.000Z",
};

const adminUser = {
  _id: "admin1",
  id: "admin1",
  firstName: "Vikram",
  lastName: "Aditya",
  email: "admin@recruitready.edu",
  role: "admin",
  createdAt: "2025-01-01T10:00:00.000Z",
};

const ok = (data) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ success: true, data }),
});

async function setupMocks(page, role = "student") {
  const currentUser = role === "admin" ? adminUser : studentUser;

  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, "");

    // Auth
    if (p === "/auth/me") return route.fulfill(ok({ user: currentUser }));
    if (p === "/auth/profile") return route.fulfill(ok({ user: currentUser }));
    if (p === "/auth/login" || p === "/auth/register") return route.fulfill(ok({ user: currentUser, token: "jwt-token" }));

    // Notifications
    if (p === "/notifications/unread-count") return route.fulfill(ok(3));
    if (p === "/notifications") {
      return route.fulfill(ok({
        items: [
          { _id: "notif-1", title: "Review Approved", message: "Your Amazon SDE interview review has been verified by the placement team.", type: "review_approved", isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
          { _id: "notif-2", title: "New Mock Assessment", message: "Google Software Engineer Mock Test #4 is now live for your batch.", type: "new_mock_test", isRead: false, link: "/mock-tests/m1", createdAt: new Date(Date.now() - 14400000).toISOString() },
          { _id: "notif-3", title: "Coding Submission Accepted", message: "Your solution for 'Two Sum' passed all 45 test cases.", type: "coding_accepted", isRead: false, link: "/coding/submission/s1", createdAt: new Date(Date.now() - 86400000).toISOString() },
          { _id: "notif-4", title: "Aptitude Practice Milestone", message: "You achieved 85% accuracy in Quantitative Aptitude this week.", type: "aptitude_completed", isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() }
        ],
        total: 4,
        totalPages: 1,
        unreadCount: 3,
      }));
    }

    // Dashboard
    if (p === "/dashboard/summary") {
      return route.fulfill(ok({
        profile: studentUser,
        streakDays: 14,
        streak: { currentStreak: 14, longestStreak: 21, lastActiveDate: new Date().toISOString() },
        preparation: {
          aptitude: { attempted: 28, completed: 25, accuracy: 84 },
          coding: { attempted: 42, solved: 36, acceptanceRate: 81 },
          mockTests: { attempted: 8, completed: 8, averageScore: 86 }
        },
        targetCompanies: [
          { _id: "c1", name: "Google", tier: "Tier 1", role: "Software Engineer", status: "Ready", matchPercentage: 92 },
          { _id: "c2", name: "Microsoft", tier: "Tier 1", role: "SDE-1", status: "In Progress", matchPercentage: 83 },
          { _id: "c3", name: "Amazon", tier: "Tier 1", role: "Software Dev Engineer", status: "In Progress", matchPercentage: 78 }
        ],
        recentActivity: [
          { _id: "act-1", type: "coding", title: "Solved 'Two Sum' in JavaScript", timestamp: new Date(Date.now() - 7200000).toISOString(), xp: 50 },
          { _id: "act-2", type: "aptitude", title: "Completed Quantitative Aptitude Sprint", timestamp: new Date(Date.now() - 86400000).toISOString(), xp: 40 },
          { _id: "act-3", type: "mock_test", title: "Full Assessment Mock #3 - 88%", timestamp: new Date(Date.now() - 172800000).toISOString(), xp: 100 }
        ],
        upcomingTests: [
          { _id: "ut-1", title: "Amazon Campus Drive Assessment", date: new Date(Date.now() + 86400000 * 4).toISOString(), duration: "90 mins", company: "Amazon" },
          { _id: "ut-2", title: "Weekly All-India Aptitude Sprint", date: new Date(Date.now() + 86400000 * 6).toISOString(), duration: "60 mins", company: "RecruitReady" }
        ],
        weakAreas: [
          { topic: "Dynamic Programming", domain: "coding", score: 48, recommendation: "Practice Memoization & Tabulation patterns" },
          { topic: "Permutation & Combination", domain: "aptitude", score: 55, recommendation: "Review fundamental counting principles" }
        ],
        readiness: { score: 86, tier: "Ready", trend: "+8% this week" },
        profileCompletion: { percentage: 92, missing: ["LinkedIn Profile Link"] },
        preparationGoals: [
          { _id: "g1", title: "Solve 5 Hard Dynamic Programming problems", completed: false, deadline: new Date(Date.now() + 86400000 * 3).toISOString() },
          { _id: "g2", title: "Complete 3 full-length timed mock tests", completed: true, deadline: new Date(Date.now() - 86400000).toISOString() }
        ]
      }));
    }

    // Aptitude
    if (p === "/aptitude/metadata") {
      return route.fulfill(ok({
        countsByCategory: { Quantitative: 120, Logical: 95, Verbal: 85 },
        totalQuestions: 300,
        topicsByCategory: {
          Quantitative: ["Arithmetic", "Algebra", "Number System", "Probability", "Time & Work"],
          Logical: ["Puzzles", "Syllogism", "Blood Relations", "Coding-Decoding"],
          Verbal: ["Reading Comprehension", "Sentence Correction", "Vocabulary", "Grammar"]
        }
      }));
    }
    if (p === "/aptitude/history") {
      return route.fulfill(ok({
        attempts: [
          { _id: "apt-1", category: "Quantitative", topic: "Arithmetic", totalQuestions: 10, correctAnswers: 9, score: 90, percentage: 90, completedAt: new Date(Date.now() - 86400000).toISOString(), timeSpentSeconds: 420 },
          { _id: "apt-2", category: "Logical", topic: "Syllogism", totalQuestions: 10, correctAnswers: 8, score: 80, percentage: 80, completedAt: new Date(Date.now() - 172800000).toISOString(), timeSpentSeconds: 380 }
        ],
        pagination: { total: 2, page: 1, limit: 10, pages: 1 }
      }));
    }
    if (p.startsWith("/aptitude/sessions/apt-1") || p.startsWith("/aptitude/session/apt-1")) {
      return route.fulfill(ok({
        session: {
          _id: "apt-1",
          category: "Quantitative",
          topic: "Arithmetic",
          status: "in_progress",
          totalQuestions: 5,
          currentQuestionIndex: 0,
          remainingSeconds: 450,
          questions: [
            { _id: "q1", question: "If 12 men can complete a work in 15 days working 8 hours a day, in how many days can 18 men complete the same work working 6 hours a day?", options: [{ key: "A", text: "15 days" }, { key: "B", text: "20 days" }, { key: "C", text: "16 days" }, { key: "D", text: "18 days" }], category: "Quantitative" },
            { _id: "q2", question: "A train running at 72 km/h crosses a pole in 18 seconds. What is the length of the train in meters?", options: [{ key: "A", text: "320 m" }, { key: "B", text: "360 m" }, { key: "C", text: "400 m" }, { key: "D", text: "300 m" }], category: "Quantitative" }
          ]
        }
      }));
    }
    if (p.startsWith("/aptitude/results/apt-1") || p.startsWith("/aptitude/result/apt-1")) {
      return route.fulfill(ok({
        result: {
          _id: "apt-1",
          category: "Quantitative",
          topic: "Arithmetic",
          score: 9,
          totalQuestions: 10,
          percentage: 90,
          accuracy: 90,
          timeTakenSeconds: 412,
          speed: "41.2s / question",
          breakdown: { correct: 9, incorrect: 1, skipped: 0 },
          percentile: 94.5,
          completedAt: new Date().toISOString()
        }
      }));
    }

    // Coding
    if (p.startsWith("/coding/problems/p1")) {
      return route.fulfill(ok({
        problem: {
          _id: "p1",
          title: "Two Sum",
          slug: "two-sum",
          difficulty: "easy",
          description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
          topics: ["Array", "Hash Table"],
          companies: ["Google", "Amazon", "Microsoft", "Meta"],
          constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
          starterCode: {
            javascript: "function twoSum(nums, target) {\n  // your code here\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}\n",
            python: "def two_sum(nums, target):\n    # your code\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []\n",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}",
            cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};"
          },
          testCases: [
            { input: "nums = [2,7,11,15], target = 9", expectedOutput: "[0,1]", isHidden: false },
            { input: "nums = [3,2,4], target = 6", expectedOutput: "[1,2]", isHidden: false }
          ]
        }
      }));
    }
    if (p.startsWith("/coding/problems")) {
      return route.fulfill(ok({
        problems: [
          { _id: "p1", title: "Two Sum", difficulty: "easy", topics: ["Array", "Hash Table"], solved: true, acceptanceRate: 85, companies: ["Google", "Amazon"] },
          { _id: "p2", title: "LRU Cache", difficulty: "medium", topics: ["Linked List", "Hash Table", "Design"], solved: true, acceptanceRate: 64, companies: ["Microsoft", "Meta"] },
          { _id: "p3", title: "Merge K Sorted Lists", difficulty: "hard", topics: ["Heap", "Linked List", "Divide & Conquer"], solved: false, acceptanceRate: 48, companies: ["Amazon", "Apple"] },
          { _id: "p4", title: "Valid Parentheses", difficulty: "easy", topics: ["Stack", "String"], solved: true, acceptanceRate: 91, companies: ["Bloomberg", "Google"] },
          { _id: "p5", title: "Coin Change", difficulty: "medium", topics: ["Dynamic Programming"], solved: false, acceptanceRate: 52, companies: ["Amazon", "Uber"] }
        ],
        pagination: { total: 5, page: 1, limit: 12, pages: 1 }
      }));
    }
    if (p.startsWith("/coding/submissions/s1") || p.startsWith("/coding/submission/s1")) {
      return route.fulfill(ok({
        submission: {
          _id: "s1",
          problemId: "p1",
          problemTitle: "Two Sum",
          status: "accepted",
          language: "javascript",
          runtimeMs: 54,
          memoryMb: 42.1,
          code: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}",
          testCasesPassed: 45,
          totalTestCases: 45,
          submittedAt: new Date(Date.now() - 86400000).toISOString()
        }
      }));
    }
    if (p.startsWith("/coding/history") || p.startsWith("/coding/submissions")) {
      return route.fulfill(ok({
        submissions: [
          { _id: "s1", problemId: "p1", problemTitle: "Two Sum", status: "accepted", language: "javascript", runtimeMs: 54, submittedAt: new Date(Date.now() - 86400000).toISOString() },
          { _id: "s2", problemId: "p2", problemTitle: "LRU Cache", status: "accepted", language: "python", runtimeMs: 78, submittedAt: new Date(Date.now() - 172800000).toISOString() }
        ],
        pagination: { total: 2, page: 1, limit: 10, pages: 1 }
      }));
    }

    // Mock Tests
    if (p.startsWith("/mock-tests/attempts/m1/result") || p.startsWith("/mock-tests/result/m1")) {
      return route.fulfill(ok({
        result: {
          _id: "m1",
          title: "Full Placement Assessment Mock #1",
          score: 88,
          totalQuestions: 30,
          correctAnswers: 26,
          percentage: 86.6,
          timeSpentSeconds: 3120,
          rank: 4,
          totalParticipants: 142,
          percentile: 97.2,
          sectionScores: {
            quantitative: { score: 9, total: 10, percentage: 90 },
            logical: { score: 8, total: 10, percentage: 80 },
            coding: { score: 9, total: 10, percentage: 90 }
          },
          submittedAt: new Date(Date.now() - 172800000).toISOString()
        }
      }));
    }
    if (p.startsWith("/mock-tests/attempts/m1") || p.startsWith("/mock-tests/session/m1")) {
      return route.fulfill(ok({
        attempt: { _id: "m1", status: "in_progress", remainingSeconds: 1800, answers: [{ questionId: "q1", answer: "A" }] },
        test: { _id: "m1", title: "Comprehensive SDE Mock Test #1", durationMinutes: 60, totalQuestions: 25 },
        questions: [
          { _id: "q1", question: "What is the worst-case time complexity of finding an element in a balanced Red-Black Tree?", category: "Technical", options: [{ key: "A", text: "O(log n)" }, { key: "B", text: "O(n)" }, { key: "C", text: "O(1)" }, { key: "D", text: "O(n log n)" }] },
          { _id: "q2", question: "In relational database systems, which ACID property guarantees that concurrent transactions do not interfere with each other?", category: "Core CS", options: [{ key: "A", text: "Atomicity" }, { key: "B", text: "Consistency" }, { key: "C", text: "Isolation" }, { key: "D", text: "Durability" }] }
        ]
      }));
    }
    if (p.startsWith("/mock-tests/history")) {
      return route.fulfill(ok({
        attempts: [
          { _id: "m1", mockTest: { title: "Full Placement Assessment Mock #1", _id: "m1" }, status: "submitted", score: 88, totalQuestions: 30, percentage: 86.6, submittedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
          { _id: "m2", mockTest: { title: "Amazon SDE Technical Mock Sprint", _id: "m2" }, status: "submitted", score: 82, totalQuestions: 25, percentage: 82.0, submittedAt: new Date(Date.now() - 86400000 * 5).toISOString() }
        ],
        pagination: { total: 2, page: 1, limit: 10, pages: 1 }
      }));
    }
    if (p === "/mock-tests/m1") {
      return route.fulfill(ok({
        mockTest: {
          _id: "m1",
          title: "Comprehensive SDE Mock Test #1",
          description: "Full-length 60-minute placement assessment covering Aptitude, Data Structures, Algorithms, and Core CS Fundamentals modeled after Tier-1 tech recruitment drives.",
          durationMinutes: 60,
          totalQuestions: 30,
          passingScore: 70,
          sections: [
            { name: "Quantitative Aptitude", questionCount: 10 },
            { name: "Logical Reasoning", questionCount: 10 },
            { name: "Technical / CS Fundamentals", questionCount: 10 }
          ],
          totalAttempts: 340,
          averageScore: 74
        }
      }));
    }
    if (p.startsWith("/mock-tests")) {
      return route.fulfill(ok({
        mockTests: [
          { _id: "m1", title: "Comprehensive SDE Mock Test #1", durationMinutes: 60, totalQuestions: 30, category: "Full-Length", attemptsCount: 340, tags: ["Tier-1", "SDE"] },
          { _id: "m2", title: "Amazon Specific Technical Sprint", durationMinutes: 45, totalQuestions: 25, category: "Company Specific", attemptsCount: 280, tags: ["Amazon", "Medium"] },
          { _id: "m3", title: "Aptitude Fast-Track Benchmark", durationMinutes: 30, totalQuestions: 20, category: "Domain Specific", attemptsCount: 512, tags: ["Aptitude", "Speed"] }
        ],
        pagination: { total: 3, page: 1, limit: 10, pages: 1 }
      }));
    }

    // Companies
    if (p.startsWith("/companies/c1") || p === "/companies/c1") {
      return route.fulfill(ok({
        company: {
          _id: "c1",
          name: "Google",
          slug: "google",
          tier: "Tier 1",
          industry: "Technology / Cloud / Search",
          locations: ["Bengaluru", "Hyderabad", "Mountain View"],
          hiringRoles: ["Software Engineer (L3)", "Associate Product Manager"],
          salaryRange: "₹32L - ₹48L CTC",
          description: "Google LLC is an American multinational corporation and technology company focusing on online advertising, search engine technology, cloud computing, computer software, quantum computing, e-commerce, consumer electronics, and artificial intelligence.",
          selectionProcess: [
            { round: 1, title: "Online Coding Assessment", description: "2 algorithmic problems (70 mins) on HackerEarth/custom platform." },
            { round: 2, title: "Technical Round 1", description: "Data structures, graph algorithms, and edge case reasoning." },
            { round: 3, title: "Technical Round 2", description: "Dynamic programming, concurrency, and complexity proof." },
            { round: 4, title: "Googleyness & Leadership", description: "Behavioral and situational culture alignment." }
          ],
          syllabus: ["Graphs (BFS/DFS, Dijkstra, Topo Sort)", "Dynamic Programming", "Trees & Tries", "Hash Tables"],
          pastQuestionsCount: 48,
          hiredAlumniCount: 34
        }
      }));
    }
    if (p.startsWith("/companies")) {
      return route.fulfill(ok({
        companies: [
          { _id: "c1", name: "Google", tier: "Tier 1", role: "Software Engineer", package: "₹36-45 LPA", logo: null, problemsCount: 52, status: "Active" },
          { _id: "c2", name: "Microsoft", tier: "Tier 1", role: "SDE-1", package: "₹28-42 LPA", logo: null, problemsCount: 46, status: "Active" },
          { _id: "c3", name: "Amazon", tier: "Tier 1", role: "Software Dev Engineer", package: "₹32-44 LPA", logo: null, problemsCount: 68, status: "Active" },
          { _id: "c4", name: "Atlassian", tier: "Tier 1", role: "Graduate Developer", package: "₹45-55 LPA", logo: null, problemsCount: 38, status: "Active" }
        ],
        pagination: { total: 4, page: 1, limit: 10, pages: 1 }
      }));
    }

    // Resources
    if (p.startsWith("/resources/r1") || p === "/resources/r1") {
      return route.fulfill(ok({
        resource: {
          _id: "r1",
          title: "Complete System Design Roadmap for Placement Interviews",
          category: "System Design",
          description: "Comprehensive step-by-step master guide covering Horizontal Scaling, Caching Strategies (Redis/Memcached), Message Queues (Kafka), Database Sharding, and Load Balancing.",
          content: "# System Design Master Guide\n\n### 1. Scaling from zero to millions of users\n- Horizontal vs Vertical Scaling\n- Stateless Web Tier\n- Caching Layers\n- Database Replication & Read Replicas\n\n### 2. High-Frequency Interview Questions\n1. Design a URL Shortener (TinyURL)\n2. Design a Rate Limiter\n3. Design a Notification System",
          author: "Placement Cell & Industry Alumni",
          readTime: "18 mins",
          likes: 312,
          bookmarked: true,
          updatedAt: new Date().toISOString()
        }
      }));
    }
    if (p.startsWith("/resources")) {
      return route.fulfill(ok({
        resources: [
          { _id: "r1", title: "Complete System Design Roadmap for Placement Interviews", category: "System Design", readTime: "18 mins", likes: 312, bookmarked: true },
          { _id: "r2", title: "Top 75 Dynamic Programming Patterns with Solutions", category: "Coding", readTime: "25 mins", likes: 480, bookmarked: true },
          { _id: "r3", title: "Comprehensive Quantitative Aptitude Formula Cheatsheet", category: "Aptitude", readTime: "12 mins", likes: 620, bookmarked: false },
          { _id: "r4", title: "Behavioral Interview Questions & STAR Method Framework", category: "HR / Soft Skills", readTime: "10 mins", likes: 290, bookmarked: false }
        ],
        pagination: { total: 4, page: 1, limit: 10, pages: 1 }
      }));
    }

    // Progress & Analytics
    if (p === "/progress/summary") {
      return route.fulfill(ok({
        overview: {
          totalSolved: 36,
          accuracy: 84.5,
          totalTimeHours: 42,
          ranking: 6,
          readinessScore: 88,
          readinessLevel: "Campus Ready",
          xp: 2840,
          currentStreak: 14
        },
        aptitude: {
          attempted: 28,
          completed: 25,
          accuracy: 84,
          topicsCount: 12,
          recentScore: 90
        },
        coding: {
          easy: { solved: 18, total: 20 },
          medium: { solved: 14, total: 25 },
          hard: { solved: 4, total: 10 },
          acceptanceRate: 81
        },
        mockTests: {
          attempted: 8,
          completed: 8,
          averageScore: 86,
          highestScore: 94
        },
        topics: [
          { name: "Dynamic Programming", domain: "Coding", accuracy: 58, solved: 8 },
          { name: "Graph Algorithms", domain: "Coding", accuracy: 76, solved: 10 },
          { name: "Quantitative Aptitude", domain: "Aptitude", accuracy: 88, solved: 22 },
          { name: "Logical Reasoning", domain: "Aptitude", accuracy: 84, solved: 18 }
        ],
        strengthsAndWeaknesses: {
          strengths: ["Data Structures (Arrays/Hash Tables)", "Arithmetic Aptitude", "Code Optimization"],
          weaknesses: ["Dynamic Programming (Hard)", "Permutations & Combinations"]
        },
        trend: [
          { date: "2026-10-20", score: 72 },
          { date: "2026-10-25", score: 76 },
          { date: "2026-11-01", score: 82 },
          { date: "2026-11-05", score: 85 },
          { date: "2026-11-09", score: 88 }
        ],
        milestones: [
          { title: "Solved 25 Algorithmic Problems", unlocked: true, date: "2026-10-28" },
          { title: "Completed 5 Full-Length Mock Assessments", unlocked: true, date: "2026-11-04" },
          { title: "Achieved >85% Overall Readiness Index", unlocked: true, date: "2026-11-09" }
        ]
      }));
    }

    // Leaderboard
    if (p.startsWith("/leaderboard")) {
      return route.fulfill(ok({
        leaderboard: [
          { rank: 1, student: { id: "u101", firstName: "Aditya", lastName: "Verma", college: "IIT Madras" }, score: 3450, solvedCount: 94, accuracy: 94.2 },
          { rank: 2, student: { id: "u102", firstName: "Sanya", lastName: "Kapoor", college: "NIT Surathkal" }, score: 3280, solvedCount: 88, accuracy: 91.8 },
          { rank: 3, student: { id: "u103", firstName: "Rohan", lastName: "Iyer", college: "BITS Pilani" }, score: 3120, solvedCount: 84, accuracy: 89.5 },
          { rank: 4, student: { id: "u1", firstName: "Asha", lastName: "Rao", college: "NIT Trichy" }, score: 2840, solvedCount: 78, accuracy: 88.0 },
          { rank: 5, student: { id: "u105", firstName: "Karan", lastName: "Mehta", college: "DTU Delhi" }, score: 2710, solvedCount: 72, accuracy: 86.4 },
          { rank: 6, student: { id: "u106", firstName: "Neha", lastName: "Gupta", college: "IIIT Hyderabad" }, score: 2650, solvedCount: 70, accuracy: 85.0 }
        ],
        currentUser: { rank: 4, score: 2840, solvedCount: 78, accuracy: 88.0 },
        totalRankedStudents: 1420
      }));
    }

    // Reviews
    if (p.startsWith("/reviews")) {
      return route.fulfill(ok({
        reviews: [
          {
            _id: "rev-1",
            company: "Amazon",
            role: "Software Development Engineer (SDE-1)",
            author: "Anonymous Student (Batch 2026)",
            status: "approved",
            rating: 5,
            difficulty: "Medium",
            offerReceived: true,
            summary: "On-campus drive had 1 online assessment + 3 virtual interview loops. Heavy emphasis on Leadership Principles and Clean Code.",
            interviewExperience: "Round 1 was OA on HackerRank with 2 coding questions (sliding window + tree traversal). Round 2 focused on customer obsession LP questions followed by graph BFS problem.",
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            _id: "rev-2",
            company: "Google",
            role: "Software Engineer",
            author: "Alumni Candidate",
            status: "approved",
            rating: 5,
            difficulty: "Hard",
            offerReceived: true,
            summary: "Strictly algorithmic depth and optimal time complexity proofs. Exceptional interviewer support.",
            interviewExperience: "Questions involved 2D dynamic programming and topological sorting with cycle detection.",
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
          }
        ],
        pagination: { total: 2, page: 1, limit: 10, pages: 1 }
      }));
    }

    // Bookmarks / Saved
    if (p.startsWith("/bookmarks") || p.startsWith("/saved")) {
      return route.fulfill(ok({
        bookmarks: [
          { _id: "b1", itemType: "coding", itemId: "p1", title: "Two Sum", difficulty: "easy", category: "Array", savedAt: new Date().toISOString() },
          { _id: "b2", itemType: "resource", itemId: "r1", title: "Complete System Design Roadmap", category: "System Design", savedAt: new Date().toISOString() },
          { _id: "b3", itemType: "company", itemId: "c1", title: "Google", category: "Tier 1", savedAt: new Date().toISOString() }
        ]
      }));
    }

    // Goals
    if (p.startsWith("/goals")) {
      return route.fulfill(ok({
        goals: [
          { _id: "g1", title: "Solve 5 Hard Dynamic Programming problems", completed: false, deadline: new Date(Date.now() + 86400000 * 3).toISOString() },
          { _id: "g2", title: "Complete 3 full-length timed mock tests", completed: true, deadline: new Date(Date.now() - 86400000).toISOString() },
          { _id: "g3", title: "Achieve 90% accuracy in Quantitative Aptitude", completed: true, deadline: new Date(Date.now() - 86400000 * 3).toISOString() }
        ]
      }));
    }

    // Search
    if (p.startsWith("/search")) {
      return route.fulfill(ok({
        query: "code",
        totalResults: 4,
        coding: [{ _id: "p1", title: "Two Sum", difficulty: "easy" }],
        companies: [{ _id: "c1", name: "Google", role: "Software Engineer" }],
        mockTests: [{ _id: "m1", title: "Comprehensive SDE Mock Test #1" }],
        resources: [{ _id: "r1", title: "Complete System Design Roadmap" }],
        aptitude: []
      }));
    }

    // ─── ADMIN ENDPOINTS ──────────────────────────────
    if (p === "/admin/dashboard" || p === "/admin/stats") {
      return route.fulfill(ok({
        students: { total: 1420, active: 1280 },
        aptitude: { questions: 340, attempts: 8420 },
        coding: { problems: 185, submissions: 6210 },
        companies: { total: 64 },
        resources: { total: 120 },
        mockTests: { total: 28, attempts: 1940 },
        reviews: { total: 450, pending: 12 },
        pendingActions: {
          pendingReviews: 12,
          inactiveQuestions: 4,
          inactiveProblems: 2,
          unpublishedMockTests: 3,
          totalPending: 21
        },
        health: { dbStatus: "connected", uptimeSeconds: 864000, memoryUsageMb: 142 },
        activity: [
          { _id: "a1", action: "Student Registration", details: "Rahul Sharma (CSE 2026) verified email", createdAt: new Date(Date.now() - 600000).toISOString() },
          { _id: "a2", action: "Coding Accepted", details: "Priya Patel solved 'LRU Cache' in Python", createdAt: new Date(Date.now() - 1800000).toISOString() },
          { _id: "a3", action: "Mock Assessment Completed", details: "Amazon SDE Mock #2 by Amit Verma (88%)", createdAt: new Date(Date.now() - 3600000).toISOString() }
        ]
      }));
    }
    if (p === "/admin/health") {
      return route.fulfill(ok({ dbStatus: "connected", uptimeSeconds: 864000, memoryUsageMb: 142, nodeVersion: "v20.18.0" }));
    }
    if (p.startsWith("/admin/students")) {
      return route.fulfill(ok({
        students: [
          { _id: "s1", firstName: "Asha", lastName: "Rao", email: "asha.rao@recruitready.edu", branch: "CSE", graduationYear: 2027, isActive: true, isEmailVerified: true, createdAt: "2026-08-01T10:00:00.000Z" },
          { _id: "s2", firstName: "Aditya", lastName: "Verma", email: "aditya.v@recruitready.edu", branch: "ECE", graduationYear: 2026, isActive: true, isEmailVerified: true, createdAt: "2026-08-02T10:00:00.000Z" },
          { _id: "s3", firstName: "Priya", lastName: "Patel", email: "priya.p@recruitready.edu", branch: "IT", graduationYear: 2027, isActive: true, isEmailVerified: true, createdAt: "2026-08-03T10:00:00.000Z" },
          { _id: "s4", firstName: "Rahul", lastName: "Sharma", email: "rahul.s@recruitready.edu", branch: "CSE", graduationYear: 2026, isActive: false, isEmailVerified: false, createdAt: "2026-08-04T10:00:00.000Z" }
        ],
        pagination: { total: 1420, page: 1, limit: 10, totalPages: 142 }
      }));
    }
    if (p.startsWith("/admin/aptitude/questions")) {
      return route.fulfill(ok({
        questions: [
          { _id: "aq1", question: "If 12 men can complete a work in 15 days working 8 hours a day...", category: "Quantitative", difficulty: "medium", isActive: true, createdAt: new Date().toISOString() },
          { _id: "aq2", question: "A train running at 72 km/h crosses a pole in 18 seconds...", category: "Quantitative", difficulty: "easy", isActive: true, createdAt: new Date().toISOString() }
        ],
        pagination: { total: 340, page: 1, limit: 10, totalPages: 34 }
      }));
    }
    if (p.startsWith("/admin/coding/problems")) {
      return route.fulfill(ok({
        problems: [
          { _id: "p1", title: "Two Sum", difficulty: "easy", topics: ["Array", "Hash Table"], isActive: true, submissionsCount: 1420 },
          { _id: "p2", title: "LRU Cache", difficulty: "medium", topics: ["Linked List", "Design"], isActive: true, submissionsCount: 890 }
        ],
        pagination: { total: 185, page: 1, limit: 10, totalPages: 19 }
      }));
    }
    if (p.startsWith("/admin/companies")) {
      return route.fulfill(ok({
        companies: [
          { _id: "c1", name: "Google", tier: "Tier 1", role: "Software Engineer", isActive: true, studentsHired: 34 },
          { _id: "c2", name: "Microsoft", tier: "Tier 1", role: "SDE-1", isActive: true, studentsHired: 42 }
        ],
        pagination: { total: 64, page: 1, limit: 10, totalPages: 7 }
      }));
    }
    if (p.startsWith("/admin/resources")) {
      return route.fulfill(ok({
        resources: [
          { _id: "r1", title: "System Design Roadmap", category: "System Design", isActive: true, viewsCount: 1240 },
          { _id: "r2", title: "Dynamic Programming Guide", category: "Coding", isActive: true, viewsCount: 1890 }
        ],
        pagination: { total: 120, page: 1, limit: 10, totalPages: 12 }
      }));
    }
    if (p.startsWith("/admin/mock-tests")) {
      return route.fulfill(ok({
        mockTests: [
          { _id: "m1", title: "Comprehensive SDE Mock Test #1", durationMinutes: 60, totalQuestions: 30, isPublished: true, totalAttempts: 340 },
          { _id: "m2", title: "Amazon Specific Technical Sprint", durationMinutes: 45, totalQuestions: 25, isPublished: true, totalAttempts: 280 }
        ],
        pagination: { total: 28, page: 1, limit: 10, totalPages: 3 }
      }));
    }
    if (p.startsWith("/admin/reviews")) {
      return route.fulfill(ok({
        reviews: [
          { _id: "rev-1", company: "Amazon", role: "SDE-1", status: "pending", rating: 5, author: "Rahul Sharma", createdAt: new Date().toISOString() },
          { _id: "rev-2", company: "Google", role: "Software Engineer", status: "approved", rating: 5, author: "Asha Rao", createdAt: new Date().toISOString() }
        ],
        pagination: { total: 450, page: 1, limit: 10, totalPages: 45 }
      }));
    }
    if (p.startsWith("/admin/analytics")) {
      return route.fulfill(ok({
        registrationTrend: [{ date: "2026-11-01", count: 24 }, { date: "2026-11-05", count: 48 }, { date: "2026-11-09", count: 62 }],
        domainPerformance: { aptitude: 82, coding: 74, mockTests: 81 },
        companyEngagement: [{ name: "Google", visits: 840 }, { name: "Amazon", visits: 920 }, { name: "Microsoft", visits: 780 }]
      }));
    }
    if (p.startsWith("/admin/audit-logs")) {
      return route.fulfill(ok({
        logs: [
          { _id: "log-1", adminEmail: "admin@recruitready.edu", action: "UPDATE_STATUS", target: "Student #s1", timestamp: new Date(Date.now() - 1800000).toISOString() },
          { _id: "log-2", adminEmail: "admin@recruitready.edu", action: "APPROVE_REVIEW", target: "Review #rev-2", timestamp: new Date(Date.now() - 3600000).toISOString() }
        ],
        pagination: { total: 120, page: 1, limit: 10, totalPages: 12 }
      }));
    }

    return route.fulfill(ok({}));
  });
}

const browser = await chromium.launch();

async function takePageScreenshot({
  url,
  filename,
  theme = "light",
  isMobile = false,
  role = "student",
  interaction = null,
  timeout = 15000,
}) {
  const viewport = isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };

  // Use Playwright native storageState so localStorage is seeded directly on origin
  const localStorageItems = [
    { name: "rr_theme", value: theme }
  ];

  if (role === "student" || role === "admin") {
    localStorageItems.push({ name: "recruiteready_token", value: `valid-${role}-token` });
    localStorageItems.push({ name: "rr_tour_done_u1", value: "1" });
  }

  const storageState = {
    origins: [
      {
        origin: BASE,
        localStorage: localStorageItems,
      },
    ],
  };

  const ctx = await browser.newContext({
    viewport,
    colorScheme: theme,
    storageState,
  });

  const page = await ctx.newPage();
  await setupMocks(page, role);

  try {
    await page.goto(BASE + url, { waitUntil: "networkidle", timeout });

    // Guarantee data-theme attribute on root element
    await page.evaluate((th) => {
      document.documentElement.setAttribute("data-theme", th);
    }, theme);

    await page.waitForTimeout(600);

    if (interaction) {
      await interaction(page);
      await page.waitForTimeout(500);
    }

    const currentUrl = page.url();
    if (!url.includes("/login") && currentUrl.includes("/login")) {
      console.warn(`[WARN REDIRECT] ${filename} intended for ${url} was redirected to ${currentUrl}`);
    }

    const outPath = path.join(OUT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);

    await page.screenshot({ path: outPath, fullPage: false });
    fs.copyFileSync(outPath, artifactPath);
    const size = fs.statSync(outPath).size;
    console.log(`[SAVED] ${filename} -> ${currentUrl} (${size} bytes)`);
  } catch (err) {
    console.error(`[ERROR] ${filename} on ${url}:`, err.message);
  } finally {
    await ctx.close();
  }
}

// ─────────────────────────────────────────────────────────────
// SCREENSHOT TARGETS SPECIFICATION (97 Targets)
// ─────────────────────────────────────────────────────────────
const targets = [
  // 1. Public & Auth (role = "guest")
  { url: "/", filename: "01_landing_light.png", theme: "light", role: "guest" },
  { url: "/", filename: "02_landing_dark.png", theme: "dark", role: "guest" },
  { url: "/", filename: "03_landing_mobile_phone.png", theme: "light", isMobile: true, role: "guest" },
  { url: "/login", filename: "04_login_light.png", theme: "light", role: "guest" },
  { url: "/login", filename: "05_login_dark.png", theme: "dark", role: "guest" },
  { url: "/login", filename: "06_login_mobile_phone.png", theme: "light", isMobile: true, role: "guest" },
  { url: "/register", filename: "07_register_light.png", theme: "light", role: "guest" },
  { url: "/register", filename: "08_register_dark.png", theme: "dark", role: "guest" },
  { url: "/forgot-password", filename: "09_forgot_password_light.png", theme: "light", role: "guest" },
  { url: "/forgot-password", filename: "10_forgot_password_dark.png", theme: "dark", role: "guest" },
  { url: "/reset-password", filename: "11_reset_password_light.png", theme: "light", role: "guest" },
  { url: "/reset-password", filename: "12_reset_password_dark.png", theme: "dark", role: "guest" },
  { url: "/verify-email", filename: "13_verify_email_light.png", theme: "light", role: "guest" },
  { url: "/verify-email", filename: "14_verify_email_dark.png", theme: "dark", role: "guest" },

  // 2. Student Shell (Navigation, Palette, Notifications)
  { url: "/dashboard", filename: "15_student_shell_light.png", theme: "light", role: "student" },
  { url: "/dashboard", filename: "16_student_shell_dark.png", theme: "dark", role: "student" },
  {
    url: "/dashboard",
    filename: "17_command_palette_search_light.png",
    theme: "light",
    role: "student",
    interaction: async (page) => {
      await page.keyboard.press("Control+k");
      await page.waitForSelector('[aria-label="Command palette and search"]', { timeout: 3000 }).catch(() => {});
    }
  },
  {
    url: "/dashboard",
    filename: "18_command_palette_search_dark.png",
    theme: "dark",
    role: "student",
    interaction: async (page) => {
      await page.keyboard.press("Control+k");
      await page.waitForSelector('[aria-label="Command palette and search"]', { timeout: 3000 }).catch(() => {});
    }
  },
  {
    url: "/dashboard",
    filename: "19_notification_dropdown_light.png",
    theme: "light",
    role: "student",
    interaction: async (page) => {
      const bell = page.locator('button[aria-label^="Notifications"]').first();
      await bell.click().catch(() => {});
    }
  },
  {
    url: "/dashboard",
    filename: "20_notification_dropdown_dark.png",
    theme: "dark",
    role: "student",
    interaction: async (page) => {
      const bell = page.locator('button[aria-label^="Notifications"]').first();
      await bell.click().catch(() => {});
    }
  },
  {
    url: "/dashboard",
    filename: "21_mobile_shell_drawer_open.png",
    theme: "light",
    isMobile: true,
    role: "student",
    interaction: async (page) => {
      const menuBtn = page.locator('button[aria-label*="sidebar menu"]').first();
      await menuBtn.click().catch(() => {});
    }
  },

  // 3. Dashboard
  { url: "/dashboard", filename: "22_dashboard_light.png", theme: "light", role: "student" },
  { url: "/dashboard", filename: "23_dashboard_dark.png", theme: "dark", role: "student" },
  { url: "/dashboard", filename: "24_dashboard_mobile_phone.png", theme: "light", isMobile: true, role: "student" },

  // 4. Aptitude Practice
  { url: "/aptitude", filename: "25_aptitude_practice_light.png", theme: "light", role: "student" },
  { url: "/aptitude", filename: "26_aptitude_practice_dark.png", theme: "dark", role: "student" },
  { url: "/aptitude/session/apt-1", filename: "27_aptitude_session_light.png", theme: "light", role: "student" },
  { url: "/aptitude/session/apt-1", filename: "28_aptitude_session_dark.png", theme: "dark", role: "student" },
  { url: "/aptitude/result/apt-1", filename: "29_aptitude_result_light.png", theme: "light", role: "student" },
  { url: "/aptitude/result/apt-1", filename: "30_aptitude_result_dark.png", theme: "dark", role: "student" },
  { url: "/aptitude/history", filename: "31_aptitude_history_light.png", theme: "light", role: "student" },
  { url: "/aptitude/history", filename: "32_aptitude_history_dark.png", theme: "dark", role: "student" },

  // 5. Coding Practice
  { url: "/coding", filename: "33_coding_list_light.png", theme: "light", role: "student" },
  { url: "/coding", filename: "34_coding_list_dark.png", theme: "dark", role: "student" },
  { url: "/coding/problem/p1", filename: "35_coding_problem_editor_light.png", theme: "light", role: "student" },
  { url: "/coding/problem/p1", filename: "36_coding_problem_editor_dark.png", theme: "dark", role: "student" },
  { url: "/coding/problem/p1", filename: "37_coding_problem_editor_mobile_phone.png", theme: "light", isMobile: true, role: "student" },
  { url: "/coding/history", filename: "38_coding_history_light.png", theme: "light", role: "student" },
  { url: "/coding/history", filename: "39_coding_history_dark.png", theme: "dark", role: "student" },
  { url: "/coding/submission/s1", filename: "40_coding_submission_detail_light.png", theme: "light", role: "student" },
  { url: "/coding/submission/s1", filename: "41_coding_submission_detail_dark.png", theme: "dark", role: "student" },

  // 6. Mock Tests
  { url: "/mock-tests", filename: "42_mock_tests_list_light.png", theme: "light", role: "student" },
  { url: "/mock-tests", filename: "43_mock_tests_list_dark.png", theme: "dark", role: "student" },
  { url: "/mock-tests/m1", filename: "44_mock_test_detail_light.png", theme: "light", role: "student" },
  { url: "/mock-tests/m1", filename: "45_mock_test_detail_dark.png", theme: "dark", role: "student" },
  { url: "/mock-tests/session/m1", filename: "46_mock_test_session_light.png", theme: "light", role: "student" },
  { url: "/mock-tests/session/m1", filename: "47_mock_test_session_dark.png", theme: "dark", role: "student" },
  { url: "/mock-tests/result/m1", filename: "48_mock_test_result_light.png", theme: "light", role: "student" },
  { url: "/mock-tests/result/m1", filename: "49_mock_test_result_dark.png", theme: "dark", role: "student" },
  { url: "/mock-tests/history", filename: "50_mock_test_history_light.png", theme: "light", role: "student" },
  { url: "/mock-tests/history", filename: "51_mock_test_history_dark.png", theme: "dark", role: "student" },

  // 7. Companies & Resources
  { url: "/companies", filename: "52_companies_list_light.png", theme: "light", role: "student" },
  { url: "/companies", filename: "53_companies_list_dark.png", theme: "dark", role: "student" },
  { url: "/companies/c1", filename: "54_company_detail_light.png", theme: "light", role: "student" },
  { url: "/companies/c1", filename: "55_company_detail_dark.png", theme: "dark", role: "student" },
  { url: "/resources", filename: "56_resources_list_light.png", theme: "light", role: "student" },
  { url: "/resources", filename: "57_resources_list_dark.png", theme: "dark", role: "student" },
  { url: "/resources/r1", filename: "58_resource_detail_light.png", theme: "light", role: "student" },
  { url: "/resources/r1", filename: "59_resource_detail_dark.png", theme: "dark", role: "student" },

  // 8. Progress, Goals & Leaderboard
  { url: "/progress", filename: "60_progress_analytics_light.png", theme: "light", role: "student" },
  { url: "/progress", filename: "61_progress_analytics_dark.png", theme: "dark", role: "student" },
  { url: "/progress", filename: "62_progress_mobile_phone.png", theme: "light", isMobile: true, role: "student" },
  { url: "/leaderboard", filename: "63_leaderboard_light.png", theme: "light", role: "student" },
  { url: "/leaderboard", filename: "64_leaderboard_dark.png", theme: "dark", role: "student" },

  // 9. Profile & Onboarding
  { url: "/profile", filename: "65_profile_light.png", theme: "light", role: "student" },
  { url: "/profile", filename: "66_profile_dark.png", theme: "dark", role: "student" },
  { url: "/onboarding", filename: "67_onboarding_wizard_light.png", theme: "light", role: "student" },
  { url: "/onboarding", filename: "68_onboarding_wizard_dark.png", theme: "dark", role: "student" },

  // 10. Reviews & Notifications
  { url: "/reviews", filename: "69_reviews_light.png", theme: "light", role: "student" },
  { url: "/reviews", filename: "70_reviews_dark.png", theme: "dark", role: "student" },
  { url: "/notifications", filename: "71_notifications_page_light.png", theme: "light", role: "student" },
  { url: "/notifications", filename: "72_notifications_page_dark.png", theme: "dark", role: "student" },
  { url: "/saved", filename: "73_saved_bookmarks_light.png", theme: "light", role: "student" },
  { url: "/saved", filename: "74_saved_bookmarks_dark.png", theme: "dark", role: "student" },

  // 11. Admin Panel
  { url: "/admin", filename: "75_admin_dashboard_light.png", theme: "light", role: "admin" },
  { url: "/admin", filename: "76_admin_dashboard_dark.png", theme: "dark", role: "admin" },
  { url: "/admin", filename: "77_admin_dashboard_mobile_phone.png", theme: "light", isMobile: true, role: "admin" },
  { url: "/admin/students", filename: "78_admin_students_light.png", theme: "light", role: "admin" },
  { url: "/admin/students", filename: "79_admin_students_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/aptitude", filename: "80_admin_aptitude_light.png", theme: "light", role: "admin" },
  { url: "/admin/aptitude", filename: "81_admin_aptitude_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/coding", filename: "82_admin_coding_light.png", theme: "light", role: "admin" },
  { url: "/admin/coding", filename: "83_admin_coding_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/companies", filename: "84_admin_companies_light.png", theme: "light", role: "admin" },
  { url: "/admin/companies", filename: "85_admin_companies_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/resources", filename: "86_admin_resources_light.png", theme: "light", role: "admin" },
  { url: "/admin/resources", filename: "87_admin_resources_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/mock-tests", filename: "88_admin_mock_tests_light.png", theme: "light", role: "admin" },
  { url: "/admin/mock-tests", filename: "89_admin_mock_tests_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/reviews", filename: "90_admin_reviews_light.png", theme: "light", role: "admin" },
  { url: "/admin/reviews", filename: "91_admin_reviews_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/analytics", filename: "92_admin_analytics_light.png", theme: "light", role: "admin" },
  { url: "/admin/analytics", filename: "93_admin_analytics_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/audit-logs", filename: "94_admin_audit_logs_light.png", theme: "light", role: "admin" },
  { url: "/admin/audit-logs", filename: "95_admin_audit_logs_dark.png", theme: "dark", role: "admin" },
  { url: "/admin/settings", filename: "96_admin_settings_light.png", theme: "light", role: "admin" },
  { url: "/admin/settings", filename: "97_admin_settings_dark.png", theme: "dark", role: "admin" },
];

console.log(`Starting capture of ${targets.length} screenshots with native storageState...`);

for (const target of targets) {
  await takePageScreenshot(target);
}

await browser.close();
try {
  srv.kill();
} catch {}

console.log("ALL 97 SCREENSHOTS CAPTURED WITH DIVERSE PAGE STATES!");
process.exit(0);
