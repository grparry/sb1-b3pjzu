import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

function Campaigns() {
  const campaigns = [
    { id: 1, name: 'Campaign 16042021_1', description: 'Campaign 16042021_1', enterprise: 'AbakaTest', created: '4/16/2021 11:35:16 PM', status: 'Active' },
    { id: 2, name: 'OTP Car loan', description: '', enterprise: 'AbakaTest', created: '4/30/2021 11:18:08 PM', status: 'Inactive' },
    { id: 3, name: 'Campaign 16042021_2', description: 'Campaign 16042021_2', enterprise: 'AbakaTest', created: '4/16/2021 11:35:25 PM', status: 'Disabled' },
    { id: 4, name: 'New Campaign', description: '', enterprise: 'AbakaTest', created: '5/4/2021 9:10:10 AM', status: 'Active' },
    { id: 5, name: 'Campaign Test AA', description: 'Campaign Test AA', enterprise: 'AbakaTest', created: '4/9/2021 12:31:52 PM', status: 'Active' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'text-green-500',
      'Inactive': 'text-yellow-500',
      'Disabled': 'text-red-500'
    };
    return colors[status] || 'text-gray-500';
  };

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Campaigns' }
          ]}
        />

        <div className="mt-4">
          <Link
            to="/campaigns/new"
            className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
          >
            <Plus size={20} />
            Create Campaign
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-4 px-6 font-medium">Name</th>
              <th className="text-left py-4 px-6 font-medium">Description</th>
              <th className="text-left py-4 px-6 font-medium">Enterprise</th>
              <th className="text-left py-4 px-6 font-medium">Created Date</th>
              <th className="text-left py-4 px-6 font-medium">Status</th>
              <th className="text-left py-4 px-6 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-6">{campaign.name}</td>
                <td className="py-4 px-6">{campaign.description}</td>
                <td className="py-4 px-6">{campaign.enterprise}</td>
                <td className="py-4 px-6">{campaign.created}</td>
                <td className="py-4 px-6">
                  <span className={getStatusColor(campaign.status)}>{campaign.status}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/campaigns/edit/${campaign.id}`}
                      className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button className="p-1 hover:bg-gray-100 rounded text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Campaigns;