import { useState, useEffect } from 'react'
import type { Show } from './types/chrome'
import './App.css'
import {
  Shield,
  Plus,
  X,
  Eye,
  EyeOff,
  Search,
  Settings,
  Info,
  Bell,
  Filter,
  ExternalLink,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ShowWithStats extends Show {
  blockedCount?: number;
  active?: boolean;
}

interface Stats {
  totalBlocked: number;
  todayBlocked: number;
  topShow: string;
}

interface WhitelistedSite {
  domain: string;
}

function App() {
  const [shows, setShows] = useState<ShowWithStats[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'shows' | 'movies' | 'dashboard'>('shows');
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalBlocked: 0,
    todayBlocked: 0,
    topShow: ''
  });
  const [protectionLevel, setProtectionLevel] = useState<'standard' | 'aggressive' | 'paranoid'>('standard');
  const [settings, setSettings] = useState({
    showNotifications: true,
    autoReveal: false,
    blockImages: true
  });
  const [whitelistedSites, setWhitelistedSites] = useState<WhitelistedSite[]>([
    { domain: 'netflix.com' },
    { domain: 'hbomax.com' },
    { domain: 'disneyplus.com' }
  ]);
  const [protectionStyle, setProtectionStyle] = useState<'blur' | 'opaque'>('blur');

  useEffect(() => {
    // Load saved shows, protection state, and stats from storage
    chrome.storage.sync.get(
      ['shows', 'isProtectionEnabled', 'stats', 'settings', 'protectionLevel', 'whitelistedSites', 'protectionStyle'], 
      (result) => {
        if (result.shows) {
          const showsWithStats = result.shows.map((show: Show) => ({
            ...show,
            blockedCount: Math.floor(Math.random() * 15) + 1,
            active: true
          }));
          setShows(showsWithStats);

          const totalBlocked = showsWithStats.reduce((sum: number, show: ShowWithStats) => 
            sum + (show.blockedCount || 0), 0
          );
          const topShow = showsWithStats.reduce((prev: ShowWithStats, current: ShowWithStats) => 
            (current.blockedCount || 0) > (prev.blockedCount || 0) ? current : prev
          ).title;

          setStats({
            totalBlocked,
            todayBlocked: Math.floor(totalBlocked * 0.2),
            topShow
          });
        }
        if (result.settings) setSettings(result.settings);
        if (result.protectionLevel) setProtectionLevel(result.protectionLevel);
        if (result.whitelistedSites) setWhitelistedSites(result.whitelistedSites);
        if (result.protectionStyle) setProtectionStyle(result.protectionStyle);
        setIsProtectionEnabled(result.isProtectionEnabled ?? true);
    });
  }, []);

  const toggleProtection = () => {
    const newState = !isProtectionEnabled;
    setIsProtectionEnabled(newState);
    chrome.storage.sync.set({ isProtectionEnabled: newState });
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_SPOILER_PROTECTION',
          enabled: newState
        });
      }
    });
  };

  const addShow = () => {
    if (!newTitle.trim()) return;
    
    const newShow: ShowWithStats = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      type: activeTab === 'shows' ? 'show' : 'movie',
      blockedCount: 0,
      active: true
    };

    const updatedShows = [...shows, newShow];
    setShows(updatedShows);
    chrome.storage.sync.set({ shows: updatedShows }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'UPDATE_SHOWS',
            shows: updatedShows
          });
        }
      });
    });
    setNewTitle('');
  };

  const removeShow = (id: string) => {
    const updatedShows = shows.filter(show => show.id !== id);
    setShows(updatedShows);
    chrome.storage.sync.set({ shows: updatedShows }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'UPDATE_SHOWS',
            shows: updatedShows
          });
        }
      });
    });
  };

  const toggleShowActive = (id: string) => {
    const updatedShows = shows.map(show => 
      show.id === id ? { ...show, active: !show.active } : show
    );
    setShows(updatedShows);
    chrome.storage.sync.set({ shows: updatedShows }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'UPDATE_SHOWS',
            shows: updatedShows
          });
        }
      });
    });
  };

  const removeWhitelistedSite = (domain: string) => {
    const updatedSites = whitelistedSites.filter(site => site.domain !== domain);
    setWhitelistedSites(updatedSites);
    chrome.storage.sync.set({ whitelistedSites: updatedSites });
  };

  const addWhitelistedSite = () => {
    // Implementation for adding a new whitelisted site
    // This would typically open a modal or prompt for input
  };

  const updateSettings = (key: keyof typeof settings, value: boolean) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    chrome.storage.sync.set({ settings: updatedSettings });
  };

  const updateProtectionStyle = (style: 'blur' | 'opaque') => {
    setProtectionStyle(style);
    chrome.storage.sync.set({ protectionStyle: style });
    
    if (!isProtectionEnabled) {
      setIsProtectionEnabled(true);
      chrome.storage.sync.set({ isProtectionEnabled: true });
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'TOGGLE_SPOILER_PROTECTION',
            enabled: true
          });
        }
      });
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'UPDATE_PROTECTION_STYLE',
          style
        });
      }
    });
  };

  const filteredShows = shows.filter(show => {
    const matchesTab = (activeTab === 'shows' && show.type === 'show') || 
                      (activeTab === 'movies' && show.type === 'movie');
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="w-[350px] h-[600px] flex flex-col bg-amber-50 text-stone-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-800 to-amber-950 px-3 py-2.5 flex items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-amber-950 p-1.5 rounded-md">
            <Shield className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-amber-300">PLOT</span> ARMOR
            </h1>
            <p className="text-xs text-amber-100">Your shield against spoilers</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-amber-100">Active</span>
          <Switch 
            checked={isProtectionEnabled} 
            onCheckedChange={toggleProtection}
            className="data-[state=checked]:bg-amber-300"
          />
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-amber-100/50 px-3 py-2 flex items-center justify-between text-sm text-amber-900 border-b border-amber-200">
        <div className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          <span>
            <strong>{stats.totalBlocked}</strong> spoilers blocked
          </span>
        </div>
        <Separator orientation="vertical" className="h-4 bg-amber-300/30" />
        <div>
          <span>
            <strong>{stats.todayBlocked}</strong> today
          </span>
        </div>
        <Separator orientation="vertical" className="h-4 bg-amber-300/30" />
        <div>
          <span>
            Top: <strong>{stats.topShow}</strong>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tabs */}
        <div className="px-3 pt-3">
          <div className="grid w-full grid-cols-3 bg-stone-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('shows')}
              className={`py-2 px-4 text-sm transition-all ${
                activeTab === 'shows'
                  ? 'bg-white shadow text-amber-900 font-medium'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              TV Shows
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`py-2 px-4 text-sm transition-all ${
                activeTab === 'movies'
                  ? 'bg-white shadow text-amber-900 font-medium'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-4 text-sm transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white shadow text-amber-900 font-medium'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Shows & Movies Content */}
        {(activeTab === 'shows' || activeTab === 'movies') && (
          <div className="flex-1 flex flex-col px-3 min-h-0">
            {/* Search & Add */}
            <div className="space-y-3 py-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-8 pr-4 py-2 rounded-lg border border-amber-800/20 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addShow()}
                  placeholder={`Add ${activeTab === 'shows' ? 'a show' : 'a movie'}...`}
                  className="flex-1 px-4 py-2 rounded-lg border border-amber-800/20 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
                <button
                  onClick={addShow}
                  className="w-10 h-10 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 pb-3">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2 pr-2">
                  {filteredShows.length === 0 ? (
                    <div className="text-sm text-stone-500 text-center py-8">
                      {searchQuery
                        ? `No ${activeTab} matching "${searchQuery}"`
                        : `No ${activeTab} added yet. Add ${activeTab} to protect yourself from spoilers.`}
                    </div>
                  ) : (
                    filteredShows.map(show => (
                      <div
                        key={show.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          show.active
                            ? 'bg-white border-amber-800/10 shadow-sm'
                            : 'bg-stone-100 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <button
                            onClick={() => toggleShowActive(show.id)}
                            className="h-7 w-7 text-amber-800 hover:bg-amber-50 rounded-md flex items-center justify-center"
                          >
                            {show.active ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                          <span className={`truncate text-base ${show.active ? '' : 'line-through text-stone-400'}`}>
                            {show.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-50">
                            {show.blockedCount}
                          </Badge>
                          <button
                            onClick={() => removeShow(show.id)}
                            className="h-7 w-7 text-stone-400 hover:text-red-500 hover:bg-stone-100 rounded-md flex items-center justify-center"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 px-3 py-3 overflow-y-auto">
            <div className="space-y-4">
              {/* Protection Level */}
              <div className="bg-white rounded-md border border-amber-200 p-3">
                <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <Shield className="h-4 w-4 text-amber-800" />
                  Protection Level
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {['standard', 'aggressive', 'paranoid'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setProtectionLevel(level as typeof protectionLevel)}
                      className={`py-1.5 px-3 rounded border text-sm transition-colors ${
                        protectionLevel === level
                          ? 'bg-amber-800 text-white border-amber-800'
                          : 'border-amber-200 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Settings */}
              <div className="bg-white rounded-md border border-amber-200 p-3">
                <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <Settings className="h-4 w-4 text-amber-800" />
                  Quick Settings
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show notifications</span>
                    <Switch
                      checked={settings.showNotifications}
                      onCheckedChange={(checked) => updateSettings('showNotifications', checked)}
                      className="data-[state=checked]:bg-amber-700"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-reveal after 5 seconds</span>
                    <Switch
                      checked={settings.autoReveal}
                      onCheckedChange={(checked) => updateSettings('autoReveal', checked)}
                      className="data-[state=checked]:bg-amber-700"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Block images</span>
                    <Switch
                      checked={settings.blockImages}
                      onCheckedChange={(checked) => updateSettings('blockImages', checked)}
                      className="data-[state=checked]:bg-amber-700"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Protection Style</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateProtectionStyle('blur')}
                        className={`px-2 py-1 rounded text-xs ${
                          protectionStyle === 'blur'
                            ? 'bg-amber-800 text-white'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        Blur
                      </button>
                      <button
                        onClick={() => updateProtectionStyle('opaque')}
                        className={`px-2 py-1 rounded text-xs ${
                          protectionStyle === 'opaque'
                            ? 'bg-amber-800 text-white'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        Opaque
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Whitelist Sites */}
              <div className="bg-white rounded-md border border-amber-200 p-3">
                <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <Filter className="h-4 w-4 text-amber-800" />
                  Whitelisted Sites
                </h3>
                <div className="space-y-1.5">
                  {whitelistedSites.map((site) => (
                    <div key={site.domain} className="flex items-center justify-between">
                      <span className="text-sm">{site.domain}</span>
                      <button
                        onClick={() => removeWhitelistedSite(site.domain)}
                        className="h-6 w-6 text-stone-400 hover:text-red-500 rounded flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="pt-1">
                    <button
                      onClick={addWhitelistedSite}
                      className="w-full py-1.5 px-3 rounded border border-amber-800/30 text-sm text-amber-900 hover:bg-amber-50 hover:border-amber-800/50 transition-colors"
                    >
                      Add Website
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-stone-100 border-t border-amber-200 px-3 py-2 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="h-8 w-8 text-stone-600 hover:bg-stone-200 rounded-md flex items-center justify-center">
            <Info className="h-5 w-5" />
          </button>
          <button className="h-8 w-8 text-stone-600 hover:bg-stone-200 rounded-md flex items-center justify-center">
            <Bell className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-500 text-sm">Plot Armor v1.0</span>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="h-6 w-6 text-stone-400 hover:text-stone-600 flex items-center justify-center"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App
