// Default passwords. These will be hashed by the User model's pre-save hook.
export const users = [
  {
    name: 'MinhNguyen',
    password: 'adminpassword',
    email: 'admin@example.com',
    role: 'admin',
  },
  {
    name: 'QuangNguyen',
    password: 'studentpassword',
    role: 'student',
  },
];
