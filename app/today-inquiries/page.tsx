'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { InquirySource } from '../types';

interface Inquiry {
  id: string | number;
  clientName: string;
  mobile: string;
  configuration: string;
  description: string;
  status: string;
  source: string;
  assignedEmployee: string;
  dateCreated: string;
  sourceType: 'nfd' | 'progress' | 'both';
  progressType?: string;
  progressRemark?: string;
  progressDate?: string;
  eid?: string | number;
}

// Supabase response types
interface EnquiryRecord {
  id: string | number;
  "Client Name"?: string;
  Mobile?: string;
  Configuration?: string;
  "Last Remarks"?: string;
  "Enquiry Progress"?: string;
  "Enquiry Source"?: string;
  "Assigned To"?: string;
  "Created Date"?: string;
  [key: string]: any;  // For other potential fields
}

interface ProgressRecord {
  id: string | number;
  eid: string | number;
  progress_type?: string;
  remark?: string;
  date?: string;
  created_at?: string;
  enquiries?: EnquiryRecord | any;  // Accept any structure that might come from Supabase
  [key: string]: any;  // For other potential fields
}

export default function TodayInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodaysInquiries();
  }, []);

  const fetchTodaysInquiries = async () => {
    try {
      setIsLoading(true);
      
      // Get today's date in DD/MM/YYYY format
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      console.log('Fetching today\'s data with date:', formattedDate);
      
      // PART 1: Fetch from enquiries table where NFD = today
      console.log('Fetching from enquiries table where NFD =', formattedDate);
      const { data: nfdData, error: nfdError } = await supabase
        .from('enquiries')
        .select('*')
        .eq('NFD', formattedDate);

      if (nfdError) throw nfdError;

      console.log('Enquiries with NFD = today:', nfdData?.length || 0);
      
      // PART 2: Fetch from Inquiry_Progress table where date = today
      console.log('Fetching from Inquiry_Progress table where date =', formattedDate);
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .select(`
          id, 
          eid, 
          progress_type, 
          remark, 
          created_at, 
          date,
          enquiries:eid (
            id,
            "Client Name",
            "Mobile",
            "Email",
            "Enquiry For",
            "Property Type",
            "Assigned To",
            "Created Date",
            "Enquiry Progress",
            "Budget",
            "NFD",
            "Favourite",
            "Near to Win",
            "Enquiry Source",
            "Assigned By",
            "Area",
            "Configuration",
            "Last Remarks"
          )
        `)
        .eq('date', formattedDate);

      if (progressError) throw progressError;

      console.log('Inquiry_Progress entries with date = today:', progressData?.length || 0);
      
      // Ensure nfdData is treated as EnquiryRecord[]
      const typedNfdData = nfdData as EnquiryRecord[];
      
      // Filter out completed or cancelled inquiries from NFD data
      const filteredNfdData = typedNfdData.filter(enquiry => {
        const status = (enquiry["Enquiry Progress"] || '').toLowerCase();
        return !status.includes('done') && !status.includes('cancelled');
      });
      
      console.log('NFD enquiries after status filtering:', filteredNfdData.length);
      
      // Transform the NFD data to match our Inquiry type
      const nfdTransformedData: Inquiry[] = filteredNfdData.map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        configuration: enquiry.Configuration || '',
        description: enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"] || 'Unknown',
        source: enquiry["Enquiry Source"] || 'Unknown',
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: enquiry["Created Date"] || new Date().toISOString(),
        sourceType: 'nfd'
      }));
      
      // Ensure progressData is treated as ProgressRecord[] using a type assertion through unknown
      const typedProgressData = progressData as unknown as ProgressRecord[];
      
      // Transform the Progress data to match our Inquiry type
      const progressTransformedData: Inquiry[] = typedProgressData
        .filter(progress => progress.enquiries) // Only include progress entries with valid enquiry relation
        .map(progress => {
          // Use a type assertion to handle the enquiries structure
          const enquiry = progress.enquiries as EnquiryRecord;
          return {
            id: enquiry.id,
            clientName: enquiry["Client Name"] || 'Unknown Client',
            mobile: enquiry.Mobile || '',
            configuration: enquiry.Configuration || '',
            description: progress.remark || enquiry["Last Remarks"] || '',
            status: enquiry["Enquiry Progress"] || 'Unknown',
            source: enquiry["Enquiry Source"] || 'Unknown',
            assignedEmployee: enquiry["Assigned To"] || '',
            dateCreated: enquiry["Created Date"] || new Date().toISOString(),
            sourceType: 'progress',
            progressType: progress.progress_type,
            progressRemark: progress.remark,
            progressDate: progress.date,
            eid: progress.eid
          };
        });
      
      console.log('Transformed progress data entries:', progressTransformedData.length);
      
      // Combine both data sources, avoiding duplicates by ID
      const combinedInquiries = [...nfdTransformedData];
      
      // Add progress entries that aren't already in the list (checking by ID)
      for (const progressInquiry of progressTransformedData) {
        if (!combinedInquiries.some(i => i.id === progressInquiry.id)) {
          combinedInquiries.push(progressInquiry);
        } else {
          // If the inquiry is already in the list, add progress information to it
          const existingInquiry = combinedInquiries.find(i => i.id === progressInquiry.id);
          if (existingInquiry) {
            existingInquiry.progressType = progressInquiry.progressType;
            existingInquiry.progressRemark = progressInquiry.progressRemark;
            existingInquiry.progressDate = progressInquiry.progressDate;
            existingInquiry.sourceType = 'both'; // Mark as coming from both sources
          }
        }
      }
      
      console.log('Total combined today\'s inquiries:', combinedInquiries.length);
      setInquiries(combinedInquiries);
    } catch (error) {
      console.error('Error fetching today\'s inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressTypeLabel = (type: string = ''): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getProgressTypeColor = (type: string = ''): string => {
    if (type.includes('site_visit')) {
      return 'bg-green-100 text-green-800';
    } else if (type.includes('phone')) {
      return 'bg-blue-100 text-blue-800';
    } else if (type.includes('deal')) {
      return 'bg-amber-100 text-amber-800';
    }
    return 'bg-purple-100 text-purple-800';
  };

  const getStatusColor = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('new')) {
      return 'bg-blue-100 text-blue-800';
    } else if (lowerStatus.includes('progress')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (lowerStatus.includes('done') || lowerStatus.includes('completed')) {
      return 'bg-green-100 text-green-800';
    } else if (lowerStatus.includes('cancel')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getSourceBadge = (type: string) => {
    if (type === 'nfd') {
      return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">NFD</span>;
    } else if (type === 'progress') {
      return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Progress</span>;
    } else if (type === 'both') {
      return <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">NFD+Progress</span>;
    }
    return null;
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
              <h1 className="text-3xl font-bold mb-2">Today's Inquiries</h1>
              <p className="text-[#e5d0b1] max-w-2xl">
                All inquiries scheduled for today, including NFD and progress activities
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
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
              Today's Inquiry List
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {inquiries.length} inquiries
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
                  <th>Status</th>
                  <th>Progress Type</th>
                  <th>Remarks</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length > 0 ? (
                  inquiries.map(inquiry => (
                    <tr key={`${inquiry.id}-${inquiry.sourceType}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 rounded-full bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 dark:border-[#c69c6d]/20 items-center justify-center text-[#1a2e29] dark:text-[#c69c6d]">
                            {inquiry.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{inquiry.clientName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{inquiry.mobile}</div>
                          </div>
                        </div>
                      </td>
                      <td>{inquiry.configuration || 'N/A'}</td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                            {inquiry.source}
                          </div>
                          {getSourceBadge(inquiry.sourceType)}
                        </div>
                      </td>
                      <td>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                          {inquiry.assignedEmployee}
                        </div>
                      </td>
                      <td>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status}
                        </div>
                      </td>
                      <td>
                        {inquiry.progressType ? (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getProgressTypeColor(inquiry.progressType)}`}>
                            {getProgressTypeLabel(inquiry.progressType)}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        <div className="max-w-[200px]">
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {inquiry.description || 'No remarks'}
                          </div>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/enquiry/${inquiry.id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                            title="View details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/enquiry/${inquiry.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                            title="Edit inquiry"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/enquiry/${inquiry.id}/progress`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                            title="Add progress"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No inquiries found for today</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">There are no inquiries scheduled for today</p>
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