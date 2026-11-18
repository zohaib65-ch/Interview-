import mongoose, { Schema, type Model } from "mongoose";

import { CATEGORY_BANK_KEYS, type CategoryBankKey } from "@/types/category";

export interface ICategory extends mongoose.Document {
  bank: CategoryBankKey;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    bank: {
      type: String,
      enum: CATEGORY_BANK_KEYS,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// One slug per bank, so "React" and "react" can't both exist in Frontend (but Backend may reuse a name).
CategorySchema.index({ bank: 1, slug: 1 }, { unique: true });

const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
