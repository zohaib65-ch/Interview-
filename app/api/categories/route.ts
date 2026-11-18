import { NextResponse } from "next/server";
import type mongoose from "mongoose";

import { getQuestionModel } from "@/lib/bank-models";
import { ensureCategoryIndexes } from "@/lib/categories";
import { connectToDatabase } from "@/lib/mongoose";
import { parseCategoryName } from "@/lib/slug";
import Category from "@/models/Category";
import { isCategoryBankKey, type CategoriesResponse, type CategoryItem } from "@/types/category";

export const dynamic = "force-dynamic";

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 11000;
}

export async function GET(request: Request) {
  try {
    const bank = new URL(request.url).searchParams.get("bank");
    if (!isCategoryBankKey(bank)) {
      return NextResponse.json({ error: "Invalid bank." }, { status: 400 });
    }

    await connectToDatabase();

    const [categories, counts] = await Promise.all([
      Category.find({ bank }).select("name slug").lean().exec(),
      getQuestionModel(bank).aggregate<{ _id: mongoose.Types.ObjectId | null; count: number }>([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    // Questions without a category group under a null _id, which String() turns into "null".
    const countById = new Map(counts.map((entry) => [String(entry._id), entry.count]));

    const items: CategoryItem[] = categories
      .map((category) => ({
        _id: String(category._id),
        name: category.name,
        slug: category.slug,
        count: countById.get(String(category._id)) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    return NextResponse.json<CategoriesResponse>({
      categories: items,
      uncategorizedCount: countById.get("null") ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { bank?: unknown; name?: unknown };

    if (!isCategoryBankKey(body.bank)) {
      return NextResponse.json({ error: "Invalid bank." }, { status: 400 });
    }

    const parsed = parseCategoryName(body.name);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    await connectToDatabase();
    await ensureCategoryIndexes();

    const duplicate = { error: "A category with this name already exists." };

    if (await Category.exists({ bank: body.bank, slug: parsed.slug })) {
      return NextResponse.json(duplicate, { status: 409 });
    }

    try {
      const created = await Category.create({ bank: body.bank, name: parsed.name, slug: parsed.slug });
      const category: CategoryItem = { _id: String(created._id), name: created.name, slug: created.slug, count: 0 };

      return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
      // Lost a race with another request creating the same slug; the unique index caught it.
      if (isDuplicateKeyError(error)) {
        return NextResponse.json(duplicate, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to create category", error);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
