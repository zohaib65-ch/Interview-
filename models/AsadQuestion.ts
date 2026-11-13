import mongoose, { Schema, type Model } from "mongoose";

export interface IAsadQuestion extends mongoose.Document {
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const AsadQuestionSchema = new Schema<IAsadQuestion>(
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

const AsadQuestion: Model<IAsadQuestion> =
  (mongoose.models.AsadQuestion as Model<IAsadQuestion>) ||
  mongoose.model<IAsadQuestion>("AsadQuestion", AsadQuestionSchema);

export default AsadQuestion;
