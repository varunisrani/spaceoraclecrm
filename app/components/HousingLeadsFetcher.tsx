'use client';

import { useState, useEffect } from 'react';

interface HousingLead {
  clientName: string;
  mobile: string;
  email: string;
  configuration: string;
  enquiryFor: string;
  propertyType: string;
  budget: string;
  area: string;
  remarks: string;
  createdDate: string;
}

interface FetchResponse {
  success: boolean;
  message: string;
  data?: HousingLead[];
  count?: number;
  error?: string;
}

interface AddResponse {
  success: boolean;
  message: string;
  data?: {
    inserted: number;
    skipped: number;
    errors: number;
    details: Array<{ lead: HousingLead; status: string; error?: string }>;
  };
  error?: string;
}

export default function HousingLeadsFetcher() {
  const [leads, setLeads] = useState<HousingLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [addStatus, setAddStatus] = useState<string>('');
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  // Check connection on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const response = await fetch('/api/housing/test');
      const data: FetchResponse = await response.json();

      if (data.success) {
        setConnectionStatus('connected');
        console.log('[HousingLeadsFetcher] ✅ Connection successful');
      } else {
        setConnectionStatus('error');
        setError(data.message || 'Connection failed');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError('Failed to connect to Housing.com API');
      console.error('[HousingLeadsFetcher] Connection error:', err);
    }
  };

  const fetchLatestLeads = async () => {
    setFetching(true);
    setError('');
    setAddStatus('');
    setSelectedLeads(new Set());

    try {
      console.log('[HousingLeadsFetcher] Fetching latest leads...');
      const response = await fetch('/api/housing/fetch-leads');
      const data: FetchResponse = await response.json();

      if (data.success && data.data) {
        setLeads(data.data);
        console.log(`[HousingLeadsFetcher] ✅ Fetched ${data.data.length} leads`);
      } else {
        setError(data.message || 'Failed to fetch leads');
        setLeads([]);
      }
    } catch (err) {
      setError('Failed to fetch leads');
      console.error('[HousingLeadsFetcher] Fetch error:', err);
    } finally {
      setFetching(false);
    }
  };

  const addLeadsToSupabase = async (leadsToAdd: HousingLead[]) => {
    setLoading(true);
    setAddStatus('');

    try {
      console.log(`[HousingLeadsFetcher] Adding ${leadsToAdd.length} leads to Supabase...`);

      const response = await fetch('/api/housing/fetch-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leads: leadsToAdd }),
      });

      const data: AddResponse = await response.json();

      if (data.success && data.data) {
        const { inserted, skipped, errors } = data.data;
        setAddStatus(`✅ Added ${inserted} leads | Skipped ${skipped} duplicates | ${errors} errors`);

        // Remove successfully added leads from the list
        setLeads(prev => prev.filter(lead =>
          !data.data?.details.find(detail =>
            detail.lead.clientName === lead.clientName &&
            detail.lead.mobile === lead.mobile &&
            detail.status === 'inserted'
          )
        ));

        console.log(`[HousingLeadsFetcher] ✅ Added ${inserted} leads to Supabase`);
      } else {
        setAddStatus(`❌ ${data.message || 'Failed to add leads'}`);
      }
    } catch (err) {
      setAddStatus('❌ Failed to add leads to Supabase');
      console.error('[HousingLeadsFetcher] Add error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = (index: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((_, index) => index)));
    }
  };

  const addSelectedLeads = () => {
    const leadsToAdd = Array.from(selectedLeads).map(index => leads[index]);
    if (leadsToAdd.length > 0) {
      addLeadsToSupabase(leadsToAdd);
    }
  };

  const addAllLeads = () => {
    if (leads.length > 0) {
      addLeadsToSupabase(leads);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBudget = (budget: string) => {
    if (budget === 'Not specified') return 'N/A';
    if (budget.includes('₹')) return budget;
    return `₹${budget}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Housing.com Leads
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Fetch and add latest leads from Housing.com to your CRM
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Connected
            </span>
          )}
          {connectionStatus === 'error' && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              Connection Error
            </span>
          )}
          {connectionStatus === 'checking' && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Checking...
            </span>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus === 'error' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            <span className="font-semibold">Connection Error:</span> {error}
          </p>
          <button
            onClick={checkConnection}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Fetch Button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={fetchLatestLeads}
          disabled={fetching || connectionStatus !== 'connected'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {fetching ? 'Fetching...' : '🔄 Fetch Latest Leads'}
        </button>

        {connectionStatus === 'idle' && (
          <button
            onClick={checkConnection}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            🔌 Check Connection
          </button>
        )}
      </div>

      {/* Fetch Status */}
      {addStatus && (
        <div className={`mb-4 p-4 rounded-lg border ${
          addStatus.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' :
          addStatus.includes('❌') ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <p className="text-sm font-medium">{addStatus}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Leads Display */}
      {leads.length > 0 && (
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selectedLeads.size === leads.length && leads.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              Select All ({selectedLeads.size}/{leads.length})
            </label>
            <button
              onClick={addSelectedLeads}
              disabled={loading || selectedLeads.size === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Adding...' : `➕ Add Selected (${selectedLeads.size})`}
            </button>
            <button
              onClick={addAllLeads}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Adding...' : `➕ Add All (${leads.length})`}
            </button>
          </div>

          {/* Leads List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {leads.map((lead, index) => (
                <div key={index} className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(index)}
                      onChange={() => handleSelectLead(index)}
                      className="mt-1 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">{lead.clientName}</h3>
                        <span className="text-xs text-gray-500">
                          {formatDate(lead.createdDate)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">📞 {lead.mobile}</span>
                          {lead.email && <span className="text-gray-600 ml-3">📧 {lead.email}</span>}
                        </div>
                        <div>
                          <span className="text-gray-600">🏢 {lead.enquiryFor}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">📐 {lead.configuration || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">💰 {formatBudget(lead.budget)}</span>
                        </div>
                      </div>

                      {lead.remarks && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          📝 {lead.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Leads */}
      {!fetching && connectionStatus === 'connected' && leads.length === 0 && !error && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">No leads found from Housing.com</p>
          <p className="text-sm text-gray-400">Click "Fetch Latest Leads" to check for new leads</p>
        </div>
      )}
    </div>
  );
}