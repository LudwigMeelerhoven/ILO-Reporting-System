
import React, { useRef, useEffect } from 'react';
import { QuestionSection } from '../types';
import { ILO_BLUE } from '../constants';

interface NavigationPaneProps {
  sections: QuestionSection[];
  currentQuestionId?: string;
}

const NavigationPane: React.FC<NavigationPaneProps> = ({ sections, currentQuestionId }) => {
  const activeLinkRef = useRef<HTMLAnchorElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scrolls the active navigation item into the center of the pane if it's not visible
    if (activeLinkRef.current && containerRef.current) {
      const linkRect = activeLinkRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
        activeLinkRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentQuestionId]);

  return (
    <div
      ref={containerRef}
      className="w-80 bg-white shadow-sm rounded-lg p-4 border border-gray-200 overflow-y-auto sticky top-24 h-[calc(100vh-7rem)]"
      aria-label="Questionnaire Navigation"
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: ILO_BLUE }}>Summary</h3>
      <nav>
        <ul>
          {sections.map((section) => (
            <li key={section.title} className="mb-4">
              <span className="font-semibold text-sm text-gray-800 block mb-2">{section.title}</span>
              <ul className="space-y-1 border-l border-gray-200 ml-2">
                {section.subSections.flatMap(sub => sub.questions).map((question) => {
                  const isActive = question.id === currentQuestionId;
                  return (
                    <li key={question.id}>
                      <a
                        href={`#${question.id}`}
                        ref={isActive ? activeLinkRef : null}
                        className={`-ml-px block border-l-4 pl-3 py-1 text-sm transition-all duration-150 ${
                          isActive
                            ? 'border-blue-600 text-blue-700 font-semibold'
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-400'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {question.id}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default NavigationPane;
