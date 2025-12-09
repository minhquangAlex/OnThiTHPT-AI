import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Question } from '../types';

// --- CẤU HÌNH ---
// Log ra để kiểm tra xem máy tính đã đọc được Key chưa (F12 để xem)
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log("--- DEBUG API KEY ---");
console.log("Key exists:", !!GEMINI_KEY); // Sẽ in ra true nếu có key
console.log("Key first 5 chars:", GEMINI_KEY ? GEMINI_KEY.substring(0, 5) : "NONE");
console.log("---------------------");

let genAI: GoogleGenerativeAI | null = null;

if (GEMINI_KEY) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_KEY);
    } catch (err) {
        console.error('Failed to initialize Google AI:', err);
    }
}

const MODEL_NAME = "gemini-1.5-flash"; // Model nhanh và rẻ nhất

// --- INTERFACES ---
export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

// --- 1. TẠO ĐỀ THI ---
export const generateQuizWithAI = async (subject: string, topic: string, count: number): Promise<Question[]> => {
    if (!genAI) return generateFallbackQuiz(subject, topic, count);

    try {
        const model = genAI.getGenerativeModel({ 
            model: MODEL_NAME,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Tạo ${count} câu hỏi trắc nghiệm môn ${subject} về chủ đề "${topic}" cho học sinh THPT Việt Nam.
        Output format JSON Array:
        [
          {
            "questionText": "...",
            "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
            "correctAnswer": "A",
            "explanation": "..."
          }
        ]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const questions = JSON.parse(responseText);

        if (Array.isArray(questions)) {
            return questions.map((q, index) => ({
                ...q,
                id: `ai-${Date.now()}-${index}`
            }));
        }
    } catch (error) {
        console.error("Error generating quiz:", error);
    }
    return generateFallbackQuiz(subject, topic, count);
};

// --- 2. GIẢI THÍCH CÂU HỎI ---
export const explainQuestionWithAI = async (question: Question): Promise<string> => {
    if (!genAI) return "Lỗi: Chưa cấu hình API Key.";

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `Giải thích ngắn gọn tại sao đáp án ${question.correctAnswer} là đúng cho câu hỏi: "${question.questionText}"?`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Explain error:", error);
        return "Không thể giải thích lúc này.";
    }
};

// --- 3. CHATBOT (QUAN TRỌNG) ---
export const chatWithAI = async (history: ChatMessage[], message: string, context?: string): Promise<string> => {
    if (!genAI) return "Lỗi: Hệ thống chưa nhận diện được API Key. Vui lòng kiểm tra file .env";

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // Chuyển đổi lịch sử chat sang định dạng của SDK mới
        const chatHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Khởi tạo đoạn chat với history
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `Bạn là AI Tutor. Hãy trả lời ngắn gọn, thân thiện. ${context ? `\nThông tin ngữ cảnh: ${context}` : ''}` }]
                },
                {
                    role: "model",
                    parts: [{ text: "Chào bạn! Mình đã hiểu nhiệm vụ. Mình sẽ hỗ trợ bạn học tập." }]
                },
                ...chatHistory
            ]
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
    } catch (error) {
        console.error("Chat error:", error);
        return "Xin lỗi, server đang bận hoặc kết nối mạng yếu.";
    }
};

// --- Helper ---
const generateFallbackQuiz = (subject: string, topic: string, count: number): Question[] => {
    // (Giữ nguyên code fallback cũ của bạn hoặc trả về rỗng)
    return [];
};