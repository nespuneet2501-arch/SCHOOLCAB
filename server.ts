import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { AppState, StudentApplication, SystemConfig, Cabinet, Post, EvaluationCriterion, AchievementMatrixItem, EmailLog, RegisteredStudent } from "./src/types.js";

dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Setup JSON body parsing with high limit for photos / certificates
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setup Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const DB_FILE_PATH = path.join(process.cwd(), "db-store.json");

// Default initial config
const DEFAULT_CONFIG: SystemConfig = {
  branding: {
    name: "GD Goenka Public School",
    tagline: "Higher Stronger Brighter • School Leadership Cabinet",
    logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-16 h-16"><circle cx="50" cy="50" r="45" fill="#0f172a" stroke="#fbbf24" stroke-width="3"/><path d="M50 15 L20 35 L20 45 L50 30 L80 45 L80 35 Z" fill="#fbbf24"/><path d="M30 46 L30 70 C30 80 50 85 50 85 C50 85 70 80 70 70 L70 46 L50 58 Z" fill="#e2e8f0" stroke="#fbbf24" stroke-width="1.5"/><circle cx="50" cy="45" r="8" fill="#fbbf24"/><path d="M50 15 L50 30" stroke="#fbbf24" stroke-width="2"/></svg>`,
    primaryColor: "#0f172a", // Slate 900
    secondaryColor: "#fbbf24", // Amber 400
    academicSession: "2026-2027"
  },
  applicationDeadline: "2026-08-31",
  cabinets: [
    { id: "junior", name: "Junior Cabinet", classRangeStart: 1, classRangeEnd: 5, enabled: true },
    { id: "senior", name: "Senior Cabinet", classRangeStart: 6, classRangeEnd: 11, enabled: true }
  ],
  posts: [
    // Student Council
    { id: "head-boy", cabinetId: "senior", title: "Head Boy", vacancies: 1, genderRule: "boy", eligibleClasses: [11], enabled: true },
    { id: "head-girl", cabinetId: "senior", title: "Head Girl", vacancies: 1, genderRule: "girl", eligibleClasses: [11], enabled: true },
    { id: "vice-head-boy", cabinetId: "senior", title: "School Vice Head Boy", vacancies: 1, genderRule: "boy", eligibleClasses: [11], enabled: true },
    { id: "vice-head-girl", cabinetId: "senior", title: "School Vice Head Girl", vacancies: 1, genderRule: "girl", eligibleClasses: [11], enabled: true },
    { id: "president-council", cabinetId: "senior", title: "President (Student Council)", vacancies: 1, genderRule: "any", eligibleClasses: [10, 11], enabled: true },
    { id: "vice-president-council", cabinetId: "senior", title: "Vice President (Student Council)", vacancies: 1, genderRule: "any", eligibleClasses: [9, 10], enabled: true },
    
    // Cultural
    { id: "president-cultural", cabinetId: "senior", title: "President (Cultural)", vacancies: 1, genderRule: "any", eligibleClasses: [10, 11], enabled: true },
    { id: "vice-president-cultural", cabinetId: "senior", title: "Vice President (Cultural)", vacancies: 1, genderRule: "any", eligibleClasses: [8, 9, 10], enabled: true },
    
    // Press & Editorial
    { id: "president-press", cabinetId: "senior", title: "President (Press)", vacancies: 1, genderRule: "any", eligibleClasses: [10, 11], enabled: true },
    
    // Sports
    { id: "sports-captain-boy", cabinetId: "senior", title: "Sports Captain (Boy)", vacancies: 1, genderRule: "boy", eligibleClasses: [10, 11], enabled: true },
    { id: "sports-captain-girl", cabinetId: "senior", title: "Sports Captain (Girl)", vacancies: 1, genderRule: "girl", eligibleClasses: [10, 11], enabled: true },
    
    // Discipline & House leadership
    { id: "school-marshal-senior-boy", cabinetId: "senior", title: "School Marshal (Senior - Boy)", vacancies: 2, genderRule: "boy", eligibleClasses: [10, 11], enabled: true },
    { id: "school-marshal-senior-girl", cabinetId: "senior", title: "School Marshal (Senior - Girl)", vacancies: 2, genderRule: "girl", eligibleClasses: [10, 11], enabled: true },
    { id: "discipline-captain", cabinetId: "senior", title: "Discipline Captain", vacancies: 1, genderRule: "any", eligibleClasses: [9, 10, 11], enabled: true },
    { id: "technology-captain", cabinetId: "senior", title: "Technology Captain", vacancies: 1, genderRule: "any", eligibleClasses: [9, 10, 11], enabled: true },
    { id: "environment-captain", cabinetId: "senior", title: "Environment Captain", vacancies: 1, genderRule: "any", eligibleClasses: [8, 9, 10, 11], enabled: true },
    { id: "wellness-captain", cabinetId: "senior", title: "Health & Wellness Captain", vacancies: 1, genderRule: "any", eligibleClasses: [8, 9, 10, 11], enabled: true },
    
    // Junior Posts
    { id: "junior-head-boy", cabinetId: "junior", title: "Junior Head Boy", vacancies: 1, genderRule: "boy", eligibleClasses: [5], enabled: true },
    { id: "junior-head-girl", cabinetId: "junior", title: "Junior Head Girl", vacancies: 1, genderRule: "girl", eligibleClasses: [5], enabled: true },
    { id: "junior-sports-captain", cabinetId: "junior", title: "Junior Sports Captain", vacancies: 2, genderRule: "any", eligibleClasses: [4, 5], enabled: true }
  ],
  criteria: [
    { id: "achievement", name: "Achievements Portfolio", maxMarks: 10, enabled: true, description: "Evaluated based on highest certified level (National, State, District, School)" },
    { id: "interview", name: "Interview Assessment", maxMarks: 10, enabled: true, description: "Judged by the school panel for poise, alignment, values, and leadership potential" },
    { id: "attendance", name: "Attendance Consistency", maxMarks: 10, enabled: true, description: "Calculated based on 3-year average attendance percentage" },
    { id: "academics", name: "Academic Grade Performance", maxMarks: 10, enabled: true, description: "Scores derived from recent term grade averages" },
    { id: "years", name: "Years of School Study", maxMarks: 10, enabled: true, description: "Points earned for longevity: 1 point per year studied up to 10 points" },
    { id: "discipline", name: "Discipline & Behavior", maxMarks: 10, enabled: true, description: "Evaluated by school coordinators for conduct, behavior, obedience, and observance of dress code" }
  ],
  achievementMatrix: [
    { level: "School", rank: "Gold", marks: 3 },
    { level: "School", rank: "Silver", marks: 2 },
    { level: "School", rank: "Bronze", marks: 1 },
    { level: "District", rank: "Gold", marks: 5 },
    { level: "District", rank: "Silver", marks: 4 },
    { level: "District", rank: "Bronze", marks: 3 },
    { level: "State", rank: "Gold", marks: 7 },
    { level: "State", rank: "Silver", marks: 5 },
    { level: "State", rank: "Bronze", marks: 3 },
    { level: "National", rank: "Gold", marks: 10 },
    { level: "National", rank: "Silver", marks: 8 },
    { level: "National", rank: "Bronze", marks: 6 }
  ]
};

// Generates beautiful realistic mock candidate applications
function generateMockApplications(): StudentApplication[] {
  const mockStudents: Array<Partial<StudentApplication>> = [
    {
      id: "app-001",
      name: "Aarav Goel",
      admissionNumber: "GDG-2015-8822",
      class: 11,
      section: "A",
      rollNumber: "14",
      gender: "Boy",
      dob: "2010-04-12",
      admissionDate: "2015-04-10", // 11 years (current 2026)
      house: "Radhakrishnan",
      mobile: "9876543210",
      parentName: "Sanjay Goel",
      parentMobile: "9876543211",
      email: "aarav.goel@example.com",
      leadershipExperience: "Served as Vice Captain for Hockey Club in Class X. Core volunteer in organizing the Annual Sports Day. Lead actor in Inter-house dramatics.",
      achievements: [
        { level: "National", rank: "Silver", title: "National Inter-School Athletics Meet Under-16 High Jump", year: "2025" },
        { level: "District", rank: "Gold", title: "District Badminton Championship Boys Doubles", year: "2024" }
      ],
      firstChoicePostId: "head-boy",
      secondChoicePostId: "sports-captain-boy",
      sop: "As a student of GD Goenka since Prep, I have grown to cherish our motto. I wish to give back by leading our student council with integrity, bridging the gap between juniors and seniors, and ensuring active sports participation.",
      declaration: true,
      status: "Selected",
      submittedAt: "2026-07-02T10:30:00Z",
      interviewDate: "2026-07-08",
      interviewTime: "10:00",
      interviewMarks: 9.5,
      attendancePercentage: 96.5,
      attendanceMarks: 9.6,
      academicMarks: 9.2,
      remarks: "Outstanding candidate with excellent articulation and long commitment to school sports. Eloquent speaker who embodies Goenkan values perfectly.",
      recommendation: "Highly Recommended"
    },
    {
      id: "app-002",
      name: "Diya Sharma",
      admissionNumber: "GDG-2016-1120",
      class: 11,
      section: "B",
      rollNumber: "08",
      gender: "Girl",
      dob: "2010-08-22",
      admissionDate: "2016-07-15", // 10 years
      house: "Tagore",
      mobile: "9812345678",
      parentName: "Meenakshi Sharma",
      parentMobile: "9812345679",
      email: "diya.sharma@example.com",
      leadershipExperience: "Class Representative for 3 consecutive years. Organized MUN 2025 as the Lead Coordinator. Member of school choir.",
      achievements: [
        { level: "State", rank: "Gold", title: "State Debate Championship First Place Winner", year: "2025" },
        { level: "School", rank: "Gold", title: "All-Round Student Academic Excellence Award", year: "2024" }
      ],
      firstChoicePostId: "head-girl",
      secondChoicePostId: "president-council",
      sop: "Leadership is about making others better as a result of your presence. I want to build a culture of mental health awareness, academic mentorship, and active social service at GD Goenka, fostering a more inclusive and empathetic student cabinet.",
      declaration: true,
      status: "Selected",
      submittedAt: "2026-07-03T11:15:00Z",
      interviewDate: "2026-07-08",
      interviewTime: "11:00",
      interviewMarks: 9.8,
      attendancePercentage: 98.2,
      attendanceMarks: 9.8,
      academicMarks: 9.7,
      remarks: "Exceptional maturity and clarity of vision. Her SOP is incredibly thoughtful. An effortless leader highly endorsed by the senior faculty.",
      recommendation: "Highly Recommended"
    },
    {
      id: "app-003",
      name: "Kabir Mehra",
      admissionNumber: "GDG-2019-4530",
      class: 11,
      section: "C",
      rollNumber: "18",
      gender: "Boy",
      dob: "2010-02-15",
      admissionDate: "2019-04-05", // 7 years
      house: "Vivekanand",
      mobile: "9899112233",
      parentName: "Rajeev Mehra",
      parentMobile: "9899112234",
      email: "kabir.mehra@example.com",
      leadershipExperience: "House Prefect in Class X. Lead captain of Under-15 Football House Team. Managed sound crew for the annual play.",
      achievements: [
        { level: "District", rank: "Bronze", title: "District Football Championship Runners Up", year: "2024" }
      ],
      firstChoicePostId: "head-boy",
      secondChoicePostId: "vice-head-boy",
      sop: "I believe in practical problem solving. If selected Head Boy, I will focus on upgrading student facilities, streamlining club activities, and introducing peer-to-peer coding bootcamps to build a smart community.",
      declaration: true,
      status: "Waitlisted",
      submittedAt: "2026-07-04T09:45:00Z",
      interviewDate: "2026-07-08",
      interviewTime: "11:30",
      interviewMarks: 8.2,
      attendancePercentage: 91.0,
      attendanceMarks: 9.1,
      academicMarks: 8.5,
      remarks: "A hands-on, active individual with high energetic presence. Slightly casual in interview but shows deep potential. Fit for vice-roles or waiting list.",
      recommendation: "Recommended"
    },
    {
      id: "app-004",
      name: "Ananya Iyer",
      admissionNumber: "GDG-2015-9923",
      class: 11,
      section: "A",
      rollNumber: "02",
      gender: "Girl",
      dob: "2010-11-05",
      admissionDate: "2015-04-12", // 11 years
      house: "Teresa",
      mobile: "9818822334",
      parentName: "Venkat Iyer",
      parentMobile: "9818822335",
      email: "ananya.iyer@example.com",
      leadershipExperience: "President of the Music Society in Class X. Lead Vocalist in major external cultural inter-school fests. Organized GD Goenka Annual Fest.",
      achievements: [
        { level: "National", rank: "Gold", title: "National Classical Music Solo Vocal First Rank", year: "2025" },
        { level: "School", rank: "Gold", title: "Best Creative Performer Award", year: "2024" }
      ],
      firstChoicePostId: "head-girl",
      secondChoicePostId: "president-cultural",
      sop: "Our school has a massive pool of artistic talents. I want to expand Goenkan heritage by creating collaborative creative clubs, launching our digital creative magazine, and organizing a regional Inter-school arts carnival.",
      declaration: true,
      status: "Waitlisted",
      submittedAt: "2026-07-04T14:20:00Z",
      interviewDate: "2026-07-08",
      interviewTime: "12:00",
      interviewMarks: 9.0,
      attendancePercentage: 94.0,
      attendanceMarks: 9.4,
      academicMarks: 8.8,
      remarks: "Stunning portfolio in arts. Absolute confidence in front of audience. She is an outstanding choice for Cultural President or Head Girl waiting list.",
      recommendation: "Highly Recommended"
    },
    {
      id: "app-005",
      name: "Rohan Malhotra",
      admissionNumber: "GDG-2022-7744",
      class: 11,
      section: "D",
      rollNumber: "22",
      gender: "Boy",
      dob: "2010-05-18",
      admissionDate: "2022-08-01", // 4 years
      house: "Radhakrishnan",
      mobile: "9711223344",
      parentName: "Vikram Malhotra",
      parentMobile: "9711223345",
      email: "rohan.malhotra@example.com",
      leadershipExperience: "Sports volunteer, House Cricket Captain. Conducted physical drills for middle school students.",
      achievements: [
        { level: "District", rank: "Gold", title: "District Lawn Tennis Singles Champion", year: "2025" }
      ],
      firstChoicePostId: "sports-captain-boy",
      secondChoicePostId: "school-marshal-senior-boy",
      sop: "My goal is to increase playground inclusion. I will introduce weekend friendly matches across houses, work closely with physical educators to build custom fitness checklists, and encourage non-sports students to discover chess and table tennis.",
      declaration: true,
      status: "Under Evaluation",
      submittedAt: "2026-07-05T08:00:00Z",
      interviewDate: "2026-07-09",
      interviewTime: "10:30",
      interviewMarks: 8.5,
      attendancePercentage: 92.5,
      attendanceMarks: 9.2,
      academicMarks: 8.0,
      remarks: "Extremely fit, polite, and displays perfect team-spirit ethics. Speaks with a strong resonant voice. Excellent option for Sports Captain.",
      recommendation: "Recommended"
    },
    {
      id: "app-006",
      name: "Meera Sen",
      admissionNumber: "GDG-2018-3351",
      class: 10,
      section: "B",
      rollNumber: "15",
      gender: "Girl",
      dob: "2011-03-30",
      admissionDate: "2018-04-15", // 8 years
      house: "Tagore",
      parentName: "Amit Sen",
      parentMobile: "9911445566",
      mobile: "9911445567",
      email: "meera.sen@example.com",
      leadershipExperience: "Founder of the Middle School Robotics Club. Tech volunteer during online session transition. Lead editor of middle science blog.",
      achievements: [
        { level: "District", rank: "Silver", title: "District STEM Coding Hackathon Runners Up", year: "2025" }
      ],
      firstChoicePostId: "technology-captain",
      secondChoicePostId: "vice-president-cultural",
      sop: "Technology is shaping the future. I want to assist the IT department in creating student dashboards, holding AI safety seminars, and building custom digital scoreboards for school events using simplified electronics.",
      declaration: true,
      status: "Under Evaluation",
      submittedAt: "2026-07-05T15:10:00Z",
      interviewDate: "2026-07-09",
      interviewTime: "11:00",
      interviewMarks: 8.8,
      attendancePercentage: 95.0,
      attendanceMarks: 9.5,
      academicMarks: 9.5,
      remarks: "Technically very sound. Articulate and shows great patience. Will make a perfect Technology Captain.",
      recommendation: "Recommended"
    },
    {
      id: "app-007",
      name: "Ishaan Verma",
      admissionNumber: "GDG-2017-2244",
      class: 11,
      section: "C",
      rollNumber: "12",
      gender: "Boy",
      dob: "2010-09-02",
      admissionDate: "2017-04-15", // 9 years
      house: "Vivekanand",
      mobile: "9810203040",
      parentName: "Anil Verma",
      parentMobile: "9810203041",
      email: "ishaan.verma@example.com",
      leadershipExperience: "Created the Goenkan Coding League. Code compiler for math Olympiad training modules.",
      achievements: [
        { level: "State", rank: "Gold", title: "State Science Exhibition First Rank in Smart Automation", year: "2025" }
      ],
      firstChoicePostId: "technology-captain",
      secondChoicePostId: "vice-head-boy",
      sop: "I want to apply state-of-the-art systems to simplify school queues, build a student peer feedback tool, and help my classmates leverage AI tools responsibly under school framework. I look forward to working in the cabinet.",
      declaration: true,
      status: "Under Evaluation",
      submittedAt: "2026-07-06T10:15:00Z",
      interviewDate: "2026-07-09",
      interviewTime: "11:30",
      interviewMarks: 9.0,
      attendancePercentage: 97.0,
      attendanceMarks: 9.7,
      academicMarks: 9.6,
      remarks: "Brilliant tech minds. Built a working automation prototype. Highly eligible and has a great scientific temperament.",
      recommendation: "Highly Recommended"
    },
    {
      id: "app-008",
      name: "Sanya Kapoor",
      admissionNumber: "GDG-2020-5599",
      class: 9,
      section: "E",
      rollNumber: "28",
      gender: "Girl",
      dob: "2012-01-14",
      admissionDate: "2020-04-12", // 6 years
      house: "Teresa",
      mobile: "9810112233",
      parentName: "Karan Kapoor",
      parentMobile: "9810112234",
      email: "sanya.kapoor@example.com",
      leadershipExperience: "Discipline monitor for Class VII and VIII. Core team volunteer for Eco-Club plantation drives.",
      achievements: [
        { level: "School", rank: "Gold", title: "Best Eco-Volunteer Achievement Award", year: "2025" }
      ],
      firstChoicePostId: "discipline-captain",
      secondChoicePostId: "wellness-captain",
      sop: "Maintaining discipline is not about rules, it is about developing healthy habits. If elected, I will help implement active recess mentoring where elder students help juniors and launch our Eco-composting bins in school.",
      declaration: true,
      status: "Pending",
      submittedAt: "2026-07-06T16:45:00Z",
      interviewMarks: 7.5,
      attendancePercentage: 93.5,
      attendanceMarks: 9.35,
      academicMarks: 8.6,
      remarks: "Sincere, disciplined, and very helpful attitude. Shows great promise for a Grade IX leader.",
      recommendation: "Recommended"
    },
    {
      id: "app-009",
      name: "Reyansh Gupta",
      admissionNumber: "GDG-2021-3042",
      class: 5,
      section: "C",
      rollNumber: "11",
      gender: "Boy",
      dob: "2016-04-05",
      admissionDate: "2021-04-10", // 5 years
      house: "Vivekanand",
      mobile: "9822334455",
      parentName: "Amit Gupta",
      parentMobile: "9822334456",
      email: "reyansh.g@example.com",
      leadershipExperience: "Primary wing green monitor. Captained under-11 Chess House championship.",
      achievements: [
        { level: "School", rank: "Gold", title: "First Rank in Science Olympiad Class IV", year: "2025" }
      ],
      firstChoicePostId: "junior-head-boy",
      secondChoicePostId: "junior-sports-captain",
      sop: "I want to help our primary school teachers, guide the younger Class I and II kids safely to school buses, and organize clean-classroom trophies for the primary building.",
      declaration: true,
      status: "Selected",
      submittedAt: "2026-07-07T09:00:00Z",
      interviewDate: "2026-07-09",
      interviewTime: "14:00",
      interviewMarks: 9.0,
      attendancePercentage: 96.0,
      attendanceMarks: 9.6,
      academicMarks: 9.4,
      remarks: "Splendid young boy, very smart and helpful. Very polite.",
      recommendation: "Highly Recommended"
    },
    {
      id: "app-010",
      name: "Tanya Sen",
      admissionNumber: "GDG-2021-4091",
      class: 5,
      section: "A",
      rollNumber: "21",
      gender: "Girl",
      dob: "2016-08-11",
      admissionDate: "2021-04-12", // 5 years
      house: "Tagore",
      mobile: "9833445566",
      parentName: "Lalitha Sen",
      parentMobile: "9833445567",
      email: "tanya.sen@example.com",
      leadershipExperience: "Wing assembly reader, active dancer in primary team fests.",
      achievements: [
        { level: "School", rank: "Silver", title: "Inter-House Solo Dance Competition Second Rank", year: "2025" }
      ],
      firstChoicePostId: "junior-head-girl",
      secondChoicePostId: "junior-sports-captain",
      sop: "I want to lead our school prayers, welcome guests during wing events, and make sure every primary girl feels comfortable and happy on our playgrounds.",
      declaration: true,
      status: "Selected",
      submittedAt: "2026-07-07T11:00:00Z",
      interviewDate: "2026-07-09",
      interviewTime: "14:30",
      interviewMarks: 8.8,
      attendancePercentage: 94.5,
      attendanceMarks: 9.45,
      academicMarks: 9.0,
      remarks: "Very cheerful and energetic. She carries herself extremely well on the stage. Ideal Junior Head Girl choice.",
      recommendation: "Highly Recommended"
    }
  ];

  // Map into full application records with calculated scores
  return mockStudents.map(app => {
    const fullApp = app as StudentApplication;
    
    // Calculate Years Score
    const admYear = new Date(fullApp.admissionDate).getFullYear();
    const currentYear = 2026;
    const years = Math.max(1, currentYear - admYear);
    fullApp.yearsInSchool = years;
    fullApp.yearsScore = Math.min(years, 10);

    // Calculate Achievement Score
    let highestScore = 0;
    (fullApp.achievements || []).forEach(ach => {
      const match = DEFAULT_CONFIG.achievementMatrix.find(m => m.level === ach.level && m.rank === ach.rank);
      if (match && match.marks > highestScore) {
        highestScore = match.marks;
      }
    });
    fullApp.achievementScore = highestScore;

    // Attendance Marks
    if (fullApp.attendancePercentage && !fullApp.attendanceMarks) {
      fullApp.attendanceMarks = parseFloat((fullApp.attendancePercentage / 10).toFixed(2));
    }

    // Discipline Marks
    if (fullApp.disciplineMarks === undefined) {
      fullApp.disciplineMarks = parseFloat((Math.random() * 2 + 8).toFixed(1)); // 8.0 - 10.0
    }

    // Final Merit Score (sum of enabled criteria, each capped at their maxMarks)
    const activeCriteria = DEFAULT_CONFIG.criteria.filter(c => c.enabled);
    let scoreSum = 0;
    activeCriteria.forEach(c => {
      if (c.id === "achievement") scoreSum += fullApp.achievementScore || 0;
      if (c.id === "interview") scoreSum += fullApp.interviewMarks || 0;
      if (c.id === "attendance") scoreSum += fullApp.attendanceMarks || 0;
      if (c.id === "academics") scoreSum += fullApp.academicMarks || 0;
      if (c.id === "years") scoreSum += fullApp.yearsScore || 0;
      if (c.id === "discipline") scoreSum += fullApp.disciplineMarks || 0;
    });
    fullApp.finalScore = parseFloat(scoreSum.toFixed(2));

    return fullApp;
  });
}

// Default pre-registered students list for bulk directory
const DEFAULT_REGISTERED_STUDENTS: RegisteredStudent[] = [
  { id: "reg-001", name: "Aarav Goel", admissionNumber: "GDG-2015-8822", class: 11, section: "A", rollNumber: "14", gender: "Boy" },
  { id: "reg-002", name: "Diya Sharma", admissionNumber: "GDG-2016-1120", class: 11, section: "B", rollNumber: "08", gender: "Girl" },
  { id: "reg-003", name: "Kabir Mehra", admissionNumber: "GDG-2019-4530", class: 11, section: "C", rollNumber: "18", gender: "Boy" },
  { id: "reg-004", name: "Tanya Sen", admissionNumber: "GDG-2021-4091", class: 5, section: "A", rollNumber: "21", gender: "Girl" },
  { id: "reg-005", name: "Rohan Verma", admissionNumber: "GDG-2018-9933", class: 11, section: "A", rollNumber: "22", gender: "Boy" },
  { id: "reg-006", name: "Ananya Iyer", admissionNumber: "GDG-2017-7744", class: 11, section: "B", rollNumber: "02", gender: "Girl" },
  { id: "reg-007", name: "Ishaan Kapoor", admissionNumber: "GDG-2020-5511", class: 9, section: "C", rollNumber: "15", gender: "Boy" },
  { id: "reg-008", name: "Meera Nair", admissionNumber: "GDG-2019-2288", class: 11, section: "D", rollNumber: "19", gender: "Girl" },
  { id: "reg-009", name: "Pranav Joshi", admissionNumber: "GDG-2022-3344", class: 5, section: "B", rollNumber: "11", gender: "Boy" }
];

const DEFAULT_SUPABASE_CONFIG = {
  connectionString: "",
  url: "",
  anonKey: "",
  connected: false,
  useSupabase: false
};

// Global App State
let state: AppState = {
  config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  applications: generateMockApplications(),
  emailLogs: [],
  registeredStudents: DEFAULT_REGISTERED_STUDENTS,
  supabaseConfig: DEFAULT_SUPABASE_CONFIG
};

// Async query runner
async function querySupabase(text: string, params: any[] = []) {
  if (!state.supabaseConfig || !state.supabaseConfig.useSupabase || !state.supabaseConfig.connectionString) {
    return null;
  }
  try {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: state.supabaseConfig.connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query(text, params);
    await client.end();
    return res;
  } catch (err) {
    console.error("Supabase Query Sync Error:", err);
    return null;
  }
}

// Background sync from Supabase on startup
async function syncFromSupabase() {
  if (!state.supabaseConfig || !state.supabaseConfig.useSupabase || !state.supabaseConfig.connectionString) {
    return;
  }
  console.log("Starting background sync from Supabase...");
  try {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: state.supabaseConfig.connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    // 1. Config
    const configRes = await client.query("SELECT config_json FROM system_config WHERE key = 'current_config'");
    if (configRes.rows.length > 0) {
      state.config = configRes.rows[0].config_json;
    }

    // 2. Registered Students
    const studentsRes = await client.query("SELECT id, admission_number, name, class, section, roll_number, gender FROM registered_students");
    if (studentsRes.rows.length > 0) {
      state.registeredStudents = studentsRes.rows.map(r => ({
        id: r.id,
        admissionNumber: r.admission_number,
        name: r.name,
        class: r.class,
        section: r.section,
        rollNumber: r.roll_number || undefined,
        gender: (r.gender as any) || undefined
      }));
    }

    // 3. Email Logs
    const logsRes = await client.query("SELECT id, to_email, subject, body, sent_at, status FROM email_logs ORDER BY sent_at DESC");
    state.emailLogs = logsRes.rows.map(r => ({
      id: r.id,
      to: r.to_email,
      subject: r.subject,
      body: r.body,
      sentAt: r.sent_at,
      status: r.status as any
    }));

    // 4. Applications
    const appsRes = await client.query("SELECT * FROM applications");
    if (appsRes.rows.length > 0) {
      state.applications = appsRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        admissionNumber: r.admission_number,
        class: r.class,
        section: r.section,
        rollNumber: r.roll_number || "",
        gender: r.gender as any,
        dob: r.dob || "",
        admissionDate: r.admission_date || "",
        house: r.house as any,
        mobile: r.mobile || "",
        parentName: r.parent_name || "",
        parentMobile: r.parent_mobile || "",
        email: r.email || "",
        photo: r.photo || undefined,
        leadershipExperience: r.leadership_experience || "",
        achievements: Array.isArray(r.achievements) ? r.achievements : JSON.parse(r.achievements || "[]"),
        firstChoicePostId: r.first_choice_post_id || "",
        secondChoicePostId: r.second_choice_post_id || "",
        sop: r.sop || "",
        declaration: !!r.declaration,
        submittedAt: r.submitted_at || "",
        status: r.status as any,
        interviewDate: r.interview_date || undefined,
        interviewTime: r.interview_time || undefined,
        interviewMarks: r.interview_marks ? parseFloat(r.interview_marks) : undefined,
        attendancePercentage: r.attendance_percentage ? parseFloat(r.attendance_percentage) : undefined,
        attendanceMarks: r.attendance_marks ? parseFloat(r.attendance_marks) : undefined,
        academicMarks: r.academic_marks ? parseFloat(r.academic_marks) : undefined,
        yearsInSchool: r.years_in_school || undefined,
        yearsScore: r.years_score ? parseFloat(r.years_score) : undefined,
        achievementScore: r.achievement_score ? parseFloat(r.achievement_score) : undefined,
        disciplineMarks: r.discipline_marks ? parseFloat(r.discipline_marks) : undefined,
        finalScore: r.final_score ? parseFloat(r.final_score) : undefined,
        remarks: r.remarks || undefined,
        recommendation: r.recommendation as any,
        aiRecommendation: r.ai_recommendation ? (typeof r.ai_recommendation === 'string' ? JSON.parse(r.ai_recommendation) : r.ai_recommendation) : undefined
      }));
    }

    state.supabaseConfig.connected = true;
    state.supabaseConfig.lastSyncedAt = new Date().toISOString();
    
    console.log("Successfully synchronized state from Supabase! Saved locally.");
    
    await client.end();
    
    // Save to local file
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to sync from Supabase:", err);
    state.supabaseConfig.connected = false;
  }
}

// Ensure data load from file
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      state = {
        config: parsed.config || JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
        applications: parsed.applications || generateMockApplications(),
        emailLogs: parsed.emailLogs || [],
        registeredStudents: parsed.registeredStudents || DEFAULT_REGISTERED_STUDENTS,
        supabaseConfig: parsed.supabaseConfig || DEFAULT_SUPABASE_CONFIG
      };
      console.log("Database successfully loaded from persistent store.");
      
      // Attempt to sync from Supabase asynchronously if enabled
      if (state.supabaseConfig.useSupabase && state.supabaseConfig.connectionString) {
        syncFromSupabase().catch(e => console.error("Initial Supabase sync error:", e));
      }
    } else {
      console.log("No persistent database found. Initializing with seeded defaults...");
      saveDatabase();
    }
  } catch (err) {
    console.error("Failed to load database. Falling back to default memory states.", err);
  }
}

// Background sync database down to Supabase (write operation)
async function syncDatabaseToSupabase() {
  if (!state.supabaseConfig || !state.supabaseConfig.useSupabase || !state.supabaseConfig.connectionString) {
    return;
  }
  try {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: state.supabaseConfig.connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // 1. Write Config
    await client.query(`
      INSERT INTO system_config (key, config_json)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET config_json = EXCLUDED.config_json
    `, ['current_config', JSON.stringify(state.config)]);

    // 2. Write Registered Students
    for (const student of state.registeredStudents || []) {
      await client.query(`
        INSERT INTO registered_students (id, admission_number, name, class, section, roll_number, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (admission_number) DO UPDATE SET
          name = EXCLUDED.name,
          class = EXCLUDED.class,
          section = EXCLUDED.section,
          roll_number = EXCLUDED.roll_number,
          gender = EXCLUDED.gender
      `, [student.id, student.admissionNumber, student.name, student.class, student.section, student.rollNumber || null, student.gender || null]);
    }

    // 3. Write Email Logs
    for (const log of state.emailLogs || []) {
      await client.query(`
        INSERT INTO email_logs (id, to_email, subject, body, sent_at, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [log.id, log.to, log.subject, log.body, log.sentAt, log.status]);
    }

    // 4. Write Applications
    for (const app of state.applications || []) {
      await client.query(`
        INSERT INTO applications (
          id, name, admission_number, class, section, roll_number, gender, dob, admission_date, house,
          mobile, parent_name, parent_mobile, email, photo, leadership_experience, achievements,
          first_choice_post_id, second_choice_post_id, sop, declaration, submitted_at, status,
          interview_date, interview_time, interview_marks, attendance_percentage, attendance_marks,
          academic_marks, years_in_school, years_score, achievement_score, discipline_marks, final_score,
          remarks, recommendation, ai_recommendation
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          interview_date = EXCLUDED.interview_date,
          interview_time = EXCLUDED.interview_time,
          interview_marks = EXCLUDED.interview_marks,
          attendance_percentage = EXCLUDED.attendance_percentage,
          attendance_marks = EXCLUDED.attendance_marks,
          academic_marks = EXCLUDED.academic_marks,
          years_in_school = EXCLUDED.years_in_school,
          years_score = EXCLUDED.years_score,
          achievement_score = EXCLUDED.achievement_score,
          discipline_marks = EXCLUDED.discipline_marks,
          final_score = EXCLUDED.final_score,
          remarks = EXCLUDED.remarks,
          recommendation = EXCLUDED.recommendation,
          ai_recommendation = EXCLUDED.ai_recommendation
      `, [
        app.id, app.name, app.admissionNumber, app.class, app.section, app.rollNumber || null, app.gender || null, app.dob || null, app.admissionDate || null, app.house || null,
        app.mobile || null, app.parentName || null, app.parentMobile || null, app.email || null, app.photo || null, app.leadershipExperience || null, JSON.stringify(app.achievements || []),
        app.firstChoicePostId || null, app.secondChoicePostId || null, app.sop || null, app.declaration || false, app.submittedAt || null, app.status || 'Pending',
        app.interviewDate || null, app.interviewTime || null, app.interviewMarks || null, app.attendancePercentage || null, app.attendanceMarks || null,
        app.academicMarks || null, app.yearsInSchool || null, app.yearsScore || null, app.achievementScore || null, app.disciplineMarks || null, app.finalScore || null,
        app.remarks || null, app.recommendation || null, app.aiRecommendation ? JSON.stringify(app.aiRecommendation) : null
      ]);
    }

    state.supabaseConfig.connected = true;
    state.supabaseConfig.lastSyncedAt = new Date().toISOString();
    await client.end();
  } catch (err) {
    console.error("Failed to sync database to Supabase:", err);
    state.supabaseConfig.connected = false;
  }
}

function saveDatabase() {
  try {
    recalculateRanks();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
    
    // Background sync to Supabase (non-blocking)
    if (state.supabaseConfig.useSupabase && state.supabaseConfig.connectionString) {
      syncDatabaseToSupabase().catch(e => console.error("Async Supabase sync error:", e));
    }
  } catch (err) {
    console.error("Failed to save database to disk:", err);
  }
}

// Perform automated calculations & ranking
function recalculateRanks() {
  // 1. Calculate individual marks for all applications
  state.applications.forEach(app => {
    // Years Studied
    const admYear = new Date(app.admissionDate).getFullYear();
    const currentYear = 2026;
    const years = Math.max(1, currentYear - admYear);
    app.yearsInSchool = years;
    if (app.yearsScore === undefined) {
      app.yearsScore = Math.min(years, 10);
    }

    // Achievements Score (highest level)
    let highestScore = 0;
    (app.achievements || []).forEach(ach => {
      const match = state.config.achievementMatrix.find(m => m.level === ach.level && m.rank === ach.rank);
      if (match && match.marks > highestScore) {
        highestScore = match.marks;
      }
    });
    if (app.achievementScore === undefined) {
      app.achievementScore = highestScore;
    }

    // Attendance
    if (app.attendancePercentage && app.attendanceMarks === undefined) {
      app.attendanceMarks = parseFloat((app.attendancePercentage / 10).toFixed(2));
    } else if (app.attendanceMarks === undefined) {
      app.attendanceMarks = 9.5; // fallback
    }

    // Discipline
    if (app.disciplineMarks === undefined) {
      app.disciplineMarks = 10.0; // default full marks
    }

    // Final Merit (Sum of active criteria)
    let totalScore = 0;
    state.config.criteria.forEach(c => {
      if (!c.enabled) return;
      let marks = 0;
      if (c.id === "achievement") marks = app.achievementScore || 0;
      else if (c.id === "interview") marks = app.interviewMarks || 0;
      else if (c.id === "attendance") marks = app.attendanceMarks || 0;
      else if (c.id === "academics") marks = app.academicMarks || 0;
      else if (c.id === "years") marks = app.yearsScore || 0;
      else if (c.id === "discipline") marks = app.disciplineMarks || 0;
      
      // Cap at maxMarks defined in config
      totalScore += Math.min(marks, c.maxMarks);
    });
    app.finalScore = parseFloat(totalScore.toFixed(2));
  });

  // 2. Perform global merit ranking
  const sortedOverall = [...state.applications].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  sortedOverall.forEach((app, idx) => {
    const found = state.applications.find(a => a.id === app.id);
    if (found) found.rankOverall = idx + 1;
  });

  // 3. Perform Post-wise Ranking (separate for 1st choice and 2nd choice posts)
  const postsList = state.config.posts;
  postsList.forEach(post => {
    // Find applicants for whom this post is first choice or second choice
    const postApplicants = state.applications.filter(app => app.firstChoicePostId === post.id || app.secondChoicePostId === post.id);
    const sortedPost = [...postApplicants].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    sortedPost.forEach((app, idx) => {
      const found = state.applications.find(a => a.id === app.id);
      if (found) found.rankPost = idx + 1;
    });
  });

  // 4. House-wise Ranking
  const houses = ["Radhakrishnan", "Tagore", "Vivekanand", "Teresa"];
  houses.forEach(house => {
    const houseApps = state.applications.filter(app => app.house === house);
    const sortedHouse = [...houseApps].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    sortedHouse.forEach((app, idx) => {
      const found = state.applications.find(a => a.id === app.id);
      if (found) found.rankHouse = idx + 1;
    });
  });

  // 5. Gender-wise Ranking
  ["Boy", "Girl"].forEach(gender => {
    const genderApps = state.applications.filter(app => app.gender === gender);
    const sortedGender = [...genderApps].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    sortedGender.forEach((app, idx) => {
      const found = state.applications.find(a => a.id === app.id);
      if (found) found.rankGender = idx + 1;
    });
  });
}

// Initial Database Loader Call
loadDatabase();

// Log simulated email notifications
function logEmailNotification(to: string, subject: string, body: string) {
  const emailLog: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    to,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: "sent"
  };
  state.emailLogs.unshift(emailLog);
  console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
}

/* ==========================================================================
   API ENDPOINTS
   ========================================================================== */

// 1. GET Config
app.get("/api/config", (req, res) => {
  res.json(state.config);
});

// 2. POST Config
app.post("/api/config", (req, res) => {
  try {
    state.config = req.body;
    saveDatabase();
    res.json({ status: "success", config: state.config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET Applications
app.get("/api/applications", (req, res) => {
  recalculateRanks();
  res.json(state.applications);
});

// 4. GET Single Application
app.get("/api/applications/:id", (req, res) => {
  const appItem = state.applications.find(a => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ error: "Application not found" });
  }
  res.json(appItem);
});

// 5. POST Application (Submit)
app.post("/api/applications", (req, res) => {
  try {
    const body = req.body;
    const newApp: StudentApplication = {
      ...body,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: "Pending",
      submittedAt: new Date().toISOString()
    };
    
    state.applications.push(newApp);
    saveDatabase();

    // Trigger Notification Email
    logEmailNotification(
      newApp.email,
      "Application Submitted Successfully - GD Goenka Cabinet Selection",
      `Dear ${newApp.name},\n\nWe have received your Student Cabinet Application for ${state.config.branding.academicSession} at ${state.config.branding.name}.\n\nPrimary Choice: ${state.config.posts.find(p=>p.id===newApp.firstChoicePostId)?.title || "None"}\nSecondary Choice: ${state.config.posts.find(p=>p.id===newApp.secondChoicePostId)?.title || "None"}\n\nYour application will be evaluated for eligibility shortly.\n\nWarm regards,\nGD Goenka Cabinet Selection Cell`
    );

    res.json({ status: "success", application: newApp });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. PUT Application (Update evaluation, remarks, etc.)
app.put("/api/applications/:id", (req, res) => {
  try {
    const idx = state.applications.findIndex(a => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Application not found" });
    }

    const currentStatus = state.applications[idx].status;
    const nextStatus = req.body.status;

    // Merge updates
    state.applications[idx] = {
      ...state.applications[idx],
      ...req.body
    };

    saveDatabase();

    // Status changed notifications
    if (currentStatus !== nextStatus) {
      if (nextStatus === "Interview Scheduled") {
        logEmailNotification(
          state.applications[idx].email,
          "Interview Scheduled - GD Goenka Cabinet Selection",
          `Dear ${state.applications[idx].name},\n\nYour interview for the Student Council Cabinet has been scheduled:\nDate: ${state.applications[idx].interviewDate || "TBD"}\nTime: ${state.applications[idx].interviewTime || "TBD"}\n\nPlease be prepared in full school uniform with your credentials.\n\nWarm regards,\nSelection Committee`
        );
      } else if (nextStatus === "Selected") {
        logEmailNotification(
          state.applications[idx].email,
          "CONGRATULATIONS! You are selected - GD Goenka Student Council",
          `Dear ${state.applications[idx].name},\n\nWe are absolutely thrilled to inform you that you have been SELECTED to serve in the Student Cabinet for the Session ${state.config.branding.academicSession}!\n\nYour leadership, discipline, academic merit, and outstanding interview scored top ranks. You will be formally invested during the Investiture Ceremony.\n\nWarmest congratulations,\nPrincipal, ${state.config.branding.name}`
        );
      } else if (nextStatus === "Waitlisted") {
        logEmailNotification(
          state.applications[idx].email,
          "Status Update: Waitlisted - GD Goenka Student Council",
          `Dear ${state.applications[idx].name},\n\nThank you for your enthusiastic participation in the Cabinet Selection. You have been placed in the waiting list for your selected leadership role.\n\nShould vacancies emerge, you will be contacted immediately.\n\nBest regards,\nCabinet Committee`
        );
      }
    }

    res.json({ status: "success", application: state.applications[idx] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET Email Logs
app.get("/api/email-logs", (req, res) => {
  res.json(state.emailLogs);
});

// 8. RESET Demo Data
app.post("/api/reset-demo", (req, res) => {
  try {
    state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    state.applications = generateMockApplications();
    state.emailLogs = [];
    saveDatabase();
    res.json({ status: "success", message: "Database reset to rich seeded defaults." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// REGISTERED STUDENTS & SUPABASE LINK ENDPOINTS
// =========================================================================

// GET Registered Students
app.get("/api/registered-students", (req, res) => {
  res.json(state.registeredStudents || []);
});

// POST Registered Student (Single)
app.post("/api/registered-students", (req, res) => {
  try {
    const student = req.body;
    const newStudent = {
      ...student,
      id: student.id || `reg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    if (!state.registeredStudents) state.registeredStudents = [];
    state.registeredStudents.push(newStudent);
    saveDatabase();
    res.json({ status: "success", student: newStudent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Registered Students (Bulk)
app.post("/api/registered-students/bulk", (req, res) => {
  try {
    const { students, mode } = req.body; // mode: "append" or "replace"
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: "Students list must be an array" });
    }
    const processed = students.map((s: any) => ({
      id: s.id || `reg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      admissionNumber: s.admissionNumber || s.admission_number || "",
      name: s.name || "",
      class: parseInt(s.class) || 11,
      section: s.section || "A",
      rollNumber: s.rollNumber || s.roll_number || "",
      gender: s.gender || "Boy"
    }));

    if (mode === "replace") {
      state.registeredStudents = processed;
    } else {
      if (!state.registeredStudents) state.registeredStudents = [];
      processed.forEach((item: any) => {
        const idx = state.registeredStudents.findIndex(s => s.admissionNumber === item.admissionNumber);
        if (idx !== -1) {
          state.registeredStudents[idx] = item; // Overwrite
        } else {
          state.registeredStudents.push(item);
        }
      });
    }
    saveDatabase();
    res.json({ status: "success", count: processed.length, registeredStudents: state.registeredStudents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Registered Student
app.delete("/api/registered-students/:id", (req, res) => {
  try {
    if (state.registeredStudents) {
      state.registeredStudents = state.registeredStudents.filter(s => s.id !== req.params.id);
      saveDatabase();
    }
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Supabase Config
app.get("/api/supabase/config", (req, res) => {
  res.json(state.supabaseConfig || { connected: false, useSupabase: false });
});

// POST Supabase Config
app.post("/api/supabase/config", (req, res) => {
  try {
    const { connectionString, url, anonKey, useSupabase } = req.body;
    state.supabaseConfig = {
      connectionString,
      url,
      anonKey,
      useSupabase: !!useSupabase,
      connected: state.supabaseConfig?.connected || false,
      lastSyncedAt: state.supabaseConfig?.lastSyncedAt
    };
    saveDatabase();
    res.json({ status: "success", config: state.supabaseConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Test Supabase Connection
app.post("/api/supabase/test-connection", async (req, res) => {
  const { connectionString } = req.body;
  if (!connectionString) {
    return res.status(400).json({ error: "PostgreSQL Connection String is required." });
  }
  try {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const dbRes = await client.query("SELECT VERSION()");
    await client.end();
    res.json({ status: "success", message: "Successfully connected to Supabase!", version: dbRes.rows[0].version });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Setup Supabase Database Schema & Seed Data
app.post("/api/supabase/setup-db", async (req, res) => {
  const { connectionString } = req.body;
  if (!connectionString) {
    return res.status(400).json({ error: "PostgreSQL Connection String is required." });
  }
  try {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    console.log("Setting up Supabase tables...");

    const sql_ddl = `
      CREATE TABLE IF NOT EXISTS registered_students (
        id VARCHAR(100) PRIMARY KEY,
        admission_number VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        class INT NOT NULL,
        section VARCHAR(50) NOT NULL,
        roll_number VARCHAR(50),
        gender VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR(100) PRIMARY KEY,
        to_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        sent_at VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(100) PRIMARY KEY,
        config_json JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        admission_number VARCHAR(100) NOT NULL,
        class INT NOT NULL,
        section VARCHAR(50) NOT NULL,
        roll_number VARCHAR(50),
        gender VARCHAR(50),
        dob VARCHAR(100),
        admission_date VARCHAR(100),
        house VARCHAR(100),
        mobile VARCHAR(100),
        parent_name VARCHAR(255),
        parent_mobile VARCHAR(100),
        email VARCHAR(255),
        photo TEXT,
        leadership_experience TEXT,
        achievements JSONB,
        first_choice_post_id VARCHAR(100),
        second_choice_post_id VARCHAR(100),
        sop TEXT,
        declaration BOOLEAN,
        submitted_at VARCHAR(100),
        status VARCHAR(100),
        interview_date VARCHAR(100),
        interview_time VARCHAR(100),
        interview_marks NUMERIC,
        attendance_percentage NUMERIC,
        attendance_marks NUMERIC,
        academic_marks NUMERIC,
        years_in_school INT,
        years_score NUMERIC,
        achievement_score NUMERIC,
        discipline_marks NUMERIC,
        final_score NUMERIC,
        remarks TEXT,
        recommendation VARCHAR(100),
        ai_recommendation JSONB
      );
    `;

    await client.query(sql_ddl);

    // Seed local registered students
    const localRegStudents = state.registeredStudents || [];
    for (const student of localRegStudents) {
      await client.query(`
        INSERT INTO registered_students (id, admission_number, name, class, section, roll_number, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (admission_number) DO UPDATE SET
          name = EXCLUDED.name,
          class = EXCLUDED.class,
          section = EXCLUDED.section,
          roll_number = EXCLUDED.roll_number,
          gender = EXCLUDED.gender
      `, [student.id, student.admissionNumber, student.name, student.class, student.section, student.rollNumber || null, student.gender || null]);
    }

    // Seed email logs
    const localLogs = state.emailLogs || [];
    for (const log of localLogs) {
      await client.query(`
        INSERT INTO email_logs (id, to_email, subject, body, sent_at, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [log.id, log.to, log.subject, log.body, log.sentAt, log.status]);
    }

    // Seed config JSON
    await client.query(`
      INSERT INTO system_config (key, config_json)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET config_json = EXCLUDED.config_json
    `, ['current_config', JSON.stringify(state.config)]);

    // Seed applications
    const localApps = state.applications || [];
    for (const app of localApps) {
      await client.query(`
        INSERT INTO applications (
          id, name, admission_number, class, section, roll_number, gender, dob, admission_date, house,
          mobile, parent_name, parent_mobile, email, photo, leadership_experience, achievements,
          first_choice_post_id, second_choice_post_id, sop, declaration, submitted_at, status,
          interview_date, interview_time, interview_marks, attendance_percentage, attendance_marks,
          academic_marks, years_in_school, years_score, achievement_score, discipline_marks, final_score,
          remarks, recommendation, ai_recommendation
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          interview_date = EXCLUDED.interview_date,
          interview_time = EXCLUDED.interview_time,
          interview_marks = EXCLUDED.interview_marks,
          attendance_percentage = EXCLUDED.attendance_percentage,
          attendance_marks = EXCLUDED.attendance_marks,
          academic_marks = EXCLUDED.academic_marks,
          years_in_school = EXCLUDED.years_in_school,
          years_score = EXCLUDED.years_score,
          achievement_score = EXCLUDED.achievement_score,
          discipline_marks = EXCLUDED.discipline_marks,
          final_score = EXCLUDED.final_score,
          remarks = EXCLUDED.remarks,
          recommendation = EXCLUDED.recommendation,
          ai_recommendation = EXCLUDED.ai_recommendation
      `, [
        app.id, app.name, app.admissionNumber, app.class, app.section, app.rollNumber || null, app.gender || null, app.dob || null, app.admissionDate || null, app.house || null,
        app.mobile || null, app.parentName || null, app.parentMobile || null, app.email || null, app.photo || null, app.leadershipExperience || null, JSON.stringify(app.achievements || []),
        app.firstChoicePostId || null, app.secondChoicePostId || null, app.sop || null, app.declaration || false, app.submittedAt || null, app.status || 'Pending',
        app.interviewDate || null, app.interviewTime || null, app.interviewMarks || null, app.attendancePercentage || null, app.attendanceMarks || null,
        app.academicMarks || null, app.yearsInSchool || null, app.yearsScore || null, app.achievementScore || null, app.disciplineMarks || null, app.finalScore || null,
        app.remarks || null, app.recommendation || null, app.aiRecommendation ? JSON.stringify(app.aiRecommendation) : null
      ]);
    }

    await client.end();

    state.supabaseConfig = {
      connectionString,
      connected: true,
      useSupabase: true,
      lastSyncedAt: new Date().toISOString()
    };
    saveDatabase();

    res.json({
      status: "success",
      message: "Supabase database automatically provisioned, schema created, and local state synced successfully!"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. AI Recommendation Engine using Gemini
app.post("/api/applications/:id/ai-recommend", async (req, res) => {
  try {
    if (!ai) {
      return res.status(400).json({
        error: "Gemini API key is not configured or invalid in AI Studio secrets. Set GEMINI_API_KEY to activate AI recommendations."
      });
    }

    const appItem = state.applications.find(a => a.id === req.params.id);
    if (!appItem) {
      return res.status(404).json({ error: "Application not found" });
    }

    const postsList = state.config.posts;
    const firstPost = postsList.find(p => p.id === appItem.firstChoicePostId)?.title || "Unknown Post";
    const secondPost = postsList.find(p => p.id === appItem.secondChoicePostId)?.title || "Unknown Post";

    const prompt = `You are the Executive AI Student Leadership Coach for GD Goenka Public School. Analyze this candidate application and scores to generate a highly professional Cabinet Fit Assessment report.
    
    Candidate Details:
    - Name: ${appItem.name}
    - Gender: ${appItem.gender}
    - Class: ${appItem.class}
    - House: ${appItem.house}
    - Years in school: ${appItem.yearsInSchool} years (Score: ${appItem.yearsScore}/10)
    - Applied for 1st Choice: ${firstPost}
    - Applied for 2nd Choice: ${secondPost}
    
    Current Evaluator Scores:
    - Achievements Portfolio Score: ${appItem.achievementScore}/10
    - Interview Marks: ${appItem.interviewMarks || 0}/10
    - Attendance Score: ${appItem.attendanceMarks || 0}/10 (3-year attendance avg is ${appItem.attendancePercentage || 90}%)
    - Academic Marks: ${appItem.academicMarks || 0}/10
    - Discipline Score: ${appItem.disciplineMarks || 0}/10
    - Final Calculated Merit Score: ${appItem.finalScore}/60
    - Panel Recommendation: ${appItem.recommendation || "Pending"}
    - Panel Remarks: "${appItem.remarks || ""}"
    
    Leadership Statements (Statement of Purpose):
    "${appItem.sop}"
    
    Leadership Experience:
    "${appItem.leadershipExperience}"
    
    Certificates / Achievements Highlighted:
    ${JSON.stringify(appItem.achievements)}
    
    Based on this data, provide an objective, data-backed assessment. Respond with a JSON object ONLY, adhering exactly to the following schema. Ensure all fields are filled with helpful, school-specific details. Do not output code blocks or markdown, just the raw JSON object.
    
    JSON Output Format:
    {
      "strengths": ["list 3 key specific leadership/merit strengths based on details"],
      "weaknesses": ["list 2 constructive areas for improvement or potential risks"],
      "leadershipScore": 85, // out of 100
      "confidenceScore": 90, // out of 100 (confidence in this assessment)
      "suitabilityScore": 88, // out of 100 for the chosen positions
      "recommendationSummary": "Provide a 3-sentence executive summary of why they fit or don't fit the applied roles, and whether they are ready for school cabinet office.",
      "tieBreakerVerdict": "Describe what makes this candidate unique in a tie-breaker situation, comparing their longevity, academic discipline, and artistic/sports talents.",
      "riskAnalysis": "Explain any risks (e.g. academic burden, low attendance, sports commitments, or short tenure in school)."
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            leadershipScore: { type: Type.INTEGER },
            confidenceScore: { type: Type.INTEGER },
            suitabilityScore: { type: Type.INTEGER },
            recommendationSummary: { type: Type.STRING },
            tieBreakerVerdict: { type: Type.STRING },
            riskAnalysis: { type: Type.STRING }
          },
          required: ["strengths", "weaknesses", "leadershipScore", "confidenceScore", "suitabilityScore", "recommendationSummary", "tieBreakerVerdict", "riskAnalysis"]
        }
      }
    });

    const textResult = response.text;
    const aiData = JSON.parse(textResult);

    // Save back to application
    const idx = state.applications.findIndex(a => a.id === req.params.id);
    if (idx !== -1) {
      state.applications[idx].aiRecommendation = {
        ...aiData,
        generatedAt: new Date().toISOString()
      };
      saveDatabase();
    }

    res.json(state.applications[idx].aiRecommendation);
  } catch (error: any) {
    console.error("AI Recommendation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 10. API SQL Schema & Seed Generator for Supabase
app.get("/api/supabase-sql", (req, res) => {
  const sql = `-- =========================================================================
-- GD GOENKA SCHOOL CABINET SELECTION & ELECTION MANAGEMENT SYSTEM (Supabase PostgreSQL)
-- Created At: ${new Date().toISOString()}
-- =========================================================================

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SCHOOL BRANDING & CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS school_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL DEFAULT 'GD Goenka Public School',
  tagline VARCHAR(255) NOT NULL DEFAULT 'Higher Stronger Brighter • School Leadership Cabinet',
  logo TEXT NOT NULL, -- Holds Base64/SVG representation
  primary_color VARCHAR(10) NOT NULL DEFAULT '#0f172a',
  secondary_color VARCHAR(10) NOT NULL DEFAULT '#fbbf24',
  academic_session VARCHAR(50) NOT NULL DEFAULT '2026-2027',
  application_deadline DATE NOT NULL DEFAULT '2026-08-31',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CABINETS TABLE
CREATE TABLE IF NOT EXISTS cabinets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class_range_start INT NOT NULL,
  class_range_end INT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POSTS TABLE
CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(50) PRIMARY KEY,
  cabinet_id VARCHAR(50) REFERENCES cabinets(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  vacancies INT NOT NULL DEFAULT 1,
  gender_rule VARCHAR(10) NOT NULL DEFAULT 'any' CHECK (gender_rule IN ('boy', 'girl', 'any')),
  eligible_classes INT[] NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EVALUATION CRITERIA TABLE
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACHIEVEMENT MARKS MATRIX TABLE
CREATE TABLE IF NOT EXISTS achievement_matrix (
  id SERIAL PRIMARY KEY,
  level VARCHAR(50) NOT NULL CHECK (level IN ('School', 'District', 'State', 'National')),
  rank VARCHAR(50) NOT NULL CHECK (rank IN ('Gold', 'Silver', 'Bronze')),
  marks NUMERIC(5,2) NOT NULL,
  UNIQUE(level, rank)
);

-- 6. STUDENT CABINET APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS student_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  admission_number VARCHAR(100) UNIQUE NOT NULL,
  class INT NOT NULL,
  section VARCHAR(10) NOT NULL,
  roll_number VARCHAR(10) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('Boy', 'Girl')),
  dob DATE NOT NULL,
  admission_date DATE NOT NULL,
  house VARCHAR(50) NOT NULL CHECK (house IN ('Radhakrishnan', 'Tagore', 'Vivekanand', 'Teresa')),
  mobile VARCHAR(20) NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  parent_mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  photo TEXT, -- Base64 encoded or Storage URL
  leadership_experience TEXT NOT NULL,
  sop TEXT NOT NULL,
  declaration BOOLEAN NOT NULL CHECK (declaration = TRUE),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  first_choice_post_id VARCHAR(50) REFERENCES posts(id),
  second_choice_post_id VARCHAR(50) REFERENCES posts(id),
  
  status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Interview Scheduled', 'Under Evaluation', 'Selected', 'Waitlisted', 'Rejected')),
  interview_date DATE,
  interview_time TIME,
  
  -- Marks breakdown
  interview_marks NUMERIC(4,2) DEFAULT 0.0,
  attendance_percentage NUMERIC(5,2) DEFAULT 0.0,
  attendance_marks NUMERIC(4,2) DEFAULT 0.0,
  academic_marks NUMERIC(4,2) DEFAULT 0.0,
  years_in_school INT DEFAULT 1,
  years_score NUMERIC(4,2) DEFAULT 0.0,
  achievement_score NUMERIC(4,2) DEFAULT 0.0,
  final_score NUMERIC(5,2) DEFAULT 0.0,
  
  remarks TEXT,
  recommendation VARCHAR(50) CHECK (recommendation IN ('Highly Recommended', 'Recommended', 'Waitlisted', 'Not Recommended')),
  
  -- AI recommendation cache
  ai_recommendation JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. APPLICATION CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS application_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES student_applications(id) ON DELETE CASCADE,
  level VARCHAR(50) NOT NULL CHECK (level IN ('School', 'District', 'State', 'National')),
  rank VARCHAR(50) NOT NULL CHECK (rank IN ('Gold', 'Silver', 'Bronze')),
  title VARCHAR(255) NOT NULL,
  year VARCHAR(10) NOT NULL,
  file_name VARCHAR(255),
  file_data TEXT, -- Base64 encoded certificate
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EMAIL NOTIFICATION LOG TABLE
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'sent'
);

-- =========================================================================
-- CREATE HIGH-PERFORMANCE SEARCH INDEXES
-- =========================================================================
CREATE INDEX idx_student_apps_status ON student_applications(status);
CREATE INDEX idx_student_apps_house ON student_applications(house);
CREATE INDEX idx_student_apps_posts ON student_applications(first_choice_post_id, second_choice_post_id);
CREATE INDEX idx_student_apps_final_score ON student_applications(final_score DESC);
CREATE INDEX idx_student_apps_gender ON student_applications(gender);

-- =========================================================================
-- CONVERT ATTENDANCE PERCENTAGE TRIGGER FUNCTION
-- =========================================================================
CREATE OR REPLACE FUNCTION auto_calculate_marks_and_scores()
RETURNS TRIGGER AS $$
DECLARE
  years_count INT;
  ach_score NUMERIC(4,2) := 0.0;
  total_score NUMERIC(5,2) := 0.0;
  rec_ach RECORD;
BEGIN
  -- 1. Calculate Years in School Score (MIN(Years Studied, 10))
  years_count := EXTRACT(YEAR FROM NOW()) - EXTRACT(YEAR FROM NEW.admission_date);
  IF years_count < 1 THEN
    years_count := 1;
  END IF;
  NEW.years_in_school := years_count;
  NEW.years_score := LEAST(years_count, 10);

  -- 2. Calculate Attendance Marks (attendance_percentage / 10)
  IF NEW.attendance_percentage IS NOT NULL THEN
    NEW.attendance_marks := ROUND(NEW.attendance_percentage / 10.0, 2);
  END IF;

  -- 3. Grab highest certified achievement score for this applicant
  FOR rec_ach IN 
    SELECT marks FROM application_certificates ac
    JOIN achievement_matrix am ON ac.level = am.level AND ac.rank = am.rank
    WHERE ac.application_id = NEW.id
  LOOP
    IF rec_ach.marks > ach_score THEN
      ach_score := rec_ach.marks;
    END IF;
  END LOOP;
  NEW.achievement_score := ach_score;

  -- 4. Dynamic sum of enabled criteria
  NEW.final_score := COALESCE(NEW.achievement_score, 0) + 
                     COALESCE(NEW.interview_marks, 0) + 
                     COALESCE(NEW.attendance_marks, 0) + 
                     COALESCE(NEW.academic_marks, 0) + 
                     COALESCE(NEW.years_score, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_evaluate_student_application
BEFORE INSERT OR UPDATE OF admission_date, attendance_percentage, interview_marks, academic_marks ON student_applications
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_marks_and_scores();

-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR SECURE ENROLMENT
-- =========================================================================
ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_certificates ENABLE ROW LEVEL SECURITY;

-- Students can read their own applications
CREATE POLICY student_view_own ON student_applications
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Students can insert their own application
CREATE POLICY student_create_own ON student_applications
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Panel & Admins can do everything
CREATE POLICY panel_and_admin_all ON student_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id AND (raw_app_meta_data->>'role' IN ('panel', 'admin'))
    )
  );

-- =========================================================================
-- POPULATE CONSTANT SEED DATA
-- =========================================================================
INSERT INTO cabinets (id, name, class_range_start, class_range_end, enabled) VALUES
('junior', 'Junior Cabinet', 1, 5, TRUE),
('senior', 'Senior Cabinet', 6, 11, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO posts (id, cabinet_id, title, vacancies, gender_rule, eligible_classes, enabled) VALUES
('head-boy', 'senior', 'Head Boy', 1, 'boy', ARRAY[11], TRUE),
('head-girl', 'senior', 'Head Girl', 1, 'girl', ARRAY[11], TRUE),
('vice-head-boy', 'senior', 'School Vice Head Boy', 1, 'boy', ARRAY[11], TRUE),
('vice-head-girl', 'senior', 'School Vice Head Girl', 1, 'girl', ARRAY[11], TRUE),
('president-council', 'senior', 'President (Student Council)', 1, 'any', ARRAY[10,11], TRUE),
('technology-captain', 'senior', 'Technology Captain', 1, 'any', ARRAY[9,10,11], TRUE),
('discipline-captain', 'senior', 'Discipline Captain', 1, 'any', ARRAY[9,10,11], TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO evaluation_criteria (id, name, max_marks, enabled, description) VALUES
('achievement', 'Achievements Portfolio', 10.00, TRUE, 'Based on National/State achievements'),
('interview', 'Interview Assessment', 10.00, TRUE, 'Judged by panel on communication'),
('attendance', 'Attendance Consistency', 10.00, TRUE, 'Calculated based on percentage'),
('academics', 'Academic Grade Performance', 10.00, TRUE, 'Average grade performance'),
('years', 'Years of School Study', 10.00, TRUE, '1 point per year of loyalty')
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievement_matrix (level, rank, marks) VALUES
('School', 'Gold', 3.0),
('School', 'Silver', 2.0),
('School', 'Bronze', 1.0),
('District', 'Gold', 5.0),
('District', 'Silver', 4.0),
('District', 'Bronze', 3.0),
('State', 'Gold', 7.0),
('State', 'Silver', 5.0),
('State', 'Bronze', 3.0),
('National', 'Gold', 10.0),
('National', 'Silver', 8.0),
('National', 'Bronze', 6.0)
ON CONFLICT (level, rank) DO UPDATE SET marks = EXCLUDED.marks;

-- Seed dynamic branding settings
INSERT INTO school_branding (name, tagline, logo, primary_color, secondary_color, academic_session, application_deadline)
VALUES ('GD Goenka Public School', 'Higher Stronger Brighter • School Leadership Cabinet', '...', '#0f172a', '#fbbf24', '2026-2027', '2026-08-31')
ON CONFLICT DO NOTHING;
`;
  res.setHeader("Content-Disposition", "attachment; filename=supabase_schema.sql");
  res.setHeader("Content-Type", "text/plain");
  res.send(sql);
});

/* ==========================================================================
   VITE DEVELOPEMENT ENVIRONMENT RUNTIME MIDDLEWARE
   ========================================================================== */
async function init() {
  const isProduction = process.env.NODE_ENV === "production" || 
                       !fs.existsSync(path.join(process.cwd(), "server.ts")) ||
                       (process.argv[1] && (process.argv[1].includes("dist") || process.argv[1].includes("server.cjs")));

  console.log(`[Init] Starting server. isProduction=${isProduction}, NODE_ENV=${process.env.NODE_ENV}, argv=${process.argv.join(" ")}`);

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    let distPath = path.join(process.cwd(), "dist");
    if (!fs.existsSync(path.join(distPath, "index.html"))) {
      const dirnamePath = typeof __dirname !== "undefined" ? __dirname : "";
      if (dirnamePath) {
        if (fs.existsSync(path.join(dirnamePath, "index.html"))) {
          distPath = dirnamePath;
        } else if (fs.existsSync(path.join(dirnamePath, "..", "dist", "index.html"))) {
          distPath = path.join(dirnamePath, "..", "dist");
        }
      }
    }
    if (!fs.existsSync(path.join(distPath, "index.html"))) {
      if (fs.existsSync(path.join(process.cwd(), "index.html"))) {
        distPath = process.cwd();
      }
    }
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start Server Listen
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

init();
