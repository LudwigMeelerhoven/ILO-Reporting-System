import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ThematicArea, QuestionSection, AnswersState, ConventionProtocol, Answer, QuestionContent } from '../types';
import Header from '../components/Header';
import Button from '../components/Button';
import QuestionAccordion from '../components/QuestionAccordion';
import NavigationPane from '../components/NavigationPane';
import { QUESTIONS_DATA, ALL_QUESTION_IDS, ILO_BLUE, PrintIcon, Q010_CEACR_COMMENT, CAS_FOLLOW_UP_CEACR_COMMENT } from '../constants'; // Assuming QUESTIONS_DATA is global for prototype

interface QuestionnairePageProps {
  thematicArea: ThematicArea;
  onBackToLanding: () => void;
  onReportSubmitted: (areaId: number) => void;
}

const R001_PREFILL_TEXT = `The Federal Act on General Social Insurance, 1955 (ASVG).

The General Pensions Act, 2004.

The Maternity Protection Act 1979 - MSchGStF: Federal Law Gazette No. 221/1979 (WV) as amended by Federal Law Gazette No. 577/1980 (DFB)

The Unemployment Injury Act, 1977.

The Families’ Compensation Act, 1967.

The Administrative Court Procedure Act, 2013 (VwGVG).

Agricultural Labour Act 2021 (LAG)`;

const R004_PREFILL_TEXT = `Country X has accepted Parts II (Medical care), IV (Unemployment benefit), V (Old-age benefit), VII (Family benefit) and VIII (Maternity benefit) of C102 and Part III (Old-age benefit) of C128.`;
const R005_PREFILL_TEXT = `No temporary exceptions.`;
const R006_PREFILL_TEXT = `No exclusions or exceptions.`;
const R007_PREFILL_TEXT = `Not applied.`;
const R008_PREFILL_TEXT = `Sickness, pregnancy and childbirth and need for preventive care are covered (sections 133, 154-156, and 159 of the ASVG).`;
const R009_PREFILL_TEXT = `Employees in paid employment; trainees; unemployed persons; recipients of certain social security benefits; spouses and partners, as well as children of ensured persons are mandatory covered (section 4 of the ASVG).

Employees whose remuneration is less than the established threshold (EUR 551.1 per month in 2025) are not compulsory covered (section 5 of the ASVG).

Statistical data [to be filled by Government according to the report form for Articles 9 and 76(2) of C102]`;

// Updated prefill text for R010 based on user request
const R010_PREFILL_TEXT = `Medical treatment, dental care, hospitalization, pharmaceutical supplies, prosthesis, nursing care, transportation, and maternity medical care (sections 133, 135-137, 144 and 159 of the ASVG).`;

// Updated prefill text for R011 based on user request
const R011_PREFILL_TEXT = `No cost-sharing is generally required for medical treatment (sections 133 and 135 of the ASVG).

In the case of hospitalisation, a co-payment of up to EUR 17 per day may be required, for a maximum of 28 days per calendar year (Section 154a ASVG).

A co-payment of up to 10% may apply for prosthetic appliances (Section 137 ASVG).

The Reimbursement Code (Section 30b ASVG) sets out the list of medicinal products reimbursed in Country X. A fixed prescription fee of EUR 7.10 per item (as of 2024) applies (Section 136 ASVG).

No cost-sharing is required for maternity medical care (Section 159 ASVG).`;

// Updated prefill text for R012 based on user request
const R012_PREFILL_TEXT = `The medical treatment is intended to restore, consolidate or improve health, the ability to work and the ability to meet vital personal needs to the greatest extent possible (section 133 of the ASVG).`;


// Function to generate initial answers state
const generateInitialAnswers = (): AnswersState => {
  return ALL_QUESTION_IDS.reduce((acc, qId) => {
    let initialValue = '';
    switch (qId) {
      case 'R001': initialValue = R001_PREFILL_TEXT; break;
      case 'R004': initialValue = R004_PREFILL_TEXT; break;
      case 'R005': initialValue = R005_PREFILL_TEXT; break;
      case 'R006': initialValue = R006_PREFILL_TEXT; break;
      case 'R007': initialValue = R007_PREFILL_TEXT; break;
      case 'R008': initialValue = R008_PREFILL_TEXT; break;
      case 'R009': initialValue = R009_PREFILL_TEXT; break;
      case 'R010': initialValue = R010_PREFILL_TEXT; break;
      case 'R011': initialValue = R011_PREFILL_TEXT; break;
      case 'R012': initialValue = R012_PREFILL_TEXT; break;
      default: initialValue = '';
    }
    acc[qId] = { 
        value: initialValue, 
        isUpdated: false, 
        ceacrSession: undefined, 
        legalAnalysis: '', 
        dlcComment: '', 
        governmentReply: '',
        q010StaticCeacrReply: '',
        q010StaticCeacrReplyUpdated: false,
        q146PendingCommentReplyUpdated: false,
        followUpCasReply: '',
        followUpCasReplyUpdated: false,
    };
    return acc;
  }, {} as AnswersState);
};


const QuestionnairePage: React.FC<QuestionnairePageProps> = ({ thematicArea, onBackToLanding, onReportSubmitted }) => {
  const getInitialAnswers = useMemo(() => generateInitialAnswers(), []);

  const [answers, setAnswers] = useState<AnswersState>(() => JSON.parse(JSON.stringify(getInitialAnswers)));
  const [activeConventions, setActiveConventions] = useState<string[]>([]);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [isConfirmingSubmission, setIsConfirmingSubmission] = useState<boolean>(false);
  const [unupdatedQuestions, setUnupdatedQuestions] = useState<string[]>([]);
  const [isActionRequiredModalOpen, setIsActionRequiredModalOpen] = useState<boolean>(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('');
  const [draftSaveMessage, setDraftSaveMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);


  const processedConventions: ConventionProtocol[] = useMemo(() => {
    return thematicArea.conventions.map(convStr => ({
      id: convStr.split(' ')[0], 
      name: convStr,
      isActive: activeConventions.includes(convStr),
    }));
  }, [thematicArea.conventions, activeConventions]);

  useEffect(() => {
    window.scrollTo(0, 0); 
    setSubmissionMessage(null);
    setIsConfirmingSubmission(false); 
    setAnswers(JSON.parse(JSON.stringify(getInitialAnswers)));
    
    if (thematicArea.id === 9) {
      // Pre-select C.102 and C.183 for "Social Security and Maternity Protection"
      const conventionsToSelect = ["C.102", "C.183"];
      const preselectedConventions = thematicArea.conventions.filter(c => conventionsToSelect.includes(c));
      setActiveConventions(preselectedConventions);
    } else {
      setActiveConventions([]);
    }

    setUnupdatedQuestions([]);
    setIsActionRequiredModalOpen(true); // Show modal when page/thematic area loads
  }, [thematicArea, getInitialAnswers]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first entry that is intersecting from the top of our observation area.
        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (intersectingEntry) {
          setCurrentQuestionId(intersectingEntry.target.id);
        }
      },
      {
        // Define a horizontal band in the middle of the viewport to trigger the active state.
        // This prevents highlights from changing too rapidly at the very top/bottom of the screen.
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    // Observe all question accordion items
    const questionElements = document.querySelectorAll('.question-accordion-item');
    questionElements.forEach(el => observer.observe(el));

    // Cleanup: disconnect the observer when the component unmounts.
    return () => observer.disconnect();
  }, []); // Empty dependency array ensures this effect runs only once on mount.


  const handleConventionClick = (conventionName: string) => {
    setActiveConventions(prev =>
      prev.includes(conventionName)
        ? prev.filter(c => c !== conventionName)
        : [...prev, conventionName]
    );
  };

  const handleAnswerChange = (questionId: string, newValue: string) => {
    setAnswers(prevAnswers => {
        const currentAnswerState = prevAnswers[questionId];
        const initialAnswerValueForThisQuestion = getInitialAnswers[questionId]?.value || '';

        // Determine if the answer is considered 'updated'
        // For pre-filled questions, 'updated' means different from pre-fill.
        // For non-pre-filled, 'updated' means not empty.
        let newIsUpdated: boolean;
        if (initialAnswerValueForThisQuestion.trim() !== '') { // If there was a prefill
             newIsUpdated = newValue.trim() !== initialAnswerValueForThisQuestion.trim();
        } else { // No prefill or prefill was empty
             newIsUpdated = newValue.trim() !== '';
        }
        
        const updatedAnswerFields: Partial<Answer> = {
            value: newValue,
            isUpdated: newIsUpdated,
        };

        if (questionId === 'R146') {
            updatedAnswerFields.q146PendingCommentReplyUpdated = newIsUpdated;
        }
        
        return {
            ...prevAnswers,
            [questionId]: {
                ...currentAnswerState,
                ...updatedAnswerFields,
            },
        };
    });
  };

  const handleCeacrSessionSet = (questionId: string, session: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], ceacrSession: session },
    }));
  };

  const handleLegalAnalysisChange = (questionId: string, legalAnalysisText: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], legalAnalysis: legalAnalysisText },
    }));
  };

  const handleDlcCommentChange = (questionId: string, dlcText: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], dlcComment: dlcText },
    }));
  };

  const handleGovernmentReplyChange = (questionId: string, replyText: string) => {
     setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], governmentReply: replyText },
    }));
  };

  const handleQ010StaticCeacrReplyChange = (questionId: string, replyText: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { 
        ...prev[questionId], 
        q010StaticCeacrReply: replyText,
        q010StaticCeacrReplyUpdated: replyText.trim() !== '',
      },
    }));
  };

  const handleFollowUpCasReplyChange = (questionId: string, replyText: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        followUpCasReply: replyText,
        followUpCasReplyUpdated: replyText.trim() !== '',
      },
    }));
  };

  const countryName = "Country X"; 

  const handleInitiateSubmission = () => {
    if (submissionMessage) return;

    const attentionNeededQuestions = ALL_QUESTION_IDS.filter(qId => {
        const answer = answers[qId];
        if (!answer) return true; // Should not happen if initialized correctly

        if (qId === 'R010') {
            return !answer.q010StaticCeacrReplyUpdated;
        }
        if (qId === 'R146') {
            return !answer.q146PendingCommentReplyUpdated; 
        }
        if (qId === 'R_CAS_FOLLOW_UP') {
            return !answer.followUpCasReplyUpdated;
        }
        return !answer.isUpdated; // For all other questions
    });
    
    setUnupdatedQuestions(attentionNeededQuestions);
    setIsConfirmingSubmission(true);
  };

  const handleConfirmSubmit = () => {
    console.log('Submitted Answers:', answers);
    console.log('Active Conventions:', activeConventions);
    
    const timestamp = new Date().toLocaleString();
    setSubmissionMessage(`Submission received for ${countryName} on thematic area "${thematicArea.title}" at ${timestamp}.`);
    onReportSubmitted(thematicArea.id); 
    setIsConfirmingSubmission(false); 
  };

  const handleCancelSubmission = () => {
    setIsConfirmingSubmission(false);
    setUnupdatedQuestions([]);
  };

  const handlePrintPage = () => {
    setIsPrintModalOpen(true);
  };
  
  const handleActualPrint = () => {
    const modalWrapper = document.querySelector('.print-modal-wrapper');
    if (!modalWrapper) return;
  
    document.body.classList.add('body-has-printing-modal');
    modalWrapper.classList.add('is-printing');
  
    window.print();
  
    const afterPrintHandler = () => {
      document.body.classList.remove('body-has-printing-modal');
      modalWrapper.classList.remove('is-printing');
      window.removeEventListener('afterprint', afterPrintHandler);
    };
    window.addEventListener('afterprint', afterPrintHandler);
  
    // Fallback cleanup
    setTimeout(() => {
      if (document.body.classList.contains('body-has-printing-modal')) {
        document.body.classList.remove('body-has-printing-modal');
      }
      if (modalWrapper.classList.contains('is-printing')) {
        modalWrapper.classList.remove('is-printing');
      }
      window.removeEventListener('afterprint', afterPrintHandler);
    }, 500);
  };

  const handleDownloadDoc = () => {
    const contentElement = document.getElementById('print-modal-content-area');
    if (!contentElement) return;

    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Questionnaire Export</title></head>
        <body>
    `;
    const footer = '</body></html>';
    const sourceHTML = header + contentElement.innerHTML + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `questionnaire-${thematicArea.title.replace(/ /g, '_')}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleDownloadPdf = async () => {
    const contentElement = document.getElementById('print-modal-content-area');
    if (!contentElement) return;
    
    setIsDownloading(true);

    try {
        const canvas = await html2canvas(contentElement, {
            scale: 2,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const imgHeight = canvasHeight / ratio;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`questionnaire-${thematicArea.title.replace(/ /g, '_')}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        // Optionally show an error message to the user
    } finally {
        setIsDownloading(false);
    }
  };

  const handleSaveDraft = () => {
    // In a real application, this would persist the draft state.
    // For this prototype, we'll just show a confirmation message.
    setDraftSaveMessage('Draft saved successfully!');
    setTimeout(() => {
      setDraftSaveMessage(null);
    }, 3000); // Message disappears after 3 seconds
  };


  const introText = `The Thematic implementation Reports (TIRs) assist governments in fulfilling their reporting obligations under Article 22 of the ILO Constitution. The present TIR includes: i) requests for information concerning the implementation in ${countryName} of ratified conventions on ${thematicArea.title}; and ii) information provided by the Government on the measures taken to give effect to the provisions of the Conventions (relevant laws, regulations, collective agreements, or other measures) as well as a description on how these measures are applied in practice. This TIR also includes comments from the Committee of Experts on the Application of Conventions and Recommendations (CEACR) as well as replies from the Government to those comments.`;
  const guidanceText = `Please provide the information specifically requested below under each Article or group of Articles in the ‘Implementing measures’ box, with a reference to the relevant parts of the documents concerned (such as the relevant provisions of the laws, regulations or other measures, or collective agreements). If any of this material is available from the internet, the link to the relevant documents may be inserted in the corresponding box. Otherwise, please provide a copy of these documents. Please also include any relevant information on application in practice.`;
  const pendingCommentsText = `If there are pending comments from the supervisory bodies, a hyperlink will be included under the corresponding Article(s), with a specific box allowing your Government to reply to such comments.`;

  useEffect(() => {
    let timer: number | undefined;
    if (submissionMessage) {
      timer = window.setTimeout(() => {
        onBackToLanding();
      }, 3000); 
    }
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [submissionMessage, onBackToLanding]);
  
  const renderPrintableQuestion = (question: QuestionContent) => {
    const answer = answers[question.id];
    if (!answer) return null;

    const createMarkup = (text:string) => {
        const processedText = text.replace(/\n/g, '<br />').replace(/\*\*_(.*?)_\*\*/g, '<strong><em>$1</em></strong>');
        return { __html: processedText };
    };

    if (question.id === 'R_CAS_FOLLOW_UP') {
        return (
            <>
                <div className="mt-2">
                    <p className="font-semibold text-gray-800">CEACR Comment:</p>
                    <div className="prose prose-sm max-w-none p-2 border rounded bg-gray-50 text-gray-700" dangerouslySetInnerHTML={createMarkup(CAS_FOLLOW_UP_CEACR_COMMENT)} />
                </div>
                <div className="mt-2">
                    <p className="font-semibold text-gray-800">Government Reply:</p>
                    <div className="whitespace-pre-wrap p-2 border rounded bg-blue-50">
                        {answer.followUpCasReply || <span className="text-gray-500 italic">No reply provided.</span>}
                    </div>
                </div>
            </>
        );
    }

    return (
         <>
            <div className="mt-2">
                <p className="font-semibold text-gray-800">Government's response:</p>
                <div className="whitespace-pre-wrap p-2 border rounded bg-gray-50">
                    {answer.value || <span className="text-gray-500 italic">No answer provided.</span>}
                </div>
            </div>

            {question.id === 'R010' && (
                <div className="mt-2">
                    <p className="font-semibold text-gray-800">CEACR Comment 2026:</p>
                     <div className="prose prose-sm max-w-none p-2 border rounded bg-yellow-50 text-gray-700" dangerouslySetInnerHTML={createMarkup(Q010_CEACR_COMMENT)} />
                    <p className="font-semibold mt-2 text-gray-800">Government reply to CEACR comment 2026:</p>
                     <div className="whitespace-pre-wrap p-2 border rounded bg-blue-50">
                        {answer.q010StaticCeacrReply || <span className="text-gray-500 italic">No reply provided.</span>}
                    </div>
                </div>
            )}

            {answer.ceacrSession && question.id !== 'R010' && (
                 <div className="mt-2 p-2 border rounded bg-yellow-50">
                    <p className="font-semibold text-gray-800">CEACR Session: {answer.ceacrSession}</p>
                    <p className="font-semibold mt-2 text-gray-800">Legal analysis (ILO Staff only):</p>
                     <div className="whitespace-pre-wrap p-2 border rounded bg-white">
                        {answer.legalAnalysis || <span className="text-gray-500 italic">Not provided.</span>}
                    </div>
                     <p className="font-semibold mt-2 text-gray-800">Draft Legal Comment (DLC):</p>
                     <div className="whitespace-pre-wrap p-2 border rounded bg-white">
                        {answer.dlcComment || <span className="text-gray-500 italic">Not provided.</span>}
                    </div>
                     <p className="font-semibold mt-2 text-gray-800">Government reply to CEACR comment:</p>
                     <div className="whitespace-pre-wrap p-2 border rounded bg-blue-50">
                        {answer.governmentReply || <span className="text-gray-500 italic">No reply provided.</span>}
                    </div>
                </div>
            )}
         </>
    )
  }


  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      {isActionRequiredModalOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[200] p-4" // Increased z-index
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-required-title"
          aria-describedby="action-required-description"
        >
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h3 id="action-required-title" className="text-xl font-semibold text-yellow-600 mb-4">
              Action Required
            </h3>
            <div id="action-required-description" className="text-gray-700 mb-6">
              <p className="mb-2">Please address the pending comments:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  For <strong>R010</strong>, provide a reply in the 'Government reply to CEACR comment 2026' section.
                </li>
                <li>
                  For <strong>R146</strong>, provide a reply in its main answer box.
                </li>
              </ul>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setIsActionRequiredModalOpen(false)}>
                Acknowledge
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <main className="flex flex-row gap-8 pt-24 pb-16 questionnaire-page-container">
          <div className="w-full max-w-4xl flex-grow questionnaire-main-content">
            <div className="mb-6 flex space-x-2 questionnaire-page-controls">
              {!submissionMessage && (
                  <>
                    <Button onClick={onBackToLanding} variant="secondary">&larr; Back</Button>
                    <Button onClick={handleSaveDraft} variant="secondary">Save Draft</Button>
                    <Button onClick={handlePrintPage} variant="secondary" aria-label="Download or print this page">
                      Download
                    </Button>
                  </>
              )}
            </div>

            {draftSaveMessage && (
              <div className="mb-4 text-green-700 bg-green-100 border border-green-300 p-3 rounded-md text-center" role="alert">
                {draftSaveMessage}
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-bold mb-1" style={{color: ILO_BLUE}}>{countryName}</h2>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">{thematicArea.title}</h3>

              <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h4 className="font-semibold text-md mb-2 text-gray-800">Ratified Conventions and Protocols for this Thematic Area:</h4>
                <div className="flex flex-wrap gap-2">
                  {processedConventions.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => handleConventionClick(conv.name)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors
                                  ${conv.isActive ? 'bg-[#0055A4] text-white border-[#0055A4]' : 'bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300'}`}
                    >
                      {conv.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none text-gray-600 mb-4 p-4 border border-dashed border-gray-300 rounded-md">
                  <p>{introText}</p>
              </div>
               <div className="prose prose-sm max-w-none text-gray-600 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-md !mt-0 !mb-2" style={{color: ILO_BLUE}}>Practical guidance for filling out the TIR and submit information</h4>
                  <p className="!mt-0">{guidanceText}</p>
                  <p>{pendingCommentsText}</p>
              </div>
            </div>

            {!submissionMessage && QUESTIONS_DATA.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8">
                <h2 className="text-2xl font-bold p-3 rounded-t-md text-white" style={{ backgroundColor: ILO_BLUE }}>
                  {section.title}
                </h2>
                {section.introduction && <p className="text-sm italic text-gray-600 mt-2 mb-4 bg-gray-100 p-3 rounded-b-md">{section.introduction}</p>}
                
                {section.subSections.map((subSection, subSectionIndex) => (
                  <div key={subSectionIndex} className="mb-6">
                    {(subSection.title || subSection.topic) && (
                      <div className="mt-4 mb-3 p-3 bg-sky-500 text-white rounded-md shadow-md">
                          {subSection.title && <h3 className="text-lg font-semibold mb-1">{subSection.title}</h3>}
                          {subSection.topic && <p className="text-md font-semibold text-gray-800">{subSection.topic}</p>}
                      </div>
                    )}
                    <div className="pl-2">
                      {subSection.questions.map(question => (
                        <QuestionAccordion
                          key={question.id}
                          question={{...question, hasGuidance: question.provisions?.endsWith("Guidance") }}
                          answer={answers[question.id] || { 
                              value: '', 
                              isUpdated: false, 
                              ceacrSession: undefined, 
                              legalAnalysis: '', 
                              dlcComment: '', 
                              governmentReply: '', 
                              q010StaticCeacrReply: '', 
                              q010StaticCeacrReplyUpdated: false,
                              q146PendingCommentReplyUpdated: false,
                              followUpCasReply: '',
                              followUpCasReplyUpdated: false,
                          }}
                          onAnswerChange={handleAnswerChange}
                          onCeacrSessionSet={handleCeacrSessionSet}
                          onLegalAnalysisChange={handleLegalAnalysisChange}
                          onDlcCommentChange={handleDlcCommentChange}
                          onGovernmentReplyChange={handleGovernmentReplyChange}
                          onQ010StaticCeacrReplyChange={handleQ010StaticCeacrReplyChange}
                          onFollowUpCasReplyChange={handleFollowUpCasReplyChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            <div className="mt-8 pt-6 border-t border-gray-300 text-center submit-report-button-container">
              <Button 
                onClick={handleInitiateSubmission} 
                disabled={!!submissionMessage}
                className="px-8 py-3 text-lg"
                aria-live="polite"
              >
                {submissionMessage ? 'Report Submitted & Redirecting...' : 'Submit Report'}
              </Button>
            </div>
            {submissionMessage && (
              <p id="submission-message" className="mt-4 text-green-600 bg-green-50 p-3 rounded-md text-center">
                {submissionMessage}
              </p>
            )}

          </div>

          <aside className="hidden xl:block w-80 flex-shrink-0 navigation-pane-container">
            <NavigationPane sections={QUESTIONS_DATA} currentQuestionId={currentQuestionId} />
          </aside>
        </main>
      </div>

      {isPrintModalOpen && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[200] p-4 print-modal-wrapper modal-wrapper"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-questionnaire-title"
        >
          <div className="bg-white p-0 rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b modal-print-hide">
              <h3 id="print-questionnaire-title" className="text-xl font-semibold text-gray-800">
                Print / Download Questionnaire
              </h3>
              <div className="flex items-center space-x-2">
                <Button onClick={handleActualPrint} variant="primary">Print</Button>
                <Button onClick={handleDownloadPdf} variant="secondary" disabled={isDownloading}>
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
                <Button onClick={handleDownloadDoc} variant="secondary">Download DOC</Button>
                <Button onClick={() => setIsPrintModalOpen(false)} variant="secondary">Close</Button>
              </div>
            </div>
            <div id="print-modal-content-area" className="p-6 overflow-y-auto modal-content-area-printable">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-1" style={{color: ILO_BLUE}}>{countryName}</h2>
                <h3 className="text-2xl font-semibold mb-4 text-gray-700">{thematicArea.title}</h3>
              </div>

              {QUESTIONS_DATA.map((section, index) => (
                <div key={section.title} className={`mb-6 ${index > 0 ? 'print-questionnaire-section' : ''}`}>
                  <h2 className="text-2xl font-bold p-3 rounded-t-md text-white" style={{ backgroundColor: ILO_BLUE }}>
                    {section.title}
                  </h2>
                   {section.subSections.map((subSection) => (
                     <div key={subSection.title || subSection.questions[0].id} className="mt-4">
                       {(subSection.title || subSection.topic) && (
                         <div className="mt-4 mb-3 p-3 bg-gray-100 border-l-4 border-sky-500">
                           {subSection.title && <h3 className="text-xl font-semibold">{subSection.title}</h3>}
                           {subSection.topic && <p className="text-lg font-semibold text-gray-800">{subSection.topic}</p>}
                         </div>
                       )}
                       <div className="pl-4">
                         {subSection.questions.map(question => (
                           <div key={question.id} className="mb-4 border rounded p-3 bg-white shadow-sm print-question-item">
                             <p className="font-bold text-gray-900">{question.id}: <span className="font-normal">{question.text}</span></p>
                             {renderPrintableQuestion(question)}
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {isConfirmingSubmission && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[100] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-submission-title"
          aria-describedby="confirm-submission-description"
        >
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h3 id="confirm-submission-title" className="text-xl font-semibold text-gray-800 mb-4">
              Confirm Submission
            </h3>
            <div id="confirm-submission-description" className="text-gray-700 mb-6">
              <p>
                You are about to submit the report for the thematic area: <strong>{thematicArea.title}</strong> for <strong>{countryName}</strong>.
              </p>
              {unupdatedQuestions.length > 0 && (
                <div className="mt-3 mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
                  <p className="font-semibold text-yellow-800">Attention:</p>
                  <p className="text-sm text-yellow-700">
                    The following requests for information have entries that may require your attention or have not been marked as updated: 
                    <strong className="ml-1">{unupdatedQuestions.join(', ')}</strong>.
                     (For R010, this refers to its specific CEACR comment reply. For R146, this means its main reply is pending. For R_CAS_FOLLOW_UP, it means its reply is pending.)
                  </p>
                </div>
              )}
              <p className="mt-2">
                Please ensure all information is accurate and complete. This action cannot be undone.
              </p>
              <p className="mt-4">Are you sure you want to proceed?</p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={handleCancelSubmission}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmSubmit}>
                Confirm Submission
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center py-6 text-sm text-gray-500 bg-gray-100">
        <p>&copy; {new Date().getFullYear()} International Labour Organization. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default QuestionnairePage;