'use client';

import React from 'react';
import Link from 'next/link';
import { InquiryProgress, InquiryProgressType } from '../../../types/inquiry';
import { supabase } from '../../../utils/supabase';

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
}

interface PageParams {
  params: {
    id: string;
  };
}

export default function InquiryProgressPage({ params }: PageParams) {
  const [progressHistory, setProgressHistory] = React.useState<InquiryProgress[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddProgress, setShowAddProgress] = React.useState(false);
  const [inquiryData, setInquiryData] = React.useState<InquiryData | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    progressType: 'phone_call',
    remarks: '',
    nextFollowUpDate: ''
  });

  const fetchInquiryData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('enquiries')
        .select('Remarks, "Last Remarks"')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      
      const typedData: InquiryData = {
        "Remarks": data?.Remarks || '',
        "Last Remarks": data?.["Last Remarks"] || ''
      };
      
      setInquiryData(typedData);

      // Create progress history from remarks
      if (typedData) {
        const progressItems: InquiryProgress[] = [];
        
        // Add Last Remarks as the most recent item if it exists
        if (typedData["Last Remarks"]) {
          progressItems.push({
            id: '1',
            inquiryId: params.id,
            progressType: 'follow_up',
            status: 'in_progress',
            remarks: typedData["Last Remarks"],
            leadSource: 'System',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'System'
          });
        }

        // Add Remarks as an older item if it exists
        if (typedData["Remarks"]) {
          progressItems.push({
            id: '2',
            inquiryId: params.id,
            progressType: 'phone_call',
            status: 'in_progress',
            remarks: typedData["Remarks"],
            leadSource: 'System',
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
            updatedAt: new Date(Date.now() - 86400000),
            createdBy: 'System'
          });
        }

        setProgressHistory(progressItems);
      }
    } catch (error) {
      console.error('Error fetching inquiry data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch inquiry data from Supabase
  React.useEffect(() => {
    fetchInquiryData();
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);

      // Get current inquiry data
      const { data: currentData, error: fetchError } = await supabase
        .from('enquiries')
        .select('Remarks, "Last Remarks"')
        .eq('id', params.id)
        .single();

      if (fetchError) throw fetchError;

      // Update the inquiry with new remarks
      const { error: updateError } = await supabase
        .from('enquiries')
        .update({
          "Remarks": currentData?.["Last Remarks"] || '', // Move current Last Remarks to Remarks
          "Last Remarks": formData.remarks, // Set new remarks as Last Remarks
          "NFD": formData.nextFollowUpDate || null // Update NFD if provided
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Refresh the data
      await fetchInquiryData();
      
      // Reset form and close modal
      setFormData({
        progressType: 'phone_call',
        remarks: '',
        nextFollowUpDate: ''
      });
      setShowAddProgress(false);

    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Error saving progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              href={`/enquiry/${params.id}`}
              className="text-blue-500 hover:text-blue-600 mb-2 inline-block"
            >
              ← Back to Enquiry Details
            </Link>
            <h1 className="text-2xl font-bold">Inquiry Progress History</h1>
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
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Follow-up
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {progressHistory.map((progress) => (
                  <tr key={progress.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {progress.createdAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProgressTypeColor(progress.progressType)}`}>
                        {getProgressTypeLabel(progress.progressType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {progress.remarks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {progress.nextFollowUpDate?.toLocaleDateString() || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {progress.createdBy}
                    </td>
                  </tr>
                ))}
                {progressHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Progress</h2>
              <button
                onClick={() => setShowAddProgress(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Progress Type</label>
                <select
                  name="progressType"
                  value={formData.progressType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="phone_call">Phone Call</option>
                  <option value="site_visit">Site Visit</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="document_collection">Document Collection</option>
                  <option value="payment_discussion">Payment Discussion</option>
                  <option value="deal_closure">Deal Closure</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea 
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter remarks..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Next Follow-up Date</label>
                <input 
                  type="date"
                  name="nextFollowUpDate"
                  value={formData.nextFollowUpDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddProgress(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Progress'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 