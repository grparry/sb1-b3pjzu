import { useState, useEffect } from 'react';
import { logError } from '../services/storage';
import useNudgeStore from '../stores/nudgeStore';

const initialFormData = {
  title: '',
  collection: '',
  businessValue: '',
  priority: '',
  description: '',
  version: '1 - Draft',
  notificationTitle: '',
  notificationBody: '',
  image: '',
  ageRange: { min: 18, max: 65 },
  income: { min: 0, max: 0 },
  gender: '-1',
  lastNotification: { days: '' },
  registration: { registeredOnly: false },
  selectedTags: [],
  comment: ''
};

function useNudgeForm(id, onSuccess) {
  const [formData, setFormData] = useState(id ? null : { ...initialFormData });
  const { 
    fetchNudge, 
    createNudge, 
    updateNudge,
    isLoading, 
    error: storeError 
  } = useNudgeStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadNudge() {
      if (!id) return;

      try {
        setError(null);
        const data = await fetchNudge(id);
        
        if (mounted) {
          setFormData({
            ...initialFormData,
            ...data
          });
        }
      } catch (err) {
        if (mounted) {
          await logError(err);
          console.error('Error loading nudge:', err);
          setError(err.message);
          setFormData(null);
        }
      }
    }

    loadNudge();

    return () => {
      mounted = false;
    };
  }, [id, fetchNudge]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      if (id) {
        await updateNudge(id, formData);
      } else {
        await createNudge(formData);
      }
      
      onSuccess?.();
    } catch (err) {
      await logError(err);
      console.error('Error saving nudge:', err);
      setError(err.message);
    }
  };

  return {
    formData,
    setFormData,
    handleSubmit,
    isLoading,
    error: error || storeError
  };
}

export default useNudgeForm;