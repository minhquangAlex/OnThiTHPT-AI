import React from 'react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, any>;
  questions: any[];
  onSelect: (index: number) => void;
  onSubmit: () => void;
}

const QuestionPalette: React.FC<QuestionPaletteProps> = ({ 
  totalQuestions, currentIndex, answers, questions, onSelect, onSubmit
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Lưới câu hỏi */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: totalQuestions }).map((_, index) => {
            const questionId = questions[index]?._id || questions[index]?.id;
            // Kiểm tra xem đã có câu trả lời chưa
            const isAnswered = answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId] !== '';
            const isCurrent = index === currentIndex;

            return (
              <button
                key={index}
                onClick={() => onSelect(index)}
                className={`
                  h-10 w-10 rounded-lg text-sm font-bold transition-all shadow-sm border
                  ${isCurrent 
                    ? 'border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-200 transform scale-110' // Đang chọn
                    : isAnswered
                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' // Đã làm
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' // Chưa làm
                  }
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chú thích màu sắc */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-indigo-600 rounded"></div> 
          <span>Đã trả lời</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-orange-500 bg-orange-50 rounded"></div> 
          <span>Đang làm</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded"></div> 
          <span>Chưa làm</span>
        </div>
      </div>

      {/* Nút Nộp bài to */}
      <div className="mt-4 pt-4 border-t dark:border-slate-700">
        <button
          onClick={() => {
              if(window.confirm('Bạn có chắc chắn muốn nộp bài và kết thúc không?')) onSubmit();
          }}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          Nộp bài thi
        </button>
      </div>
    </div>
  );
};

export default QuestionPalette;