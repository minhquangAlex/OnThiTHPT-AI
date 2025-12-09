import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Import Models
import { User } from './models/User';
import { Subject } from './models/Subject';
import { Question } from './models/Question';
import { Attempt } from './models/Attempt';

// Import Data
import { users } from './data/users';
import { subjects } from './data/subjects';
import { questions } from './data/questions';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    // 1. Clear existing data
    await User.deleteMany();
    await Subject.deleteMany();
    await Question.deleteMany();
    await Attempt.deleteMany();

    // 2. Insert users and subjects
    await User.create(users); // Use create to trigger password hashing
    const createdSubjects = await Subject.insertMany(subjects);

    // 3. Create a map from slug to the new _id
    const subjectSlugToIdMap = new Map(
      createdSubjects.map(subject => [subject.slug, subject._id])
    );

    // 4. Prepare questions with the correct subjectId
    const processedQuestions = questions.map(question => {
      const { subjectSlug, ...rest } = question as any;
      const subjectId = subjectSlugToIdMap.get(subjectSlug);

      if (!subjectId) {
        console.warn(`⚠️ Warning: Subject with slug '${subjectSlug}' not found. Skipping question: "${question.questionText.substring(0, 30)}..."`);
        return null;
      }

      return {
        ...rest,
        subjectId: subjectId,
      };
    }).filter(q => q !== null); // Filter out any questions that had no matching subject

    // 5. Insert the processed questions
    await Question.insertMany(processedQuestions);

    console.log('✅ Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error with data import: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    // Clear all data from collections
    await User.deleteMany();
    await Subject.deleteMany();
    await Question.deleteMany();

    console.log('🔥 Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error with data destruction: ${error}`);
    process.exit(1);
  }
};

// Check for the '-d' flag in command-line arguments to run the destroy function
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
