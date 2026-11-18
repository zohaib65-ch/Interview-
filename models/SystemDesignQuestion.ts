import mongoose, { Schema, type Model } from "mongoose";

export interface ISystemDesignQuestion extends mongoose.Document {
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const SystemDesignQuestionSchema = new Schema<ISystemDesignQuestion>(
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

const SystemDesignQuestion: Model<ISystemDesignQuestion> =
  (mongoose.models.SystemDesignQuestion as Model<ISystemDesignQuestion>) ||
  mongoose.model<ISystemDesignQuestion>("SystemDesignQuestion", SystemDesignQuestionSchema);

export default SystemDesignQuestion;
