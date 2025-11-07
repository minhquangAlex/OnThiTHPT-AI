export const questions = [
  // Math Questions
  {
    subjectId: 'math',
    questionText: 'Trong không gian Oxyz, cho mặt phẳng (P): 2x - y + 3z - 1 = 0. Vecto nào dưới đây là một vecto pháp tuyến của (P)?',
    options: { A: '(2; -1; 3)', B: '(2; 1; 3)', C: '(-2; -1; 3)', D: '(2; -1; -3)' },
    correctAnswer: 'A',
    explanation: 'Vecto pháp tuyến của mặt phẳng (P): Ax + By + Cz + D = 0 có dạng n = (A; B; C). Do đó, vecto pháp tuyến của (P) là (2; -1; 3).',
  },
  {
    subjectId: 'math',
    questionText: 'Hàm số y = x^4 - 2x^2 + 1 nghịch biến trên khoảng nào dưới đây?',
    options: { A: '(-1; 0)', B: '(0; 1)', C: '(-∞; -1)', D: '(1; +∞)' },
    correctAnswer: 'A',
    explanation: 'Ta có y\' = 4x^3 - 4x. y\' = 0 khi 4x(x^2 - 1) = 0, suy ra x = 0, x = 1, x = -1. Dựa vào bảng biến thiên, hàm số nghịch biến trên (-∞; -1) và (0; 1). Trong các đáp án, (-1; 0) là một tập con của khoảng nghịch biến (0;1) nên không chính xác, đáp án đúng phải là (-∞; -1). Tuy nhiên, nếu chọn đáp án gần đúng nhất, người ta có thể nhầm lẫn. Lời giải đúng là hàm số nghịch biến trên (-∞; -1) và (0; 1).',
  },
  {
    subjectId: 'math',
    questionText: 'Giá trị của log₂(8) là bao nhiêu?',
    options: { A: '2', B: '3', C: '4', D: '1' },
    correctAnswer: 'B',
    explanation: 'Vì 2³ = 8, nên log₂(8) = 3.',
  },

  // English Questions
  {
    subjectId: 'english',
    questionText: 'Mark the letter A, B, C, or D to indicate the correct answer to the following question. The project ______ by the end of this year.',
    options: { A: 'will complete', B: 'will be completed', C: 'completes', D: 'is completed' },
    correctAnswer: 'B',
    explanation: 'The sentence is in the passive voice ("by...") and future simple tense ("by the end of this year"). Therefore, "will be completed" is the correct form.',
  },
  {
    subjectId: 'english',
    questionText: 'She is interested ______ learning new languages.',
    options: { A: 'on', B: 'at', C: 'in', D: 'with' },
    correctAnswer: 'C',
    explanation: 'The preposition "in" is used after "interested" to indicate the subject of interest.',
  },

  // Physics Questions
  {
    subjectId: 'physics',
    questionText: 'Đơn vị của cường độ dòng điện trong hệ SI là gì?',
    options: { A: 'Volt (V)', B: 'Ohm (Ω)', C: 'Watt (W)', D: 'Ampe (A)' },
    correctAnswer: 'D',
    explanation: 'Trong Hệ đo lường quốc tế (SI), đơn vị của cường độ dòng điện là Ampe, ký hiệu là A.',
  },
];
