'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, SlidersHorizontal, X, Clock } from 'lucide-react';

export interface SearchParams {
  query: string;
  location: string;
  pincode: string;
  openNow: boolean;
  hasQueue: boolean;
  clinicType: string;
  sortBy: string;
}

interface SearchPanelProps {
  onSearch: (params: SearchParams) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [pincode, setPincode] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [hasQueue, setHasQueue] = useState(false);
  const [clinicType, setClinicType] = useState('All');
  const [sortBy, setSortBy] = useState('shortest_wait');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search trigger
  useEffect(() => {
    const delay = setTimeout(() => {
      onSearch({
        query,
        location,
        pincode,
        openNow,
        hasQueue,
        clinicType,
        sortBy,
      });
    }, 400);

    return () => clearTimeout(delay);
  }, [query, location, pincode, openNow, hasQueue, clinicType, sortBy, onSearch]);

  const handleClearFilters = () => {
    setQuery('');
    setLocation('');
    setPincode('');
    setOpenNow(false);
    setHasQueue(false);
    setClinicType('All');
    setSortBy('shortest_wait');
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Search Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by clinic name, doctor, or specialization..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs font-bold border border-border-subtle rounded-2xl bg-bg-surface focus:outline-none focus:border-primary transition"
          />
        </div>

        <div className="w-full md:w-56 relative">
          <MapPin className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="City, area or ZIP code"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs font-bold border border-border-subtle rounded-2xl bg-bg-surface focus:outline-none focus:border-primary transition"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'primary' : 'outline'}
            className="px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold h-11 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'shortest_wait', label: 'Shortest Wait Time' },
              { value: 'name_asc', label: 'Alphabetical A-Z' },
              { value: 'newest', label: 'Newest Registered' },
            ]}
            className="rounded-2xl h-11 border border-border-subtle text-xs font-bold w-44"
          />
        </div>
      </div>

      {/* Expandable Advanced Filters Drawer Drawer */}
      {showFilters && (
        <Card className="p-5 border border-border-subtle bg-bg-muted/10 flex flex-col gap-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-border-subtle/50 pb-2.5">
            <span className="text-xs font-black text-text-primary uppercase tracking-wider">Advanced Filter Parameters</span>
            <button 
              onClick={handleClearFilters}
              className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase"
            >
              <X className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Filter checkboxes */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-text-secondary">
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => setOpenNow(e.target.checked)}
                className="rounded border-border-subtle text-primary focus:ring-primary-glow"
              />
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-text-muted" /> Open Now Only</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-text-secondary">
              <input
                type="checkbox"
                checked={hasQueue}
                onChange={(e) => setHasQueue(e.target.checked)}
                className="rounded border-border-subtle text-primary focus:ring-primary-glow"
              />
              <span>Live Queue Enabled</span>
            </label>

            {/* Clinic Type Selection */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Clinic Category</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['All', 'Single Doctor', 'Multi Doctor', 'Dental', 'Physiotherapy'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setClinicType(type)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                      clinicType === type
                        ? 'bg-primary text-white'
                        : 'bg-bg-surface text-text-secondary border border-border-subtle hover:bg-border-subtle'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </Card>
      )}
    </div>
  );
};
export default SearchPanel;
