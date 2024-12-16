import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Play, Pause, Send } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import useCampaignStore from '../stores/campaignStore';

function Campaigns() {
  const { 
    campaigns,
    activateCampaign,
    deactivateCampaign,
    testCampaign,
    isLoading,
    error 
  } = useCampaignStore();

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'text-green-500',
      'Inactive': 'text-yellow-500',
      'Disabled': 'text-red-500'
    };
    return colors[status] || 'text-gray-500';
  };

  const handleToggleStatus = async (campaign) => {
    try {
      if (campaign.status === 'Active') {
        await deactivateCampaign(campaign.id);
      } else {
        await activateCampaign(campaign.id);
      }
    } catch (err) {
      console.error('Error toggling campaign status:', err);
    }
  };

  const handleTestCampaign = async (campaignId) => {
    try {
      await testCampaign(campaignId);
      // Show success notification
    } catch (err) {
      console.error('Error testing campaign:', err);
      // Show error notification
    }
  };

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error: {error}
      </div>
    );
  }

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
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-4 px-6 font-medium">Name</th>
                <th className="text-left py-4 px-6 font-medium">Description</th>
                <th className="text-left py-4 px-6 font-medium">Enterprise</th>
                <th className="text-left py-4 px-6 font-medium">Created</th>
                <th className="text-left py-4 px-6 font-medium">Status</th>
                <th className="text-right py-4 px-6 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-4 px-6">{campaign.name}</td>
                  <td className="py-4 px-6">{campaign.description}</td>
                  <td className="py-4 px-6">{campaign.enterprise}</td>
                  <td className="py-4 px-6">{campaign.created}</td>
                  <td className="py-4 px-6">
                    <span className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleToggleStatus(campaign)}
                      className="p-2 text-gray-500 hover:text-sky-500"
                      title={campaign.status === 'Active' ? 'Deactivate' : 'Activate'}
                    >
                      {campaign.status === 'Active' ? (
                        <Pause size={20} />
                      ) : (
                        <Play size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => handleTestCampaign(campaign.id)}
                      className="p-2 text-gray-500 hover:text-sky-500"
                      title="Test Campaign"
                    >
                      <Send size={20} />
                    </button>
                    <Link
                      to={`/campaigns/${campaign.id}/edit`}
                      className="inline-block p-2 text-gray-500 hover:text-sky-500"
                    >
                      <Pencil size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default Campaigns;