'use client';

import React from 'react';
import SiteVisitList from '../components/SiteVisitList';
import ScheduleVisitForm from '../components/ScheduleVisitForm';
import { SiteVisitStatus } from '../types/inquiry';
import { addSiteVisit } from '../utils/localStorage';

// Sample demo data
const demoSiteVisits: SiteVisitStatus[] = [
  {
    id: '1',
    inquiryId: 'INQ001',
    clientName: 'Raj Sharma',
    scheduledDate: new Date(new Date().setHours(10, 0)),
    status: 'scheduled',
    remarks: 'Interested in 3BHK property',
    assignedTo: 'Rajdeep',
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    inquiryId: 'INQ002',
    clientName: 'Priya Patel',
    scheduledDate: new Date(new Date().setHours(14, 30)),
    status: 'scheduled',
    remarks: 'Looking for 2BHK with garden view',
    assignedTo: 'Rushiraj',
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    inquiryId: 'INQ003',
    clientName: 'Amit Singh',
    scheduledDate: new Date(new Date().setHours(16, 0)),
    status: 'done',
    remarks: 'Client liked the property, discussing payment terms',
    assignedTo: 'Mantik',
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    inquiryId: 'INQ004',
    clientName: 'Meera Shah',
    scheduledDate: new Date(new Date().setHours(11, 30)),
    status: 'cancelled',
    remarks: 'Client rescheduled for next week',
    assignedTo: 'Rajdeep',
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    inquiryId: 'INQ005',
    clientName: 'Karan Mehta',
    scheduledDate: new Date(new Date().setHours(15, 0)),
    status: 'scheduled',
    remarks: 'Second visit to finalize the deal',
    assignedTo: 'Rushiraj',
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function SiteVisitsPage() {
  const [showScheduleForm, setShowScheduleForm] = React.useState(false);
  const [siteVisits, setSiteVisits] = React.useState<SiteVisitStatus[]>(demoSiteVisits);

  // Load site visits from localStorage or use demo data if none exists
  React.useEffect(() => {
    const storedVisits = localStorage.getItem('siteVisits');
    if (storedVisits) {
      const parsedVisits = JSON.parse(storedVisits);
      // Convert string dates back to Date objects
      const visitsWithDates = parsedVisits.map((visit: any) => ({
        ...visit,
        scheduledDate: new Date(visit.scheduledDate),
        createdAt: new Date(visit.createdAt),
        updatedAt: new Date(visit.updatedAt),
        actualDate: visit.actualDate ? new Date(visit.actualDate) : undefined
      }));
      setSiteVisits(visitsWithDates);
    } else {
      // Initialize with demo data if no stored visits exist
      localStorage.setItem('siteVisits', JSON.stringify(demoSiteVisits));
    }
  }, []);

  const handleMarkCompleted = (id: string) => {
    const updatedVisits = siteVisits.map(visit => 
      visit.id === id ? { ...visit, status: 'done' as const } : visit
    );
    setSiteVisits(updatedVisits);
    localStorage.setItem('siteVisits', JSON.stringify(updatedVisits));
  };

  const handleCancel = (id: string) => {
    const updatedVisits = siteVisits.map(visit => 
      visit.id === id ? { ...visit, status: 'cancelled' as const } : visit
    );
    setSiteVisits(updatedVisits);
    localStorage.setItem('siteVisits', JSON.stringify(updatedVisits));
  };

  const handleScheduleVisit = (visit: Omit<SiteVisitStatus, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    const newVisit: SiteVisitStatus = {
      ...visit,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'System',
      updatedBy: 'System'
    };
    
    const updatedVisits = [...siteVisits, newVisit];
    setSiteVisits(updatedVisits);
    localStorage.setItem('siteVisits', JSON.stringify(updatedVisits));
  };

  return (
    <div className="fade-in">
      {/* Premium Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-14 px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Site Visits
          </h1>
          <p className="text-[#e5d0b1] text-lg md:text-xl max-w-3xl mx-auto">
            Manage and track all property site visits
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Today's Site Visits</h2>
              <button 
                onClick={() => setShowScheduleForm(true)}
                className="premium-button"
              >
                Schedule New Visit
              </button>
            </div>
          </div>

          <SiteVisitList 
            siteVisits={siteVisits}
            onMarkCompleted={handleMarkCompleted}
            onCancel={handleCancel}
          />
        </div>
      </div>

      {showScheduleForm && (
        <ScheduleVisitForm
          onClose={() => setShowScheduleForm(false)}
          onSubmit={handleScheduleVisit}
        />
      )}
    </div>
  );
} 