import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import jsPDF from 'jspdf';
import { QuestionContent, Answer } from '../types';
import Checkbox from './Checkbox';
import Button from './Button'; 
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, PlusIcon, MinusIcon, PrintIcon, ExclamationTriangleIcon, Q010_CEACR_COMMENT, CAS_FOLLOW_UP_CEACR_COMMENT } from '../constants';

interface QuestionAccordionProps {
  question: QuestionContent;
  answer: Answer;
  onAnswerChange: (questionId: string, value: string) => void;
  onCeacrSessionSet: (questionId: string, session: string) => void; 
  onLegalAnalysisChange: (questionId: string, legalAnalysisText: string) => void;
  onDlcCommentChange: (questionId: string, dlcText: string) => void;
  onGovernmentReplyChange: (questionId: string, replyText: string) => void;
  onQ010StaticCeacrReplyChange: (questionId: string, replyText: string) => void;
  onFollowUpCasReplyChange: (questionId: string, replyText: string) => void; // New prop
}

const Q010_TOOLTIP_DATA: Record<string, string> = {
  "Article 10 (1) C102": "Article 10\n1. The benefit shall include at least--\n(a) in case of a morbid condition--\n(i) general practitioner care, including domiciliary visiting;\n(ii) specialist care at hospitals for in-patients and out-patients, and such specialist care as may be available outside hospitals;\n(iii) the essential pharmaceutical supplies as prescribed by medical or other qualified practitioners; and\n(iv) hospitalisation where necessary; and\n(b) in case of pregnancy and confinement and their consequences--\n(i) pre-natal, confinement and post-natal care either by medical practitioners or by qualified midwives; and\n(ii) hospitalisation where necessary.",
  "Articles 13 and 14 C130": "Article 13\nThe medical care referred to in Article 8 shall comprise at least--\n\n(a) general practitioner care, including domiciliary visiting;\n(b) specialist care at hospitals for in-patients and out-patients, and such specialist care as may be available outside hospitals;\n(c) the necessary pharmaceutical supplies on prescription by medical or other qualified practitioners;\n(d) hospitalisation where necessary;\n(e) dental care, as prescribed; and\n(f) medical rehabilitation, including the supply, maintenance and renewal of prosthetic and orthopaedic appliances, as prescribed.\nArticle 14\nWhere a declaration made in virtue of Article 2 is in force, the medical care referred to in Article 8 shall comprise at least--\n\n(a) general practitioner care, including, wherever possible, domiciliary visiting;\n(b) specialist care at hospitals for in-patients and out-patients, and, wherever possible, such specialist care as may be available outside hospitals;\n(c) the necessary pharmaceutical supplies on prescription by medical or other qualified practitioners; and\n(d) hospitalisation where necessary."
};

const MIN_ROWS_MAIN_ANSWER = 5;
const MIN_ROWS_SUB_FIELD = 3;

const QuestionAccordion: React.FC<QuestionAccordionProps> = ({
  question,
  answer,
  onAnswerChange,
  onCeacrSessionSet, 
  onLegalAnalysisChange,
  onDlcCommentChange,
  onGovernmentReplyChange,
  onQ010StaticCeacrReplyChange,
  onFollowUpCasReplyChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isQ010CeacrCommentOpen, setIsQ010CeacrCommentOpen] = useState(false);
  const [isCasFollowUpCeacrCommentOpen, setIsCasFollowUpCeacrCommentOpen] = useState(false);
  
  const [isLegalAnalysisOpen, setIsLegalAnalysisOpen] = useState(false);
  const [isDlcCommentOpen, setIsDlcCommentOpen] = useState(false);
  const [isGovernmentReplyOpen, setIsGovernmentReplyOpen] = useState(false);

  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [modalArticleContent, setModalArticleContent] = useState<string | null>(null);

  const [textareasExpansion, setTextareasExpansion] = useState({
    mainAnswer: true,
    legalAnalysis: true,
    dlcComment: true,
    governmentReply: true,
    q010StaticReply: true,
    followUpCasReply: true, // Added for CAS Follow-up reply
  });

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalContent, setPrintModalContent] = useState('');
  const [printModalTitle, setPrintModalTitle] = useState('');
  const printModalRef = useRef<HTMLDivElement>(null);

  const mainAnswerRef = useRef<HTMLTextAreaElement>(null);
  const legalAnalysisRef = useRef<HTMLTextAreaElement>(null);
  const dlcCommentRef = useRef<HTMLTextAreaElement>(null);
  const governmentReplyRef = useRef<HTMLTextAreaElement>(null);
  const q010StaticGovReplyRef = useRef<HTMLTextAreaElement>(null);
  const followUpCasReplyRef = useRef<HTMLTextAreaElement>(null); // Ref for CAS Follow-up reply


  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null, minRows: number) => {
    if (!textarea) return;
    textarea.style.height = 'auto'; 
    const computedStyle = getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);
    
    const minHeight = (lineHeight * minRows) + paddingTop + paddingBottom;
    const newHeight = Math.max(textarea.scrollHeight, minHeight);

    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = 'hidden'; 
  };

  const setCollapsedHeight = (textarea: HTMLTextAreaElement | null, minRows: number) => {
    if (!textarea) return;
    const computedStyle = getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);
    textarea.style.height = `${(lineHeight * minRows) + paddingTop + paddingBottom}px`;
    textarea.style.overflowY = 'auto'; 
  };

  useEffect(() => {
    if (question.id === 'R_CAS_FOLLOW_UP') return; // Main answer not used for this Q
    const ta = mainAnswerRef.current;
    if (!ta) return;
    if (textareasExpansion.mainAnswer) {
      adjustTextareaHeight(ta, MIN_ROWS_MAIN_ANSWER);
    } else {
      setCollapsedHeight(ta, MIN_ROWS_MAIN_ANSWER);
    }
  }, [answer.value, textareasExpansion.mainAnswer, isOpen, question.id]);

  useEffect(() => {
    const ta = legalAnalysisRef.current;
    if (!ta) return;
    if (textareasExpansion.legalAnalysis) {
      adjustTextareaHeight(ta, MIN_ROWS_SUB_FIELD);
    } else {
      setCollapsedHeight(ta, MIN_ROWS_SUB_FIELD);
    }
  }, [answer.legalAnalysis, textareasExpansion.legalAnalysis, isLegalAnalysisOpen]);

  useEffect(() => {
    const ta = dlcCommentRef.current;
    if (!ta) return;
    if (textareasExpansion.dlcComment) {
      adjustTextareaHeight(ta, MIN_ROWS_SUB_FIELD);
    } else {
      setCollapsedHeight(ta, MIN_ROWS_SUB_FIELD);
    }
  }, [answer.dlcComment, textareasExpansion.dlcComment, isDlcCommentOpen]);

  useEffect(() => {
    const ta = governmentReplyRef.current;
    if (!ta) return;
    if (textareasExpansion.governmentReply) {
      adjustTextareaHeight(ta, MIN_ROWS_SUB_FIELD);
    } else {
      setCollapsedHeight(ta, MIN_ROWS_SUB_FIELD);
    }
  }, [answer.governmentReply, textareasExpansion.governmentReply, isGovernmentReplyOpen]);

  useEffect(() => {
    const ta = q010StaticGovReplyRef.current;
    if (!ta || question.id !== 'R010') return;
    if (textareasExpansion.q010StaticReply) {
      adjustTextareaHeight(ta, MIN_ROWS_SUB_FIELD);
    } else {
      setCollapsedHeight(ta, MIN_ROWS_SUB_FIELD);
    }
  }, [answer.q010StaticCeacrReply, textareasExpansion.q010StaticReply, isOpen, question.id]);

  useEffect(() => {
    const ta = followUpCasReplyRef.current;
    if (!ta || question.id !== 'R_CAS_FOLLOW_UP') return;
    if (textareasExpansion.followUpCasReply) {
      adjustTextareaHeight(ta, MIN_ROWS_SUB_FIELD);
    } else {
      setCollapsedHeight(ta, MIN_ROWS_SUB_FIELD);
    }
  }, [answer.followUpCasReply, textareasExpansion.followUpCasReply, isOpen, question.id]);


  const handleToggleTextareaExpansion = (
    areaKey: keyof typeof textareasExpansion
  ) => {
    setTextareasExpansion(prev => ({
        ...prev,
        [areaKey]: !prev[areaKey]
    }));
  };

  const handleOpenPrintModal = (content: string, title: string) => {
    setPrintModalContent(content);
    setPrintModalTitle(title);
    setIsPrintModalOpen(true);
  };

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
  };

  const handleActualPrintAction = () => {
    if (printModalRef.current) {
      document.body.classList.add('body-has-printing-modal');
      printModalRef.current.classList.add('is-printing');
      
      window.print();

      const afterPrintHandler = () => {
          document.body.classList.remove('body-has-printing-modal');
          if (printModalRef.current) { 
              printModalRef.current.classList.remove('is-printing');
          }
          window.removeEventListener('afterprint', afterPrintHandler);
      };
      window.addEventListener('afterprint', afterPrintHandler);
      
      setTimeout(() => {
        if (document.body.classList.contains('body-has-printing-modal')) {
            document.body.classList.remove('body-has-printing-modal');
        }
        if (printModalRef.current && printModalRef.current.classList.contains('is-printing')) {
           printModalRef.current.classList.remove('is-printing');
        }
        window.removeEventListener('afterprint', afterPrintHandler); 
      }, 500); 
    }
  };

  const handleDownloadTextAsDoc = (content: string, title: string) => {
    const titleHtml = `<h1>${title}</h1>`;
    const contentHtml = `<p>${content.replace(/\n/g, '<br>')}</p>`;

    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Export</title></head>
        <body>
    `;
    const footer = '</body></html>';
    const sourceHTML = header + titleHtml + contentHtml + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleDownloadTextAsPdf = (content: string, title: string) => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - 2 * margin;
    
    pdf.setFontSize(16);
    const splitTitle = pdf.splitTextToSize(title, usableWidth);
    pdf.text(splitTitle, margin, margin);
    
    pdf.setFontSize(12);
    const splitText = pdf.splitTextToSize(content, usableWidth);
    
    let y = margin + (splitTitle.length * 10);
    for (let i = 0; i < splitText.length; i++) {
        if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;
        }
        pdf.text(splitText[i], margin, y);
        y += 7; // line height
    }

    pdf.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };


  const handleToggleAccordion = () => setIsOpen(!isOpen);

  const provisionsTextForFallback = question.provisions?.replace(/\s*-\s*Guidance$/, '').trim();
  const hasGuidanceLink = question.provisions?.endsWith('Guidance');

  useEffect(() => {
    if (answer.ceacrSession) { 
      setIsLegalAnalysisOpen(!!answer.legalAnalysis);
      setIsDlcCommentOpen(!!answer.dlcComment);
      setIsGovernmentReplyOpen(!!answer.governmentReply);
    } else {
      setIsLegalAnalysisOpen(false);
      setIsDlcCommentOpen(false);
      setIsGovernmentReplyOpen(false);
    }
  }, [answer.ceacrSession, answer.legalAnalysis, answer.dlcComment, answer.governmentReply]);

  const handleArticleClick = (articleKey: string) => {
    if (Q010_TOOLTIP_DATA[articleKey]) {
      setModalArticleContent(Q010_TOOLTIP_DATA[articleKey]);
      setIsArticleModalOpen(true);
    }
  };

  const renderProvisionsContent = () => {
    if (question.id === 'R010') {
        const key1 = "Article 10 (1) C102";
        const key2 = "Articles 13 and 14 C130";
        
        if (question.provisions?.includes(key1) && question.provisions?.includes(key2)) {
            return (
                <p className="whitespace-pre-line text-blue-600">
                    <span 
                        className="cursor-pointer hover:underline" 
                        onClick={() => handleArticleClick(key1)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleArticleClick(key1)}
                    >
                        {key1}
                    </span>
                    <span> - </span>
                    <span 
                        className="cursor-pointer hover:underline" 
                        onClick={() => handleArticleClick(key2)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleArticleClick(key2)}
                    >
                        {key2}
                    </span>
                    {hasGuidanceLink && (
                         <>
                            <span> - </span>
                            <a href="#" className="text-blue-600 hover:underline cursor-pointer" onClick={(e) => e.preventDefault()}>Guidance</a>
                        </>
                    )}
                </p>
            );
        }
    }
    let content = provisionsTextForFallback || '';
     if (!question.provisions?.includes("Article 10 (1) C102") && !question.provisions?.includes("Articles 13 and 14 C130") && hasGuidanceLink) {
        content += ' - '; 
    }
    return (
        <p className="whitespace-pre-line text-blue-600">
            {provisionsTextForFallback}
            {! (question.id === 'R010' && question.provisions?.includes("Article 10 (1) C102") && question.provisions?.includes("Articles 13 and 14 C130")) && hasGuidanceLink && (
                 <>
                    {provisionsTextForFallback ? ' - ' : ''} 
                    <a href="#" className="text-blue-600 hover:underline cursor-pointer" onClick={(e) => e.preventDefault()}>Guidance</a>
                 </>
            )}
        </p>
    );
  };

  const getStatusIconAndColor = () => {
    let isPendingSpecial = false;
    let isUpdatedSpecial = false;
    let specialAriaLabelPending = "";
    let specialAriaLabelUpdated = "";

    if (question.id === 'R010') {
      isPendingSpecial = !answer.q010StaticCeacrReplyUpdated;
      isUpdatedSpecial = !!answer.q010StaticCeacrReplyUpdated;
      specialAriaLabelPending = "R010 CEACR Reply Pending";
      specialAriaLabelUpdated = "R010 CEACR Reply Updated";
    } else if (question.id === 'R146') {
      isPendingSpecial = !answer.q146PendingCommentReplyUpdated;
      isUpdatedSpecial = !!answer.q146PendingCommentReplyUpdated;
      specialAriaLabelPending = "R146 Pending Comment Reply Pending";
      specialAriaLabelUpdated = "R146 Pending Comment Reply Updated";
    } else if (question.id === 'R_CAS_FOLLOW_UP') {
      // Not 'pending' by default, but 'updated' if reply exists
      isUpdatedSpecial = !!answer.followUpCasReplyUpdated;
      specialAriaLabelUpdated = "CAS Follow-up Reply Updated";
    }


    if (isPendingSpecial) {
      return { icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" aria-label={specialAriaLabelPending} />, color: 'text-yellow-700' };
    } else if (isUpdatedSpecial) {
      return { icon: <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" aria-label={specialAriaLabelUpdated} />, color: 'text-green-700' };
    } else if (answer.isUpdated && question.id !== 'R_CAS_FOLLOW_UP') { // General case for other questions (excluding CAS Follow-up which relies on its own flag)
      return { icon: <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" aria-label="Updated" />, color: 'text-green-700' };
    }
    return { icon: null, color: 'text-gray-800' }; // Default if not updated and not special
  };

  const { icon: statusIcon, color: statusColor } = getStatusIconAndColor();

  const displayQuestionTitle = question.id === 'R_CAS_FOLLOW_UP' 
    ? (question.text.length > 80 ? question.text.substring(0,80) + "..." : question.text)
    : `${question.id}: ${question.text.length > 80 ? question.text.substring(0,80) + "..." : question.text}`;


  return (
    <div id={question.id} className="border border-gray-300 rounded-md mb-4 bg-white shadow-sm question-accordion-item">
      {isArticleModalOpen && modalArticleContent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-modal-title"
        >
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 id="article-modal-title" className="text-xl font-semibold text-gray-800 mb-4">Article Details</h3>
            <pre className="text-sm text-black whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-md">
              {modalArticleContent}
            </pre>
            <div className="mt-6 text-right">
              <Button onClick={() => setIsArticleModalOpen(false)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {isPrintModalOpen && ReactDOM.createPortal(
        <div
          ref={printModalRef}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[200] p-4 modal-wrapper"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-modal-title"
          aria-describedby="print-modal-content-area"
        >
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4 modal-print-hide">
              <h3 id="print-modal-title" className="text-xl font-semibold text-gray-800">
                Print / Download: {printModalTitle}
              </h3>
              <button onClick={handleClosePrintModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close print modal">&times;</button>
            </div>
            <div 
              id="print-modal-content-area" 
              className="my-4 p-4 bg-gray-50 text-black rounded max-h-[60vh] overflow-y-auto whitespace-pre-wrap modal-content-area-printable"
            >
              {printModalContent}
            </div>
            <div className="mt-6 flex justify-end space-x-3 modal-print-hide">
              <Button onClick={handleActualPrintAction} variant="primary">
                Print
              </Button>
              <Button onClick={() => handleDownloadTextAsPdf(printModalContent, printModalTitle)} variant="secondary">
                Download PDF
              </Button>
              <Button onClick={() => handleDownloadTextAsDoc(printModalContent, printModalTitle)} variant="secondary">
                Download DOC
              </Button>
              <Button onClick={handleClosePrintModal} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <button
        onClick={handleToggleAccordion}
        className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none"
        aria-expanded={isOpen}
        aria-controls={`question-content-${question.id}`}
      >
        <div className="flex items-center">
            {statusIcon}
            <span className={`font-semibold ${statusColor}`}>
                {displayQuestionTitle}
            </span>
        </div>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-600" /> : <ChevronDownIcon className="w-5 h-5 text-gray-600" />}
      </button>
      {isOpen && (
        <div id={`question-content-${question.id}`} className="p-4 border-t border-gray-200">
          <p className="text-gray-700 mb-3 whitespace-pre-line">{question.text}</p>
          
          {question.id === "R146" && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                <p className="text-gray-700">
                    <a 
                        href="https://normlex.ilo.org/dyn/nrmlx_en/f?p=1000:13100:0::NO:13100:P13100_COMMENT_ID,P11110_COUNTRY_ID,P11110_COUNTRY_NAME,P11110_COMMENT_YEAR:4002160,102549,Country%20X,2019" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        Direct Request (CEACR) - adopted 2019, published 109th ILC session (2021)
                    </a>
                </p>
            </div>
          )}

          {question.provisions && (
            <div className="mb-3 p-3 bg-gray-50 rounded-md text-sm">
              <p className="font-medium text-gray-700">Relevant Provisions:</p>
              {renderProvisionsContent()}
            </div>
          )}

          {/* Main answer textarea (not for R_CAS_FOLLOW_UP) */}
          {question.id !== 'R_CAS_FOLLOW_UP' && (
            <>
              <div className="relative">
                <textarea
                  ref={mainAnswerRef}
                  value={answer.value}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  rows={MIN_ROWS_MAIN_ANSWER}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0055A4] focus:border-transparent"
                  placeholder="Your response..."
                  aria-label={`Response for request ${question.id}`}
                  style={{ resize: 'none' }}
                />
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                    <button
                        onClick={() => handleToggleTextareaExpansion('mainAnswer')}
                        className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={textareasExpansion.mainAnswer ? "Collapse response field" : "Expand response field"}
                        title={textareasExpansion.mainAnswer ? "Collapse" : "Expand"}
                    >
                        {textareasExpansion.mainAnswer ? <MinusIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
                    </button>
                    <button
                        onClick={() => handleOpenPrintModal(answer.value, `${question.id}: ${question.text}`)}
                        className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={`Open response for ${question.id}: ${question.text} in popup`}
                        title="Open in popup and print"
                    >
                        <PrintIcon className="w-3 h-3" />
                    </button>
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-4">
                <Checkbox
                  id={`updated-${question.id}`}
                  label="Information updated"
                  checked={answer.isUpdated}
                  onChange={() => {}} 
                  disabled={true} 
                />
              </div>
            </>
          )}
          
          {/* R010 specific CEACR Comment 2026 and reply section */}
          {question.id === 'R010' && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
              <button
                onClick={() => setIsQ010CeacrCommentOpen(!isQ010CeacrCommentOpen)}
                className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none"
                aria-expanded={isQ010CeacrCommentOpen}
                aria-controls={`q010-ceacr-comment-content-${question.id}`}
              >
                <span className="text-red-700 font-semibold">CEACR Comment 2026</span>
                {isQ010CeacrCommentOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </button>
              {isQ010CeacrCommentOpen && (
                <div id={`q010-ceacr-comment-content-${question.id}`} className="mt-2 pl-2">
                  <p className="text-sm text-gray-700 mb-2 whitespace-pre-line bg-gray-50 p-3 rounded-md border border-gray-200" dangerouslySetInnerHTML={{ __html: Q010_CEACR_COMMENT.replace(/\*\*_(.*?)_\*\*/g, '<strong><em>$1</em></strong>') }} />
                </div>
              )}

              <div className="mt-2 relative">
                 <label htmlFor={`q010-static-gov-reply-${question.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Government reply to CEACR comment 2026
                 </label>
                <textarea
                  id={`q010-static-gov-reply-${question.id}`}
                  ref={q010StaticGovReplyRef}
                  value={answer.q010StaticCeacrReply || ''}
                  onChange={(e) => onQ010StaticCeacrReplyChange(question.id, e.target.value)}
                  rows={MIN_ROWS_SUB_FIELD}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0055A4] focus:border-transparent bg-blue-50 text-gray-900"
                  placeholder="Enter government reply to the 2026 CEACR comment..."
                  aria-label={`Government reply to CEACR comment 2026 for request ${question.id}`}
                  style={{ resize: 'none' }}
                />
                <div className="absolute top-8 right-2 flex items-center space-x-1"> {/* Adjusted top to 8 for label */}
                    <button
                        onClick={() => handleToggleTextareaExpansion('q010StaticReply')}
                        className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={textareasExpansion.q010StaticReply ? "Collapse R010 CEACR reply field" : "Expand R010 CEACR reply field"}
                        title={textareasExpansion.q010StaticReply ? "Collapse" : "Expand"}
                    >
                        {textareasExpansion.q010StaticReply ? <MinusIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
                    </button>
                    <button
                        onClick={() => handleOpenPrintModal(answer.q010StaticCeacrReply || '', `Government Reply to CEACR Comment 2026 for ${question.id}`)}
                        className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={`Open R010 CEACR reply for ${question.id} in popup`}
                        title="Open in popup and print"
                    >
                        <PrintIcon className="w-3 h-3" />
                    </button>
                </div>
              </div>
               <div className="mt-3 flex items-center space-x-4">
                <Checkbox
                  id={`q010-static-ceacr-reply-updated-${question.id}`}
                  label="Information updated (CEACR Comment Reply)"
                  checked={answer.q010StaticCeacrReplyUpdated || false}
                  onChange={() => {}} 
                  disabled={true} 
                />
              </div>
            </div>
          )}

          {/* CAS Follow-up Section */}
          {question.id === 'R_CAS_FOLLOW_UP' && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
              <button
                onClick={() => setIsCasFollowUpCeacrCommentOpen(!isCasFollowUpCeacrCommentOpen)}
                className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none"
                aria-expanded={isCasFollowUpCeacrCommentOpen}
                aria-controls={`cas-ceacr-comment-content-${question.id}`}
              >
                <span className="text-red-700 font-semibold">CEACR Comment</span>
                {isCasFollowUpCeacrCommentOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </button>
              {isCasFollowUpCeacrCommentOpen && (
                <div id={`cas-ceacr-comment-content-${question.id}`} className="mt-2 pl-2">
                  <div className="text-sm text-gray-700 mb-3 whitespace-pre-line bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div dangerouslySetInnerHTML={{ __html: CAS_FOLLOW_UP_CEACR_COMMENT.replace(/\n/g, '<br />').replace(/\*\*_(.*?)_\*\*/g, '<strong><em>$1</em></strong>') }} />
                  </div>
                </div>
              )}
              
              <div className="mt-4 relative">
                 <label htmlFor={`cas-follow-up-gov-reply-${question.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Government reply
                 </label>
                <textarea
                  id={`cas-follow-up-gov-reply-${question.id}`}
                  ref={followUpCasReplyRef}
                  value={answer.followUpCasReply || ''}
                  onChange={(e) => onFollowUpCasReplyChange(question.id, e.target.value)}
                  rows={MIN_ROWS_SUB_FIELD}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0055A4] focus:border-transparent bg-blue-50 text-gray-900"
                  placeholder="Enter government reply to the CAS follow-up comment..."
                  aria-label={`Government reply to CAS follow-up for ${question.id}`}
                  style={{ resize: 'none' }}
                />
                <div className="absolute top-8 right-2 flex items-center space-x-1">
                    <button
                        onClick={() => handleToggleTextareaExpansion('followUpCasReply')}
                        className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={textareasExpansion.followUpCasReply ? "Collapse CAS follow-up reply field" : "Expand CAS follow-up reply field"}
                        title={textareasExpansion.followUpCasReply ? "Collapse" : "Expand"}
                    >
                        {textareasExpansion.followUpCasReply ? <MinusIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
                    </button>
                    <button
                        onClick={() => handleOpenPrintModal(answer.followUpCasReply || '', `Government Reply to CAS Follow-up for ${question.id}`)}
                        className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={`Open CAS follow-up reply for ${question.id} in popup`}
                        title="Open in popup and print"
                    >
                        <PrintIcon className="w-3 h-3" />
                    </button>
                </div>
              </div>
               <div className="mt-3 flex items-center space-x-4">
                <Checkbox
                  id={`cas-follow-up-reply-updated-${question.id}`}
                  label="Information updated (CAS Follow-up Reply)"
                  checked={answer.followUpCasReplyUpdated || false}
                  onChange={() => {}} 
                  disabled={true} 
                />
              </div>
            </div>
          )}
          
          {/* Dynamic Sections (Legal Analysis, DLC, Gov Reply for CEACR session) - Not for R_CAS_FOLLOW_UP or R010 (handled separately) */}
          {answer.ceacrSession && question.id !== 'R_CAS_FOLLOW_UP' && question.id !== 'R010' && ( 
            <>
              {/* Legal Analysis Section */}
              <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                <button
                  onClick={() => setIsLegalAnalysisOpen(!isLegalAnalysisOpen)}
                  className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none"
                  aria-expanded={isLegalAnalysisOpen}
                  aria-controls={`legal-analysis-content-${question.id}`}
                >
                  <span>Legal analysis (only for ILO Staff)</span>
                  {isLegalAnalysisOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
                {isLegalAnalysisOpen && (
                  <div id={`legal-analysis-content-${question.id}`} className="mt-2 pl-2 relative">
                    <textarea
                      ref={legalAnalysisRef}
                      value={answer.legalAnalysis || ''}
                      onChange={(e) => onLegalAnalysisChange(question.id, e.target.value)}
                      rows={MIN_ROWS_SUB_FIELD}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0055A4] focus:border-transparent bg-yellow-50 text-gray-900"
                      placeholder="Enter legal analysis..."
                      aria-label={`Legal analysis for request ${question.id} (CEACR Session: ${answer.ceacrSession})`}
                      style={{ resize: 'none' }}
                    />
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                        <button
                            onClick={() => handleToggleTextareaExpansion('legalAnalysis')}
                            className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            aria-label={textareasExpansion.legalAnalysis ? "Collapse legal analysis field" : "Expand legal analysis field"}
                            title={textareasExpansion.legalAnalysis ? "Collapse" : "Expand"}
                        >
                            {textareasExpansion.legalAnalysis ? <MinusIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={() => handleOpenPrintModal(answer.legalAnalysis || '', `Legal Analysis for ${question.id}: ${question.text} (CEACR: ${answer.ceacrSession})`)}
                            className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            aria-label={`Open legal analysis for ${question.id}: ${question.text} in popup`}
                            title="Open in popup and print"
                        >
                            <PrintIcon className="w-3 h-3" />
                        </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Draft Legal Comment (DLC) Section */}
              <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                <button
                  onClick={() => setIsDlcCommentOpen(!isDlcCommentOpen)}
                  className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none"
                  aria-expanded={isDlcCommentOpen}
                  aria-controls={`dlc-comment-content-${question.id}`}
                >
                  <span>Draft Legal Comment (DLC) - CEACR Session: {answer.ceacrSession}</span>
                  {isDlcCommentOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
                {isDlcCommentOpen && (
                  <div id={`dlc-comment-content-${question.id}`} className="mt-2 pl-2 relative">
                    <textarea
                      ref={dlcCommentRef}
                      value={answer.dlcComment || ''}
                      onChange={(e) => onDlcCommentChange(question.id, e.target.value)}
                      rows={MIN_ROWS_SUB_FIELD}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0055A4] focus:border-transparent bg-yellow-50 text-gray-900"
                      placeholder="Enter DLC comment..."
                      aria-label={`Draft Legal Comment for request ${question.id} (CEACR Session: ${answer.ceacrSession})`}
                      style={{ resize: 'none' }}
                    />
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                        <button
                            onClick={() => handleToggleTextareaExpansion('dlcComment')}
                            className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            aria-label={textareasExpansion.dlcComment ? "Collapse DLC field" : "Expand DLC field"}
                            title={textareasExpansion.dlcComment ? "Collapse" : "Expand"}
                        >
                            {textareasExpansion.dlcComment ? <MinusIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={() => handleOpenPrintModal(answer.dlcComment || '', `Draft Legal Comment (DLC) for ${question.id}: ${question.text} (CEACR: ${answer.ceacrSession})`)}
                            className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            aria-label={`Open DLC for ${question.id}: ${question.text} in popup`}
                            title="Open in popup and print"
                        >
                            <PrintIcon className="w-3 h-3" />
                        </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Government Reply Section (Dynamic based on CEACR Session) */}
              <div className="mt-4 pt-4 border-t border-dashed border-gray-300"> 
                <button
                  onClick={() => setIsGovernmentReplyOpen(!isGovernmentReplyOpen)}
                  className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none"
                  aria-expanded={isGovernmentReplyOpen}
                  aria-controls={`government-reply-content-${question.id}`}
                >
                  <span>Government reply to CEACR comment</span>
                  {isGovernmentReplyOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
                {isGovernmentReplyOpen && (
                  <div id={`government-reply-content-${question.id}`} className="mt-2 pl-2 relative">
                    <textarea
                      ref={governmentReplyRef}
                      value={answer.governmentReply || ''}
                      onChange={(e) => onGovernmentReplyChange(question.id, e.target.value)}
                      rows={MIN_ROWS_SUB_FIELD}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0055A4] focus:border-transparent bg-blue-50 text-gray-900"
                      placeholder="Enter government reply..."
                      aria-label={`Government reply to CEACR comment for request ${question.text}`}
                      style={{ resize: 'none' }}
                    />
                     <div className="absolute top-2 right-2 flex items-center space-x-1">
                        <button
                            onClick={() => handleToggleTextareaExpansion('governmentReply')}
                            className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            aria-label={textareasExpansion.governmentReply ? "Collapse government reply field" : "Expand government reply field"}
                            title={textareasExpansion.governmentReply ? "Collapse" : "Expand"}
                        >
                            {textareasExpansion.governmentReply ? <MinusIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={() => handleOpenPrintModal(answer.governmentReply || '', `Government Reply for ${question.id}: ${question.text} (CEACR: ${answer.ceacrSession})`)}
                            className="p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            aria-label={`Open government reply for ${question.id}: ${question.text} in popup`}
                            title="Open in popup and print"
                        >
                            <PrintIcon className="w-3 h-3" />
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionAccordion;