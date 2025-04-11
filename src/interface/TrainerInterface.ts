interface TrainerCertificatesInterface {
  certificateName: string;
  certificateImage: string;
}

interface TrainerReviewsInterface {
  message: string;
  reviewer: string;
  rating: number;
}
///// Whole trainer data interface ( this will be coming as req.body)-----------------------/

interface TrainerProfileInterface {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  trainerCertificates: TrainerCertificatesInterface[];
  trainerCode: string;

  trainerClients: string[]; // Assuming these are user IDs
  trainerReviews: TrainerReviewsInterface[];
}

export type {
  TrainerCertificatesInterface,
  TrainerReviewsInterface,
  TrainerProfileInterface,
};
