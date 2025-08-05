import ServiceModel from "./services.model"; // Adjust the import path

export async function addService(data: Record<string, any>) {
  try {
    const serviceObj = {
      title: data.title,
      descItems: data.descItems,
      imgUrl: data.imgUrl,
      otherImages: data.otherImages || [],
      price: data.price,
      isOnline: data.isOnline,
      isCorporate: data.isCorporate,
      sessionCount: data.sessionCount,
      isActive: data.isActive,
    };
    console.log(serviceObj)

    const savedService = await ServiceModel.create(serviceObj);

    return {
      message: "Service added successfully",
      success: true,
      data: savedService,
    };
  } catch (error: any) {
    console.error(error.message);
    throw new Error(error.message);
  }
}


export async function getServices(status: boolean | null, page?: string, limit?: string) {
  try {
    let savedServices;
    let paginationInfo = null;
    const queryObj: any = {};
    if (status !== null) {
      queryObj["isActive"] = status;
    }

    if (page && limit) {
      const parsedPage = parseInt(page, 10) || 1;
      const parsedLimit = parseInt(limit, 10) || 10;
      const skip = (parsedPage - 1) * parsedLimit;

      savedServices = await ServiceModel.find(queryObj)
        .skip(skip)
        .limit(parsedLimit)
        .sort({ createdAt: -1, isActive: -1 });

      const totalItems = await ServiceModel.countDocuments(queryObj);
      const totalPages = Math.ceil(totalItems / parsedLimit);

      paginationInfo = {
        currentPage: parsedPage,
        totalItems,
        totalPages,
      };
    } else {
      savedServices = await ServiceModel.find(queryObj).sort({ createdAt: -1, isActive: -1 });
    }

    return {
      message: "Services fetched successfully",
      success: true,
      data: savedServices,
      pagination: paginationInfo,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}


export async function updateService(serviceId: string, data: Record<string, any>) {
  try {
    const existingService = await ServiceModel.findById(serviceId);
    if (!existingService) {
      return {
        message: "Service with given ID not found",
        success: false,
      };
    }

    const updatedService = await ServiceModel.findByIdAndUpdate(serviceId, { ...data }, { new: true });

    return {
      message: "Service updated successfully",
      success: true,
      data: updatedService,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
