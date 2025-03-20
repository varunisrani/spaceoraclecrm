'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../../../utils/supabase';
import InquiryProgressForm from '../../../components/InquiryProgressForm';

const getProgressTypeLabel = (type: InquiryProgressType): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getProgressTypeColor = (type: InquiryProgressType): string => {
  switch (type) {
    case 'phone_call':
      return 'bg-blue-100 text-blue-800';
    case 'site_visit':
      return 'bg-green-100 text-green-800';
    case 'follow_up':
      return 'bg-purple-100 text-purple-800';
    case 'negotiation':
      return 'bg-yellow-100 text-yellow-800';
    case 'document_collection':
      return 'bg-orange-100 text-orange-800';
    case 'payment_discussion':
      return 'bg-pink-100 text-pink-800';
    case 'deal_closure':
      return 'bg-teal-100 text-teal-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface InquiryData {
  "Remarks": string;
  "Last Remarks": string;
  "Client Name": string;
}

type InquiryProgressType = 
  | 'phone_call' 
  | 'site_visit' 
  | 'follow_up' 
  | 'meeting' 
  | 'email' 
  | 'negotiation'
  | 'document_collection'
  | 'payment_discussion'
  | 'deal_closure'
  | 'other';

interface InquiryProgressData {
  id: string;
  eid: string;
  progress_type: InquiryProgressType;
  remark: string;
  date: string;
  created_at: string;
}

// Fix the interface to match Next.js expectations
type PageProps = {
  params: {
    id: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
};

export default function InquiryProgressPage({ params, searchParams: _searchParams }: PageProps) {
  const { id } = params;
  const [progressHistory, setProgressHistory] = React.useState<InquiryProgressData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddProgress, setShowAddProgress] = React.useState(false);
  const [inquiryData, setInquiryData] = React.useState<InquiryData | null>(null);

  const fetchInquiryData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch old enquiry remarks and client name
      const { data: enquiryData, error: enquiryError } = await supabase
        .from('enquiries')
        .select('Remarks, "Last Remarks", "Client Name"')
        .eq('id', id)
        .single();

      if (enquiryError) throw enquiryError;
      
      const typedData: InquiryData = {
        "Remarks": enquiryData?.Remarks || '',
        "Last Remarks": enquiryData?.["Last Remarks"] || '',
        "Client Name": enquiryData?.["Client Name"] || ''
      };
      
      setInquiryData(typedData);

      // Fetch Inquiry_Progress data
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .select('*')
        .eq('eid', id)
        .order('created_at', { ascending: false });

      if (progressError) throw progressError;

      // Combine both types of data
      const combinedProgress: InquiryProgressData[] = [];

      // Add Inquiry_Progress entries
      if (progressData) {
        combinedProgress.push(...progressData);
      }

      // Add Last Remarks as the most recent item if it exists
      if (typedData["Last Remarks"]) {
        combinedProgress.push({
          id: 'last-remarks',
          eid: id,
          progress_type: 'follow_up' as InquiryProgressType,
          remark: typedData["Last Remarks"],
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      }

      // Add Remarks as an older item if it exists
      if (typedData["Remarks"]) {
        combinedProgress.push({
          id: 'remarks',
          eid: id,
          progress_type: 'phone_call' as InquiryProgressType,
          remark: typedData["Remarks"],
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 1 day ago
          created_at: new Date(Date.now() - 86400000).toISOString()
        });
      }

      setProgressHistory(combinedProgress);
    } catch (error) {
      console.error('Error fetching inquiry data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch inquiry data from Supabase
  React.useEffect(() => {
    fetchInquiryData();
  }, [fetchInquiryData]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              href={`/enquiry/${id}`}
              className="text-blue-500 hover:text-blue-600 mb-2 inline-block"
            >
              ← Back to Enquiry Details
            </Link>
            <h1 className="text-2xl font-bold">Inquiry Progress History</h1>
            {inquiryData && (
              <p className="text-gray-600 mt-1">Client: {inquiryData["Client Name"]}</p>
            )}
          </div>
          <button
            onClick={() => setShowAddProgress(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Progress
          </button>
        </div>
      </div>

      {/* Progress History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow-up Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {progressHistory.map((progress) => (
                  <tr key={progress.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {progress.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProgressTypeColor(progress.progress_type)}`}>
                        {getProgressTypeLabel(progress.progress_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {progress.remark}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(progress.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {progressHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No progress history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Progress Modal */}
      {showAddProgress && (
        <InquiryProgressForm
          inquiryId={id}
          onClose={() => setShowAddProgress(false)}
          onSuccess={fetchInquiryData}
        />
      )}
    </div>
  );
} 