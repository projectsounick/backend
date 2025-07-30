import { createCorporateCommunity } from "../community/community.service";
import CompanyModel from "./company.model";
import mongoose from "mongoose";


export async function addCompany(data: Record<string, any>) {
    try {
        console.log(data);
        const companyObj = {
            name: data.name,
            email: data.email ? data.email : '',
            phone: data.phone ? data.phone : '',
            address: data.address,
            contactPerson: data.contactPerson,
            contactPersonEmail: data.contactPersonEmail,
            contactPersonPhone: data.contactPersonPhone,
            allowedEmployees: data.allowedEmployees,
            allowedDomains: data.allowedDomains
        };
        console.log(companyObj);
        const savedCompany = await CompanyModel.create(companyObj);

        await createCorporateCommunity(
            savedCompany.name,
            savedCompany._id.toString(),
        )
        return {
            message: "Company added successfully",
            success: true,
            data: savedCompany,
        };
    } catch (error) {
        console.log(error.message);
        throw new Error(error);
    }
}

export async function getCompanies(status: any, page?: string, limit?: string) {
  try {
    let savedCompany;
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

      savedCompany = await CompanyModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1, isActive: -1 } },
        { $skip: skip },
        { $limit: itemsPerPage },
      ]);

      const totalItems = await CompanyModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      paginationInfo = {
        currentPage: pageNumber,
        totalItems,
        totalPages,
      };
    } else {
      savedCompany = await CompanyModel.aggregate([
        { $match: queryObj },
        { $sort: { createdAt: -1, isActive: -1 } },
      ]);
    }

    return {
      message: "Companies fetched successfully",
      success: true,
      data: savedCompany,
      pagination: paginationInfo,
    };
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateCompany(comopanyId: string, data: Record<string, any>) {
  try {
    const companyToBeUpdated = await CompanyModel.findById(comopanyId);
    if (!companyToBeUpdated) {
      return {
        message: "Company with given id is not found",
        success: false,
      };
    }
    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      comopanyId,
      { ...data },
      { new: true }
    );
    return {
      message: "Company updated successfully",
      success: true,
      data: updatedCompany,
    };
  } catch (error) {
    throw new Error(error);
  }
}