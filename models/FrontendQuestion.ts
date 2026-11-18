import mongoose, { Schema, type Model } from "mongoose";

export interface IFrontendQuestion extends mongoose.Document {
  question: string;
  answer: string;
  category: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FrontendQuestionSchema = new Schema<IFrontendQuestion>(
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

const FrontendQuestion: Model<IFrontendQuestion> =
  (mongoose.models.FrontendQuestion as Model<IFrontendQuestion>) ||
  mongoose.model<IFrontendQuestion>("FrontendQuestion", FrontendQuestionSchema);

export default FrontendQuestion;
