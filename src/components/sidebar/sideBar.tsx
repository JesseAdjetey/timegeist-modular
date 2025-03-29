
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Check, Plus, X } from 'lucide-react';
import { useSidebarStore, ModuleType } from '@/lib/store';
import TodoModule from '../modules/TodoModule';
import ModuleSelector from '../modules/ModuleSelector';
import InvitesModule from '../modules/InvitesModule';

const SideBar = () => {
  const { pages, currentPageIndex, setCurrentPage, addModule, removeModule, updatePageTitle, addPage } = useSidebarStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(pages[currentPageIndex]?.title || '');
  const [showNewPageInput, setShowNewPageInput] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const sidebarContentRef = useRef<HTMLDivElement>(null);

  // Module dimensions - fixed width for modules
  const MODULE_WIDTH = 320;

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Check if there's enough space for two columns
        if (entry.contentRect.width > 700) {
          setIsTwoColumn(true);
        } else {
          setIsTwoColumn(false);
        }
      }
    });

    if (sidebarContentRef.current) {
      resizeObserver.observe(sidebarContentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPage(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPage(currentPageIndex + 1);
    }
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
    setNewTitle(pages[currentPageIndex]?.title || '');
  };

  const handleSaveTitle = () => {
    if (newTitle.trim()) {
      updatePageTitle(currentPageIndex, newTitle);
    }
    setIsEditingTitle(false);
  };

  const handleAddModule = (moduleType: ModuleType) => {
    addModule(currentPageIndex, moduleType);
  };

  const handleRemoveModule = (moduleIndex: number) => {
    removeModule(currentPageIndex, moduleIndex);
  };

  const handleCreateNewPage = () => {
    if (newPageTitle.trim()) {
      addPage(newPageTitle);
      setNewPageTitle('');
      setShowNewPageInput(false);
      setCurrentPage(pages.length); // Switch to the newly added page
    }
  };

  const renderModule = (type: ModuleType, index: number) => {
    // Each module has a fixed width, regardless of sidebar width
    const moduleStyle = {
      width: `${MODULE_WIDTH}px`,
      maxWidth: '100%'
    };
    
    switch (type) {
      case 'todo':
        return (
          <div key={index} style={moduleStyle} className="mb-4">
            <TodoModule title="To-Do List" onRemove={() => handleRemoveModule(index)} />
          </div>
        );
      case 'pomodoro':
        return (
          <div key={index} style={moduleStyle} className="glass-card p-4 mb-4 bg-purple-500/20">
            Pomodoro Timer Module
          </div>
        );
      case 'alarms':
        return (
          <div key={index} style={moduleStyle} className="glass-card p-4 mb-4 bg-blue-500/20">
            Alarms Module
          </div>
        );
      case 'eisenhower':
        return (
          <div key={index} style={moduleStyle} className="glass-card p-4 mb-4 bg-green-500/20">
            Eisenhower Matrix Module
          </div>
        );
      case 'invites':
        return (
          <div key={index} style={moduleStyle} className="mb-4">
            <InvitesModule onRemove={() => handleRemoveModule(index)} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-sidebar h-full overflow-hidden flex flex-col bg-black/20">
      {/* Header with page title and navigation */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/30">
        <button 
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0}
          className="p-1 rounded-full hover:bg-purple-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center">
          {isEditingTitle ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="glass-input text-lg font-semibold bg-black/20 border-b border-purple-400 px-2 py-1 outline-none"
                autoFocus
              />
              <button 
                onClick={handleSaveTitle}
                className="p-1 ml-1 rounded-full hover:bg-purple-500/20"
              >
                <Check size={16} className="text-purple-300" />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-purple-200">{pages[currentPageIndex]?.title || 'Untitled'}</h1>
              <button 
                onClick={handleEditTitle}
                className="p-1 ml-1 rounded-full hover:bg-purple-500/20"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleNextPage}
          disabled={currentPageIndex >= pages.length - 1}
          className="p-1 rounded-full hover:bg-purple-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      {/* Page modules with responsive grid */}
      <div 
        ref={sidebarContentRef} 
        className="flex-1 overflow-y-auto p-4"
      >
        <ModuleSelector onSelect={handleAddModule} />
        
        {/* Module container - uses grid for two columns or flex for one column */}
        <div className={`${isTwoColumn ? 'grid grid-cols-2 gap-4 justify-items-center' : 'flex flex-col items-center'}`}>
          {pages[currentPageIndex]?.modules.map((moduleType, index) => 
            renderModule(moduleType, index)
          )}
        </div>
        
        {/* New Page Creator */}
        {showNewPageInput ? (
          <div className="glass-card p-4 relative mt-4 max-w-md mx-auto bg-purple-800/20">
            <button 
              onClick={() => setShowNewPageInput(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-purple-300"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold mb-3 text-purple-300">Create New Page</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                className="glass-input w-full bg-black/20"
                placeholder="Page title..."
                autoFocus
              />
              <button
                onClick={handleCreateNewPage}
                disabled={!newPageTitle.trim()}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowNewPageInput(true)}
            className="flex items-center justify-center w-full p-2 mt-4 glass-card text-purple-300 hover:text-white hover:bg-purple-600/30 transition-all max-w-md mx-auto"
          >
            <Plus size={16} className="mr-2" />
            <span>New Page</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SideBar;
