import ProductModel, { ProductVariationModel } from "./product.model";
import mongoose from "mongoose";

export async function addProduct(data: Record<string, any>) {
    try {
        if (!data.variationType) {
            return {
                message: "Variation Type is required",
                success: false,
            };
        }
        if (data.variationType === 'none' && !data.basePrice) {
            return {
                message: "Base Price is required",
                success: false,
            };
        }
        if (data.variationType !== 'none' && (!data.variations || data.variations.length === 0)) {
            return {
                message: "Variations are required",
                success: false,
            };
        }

        const productObj = {
            category: new mongoose.Types.ObjectId(data.categoryId),
            name: data.name,
            description: data.description,
            images: data.images,
            variationType: data.variationType
        };
        if (data.basePrice) {
            productObj['basePrice'] = data.basePrice;
        }
        const savedProduct = await ProductModel.create(productObj);

        let savedVariations = [];
        if (savedProduct.variationType !== 'none') {
            const variations = data.variations.map((item: any) => ({
                productId: savedProduct._id,
                ...item,
            }));

            savedVariations = await ProductVariationModel.insertMany(variations);
        }

        return {
            message: "Product added successfully",
            success: true,
            data: { ...savedProduct.toObject(), ...(savedVariations.length > 0 ? {variations: savedVariations} : {}) },
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function getProduct(status: any, variationsStatus: Array<boolean>, page?: string, limit?: string) {
  try {
    let savedProduct;
    let paginationInfo = null;
    const queryObj: any = {};
    if (status !== null) {
      queryObj["isActive"] = status;
    }

    if (page && limit) {
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      const pageNumber = parsedPage > 0 ? parsedPage : 1;
      const itemsPerPage = parsedLimit > 0 ? parsedLimit : 10;
      const skip = (pageNumber - 1) * itemsPerPage;

      savedProduct = await ProductModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1, isActive: -1 } },
        { $skip: skip },
        { $limit: itemsPerPage },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $set: {
            category: { $arrayElemAt: ["$category", 0] }
          }
        },
        // Lookup plan items **WITH STATUS FILTER**
        {
          $lookup: {
            from: "productvariations",
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$productId", "$$productId"] },
                      { $in: ["$isActive", [...variationsStatus]] },
                    ]
                  }
                }
              }
            ],
            as: "variations",
          },
        },
      ]);

      const totalItems = await ProductModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      paginationInfo = {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      };
    } else {
      savedProduct = await ProductModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1, isActive: -1 } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $set: {
            category: { $arrayElemAt: ["$category", 0] }
          }
        },
        // Lookup plan items **WITH STATUS FILTER**
        {
          $lookup: {
            from: "productvariations",
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$productId", "$$productId"] },
                      { $in: ["$isActive", [...variationsStatus]] },
                    ]
                  }
                }
              }
            ],
            as: "variations",
          },
        },
      ]);
    }

    return {
      message: "Product fetched successfully",
      success: true,
      data: savedProduct,
      pagination: paginationInfo,
    };
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateProduct(productId: string, data: Record<string, any>) {
  try {
    const productToBeUpdated = await ProductModel.findById(productId);
    if (!productToBeUpdated) {
      return {
        message: "Product with given id is not found",
        success: false,
      };
    }
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      { ...data },
      { new: true }
    );
    return {
      message: "Product updated successfully",
      success: true,
      data: updatedProduct,
    };
  } catch (error) {
    throw new Error(error);
  }
}