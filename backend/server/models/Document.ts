import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IDocument extends MongoDocument {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  content: string;
  importedAt: Date;
  analysis?: {
    fileName: string;
    documentStructure: Array<{
      section: string;
      exists: boolean;
      feedback: string;
      issues: string[];
      suggestions: string[];
    }>;
    overallQuality: {
      clarity: number;
      academicTone: number;
      structure: number;
      completeness: number;
      overall: number;
    };
    majorIssues: string[];
    improvementSuggestions: string[];
    rewrites?: Array<{
      section: string;
      original: string;
      improved: string;
    }>;
  };
}

const documentSchema = new Schema<IDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  importedAt: {
    type: Date,
    default: Date.now,
  },
  analysis: {
    type: Schema.Types.Mixed,
    default: null,
  },
});

// Index for better query performance
documentSchema.index({ userId: 1, importedAt: -1 });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
