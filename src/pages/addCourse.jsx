import { db } from './firebase'; 
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

export const addCourse = async (courseData) => {
    try {
        const courseRef = await addDoc(collection(db, 'courses'), courseData);
            return courseRef.id;
        } catch (error) {
            console.error("Error adding course: ", error);
        }
       
    };
