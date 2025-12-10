// src/components/QuestionPalette.tsx
import React from 'react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, any>; // Danh sách các câu đã trả lời
  questions: any[]; // Để lấy ID câu hỏi map với answers
  onSelect: (index: number) => void;
  onSubmit: () => void;
}

const QuestionPalette: React.FC<QuestionPaletteProps> = ({ 
  totalQuestions, 
  currentIndex, 
  answers, 
  questions, 
  onSelect,
  onSubmit
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sticky top-4">
      <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white border-b pb-2">
        Bảng câu hỏi
      </h3>
      
      <div className="grid grid-cols-5 gap-2 mb-6">
        {Array.from({ length: totalQuestions }).map((_, index) => {
          // Kiểm tra xem câu này đã làm chưa
          const questionId = questions[index]?._id || questions[index]?.id;
          const isAnswered = answers[questionId] !== undefined && answers[questionId] !== null;
          const isCurrent = index === currentIndex;

          return (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`
                h-10 w-10 rounded-md text-sm font-bold transition-all border
                ${isCurrent 
                  ? 'border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-200' // Đang chọn
                  : isAnswered
                    ? 'bg-indigo-600 text-white border-indigo-600' // Đã làm
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' // Chưa làm
                }
              `}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded"></div> <span>Đã làm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded"></div> <span>Chưa làm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-500 rounded"></div> <span>Đang chọn</span>
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
      >
        Nộp bài thi
      </button>
    </div>
  );
};

export default QuestionPalette;