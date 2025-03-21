'use client';

import { useEffect, useState, Suspense } from 'react';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { supabase } from '../../utils/supabase';
import { useSearchParams } from 'next/navigation';

interface Enquiry {
  id: number;
  "Client Name": string;
  "Mobile": string;
  "Email": string;
  "Enquiry For": string;
  "Property Type": string;
  "Assigned To": string;
  "Created Date": string;
  "Enquiry Progress": string;
  "Budget": string;
  "NFD": string;
  "Remarks": string;
  "Favourite": string;
  "Near to Win": string;
  "Enquiry Source": string;
  "Assigned By": string;
  "Area": string;
  "Configuration": string;
  "Last Remarks": string;
}

// Separate component that uses searchParams
function SearchParamsHandler({ onSearchChange, onCategoryChange }: { 
  onSearchChange: (search: string) => void,
  onCategoryChange: (category: string) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    
    console.log('Search params detected:', { search, category });
    
    if (search) {
      console.log('Setting search query from URL param:', search);
      onSearchChange(search);
    } else if (category) {
      // Handle category filtering
      console.log('Category detected:', category);
      onCategoryChange(category);
    }
  }, [searchParams, onSearchChange, onCategoryChange]);
  
  return null; // This component doesn't render anything
}

export default function EnquiryList() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterEmployee, setFilterEmployee] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('');

  // Function to fetch enquiries
  const fetchEnquiries = async (query: string, source: string, employee: string, category?: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching enquiries with params:', { query, source, employee, category });
      
      let supabaseQuery = supabase
        .from('enquiries')
        .select('*');

      // Date regex pattern for DD/MM/YYYY format
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      
      // Apply category filter for 'due' - dates earlier than yesterday
      if (category === 'due') {
        console.log('Filtering for due category (dates earlier than yesterday)');
        
        // Get yesterday's date in DD/MM/YYYY format
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayFormatted = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;
        
        // We'll fetch all and filter client-side for dates before yesterday
        // (Since Supabase doesn't support date comparisons directly with DD/MM/YYYY format)
      }
      // Apply search filter if query exists
      else if (query) {
        // Check if the query contains comma-separated dates
        if (query.includes(',')) {
          const dates = query.split(',');
          console.log('Filtering by multiple dates:', dates);
          supabaseQuery = supabaseQuery.in('NFD', dates);
        } else {
          // Check if the query is a single date in DD/MM/YYYY format
          if (dateRegex.test(query)) {
            console.log('Filtering by exact date:', query);
            supabaseQuery = supabaseQuery.eq('NFD', query);
          } else {
            // Fix: Use proper format for OR conditions in Supabase
            console.log('Filtering by text search:', query);
            supabaseQuery = supabaseQuery.or(`"Client Name".ilike.%${query}%,"Mobile".ilike.%${query}%`);
          }
        }
      }

      // Apply source filter
      if (source !== 'ALL') {
        // Match exact source value from dropdown to database column
        console.log('Filtering by source:', source);
        supabaseQuery = supabaseQuery.eq('Enquiry Source', source);
      }

      // Apply employee filter
      if (employee !== 'ALL') {
        console.log('Filtering by employee:', employee);
        supabaseQuery = supabaseQuery.eq('Assigned To', employee);
      }

      // Order by created date
      supabaseQuery = supabaseQuery.order('Created Date', { ascending: false });

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Supabase query error:', error); // Debug log
        throw error;
      }

      if (data) {
        console.log('Fetched data count:', data.length);
        
        // Check if we're filtering by today's date, and show some NFD values
        if (dateRegex.test(query)) {
          console.log('NFD values in results:', data.map(item => item.NFD));
        }
        
        // Additional client-side filtering for 'due' category
        let filteredData = data;
        
        if (category === 'due') {
          // Get yesterday's date for comparison
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          
          // Filter for dates before yesterday
          filteredData = data.filter(enquiry => {
            if (!enquiry.NFD) return false;
            
            // Parse the NFD date (DD/MM/YYYY)
            const [day, month, year] = enquiry.NFD.split('/').map(Number);
            
            // Create Date objects for comparison (month is 0-indexed in JavaScript)
            const nfdDate = new Date(year, month - 1, day);
            const yesterdayDate = new Date(
              yesterday.getFullYear(),
              yesterday.getMonth(),
              yesterday.getDate()
            );
            
            // Return true if the NFD date is before yesterday
            return nfdDate < yesterdayDate;
          });
          
          console.log('Due enquiries after filtering (dates before yesterday):', filteredData.length);
        }
        
        setEnquiries(data);
        setFilteredEnquiries(filteredData);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEnquiries(searchQuery, filterSource, filterEmployee, currentCategory);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, filterSource, filterEmployee, currentCategory]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentCategory(''); // Clear category when searching explicitly
  };

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
    setSearchQuery(''); // Clear search query when filtering by category
  };

  return (
    <div className="fade-in">
      {/* SearchParams Handling (wrapped in Suspense) */}
      <Suspense fallback={null}>
        <SearchParamsHandler onSearchChange={setSearchQuery} onCategoryChange={handleCategoryChange} />
      </Suspense>
      
      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-12 px-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              {currentCategory === 'due' ? (
                <>
                  <h1 className="text-3xl font-bold mb-2">Due Inquiries</h1>
                  <p className="text-[#e5d0b1] max-w-2xl">
                    All inquiries with follow-up dates before yesterday
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2">All Enquiries</h1>
                  <p className="text-[#e5d0b1] max-w-2xl">
                    Track, manage, and optimize your client enquiries
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search by client name, phone number, or date (DD/MM/YYYY)..." 
              defaultValue={searchQuery}
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-6">
            {/* Source Filter */}
            <div className="relative flex-1 max-w-xs">
              <label className="block text-sm text-[#e5d0b1] mb-1">Filter by Source</label>
              <select 
                className="w-full appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-[#c69c6d] focus:outline-none"
                value={filterSource}
                onChange={(e) => {
                  console.log('Selected source:', e.target.value); // Debug log
                  setFilterSource(e.target.value);
                }}
              >
                <option value="ALL">All Sources</option>
                <option value="Facebook">Facebook</option>
                <option value="Reference">Reference</option>
              </select>
              <div className="absolute right-3 top-[34px] pointer-events-none">
                <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Employee Filter */}
            <div className="relative flex-1 max-w-xs">
              <label className="block text-sm text-[#e5d0b1] mb-1">Filter by Employee</label>
              <select 
                className="w-full appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-[#c69c6d] focus:outline-none"
                value={filterEmployee}
                onChange={(e) => {
                  console.log('Selected employee:', e.target.value); // Debug log
                  setFilterEmployee(e.target.value);
                }}
              >
                <option value="ALL">All Employees</option>
                <option value="Rushirajsinh, Zala">Rushirajsinh, Zala</option>
                <option value="Maulik, Jadav">Maulik, Jadav</option>
                <option value="Rajdeepsinh, Jadeja">Rajdeepsinh, Jadeja</option>
              </select>
              <div className="absolute right-3 top-[34px] pointer-events-none">
                <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Filter Stats */}
            {(filterSource !== 'ALL' || filterEmployee !== 'ALL') && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterSource('ALL');
                    setFilterEmployee('ALL');
                  }}
                  className="text-[#e5d0b1] hover:text-white flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Clear Filters
                </button>
              </div>
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
                  <th>Client</th>
                  <th>Configuration</th>
                  <th>Source</th>
                  <th>Assigned To</th>
                  <th>Progress</th>
                  <th>Next Follow-up</th>
                  <th>Last Remarks</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map(enquiry => (
                  <tr key={enquiry.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/enquiry/${enquiry.id}/edit`}
                            className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                            title="Edit Inquiry"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/enquiry/${enquiry.id}/progress`}
                            className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                            title="Add Progress"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        </div>
                        <div>
                          <div className="font-medium">{enquiry["Client Name"]}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{enquiry["Mobile"]}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{enquiry["Configuration"] === 'Unknown' ? 'N/A' : enquiry["Configuration"] || 'N/A'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{enquiry["Property Type"] === 'Unknown' ? 'N/A' : enquiry["Property Type"] || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {enquiry["Enquiry Source"]}
                      </div>
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {enquiry["Assigned To"]}
                      </div>
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {enquiry["Enquiry Progress"]}
                      </div>
                    </td>
                    <td>
                      {enquiry["NFD"] || '-'}
                    </td>
                    <td>
                      <div className="max-w-[200px]">
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {enquiry["Last Remarks"] || 'No remarks yet'}
                        </div>
                      </div>
                    </td>
                    <td>
                      {enquiry["Created Date"] || '-'}
                    </td>
                  </tr>
                ))}
                
                {filteredEnquiries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No enquiries found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters or search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 