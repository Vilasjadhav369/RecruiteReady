import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import CodingProblem from '../models/CodingProblem.js';
import Company from '../models/Company.js';
import StudyMaterial from '../models/StudyMaterial.js';
import MockTest from '../models/MockTest.js';
import User from '../models/User.js';

dotenv.config();

const APTITUDE_SEED = [
  // ── Quantitative Aptitude ──
  {
    question: 'A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?',
    options: [
      { key: 'A', text: '65 seconds' },
      { key: 'B', text: '89 seconds' },
      { key: 'C', text: '100 seconds' },
      { key: 'D', text: '150 seconds' },
    ],
    correctOption: 'B',
    category: 'Quantitative Aptitude',
    topic: 'Speed and Distance',
    difficulty: 'medium',
    explanation: 'Speed = 240 / 24 = 10 m/s. Required time to cross platform = (240 + 650) / 10 = 890 / 10 = 89 seconds.',
    tags: ['speed', 'trains'],
  },
  {
    question: 'A and B together can complete a piece of work in 12 days, while B alone can finish it in 30 days. In how many days can A alone complete the work?',
    options: [
      { key: 'A', text: '18 days' },
      { key: 'B', text: '20 days' },
      { key: 'C', text: '24 days' },
      { key: 'D', text: '25 days' },
    ],
    correctOption: 'B',
    category: 'Quantitative Aptitude',
    topic: 'Time and Work',
    difficulty: 'easy',
    explanation: 'Work rate of A = 1/12 - 1/30 = (5 - 2) / 60 = 3/60 = 1/20. Thus, A alone takes 20 days.',
    tags: ['time-work', 'efficiency'],
  },
  {
    question: 'If the cost price of 20 articles is equal to the selling price of 16 articles, what is the profit percentage?',
    options: [
      { key: 'A', text: '20%' },
      { key: 'B', text: '25%' },
      { key: 'C', text: '30%' },
      { key: 'D', text: '33.33%' },
    ],
    correctOption: 'B',
    category: 'Quantitative Aptitude',
    topic: 'Profit and Loss',
    difficulty: 'easy',
    explanation: 'Let CP of 1 article = Rs 1. CP of 20 = Rs 20. SP of 16 = Rs 20 -> SP of 1 = 20/16 = 1.25. Profit = 0.25 on 1 -> 25%.',
    tags: ['profit-loss', 'percentages'],
  },
  {
    question: 'The average of 5 consecutive odd numbers is 27. What is the product of the first and fifth numbers?',
    options: [
      { key: 'A', text: '675' },
      { key: 'B', text: '713' },
      { key: 'C', text: '725' },
      { key: 'D', text: '745' },
    ],
    correctOption: 'B',
    category: 'Quantitative Aptitude',
    topic: 'Average',
    difficulty: 'medium',
    explanation: 'Consecutive odd numbers centered at 27 are: 23, 25, 27, 29, 31. First = 23, Fifth = 31. Product = 23 * 31 = 713.',
    tags: ['averages', 'numbers'],
  },
  {
    question: 'Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. What is the smaller number?',
    options: [
      { key: 'A', text: '27' },
      { key: 'B', text: '33' },
      { key: 'C', text: '42' },
      { key: 'D', text: '55' },
    ],
    correctOption: 'B',
    category: 'Quantitative Aptitude',
    topic: 'Ratio and Proportion',
    difficulty: 'hard',
    explanation: 'Let numbers be 3x and 5x. (3x - 9) / (5x - 9) = 12 / 23. 23(3x - 9) = 12(5x - 9) -> 69x - 207 = 60x - 108 -> 9x = 99 -> x = 11. Smaller number = 3 * 11 = 33.',
    tags: ['ratios', 'algebra'],
  },
  {
    question: 'In how many different ways can the letters of the word "LEADING" be arranged such that the vowels always come together?',
    options: [
      { key: 'A', text: '360' },
      { key: 'B', text: '480' },
      { key: 'C', text: '720' },
      { key: 'D', text: '5040' },
    ],
    correctOption: 'C',
    category: 'Quantitative Aptitude',
    topic: 'Permutations and Combinations',
    difficulty: 'medium',
    explanation: 'Vowels: E, A, I (3 vowels). Consonants: L, D, N, G (4 consonants). Treat (EAI) as 1 unit. Total units = 5! = 120. Vowels rearrange among themselves in 3! = 6 ways. Total = 120 * 6 = 720.',
    tags: ['combinatorics'],
  },
  {
    question: 'A bag contains 6 black and 8 white balls. One ball is drawn at random. What is the probability that the ball drawn is white?',
    options: [
      { key: 'A', text: '3/7' },
      { key: 'B', text: '4/7' },
      { key: 'C', text: '1/8' },
      { key: 'D', text: '3/4' },
    ],
    correctOption: 'B',
    category: 'Quantitative Aptitude',
    topic: 'Probability',
    difficulty: 'easy',
    explanation: 'Total balls = 6 + 8 = 14. White balls = 8. P(White) = 8/14 = 4/7.',
    tags: ['probability'],
  },
  {
    question: 'Find the greatest number which divides 1305, 4665 and 6905 leaving the same remainder in each case.',
    options: [
      { key: 'A', text: '1120' },
      { key: 'B', text: '1130' },
      { key: 'C', text: '1140' },
      { key: 'D', text: '1150' },
    ],
    correctOption: 'A',
    category: 'Quantitative Aptitude',
    topic: 'Number Systems',
    difficulty: 'hard',
    explanation: 'Required number = HCF of |4665 - 1305|, |6905 - 4665|, |6905 - 1305| = HCF(3360, 2240, 5600) = 1120.',
    tags: ['hcf', 'lcm'],
  },
  {
    question: 'A sum of money invested at compound interest doubles itself in 4 years. In how many years will it become 8 times of itself at the same rate?',
    options: [
      { key: 'A', text: '8 years' },
      { key: 'B', text: '12 years' },
      { key: 'C', text: '16 years' },
      { key: 'D', text: '24 years' },
    ],
    correctOption: 'B',
    category: 'Quantitative Aptitude',
    topic: 'Compound Interest',
    difficulty: 'medium',
    explanation: 'If money becomes 2^1 in 4 years, it becomes 8 = 2^3 in 3 * 4 = 12 years.',
    tags: ['interest', 'compound'],
  },
  {
    question: 'A boat can travel with a speed of 13 km/hr in still water. If the speed of the stream is 4 km/hr, find the time taken by the boat to go 68 km downstream.',
    options: [
      { key: 'A', text: '2 hours' },
      { key: 'B', text: '3 hours' },
      { key: 'C', text: '4 hours' },
      { key: 'D', text: '5 hours' },
    ],
    correctOption: 'C',
    category: 'Quantitative Aptitude',
    topic: 'Boats and Streams',
    difficulty: 'easy',
    explanation: 'Downstream speed = 13 + 4 = 17 km/hr. Time = Distance / Speed = 68 / 17 = 4 hours.',
    tags: ['boats', 'speed'],
  },

  // ── Logical Reasoning ──
  {
    question: 'Pointing to a photograph of a boy, Suresh said, "He is the son of the only son of my mother." How is Suresh related to that boy?',
    options: [
      { key: 'A', text: 'Brother' },
      { key: 'B', text: 'Uncle' },
      { key: 'C', text: 'Father' },
      { key: 'D', text: 'Grandfather' },
    ],
    correctOption: 'C',
    category: 'Logical Reasoning',
    topic: 'Blood Relations',
    difficulty: 'easy',
    explanation: 'Only son of Suresh\'s mother is Suresh himself. So the boy is Suresh\'s son, which makes Suresh his father.',
    tags: ['blood-relations'],
  },
  {
    question: 'In a certain code, "COMPUTER" is written as "RFUVQNPC". How is "MEDICINE" written in that code?',
    options: [
      { key: 'A', text: 'EOJDJEFM' },
      { key: 'B', text: 'EOJDEJFM' },
      { key: 'C', text: 'MFEJDJOE' },
      { key: 'D', text: 'MFEDJJOE' },
    ],
    correctOption: 'A',
    category: 'Logical Reasoning',
    topic: 'Coding-Decoding',
    difficulty: 'medium',
    explanation: 'Reverse the word and add +1 to intermediate letters while keeping first and last swapped. MEDICINE -> reverse is ENICIDEM. First and last E...M. Intermediate letters +1: N->O, I->J, C->D, I->J, D->E. Result = EOJDJEFM.',
    tags: ['coding-decoding'],
  },
  {
    question: 'Statements: Some actors are singers. All singers are dancers.\nConclusions: I. Some actors are dancers. II. No singer is actor.',
    options: [
      { key: 'A', text: 'Only conclusion I follows' },
      { key: 'B', text: 'Only conclusion II follows' },
      { key: 'C', text: 'Either I or II follows' },
      { key: 'D', text: 'Neither I nor II follows' },
    ],
    correctOption: 'A',
    category: 'Logical Reasoning',
    topic: 'Syllogisms',
    difficulty: 'medium',
    explanation: 'Some actors are singers (I) and All singers are dancers (A). I + A -> Some actors are dancers (Conclusion I is valid). Conclusion II contradicts statement 1.',
    tags: ['syllogism'],
  },
  {
    question: 'Find the missing number in the series: 4, 9, 25, 49, ?, 169, 289',
    options: [
      { key: 'A', text: '81' },
      { key: 'B', text: '100' },
      { key: 'C', text: '121' },
      { key: 'D', text: '144' },
    ],
    correctOption: 'C',
    category: 'Logical Reasoning',
    topic: 'Number Series',
    difficulty: 'medium',
    explanation: 'The terms are squares of consecutive prime numbers: 2^2=4, 3^2=9, 5^2=25, 7^2=49, 11^2=121, 13^2=169, 17^2=289.',
    tags: ['series', 'primes'],
  },
  {
    question: 'A person walks 10 km towards North. From there he walks 6 km South. Then, he walks 3 km East. How far and in what direction is he with reference to his starting point?',
    options: [
      { key: 'A', text: '5 km West' },
      { key: 'B', text: '5 km North-East' },
      { key: 'C', text: '7 km East' },
      { key: 'D', text: '7 km North' },
    ],
    correctOption: 'B',
    category: 'Logical Reasoning',
    topic: 'Directions',
    difficulty: 'easy',
    explanation: 'Net displacement in North-South = 10 - 6 = 4 km North. East displacement = 3 km East. Distance = sqrt(4^2 + 3^2) = 5 km in North-East direction.',
    tags: ['directions'],
  },
  {
    question: 'Six friends A, B, C, D, E and F are sitting in a circle facing the center. E is to the left of D. C is between A and B. F is between E and A. Who is to the immediate right of F?',
    options: [
      { key: 'A', text: 'D' },
      { key: 'B', text: 'E' },
      { key: 'C', text: 'A' },
      { key: 'D', text: 'C' },
    ],
    correctOption: 'B',
    category: 'Logical Reasoning',
    topic: 'Seating Arrangement',
    difficulty: 'hard',
    explanation: 'Arranging clockwise: D, E, F, A, C, B. Facing center, the person to the immediate right of F is E.',
    tags: ['arrangements'],
  },
  {
    question: 'If South-East becomes North, North-East becomes West and so on. What will West become?',
    options: [
      { key: 'A', text: 'North-East' },
      { key: 'B', text: 'North-West' },
      { key: 'C', text: 'South-East' },
      { key: 'D', text: 'South-West' },
    ],
    correctOption: 'C',
    category: 'Logical Reasoning',
    topic: 'Directions',
    difficulty: 'medium',
    explanation: 'South-East is 135 degrees clockwise from North. Rotating by 135 degrees anti-clockwise turns West into South-East.',
    tags: ['directions'],
  },
  {
    question: 'Which of the following diagrams indicates the best relation between Travelers, Train and Bus?',
    options: [
      { key: 'A', text: 'Two disjoint circles inside a large circle' },
      { key: 'B', text: 'A circle intersecting two other disjoint circles' },
      { key: 'C', text: 'Three concentric circles' },
      { key: 'D', text: 'Three mutually intersecting circles' },
    ],
    correctOption: 'B',
    category: 'Logical Reasoning',
    topic: 'Venn Diagrams',
    difficulty: 'easy',
    explanation: 'Some travelers travel by train, some by bus, and some by other means. Train and bus are separate modes of travel.',
    tags: ['venn-diagram'],
  },

  // ── Verbal Ability ──
  {
    question: 'Choose the word that is most nearly opposite in meaning (Antonym) to "TRANSIENT".',
    options: [
      { key: 'A', text: 'Ephemeral' },
      { key: 'B', text: 'Permanent' },
      { key: 'C', text: 'Fleeting' },
      { key: 'D', text: 'Brief' },
    ],
    correctOption: 'B',
    category: 'Verbal Ability',
    topic: 'Vocabulary',
    difficulty: 'easy',
    explanation: 'Transient means lasting only for a short time. Its opposite is Permanent.',
    tags: ['vocabulary', 'antonyms'],
  },
  {
    question: 'Identify the segment containing a grammatical error: "Neither the supervisor nor the workers (A) / was present (B) / at the assembly line (C) / during the inspection (D)."',
    options: [
      { key: 'A', text: 'Part A' },
      { key: 'B', text: 'Part B' },
      { key: 'C', text: 'Part C' },
      { key: 'D', text: 'No error' },
    ],
    correctOption: 'B',
    category: 'Verbal Ability',
    topic: 'Sentence Correction',
    difficulty: 'medium',
    explanation: 'When two subjects are joined by "neither... nor", the verb agrees with the subject closer to it. "workers" is plural, so it should be "were present".',
    tags: ['grammar', 'subject-verb'],
  },
  {
    question: 'Fill in the blank: "The committee could not reach a decision because the members held ________ opinions on the proposal."',
    options: [
      { key: 'A', text: 'divergent' },
      { key: 'B', text: 'indifferent' },
      { key: 'C', text: 'unanimous' },
      { key: 'D', text: 'congruent' },
    ],
    correctOption: 'A',
    category: 'Verbal Ability',
    topic: 'Sentence Completion',
    difficulty: 'easy',
    explanation: '"Divergent" means tending to be different or develop in different directions, explaining why a decision was not reached.',
    tags: ['fillers', 'vocabulary'],
  },
  {
    question: 'Select the synonym for the word "PRAGMATIC":',
    options: [
      { key: 'A', text: 'Idealistic' },
      { key: 'B', text: 'Practical' },
      { key: 'C', text: 'Theoretical' },
      { key: 'D', text: 'Abstract' },
    ],
    correctOption: 'B',
    category: 'Verbal Ability',
    topic: 'Vocabulary',
    difficulty: 'easy',
    explanation: 'Pragmatic means dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
    tags: ['synonyms'],
  },
  {
    question: 'Rearrange the sentences into a coherent paragraph:\nP: In addition to these technical skills,\nQ: Modern software engineering requires disciplined problem-solving.\nR: Engineers must cultivate strong teamwork and communication.\nS: Writing clean code is just the baseline expectation.',
    options: [
      { key: 'A', text: 'QSPR' },
      { key: 'B', text: 'SQPR' },
      { key: 'C', text: 'QSRP' },
      { key: 'D', text: 'PSQR' },
    ],
    correctOption: 'A',
    category: 'Verbal Ability',
    topic: 'Para Jumbles',
    difficulty: 'hard',
    explanation: 'Q introduces the overall theme. S elaborates on the technical baseline. P links the technical skills to non-technical ones, and R finishes with teamwork.',
    tags: ['parajumbles'],
  },
];

const CODING_SEED = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: 'easy',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Hash Table'],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    inputFormat: 'Line 1: Comma-separated integers representing nums\nLine 2: Integer target',
    outputFormat: 'Comma-separated indices e.g. "0,1"',
    examples: [
      { input: '2,7,11,15\n9', output: '0,1', explanation: 'Because nums[0] + nums[1] == 9, we return 0,1.' },
      { input: '3,2,4\n6', output: '1,2', explanation: 'nums[1] + nums[2] == 6.' },
    ],
    testCases: [
      { input: '2,7,11,15\n9', expectedOutput: '0,1', isHidden: false },
      { input: '3,2,4\n6', expectedOutput: '1,2', isHidden: false },
      { input: '3,3\n6', expectedOutput: '0,1', isHidden: true },
      { input: '-1,-2,-3,-4,-5\n-8', expectedOutput: '2,4', isHidden: true },
    ],
    companies: ['Amazon', 'TCS', 'Infosys'],
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      python: 'def twoSum(nums, target):\n    lookup = {}\n    for i, n in enumerate(nums):\n        if target - n in lookup:\n            return [lookup[target - n], i]\n        lookup[n] = i\n    return []',
      java: 'import java.util.*;\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (map.containsKey(comp)) return new int[] { map.get(comp), i };\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}',
      cpp: '#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> m;\n    for (int i = 0; i < nums.size(); i++) {\n        if (m.count(target - nums[i])) return {m[target - nums[i]], i};\n        m[nums[i]] = i;\n    }\n    return {};\n}',
    },
  },
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    difficulty: 'easy',
    category: 'Two Pointers & Strings',
    topics: ['Two Pointers', 'String'],
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
    inputFormat: 'A single line string s',
    outputFormat: '"true" or "false"',
    examples: [
      { input: 'A man, a plan, a canal: Panama', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 'race a car', output: 'false', explanation: '"raceacar" is not a palindrome.' },
    ],
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
      { input: 'race a car', expectedOutput: 'false', isHidden: false },
      { input: ' ', expectedOutput: 'true', isHidden: true },
    ],
    companies: ['Wipro', 'Cognizant', 'TCS'],
    starterCode: {
      javascript: 'function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
      python: 'def isPalindrome(s: str) -> bool:\n    clean = "".join(c.lower() for c in s if c.isalnum())\n    return clean == clean[::-1]',
      java: 'class Solution {\n    public boolean isPalindrome(String s) {\n        s = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();\n        int l = 0, r = s.length() - 1;\n        while (l < r) {\n            if (s.charAt(l++) != s.charAt(r--)) return false;\n        }\n        return true;\n    }\n}',
      cpp: '#include <string>\n#include <cctype>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    int l = 0, r = s.size() - 1;\n    while (l < r) {\n        while (l < r && !isalnum(s[l])) l++;\n        while (l < r && !isalnum(s[r])) r--;\n        if (tolower(s[l++]) != tolower(s[r--])) return false;\n    }\n    return true;\n}',
    },
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets in the correct order.',
    difficulty: 'easy',
    category: 'Stack',
    topics: ['Stack', 'String'],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only `()[]{}`.'],
    inputFormat: 'A string of bracket characters',
    outputFormat: '"true" or "false"',
    examples: [
      { input: '()[]{}', output: 'true', explanation: 'All pairs open and close cleanly.' },
      { input: '(]', output: 'false', explanation: 'Mismatched closing bracket.' },
    ],
    testCases: [
      { input: '()[]{}', expectedOutput: 'true', isHidden: false },
      { input: '(]', expectedOutput: 'false', isHidden: false },
      { input: '([{}])', expectedOutput: 'true', isHidden: true },
      { input: '((((', expectedOutput: 'false', isHidden: true },
    ],
    companies: ['Amazon', 'Accenture', 'Infosys'],
    starterCode: {
      javascript: 'function isValid(s) {\n  const stack = [];\n  const map = { ")": "(", "}": "{", "]": "[" };\n  for (const ch of s) {\n    if (map[ch]) {\n      if (stack.pop() !== map[ch]) return false;\n    } else {\n      stack.push(ch);\n    }\n  }\n  return stack.length === 0;\n}',
      python: 'def isValid(s: str) -> bool:\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else "#"\n            if mapping[char] != top: return False\n        else:\n            stack.append(char)\n    return not stack',
      java: 'import java.util.*;\nclass Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == \'(\') stack.push(\')\');\n            else if (c == \'{\') stack.push(\'}\');\n            else if (c == \'[\') stack.push(\']\');\n            else if (stack.isEmpty() || stack.pop() != c) return false;\n        }\n        return stack.isEmpty();\n    }\n}',
      cpp: '#include <string>\n#include <stack>\nusing namespace std;\n\nbool isValid(string s) {\n    stack<char> st;\n    for (char c : s) {\n        if (c == \'(\' || c == \'{\' || c == \'[\') st.push(c);\n        else {\n            if (st.empty()) return false;\n            if (c == \')\' && st.top() != \'(\') return false;\n            if (c == \'}\' && st.top() != \'{\') return false;\n            if (c == \']\' && st.top() != \'[\') return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}',
    },
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    description: 'Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum (Kadane\'s Algorithm).',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    topics: ['Array', 'Dynamic Programming'],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    inputFormat: 'Comma-separated list of integers',
    outputFormat: 'Single integer representing maximum contiguous sum',
    examples: [
      { input: '-2,1,-3,4,-1,2,1,-5,4', output: '6', explanation: '[4,-1,2,1] has the largest sum = 6.' },
      { input: '1', output: '1', explanation: 'Single element is the largest subarray.' },
    ],
    testCases: [
      { input: '-2,1,-3,4,-1,2,1,-5,4', expectedOutput: '6', isHidden: false },
      { input: '5,4,-1,7,8', expectedOutput: '23', isHidden: false },
      { input: '-1', expectedOutput: '-1', isHidden: true },
    ],
    companies: ['Amazon', 'Infosys', 'TCS'],
  },
  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    description: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
    difficulty: 'easy',
    category: 'Linked List',
    topics: ['Linked List', 'Recursion'],
    constraints: ['The number of nodes in the list is the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    inputFormat: 'Comma-separated values e.g. 1,2,3,4,5',
    outputFormat: 'Comma-separated values of reversed list e.g. 5,4,3,2,1',
    examples: [
      { input: '1,2,3,4,5', output: '5,4,3,2,1', explanation: 'List reversed completely.' },
    ],
    testCases: [
      { input: '1,2,3,4,5', expectedOutput: '5,4,3,2,1', isHidden: false },
      { input: '1,2', expectedOutput: '2,1', isHidden: false },
      { input: '42', expectedOutput: '42', isHidden: true },
    ],
    companies: ['Amazon', 'Wipro', 'TCS'],
  },
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    description: 'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.',
    difficulty: 'easy',
    category: 'Math & Strings',
    topics: ['Math'],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    inputFormat: 'Single integer x',
    outputFormat: '"true" or "false"',
    examples: [{ input: '121', output: 'true', explanation: '121 reads 121 from left to right.' }],
    testCases: [
      { input: '121', expectedOutput: 'true', isHidden: false },
      { input: '-121', expectedOutput: 'false', isHidden: false },
      { input: '10', expectedOutput: 'false', isHidden: true },
    ],
    companies: ['TCS', 'Infosys'],
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    description: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return -1.',
    difficulty: 'easy',
    category: 'Searching',
    topics: ['Array', 'Binary Search'],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4'],
    inputFormat: 'Line 1: Sorted comma-separated integers\nLine 2: Target integer',
    outputFormat: 'Index integer or -1',
    examples: [{ input: '-1,0,3,5,9,12\n9', output: '4', explanation: '9 exists in nums and its index is 4.' }],
    testCases: [
      { input: '-1,0,3,5,9,12\n9', expectedOutput: '4', isHidden: false },
      { input: '-1,0,3,5,9,12\n2', expectedOutput: '-1', isHidden: false },
      { input: '5\n5', expectedOutput: '0', isHidden: true },
    ],
    companies: ['Cognizant', 'Amazon', 'Wipro'],
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    description: 'You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
    difficulty: 'easy',
    category: 'Arrays & Greedy',
    topics: ['Array', 'Dynamic Programming'],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    inputFormat: 'Comma-separated prices e.g. 7,1,5,3,6,4',
    outputFormat: 'Max profit integer',
    examples: [{ input: '7,1,5,3,6,4', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 5.' }],
    testCases: [
      { input: '7,1,5,3,6,4', expectedOutput: '5', isHidden: false },
      { input: '7,6,4,3,1', expectedOutput: '0', isHidden: false },
      { input: '2,4,1', expectedOutput: '2', isHidden: true },
    ],
    companies: ['Amazon', 'Infosys'],
  },
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    description: 'Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.',
    difficulty: 'easy',
    category: 'Arrays & Hashing',
    topics: ['Array', 'Hash Table'],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    inputFormat: 'Comma-separated integers',
    outputFormat: '"true" or "false"',
    examples: [{ input: '1,2,3,1', output: 'true', explanation: '1 appears twice.' }],
    testCases: [
      { input: '1,2,3,1', expectedOutput: 'true', isHidden: false },
      { input: '1,2,3,4', expectedOutput: 'false', isHidden: false },
      { input: '1,1,1,3,3,4,3,2,4,2', expectedOutput: 'true', isHidden: true },
    ],
    companies: ['TCS', 'Accenture'],
  },
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    description: 'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.',
    difficulty: 'easy',
    category: 'Strings & Hashing',
    topics: ['Hash Table', 'String', 'Sorting'],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4'],
    inputFormat: 'Line 1: string s\nLine 2: string t',
    outputFormat: '"true" or "false"',
    examples: [{ input: 'anagram\nnagaram', output: 'true', explanation: 'nagaram is an anagram of anagram.' }],
    testCases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true', isHidden: false },
      { input: 'rat\ncar', expectedOutput: 'false', isHidden: false },
    ],
    companies: ['Amazon', 'Infosys'],
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    description: 'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    difficulty: 'easy',
    category: 'Dynamic Programming',
    topics: ['Math', 'Dynamic Programming', 'Memoization'],
    constraints: ['1 <= n <= 45'],
    inputFormat: 'Integer n',
    outputFormat: 'Integer ways',
    examples: [{ input: '3', output: '3', explanation: '1+1+1, 1+2, 2+1' }],
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false },
      { input: '3', expectedOutput: '3', isHidden: false },
      { input: '5', expectedOutput: '8', isHidden: true },
    ],
    companies: ['Amazon', 'Wipro'],
  },
  {
    title: 'Move Zeroes',
    slug: 'move-zeroes',
    description: 'Given an integer array `nums`, move all 0\'s to the end of it while maintaining the relative order of the non-zero elements in-place.',
    difficulty: 'easy',
    category: 'Two Pointers',
    topics: ['Array', 'Two Pointers'],
    constraints: ['1 <= nums.length <= 10^4', '-2^31 <= nums[i] <= 2^31 - 1'],
    inputFormat: 'Comma-separated integers',
    outputFormat: 'Comma-separated integers with zeroes moved to end',
    examples: [{ input: '0,1,0,3,12', output: '1,3,12,0,0', explanation: 'All zeroes shifted right.' }],
    testCases: [
      { input: '0,1,0,3,12', expectedOutput: '1,3,12,0,0', isHidden: false },
      { input: '0', expectedOutput: '0', isHidden: false },
    ],
    companies: ['TCS', 'Cognizant'],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    description: 'Given a string `s`, find the length of the longest substring without duplicate characters.',
    difficulty: 'medium',
    category: 'Sliding Window',
    topics: ['Hash Table', 'String', 'Sliding Window'],
    constraints: ['0 <= s.length <= 5 * 10^4'],
    inputFormat: 'A string s',
    outputFormat: 'Integer length',
    examples: [{ input: 'abcabcbb', output: '3', explanation: 'The answer is "abc", with the length of 3.' }],
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
      { input: 'bbbbb', expectedOutput: '1', isHidden: false },
      { input: 'pwwkew', expectedOutput: '3', isHidden: true },
    ],
    companies: ['Amazon', 'Infosys'],
  },
  {
    title: 'Merge Sorted Array',
    slug: 'merge-sorted-array',
    description: 'You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order. Merge `nums1` and `nums2` into a single array sorted in non-decreasing order.',
    difficulty: 'easy',
    category: 'Two Pointers & Arrays',
    topics: ['Array', 'Two Pointers', 'Sorting'],
    constraints: ['nums1.length == m + n', 'nums2.length == n'],
    inputFormat: 'Line 1: nums1\nLine 2: nums2',
    outputFormat: 'Merged comma-separated integers',
    examples: [{ input: '1,2,3\n2,5,6', output: '1,2,2,3,5,6', explanation: 'Merged sorted array.' }],
    testCases: [
      { input: '1,2,3\n2,5,6', expectedOutput: '1,2,2,3,5,6', isHidden: false },
      { input: '1\n', expectedOutput: '1', isHidden: true },
    ],
    companies: ['TCS', 'Amazon'],
  },
];

const COMPANY_SEED = [
  {
    name: 'Tata Consultancy Services',
    slug: 'tcs',
    logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=200&q=80',
    description: 'Global leader in IT services, consulting, and business solutions with widespread presence across 46 countries.',
    industry: 'IT Services & Consulting',
    website: 'https://www.tcs.com',
    careersUrl: 'https://www.tcs.com/careers',
    roles: ['Ninja Software Engineer', 'Digital Specialist Engineer', 'Prime Architect Track'],
    eligibility: 'B.Tech / B.E / M.Tech / MCA with minimum 60% or 6.0 CGPA throughout 10th, 12th, and Degree.',
    selectionProcess: [
      'TCS NQT (Cognitive Aptitude + Advanced Coding)',
      'Technical Interview (OOPs, DBMS, Core Language)',
      'Managerial Round',
      'HR Evaluation',
    ],
    aptitudeTopics: ['Speed, Time & Distance', 'Percentages', 'Syllogisms', 'Coding-Decoding', 'Data Interpretation'],
    codingTopics: ['Arrays', 'Strings', 'Mathematical Algorithms', 'Hashing'],
    interviewTopics: ['SQL Queries', 'OOP Concepts (Polymorphism, Inheritance)', 'Data Structures Basics'],
  },
  {
    name: 'Infosys',
    slug: 'infosys',
    logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    description: 'A global leader in next-generation digital services and consulting, enabling clients in more than 50 countries to navigate digital transformation.',
    industry: 'Information Technology',
    website: 'https://www.infosys.com',
    careersUrl: 'https://www.infosys.com/careers.html',
    roles: ['Systems Engineer', 'Specialist Programmer (Power Programmer)', 'Digital Specialist Engineer'],
    eligibility: 'B.E. / B.Tech / M.E. / M.Tech / MCA / M.Sc with 65%+ or 6.5+ CGPA and no active backlogs.',
    selectionProcess: [
      'Online Assessment (Reasoning, Mathematical, Verbal & Pseudocode)',
      'HackWithInfy / InfyTQ (Specialist Programmer Track)',
      'Technical Interview',
      'HR Interview',
    ],
    aptitudeTopics: ['Cryptarithmetic', 'Number Series', 'Permutations & Combinations', 'Data Sufficiency'],
    codingTopics: ['Greedy Algorithms', 'Dynamic Programming Basics', 'Recursion', 'Bit Manipulation'],
    interviewTopics: ['Project Architecture', 'Relational Databases vs NoSQL', 'SDLC Models'],
  },
  {
    name: 'Amazon',
    slug: 'amazon',
    logoUrl: 'https://images.unsplash.com/photo-1523474255658-4af61b168344?auto=format&fit=crop&w=200&q=80',
    description: 'Pioneering technology multinational focused on e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.',
    industry: 'Big Tech & Cloud Computing',
    website: 'https://www.amazon.jobs',
    careersUrl: 'https://www.amazon.jobs',
    roles: ['Software Development Engineer I (SDE-1)', 'Cloud Support Associate', 'Quality Assurance Engineer'],
    eligibility: 'Bachelor\'s or Master\'s degree in Computer Science or related STEM disciplines.',
    selectionProcess: [
      'Online Assessment 1: Debugging + Coding (2 problems)',
      'Online Assessment 2: Work Simulation & Leadership Principles',
      'Virtual Onsite Technical Interviews (3-4 Rounds focusing on Algorithms & Problem Solving)',
      'Bar Raiser Interview',
    ],
    aptitudeTopics: ['Logical Deductions', 'Work Style Assessment', 'Situational Judgment'],
    codingTopics: ['Trees and Graphs (BFS/DFS)', 'Dynamic Programming', 'Heap / Priority Queue', 'Two Pointers'],
    interviewTopics: ['Amazon 16 Leadership Principles', 'Low Level Object Oriented Design', 'Time & Space Complexity Proofs'],
  },
];

const RESOURCE_SEED = [
  {
    title: 'Complete Quantitative Aptitude Formula Cheat Sheet',
    description: 'Essential shortcuts and formulas for Speed, Time, Work, Percentages, and Profit-Loss tailored for campus recruitment assessments.',
    type: 'pdf',
    category: 'Quantitative Aptitude',
    topic: 'Formulas & Shortcuts',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Top 50 Data Structures & Algorithms Patterns',
    description: 'Master Sliding Window, Two Pointers, Fast & Slow Pointers, and BFS/DFS traversal templates with time complexity breakdown.',
    type: 'article',
    category: 'Coding Preparation',
    topic: 'DSA Patterns',
    url: 'https://en.wikipedia.org/wiki/Algorithm',
  },
  {
    title: 'Object-Oriented Programming (OOP) Core Interview Guide',
    description: 'Clear explanations of Encapsulation, Inheritance, Polymorphism, Abstraction, with code examples in C++, Java, and Python.',
    type: 'note',
    category: 'Core Computer Science',
    topic: 'OOP Concepts',
    url: 'https://en.wikipedia.org/wiki/Object-oriented_programming',
  },
  {
    title: 'Database Management Systems (DBMS) & SQL Interview Cheatsheet',
    description: 'ACID properties, Normalization (1NF to BCNF), indexing mechanisms (B+ Trees), and standard multi-table JOIN queries.',
    type: 'note',
    category: 'Core Computer Science',
    topic: 'DBMS & SQL',
    url: 'https://en.wikipedia.org/wiki/Relational_database',
  },
];

export const seedDevelopmentContent = async () => {
  try {
    await connectDB();
    console.log('== SEEDING DEVELOPMENT EDUCATIONAL CONTENT ==\n');

    const adminUser = await User.findOne({ role: 'admin' });
    const adminId = adminUser ? adminUser._id : null;

    // 1. Seed Aptitude Questions
    let aptCount = 0;
    for (const q of APTITUDE_SEED) {
      const exists = await AptitudeQuestion.findOne({ question: q.question });
      if (!exists) {
        await AptitudeQuestion.create({
          ...q,
          createdBy: adminId,
          isActive: true,
        });
        aptCount++;
      }
    }
    console.log(`✓ Aptitude questions seeded: ${aptCount} new questions added.`);

    // 2. Seed Coding Problems
    let codeCount = 0;
    for (const p of CODING_SEED) {
      const exists = await CodingProblem.findOne({ slug: p.slug });
      if (!exists) {
        await CodingProblem.create({
          ...p,
          createdBy: adminId,
          isActive: true,
        });
        codeCount++;
      }
    }
    console.log(`✓ Coding problems seeded: ${codeCount} new problems added.`);

    // 3. Seed Companies
    let compCount = 0;
    for (const c of COMPANY_SEED) {
      const exists = await Company.findOne({ slug: c.slug });
      if (!exists) {
        await Company.create({
          ...c,
          createdBy: adminId,
          isActive: true,
        });
        compCount++;
      }
    }
    console.log(`✓ Companies seeded: ${compCount} new companies added.`);

    // 4. Seed Resources
    let resCount = 0;
    for (const r of RESOURCE_SEED) {
      const exists = await StudyMaterial.findOne({ title: r.title });
      if (!exists) {
        await StudyMaterial.create({
          ...r,
          uploadedBy: adminId,
          isActive: true,
        });
        resCount++;
      }
    }
    console.log(`✓ Study resources seeded: ${resCount} new resources added.`);

    // 5. Seed Mock Test
    const allApt = await AptitudeQuestion.find({ isActive: true }).limit(5);
    if (allApt.length >= 3) {
      const mockTitle = 'Comprehensive Placement Readiness Assessment 2026';
      const mockExists = await MockTest.findOne({ title: mockTitle });
      if (!mockExists) {
        await MockTest.create({
          title: mockTitle,
          description: 'Standard campus placement simulator evaluating Quantitative Aptitude, Logical Reasoning, and Verbal Comprehension.',
          durationMinutes: 20,
          categories: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'],
          difficulty: 'medium',
          instructions: 'Each question carries 1 mark. There is no negative marking. Auto-submits when time expires.',
          questions: allApt.map((q) => ({
            questionType: 'aptitude',
            questionId: q._id,
            questionTypeRef: 'AptitudeQuestion',
            marks: 1,
          })),
          totalQuestions: allApt.length,
          isPublished: true,
          createdBy: adminId,
        });
        console.log('✓ Curated Mock Test seeded successfully.');
      }
    }

    console.log('\n🎉 ALL DEVELOPMENT EDUCATIONAL CONTENT INITIALIZED CLEANLY!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during seed:', err);
    process.exit(1);
  }
};

// If run directly
if (process.argv[1].endsWith('seedDevContent.js')) {
  seedDevelopmentContent();
}
