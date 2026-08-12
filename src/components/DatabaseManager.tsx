import React, { useState } from 'react';
import {
  Search,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Copy,
  Download,
  FileJson,
  Check,
  X,
  Type,
  Palette,
  Sparkles,
  Shield,
  Layers,
  Info,
  Image as ImageIcon,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { DesignPreset } from '../types';
import { registerCustomFont } from '../utils/fontLoader';
import { generateSampleNumberAssets } from '../utils/numberAssetHelper';
import { generateSampleLetterAssets } from '../utils/letterAssetHelper';
import { trimTransparentImageCanvas } from '../utils/imageTrimmer';

interface DatabaseManagerProps {
  presets: DesignPreset[];
  setPresets: React.Dispatch<React.SetStateAction<DesignPreset[]>>;
  onSelectPresetForTesting?: (presetCode: string) => void;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({
  presets,
  setPresets,
  onSelectPresetForTesting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('All');
  const [editingPreset, setEditingPreset] = useState<DesignPreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadFontStatus, setUploadFontStatus] = useState<string>('');

  // League filters
  const leagues = ['All', 'La Liga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS', 'International', 'Retro', 'Custom'];

  const filteredPresets = presets.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.league.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'All' || p.league === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  const handleCreateNew = () => {
    const newPreset: DesignPreset = {
      id: `preset-custom-${Date.now()}`,
      code: `SJ-CUSTOM-${Math.floor(100 + Math.random() * 900)}`,
      teamName: 'Custom Team',
      league: 'Custom',
      season: '2023-24',
      fontFamily: 'Oswald',
      textColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 4,
      textEffect: 'none',
      numberStyle: {
        fontFamily: 'Oswald',
        fillColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 6,
        badgeIcon: 'crest',
      },
      defaultNameWidthInches: 12.0,
      defaultNameHeightInches: 2.2,
      defaultNumberHeightInches: 9.5,
      notes: 'New custom design specification preset.',
    };
    setEditingPreset(newPreset);
    setIsCreating(true);
  };

  const handleDuplicate = (preset: DesignPreset) => {
    const duplicated: DesignPreset = {
      ...preset,
      id: `preset-copy-${Date.now()}`,
      code: `${preset.code}-COPY`,
      teamName: `${preset.teamName} (Copy)`,
    };
    setPresets([duplicated, ...presets]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this design preset?')) {
      setPresets(presets.filter((p) => p.id !== id));
    }
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset) return;

    if (isCreating) {
      setPresets([editingPreset, ...presets]);
    } else {
      setPresets(presets.map((p) => (p.id === editingPreset.id ? editingPreset : p)));
    }
    setEditingPreset(null);
    setIsCreating(false);
  };

  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPreset) return;

    try {
      setUploadFontStatus('Loading font file...');
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fontDataUrl = event.target?.result as string;
        const fontName = file.name.replace(/\.[^/.]+$/, '');
        const registeredName = await registerCustomFont(fontName, fontDataUrl);

        setEditingPreset({
          ...editingPreset,
          fontFamily: registeredName,
          customFontDataUrl: fontDataUrl,
        });
        setUploadFontStatus(`Uploaded font "${file.name}" loaded successfully!`);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadFontStatus('Failed to load font file.');
    }
  };

  const handleNumberAssetUpload = (digit: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPreset) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const trimmed = await trimTransparentImageCanvas(dataUrl);
      setEditingPreset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          numberAssets: {
            ...(prev.numberAssets || {}),
            [digit]: trimmed.dataUrl,
          },
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearNumberAsset = (digit: string) => {
    if (!editingPreset) return;
    setEditingPreset((prev) => {
      if (!prev) return prev;
      const updated = { ...(prev.numberAssets || {}) };
      delete updated[digit];
      return {
        ...prev,
        numberAssets: updated,
      };
    });
  };

  const handleGenerateSampleNumberAssets = () => {
    if (!editingPreset) return;
    const sampleAssets = generateSampleNumberAssets(
      editingPreset.fontFamily,
      editingPreset.textColor,
      editingPreset.strokeColor
    );
    setEditingPreset((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        numberAssets: sampleAssets,
      };
    });
  };

  const handleLetterAssetUpload = (letter: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPreset) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const trimmed = await trimTransparentImageCanvas(dataUrl);
      setEditingPreset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          letterAssets: {
            ...(prev.letterAssets || {}),
            [letter]: trimmed.dataUrl,
          },
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearLetterAsset = (letter: string) => {
    if (!editingPreset) return;
    setEditingPreset((prev) => {
      if (!prev) return prev;
      const updated = { ...(prev.letterAssets || {}) };
      delete updated[letter];
      return {
        ...prev,
        letterAssets: updated,
      };
    });
  };

  const handleGenerateSampleLetterAssets = () => {
    if (!editingPreset) return;
    const sampleAssets = generateSampleLetterAssets(
      editingPreset.fontFamily,
      editingPreset.textColor,
      editingPreset.strokeColor
    );
    setEditingPreset((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        letterAssets: sampleAssets,
      };
    });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(presets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'spidey_jersey_presets_database.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setPresets(imported);
          alert(`Successfully imported ${imported.length} design presets!`);
        }
      } catch (err) {
        alert('Invalid JSON database file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-white uppercase flex items-center space-x-2">
            <Layers className="w-6 h-6 text-red-500" />
            <span>Design & Font Management Database</span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Store, map, and edit team fonts, colors, strokes, and vector styles for 100+ football clubs & custom design codes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs rounded shadow-lg shadow-red-900/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Design Code</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold uppercase tracking-wider text-xs rounded border border-zinc-800"
            title="Backup Database to JSON"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Backup JSON</span>
          </button>

          <label className="flex items-center space-x-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold uppercase tracking-wider text-xs rounded border border-zinc-800 cursor-pointer">
            <Upload className="w-4 h-4 text-red-400" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Design Code, Team, or Season..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 text-white pl-10 pr-4 py-2 rounded-lg border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs font-mono placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-[10px] text-zinc-500 font-mono uppercase whitespace-nowrap">League:</span>
          {leagues.map((lg) => (
            <button
              key={lg}
              onClick={() => setSelectedLeague(lg)}
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedLeague === lg
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {lg}
            </button>
          ))}
        </div>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all flex flex-col justify-between group shadow-lg"
          >
            <div>
              {/* Top Code Badge & League */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-xs px-2.5 py-1 bg-red-600/10 text-red-400 border border-red-500/30 rounded">
                  {preset.code}
                </span>
                <span className="text-[10px] font-mono uppercase text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                  {preset.league}
                </span>
              </div>

              <h3 className="font-bold text-white text-base tracking-wide uppercase mb-1">{preset.teamName}</h3>
              <p className="text-xs text-zinc-400 font-mono mb-4">{preset.season} • {preset.fontFamily}</p>

              {/* Live Preview Box */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-4 flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden">
                <div
                  className="text-center font-black tracking-wide mb-1"
                  style={{
                    fontFamily: `"${preset.fontFamily}", sans-serif`,
                    color: preset.textColor,
                    WebkitTextStroke: `${preset.strokeWidth / 2}px ${preset.strokeColor}`,
                    fontSize: '22px',
                  }}
                >
                  {preset.teamName.split(' ')[0]}
                </div>

                <div
                  className="font-black text-3xl"
                  style={{
                    fontFamily: `"${preset.numberStyle?.fontFamily || preset.fontFamily}", sans-serif`,
                    color: preset.numberStyle?.fillColor || preset.textColor,
                    WebkitTextStroke: `${(preset.numberStyle?.strokeWidth || 6) / 2}px ${preset.numberStyle?.strokeColor || preset.strokeColor}`,
                  }}
                >
                  10
                </div>

                {preset.notes && (
                  <span className="absolute bottom-1 right-2 text-[9px] text-zinc-600 font-mono italic max-w-[200px] truncate">
                    {preset.notes}
                  </span>
                )}
              </div>

              {/* Attributes breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 mb-4">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: preset.textColor, borderColor: preset.strokeColor }} />
                  <span>Text: {preset.textColor}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <FileImage className="w-3.5 h-3.5 text-red-400" />
                  <span>
                    {preset.numberAssets && Object.keys(preset.numberAssets).length > 0
                      ? `${Object.keys(preset.numberAssets).length} PNG Assets`
                      : 'Font Numbers'}
                  </span>
                </div>
                <div>Name: {preset.defaultNameWidthInches}" x {preset.defaultNameHeightInches}"</div>
                <div>Num H: {preset.defaultNumberHeightInches}"</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  setEditingPreset(preset);
                  setIsCreating(false);
                }}
                className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Specs</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDuplicate(preset)}
                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-800 transition-all"
                  title="Duplicate Preset"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(preset.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-800 transition-all"
                  title="Delete Preset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {editingPreset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Palette className="w-5 h-5 text-red-500" />
                <span>{isCreating ? 'Create New Design Preset' : `Edit Preset: ${editingPreset.code}`}</span>
              </h2>
              <button
                onClick={() => setEditingPreset(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Design Code *</label>
                  <input
                    type="text"
                    required
                    value={editingPreset.code}
                    onChange={(e) => setEditingPreset({ ...editingPreset, code: e.target.value.toUpperCase() })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs font-mono"
                    placeholder="e.g. SJ-Y5EMT"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Team / Style Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPreset.teamName}
                    onChange={(e) => setEditingPreset({ ...editingPreset, teamName: e.target.value })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs"
                    placeholder="e.g. Barcelona 2016"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">League / Category</label>
                  <select
                    value={editingPreset.league}
                    onChange={(e) => setEditingPreset({ ...editingPreset, league: e.target.value })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs font-mono"
                  >
                    {leagues.filter(l => l !== 'All').map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Season</label>
                  <input
                    type="text"
                    value={editingPreset.season}
                    onChange={(e) => setEditingPreset({ ...editingPreset, season: e.target.value })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              {/* Font Selector & Custom Font Upload */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Type className="w-4 h-4" />
                  <span>Font Specification & Custom Upload</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase mb-1">Font Family</label>
                    <select
                      value={editingPreset.fontFamily}
                      onChange={(e) => setEditingPreset({ ...editingPreset, fontFamily: e.target.value })}
                      className="w-full bg-zinc-900 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs"
                    >
                      <option value="Oswald">Oswald (Premier League style)</option>
                      <option value="Bebas Neue">Bebas Neue (Tall Classic)</option>
                      <option value="Anton">Anton (Bold Block)</option>
                      <option value="Teko">Teko (Modern Narrow)</option>
                      <option value="Jersey 15">Jersey 15 (Pixel / Digital)</option>
                      <option value="Montserrat">Montserrat (Clean Sans)</option>
                      <option value="Orbitron">Orbitron (Sci-Fi / Modern)</option>
                      <option value="Graduate">Graduate (Collegiate Athletic)</option>
                      <option value="Rubik Mono One">Rubik Mono One (Heavy Mono)</option>
                      <option value="Fjalla One">Fjalla One (Display)</option>
                      {editingPreset.customFontDataUrl && (
                        <option value={editingPreset.fontFamily}>{editingPreset.fontFamily} (Custom Uploaded)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase mb-1">Upload Custom Font (.ttf / .woff)</label>
                    <input
                      type="file"
                      accept=".ttf,.woff,.woff2,.otf"
                      onChange={handleCustomFontUpload}
                      className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-red-600/10 file:text-red-400 hover:file:bg-red-600/20"
                    />
                  </div>
                </div>

                {uploadFontStatus && (
                  <p className="text-xs text-emerald-400 font-mono mt-1">{uploadFontStatus}</p>
                )}
              </div>

              {/* Dedicated Section: Upload Number Assets (0-9) */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
                      <FileImage className="w-4 h-4" />
                      <span>Upload Number Assets (0-9)</span>
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Upload high-res PNG or vector graphic files for digits 0-9 for this design code.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleGenerateSampleNumberAssets}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded border border-zinc-800 flex items-center space-x-1"
                      title="Auto-generate matching sample vector number graphics for digits 0-9"
                    >
                      <Sparkles className="w-3 h-3 text-red-400" />
                      <span>Sample 0-9 Set</span>
                    </button>
                    {editingPreset.numberAssets && Object.keys(editingPreset.numberAssets).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setEditingPreset({ ...editingPreset, numberAssets: {} })}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-red-950 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded border border-zinc-800"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of 0-9 Upload Slots */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-1">
                  {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => {
                    const hasAsset = Boolean(editingPreset.numberAssets?.[digit]);
                    const assetUrl = editingPreset.numberAssets?.[digit];

                    return (
                      <div
                        key={digit}
                        className={`relative group bg-zinc-900 border ${
                          hasAsset ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                        } rounded p-1.5 flex flex-col items-center justify-between min-h-[90px] transition-all`}
                      >
                        <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-800">
                          #{digit}
                        </span>

                        <div className="flex-1 flex items-center justify-center my-1 w-full overflow-hidden">
                          {hasAsset && assetUrl ? (
                            <img
                              src={assetUrl}
                              alt={`Number ${digit}`}
                              className="max-h-12 max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-mono italic">No PNG</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 w-full justify-center">
                          <label className="cursor-pointer text-[9px] font-bold uppercase bg-red-600/20 hover:bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 transition-all text-center w-full truncate">
                            {hasAsset ? 'Change' : '+ Upload'}
                            <input
                              type="file"
                              accept="image/*,.svg"
                              onChange={(e) => handleNumberAssetUpload(digit, e)}
                              className="hidden"
                            />
                          </label>
                          {hasAsset && (
                            <button
                              type="button"
                              onClick={() => handleClearNumberAsset(digit)}
                              className="text-zinc-500 hover:text-red-400 p-0.5"
                              title={`Remove asset for digit ${digit}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dedicated Section: Upload Letter Assets (A-Z) for Name Stitching */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>Upload Custom Letter PNG Assets (A-Z Dual Mode)</span>
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Upload individual letter PNG graphics (A-Z) for customer name stitching (100% preserves stencil details &amp; no black strokes).
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleGenerateSampleLetterAssets}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded border border-zinc-800 flex items-center space-x-1"
                      title="Auto-generate sample A-Z vector letter graphics"
                    >
                      <Sparkles className="w-3 h-3 text-red-400" />
                      <span>Sample A-Z Set</span>
                    </button>
                    {editingPreset.letterAssets && Object.keys(editingPreset.letterAssets).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setEditingPreset({ ...editingPreset, letterAssets: {} })}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-red-950 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded border border-zinc-800"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of A-Z Upload Slots */}
                <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-1.5 pt-1 max-h-60 overflow-y-auto pr-1">
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
                    const hasAsset = Boolean(editingPreset.letterAssets?.[letter]);
                    const assetUrl = editingPreset.letterAssets?.[letter];

                    return (
                      <div
                        key={letter}
                        className={`relative group bg-zinc-900 border ${
                          hasAsset ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                        } rounded p-1 flex flex-col items-center justify-between min-h-[75px] transition-all`}
                      >
                        <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-950 px-1 rounded border border-zinc-800">
                          {letter}
                        </span>

                        <div className="flex-1 flex items-center justify-center my-1 w-full overflow-hidden">
                          {hasAsset && assetUrl ? (
                            <img
                              src={assetUrl}
                              alt={`Letter ${letter}`}
                              className="max-h-8 max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[8px] text-zinc-600 font-mono italic">Font</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 w-full justify-center">
                          <label className="cursor-pointer text-[8px] font-bold uppercase bg-red-600/20 hover:bg-red-600/30 text-red-400 px-1 py-0.5 rounded border border-red-500/30 transition-all text-center w-full truncate">
                            {hasAsset ? 'Edit' : '+PNG'}
                            <input
                              type="file"
                              accept="image/*,.svg"
                              onChange={(e) => handleLetterAssetUpload(letter, e)}
                              className="hidden"
                            />
                          </label>
                          {hasAsset && (
                            <button
                              type="button"
                              onClick={() => handleClearLetterAsset(letter)}
                              className="text-zinc-500 hover:text-red-400 p-0.5"
                              title={`Remove asset for letter ${letter}`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Name Text Styling Colors & Strokes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Name Text Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editingPreset.textColor}
                      onChange={(e) => setEditingPreset({ ...editingPreset, textColor: e.target.value })}
                      className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editingPreset.textColor}
                      onChange={(e) => setEditingPreset({ ...editingPreset, textColor: e.target.value })}
                      className="w-full bg-zinc-900 text-white px-2 py-1 rounded border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Name Stroke Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editingPreset.strokeColor}
                      onChange={(e) => setEditingPreset({ ...editingPreset, strokeColor: e.target.value })}
                      className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editingPreset.strokeColor}
                      onChange={(e) => setEditingPreset({ ...editingPreset, strokeColor: e.target.value })}
                      className="w-full bg-zinc-900 text-white px-2 py-1 rounded border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Stroke Width (PX)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editingPreset.strokeWidth}
                    onChange={(e) => setEditingPreset({ ...editingPreset, strokeWidth: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 text-white px-2 py-1.5 rounded border border-zinc-800 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Text Effect & Arc Curve Angle */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Text Style Effect</label>
                  <select
                    value={editingPreset.textEffect}
                    onChange={(e) => setEditingPreset({ ...editingPreset, textEffect: e.target.value as any })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none text-xs font-mono"
                  >
                    <option value="none">Straight</option>
                    <option value="arc">Curved Arc (Manchester Style)</option>
                    <option value="stencil">Stencil Cut</option>
                  </select>
                </div>

                {editingPreset.textEffect === 'arc' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">
                      Arc Curve Angle: <strong>{editingPreset.arcAmount || 15}°</strong>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="45"
                      step="1"
                      value={editingPreset.arcAmount || 15}
                      onChange={(e) =>
                        setEditingPreset({ ...editingPreset, arcAmount: parseInt(e.target.value) || 15 })
                      }
                      className="w-full accent-red-500 cursor-pointer my-1"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Name Width (Inches)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPreset.defaultNameWidthInches}
                    onChange={(e) => setEditingPreset({ ...editingPreset, defaultNameWidthInches: parseFloat(e.target.value) || 12 })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Name Height (Inches)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPreset.defaultNameHeightInches}
                    onChange={(e) => setEditingPreset({ ...editingPreset, defaultNameHeightInches: parseFloat(e.target.value) || 2.2 })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Number Height (Inches)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPreset.defaultNumberHeightInches}
                    onChange={(e) => setEditingPreset({ ...editingPreset, defaultNumberHeightInches: parseFloat(e.target.value) || 9.5 })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Letter Spacing (Kerning/PX)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={typeof editingPreset.letterSpacing === 'number' ? editingPreset.letterSpacing : 3}
                    onChange={(e) => setEditingPreset({ ...editingPreset, letterSpacing: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={editingPreset.notes || ''}
                  onChange={(e) => setEditingPreset({ ...editingPreset, notes: e.target.value })}
                  className="w-full bg-zinc-950 text-white px-3 py-2 rounded border border-zinc-800 focus:border-zinc-600 text-xs font-mono placeholder:text-zinc-600"
                  placeholder="e.g. Official league font specification"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPreset(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white font-bold uppercase tracking-wider rounded shadow-lg shadow-red-900/20 hover:bg-red-500 text-xs"
                >
                  Save Preset Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
