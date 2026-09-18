import mongoose, { Schema, type Model } from "mongoose";

export interface IScenarioQuestion extends mongoose.Document {
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScenarioQuestionSchema = new Schema<IScenarioQuestion>(
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

const ScenarioQuestion: Model<IScenarioQuestion> =
  (mongoose.models.ScenarioQuestion as Model<IScenarioQuestion>) ||
  mongoose.model<IScenarioQuestion>("ScenarioQuestion", ScenarioQuestionSchema);

export default ScenarioQuestion;
