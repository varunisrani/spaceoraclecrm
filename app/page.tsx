'use client';

import { useEffect, useState } from 'react';
import { Enquiry, DashboardStats, InquirySource } from './types';
import { getEnquiries } from './utils/localStorage';
import { useInitializeData } from './utils/initializeData';
import SearchBar from './components/SearchBar';
import StatusBadge from './components/StatusBadge';
import Link from 'next/link';
import { InquiryProgress, InquiryStatus } from './types/inquiry';
import InquiryProgressTracker from './components/InquiryProgress';
import RemarksHistory from './components/RemarksHistory';
import { supabase } from './utils/supabase';

interface EnquiryCount {
  total: number;
  new: number;
}

const DashboardMetricCard = ({ label, value, trend }: { label: string; value: number; trend?: number }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-gray-500 text-sm mb-1">{label}</h3>
    <div className="flex items-end space-x-2">
      <p className="text-2xl font-bold">{value}</p>
      {trend !== undefined && (
        <span className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  </div>
);

export default function Home() {
  useInitializeData();
  
  const [stats, setStats] = useState<DashboardStats>({
    newEnquiries: 0,
    totalEnquiries: 0,
    pendingSiteVisits: 0,
    totalSales: 0,
    monthlySales: 0,
    weeklySales: 0,
    dailySales: 0
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

  const [activities, setActivities] = useState<{
    title: string;
    description: string;
    time: string;
    icon: 'document' | 'calendar' | 'folder' | 'currency';
  }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  
  // Function to fetch enquiry counts from Supabase
  const fetchEnquiryCounts = async () => {
    try {
      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get new enquiries count (where Enquiry Progress is 'New')
      const { count: newCount, error: newError } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('Enquiry Progress', 'New');

      if (newError) throw newError;

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
      
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .eq('NFD', formattedDate);

      if (error) throw error;

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
        category: 'today'
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching today\'s enquiries:', error);
      return [];
    }
  };

  // Function to fetch due enquiries from Supabase (NFD 1-2 days before today)
  const fetchDueEnquiries = async () => {
    try {
      // Get current date
      const today = new Date();
      
      // Get date 1 day before (yesterday)
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayFormatted = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;
      
      // Get date 2 days before
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);
      const twoDaysAgoFormatted = `${String(twoDaysAgo.getDate()).padStart(2, '0')}/${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}/${twoDaysAgo.getFullYear()}`;
      
      // Fetch enquiries where NFD is 1-2 days before today
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .in('NFD', [yesterdayFormatted, twoDaysAgoFormatted]);

      if (error) throw error;
      
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
      
      // Fetch enquiries where NFD is yesterday
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .eq('NFD', yesterdayFormatted);

      if (error) throw error;
      
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
        
        // Get enquiries from localStorage
        const localStorageEnquiries = getEnquiries();
        
        // Get today's enquiries from Supabase
        const todaysEnquiries = await fetchTodaysEnquiries();
        
        // Get due enquiries from Supabase (1-2 days before today)
        const dueEnquiries = await fetchDueEnquiries();
        
        // Get yesterday's enquiries from Supabase
        const yesterdaysEnquiries = await fetchYesterdaysEnquiries();
        
        // Categorize enquiries
        const categorized = {
          new: localStorageEnquiries.filter(e => e.category === 'new'),
          today: todaysEnquiries, // Use Supabase data for today's enquiries
          yesterday: yesterdaysEnquiries, // Use Supabase data for yesterday's enquiries
          due: dueEnquiries, // Use Supabase data for due enquiries
          weekend: localStorageEnquiries.filter(e => e.category === 'weekend')
        };
        
        setCategorizedEnquiries(categorized);

        // Create sample activities
        setActivities([
          {
            title: "New Enquiry Added",
            description: "Raj Sharma - 2BHK in downtown area",
            time: "Just now",
            icon: "document"
          },
          {
            title: "Site Visit Scheduled",
            description: "Priya Patel - For 3BHK with garden",
            time: "2 hours ago",
            icon: "calendar"
          },
          {
            title: "Property Listed",
            description: "New 4BHK Luxury Apartment in City Center",
            time: "Yesterday",
            icon: "folder"
          },
          {
            title: "Deal Closed",
            description: "Amit Singh - 1BHK for ₹25,00,000",
            time: "2 days ago",
            icon: "currency"
          }
        ]);

        // Simulate loading for UI polish
        setTimeout(() => setIsLoading(false), 500);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // In a real app, this would filter data or redirect to a search results page
  };

  // Sample data - replace with actual data from your backend
  const metrics = {
    totalSales: 125,
    salesTrend: 12,
    activeInquiries: 45,
    inquiriesTrend: 8,
    siteVisits: 28,
    siteVisitsTrend: -5,
    conversionRate: 15,
    conversionTrend: 2,
  };

  const recentProgress: InquiryProgress = {
    id: '1',
    inquiryId: '1',
    progressType: 'phone_call',
    status: 'in_progress',
    remarks: 'Client showed interest in the property. Following up next week.',
    leadSource: 'System',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'Maulik Jadav'
  };

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
        <div className="space-y-10">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="New Enquiries" 
              value={stats.newEnquiries}
              icon={<NewIcon />}
              href="/enquiry/list"
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Categorized Enquiries */}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Enquiries by Category
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            
            {/* Activity Summary */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Recent Activity
              </h2>
              
              <div className="premium-card p-6">
                <div className="space-y-5">
                  {activities.map((activity, idx) => (
                    <ActivityItem 
                      key={idx}
                      title={activity.title}
                      description={activity.description}
                      time={activity.time}
                      icon={
                        activity.icon === 'document' ? <DocumentIcon /> : 
                        activity.icon === 'calendar' ? <CalendarIcon /> : 
                        activity.icon === 'folder' ? <FolderIcon /> : 
                        <CurrencyIcon />
                      }
                    />
                  ))}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="premium-card p-6">
                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/enquiry/new" className="premium-button-accent text-center">
                    Add Enquiry
                  </Link>
                  <Link href="/site-visits" className="premium-button text-center">
                    Schedule Visit
                  </Link>
                  <Link href="/enquiry/list" className="premium-button text-center">
                    View Enquiries
                  </Link>
                  <Link href="/enquiry/portal" className="premium-button-accent text-center">
                    Portal Enquiries
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <InquiryProgressTracker
                  progress={recentProgress}
                  isEditable={false}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors">
                  New Inquiry
                </button>
                <button className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors">
                  Schedule Visit
                </button>
                <button className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition-colors">
                  Add Remark
                </button>
                <button className="bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition-colors">
                  Generate Report
                </button>
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

  // Get today's date in DD/MM/YYYY format
  const getTodayDate = () => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  };

  // Get the href with date parameter for Today's Site Visits
  const getHref = () => {
    if (title === "Today's Site Visits") {
      return '/todays-site-visits';
    }
    return href || '#';
  };

  return (
    <Link href={getHref()} className="block">
      <div className={`p-6 rounded-xl border transition-transform duration-300 hover:scale-105 hover:shadow-md ${getColorClass()}`}>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/70 dark:bg-gray-800/70 flex items-center justify-center text-[#c69c6d]">
            {icon}
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
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
  // Convert title to category value for filtering
  const getCategoryValue = (title: string) => {
    return title.toLowerCase();
  };

  // Get today's date in DD/MM/YYYY format
  const getTodayDate = () => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  };

  // Get yesterday's date in DD/MM/YYYY format
  const getYesterdayDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;
  };

  // Get two days ago date in DD/MM/YYYY format
  const getTwoDaysAgoDate = () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    return `${String(twoDaysAgo.getDate()).padStart(2, '0')}/${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}/${twoDaysAgo.getFullYear()}`;
  };

  // Get the search parameter based on category
  const getSearchParam = (title: string) => {
    if (title === 'Today') {
      return `?search=${getTodayDate()}`;
    } else if (title === 'Due') {
      return `?search=${getYesterdayDate()},${getTwoDaysAgoDate()}`;
    } else if (title === 'Yesterday') {
      return `?search=${getYesterdayDate()}`;
    }
    return `?category=${getCategoryValue(title)}`;
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

  // Check if we should show only count for this category
  const showOnlyCount = title === 'Today' || title === 'Due' || title === 'Yesterday';

  return (
    <Link 
      href={`/enquiry/list${getSearchParam(title)}`}
      className={`premium-card overflow-hidden border transition-all hover:shadow-md ${colorClass}`}
    >
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/70 dark:bg-gray-800/70 flex items-center justify-center text-gray-700 dark:text-gray-300">
              {icon}
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">{title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{count} Enquiries</div>
            </div>
          </div>
        </div>
        
        {showOnlyCount ? (
          <div className="text-center py-6">
            <div className="text-3xl font-bold text-gray-800 dark:text-white">{count}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Enquiries to follow up</div>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {enquiries.slice(0, 2).map(enquiry => (
              <div key={enquiry.id} className="p-2 rounded-lg bg-white/70 dark:bg-gray-800/70">
                <div className="font-medium text-gray-800 dark:text-white truncate">{enquiry.clientName}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{enquiry.configuration}</div>
                  <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(enquiry.status)}`}>
                    {enquiry.status}
                  </div>
                </div>
              </div>
            ))}
            
            {count === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No enquiries in this category
              </div>
            )}
          </div>
        )}
        
        {!showOnlyCount && count > 2 && (
          <div 
            className="text-xs text-[#1a2e29] dark:text-[#c69c6d] font-medium hover:underline block text-center"
          >
            View all {count} enquiries
          </div>
        )}
      </div>
    </Link>
  );
};

const ActivityItem = ({ title, description, time, icon }: {
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex gap-4">
      <div className="h-10 w-10 rounded-full bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 flex items-center justify-center text-[#1a2e29] dark:text-[#c69c6d] shrink-0">
        {icon}
      </div>
      <div className="flex-1 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="font-medium text-gray-800 dark:text-white">{title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{time}</div>
      </div>
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
