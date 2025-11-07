// Default passwords. These will be hashed by the User model's pre-save hook.
export const users = [
  {
    name: 'admin',
    password: 'adminpassword',
    role: 'admin',
  },
  {
    name: 'student',
    password: 'studentpassword',
    role: 'student',
  },
];
