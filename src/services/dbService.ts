import { db } from "../firebase";
import { doc, getDoc, setDoc, getDocs, collection, updateDoc, writeBatch } from "firebase/firestore";
import { SystemConfig, StudentApplication, RegisteredStudent, EmailLog } from "../types";
import { DEFAULT_CONFIG, DEFAULT_REGISTERED_STUDENTS, generateDefaultApplications } from "../data/defaults";

// Cache data locally in case of offline fallback
let cachedConfig: SystemConfig | null = null;
let cachedApplications: StudentApplication[] = [];
let cachedRegisteredStudents: RegisteredStudent[] = [];
let cachedEmailLogs: EmailLog[] = [];

// Helper to check if database is empty and needs seeding
export async function checkAndSeedDatabase() {
  try {
    const configDocRef = doc(db, "system_config", "current_config");
    const configSnap = await getDoc(configDocRef);
    
    if (!configSnap.exists()) {
      console.log("Seeding Firestore with default configurations...");
      await setDoc(configDocRef, DEFAULT_CONFIG);
      
      // Seed registered students
      const batch = writeBatch(db);
      DEFAULT_REGISTERED_STUDENTS.forEach((student) => {
        const docRef = doc(db, "registered_students", student.id);
        batch.set(docRef, student);
      });
      await batch.commit();

      // Seed mock applications
      const appsBatch = writeBatch(db);
      const apps = generateDefaultApplications();
      apps.forEach((app) => {
        const docRef = doc(db, "applications", app.id);
        appsBatch.set(docRef, app);
      });
      await appsBatch.commit();
      
      console.log("Firestore successfully initialized with Goenkan default data.");
    }
  } catch (error) {
    console.warn("Firestore seeding skipped or failed (might be offline):", error);
  }
}

export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    const docRef = doc(db, "system_config", "current_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      cachedConfig = docSnap.data() as SystemConfig;
      return cachedConfig;
    }
  } catch (err) {
    console.error("Failed to fetch system config from Firestore:", err);
  }
  
  if (cachedConfig) return cachedConfig;
  return DEFAULT_CONFIG;
}

export async function saveSystemConfig(config: SystemConfig): Promise<void> {
  cachedConfig = config;
  try {
    const docRef = doc(db, "system_config", "current_config");
    await setDoc(docRef, config);
  } catch (err) {
    console.error("Failed to save system config to Firestore:", err);
    throw err;
  }
}

export async function fetchApplications(): Promise<StudentApplication[]> {
  try {
    const colRef = collection(db, "applications");
    const querySnapshot = await getDocs(colRef);
    const list: StudentApplication[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as StudentApplication);
    });
    // Sort applications by ID or date
    list.sort((a, b) => a.id.localeCompare(b.id));
    cachedApplications = list;
    return list;
  } catch (err) {
    console.error("Failed to fetch applications from Firestore:", err);
  }
  
  if (cachedApplications.length > 0) return cachedApplications;
  return generateDefaultApplications();
}

export async function saveApplication(app: StudentApplication): Promise<void> {
  const index = cachedApplications.findIndex(a => a.id === app.id);
  if (index !== -1) {
    cachedApplications[index] = app;
  } else {
    cachedApplications.push(app);
  }
  
  try {
    const docRef = doc(db, "applications", app.id);
    await setDoc(docRef, app);
  } catch (err) {
    console.error("Failed to save application to Firestore:", err);
    throw err;
  }
}

export async function updateApplicationDoc(id: string, updates: Partial<StudentApplication>): Promise<void> {
  try {
    const docRef = doc(db, "applications", id);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error("Failed to update application in Firestore:", err);
    throw err;
  }
}

export async function fetchRegisteredStudents(): Promise<RegisteredStudent[]> {
  try {
    const colRef = collection(db, "registered_students");
    const querySnapshot = await getDocs(colRef);
    const list: RegisteredStudent[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as RegisteredStudent);
    });
    cachedRegisteredStudents = list;
    return list;
  } catch (err) {
    console.error("Failed to fetch registered students from Firestore:", err);
  }
  
  if (cachedRegisteredStudents.length > 0) return cachedRegisteredStudents;
  return DEFAULT_REGISTERED_STUDENTS;
}

export async function saveRegisteredStudent(student: RegisteredStudent): Promise<void> {
  try {
    const docRef = doc(db, "registered_students", student.id);
    await setDoc(docRef, student);
  } catch (err) {
    console.error("Failed to save registered student to Firestore:", err);
    throw err;
  }
}

export async function fetchEmailLogs(): Promise<EmailLog[]> {
  try {
    const colRef = collection(db, "email_logs");
    const querySnapshot = await getDocs(colRef);
    const list: EmailLog[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as EmailLog);
    });
    list.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    cachedEmailLogs = list;
    return list;
  } catch (err) {
    console.error("Failed to fetch email logs from Firestore:", err);
  }
  
  return cachedEmailLogs;
}

export async function saveEmailLog(log: EmailLog): Promise<void> {
  cachedEmailLogs.unshift(log);
  try {
    const docRef = doc(db, "email_logs", log.id);
    await setDoc(docRef, log);
  } catch (err) {
    console.error("Failed to save email log to Firestore:", err);
    throw err;
  }
}
