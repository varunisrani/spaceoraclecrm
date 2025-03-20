'use client';

import React from 'react';
import { EmployeeReport } from '../../types/inquiry';

export default function EmployeeInquiryReportPage() {
  const [dateRange, setDateRange] = React.useState('this_month');
  const [selectedEmployee, setSelectedEmployee] = React.useState('all');
  const [selectedArea, setSelectedArea] = React.useState('all');

  // Sample data - replace with actual API call
  const reports: EmployeeReport[] = [
    {
      employeeId: '1',
      employeeName: 'Maulik Jadav',
      metrics: {
        newInquiries: 15,
        phoneCalls: 45,
        siteVisits: 12,
        multipleVisits: 5,
        dealsSucceeded: 8,
        dealsLost: 4
      },
      period: {
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31')
      }
    },
    {
      employeeId: '2',
      employeeName: 'Rushirajsinh Zala',
      metrics: {
        newInquiries: 18,
        phoneCalls: 52,
        siteVisits: 15,
        multipleVisits: 7,
        dealsSucceeded: 10,
        dealsLost: 5
      },
      period: {
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31')
      }
    }
  ];

  // Calculate totals for summary
  const totals = reports.reduce((acc, report) => ({
    newInquiries: acc.newInquiries + report.metrics.newInquiries,
    phoneCalls: acc.phoneCalls + report.metrics.phoneCalls,
    siteVisits: acc.siteVisits + report.metrics.siteVisits,
    multipleVisits: acc.multipleVisits + report.metrics.multipleVisits,
    dealsSucceeded: acc.dealsSucceeded + report.metrics.dealsSucceeded,
    dealsLost: acc.dealsLost + report.metrics.dealsLost
  }), {
    newInquiries: 0,
    phoneCalls: 0,
    siteVisits: 0,
    multipleVisits: 0,
    dealsSucceeded: 0,
    dealsLost: 0
  });

  // Filter reports based on selected employee and area
  const filteredReports = reports.filter(report => {
    const employeeMatch = selectedEmployee === 'all' || report.employeeId === selectedEmployee;
    const areaMatch = selectedArea === 'all' || report.area === selectedArea;
    return employeeMatch && areaMatch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Employee Inquiry Reports</h1>
        <p className="text-gray-600">Track and analyze employee performance metrics</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border rounded-lg p-2.5 bg-white"
            >
              <option value="all">All Employees</option>
              <option value="1">Maulik Jadav</option>
              <option value="2">Rushirajsinh Zala</option>
              <option value="3">Rajdeep</option>
              <option value="4">Rushiraj</option>
              <option value="5">Mantik</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border rounded-lg p-2.5 bg-white"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full border rounded-lg p-2.5 bg-white"
            >
              <option value="all">All Areas</option>
              <option value="bhopal">Bhopal</option>
              <option value="sindhupan">Sindhupan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total New Inquiries</div>
          <div className="text-2xl font-bold text-blue-600">{totals.newInquiries}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Site Visits</div>
          <div className="text-2xl font-bold text-green-600">{totals.siteVisits}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Deals Succeeded</div>
          <div className="text-2xl font-bold text-amber-500">{totals.dealsSucceeded}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Success Rate</div>
          <div className="text-2xl font-bold text-purple-600">
            {((totals.dealsSucceeded / (totals.dealsSucceeded + totals.dealsLost)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="text-center">New Inquiries</th>
                <th className="text-center">Phone Calls</th>
                <th className="text-center">Site Visits</th>
                <th className="text-center">Multiple Visits</th>
                <th className="text-center">Deals Succeeded</th>
                <th className="text-center">Deals Lost</th>
                <th className="text-center">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.employeeId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 rounded-full bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 items-center justify-center text-[#1a2e29] dark:text-[#c69c6d]">
                        {report.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{report.employeeName}</div>
                        <div className="text-xs text-gray-500">
                          {report.period.startDate.toLocaleDateString()} - {report.period.endDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center font-medium">{report.metrics.newInquiries}</td>
                  <td className="text-center font-medium">{report.metrics.phoneCalls}</td>
                  <td className="text-center font-medium">{report.metrics.siteVisits}</td>
                  <td className="text-center font-medium">{report.metrics.multipleVisits}</td>
                  <td className="text-center font-medium text-green-600">{report.metrics.dealsSucceeded}</td>
                  <td className="text-center font-medium text-red-600">{report.metrics.dealsLost}</td>
                  <td className="text-center font-medium text-purple-600">
                    {((report.metrics.dealsSucceeded / (report.metrics.dealsSucceeded + report.metrics.dealsLost)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 