import mongoose, { Schema, type Model } from "mongoose";

export interface IBackendQuestion extends mongoose.Document {
  question: string;
  answer: string;
  category: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BackendQuestionSchema = new Schema<IBackendQuestion>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    // null (or missing, for older documents) means "Uncategorized".
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const BackendQuestion: Model<IBackendQuestion> =
  (mongoose.models.BackendQuestion as Model<IBackendQuestion>) ||
  mongoose.model<IBackendQuestion>("BackendQuestion", BackendQuestionSchema);

export default BackendQuestion;
