import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getQuestionModel } from "@/lib/bank-models";
import { ensureCategoryIndexes } from "@/lib/categories";
import { connectToDatabase } from "@/lib/mongoose";
import { parseCategoryName } from "@/lib/slug";
import Category from "@/models/Category";
import type { CategoryItem } from "@/types/category";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 11000;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const body = (await request.json()) as { name?: unknown };
    const parsed = parseCategoryName(body.name);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    await connectToDatabase();
    await ensureCategoryIndexes();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const duplicate = { error: "A category with this name already exists." };

    if (await Category.exists({ bank: category.bank, slug: parsed.slug, _id: { $ne: category._id } })) {
      return NextResponse.json(duplicate, { status: 409 });
    }

    category.name = parsed.name;
    category.slug = parsed.slug;

    try {
      await category.save();
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return NextResponse.json(duplicate, { status: 409 });
      }
      throw error;
    }

    const count = await getQuestionModel(category.bank).countDocuments({ category: category._id });
    const item: CategoryItem = { _id: String(category._id), name: category.name, slug: category.slug, count };

    return NextResponse.json({ category: item });
  } catch (error) {
    console.error("Failed to update category", error);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    await connectToDatabase();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    // Questions are moved out first, so if deleting the category itself fails they are never lost,
    // only left uncategorized.
    const moved = await getQuestionModel(category.bank).updateMany(
      { category: category._id },
      { $set: { category: null } },
    );

    await category.deleteOne();

    return NextResponse.json({ success: true, moved: moved.modifiedCount });
  } catch (error) {
    console.error("Failed to delete category", error);
    return NextResponse.json({ error: "Failed to delete category." }, { status: 500 });
  }
}
