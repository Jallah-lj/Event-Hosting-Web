// @components/organizer/EventForm.tsx
// Reusable event form component for create/edit operations

import React, { useState, useEffect } from 'react';
import { Event, TicketTier } from '../../types';
import { Button } from '../Button';
import { Plus, Trash2, Wand2, ImagePlus, Loader2 } from 'lucide-react';
import { useToast } from '../Toast';
import { validateEventForm, ValidationError } from '../../utils/validation';
import { generateEventDescription, generateEventImage } from '../../services/geminiService';

interface EventFormProps {
  event?: Event | null;
  onSubmit: (eventData: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSubmit, onCancel, isLoading = false }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: event?.title || '',
    category: event?.category || 'Culture',
    location: event?.location || 'Monrovia, Liberia',
    date: event?.date || '',
    endDate: event?.endDate || '',
    capacity: event?.capacity || '',
    description: event?.description || '',
    imageUrl: event?.imageUrl || '',
    ticketTiers: event?.ticketTiers || [{ id: '1', name: 'General Admission', price: 0, allocation: 100 }],
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const categories = ['Culture', 'Business', 'Music', 'Sports', 'Education', 'Technology', 'Food', 'Art'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    setErrors(errors.filter(e => e.field !== field));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title) {
      addToast('Please enter an event title first', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const desc = await generateEventDescription(formData.title, formData.category, formData.location);
      setFormData(prev => ({ ...prev, description: desc }));
      addToast('Description generated successfully', 'success');
    } catch (error) {
      addToast('Failed to generate description', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.title) {
      addToast('Please enter an event title first', 'warning');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const img = await generateEventImage(`${formData.title} - ${formData.category} event in ${formData.location}`);
      if (img) {
        setFormData(prev => ({ ...prev, imageUrl: img }));
        addToast('Cover image generated successfully', 'success');
      } else {
        addToast('Failed to generate image', 'error');
      }
    } catch (error) {
      addToast('Error generating image', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAddTicketTier = () => {
    setFormData(prev => ({
      ...prev,
      ticketTiers: [
        ...prev.ticketTiers,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: `Tier ${prev.ticketTiers.length + 1}`,
          price: 0,
          allocation: 50,
        },
      ],
    }));
  };

  const handleRemoveTicketTier = (id: string) => {
    if (formData.ticketTiers.length === 1) {
      addToast('You must have at least one ticket tier', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter(t => t.id !== id),
    }));
  };

  const handleUpdateTicketTier = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map(t =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PENDING') => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateEventForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      addToast(`Please fix ${validationErrors.length} error(s) in the form`, 'error');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        status,
        organizerId: localStorage.getItem('userId'),
      });
    } catch (error) {
      addToast('Failed to save event', 'error');
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const errorClass = "text-xs text-red-600 dark:text-red-400 mt-1";

  const getFieldError = (fieldName: string) => errors.find(e => e.field === fieldName)?.message;

  return (
    <form className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-6 dark:text-white">Event Details</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className={labelClass}>Event Title *</label>
            <input
              type="text"
              className={inputClass}
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder="e.g., Annual Music Festival 2024"
              maxLength={100}
            />
            {getFieldError('title') && <div className={errorClass}>{getFieldError('title')}</div>}
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category *</label>
            <select
              className={inputClass}
              value={formData.category}
              onChange={e => handleInputChange('category', e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {getFieldError('category') && <div className={errorClass}>{getFieldError('category')}</div>}
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Location *</label>
            <input
              type="text"
              className={inputClass}
              value={formData.location}
              onChange={e => handleInputChange('location', e.target.value)}
              placeholder="e.g., Monrovia, Liberia"
            />
            {getFieldError('location') && <div className={errorClass}>{getFieldError('location')}</div>}
          </div>

          {/* Capacity */}
          <div>
            <label className={labelClass}>Capacity *</label>
            <input
              type="number"
              className={inputClass}
              value={formData.capacity}
              onChange={e => handleInputChange('capacity', e.target.value)}
              placeholder="500"
              min="1"
            />
            {getFieldError('capacity') && <div className={errorClass}>{getFieldError('capacity')}</div>}
          </div>

          {/* Start Date */}
          <div>
            <label className={labelClass}>Start Date *</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={formData.date}
              onChange={e => handleInputChange('date', e.target.value)}
            />
            {getFieldError('date') && <div className={errorClass}>{getFieldError('date')}</div>}
          </div>

          {/* End Date */}
          <div>
            <label className={labelClass}>End Date *</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={formData.endDate}
              onChange={e => handleInputChange('endDate', e.target.value)}
            />
            {getFieldError('endDate') && <div className={errorClass}>{getFieldError('endDate')}</div>}
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-1">
            <label className={labelClass}>Description *</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateDescription}
              disabled={isGenerating || !formData.title}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              AI Generate
            </Button>
          </div>
          <textarea
            className={inputClass}
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Describe your event in detail..."
            rows={5}
            minLength={50}
          />
          {getFieldError('description') && <div className={errorClass}>{getFieldError('description')}</div>}
        </div>

        {/* Cover Image */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-1">
            <label className={labelClass}>Cover Image</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !formData.title}
            >
              {isGeneratingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
              Generate
            </Button>
          </div>
          {formData.imageUrl && (
            <img src={formData.imageUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-lg mb-2" />
          )}
          <input
            type="url"
            className={inputClass}
            value={formData.imageUrl}
            onChange={e => handleInputChange('imageUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Ticket Tiers */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg dark:text-white">Ticket Tiers</h3>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddTicketTier}>
            <Plus className="w-4 h-4 mr-2" /> Add Tier
          </Button>
        </div>

        <div className="space-y-4">
          {formData.ticketTiers.map((tier, idx) => (
            <div key={tier.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  className={inputClass}
                  value={tier.name}
                  onChange={e => handleUpdateTicketTier(tier.id, 'name', e.target.value)}
                  placeholder="Tier name"
                />
                <input
                  type="number"
                  className={inputClass}
                  value={tier.price}
                  onChange={e => handleUpdateTicketTier(tier.id, 'price', parseFloat(e.target.value))}
                  placeholder="Price"
                  min="0"
                />
                <input
                  type="number"
                  className={inputClass}
                  value={tier.allocation}
                  onChange={e => handleUpdateTicketTier(tier.id, 'allocation', parseInt(e.target.value))}
                  placeholder="Allocation"
                  min="1"
                />
              </div>
              {formData.ticketTiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTicketTier(tier.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Remove Tier
                </button>
              )}
            </div>
          ))}
        </div>
        {getFieldError('ticketTiers') && <div className={errorClass}>{getFieldError('ticketTiers')}</div>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={e => handleSubmit(e, 'DRAFT')}
          disabled={isLoading}
        >
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={e => handleSubmit(e, 'PENDING')}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Submit for Approval
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
