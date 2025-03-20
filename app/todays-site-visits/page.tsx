'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

interface SiteVisit {
  id: string;
  eid: string;
  progress_type: string;
  remark: string;
  date: string;
  clientName: string;
  created_at: string;
}

export default function TodaysSiteVisitsPage() {
  const [siteVisits, setSiteVisits] = React.useState<SiteVisit[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Function to get today's date in DD/MM/YYYY format
  const getTodayDate = () => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  };

  // Fetch site visits from Inquiry_Progress table
  const fetchTodaysSiteVisits = useCallback(async () => {
    try {
      setIsLoading(true);
      const todayDate = getTodayDate();
      
      // Query Inquiry_Progress table for site visits scheduled today
      const { data, error } = await supabase
        .from('Inquiry_Progress')
        .select('*, enquiries:eid("Client Name")') // Join with enquiries table to get client name
        .eq('progress_type', 'site_visit_schedule')
        .eq('date', todayDate);

      if (error) throw error;

      // Transform the data into SiteVisit format
      const visits: SiteVisit[] = (data || []).map(item => ({
        id: item.id || '',
        eid: item.eid || '',
        progress_type: item.progress_type || '',
        remark: item.remark || '',
        date: item.date || '',
        clientName: item.enquiries?.["Client Name"] || 'Unknown Client',
        created_at: item.created_at || new Date().toISOString()
      }));

      setSiteVisits(visits);
    } catch (error) {
      console.error('Error fetching today\'s site visits:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch site visits when component mounts
  React.useEffect(() => {
    fetchTodaysSiteVisits();
  }, [fetchTodaysSiteVisits]);

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-14 px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Today&apos;s Site Visits
          </h1>
          <p className="text-[#e5d0b1] text-lg md:text-xl max-w-3xl mx-auto">
            Site visits scheduled for {getTodayDate()}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="premium-card overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Today&apos;s Site Visit Details
              </h2>
              <Link 
                href="/site-visits"
                className="premium-button"
              >
                View All Site Visits
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c69c6d]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {siteVisits.length > 0 ? (
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Visit Date</th>
                      <th>Enquiry ID</th>
                      <th>Progress Type</th>
                      <th>Remarks</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#1a2e29]/10 rounded-full flex items-center justify-center text-[#1a2e29]">
                              {visit.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{visit.clientName}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-gray-500">
                            {visit.date}
                          </div>
                        </td>
                        <td>
                          <Link 
                            href={`/enquiry/${visit.eid}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d] hover:bg-[#1a2e29]/20 transition-colors"
                          >
                            {visit.eid}
                          </Link>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {visit.progress_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="max-w-[200px]">
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {visit.remark}
                            </div>
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/enquiry/${visit.eid}/progress`}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                              title="View progress history"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-lg font-medium">No site visits scheduled for today</div>
                  <p className="mt-2">There are no site visits scheduled for {getTodayDate()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 