'use client';

import { useEffect, useState } from 'react';
import { Enquiry } from '../../types';
import { getEnquiries, deleteEnquiry } from '../../utils/localStorage';
import { useInitializeData } from '../../utils/initializeData';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import Link from 'next/link';
import { InquiryProgress, InquiryRemark } from '../../types/inquiry';
import InquiryProgressTracker from '../../components/InquiryProgress';
import RemarksHistory from '../../components/RemarksHistory';
import EditInquiryForm from '../../components/EditInquiryForm';

export default function EnquiryList() {
  useInitializeData();
  
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterEmployee, setFilterEmployee] = useState<string>('ALL');
  const [selectedEnquiry, setSelectedEnquiry] = useState<string | null>(null);
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [selectedEnquiries, setSelectedEnquiries] = useState<string[]>([]);
  const [showEditInquiry, setShowEditInquiry] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Enquiry | null>(null);
  
  // Get category from URL query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const categoryFilter = searchParams.get('category');
  
  // Load enquiries from localStorage
  useEffect(() => {
    const allEnquiries = getEnquiries();
    setEnquiries(allEnquiries);
    
    // Apply initial filtering based on URL category parameter
    let filtered = [...allEnquiries];
    
    if (categoryFilter) {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }
    
    // Apply other filters
    if (filterSource !== 'ALL') {
      filtered = filtered.filter(e => e.source === filterSource);
    }
    
    if (filterEmployee !== 'ALL') {
      filtered = filtered.filter(e => e.assignedEmployee === filterEmployee);
    }
    
    setFilteredEnquiries(filtered);
    
    // Simulate loading for UI polish
    setTimeout(() => setIsLoading(false), 500);
  }, [categoryFilter, filterSource, filterEmployee]);
  
  // Update filters whenever filter state changes
  useEffect(() => {
    let filtered = [...enquiries];
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }
    
    // Apply source filter
    if (filterSource !== 'ALL') {
      filtered = filtered.filter(e => e.source === filterSource);
    }
    
    // Apply employee filter
    if (filterEmployee !== 'ALL') {
      filtered = filtered.filter(e => e.assignedEmployee === filterEmployee);
    }
    
    setFilteredEnquiries(filtered);
  }, [filterSource, filterEmployee, enquiries, categoryFilter]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      // Reset to filtered state (respecting other filters)
      let filtered = [...enquiries];
      
      if (filterSource !== 'ALL') {
        filtered = filtered.filter(e => e.source === filterSource);
      }
      
      if (filterEmployee !== 'ALL') {
        filtered = filtered.filter(e => e.assignedEmployee === filterEmployee);
      }
      
      setFilteredEnquiries(filtered);
      return;
    }
    
    const searchTerms = query.toLowerCase().split(' ');
    
    const searchResults = enquiries.filter(enquiry => {
      // Apply other filters first
      if (filterSource !== 'ALL' && enquiry.source !== filterSource) return false;
      if (filterEmployee !== 'ALL' && enquiry.assignedEmployee !== filterEmployee) return false;
      
      // Then apply search
      return searchTerms.some(term => 
        enquiry.clientName.toLowerCase().includes(term) ||
        enquiry.mobile.includes(term) ||
        enquiry.configuration.toLowerCase().includes(term) ||
        enquiry.description.toLowerCase().includes(term)
      );
    });
    
    setFilteredEnquiries(searchResults);
  };
  
  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  
  const handleDelete = () => {
    if (deleteId) {
      deleteEnquiry(deleteId);
      
      // Update local state
      const updatedEnquiries = enquiries.filter(e => e.id !== deleteId);
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(filteredEnquiries.filter(e => e.id !== deleteId));
      
      // Close modal
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const handleAddProgress = (enquiryId: string) => {
    setSelectedEnquiry(enquiryId);
    setShowAddProgress(true);
  };

  const handleEdit = (inquiry: Enquiry) => {
    setEditingInquiry(inquiry);
    setShowEditInquiry(true);
  };

  const handleSaveEdit = (updatedInquiry: Enquiry) => {
    // Update in localStorage
    const updatedEnquiries = enquiries.map(e => 
      e.id === updatedInquiry.id ? updatedInquiry : e
    );
    setEnquiries(updatedEnquiries);
    setFilteredEnquiries(updatedEnquiries);
    setShowEditInquiry(false);
    setEditingInquiry(null);
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
              <h1 className="text-3xl font-bold mb-2">
                {categoryFilter ? (
                  `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Enquiries`
                ) : (
                  'All Enquiries'
                )}
              </h1>
              <p className="text-[#e5d0b1] max-w-2xl">
                {categoryFilter ? (
                  `Viewing ${categoryFilter} enquiries`
                ) : (
                  'Track, manage, and optimize your client enquiries'
                )}
              </p>
            </div>
            <Link 
              href="/enquiry/new" 
              className="mt-4 md:mt-0 premium-button-accent flex items-center gap-2 self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Enquiry
            </Link>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <SearchBar onSearch={handleSearch} placeholder="Search by name, phone, property..." />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="relative">
              <select 
                className="appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-[#c69c6d] focus:outline-none"
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
              >
                <option value="ALL">All Employees</option>
                <option value="Rajdeep">Rajdeep</option>
                <option value="Rushiraj">Rushiraj</option>
                <option value="Mantik">Mantik</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <select 
                className="appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-[#c69c6d] focus:outline-none"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
              >
                <option value="ALL">All Sources</option>
                <option value="REF">Reference</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="SB-VAISHNO">SB-VAISHNO</option>
                <option value="PORTAL">Portal</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {categoryFilter && (
              <button
                onClick={() => {
                  // Remove category filter from URL and reset filtering
                  const url = new URL(window.location.href);
                  url.searchParams.delete('category');
                  window.history.pushState({}, '', url);
                  window.location.reload();
                }}
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <span>Clear {categoryFilter} filter</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Enquiry Data Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
              Enquiry List
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredEnquiries.length} of {enquiries.length} enquiries
              </span>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
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
                  <th className="w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#c69c6d] focus:ring-[#c69c6d]"
                      onChange={(e) => {
                        // Handle select all
                        const checked = e.target.checked;
                        const newSelected = checked ? filteredEnquiries.map(e => e.id) : [];
                        setSelectedEnquiries(newSelected);
                      }}
                      checked={selectedEnquiries.length === filteredEnquiries.length && filteredEnquiries.length > 0}
                    />
                  </th>
                  <th>Client</th>
                  <th>Configuration</th>
                  <th>Source</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Last Remark</th>
                  <th>Date Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map(enquiry => (
                  <tr key={enquiry.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#c69c6d] focus:ring-[#c69c6d]"
                        checked={selectedEnquiries.includes(enquiry.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedEnquiries(prev => 
                            checked 
                              ? [...prev, enquiry.id]
                              : prev.filter(id => id !== enquiry.id)
                          );
                        }}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 rounded-full bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 items-center justify-center text-[#1a2e29] dark:text-[#c69c6d]">
                          {enquiry.clientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{enquiry.clientName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{enquiry.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{enquiry.configuration}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{enquiry.description}</div>
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {enquiry.source === 'REF' ? 'Reference' : 
                        enquiry.source === 'FACEBOOK' ? 'Facebook' : 
                        enquiry.source === 'SB-VAISHNO' ? 'SB-VAISHNO' : 'Portal'}
                      </div>
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {enquiry.assignedEmployee}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={enquiry.status} type="enquiry" />
                    </td>
                    <td>
                      <div className="max-w-[200px]">
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {enquiry.lastRemark || 'No remarks yet'}
                        </div>
                        {enquiry.lastRemarkDate && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(enquiry.lastRemarkDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {new Date(enquiry.dateCreated).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/enquiry/${enquiry.id}/progress`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                          title="View progress history"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleEdit(enquiry)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                          title="Edit inquiry"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <Link
                          href={`/enquiry/${enquiry.id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                          title="View details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleAddProgress(enquiry.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                          title="Add progress"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(enquiry.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                          title="Delete inquiry"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredEnquiries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No enquiries found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters or search criteria</p>
                        <Link href="/enquiry/new" className="premium-button-accent">
                          Add New Enquiry
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-[#111f1c] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-[#111f1c] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete Enquiry
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this enquiry? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/30 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c69c6d] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Progress Modal */}
      {showAddProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Progress</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Progress Type</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="phone_call">Phone Call</option>
                  <option value="site_visit">Site Visit</option>
                  <option value="discussion">Discussion</option>
                  <option value="deal_success">Deal Success</option>
                  <option value="deal_loss">Deal Loss</option>
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

      {/* Edit Inquiry Modal */}
      {showEditInquiry && editingInquiry && (
        <EditInquiryForm
          inquiry={editingInquiry}
          onSave={handleSaveEdit}
          onCancel={() => {
            setShowEditInquiry(false);
            setEditingInquiry(null);
          }}
        />
      )}
    </div>
  );
} 