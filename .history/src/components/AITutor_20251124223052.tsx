import React, { useState, useEffect, useRef } from 'react';
import { useQuizStore } from '../store/useQuizStore';
// 1. Import thêm chatWithAI
import { explainQuestionWithAI, chatWithAI } from '../services/geminiService';
import Spinner from './Spinner';
import { ChatIcon, CloseIcon, SendIcon } from './icons/CoreIcons';
// Nếu bạn chưa export interface ChatMessage từ geminiService, có thể map thủ công bên dưới

const AITutor: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<{ type: 'user' | 'ai', text: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { questions, currentQuestionIndex } = useQuizStore();
    const currentQuestion = questions[currentQuestionIndex];
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    // Hàm xử lý khi bấm nút "Giải thích câu hỏi hiện tại" (Giữ nguyên)
    const handleAskAboutCurrentQuestion = async () => {
        if (!currentQuestion) {
            setMessages(prev => [...prev, { type: 'ai', text: 'Bạn phải đang trong một bài kiểm tra để hỏi về câu hỏi hiện tại.' }]);
            return;
        }

        setMessages(prev => [...prev, { type: 'user', text: `Giải thích giúp tôi câu hỏi này.` }]);
        setIsLoading(true);

        // Dùng hàm chuyên biệt explainQuestionWithAI cho nút bấm này
        const explanation = await explainQuestionWithAI(currentQuestion);
        
        setMessages(prev => [...prev, { type: 'ai', text: explanation }]);
        setIsLoading(false);
    };

    // Hàm xử lý khi chat text (SỬA LẠI HÀM NÀY)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue;
        // Xóa input ngay lập tức để trải nghiệm tốt hơn
        setInputValue(''); 
        
        // Cập nhật UI tin nhắn user
        setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            let responseText = "";

            // 1. Chuyển đổi lịch sử chat hiện tại sang format mà chatWithAI yêu cầu
            // (Map 'ai' -> 'model', 'text' -> 'content')
            const historyForAI = messages.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model' as 'user' | 'model',
                content: msg.text
            }));

            // 2. Xác định Context (Ngữ cảnh)
            let context = undefined;
            if (currentQuestion) {
                context = `Người dùng đang làm bài trắc nghiệm.
                Câu hỏi hiện tại: "${currentQuestion.questionText}"
                Các lựa chọn:
                A. ${currentQuestion.options.A}
                B. ${currentQuestion.options.B}
                C. ${currentQuestion.options.C}
                D. ${currentQuestion.options.D}
                Đáp án đúng: ${currentQuestion.correctAnswer}
                Giải thích gốc: ${currentQuestion.explanation}`;
            }

            // 3. Gọi hàm chatWithAI (Thông minh hơn, xử lý cả chat thường và chat câu hỏi)
            // Hàm này sẽ tự xử lý logic trả lời dựa trên history và context
            responseText = await chatWithAI(historyForAI, userMessage, context);
            
            setMessages(prev => [...prev, { type: 'ai', text: responseText }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { type: 'ai', text: "Xin lỗi, kết nối AI bị gián đoạn." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110 z-50"
                aria-label="Mở AI Tutor"
            >
                <ChatIcon className="h-8 w-8" />
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-full max-h-[600px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in-up">
                    <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-indigo-600 text-white rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">AI Tutor</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-indigo-500 text-white">
                           <CloseIcon className="h-6 w-6" />
                        </button>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-slate-500 mt-10">
                                    <p>Xin chào! 👋</p>
                                    <p className="text-sm">Mình là trợ lý học tập AI. Hãy hỏi mình bất cứ điều gì.</p>
                                </div>
                            )}
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap shadow-sm ${
                                        msg.type === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-600'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Spinner size="sm" />
                                            <span>AI đang viết...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-lg">
                        {currentQuestion && (
                             <button onClick={handleAskAboutCurrentQuestion} className="w-full text-xs font-medium mb-3 px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-slate-700 dark:text-indigo-300 dark:hover:bg-slate-600 transition-colors border border-indigo-100 dark:border-slate-600">
                                ✨ Giải thích câu hỏi này
                            </button>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Nhập câu hỏi..."
                                className="flex-1 p-2.5 text-sm border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-sm" 
                                disabled={isLoading || !inputValue.trim()}
                            >
                                <SendIcon className="h-5 w-5"/>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AITutor;