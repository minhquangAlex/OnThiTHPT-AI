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
import colors from 'colors/safe';
dotenv.config();

connectDB();

const importData = async () => {
  try {
    // 1. Clear existing data
    await User.deleteMany();
    await Subject.deleteMany();
    await Question.deleteMany();
    await Attempt.deleteMany();

    console.log('Data Destroyed'.red);

    // 2. Insert users and subjects
    await User.create(users); // Use create to trigger password hashing
    const createdSubjects = await Subject.insertMany(subjects);
    console.log(`Subjects imported: ${createdSubjects.length}`.green);  // Log số lượng

    // 3. Create a map from slug to the new _id
    const subjectSlugToIdMap = new Map(
      createdSubjects.map(subject => [subject.slug, subject._id])
    );
    console.log('Subject map created with keys:', Array.from(subjectSlugToIdMap.keys()).join(', '));  // Log keys để debug

    // 4. Prepare questions with the correct subjectId (sửa: dùng subjectId thay subjectSlug)
    const processedQuestions = questions.map(question => {
      const { subjectId, ...rest } = question as any;  // Đổi subjectSlug → subjectId (match data)
      const mappedSubjectId = subjectSlugToIdMap.get(subjectId);  // Dùng subjectId làm key (string 'math')

      if (!mappedSubjectId) {
        console.warn(`⚠️ Warning: Subject with slug '${subjectId}' not found. Skipping question: "${question.questionText.substring(0, 50)}..."`.yellow);
        return null;
      }

      return {
        ...rest,
        subjectId: mappedSubjectId,  // ObjectId từ map
      };
    }).filter(q => q !== null); // Filter out any questions that had no matching subject

    // 5. Insert the processed questions
    await Question.insertMany(processedQuestions);
    console.log(`Questions imported: ${processedQuestions.length}`.green);

    // 6. Import attempts nếu có data (tùy chọn, dựa trên DB dump)
    // const createdAttempts = await Attempt.insertMany(attempts);
    // console.log(`Attempts imported: ${createdAttempts.length}`.green);

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
    await Attempt.deleteMany();

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