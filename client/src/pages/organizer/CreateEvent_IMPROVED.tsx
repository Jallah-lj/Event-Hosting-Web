import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Clock, Tag, Globe, X, ChevronDown, ChevronUp, Upload, Image as ImageIcon
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { TicketTier, Sponsor, SocialLinks, ContactInfo } from '../../types';
import eventsService from '../../services/eventsService';
import api, { getErrorMessage } from '../../services/api';

const categories = ['Culture', 'Business', 'Music', 'Sports', 'Education', 'Technology', 'Food', 'Art'];

interface ScheduleItem {
  id: string;
  time: string;
  endTime: string;
  title: string;
  description: string;
  speaker: string;
}

interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  expiryDate: string;
}

const CreateEvent_IMPROVED: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const isEditing = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    schedule: false,
    speakers: false,
    sponsors: false,
    faqs: false,
    promoCodes: false,
    social: false,
    media: true
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    price: 0,
    category: 'Culture',
    imageUrl: '',
    capacity: 100,
    isVirtual: false,
    virtualLink: '',
    refundPolicy: 'No refunds within 24 hours of event.',
    ageRestriction: '',
    tags: [] as string[],
    isRecurring: false,
    recurringType: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    recurringEndDate: '',
    enableWaitlist: false,
    earlyBirdEndDate: '',
    isDraft: false,
    flyerUrl: '' // New field for flyer
  });

  const [tagInput, setTagInput] = useState('');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: ''
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: ''
  });

  const [ticketTiers, setTicketTiers] = useState<Partial<TicketTier>[]>([
    { name: 'General Admission', price: 0, quantity: 100, benefits: 'Standard entry' }
  ]);

  useEffect(() => {
    if (isEditing) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      const event = await eventsService.getById(id!);
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date.slice(0, 16),
        endDate: event.endDate?.slice(0, 16) || '',
        location: event.location,
        price: event.price,
        category: event.category,
        imageUrl: event.imageUrl || '',
        capacity: event.capacity || 0,
        isVirtual: event.isVirtual || false,
        virtualLink: event.virtualLink || '',
        refundPolicy: event.refundPolicy || '',
        ageRestriction: event.ageRestriction || '',
        tags: event.tags || [],
        isRecurring: event.isRecurring || false,
        recurringType: event.recurringType || 'weekly',
        recurringEndDate: event.recurringEndDate || '',
        enableWaitlist: event.enableWaitlist || false,
        earlyBirdEndDate: event.earlyBirdEndDate || '',
        isDraft: event.isDraft || false,
        flyerUrl: (event as any).flyerUrl || ''
      });
      if (event.imageUrl) {
        setImagePreview(event.imageUrl);
      }
    } catch (error) {
      addToast('Failed to load event', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  // Image upload handlers
  const handleImageUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Please upload an image file (JPEG, PNG, GIF, or WebP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('Image must be less than 10MB', 'error');
      return;
    }

    setUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'event');

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ ...formData, imageUrl: response.data.url });
      addToast('Event image uploaded successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
    addToast('Image removed', 'success');
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addTicketTier = () => {
    setTicketTiers([
      ...ticketTiers,
      { name: '', price: 0, quantity: 50, benefits: '' }
    ]);
  };

  const removeTicketTier = (index: number) => {
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const updateTicketTier = (index: number, updates: Partial<TicketTier>) => {
    const newTiers = [...ticketTiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    setTicketTiers(newTiers);
  };

  const handleSubmit = async (e: React.FormEvent, status: string = 'PENDING') => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.location) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        status,
        organizerId: user!.id,
        organizerName: user!.name,
        ticketTiers: ticketTiers.map(t => ({
          ...t,
          allocation: t.quantity
        })) as TicketTier[]
      };

      if (isEditing) {
        await eventsService.update(id!, eventData as any);
        addToast('Event updated successfully', 'success');
      } else {
        await eventsService.create(eventData as any);
        addToast('Event created successfully! It will be reviewed by admin.', 'success');
      }
      navigate('/organizer');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 bg-liberia-blue rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <button
        onClick={() => navigate('/organizer')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-6">
        {isEditing ? 'Edit Event' : 'Create New Event'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Event Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="Describe your event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Monrovia Convention Center"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  min="1"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Media Section - ENHANCED */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedSections({ ...expandedSections, media: !expandedSections.media })}
            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-liberia-blue" />
              Event Media
            </h2>
            {expandedSections.media ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.media && (
            <div className="p-6 pt-0 space-y-6 border-t border-gray-200 dark:border-gray-700">
              {/* Event Image Upload */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Event Image/Cover Photo</h3>
                
                {/* Drag and Drop Zone */}
                <div
                  ref={dragZoneRef}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative rounded-lg border-2 border-dashed transition-colors ${
                    dragActive
                      ? 'border-liberia-blue bg-liberia-blue/5'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {imagePreview ? (
                    <div className="p-4">
                      <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={imagePreview}
                          alt="Event preview"
                          className="w-full h-48 object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Click or drag another image to replace
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 text-center cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Drag and drop your event image here
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        or click to browse
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Supported: JPG, PNG, GIF, WebP (Max 10MB)
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>

                {uploading && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-liberia-blue">
                    <div className="w-4 h-4 border-2 border-liberia-blue border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This image will be displayed as the event cover photo
                </p>
              </div>

              {/* Alternative: URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Or provide image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Event Flyer Upload - NEW FEATURE */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Event Flyer (Optional)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Upload a PDF, image, or document flyer for this event
                </p>
                
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                  <button
                    type="button"
                    onClick={() => alert('Flyer upload coming soon - will allow PDF and image uploads')}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-liberia-blue text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Flyer (PDF, JPG, PNG)
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Max file size: 25MB. Supported formats: PDF, JPG, PNG, WebP
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Ticket Tiers */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ticket Tiers</h2>
            <Button size="sm" variant="outline" type="button" onClick={addTicketTier}>
              <Plus className="w-4 h-4 mr-1" /> Add Tier
            </Button>
          </div>

          <div className="space-y-4">
            {ticketTiers.map((tier, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900 dark:text-white">Tier {index + 1}</h4>
                  {ticketTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketTier(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={tier.name || ''}
                    onChange={(e) => updateTicketTier(index, { name: e.target.value })}
                    placeholder="Tier name"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    value={tier.price || 0}
                    onChange={(e) => updateTicketTier(index, { price: parseFloat(e.target.value) })}
                    placeholder="Price"
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <input
                  type="number"
                  value={tier.quantity || 0}
                  onChange={(e) => updateTicketTier(index, { quantity: parseInt(e.target.value) })}
                  placeholder="Quantity available"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                />

                <textarea
                  value={tier.benefits || ''}
                  onChange={(e) => updateTicketTier(index, { benefits: e.target.value })}
                  placeholder="Benefits/included items"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Submit Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/organizer')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1"
          >
            {isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent_IMPROVED;
