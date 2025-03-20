import React from 'react';
import { supabase } from '../utils/supabase';

interface InquiryProgressFormProps {
  inquiryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InquiryProgressForm({ inquiryId, onClose, onSuccess }: InquiryProgressFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    progressType: 'phone_call',
    remarks: '',
    date: ''
  });

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

      // Insert into Inquiry_Progress table
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .insert({
          eid: inquiryId,
          progress_type: formData.progressType,
          remark: formData.remarks,
          date: formData.date,
          created_at: new Date().toISOString()
        })
        .select();

      if (progressError) {
        console.error('Progress insert error:', progressError);
        throw progressError;
      }

      // If we get here, everything was successful
      console.log('Progress saved successfully:', progressData);

      // Reset form and close modal
      setFormData({
        progressType: 'phone_call',
        remarks: '',
        date: ''
      });
      
      // Call success callback
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error saving progress:', error);
      if (error instanceof Error) {
        alert(`Error saving progress: ${error.message}`);
      } else {
        alert('Error saving progress. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Progress</h2>
          <button
            onClick={onClose}
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
              required
            >
              <option value="phone_call">Phone Call</option>
              <option value="site_visit">Site Visit</option>
              <option value="deal_done">Deal Done</option>
              <option value="deal_lost">Deal Lost</option>
              <option value="brochure_sent">Brochure and Details Sent</option>
              <option value="call_not_received">Call Not Received</option>
              <option value="phone_switch_off">Phone Switch Off</option>
              <option value="site_visit_schedule">Site Visit Schedule</option>
              <option value="hold">Hold for Some Time</option>
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
            <label className="block text-sm font-medium text-gray-700">Date (DD/MM/YYYY)</label>
            <input 
              type="text"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter date in DD/MM/YYYY format"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
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
  );
} 