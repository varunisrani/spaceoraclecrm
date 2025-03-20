'use client';

import React from 'react';
import Link from 'next/link';
import { InquiryProgress, InquiryProgressType } from '../../../types/inquiry';

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

export default function InquiryProgressPage({ params }: { params: { id: string } }) {
  const [progressHistory, setProgressHistory] = React.useState<InquiryProgress[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddProgress, setShowAddProgress] = React.useState(false);

  // Sample data - replace with actual API call
  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProgressHistory([
        {
          id: '1',
          inquiryId: params.id,
          progressType: 'phone_call',
          status: 'in_progress',
          remarks: 'Initial contact made with client',
          leadSource: 'Facebook',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'Maulik Jadav',
          outcome: 'Positive response',
          nextFollowUpDate: new Date(Date.now() + 86400000)
        },
        // Add more sample progress items as needed
      ]);
      setIsLoading(false);
    }, 1000);
  }, [params.id]);

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
                      {progress.nextFollowUpDate?.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {progress.createdBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Progress Modal */}
      {showAddProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New Progress</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Progress Type</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="brochure">Brochurer</option>
                  <option value="call_not_received">Call Not Received</option>
                  <option value="phone_switched_off">Phone Switched Off</option>
        
                  <option value="hold_for_something">Hold for Something</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="site_visit">Site Visit</option>
                  <option value="deal_done">Deal Done</option>
                  <option value="deal_lost">Deal Lost</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter remarks..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Next Follow-up Date</label>
                <input 
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddProgress(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 