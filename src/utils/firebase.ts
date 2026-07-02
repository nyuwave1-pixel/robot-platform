import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// 로봇 조회
export async function getRobots() {
  try {
    const q = query(collection(db, "robots"), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching robots:", error);
    return [];
  }
}

// 특정 로봇 조회
export async function getRobotById(id: string) {
  try {
    const docRef = doc(db, "robots", id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  } catch (error) {
    console.error("Error fetching robot:", error);
    return null;
  }
}

// 포럼 포스트 조회
export async function getForumPosts(category?: string) {
  try {
    let q;
    if (category) {
      q = query(collection(db, "posts"), where("category", "==", category), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// 사용자 조회
export async function getUserById(userId: string) {
  try {
    const docRef = doc(db, "users", userId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
