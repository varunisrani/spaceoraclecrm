'use client';

import { useEffect, useState } from 'react';
import { SiteVisit, Enquiry } from '../types';
import { getSiteVisits, getEnquiries, addSiteVisit } from '../utils/localStorage';
import { useInitializeData } from '../utils/initializeData';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';

export default function SiteVisits() {
  useInitializeData();
  
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<SiteVisit, 'id'>>({
    enquiryId: '',
    clientName: '',
    date: '',
    time: '',
    status: 'pending',
    assignedEmployee: '',
    notes: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVisits, setFilteredVisits] = useState<SiteVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load site visits and enquiries from localStorage
  useEffect(() => {
    const visits = getSiteVisits();
    const allEnquiries = getEnquiries();
    
    setSiteVisits(visits);
    setFilteredVisits(visits);
    setEnquiries(allEnquiries);
    
    // Simulate loading for UI polish
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'enquiryId' && value) {
      // Auto-populate client name and assigned employee when enquiry is selected
      const selectedEnquiry = enquiries.find(e => e.id === value);
      if (selectedEnquiry) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          clientName: selectedEnquiry.clientName,
          assignedEmployee: selectedEnquiry.assignedEmployee
        }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new site visit with random ID
    const newSiteVisit: SiteVisit = {
      ...formData,
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    };
    
    // Save to localStorage
    addSiteVisit(newSiteVisit);
    
    // Update state
    setSiteVisits(prev => [...prev, newSiteVisit]);
    setFilteredVisits(prev => [...prev, newSiteVisit]);
    
    // Reset form
    setFormData({
      enquiryId: '',
      clientName: '',
      date: '',
      time: '',
      status: 'pending',
      assignedEmployee: '',
      notes: ''
    });
    
    // Hide form
    setShowAddForm(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredVisits(siteVisits);
      return;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    
    const filtered = siteVisits.filter(visit => 
      visit.clientName.toLowerCase().includes(lowerCaseQuery) ||
      visit.time.toLowerCase().includes(lowerCaseQuery) || 
      visit.assignedEmployee.toLowerCase().includes(lowerCaseQuery) ||
      (visit.notes && visit.notes.toLowerCase().includes(lowerCaseQuery)) ||
      new Date(visit.date).toLocaleDateString().includes(lowerCaseQuery)
    );
    
    setFilteredVisits(filtered);
  };

  // Group site visits by date
  const groupedVisits: Record<string, SiteVisit[]> = {};
  
  filteredVisits.forEach(visit => {
    const date = new Date(visit.date).toDateString();
    if (!groupedVisits[date]) {
      groupedVisits[date] = [];
    }
    groupedVisits[date].push(visit);
  });

  // Sort dates
  const sortedDates = Object.keys(groupedVisits).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  // Update visit status
  const handleStatusChange = (visitId: string, status: 'pending' | 'completed' | 'cancelled') => {
    const updatedVisits = siteVisits.map(visit => {
      if (visit.id === visitId) {
        return { ...visit, status };
      }
      return visit;
    });
    
    setSiteVisits(updatedVisits);
    setFilteredVisits(updatedVisits);
    
    // This would also update localStorage in a real implementation
    // For now, just updating the UI state
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
              <h1 className="text-3xl font-bold mb-2">Site Visit Schedule</h1>
              <p className="text-[#e5d0b1] max-w-2xl">
                Manage and track all property visits for your clients
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="mt-4 md:mt-0 premium-button-accent flex items-center gap-2 self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                {showAddForm ? (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                )}
              </svg>
              {showAddForm ? 'Cancel' : 'Schedule New Visit'}
            </button>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <SearchBar onSearch={handleSearch} placeholder="Search by client, date, employee..." />
          </div>
        </div>
      </div>
      
      {/* Add Site Visit Form */}
      {showAddForm && (
        <div className="premium-card mb-8 scale-in">
          <div className="p-6">
            <div className="mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Schedule New Site Visit
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Enquiry Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="enquiryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Enquiry
                  </label>
                  <select
                    id="enquiryId"
                    name="enquiryId"
                    value={formData.enquiryId}
                    onChange={handleChange}
                    required
                    className="premium-input w-full"
                  >
                    <option value="">-- Select an Enquiry --</option>
                    {enquiries.map(enquiry => (
                      <option key={enquiry.id} value={enquiry.id}>
                        {enquiry.clientName} - {enquiry.configuration}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Client Name (read-only if enquiry selected) */}
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
                    readOnly={!!formData.enquiryId}
                    className={`premium-input w-full ${formData.enquiryId ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visit Date */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Visit Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="premium-input w-full"
                  />
                </div>
                
                {/* Visit Time */}
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Visit Time
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="premium-input w-full"
                  />
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
                    required
                    className="premium-input w-full"
                  >
                    <option value="">-- Select an Employee --</option>
                    <option value="Rajdeep">Rajdeep</option>
                    <option value="Rushiraj">Rushiraj</option>
                    <option value="Mantik">Mantik</option>
                  </select>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="premium-input w-full"
                />
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="premium-button w-full flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Schedule Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c69c6d]"></div>
        </div>
      )}
      
      {/* Site Visits Schedule */}
      {!isLoading && (
        <>
          {sortedDates.length === 0 && (
            <div className="premium-card text-center py-16">
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-medium mb-2">No site visits scheduled yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  Schedule your first site visit to start tracking property visits with clients.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="premium-button-accent flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Schedule New Visit
                </button>
              </div>
            </div>
          )}
          
          {searchQuery && filteredVisits.length === 0 && (
            <div className="premium-card text-center py-12">
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium mb-1">No results found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">No site visits match your search criteria</p>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="premium-card overflow-hidden">
                <div className="p-6 pb-0">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center">
                      <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {groupedVisits[date].length} Visit{groupedVisits[date].length !== 1 ? 's' : ''}
                      </span>
                      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {groupedVisits[date].map(visit => (
                      <div key={visit.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 flex items-center justify-center text-[#1a2e29] dark:text-[#c69c6d]">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">{visit.clientName}</h3>
                              <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{visit.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>{visit.assignedEmployee}</span>
                                </div>
                              </div>
                              {visit.notes && (
                                <p className="mt-3 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                  {visit.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 md:items-end">
                            <StatusBadge status={visit.status} type="visit" />
                            
                            {/* Action buttons */}
                            <div className="flex gap-2 mt-2">
                              {visit.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleStatusChange(visit.id, 'completed')}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                  >
                                    Mark Completed
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(visit.id, 'cancelled')}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {visit.status === 'completed' && (
                                <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d] hover:bg-[#1a2e29]/20 dark:hover:bg-[#c69c6d]/20 transition-colors">
                                  Add Feedback
                                </button>
                              )}
                              {visit.status === 'cancelled' && (
                                <button 
                                  onClick={() => handleStatusChange(visit.id, 'pending')}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  Reschedule
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 