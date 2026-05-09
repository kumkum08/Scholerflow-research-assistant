import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('passwordHash')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (error: any) {
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (this: IUser, password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.passwordHash);
};

// Remove password hash from response
userSchema.methods.toJSON = function (this: IUser) {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model<IUser>('User', userSchema);
