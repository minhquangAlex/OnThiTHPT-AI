
import React, { useState, useEffect, useRef } from 'react';
import { useQuizStore } from '../store/useQuizStore';
import { explainQuestionWithAI } from '../services/geminiService';
import Spinner from './Spinner';
import { ChatIcon, CloseIcon, SendIcon } from './icons/CoreIcons';
import type { Question } from '../types';

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

    const handleAskAboutCurrentQuestion = async () => {
        if (!currentQuestion) {
            setMessages(prev => [...prev, { type: 'ai', text: 'Bạn phải đang trong một bài kiểm tra để hỏi về câu hỏi hiện tại.' }]);
            return;
        }

        setMessages(prev => [...prev, { type: 'user', text: `Giải thích giúp tôi câu hỏi này.` }]);
        setIsLoading(true);

        const explanation = await explainQuestionWithAI(currentQuestion);
        
        setMessages(prev => [...prev, { type: 'ai', text: explanation }]);
        setIsLoading(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue;
        setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
        setInputValue('');
        setIsLoading(true);
        
        // Phân tích tin nhắn người dùng để xem có phải là yêu cầu giải thích câu hỏi hiện tại không
        const lowerCaseMessage = userMessage.toLowerCase();
        let responseText = "";

        if (currentQuestion && (lowerCaseMessage.includes('giải thích') || lowerCaseMessage.includes('câu này nghĩa là gì') || lowerCaseMessage.includes('tại sao') || lowerCaseMessage.includes('hướng dẫn'))) {
            responseText = await explainQuestionWithAI(currentQuestion);
        } else {
            responseText = "Chức năng chat tổng quát chưa được hỗ trợ. Bạn có thể hỏi về câu hỏi hiện tại trong bài kiểm tra.";
        }
        
        setMessages(prev => [...prev, { type: 'ai', text: responseText }]);
        setIsLoading(false);
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
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-full max-h-[600px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col z-50">
                    <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg">AI Tutor</h3>
                        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                           <CloseIcon className="h-6 w-6" />
                        </button>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.type === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700">
                                        <Spinner size="sm" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                        {currentQuestion && (
                             <button onClick={handleAskAboutCurrentQuestion} className="w-full text-sm mb-2 px-3 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600">
                                Giải thích câu hỏi hiện tại
                            </button>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Hỏi AI điều gì đó..."
                                className="flex-1 p-2 border rounded-md bg-transparent dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400" disabled={isLoading || !inputValue.trim()}>
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