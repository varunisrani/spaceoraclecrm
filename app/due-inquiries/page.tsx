'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import SearchBar from '../components/SearchBar';

interface Inquiry {
  id: string | number;
  clientName: string;
  mobile: string;
  email?: string;
  configuration: string;
  description: string;
  status: string;
  source: string;
  assignedEmployee: string;
  dateCreated: string;
  budget?: string;
  area?: string;
  lastRemarks?: string;
  nfd?: string;
}

// Supabase response types
interface EnquiryRecord {
  id: string | number;
  "Client Name"?: string;
  Mobile?: string;
  Email?: string;
  "Enquiry For"?: string;
  "Property Type"?: string;
  "Assigned To"?: string;
  "Created Date"?: string;
  "Enquiry Progress"?: string;
  Budget?: string;
  NFD?: string;
  "Enquiry Source"?: string;
  Area?: string;
  Configuration?: string;
  "Last Remarks"?: string;
  Remarks?: string;
  [key: string]: string | number | undefined;
}

export default function DueInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchDueInquiries();
  }, []);

  // Effect to filter inquiries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInquiries(inquiries);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = inquiries.filter(inquiry => 
      inquiry.clientName.toLowerCase().includes(lowerCaseQuery) ||
      inquiry.mobile.toLowerCase().includes(lowerCaseQuery) ||
      inquiry.configuration.toLowerCase().includes(lowerCaseQuery) ||
      inquiry.source.toLowerCase().includes(lowerCaseQuery) ||
      inquiry.assignedEmployee.toLowerCase().includes(lowerCaseQuery) ||
      (inquiry.description && inquiry.description.toLowerCase().includes(lowerCaseQuery)) ||
      (inquiry.lastRemarks && inquiry.lastRemarks.toLowerCase().includes(lowerCaseQuery)) ||
      (inquiry.nfd && inquiry.nfd.toLowerCase().includes(lowerCaseQuery))
    );
    
    setFilteredInquiries(filtered);
  }, [searchQuery, inquiries]);

  const fetchDueInquiries = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching due inquiries using simplified logic...');
      
      // Get current date
      const today = new Date();
      const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      // Parse today's date for comparison
      const [todayDay, todayMonth, todayYear] = todayFormatted.split('/').map(Number);
      
      // Create Date object for today (with time set to midnight)
      const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
      
      // Get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost');
        
      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }
      
      // Extract the eids (inquiry ids) that have deal_lost progress entries
      const dealLostInquiryIds = new Set(dealLostData.map(item => item.eid));
      console.log('Inquiries with deal_lost progress to exclude from due inquiries:', dealLostInquiryIds.size);
      
      // Fetch all enquiries
      let enquiriesQuery = supabase
        .from('enquiries')
        .select('*');
        
      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.size > 0) {
        const dealLostArray = Array.from(dealLostInquiryIds);
        enquiriesQuery = enquiriesQuery.not('id', 'in', `(${dealLostArray.join(',')})`);
      }
      
      const { data, error } = await enquiriesQuery;

      if (error) throw error;
      
      // Filter inquiries using ONLY the NFD logic:
      // NFD is earlier than today (not including today)
      const filteredData = data.filter(enquiry => {
        // Skip if no NFD
        if (!enquiry.NFD) return false;
        
        // Parse the NFD date
        const [day, month, year] = enquiry.NFD.split('/').map(Number);
        
        // Check if this is a valid date
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
        
        // Create Date object for NFD (with time set to midnight)
        const nfdDate = new Date(year, month - 1, day);
        
        // The only condition: NFD is earlier than today
        return nfdDate < todayDate;
      });
      
      console.log('Due inquiries (NFD earlier than today):', filteredData.length);
      
      // Ensure data is treated as EnquiryRecord[]
      const typedData = filteredData as EnquiryRecord[];
      
      // Transform the data to match our Inquiry type
      const transformedData: Inquiry[] = typedData.map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        email: enquiry.Email || '',
        configuration: enquiry.Configuration || '',
        description: enquiry.Remarks || enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"] || 'Due',
        source: enquiry["Enquiry Source"] || 'Unknown',
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: String(enquiry["Created Date"] || enquiry.created_at || new Date().toISOString()),
        budget: enquiry.Budget || '',
        area: enquiry.Area || '',
        lastRemarks: enquiry["Last Remarks"] || '',
        nfd: enquiry.NFD || ''
      }));
      
      console.log('Transformed due inquiries:', transformedData.length);
      setInquiries(transformedData);
      setFilteredInquiries(transformedData);
    } catch (error) {
      console.error('Error fetching due inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getSourceBadge = (source: string) => {
    let colorClass = 'bg-blue-100 text-blue-800';
    
    if (source.includes('FACEBOOK') || source.includes('Facebook')) {
      colorClass = 'bg-indigo-100 text-indigo-800';
    } else if (source.includes('REF') || source.includes('Reference')) {
      colorClass = 'bg-green-100 text-green-800';
    } else if (source.includes('PORTAL')) {
      colorClass = 'bg-purple-100 text-purple-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {source}
      </span>
    );
  };

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-12 px-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Due Inquiries</h1>
              <div className="text-[#e5d0b1] text-lg font-semibold">
                {inquiries.length} Inquiries
              </div>
              <p className="text-[#e5d0b1] max-w-2xl mt-2">
                All inquiries with follow-up dates before yesterday
              </p>
            </div>
            <Link 
              href="/" 
              className="mt-4 md:mt-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search by client name, phone number, or follow-up date..." 
              defaultValue={searchQuery}
            />
          </div>
        </div>
      </div>
      
      {/* Inquiry Data Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
              Inquiry List
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredInquiries.length} of {inquiries.length} due inquiries
              </span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c69c6d]"></div>
            </div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Configuration</th>
                  <th>Source</th>
                  <th>Assigned To</th>
                  <th>Progress</th>
                  <th>Next Follow-up</th>
                  <th>Last Remarks</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map(inquiry => (
                  <tr key={inquiry.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/enquiry/${inquiry.id}/edit`}
                            className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                            title="Edit Inquiry"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/enquiry/${inquiry.id}/progress`}
                            className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                            title="Add Progress"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        </div>
                        <div>
                          <div className="font-medium">{inquiry.clientName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{inquiry.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{inquiry.configuration === 'Unknown' ? 'N/A' : inquiry.configuration || 'N/A'}</div>
                    </td>
                    <td>
                      {getSourceBadge(inquiry.source)}
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {inquiry.assignedEmployee}
                      </div>
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {inquiry.status}
                      </div>
                    </td>
                    <td>
                      {inquiry.nfd || '-'}
                    </td>
                    <td>
                      <div className="max-w-[200px]">
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {inquiry.lastRemarks || 'No remarks yet'}
                        </div>
                      </div>
                    </td>
                    <td>
                      {inquiry.dateCreated || '-'}
                    </td>
                  </tr>
                ))}
                
                {filteredInquiries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No due inquiries found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">All follow-ups are up to date!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 