'use client';

import React from 'react';
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
  const fetchTodaysSiteVisits = async () => {
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
  };

  // Fetch site visits when component mounts
  React.useEffect(() => {
    fetchTodaysSiteVisits();
  }, []);

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-14 px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Today's Site Visits
          </h1>
          <p className="text-[#e5d0b1] text-lg md:text-xl max-w-3xl mx-auto">
            Site visits scheduled for {getTodayDate()}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Today's Site Visit Details
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visit Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enquiry ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {siteVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#1a2e29]/10 rounded-full flex items-center justify-center text-[#1a2e29]">
                              {visit.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{visit.clientName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visit.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Link 
                            href={`/enquiry/${visit.eid}`}
                            className="text-blue-600 hover:underline"
                          >
                            {visit.eid}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {visit.progress_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {visit.remark}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-gray-500">
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