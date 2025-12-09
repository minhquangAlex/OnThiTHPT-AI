import { BiologyIcon, ChemistryIcon, EnglishIcon, HistoryIcon, MathIcon, PhysicsIcon } from '../components/icons/SubjectIcons';
import type { Question, Subject, User } from '../types';

// This is a mapping from icon name (string from DB) to the actual component
const iconComponents: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'MathIcon': MathIcon,
    'EnglishIcon': EnglishIcon,
    'PhysicsIcon': PhysicsIcon,
    'ChemistryIcon': ChemistryIcon,
    'BiologyIcon': BiologyIcon,
    'HistoryIcon': HistoryIcon,
};

// Link Backend Ngrok của bạn
const API_URL = (import.meta as any).env.VITE_API_URL || 'https://undisputedly-nonsocialistic-sheba.ngrok-free.dev/api';

// --- QUAN TRỌNG: Header để vượt qua màn hình cảnh báo của Ngrok ---
const NGROK_SKIP_HEADER = {
    'ngrok-skip-browser-warning': 'true'
};

// Helper to get auth token from store
const getAuthToken = () => {
    try {
        const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        return authState?.state?.token || null;
    } catch (e) {
        return null;
    }
}

const api = {
    login: async (username: string, password: string): Promise<User & { token: string }> => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...NGROK_SKIP_HEADER // <--- Thêm vào đây
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Đăng nhập thất bại');
        }

        return response.json();
    },

    getSubjects: async (): Promise<Subject[]> => {
        const response = await fetch(`${API_URL}/subjects`, {
            headers: {
                ...NGROK_SKIP_HEADER // <--- Thêm vào đây (Quan trọng cho trang Dashboard)
            }
        });
        if (!response.ok) {
            throw new Error('Không thể tải danh sách môn học');
        }
        const subjectsData = await response.json();
        return subjectsData.map((subject: any) => {
            return {
                id: subject.id,
                _id: subject._id,
                name: subject.name,
                slug: subject.slug,
                icon: iconComponents[subject.icon] || MathIcon,
                description: subject.description,
                questionCount: subject.questionCount,
            };
        });
    },

    updateSubject: async (subjectId: string, data: { name?: string; icon?: string; description?: string }) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/subjects/${subjectId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...NGROK_SKIP_HEADER // <--- Thêm vào đây
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const bodyText = await response.text();
            try {
                const parsed = JSON.parse(bodyText || '{}');
                throw new Error(parsed.message || bodyText || 'Không thể cập nhật môn học');
            } catch (e) {
                throw new Error(bodyText || 'Không thể cập nhật môn học');
            }
        }
        return response.json();
    },

    getQuestions: async (subjectId: string): Promise<Question[]> => {
        console.log(`\x1b[32m[DEBUG Frontend] Fetching questions for subjectId: '${subjectId}'\x1b[0m`);
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/questions/${subjectId}`, {
            headers: {
                // Authorization nếu cần: `Bearer ${token}`,
                ...NGROK_SKIP_HEADER // <--- Thêm vào đây
            },
        });
        if (!response.ok) {
            const error = await response.json();
            console.error(`\x1b[32m[DEBUG Frontend] API Error: ${error.message}\x1b[0m`);
            throw new Error(error.message || 'Không thể tải câu hỏi');
        }
        const result = await response.json();
        console.log(`\x1b[32m[DEBUG Frontend] API Response: ${result.data?.length || 0} questions\x1b[0m`, result.data);
        return result.data || [];
    },

    // Admin: fetch users (paginated)
    getUsers: async (page = 1, limit = 20, search = '') => {
        const token = getAuthToken();
        const qs = `?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`;
        const response = await fetch(`${API_URL}/users${qs}`, {
            headers: { 
                Authorization: `Bearer ${token}`,
                ...NGROK_SKIP_HEADER // <--- Thêm vào đây
            },
        });
        if (!response.ok) {
            throw new Error('Không thể tải danh sách người dùng');
        }
        return response.json();
    },

    getStats: async () => {
        const response = await fetch(`${API_URL}/stats`, {
            headers: {
                ...NGROK_SKIP_HEADER // <--- Thêm vào đây (Quan trọng cho Dashboard Admin)
            }
        });
        if (!response.ok) {
            throw new Error('Không thể tải số liệu thống kê');
        }
        return response.json();
    },

    createUser: async (data: { name: string; password: string; role?: string }) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...NGROK_SKIP_HEADER },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Không thể tạo người dùng');
        }
        return response.json();
    },

    updateUser: async (userId: string, data: { name?: string; role?: string; email?: string }) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...NGROK_SKIP_HEADER },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Không thể cập nhật người dùng');
        }
        return response.json();
    },

    deleteUser: async (userId: string) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Không thể xóa người dùng');
        }
        return response.json();
    },

    resetPassword: async (userId: string, password: string) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/users/${userId}/reset-password`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...NGROK_SKIP_HEADER },
            body: JSON.stringify({ password }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Không thể đặt lại mật khẩu');
        }
        return response.json();
    },

    // Questions management (admin)
    createQuestion: async (data: { subjectId: string; questionText: string; options: any; correctAnswer: string; explanation: string }) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/questions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...NGROK_SKIP_HEADER },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Không thể tạo câu hỏi');
        }
        return response.json();
    },

    recordAttempt: async (data: { userId?: string; subjectId?: string; score?: number; total?: number; answers: any[] }) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/attempts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...NGROK_SKIP_HEADER // <--- Thêm vào đây
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const bodyText = await response.text();
            try {
                const parsed = JSON.parse(bodyText || '{}');
                throw new Error(parsed.message || bodyText || 'Không thể lưu lượt làm bài');
            } catch (e) {
                throw new Error(bodyText || 'Không thể lưu lượt làm bài');
            }
        }
        return response.json();
    },

    updateQuestion: async (questionId: string, data: { questionText?: string; options?: any; correctAnswer?: string; explanation?: string }) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/questions/${questionId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...NGROK_SKIP_HEADER },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const bodyText = await response.text();
            try {
                const parsed = JSON.parse(bodyText || '{}');
                throw new Error(parsed.message || bodyText || 'Không thể cập nhật câu hỏi');
            } catch (e) {
                throw new Error(bodyText || 'Không thể cập nhật câu hỏi');
            }
        }
        return response.json();
    },

    deleteQuestion: async (questionId: string) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/questions/${questionId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
        });
        if (!response.ok) {
            const bodyText = await response.text();
            try {
                const parsed = JSON.parse(bodyText || '{}');
                throw new Error(parsed.message || bodyText || 'Không thể xóa câu hỏi');
            } catch (e) {
                throw new Error(bodyText || 'Không thể xóa câu hỏi');
            }
        }
        return response.json();
    },

    uploadFile: async (file: File) => {
        const token = getAuthToken();
        const fd = new FormData();
        fd.append('file', file);
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            // Lưu ý: Không set Content-Type thủ công cho FormData
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...NGROK_SKIP_HEADER // <--- Thêm vào đây
            },
            body: fd,
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Không thể tải file lên');
        }
        return response.json();
    },

    // Admin: Get all attempts
    getAllAttempts: async () => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/attempts`, {
            headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
        });
        if (!response.ok) {
            throw new Error('Không thể tải danh sách lượt làm bài');
        }
        return response.json();
    },

    // Admin: Get subject stats
    getSubjectStats: async () => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/stats/subjects`, {
            headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
        });
        if (!response.ok) {
            throw new Error('Không thể tải thống kê môn học');
        }
        return response.json();
    },

    // Admin: Get question stats
    getQuestionStats: async () => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/stats/questions`, {
            headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
        });
        if (!response.ok) {
            throw new Error('Không thể tải thống kê câu hỏi');
        }
        return response.json();
    },

    // Admin: Get a single attempt by ID
    getAttemptById: async (attemptId: string) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/attempts/${attemptId}`, {
            headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
        });
        if (!response.ok) {
            throw new Error('Không thể tải chi tiết lượt làm bài');
        }
        return response.json();
    },

    // Admin: Delete an attempt by ID
    deleteAttempt: async (attemptId: string) => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/attempts/${attemptId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Không thể xóa lượt làm bài');
        }
        return response.json();
    },

    // Admin: Delete ALL attempts
    deleteAllAttempts: async () => {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/attempts/all`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, ...NGROK_SKIP_HEADER },
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Không thể xóa tất cả các lượt làm bài');
        }
        return response.json();
    },

    // User: Get own attempts (cho trang cá nhân)
    getMyAttempts: async () => {
        const token = getAuthToken();
        try {
            const response = await fetch(`${API_URL}/attempts/my-attempts`, {
                headers: { 
                    Authorization: `Bearer ${token}`, 
                    ...NGROK_SKIP_HEADER 
                },
            });
            if (!response.ok) {
                // Nếu endpoint không tồn tại (404, 500), ném lỗi để fallback
                throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            // Fallback: trả về mảng rỗng nếu endpoint không tồn tại
            console.warn('Endpoint /attempts/my-attempts không khả dụng, sử dụng fallback');
            throw error; // Ném lỗi để UserProfilePage có thể xử lý
        }
    },
};

export default api;