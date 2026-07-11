import { SystemConfig, RegisteredStudent, StudentApplication } from "../types";

export const DEFAULT_CONFIG: SystemConfig = {
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
    { id: "head-boy", cabinetId: "senior", title: "Head Boy", vacancies: 1, genderRule: "boy", eligibleClasses: [11], enabled: true },
    { id: "head-girl", cabinetId: "senior", title: "Head Girl", vacancies: 1, genderRule: "girl", eligibleClasses: [11], enabled: true },
    { id: "vice-head-boy", cabinetId: "senior", title: "School Vice Head Boy", vacancies: 1, genderRule: "boy", eligibleClasses: [11], enabled: true },
    { id: "vice-head-girl", cabinetId: "senior", title: "School Vice Head Girl", vacancies: 1, genderRule: "girl", eligibleClasses: [11], enabled: true },
    { id: "president-council", cabinetId: "senior", title: "President (Student Council)", vacancies: 1, genderRule: "any", eligibleClasses: [10, 11], enabled: true },
    { id: "vice-president-council", cabinetId: "senior", title: "Vice President (Student Council)", vacancies: 1, genderRule: "any", eligibleClasses: [9, 10], enabled: true },
    { id: "president-cultural", cabinetId: "senior", title: "President (Cultural)", vacancies: 1, genderRule: "any", eligibleClasses: [10, 11], enabled: true },
    { id: "vice-president-cultural", cabinetId: "senior", title: "Vice President (Cultural)", vacancies: 1, genderRule: "any", eligibleClasses: [8, 9, 10], enabled: true },
    { id: "president-press", cabinetId: "senior", title: "President (Press)", vacancies: 1, genderRule: "any", eligibleClasses: [10, 11], enabled: true },
    { id: "sports-captain-boy", cabinetId: "senior", title: "Sports Captain (Boy)", vacancies: 1, genderRule: "boy", eligibleClasses: [10, 11], enabled: true },
    { id: "sports-captain-girl", cabinetId: "senior", title: "Sports Captain (Girl)", vacancies: 1, genderRule: "girl", eligibleClasses: [10, 11], enabled: true },
    { id: "school-marshal-senior-boy", cabinetId: "senior", title: "School Marshal (Senior - Boy)", vacancies: 2, genderRule: "boy", eligibleClasses: [10, 11], enabled: true },
    { id: "school-marshal-senior-girl", cabinetId: "senior", title: "School Marshal (Senior - Girl)", vacancies: 2, genderRule: "girl", eligibleClasses: [10, 11], enabled: true },
    { id: "discipline-captain", cabinetId: "senior", title: "Discipline Captain", vacancies: 1, genderRule: "any", eligibleClasses: [9, 10, 11], enabled: true },
    { id: "technology-captain", cabinetId: "senior", title: "Technology Captain", vacancies: 1, genderRule: "any", eligibleClasses: [9, 10, 11], enabled: true },
    { id: "environment-captain", cabinetId: "senior", title: "Environment Captain", vacancies: 1, genderRule: "any", eligibleClasses: [8, 9, 10, 11], enabled: true },
    { id: "wellness-captain", cabinetId: "senior", title: "Health & Wellness Captain", vacancies: 1, genderRule: "any", eligibleClasses: [8, 9, 10, 11], enabled: true },
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

export const DEFAULT_REGISTERED_STUDENTS: RegisteredStudent[] = [
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

export function generateDefaultApplications(): StudentApplication[] {
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
      admissionDate: "2015-04-10",
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
      admissionDate: "2016-07-15",
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
      admissionDate: "2019-04-05",
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
      admissionNumber: "GDG-2017-7744",
      class: 11,
      section: "B",
      rollNumber: "02",
      gender: "Girl",
      dob: "2010-11-05",
      admissionDate: "2017-04-12",
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
      admissionDate: "2022-08-01",
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
    }
  ];

  return mockStudents.map(app => {
    const fullApp = app as StudentApplication;
    const admYear = new Date(fullApp.admissionDate).getFullYear();
    const currentYear = 2026;
    const years = Math.max(1, currentYear - admYear);
    fullApp.yearsInSchool = years;
    fullApp.yearsScore = Math.min(years, 10);

    let highestScore = 0;
    (fullApp.achievements || []).forEach(ach => {
      const match = DEFAULT_CONFIG.achievementMatrix.find(m => m.level === ach.level && m.rank === ach.rank);
      if (match && match.marks > highestScore) {
        highestScore = match.marks;
      }
    });
    fullApp.achievementScore = highestScore;

    if (fullApp.attendancePercentage && !fullApp.attendanceMarks) {
      fullApp.attendanceMarks = parseFloat((fullApp.attendancePercentage / 10).toFixed(2));
    }

    if (fullApp.disciplineMarks === undefined) {
      fullApp.disciplineMarks = parseFloat((Math.random() * 2 + 8).toFixed(1));
    }

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
