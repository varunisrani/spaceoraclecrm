export interface HousingLeadResponse {
  lead_name: string;
  lead_phone: string;
  lead_email?: string;
  project_id: number;
  project_name: string;
  locality: string;
  lead_date: string; // Epoch timestamp
  city?: string;
  apartment_names?: string;
  property_field?: string;
  max_area?: string;
  min_area?: string;
  min_price?: string;
  max_price?: string;
  service_type?: string;
  category_type?: string;
  flat_id?: string;
  property_id?: string;
}

export interface HousingAPIResponse {
  status: number;
  data?: HousingLeadResponse[];
  message?: string;
}

export interface ProcessedLead {
  clientName: string;
  mobile: string;
  email: string;
  configuration: string;
  enquiryFor: string;
  propertyType: string;
  assignedTo: string;
  createdDate: string;
  enquiryProgress: string;
  budget: string;
  nfd: string;
  enquirySource: string;
  area: string;
  remarks: string;
}