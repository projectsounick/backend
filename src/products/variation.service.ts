import ProductModel, { ProductVariationModel } from "./product.model";
import mongoose from "mongoose";

export async function addVariations(productId: string, data: Record<string, any>) {
    try {
        const productToBeUpdated = await ProductModel.findById(productId);
        if (!productToBeUpdated) {
            return {
                message: "Product with given id is not found",
                success: false,
            };
        }

        const variationObj = {
            productId,
            ...data,
        };
        const savedVariation = await ProductVariationModel.create(variationObj);
        return {
            message: "Variation added successfully",
            success: true,
            data: savedVariation,
        };
    } catch (error) {
        throw new Error(error);
    }
}

export async function updateVariation(variationId: string, data: Record<string, any>) {
    try {
        const variationToBeUpdated = await ProductVariationModel.findById(variationId);
        if (!variationToBeUpdated) {
            return {
                message: "Variation with given id is not found",
                success: false,
            };
        }
        const updatedVariation = await ProductVariationModel.findByIdAndUpdate(
            variationId,
            { ...data },
            { new: true }
        );
        return {
            message: "Variation updated successfully",
            success: true,
            data: updatedVariation,
        };
    } catch (error) {
        throw new Error(error);
    }
}