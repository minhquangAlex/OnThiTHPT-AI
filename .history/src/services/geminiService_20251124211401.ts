import { GoogleGenAI, Type } from "@google/genai";
import type { Question } from '../types';

// Only initialize the GoogleGenAI client when an API key is provided.
let ai: any = null;
const GEMINI_KEY = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
if (GEMINI_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    } catch (err) {
        console.error('Failed to initialize GoogleGenAI client:', err);
        ai = null;
    }
} else {
    console.warn('VITE_GEMINI_API_KEY not set — AI features will use local fallbacks.');
}

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
        if (ai) {
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

            const jsonString = response?.text || '';
            const questions = jsonString ? JSON.parse(jsonString) : [];

            // Ensure the format is correct
            if (Array.isArray(questions) && questions.length > 0) {
                return questions.map((q, index) => ({ ...q, id: `ai-${subject}-${index}` }));
            }
            // If AI returned nothing, fall through to local fallback
        }
    } catch (error) {
        console.error("Error generating quiz with AI:", error);
        // continue to fallback
    }

    // Local fallback generator (when AI unavailable or failed)
    try {
        const fallback: Question[] = [];
        for (let i = 0; i < count; i++) {
            const qIndex = i + 1;
            fallback.push({
                id: `ai-${subject}-${i}`,
                questionText: `${topic} - Câu mẫu ${qIndex}: Hãy chọn đáp án đúng (ví dụ).`,
                options: {
                    A: 'Đáp án A (ví dụ)',
                    B: 'Đáp án B (ví dụ)',
                    C: 'Đáp án C (ví dụ)',
                    D: 'Đáp án D (ví dụ)'
                },
                correctAnswer: 'A',
                explanation: 'Đây là lời giải mẫu vì không có kết nối AI.'
            });
        }
        return fallback;
    } catch (err) {
        console.error('Fallback quiz generation failed:', err);
        return [];
    }
};

export const explainQuestionWithAI = async (question: Question): Promise<string> => {
    try {
        if (!ai) throw new Error('AI client not initialized');

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

        return response?.text || question.explanation || 'Rất tiếc, không thể lấy giải thích từ AI.';
    } catch (error) {
        console.error("Error explaining question with AI:", error);
        // Local fallback: use question.explanation if available, otherwise generate a simple template
        if (question.explanation && question.explanation.trim().length > 0) {
            return question.explanation;
        }
        return `Đáp án ${question.correctAnswer} là đúng. (Giải thích tóm tắt không có sẵn vì kết nối AI thất bại.)`;
    }
};