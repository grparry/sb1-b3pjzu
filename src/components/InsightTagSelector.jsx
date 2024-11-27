import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Plus, Trash2 } from 'lucide-react';
import InsightTagModal from './InsightTagModal';

function InsightTagSelector({ formData, setFormData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetedCustomers, setTargetedCustomers] = useState(5890);
  const [currentTagType, setCurrentTagType] = useState('Must Have');

  const handleAddTags = (type) => {
    setCurrentTagType(type);
    setIsModalOpen(true);
  };

  const handleConfirmTags = (tags) => {
    const newSelectedTags = [...(formData.selectedTags || [])];
    newSelectedTags.push({
      type: currentTagType,
      conditions: [{
        tags: tags.map(t => t.name),
        operator: 'AND'
      }]
    });
    setFormData({ ...formData, selectedTags: newSelectedTags });
  };

  const handleRemoveTag = (groupIndex, tagIndex) => {
    const newSelectedTags = [...formData.selectedTags];
    const group = newSelectedTags[groupIndex];
    
    if (group.conditions[0].tags.length === 1) {
      newSelectedTags.splice(groupIndex, 1);
    } else {
      group.conditions[0].tags.splice(tagIndex, 1);
    }
    
    setFormData({ ...formData, selectedTags: newSelectedTags });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Target Customer Segmentation Definition</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {targetedCustomers.toLocaleString()} Targeted Customers
          </span>
          <button className="px-4 py-1 text-sm font-medium text-sky-500 border border-sky-500 rounded hover:bg-sky-50">
            RECALCULATE
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleAddTags('Must Have')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-500 border border-sky-500 rounded-full hover:bg-sky-50"
        >
          <Plus size={16} />
          INCLUDE INSIGHT TAG
        </button>
        <button
          onClick={() => handleAddTags('Must Not Have')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-500 border border-sky-500 rounded-full hover:bg-sky-50"
        >
          <Plus size={16} />
          EXCLUDE INSIGHT TAG
        </button>
      </div>

      <div className="space-y-4">
        {formData.selectedTags && formData.selectedTags.map((group, groupIndex) => (
          <div key={groupIndex} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">{group.type}</span>
                <div className="flex items-center gap-2">
                  {group.conditions[0].tags.map((tag, tagIndex) => (
                    <div
                      key={tagIndex}
                      className="flex items-center gap-2 bg-sky-50 text-sky-500 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(groupIndex, tagIndex)}
                        className="hover:text-sky-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {group.conditions[0].operator === 'OR' && (
                    <span className="text-sm text-gray-500">OR</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Plus size={16} />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <InsightTagModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmTags}
      />
    </div>
  );
}

InsightTagSelector.propTypes = {
  formData: PropTypes.shape({
    selectedTags: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      conditions: PropTypes.arrayOf(PropTypes.shape({
        tags: PropTypes.arrayOf(PropTypes.string).isRequired,
        operator: PropTypes.string.isRequired
      })).isRequired
    }))
  }).isRequired,
  setFormData: PropTypes.func.isRequired
};

export default InsightTagSelector;