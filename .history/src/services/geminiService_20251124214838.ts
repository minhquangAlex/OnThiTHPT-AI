import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { Question } from '../types';

// --- 1. Định nghĩa thêm Types cho Chatbot (Nếu chưa có trong file types.ts) ---
export interface ChatMessage {
    role: 'user' | 'model' | 'system';
    content: string;
}

// --- 2. Khởi tạo Client ---
let ai: GoogleGenAI | null = null;
const GEMINI_KEY = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash"; // SỬA LẠI TÊN MODEL CHÍNH XÁC

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

// --- 3. Schema cho câu hỏi trắc nghiệm ---
const questionSchema: Schema = {
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
    required: ["questionText", "options", "correctAnswer", "explanation"]
};

// --- 4. Tính năng: Tạo đề thi (Quiz) ---
export const generateQuizWithAI = async (subject: string, topic: string, count: number): Promise<Question[]> => {
    try {
        if (ai) {
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Bạn là một giáo viên giỏi. Hãy tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}" của môn ${subject} phù hợp cho kỳ thi tốt nghiệp THPT ở Việt Nam. 
                Yêu cầu:
                1. Mỗi câu hỏi có 4 đáp án (A, B, C, D).
                2. Chỉ rõ đáp án đúng.
                3. Giải thích ngắn gọn, dễ hiểu.
                4. JSON trả về phải là một mảng (Array) các object theo schema đã định nghĩa.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: questionSchema
                    },
                    temperature: 0.7, // Độ sáng tạo vừa phải để câu hỏi đa dạng nhưng chính xác
                },
            });

            const jsonString = response?.text || '';
            const questions = jsonString ? JSON.parse(jsonString) : [];

            if (Array.isArray(questions) && questions.length > 0) {
                // Map lại ID để đảm bảo unique ở frontend
                return questions.map((q, index) => ({ 
                    ...q, 
                    id: `ai-${Date.now()}-${index}` // Dùng timestamp để tránh trùng lặp ID khi tạo nhiều lần
                }));
            }
        }
    } catch (error) {
        console.error("Error generating quiz with AI:", error);
    }

    // Fallback local
    return generateFallbackQuiz(subject, topic, count);
};

// --- 5. Tính năng: Giải thích đáp án chi tiết ---
export const explainQuestionWithAI = async (question: Question): Promise<string> => {
    try {
        if (!ai) throw new Error('AI client not initialized');

        const prompt = `Bạn là một gia sư AI thân thiện và kiên nhẫn. 
        Hãy giải thích chi tiết tại sao đáp án đúng cho câu hỏi sau là "${question.correctAnswer}".
        
        Câu hỏi: "${question.questionText}"
        A. ${question.options.A}
        B. ${question.options.B}
        C. ${question.options.C}
        D. ${question.options.D}
        
        Yêu cầu: Giải thích kiến thức cốt lõi, tại sao đáp án đúng lại đúng và tại sao các đáp án nhiễu lại sai.`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });

        return response?.text || question.explanation || 'Rất tiếc, không thể lấy giải thích từ AI.';
    } catch (error) {
        console.error("Error explaining question with AI:", error);
        return question.explanation || `Đáp án ${question.correctAnswer} là đúng. (Lỗi kết nối AI)`;
    }
};

// --- 6. Tính năng MỚI: Chatbot AI Tutor ---
/**
 * Hàm này nhận vào lịch sử chat để AI hiểu ngữ cảnh
 * @param history Mảng các tin nhắn trước đó
 * @param message Tin nhắn mới nhất của user
 * @param context (Optional) Thông tin bài học hoặc câu hỏi đang thảo luận
 */
export const chatWithAI = async (history: ChatMessage[], message: string, context?: string): Promise<string> => {
    try {
        if (!ai) throw new Error('AI client not initialized');

        // Tạo system instruction (chỉ dẫn cho AI đóng vai gia sư)
        const systemInstruction = `Bạn là một gia sư AI tên là "AI Tutor".
        Nhiệm vụ: Hỗ trợ học sinh ôn thi THPT Quốc gia Việt Nam.
        Phong cách: Thân thiện, khuyến khích, giải thích dễ hiểu, gợi mở vấn đề thay vì chỉ đưa đáp án ngay lập tức.
        ${context ? `Học sinh đang hỏi về nội dung này: ${context}` : ''}`;

        // Chuyển đổi format history của bạn sang format mà SDK Google yêu cầu
        // Lưu ý: SDK mới có thể yêu cầu format cụ thể, ở đây ta dùng cách nối chuỗi đơn giản hoặc format content
        // Cách tốt nhất với Gemini 1.5 Flash là gửi kèm history trong contents
        
        const contents = [
            { role: 'user', parts: [{ text: systemInstruction }] }, // System prompt fake role user hoặc config systemInstruction nếu SDK hỗ trợ
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: contents as any, // Cast any do type SDK đôi khi khắt khe
        });

        return response?.text || "Xin lỗi, mình đang gặp chút trục trặc. Bạn hỏi lại nhé?";
    } catch (error) {
        console.error("Error chatting with AI:", error);
        return "Hiện tại mình không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.";
    }
};

// --- Helper: Fallback Generator ---
const generateFallbackQuiz = (subject: string, topic: string, count: number): Question[] => {
    const fallback: Question[] = [];
    for (let i = 0; i < count; i++) {
        const qIndex = i + 1;
        fallback.push({
            id: `local-${Date.now()}-${i}`,
            questionText: `[Offline Mode] ${topic} - Câu mẫu ${qIndex}: Hãy chọn đáp án đúng (ví dụ).`,
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
};