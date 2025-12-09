// Default passwords. These will be hashed by the User model's pre-save hook.
export const users = [
  {
    name: 'MinhN',
    password: 'adminpassword',
    role: 'admin',
  },
  {
    name: 'student',
    password: 'studentpassword',
    role: 'student',
  },
];
