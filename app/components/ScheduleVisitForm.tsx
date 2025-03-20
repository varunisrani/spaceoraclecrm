import React from 'react';
import { SiteVisitStatus } from '../types/inquiry';
import { Enquiry } from '../types';
import { getEnquiries } from '../utils/localStorage';

interface ScheduleVisitFormProps {
  onClose: () => void;
  onSubmit: (visit: Omit<SiteVisitStatus, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => void;
}

export default function ScheduleVisitForm({ onClose, onSubmit }: ScheduleVisitFormProps) {
  const [enquiries, setEnquiries] = React.useState<Enquiry[]>([]);
  const [formData, setFormData] = React.useState({
    inquiryId: '',
    clientName: '',
    scheduledDate: '',
    scheduledTime: '',
    status: 'scheduled' as const,
    remarks: '',
    assignedTo: 'Rajdeep',
  });

  // Load enquiries when component mounts
  React.useEffect(() => {
    const allEnquiries = getEnquiries();
    setEnquiries(allEnquiries);
  }, []);

  const handleEnquiryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEnquiry = enquiries.find(enq => enq.id === e.target.value);
    if (selectedEnquiry) {
      setFormData(prev => ({
        ...prev,
        inquiryId: selectedEnquiry.id,
        clientName: selectedEnquiry.clientName,
        assignedTo: selectedEnquiry.assignedEmployee
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time into a string
    const scheduledDateTime = `${formData.scheduledDate}T${formData.scheduledTime}`;
    
    onSubmit({
      inquiryId: formData.inquiryId,
      clientName: formData.clientName,
      scheduledDate: scheduledDateTime,
      status: formData.status,
      remarks: formData.remarks,
      assignedTo: formData.assignedTo,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Schedule New Site Visit</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Enquiry
            </label>
            <select
              value={formData.inquiryId}
              onChange={handleEnquiryChange}
              className="premium-input w-full"
              required
            >
              <option value="">Select an enquiry</option>
              {enquiries.map(enquiry => (
                <option key={enquiry.id} value={enquiry.id}>
                  {enquiry.clientName} - {enquiry.configuration} ({enquiry.mobile})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={formData.clientName}
                readOnly
                className="premium-input w-full bg-gray-50"
                placeholder="Client name will be auto-filled"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                readOnly
                className="premium-input w-full bg-gray-50"
                placeholder="Will be auto-assigned"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visit Date
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className="premium-input w-full"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visit Time
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="premium-input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="premium-input w-full"
              rows={3}
              placeholder="Add any remarks about the site visit..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="premium-button"
            >
              Schedule Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 