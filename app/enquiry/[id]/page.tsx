'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { InquiryProgress, InquiryRemark } from '../../types/inquiry';
import InquiryProgressTracker from '../../components/InquiryProgress';
import RemarksHistory from '../../components/RemarksHistory';
import Link from 'next/link';

interface EnquiryDetails {
  id: string;
  clientName: string;
  contactNumber: string;
  propertyType: string;
  budget: string;
  source: string;
  assignedTo: string;
  createdAt: Date;
  status: string;
  requirements: string;
  progress: InquiryProgress[];
  remarks: InquiryRemark[];
}

const EnquiryDetailsPage = () => {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [showAddProgress, setShowAddProgress] = React.useState(false);
  const [showAddRemark, setShowAddRemark] = React.useState(false);

  // Sample data - replace with actual data from your backend
  const enquiry: EnquiryDetails = {
    id: id as string, // Use the ID from the route params
    clientName: 'ER Mrugesh Prajapati',
    contactNumber: '+91 1234567890',
    propertyType: 'Unknown',
    budget: '1 Thousand to 1 Crore',
    source: 'Facebook',
    assignedTo: 'Maulik Jadav',
    createdAt: new Date(),
    status: 'in_progress',
    requirements: 'Unknown - Unknown - Unknown',
    progress: [
      {
        id: '1',
        inquiryId: '1',
        progressType: 'site_visit',
        status: 'site_visit_scheduled',
        remarks: 'Scheduled site visit for next week',
        leadSource: 'Facebook',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'Maulik Jadav'
      }
    ],
    remarks: [
      {
        id: '1',
        inquiryId: '1',
        remark: 'Client requested additional property photos',
        createdAt: new Date(),
        createdBy: 'Maulik Jadav'
      },
      {
        id: '2',
        inquiryId: '1',
        remark: 'Scheduled site visit for next week',
        createdAt: new Date(Date.now() - 86400000),
        createdBy: 'Maulik Jadav'
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href="/enquiry/list"
            className="text-blue-500 hover:text-blue-600 mb-2 inline-block"
          >
            ← Back to Enquiries
          </Link>
          <h1 className="text-2xl font-bold">Enquiry Details</h1>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setShowAddProgress(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Progress
          </button>
          <button
            onClick={() => setShowAddRemark(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Remark
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Client Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Client Name</label>
              <p className="font-medium">{enquiry.clientName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Contact Number</label>
              <p className="font-medium">{enquiry.contactNumber}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Property Type</label>
              <p className="font-medium">{enquiry.propertyType}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Budget</label>
              <p className="font-medium">{enquiry.budget}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Source</label>
              <p className="font-medium">{enquiry.source}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Assigned To</label>
              <p className="font-medium">{enquiry.assignedTo}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Requirements</label>
              <p className="font-medium">{enquiry.requirements}</p>
            </div>
          </div>
        </div>

        {/* Progress History */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Current Progress</h2>
            {enquiry.progress.length > 0 && (
              <InquiryProgressTracker
                progress={enquiry.progress[enquiry.progress.length - 1]}
                isEditable={true}
                onStatusChange={(status) => console.log('Status changed:', status)}
                onRemarkAdd={(remark) => console.log('Remark added:', remark)}
              />
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Progress History</h2>
            <div className="space-y-4">
              {enquiry.progress.map((progress) => (
                <div
                  key={progress.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="font-medium">{progress.status.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-gray-500">{progress.remarks}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {progress.createdAt.toLocaleString()} by {progress.createdBy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Remarks History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Remarks History</h2>
          <RemarksHistory
            remarks={enquiry.remarks}
            isEditable={true}
            onEditRemark={(id, text) => console.log('Edit remark:', id, text)}
            onDeleteRemark={(id) => console.log('Delete remark:', id)}
          />
        </div>
      </div>

      {/* Add Progress Modal */}
      {showAddProgress && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Add Progress</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select className="w-full border rounded-md p-2">
                  <option value="in_progress">In Progress</option>
                  <option value="site_visit_scheduled">Site Visit Scheduled</option>
                  <option value="site_visit_done">Site Visit Done</option>
                  <option value="deal_succeeded">Deal Succeeded</option>
                  <option value="deal_lost">Deal Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={4}
                  placeholder="Add remarks about the progress..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddProgress(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Save Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Remark Modal */}
      {showAddRemark && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Add Remark</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remark
                </label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={4}
                  placeholder="Add your remark..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddRemark(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Save Remark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryDetailsPage; 