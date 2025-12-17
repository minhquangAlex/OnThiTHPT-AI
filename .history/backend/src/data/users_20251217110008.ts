// Default passwords. These will be hashed by the User model's pre-save hook.
export const users = [
  {
    name: 'MinhNguyen',
    password: 'adminpassword',
    email: 'admin@147.edu.vn',
    role: 'admin',
  },
  {
    name: 'QuangNguyen',
    password: 'studentpassword',
    email: 'student@bigmap.edu.vn',
    role: 'student',
  },
];
