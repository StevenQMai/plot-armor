import { useState, useEffect } from 'react'
import type { Show } from './types/chrome'
import './App.css'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

interface ShowWithStats extends Show {
  blockedCount?: number;
}

function App() {
  const [shows, setShows] = useState<ShowWithStats[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'shows' | 'movies' | 'dashboard'>('shows');
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(true);

  useEffect(() => {
    // Load saved shows and protection state from storage
    chrome.storage.sync.get(['shows', 'isProtectionEnabled'], (result) => {
      if (result.shows) {
        // Add some example blocked counts for demonstration
        const showsWithStats = result.shows.map((show: Show) => ({
          ...show,
          blockedCount: Math.floor(Math.random() * 15) + 1 // Random number between 1-15
        }));
        setShows(showsWithStats);
      }
      setIsProtectionEnabled(result.isProtectionEnabled ?? true);
    });
  }, []);

  const toggleProtection = () => {
    const newState = !isProtectionEnabled;
    setIsProtectionEnabled(newState);
    chrome.storage.sync.set({ isProtectionEnabled: newState });
    
    // Notify content script of the toggle
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
      blockedCount: 0
    };

    const updatedShows = [...shows, newShow];
    setShows(updatedShows);
    chrome.storage.sync.set({ shows: updatedShows }, () => {
      // Notify content script of the update
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
      // Notify content script of the update
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

  const filteredShows = shows.filter(show => {
    const matchesTab = (activeTab === 'shows' && show.type === 'show') || 
                      (activeTab === 'movies' && show.type === 'movie');
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="w-[400px]">
      {/* Header */}
      <div className="bg-[#8B4513] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#3D1D0B] rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-[#F7D675]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.4 9.36-7 10.6-3.6-1.24-7-5.77-7-10.6V6.3l7-3.12z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#F7D675]">PLOT</span>
              <span className="text-2xl font-bold text-white">ARMOR</span>
            </div>
            <p className="text-[#F7D675] text-sm">Your shield against spoilers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white">Active</span>
          <button
            onClick={toggleProtection}
            className={`w-14 h-8 rounded-full relative transition-colors ${
              isProtectionEnabled ? 'bg-[#F7D675]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full transition-transform bg-white shadow-md ${
                isProtectionEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#FFF8E7]">
        {/* Tabs */}
        <div className="bg-gray-200/50 p-2 flex gap-1 rounded-lg mx-2 mt-2">
          <button
            onClick={() => setActiveTab('shows')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'shows' 
                ? 'bg-white shadow text-black font-medium' 
                : 'text-gray-600'
            }`}
          >
            TV Shows
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'movies' 
                ? 'bg-white shadow text-black font-medium' 
                : 'text-gray-600'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-white shadow text-black font-medium' 
                : 'text-gray-600'
            }`}
          >
            Dashboard
          </button>
        </div>

        {(activeTab === 'shows' || activeTab === 'movies') && (
          <div className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shows..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
            </div>

            {/* Add */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`Add a ${activeTab === 'shows' ? 'show' : 'movie'}...`}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
              />
              <button
                onClick={addShow}
                className="w-12 h-12 bg-[#8B4513] text-white rounded-lg hover:bg-[#6B3410] transition-colors flex items-center justify-center"
              >
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            {/* Show List */}
            <div className="space-y-2">
              {filteredShows.map(show => (
                <div 
                  key={show.id} 
                  className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200"
                >
                  <svg className="w-5 h-5 text-[#8B4513]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="flex-1 font-medium text-gray-800">{show.title}</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                    {show.blockedCount}
                  </span>
                  <button
                    onClick={() => removeShow(show.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="p-4 text-center text-gray-600">
            Dashboard content coming soon...
          </div>
        )}
      </div>
    </div>
  );
}

export default App
