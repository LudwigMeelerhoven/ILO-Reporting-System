
import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import QuestionnairePage from './pages/QuestionnairePage';
import { Page, ThematicArea } from './types';
import { THEMATIC_AREAS_DATA } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Login);
  const [selectedThematicArea, setSelectedThematicArea] = useState<ThematicArea | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [submittedAreaIds, setSubmittedAreaIds] = useState<number[]>([]);

  // useEffect (that checked localStorage) has been removed to ensure app always starts at login.

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // localStorage.setItem('ilo-auth', 'true'); // Removed: No longer persisting auth to localStorage
    setCurrentPage(Page.Landing);
  };

  const handleSelectThematicArea = (area: ThematicArea) => {
    setSelectedThematicArea(area);
    setCurrentPage(Page.Questionnaire);
  };

  const handleBackToLanding = () => {
    setSelectedThematicArea(null);
    setCurrentPage(Page.Landing);
  };

  const handleReportSubmitted = (areaId: number) => {
    setSubmittedAreaIds(prevIds => {
      if (!prevIds.includes(areaId)) {
        const newIds = [...prevIds, areaId];
        // Potentially save newIds to localStorage if persistence is desired (currently removed)
        return newIds;
      }
      return prevIds;
    });
  };

  // Basic logout functionality (can be expanded)
  // const handleLogout = () => {
  //   setIsAuthenticated(false);
  //   // localStorage.removeItem('ilo-auth'); // Would also be removed if persistence is globally off
  //   setCurrentPage(Page.Login);
  //   setSubmittedAreaIds([]); // Clear submitted areas on logout
  // };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  switch (currentPage) {
    case Page.Landing:
      return (
        <LandingPage
          thematicAreas={THEMATIC_AREAS_DATA}
          onSelectThematicArea={handleSelectThematicArea}
          submittedAreaIds={submittedAreaIds}
        />
      );
    case Page.Questionnaire:
      if (selectedThematicArea) {
        return (
          <QuestionnairePage
            thematicArea={selectedThematicArea}
            onBackToLanding={handleBackToLanding}
            onReportSubmitted={handleReportSubmitted}
          />
        );
      }
      // Fallback if no area selected, though UI flow should prevent this
      setCurrentPage(Page.Landing); 
      return null; 
    case Page.Login: // Should not happen if authenticated, but as a fallback
    default:
      // If somehow authenticated but on login page, redirect to landing.
      // However, the initial !isAuthenticated check should prevent this.
      setCurrentPage(Page.Landing);
      return null;
  }
};

export default App;
