
import React from 'react';
import { ILOLogo, ILO_BLUE } from '../constants';

const Header: React.FC = () => {
  return (
    <header style={{ backgroundColor: ILO_BLUE }} className="p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <ILOLogo className="h-10 w-10 mr-3" />
          <h1 className="text-2xl font-bold text-white">Reporting System</h1>
        </div>
        {/* Add user profile/logout button here if needed in future */}
      </div>
    </header>
  );
};

export default Header;