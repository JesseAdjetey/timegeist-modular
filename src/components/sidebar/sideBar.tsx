
import React, { useRef } from 'react';
import { useSidebarStore, ModuleType } from '@/lib/store';
import ModuleSelector from '../modules/ModuleSelector';
import PageHeader from './PageHeader';
import ModuleGrid from './ModuleGrid';
import NewPageCreator from './NewPageCreator';

const SideBar = () => {
  const { 
    pages, 
    currentPageIndex, 
    setCurrentPage, 
    addModule, 
    removeModule, 
    updatePageTitle, 
    addPage,
    updateModuleTitle
  } = useSidebarStore();
  
  const sidebarContentRef = useRef<HTMLDivElement>(null);

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

  const handleAddModule = (moduleType: ModuleType) => {
    addModule(currentPageIndex, moduleType);
  };

  const handleRemoveModule = (moduleIndex: number) => {
    removeModule(currentPageIndex, moduleIndex);
  };

  const handleUpdateModuleTitle = (moduleIndex: number, newTitle: string) => {
    updateModuleTitle(currentPageIndex, moduleIndex, newTitle);
  };

  const handleCreateNewPage = (title: string) => {
    addPage(title);
    setCurrentPage(pages.length); // Switch to the newly added page
  };

  return (
    <div className="glass-sidebar h-full overflow-hidden flex flex-col bg-black/20">
      {/* Logo on top of sidebar */}
      <div className="p-4 flex justify-center border-b border-white/10">
        <img 
          src="/lovable-uploads/50041269-e66c-4735-b847-3d4fef85beca.png" 
          alt="Company Logo" 
          className="h-12 w-12 rounded-lg shadow-md" 
        />
      </div>
      
      {/* Header with page title and navigation */}
      <PageHeader 
        title={pages[currentPageIndex]?.title || 'Untitled'}
        onUpdateTitle={(newTitle) => updatePageTitle(currentPageIndex, newTitle)}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        canGoToPrevPage={currentPageIndex > 0}
        canGoToNextPage={currentPageIndex < pages.length - 1}
      />
      
      {/* Page modules with responsive grid */}
      <div 
        ref={sidebarContentRef} 
        className="flex-1 overflow-y-auto p-4"
      >
        <ModuleSelector onSelect={handleAddModule} />
        
        {/* Module container - uses grid for two columns or flex for one column */}
        <ModuleGrid 
          modules={pages[currentPageIndex]?.modules || []}
          onRemoveModule={handleRemoveModule}
          onUpdateModuleTitle={handleUpdateModuleTitle}
        />
        
        {/* New Page Creator */}
        <NewPageCreator onCreatePage={handleCreateNewPage} />
      </div>
    </div>
  );
};

export default SideBar;
