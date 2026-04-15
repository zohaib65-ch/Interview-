import mongoose, { Schema, type Model } from "mongoose";

export interface IQuestion extends mongoose.Document {
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
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
  },
  {
    timestamps: true,
  },
);

const Question: Model<IQuestion> = (mongoose.models.Question as Model<IQuestion>) || mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
