import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export const getCourses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "courses"));
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return courses;
  } catch (error) {
    console.error("Error getting courses: ", error);
  }
};
