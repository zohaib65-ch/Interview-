import mongoose, { Schema, type Model } from "mongoose";

export interface IAiQuestion extends mongoose.Document {
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiQuestionSchema = new Schema<IAiQuestion>(
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

const AiQuestion: Model<IAiQuestion> =
  (mongoose.models.AiQuestion as Model<IAiQuestion>) ||
  mongoose.model<IAiQuestion>("AiQuestion", AiQuestionSchema);

export default AiQuestion;
