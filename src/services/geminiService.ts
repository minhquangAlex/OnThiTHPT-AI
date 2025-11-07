import { GoogleGenAI, Type } from "@google/genai";
import type { Question } from '../types';

// Fix: Removed placeholder API key logic as per guidelines. The API key must be set in environment variables.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

const questionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        questionText: { type: Type.STRING },
        options: {
            type: Type.OBJECT,
            properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
            },
            required: ["A", "B", "C", "D"]
        },
        correctAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING },
    },
    required: ["id", "questionText", "options", "correctAnswer", "explanation"]
};

export const generateQuizWithAI = async (subject: string, topic: string, count: number): Promise<Question[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}" của môn ${subject} cho kỳ thi tốt nghiệp THPT ở Việt Nam. Mỗi câu hỏi cần có 4 đáp án (A, B, C, D), đáp án đúng, và giải thích ngắn gọn.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: questionSchema
                },
            },
        });

        const jsonString = response.text;
        const questions = JSON.parse(jsonString);

        // Ensure the format is correct
        if (Array.isArray(questions)) {
            return questions.map((q, index) => ({ ...q, id: `ai-${subject}-${index}` }));
        }
        return [];
    } catch (error) {
        console.error("Error generating quiz with AI:", error);
        // Fallback to empty array on error
        return [];
    }
};

export const explainQuestionWithAI = async (question: Question): Promise<string> => {
    try {
        const prompt = `Bạn là một gia sư AI thân thiện. Hãy giải thích chi tiết tại sao đáp án đúng cho câu hỏi sau là "${question.correctAnswer}".
Câu hỏi: "${question.questionText}"
A. ${question.options.A}
B. ${question.options.B}
C. ${question.options.C}
D. ${question.options.D}
Giải thích của bạn:`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error explaining question with AI:", error);
        return "Rất tiếc, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.";
    }
};