'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Enquiry } from '../../types';
import { addEnquiry } from '../../utils/localStorage';
import { useInitializeData } from '../../utils/initializeData';
import Link from 'next/link';

export default function NewEnquiry() {
  useInitializeData();
  
  const router = useRouter();

  const [formData, setFormData] = useState<Omit<Enquiry, 'id' | 'dateCreated'>>({
    clientName: '',
    mobile: '',
    configuration: '',
    description: '',
    source: 'REF',
    status: 'new',
    assignedEmployee: 'Rajdeep',
    category: 'new',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new enquiry with random ID and current date
    const newEnquiry: Enquiry = {
      ...formData,
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      dateCreated: new Date().toISOString(),
    };
    
    // Save to localStorage
    addEnquiry(newEnquiry);
    
    // Redirect to enquiry list
    router.push('/enquiry/list');
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
              <h1 className="text-3xl font-bold mb-2">Add New Enquiry</h1>
              <p className="text-[#e5d0b1] max-w-2xl">
                Capture and track new client interests and property requirements
              </p>
            </div>
            <Link 
              href="/enquiry/list" 
              className="mt-4 md:mt-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Enquiries
            </Link>
          </div>
        </div>
      </div>
      
      {/* Form Card */}
      <div className="max-w-4xl mx-auto">
        <div className="premium-card overflow-hidden scale-in">
          <div className="p-6 pb-0">
            <div className="mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Enquiry Details
              </h2>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Name */}
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  className="premium-input w-full"
                  placeholder="Enter client's full name"
                />
              </div>
              
              {/* Mobile Number */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  className="premium-input w-full"
                  placeholder="Enter client's mobile number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configuration */}
              <div>
                <label htmlFor="configuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Configuration (BHK)
                </label>
                <input
                  type="text"
                  id="configuration"
                  name="configuration"
                  value={formData.configuration}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 2BHK, 3BHK"
                  className="premium-input w-full"
                />
              </div>
              
              {/* Source */}
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="premium-input w-full"
                >
                  <option value="REF">Reference</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="SB-VAISHNO">SB-VAISHNO</option>
                  <option value="PORTAL">Portal</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="premium-input w-full"
                placeholder="Enter client's requirements and preferences"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="premium-input w-full"
                >
                  <option value="new">New</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="due">Due</option>
                </select>
              </div>
              
              {/* Assigned Employee */}
              <div>
                <label htmlFor="assignedEmployee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Employee
                </label>
                <select
                  id="assignedEmployee"
                  name="assignedEmployee"
                  value={formData.assignedEmployee}
                  onChange={handleChange}
                  className="premium-input w-full"
                >
                  <option value="Rajdeep">Rajdeep</option>
                  <option value="Rushiraj">Rushiraj</option>
                  <option value="Mantik">Mantik</option>
                </select>
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="premium-input w-full"
                >
                  <option value="new">New</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="due">Due</option>
                  <option value="weekend">Weekend</option>
                </select>
              </div>
            </div>
            
            {/* Follow-up Date (conditional) */}
            {formData.category === 'due' && (
              <div>
                <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  id="followUpDate"
                  name="followUpDate"
                  onChange={handleChange}
                  className="premium-input w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
            
            {/* Submit Button */}
            <div className="pt-4 flex space-x-4">
              <Link
                href="/enquiry/list"
                className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium w-full text-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="premium-button w-full flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Enquiry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 