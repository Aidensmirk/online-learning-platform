import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const updateCourse = async (courseId, updatedData) => {
  try {
    const courseRef = doc(db, "courses", courseId);
    await setDoc(courseRef, updatedData, { merge: true });
  } catch (error) {
    console.error("Error updating course: ", error);
  }
};
