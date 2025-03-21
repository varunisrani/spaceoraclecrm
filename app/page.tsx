'use client';

import { useEffect, useState } from 'react';
import { Enquiry, DashboardStats, InquirySource } from './types';
import { getEnquiries } from './utils/localStorage';
import { useInitializeData } from './utils/initializeData';
import SearchBar from './components/SearchBar';
import Link from 'next/link';
import { supabase } from './utils/supabase';

// Commented out as it's not currently used
// interface EnquiryCount {
//   total: number;
//   new: number;
// }

// Commented out as it's not currently used
// const DashboardMetricCard = ({ label, value, trend }: { label: string; value: number; trend?: number }) => (
//   <div className="bg-white rounded-lg shadow p-6">
//     <h3 className="text-gray-500 text-sm mb-1">{label}</h3>
//     <div className="flex items-end space-x-2">
//       <p className="text-2xl font-bold">{value}</p>
//       {trend !== undefined && (
//         <span className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
//           {trend >= 0 ? '+' : ''}{trend}%
//         </span>
//       )}
//     </div>
//   </div>
// );

export default function Home() {
  useInitializeData();
  
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    newEnquiries: 0,
    pendingSiteVisits: 0,
    totalSales: 0
  });
  
  const [categorizedEnquiries, setCategorizedEnquiries] = useState<{
    new: Enquiry[],
    today: Enquiry[],
    yesterday: Enquiry[],
    due: Enquiry[],
    weekend: Enquiry[]
  }>({
    new: [],
    today: [],
    yesterday: [],
    due: [],
    weekend: []
  });

  const [isLoading, setIsLoading] = useState(true);
  
  // Function to fetch enquiry counts from Supabase
  const fetchEnquiryCounts = async () => {
    try {
      // First, get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost');
        
      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }
      
      // Extract the eids (inquiry ids) that have deal_lost progress entries
      const dealLostInquiryIds = dealLostData.map(item => item.eid);
      console.log('Inquiries with deal_lost progress to exclude from counts:', dealLostInquiryIds.length);
      
      // Get total count, excluding deal_lost inquiries
      let totalCountQuery = supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true });
        
      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.length > 0) {
        totalCountQuery = totalCountQuery.not('id', 'in', `(${dealLostInquiryIds.join(',')})`);
      }
      
      const { count: totalCount, error: totalError } = await totalCountQuery;

      if (totalError) throw totalError;

      // Get new inquiries count using the same logic as the new-inquiries page:
      // First, get all inquiry IDs from the Inquiry_Progress table
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .select('eid');
        
      if (progressError) {
        console.error('Error fetching from Inquiry_Progress table:', progressError);
        throw progressError;
      }
      
      // Extract the eids (inquiry ids) that have progress entries
      const inquiryIdsWithProgress = progressData.map(item => item.eid);
      
      // Query to count new inquiries EXCLUDING any that have matching IDs in Inquiry_Progress table
      let newInquiriesQuery = supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('Enquiry Progress', 'New');
        
      // If there are inquiries with progress, exclude them
      if (inquiryIdsWithProgress.length > 0) {
        // This ensures that any inquiry ID that matches an eid in Inquiry_Progress is excluded
        newInquiriesQuery = newInquiriesQuery.not('id', 'in', `(${inquiryIdsWithProgress.join(',')})`);
      }
      
      // Also exclude deal_lost inquiries from new inquiries count
      if (dealLostInquiryIds.length > 0) {
        newInquiriesQuery = newInquiriesQuery.not('id', 'in', `(${dealLostInquiryIds.join(',')})`);
      }
      
      const { count: newCount, error: newError } = await newInquiriesQuery;

      if (newError) {
        console.error('Error counting new inquiries:', newError);
        throw newError;
      }

      console.log('New inquiries count (excluding those with progress and deal_lost):', newCount);

      // Get today's site visits from Inquiry_Progress table
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      const { count: siteVisitsCount, error: siteVisitsError } = await supabase
        .from('Inquiry_Progress')
        .select('*', { count: 'exact', head: true })
        .eq('progress_type', 'site_visit_schedule')
        .eq('date', formattedDate);

      if (siteVisitsError) throw siteVisitsError;

      // Get total deals done count from Inquiry_Progress table
      const { count: dealsDoneCount, error: dealsError } = await supabase
        .from('Inquiry_Progress')
        .select('*', { count: 'exact', head: true })
        .eq('progress_type', 'deal_done');

      if (dealsError) throw dealsError;

      setStats(prev => ({
        ...prev,
        totalEnquiries: totalCount || 0,
        newEnquiries: newCount || 0,
        pendingSiteVisits: siteVisitsCount || 0,
        totalSales: dealsDoneCount || 0
      }));

    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // Function to fetch today's enquiries from Supabase
  const fetchTodaysEnquiries = async () => {
    try {
      // Get today's date in DD/MM/YYYY format
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      console.log('Fetching today\'s data with date:', formattedDate);
      
      // First, get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost');
        
      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }
      
      // Extract the eids (inquiry ids) that have deal_lost progress entries
      const dealLostInquiryIds = dealLostData.map(item => item.eid);
      console.log('Inquiries with deal_lost progress to exclude from today\'s inquiries:', dealLostInquiryIds.length);
      
      // PART 1: Fetch from enquiries table where NFD = today
      console.log('Fetching from enquiries table where NFD =', formattedDate);
      let nfdQuery = supabase
        .from('enquiries')
        .select('*')
        .eq('NFD', formattedDate);
        
      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.length > 0) {
        nfdQuery = nfdQuery.not('id', 'in', `(${dealLostInquiryIds.join(',')})`);
      }
      
      const { data: nfdData, error: nfdError } = await nfdQuery;

      if (nfdError) throw nfdError;

      console.log('Enquiries with NFD = today (excluding deal_lost):', nfdData?.length || 0);
      
      // PART 2: Fetch from Inquiry_Progress table where date = today
      console.log('Fetching from Inquiry_Progress table where date =', formattedDate);
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .select('*, enquiries:eid(*)')
        .eq('date', formattedDate)
        .not('progress_type', 'eq', 'deal_lost'); // Exclude deal_lost progress entries

      if (progressError) throw progressError;

      console.log('Inquiry_Progress entries with date = today (excluding deal_lost):', progressData?.length || 0);
      
      // Filter out completed or cancelled inquiries from NFD data
      const filteredNfdData = nfdData.filter(enquiry => {
        const status = (enquiry["Enquiry Progress"] || '').toLowerCase();
        return !status.includes('done') && !status.includes('cancelled');
      });
      
      console.log('NFD enquiries after status filtering:', filteredNfdData.length);
      
      // Transform the NFD data to match the Enquiry type
      const nfdTransformedData: Enquiry[] = filteredNfdData.map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        configuration: enquiry.Configuration || '',
        description: enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"]?.toLowerCase().includes('done') ? 'inactive' :
                enquiry["Enquiry Progress"]?.toLowerCase().includes('cancelled') ? 'inactive' : 'active',
        source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: enquiry["Created Date"] || new Date().toISOString(),
        category: 'today'
      }));

      // Transform the Progress data to match the Enquiry type (only if it has a related enquiry)
      const progressTransformedData: Enquiry[] = progressData
        .filter(progress => progress.enquiries) // Only include progress entries with valid enquiry relation
        .map(progress => {
          const enquiry = progress.enquiries;
          return {
            id: enquiry.id,
            clientName: enquiry["Client Name"] || 'Unknown Client',
            mobile: enquiry.Mobile || '',
            configuration: enquiry.Configuration || '',
            description: progress.remark || enquiry["Last Remarks"] || '',
            status: enquiry["Enquiry Progress"]?.toLowerCase().includes('done') ? 'inactive' :
                    enquiry["Enquiry Progress"]?.toLowerCase().includes('cancelled') ? 'inactive' : 'active',
            source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
            assignedEmployee: enquiry["Assigned To"] || '',
            dateCreated: enquiry["Created Date"] || new Date().toISOString(),
            category: 'today',
            progressType: progress.progress_type,
            progressId: progress.id
          };
        });
      
      console.log('Transformed progress data entries:', progressTransformedData.length);
      
      // Combine both data sources, avoiding duplicates (by id)
      const allEnquiries = [...nfdTransformedData];
      
      // Add progress entries, but avoid duplicates
      for (const progressEnquiry of progressTransformedData) {
        if (!allEnquiries.some(e => e.id === progressEnquiry.id)) {
          allEnquiries.push(progressEnquiry);
        }
      }
      
      console.log('Total combined today\'s enquiries:', allEnquiries.length);
      
      return allEnquiries;
    } catch (error) {
      console.error('Error fetching today\'s enquiries:', error);
      return [];
    }
  };

  // Function to fetch due enquiries from Supabase (NFD older than yesterday)
  const fetchDueEnquiries = async () => {
    try {
      // Get current date
      const today = new Date();
      
      // Get date 1 day before (yesterday)
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayFormatted = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;
      
      // Parse yesterday's date for comparison
      const [yesterdayDay, yesterdayMonth, yesterdayYear] = yesterdayFormatted.split('/').map(Number);
      
      // First, get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost');
        
      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }
      
      // Extract the eids (inquiry ids) that have deal_lost progress entries
      const dealLostInquiryIds = dealLostData.map(item => item.eid);
      console.log('Inquiries with deal_lost progress to exclude from due inquiries:', dealLostInquiryIds.length);
      
      // Fetch all enquiries, excluding those with deal_lost progress
      let enquiriesQuery = supabase
        .from('enquiries')
        .select('*');
        
      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.length > 0) {
        enquiriesQuery = enquiriesQuery.not('id', 'in', `(${dealLostInquiryIds.join(',')})`);
      }
      
      const { data, error } = await enquiriesQuery;

      if (error) throw error;
      
      // Filter enquiries where NFD is earlier than yesterday
      const filteredData = data.filter(enquiry => {
        if (!enquiry.NFD) return false;
        
        // Parse the NFD date
        const [day, month, year] = enquiry.NFD.split('/').map(Number);
        
        // Create Date objects for comparison
        const nfdDate = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
        const yesterdayDate = new Date(yesterdayYear, yesterdayMonth - 1, yesterdayDay);
        
        // Return true if the NFD date is before yesterday
        return nfdDate < yesterdayDate;
      });
      
      console.log('Due enquiries (older than yesterday):', filteredData.length);
      
      // Transform the data to match the Enquiry type
      const transformedData: Enquiry[] = filteredData.map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        configuration: enquiry.Configuration || '',
        description: enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"]?.toLowerCase().includes('done') ? 'inactive' :
                enquiry["Enquiry Progress"]?.toLowerCase().includes('cancelled') ? 'inactive' : 'active',
        source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: enquiry["Created Date"] || new Date().toISOString(),
        category: 'due'
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching due enquiries:', error);
      return [];
    }
  };

  // Function to fetch yesterday's enquiries from Supabase
  const fetchYesterdaysEnquiries = async () => {
    try {
      // Get current date
      const today = new Date();
      
      // Get yesterday's date
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayFormatted = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;
      
      // First, get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost');
        
      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }
      
      // Extract the eids (inquiry ids) that have deal_lost progress entries
      const dealLostInquiryIds = dealLostData.map(item => item.eid);
      console.log('Inquiries with deal_lost progress to exclude from yesterday\'s inquiries:', dealLostInquiryIds.length);
      
      // Fetch enquiries where NFD is yesterday, excluding those with deal_lost progress
      let enquiriesQuery = supabase
        .from('enquiries')
        .select('*')
        .eq('NFD', yesterdayFormatted);
        
      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.length > 0) {
        enquiriesQuery = enquiriesQuery.not('id', 'in', `(${dealLostInquiryIds.join(',')})`);
      }
      
      const { data, error } = await enquiriesQuery;

      if (error) throw error;
      
      console.log('Yesterday\'s enquiries (excluding deal_lost):', data.length);
      
      // Transform the data to match the Enquiry type
      const transformedData: Enquiry[] = data.map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        configuration: enquiry.Configuration || '',
        description: enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"]?.toLowerCase().includes('done') ? 'inactive' :
                enquiry["Enquiry Progress"]?.toLowerCase().includes('cancelled') ? 'inactive' : 'active',
        source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: enquiry["Created Date"] || new Date().toISOString(),
        category: 'yesterday'
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching yesterday\'s enquiries:', error);
      return [];
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchEnquiryCounts();
  }, []);

  // Load data from localStorage and Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('Starting to load dashboard data...');
        
        // Get new inquiries from Supabase using the same logic that excludes inquiries with progress entries
        console.log('Fetching new inquiries...');
        
        // First, get all inquiry IDs from the Inquiry_Progress table
        const { data: progressData, error: progressError } = await supabase
          .from('Inquiry_Progress')
          .select('eid');
          
        if (progressError) {
          console.error('Error fetching from Inquiry_Progress table:', progressError);
          throw progressError;
        }
        
        // Extract the eids (inquiry ids) that have progress entries
        const inquiryIdsWithProgress = progressData.map(item => item.eid);
        console.log('Inquiries with progress entries:', inquiryIdsWithProgress.length);
        
        // Query to get new inquiries EXCLUDING any that have matching IDs in Inquiry_Progress table
        let newInquiriesQuery = supabase
          .from('enquiries')
          .select('*')
          .eq('Enquiry Progress', 'New');
          
        // If there are inquiries with progress, exclude them
        if (inquiryIdsWithProgress.length > 0) {
          // This ensures that any inquiry ID that matches an eid in Inquiry_Progress is excluded
          newInquiriesQuery = newInquiriesQuery.not('id', 'in', `(${inquiryIdsWithProgress.join(',')})`);
        }
        
        const { data: newInquiriesData, error: newInquiriesError } = await newInquiriesQuery;

        if (newInquiriesError) {
          console.error('Error fetching new inquiries from Supabase:', newInquiriesError);
          throw newInquiriesError;
        }

        console.log('New inquiries fetched (excluding those with progress):', newInquiriesData?.length || 0);
        
        // Transform the new inquiries data to match the Enquiry type for the dashboard
        const newInquiries = newInquiriesData.map(enquiry => ({
          id: enquiry.id,
          clientName: enquiry["Client Name"] || 'Unknown Client',
          mobile: enquiry.Mobile || '',
          configuration: enquiry.Configuration || '',
          description: enquiry["Last Remarks"] || '',
          status: enquiry["Enquiry Progress"]?.toLowerCase() || 'new',
          source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
          assignedEmployee: enquiry["Assigned To"] || '',
          dateCreated: enquiry["Created Date"] || new Date().toISOString(),
          category: 'new' as const // Use 'as const' to ensure proper typing
        }));
        
        // Get today's enquiries from Supabase
        console.log('Fetching today\'s enquiries...');
        const todaysEnquiries = await fetchTodaysEnquiries();
        console.log('Today\'s enquiries loaded:', todaysEnquiries.length);
        
        // Get due enquiries from Supabase (older than yesterday)
        console.log('Fetching due enquiries...');
        const dueEnquiries = await fetchDueEnquiries();
        console.log('Due enquiries loaded:', dueEnquiries.length);
        
        // Get yesterday's enquiries from Supabase
        console.log("Fetching yesterday's enquiries...");
        const yesterdaysEnquiries = await fetchYesterdaysEnquiries();
        console.log("Yesterday's enquiries loaded:", yesterdaysEnquiries.length);
        
        // Get weekend enquiries from localStorage (keeping this unchanged for now)
        const localStorageEnquiries = getEnquiries();
        const weekendEnquiries = localStorageEnquiries.filter(e => e.category === 'weekend');
        
        // Categorize enquiries
        const categorized = {
          new: newInquiries, // Use Supabase data for new inquiries with exclusion logic
          today: todaysEnquiries, 
          yesterday: yesterdaysEnquiries,
          due: dueEnquiries,
          weekend: weekendEnquiries
        };
        
        console.log('Categorized enquiries:', {
          new: categorized.new.length,
          today: categorized.today.length,
          yesterday: categorized.yesterday.length,
          due: categorized.due.length,
          weekend: categorized.weekend.length
        });
        
        setCategorizedEnquiries(categorized);

        // Simulate loading for UI polish
        setTimeout(() => {
          setIsLoading(false);
          console.log('Dashboard data loading complete');
        }, 500);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    console.log('Dashboard search:', query);
    // No need to filter data here as we'll redirect to the inquiry list page
  };

  // Sample data - commented out as not currently used
  // const metrics = {
  //   totalSales: 125,
  //   salesTrend: 12,
  //   activeInquiries: 45,
  //   inquiriesTrend: 8,
  //   siteVisits: 28,
  //   siteVisitsTrend: -5,
  //   conversionRate: 15,
  // };

  return (
    <div className="fade-in">
      {/* Premium Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-14 px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Welcome to <span className="text-[#c69c6d]">Space Oracle CRM</span>
          </h1>
          <p className="text-[#e5d0b1] text-lg md:text-xl max-w-3xl mx-auto mb-10">
            The premium real estate management platform where exceptional spaces meet exceptional service
          </p>
          
          <div className="max-w-2xl mx-auto">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search properties, clients, or enquiries..." 
              submitOnEnter={true}
              redirectUrl="/enquiry/list"
            />
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c69c6d]"></div>
        </div>
      ) : (
        <div className="space-y-10 px-2 sm:px-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
              title="New Enquiries" 
              value={stats.newEnquiries}
              icon={<NewIcon />}
              href="/new-inquiries"
              color="blue"
            />
            <StatCard 
              title="Total Enquiries" 
              value={stats.totalEnquiries}
              icon={<DocumentIcon />}
              href="/enquiry/list"
              color="green"
            />
            <StatCard 
              title="Today's Site Visits" 
              value={stats.pendingSiteVisits}
              icon={<CalendarIcon />}
              href="/todays-site-visits"
              color="purple"
            />
            <StatCard 
              title="Sales" 
              value={stats.totalSales}
              icon={<CurrencyIcon />}
              href="#"
              color="gold"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-6">
              {/* Categorized Enquiries */}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Enquiries by Category
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <CategoryCard 
                  title="New" 
                  count={categorizedEnquiries.new.length}
                  icon={<NewIcon />}
                  enquiries={categorizedEnquiries.new}
                  colorClass="from-blue-500/20 to-blue-600/20 border-blue-200 dark:border-blue-800/30"
                />
                <CategoryCard 
                  title="Today" 
                  count={categorizedEnquiries.today.length}
                  icon={<TodayIcon />}
                  enquiries={categorizedEnquiries.today}
                  colorClass="from-green-500/20 to-green-600/20 border-green-200 dark:border-green-800/30"
                />
                <CategoryCard 
                  title="Due" 
                  count={categorizedEnquiries.due.length}
                  icon={<DueIcon />}
                  enquiries={categorizedEnquiries.due}
                  colorClass="from-orange-500/20 to-orange-600/20 border-orange-200 dark:border-orange-800/30"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <CategoryCard 
                  title="Yesterday" 
                  count={categorizedEnquiries.yesterday.length}
                  icon={<YesterdayIcon />}
                  enquiries={categorizedEnquiries.yesterday}
                  colorClass="from-purple-500/20 to-purple-600/20 border-purple-200 dark:border-purple-800/30"
                />
                <CategoryCard 
                  title="Weekend" 
                  count={categorizedEnquiries.weekend.length}
                  icon={<WeekendIcon />}
                  enquiries={categorizedEnquiries.weekend}
                  colorClass="from-amber-500/20 to-amber-600/20 border-amber-200 dark:border-amber-800/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value, icon, href, color = 'default' }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  href?: string;
  color?: 'blue' | 'green' | 'purple' | 'gold' | 'default';
}) => {
  const getColorClass = () => {
    switch(color) {
      case 'blue':
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800/30';
      case 'green':
        return 'bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-100 dark:border-green-800/30';
      case 'purple':
        return 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-100 dark:border-purple-800/30';
      case 'gold':
        return 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-100 dark:border-amber-800/30';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-100 dark:border-gray-800/30';
    }
  };

  // Get the href with date parameter for Today's Site Visits
  const getHref = () => {
    if (title === "Today's Site Visits") {
      return '/todays-site-visits';
    }
    if (title === "New Enquiries") {
      return '/new-inquiries';
    }
    return href || '#';
  };

  return (
    <Link href={getHref()} className="block">
      <div className={`p-4 sm:p-6 rounded-xl border transition-transform duration-300 hover:scale-105 hover:shadow-md ${getColorClass()}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/70 dark:bg-gray-800/70 flex items-center justify-center text-[#c69c6d] flex-shrink-0">
            {icon}
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const CategoryCard = ({ title, count, icon, enquiries, colorClass }: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  enquiries: Enquiry[];
  colorClass: string;
}) => {
  // Create a type that extends Enquiry with optional progressType
  type EnquiryWithProgress = Enquiry & { progressType?: string };
  
  // Add debug logging for this component
  console.log(`Rendering CategoryCard for "${title}" with ${count} enquiries:`, 
    enquiries.map(e => ({ 
      id: e.id, 
      clientName: e.clientName, 
      progressType: (e as EnquiryWithProgress).progressType 
    })));
  
  // Convert title to category value for filtering
  const getCategoryValue = (title: string) => {
    return title.toLowerCase();
  };

  // Get the search parameter based on category
  const getLink = (title: string) => {
    if (title === 'Today') {
      // Link to the dedicated today-inquiries page for Today category
      return '/today-inquiries';
    } else if (title === 'New') {
      // Link to the dedicated new-inquiries page for New category
      return '/new-inquiries';
    } else if (title === 'Due') {
      // Link to the dedicated due-inquiries page for Due category
      return '/due-inquiries';
    } else if (title === 'Yesterday') {
      // Link to the dedicated yesterday-inquiries page for Yesterday category
      return '/yesterday-inquiries';
    }
    return `/enquiry/list?category=${getCategoryValue(title)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get progress type display and color
  const getProgressTypeDisplay = (progressType: string) => {
    if (!progressType) return null;
    
    let label = progressType.replace(/_/g, ' ');
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
    let colorClass = 'bg-purple-100 text-purple-800';
    
    if (progressType.includes('site_visit')) {
      colorClass = 'bg-green-100 text-green-800';
    } else if (progressType.includes('phone')) {
      colorClass = 'bg-blue-100 text-blue-800';
    } else if (progressType.includes('deal_done')) {
      colorClass = 'bg-amber-100 text-amber-800';
    }
    
    return { label, colorClass };
  };

  return (
    <div className={`p-5 rounded-xl bg-gradient-to-br border transition-all hover:shadow-md ${colorClass}`}>
      <div className="flex justify-between items-start mb-5">
        <div className="flex flex-col">
          <div className="text-lg font-bold text-gray-800 dark:text-white">{title}</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{count}</div>
        </div>
        <div className="h-10 w-10 rounded-full bg-white/70 dark:bg-gray-800/70 flex items-center justify-center text-[#c69c6d]">
          {icon}
        </div>
      </div>
      
      {/* Inquiry list */}
      <div>
        {count > 0 ? (
          <div className="space-y-3 mt-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
            {enquiries.slice(0, 5).map((enquiry, index) => (
              <Link href={`/enquiry/${enquiry.id}/progress`} key={enquiry.id} className="block">
                <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-900/30 hover:bg-white/80 dark:hover:bg-gray-900/50 transition-colors">
                  <div className="flex justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[180px]">
                      {enquiry.clientName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {enquiry.source}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(enquiry as EnquiryWithProgress).progressType ? (
                      <div className={`text-xs px-2 py-0.5 rounded-full ${getProgressTypeDisplay((enquiry as EnquiryWithProgress).progressType!)?.colorClass}`}>
                        {getProgressTypeDisplay((enquiry as EnquiryWithProgress).progressType!)?.label}
                      </div>
                    ) : (
                      <div className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 px-3 rounded-lg bg-white/50 dark:bg-gray-900/30">
            <div className="text-gray-500 dark:text-gray-400">No {title.toLowerCase()} inquiries</div>
          </div>
        )}
      </div>
      
      {count > 0 && (
        <div className="mt-4">
          <Link 
            href={getLink(title)}
            className="w-full block text-center py-2.5 px-4 rounded-lg bg-white/70 dark:bg-gray-900/40 text-[#1a2e29] dark:text-white hover:bg-white/90 dark:hover:bg-gray-900/60 transition-colors text-sm font-medium"
          >
            View All {count > 5 ? `(${count})` : ''}
          </Link>
        </div>
      )}
    </div>
  );
};

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const CurrencyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const NewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TodayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const YesterdayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const DueIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const WeekendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
