// Default passwords. These will be hashed by the User model's pre-save hook.
export const users = [
  {
    name: 'MinhNguyen',
    password: 'adminpassword',
    role: 'admin',
  },
  {
    name: 'studQuangNguyenent',
    password: 'studentpassword',
    role: 'student',
  },
];
