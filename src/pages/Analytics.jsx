import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Calendar, BarChart3, LineChart, PieChart, DollarSign, Building2 } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

function Analytics() {
  const [dateRange, setDateRange] = useState({ start: '1/1/2022', end: '5/21/2023' });
  
  const stats = [
    { label: '% Targeted', value: '100%', subValue: '3490 Targeted Users' },
    { label: '% Nudged', value: '41%', subValue: '1442 Nudged Users' },
    { label: 'CTR', value: '23%', subValue: '328 Engaged Users' }
  ];

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Analytics' }
          ]}
        />
      </div>

      <Tab.Group>
        <Tab.List className="flex flex-wrap border-b mb-6">
          {[
            { name: 'OVERVIEW', icon: BarChart3 },
            { name: 'CUSTOMER INSIGHTS', icon: PieChart },
            { name: 'SPENDING ANALYTICS', icon: DollarSign },
            { name: 'MARKET STATISTICS', icon: LineChart },
            { name: 'MERCHANT INSIGHTS', icon: Building2 }
          ].map(({ name, icon: Icon }) => (
            <Tab
              key={name}
              className={({ selected }) =>
                `px-4 lg:px-6 py-3 text-sm font-medium outline-none flex items-center gap-2 whitespace-nowrap ${
                  selected
                    ? 'text-sky-500 border-b-2 border-sky-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon size={16} />
              {name}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <div className="space-y-6">
              <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-semibold">Overview</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>Nudge Dates:</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={dateRange.start}
                        className="border rounded px-2 py-1 w-24"
                        readOnly
                      />
                      <span>-</span>
                      <input
                        type="text"
                        value={dateRange.end}
                        className="border rounded px-2 py-1 w-24"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-navy-900 text-white p-6 rounded-lg">
                      <div className="text-3xl lg:text-4xl font-bold mb-2">{stat.value}</div>
                      <div className="text-gray-400 text-sm">{stat.label}</div>
                      <div className="text-sm mt-2">{stat.subValue}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">User Engagement</h3>
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60" 
                        alt="User Engagement Chart"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Conversion Rates</h3>
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60" 
                        alt="Conversion Rates Chart"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Other panels remain the same */}
        </Tab.Panels>
      </Tab.Group>
    </>
  );
}

export default Analytics;