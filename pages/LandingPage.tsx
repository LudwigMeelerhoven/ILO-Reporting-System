
import React from 'react';
import { ThematicArea } from '../types';
import Header from '../components/Header';
import ThematicAreaCard from '../components/ThematicAreaCard';
import { ILO_BLUE } from '../constants';

interface LandingPageProps {
  thematicAreas: ThematicArea[];
  onSelectThematicArea: (area: ThematicArea) => void;
  submittedAreaIds: number[];
}

const LandingPage: React.FC<LandingPageProps> = ({ thematicAreas, onSelectThematicArea, submittedAreaIds }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto p-8 pt-24"> {/* Adjusted pt-24 for sticky header, p-8 for general padding */}
        <div className="mb-12 text-center"> {/* Increased mb-12 */}
          <h2 className="text-3xl font-bold mb-2" style={{ color: ILO_BLUE }}>
            Thematic Areas for Reporting
          </h2>
          <p className="text-gray-600 text-lg">
            Select a thematic area to access the relevant TIR
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Increased gap-8 */}
          {thematicAreas.map((area) => (
            <ThematicAreaCard
              key={area.id}
              area={area}
              onSelect={() => onSelectThematicArea(area)}
              isSubmitted={submittedAreaIds.includes(area.id)}
            />
          ))}
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-gray-500 bg-gray-100">
        <p>&copy; {new Date().getFullYear()} International Labour Organization. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
