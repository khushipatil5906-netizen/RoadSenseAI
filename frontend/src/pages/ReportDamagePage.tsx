import React, { useState } from 'react';
import {
  Camera,
  Upload,
  MapPin,
  Navigation,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
  Info,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { MapComponent } from '../components/MapComponent';
import { RoadReport } from '../types';

interface ReportDamagePageProps {
  onNavigate: (page: string, reportId?: number) => void;
}

const DAMAGE_TYPES = [
  { id: 'pothole', label: 'Pothole (D40)', desc: 'Localized depression/cavity in asphalt surface' },
  { id: 'alligator_crack', label: 'Alligator / Fatigue Crack (D20)', desc: 'Interconnected network of fatigue fractures' },
  { id: 'longitudinal_crack', label: 'Longitudinal Crack (D00)', desc: 'Crack parallel to direction of vehicle travel' },
  { id: 'transverse_crack', label: 'Transverse Crack (D10)', desc: 'Crack perpendicular to pavement center line' },
  { id: 'multi_damage', label: 'Multiple Structural Defects', desc: 'Combined cracks and surface degradation' },
];

const ROAD_CATEGORIES = [
  'Highway/Expressway',
  'Major Arterial',
  'Secondary Arterial',
  'Local/Collector',
  'Alley/Access Road',
];

export const ReportDamagePage: React.FC<ReportDamagePageProps> = ({ onNavigate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [damageType, setDamageType] = useState('pothole');
  const [roadCategory, setRoadCategory] = useState('Local/Collector');
  const [roadName, setRoadName] = useState('');
  const [locality, setLocality] = useState('');

  // Coordinates
  const [latitude, setLatitude] = useState<number>(19.0760);
  const [longitude, setLongitude] = useState<number>(72.8777);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Environmental inputs (Optional)
  const [trafficLevel, setTrafficLevel] = useState<number>(3);
  const [rainfallExposure, setRainfallExposure] = useState<string>('120');
  const [roadImportance, setRoadImportance] = useState<number>(3);

  // Photo upload & preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<RoadReport | null>(null);

  // Handle Photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('Selected image exceeds the 15MB limit.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, or WebP).');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Browser geolocation is not supported by your device.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setGeoLocating(false);
      },
      (err) => {
        setGeoError(`Location permission denied or unavailable: ${err.message}`);
        setGeoLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Map click coordinate picker
  const handleMapPick = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a descriptive report title.');
      return;
    }
    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Please provide valid latitude and longitude coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      if (description) fd.append('description', description.trim());
      fd.append('damage_type', damageType);
      fd.append('latitude', String(latitude));
      fd.append('longitude', String(longitude));
      if (locality) fd.append('location_description', locality.trim());
      if (roadName) fd.append('road_name', roadName.trim());
      fd.append('road_category', roadCategory);
      if (trafficLevel) fd.append('traffic_level', String(trafficLevel));
      if (rainfallExposure) fd.append('rainfall_exposure', rainfallExposure);
      if (roadImportance) fd.append('road_importance', String(roadImportance));
      if (selectedFile) fd.append('image', selectedFile);

      const report = await api.createReport(fd);
      setSuccessReport(report);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'Failed to submit report. Please check input values.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successReport) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Road Damage Report Saved</h2>
          <p className="text-sm text-slate-500 font-mono font-semibold">Record ID #{successReport.id} successfully persisted in database</p>
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-left space-y-3 font-medium">
          <div className="flex justify-between border-b border-slate-200 pb-2.5">
            <span className="text-slate-500">Report Title:</span>
            <span className="font-bold text-slate-800">{successReport.title}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2.5">
            <span className="text-slate-500">Predicted AI Severity:</span>
            <span className="font-extrabold text-slate-900">{successReport.predicted_severity}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2.5">
            <span className="text-slate-500">Triage Priority Score:</span>
            <span className="font-black text-blue-600 font-mono text-base">
              {successReport.priority_score ? `${successReport.priority_score.toFixed(2)} / 5.0` : 'Pending'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold text-slate-700 capitalize">{successReport.status.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('analysis', successReport.id)}
            className="flex-1 py-3.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>View Full AI Severity Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccessReport(null);
              setTitle('');
              setDescription('');
              setSelectedFile(null);
              setImagePreview(null);
            }}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto space-y-7 pb-16">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Report Road Damage Incident</h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          Upload surface photos, specify road location, and trigger automated defect severity analysis.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Step 1: Photograph Upload */}
        <div className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-base lg:text-lg text-slate-900">1. Road Damage Photograph</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* Upload Dropzone */}
            <div>
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all text-center"
              >
                <Upload className="w-10 h-10 text-blue-500 mb-3" />
                <span className="font-bold text-sm text-slate-800">
                  {selectedFile ? selectedFile.name : 'Click to select photograph'}
                </span>
                <span className="text-xs text-slate-500 mt-1 font-medium">
                  Supports JPEG, PNG, WebP (Max 15MB)
                </span>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Live Preview */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/70 text-white text-xs font-bold tracking-wide">
                    Live Preview
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-slate-400 text-sm font-medium">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span>No image selected yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Damage Details */}
        <div className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-base lg:text-lg text-slate-900">2. Defect Description & Classification</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-700">Report Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hazardous pothole cluster near Western Express flyover descent"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Observed Defect Type</label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {DAMAGE_TYPES.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Road Hierarchy / Category</label>
              <select
                value={roadCategory}
                onChange={(e) => setRoadCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {ROAD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-700">Detailed Damage Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include surface observations: depth, pooling rainwater, loose gravel, lane obstruction..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Location & Interactive Map Picker */}
        <div className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="font-extrabold text-base lg:text-lg text-slate-900">3. Geographic Location</h2>
            </div>

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={geoLocating}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>{geoLocating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          {geoError && (
            <p className="text-xs sm:text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
              {geoError}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Road Name / Highway Number</label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. SV Road / NH-48"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Address / Locality / Landmark</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Near Metro Pillar 142, Andheri West"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Latitude Coordinate *</label>
              <input
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Longitude Coordinate *</label>
              <input
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Interactive Map Location Picker */}
          <div className="space-y-2 pt-2">
            <p className="text-xs sm:text-sm text-slate-600 font-semibold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Or click anywhere on the map below to pinpoint the defect coordinates:</span>
            </p>
            <MapComponent
              isPickerMode={true}
              selectedLocation={{ lat: latitude, lng: longitude }}
              onLocationPick={handleMapPick}
              className="h-80 xl:h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-inner"
            />
          </div>
        </div>

        {/* Step 4: Environmental Priority Factors (Optional) */}
        <div className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-base lg:text-lg text-slate-900">4. Environmental & Traffic Context (Priority Weights)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm font-medium">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-bold text-slate-700">Traffic Volume (1–5)</label>
                <span className="font-black text-blue-600">{trafficLevel}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={trafficLevel}
                onChange={(e) => setTrafficLevel(parseInt(e.target.value))}
                className="w-full accent-blue-600 h-2 cursor-pointer"
              />
              <span className="text-xs text-slate-500 block font-medium">1=Light Residential, 5=Heavy Transit</span>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-700">Monthly Rainfall Exposure (mm)</label>
              <input
                type="number"
                min={0}
                value={rainfallExposure}
                onChange={(e) => setRainfallExposure(e.target.value)}
                placeholder="e.g. 150"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800"
              />
              <span className="text-xs text-slate-500 block font-medium">Monsoon water pooling risk factor</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-bold text-slate-700">Road Corridor Importance (1–5)</label>
                <span className="font-black text-blue-600">{roadImportance}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={roadImportance}
                onChange={(e) => setRoadImportance(parseInt(e.target.value))}
                className="w-full accent-blue-600 h-2 cursor-pointer"
              />
              <span className="text-xs text-slate-500 block font-medium">5=Hospital / Emergency lifeline</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-base font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <span>Processing photo & running AI inference...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Submit Report & Run AI Severity Analysis</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
