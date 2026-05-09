import { User, IUser } from './models/User.js';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
}

// Find user by email
export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return await User.findOne({ email: email.toLowerCase() });
};

// Create new user
export const createUser = async (email: string, name: string, password: string): Promise<UserResponse> => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  const user = new User({
    email: email.toLowerCase(),
    name,
    passwordHash: password,
    createdAt: new Date(),
  });

  await user.save();

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };
};

// Authenticate user
export const authenticateUser = async (email: string, password: string): Promise<UserResponse | null> => {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return null;
  }

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };
};

// Get user by ID
export const getUserById = async (id: string): Promise<UserResponse | null> => {
  const user = await User.findById(id).select('-passwordHash');
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };
};
