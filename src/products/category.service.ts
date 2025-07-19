import { CategoryModel } from "./product.model";
import mongoose from "mongoose";

export async function addProductCategory(data: Record<string, any>) {
    try {
        const savedProductCategory = await CategoryModel.create({ ...data });
        return {
            message: "Category added successfully",
            success: true,
            data: savedProductCategory,
        };
    } catch (error) {
        throw new Error(error);
    }
}
export async function getProductCategory(
    status: boolean,
    page?: string,
    limit?: string
) {
    try {
        console.log("called here");

        let savedProductCategory;
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

            savedProductCategory = await CategoryModel.find(queryObj)
                .sort({ createdAt: -1, isActive: -1 })
                .skip(skip)
                .limit(itemsPerPage);

            const totalItems = await CategoryModel.countDocuments(queryObj);
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            paginationInfo = {
                currentPage: pageNumber,
                totalItems,
                totalPages,
            };
        } else {
            savedProductCategory = await CategoryModel.find(queryObj).sort({
                createdAt: -1,
            });
        }

        return {
            message: "Category fetched successfully",
            success: true,
            data: savedProductCategory,
            pagination: paginationInfo,
        };
    } catch (error) {
        throw new Error(error);
    }
}
export async function updateProductCategory(
    productCategoryId: string,
    data: Record<string, any>
) {
    try {
        const productCategoryToBeUpdated = await CategoryModel.findById(productCategoryId);
        if (!productCategoryToBeUpdated) {
            return {
                message: "category with given id is not found",
                success: false,
            };
        }
        const updatedProductCategory = await CategoryModel.findByIdAndUpdate(
            productCategoryId,
            { ...data },
            { new: true }
        );
        return {
            message: "category updated successfully",
            success: true,
            data: updatedProductCategory,
        };
    } catch (error) {
        throw new Error(error);
    }
}