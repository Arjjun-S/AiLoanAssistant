/**
 * Chat Component
 * Main chat interface for the loan assistant
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, getPdfDownloadUrl, ChatResponse } from './api';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pdfUrl?: string;
  status?: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  showLoanOptions?: boolean;
}

// Loan options for quick selection
const LOAN_OPTIONS = [
  { id: 'personal', name: 'Personal Loan', rate: '12.5% p.a.', icon: '💳' },
  { id: 'home', name: 'Home Loan', rate: '8.5% p.a.', icon: '🏠' },
  { id: 'car', name: 'Car Loan', rate: '9.5% p.a.', icon: '🚗' },
  { id: 'education', name: 'Education Loan', rate: '10% p.a.', icon: '🎓' },
];

// Generate or retrieve session ID
function getSessionId(): string {
  const stored = sessionStorage.getItem('loanAssistantSessionId');
  if (stored) return stored;
  
  const newId = uuidv4();
  sessionStorage.setItem('loanAssistantSessionId', newId);
  return newId;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<'IN_PROGRESS' | 'APPROVED' | 'REJECTED'>('IN_PROGRESS');
  const [sessionId] = useState(getSessionId);
  const [showLoanButtons, setShowLoanButtons] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send initial greeting on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        const response = await sendMessage('Hi', sessionId);
        addAssistantMessage(response, true);
        setShowLoanButtons(true);
      } catch (err) {
        setError('Failed to connect to the server. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (messages.length === 0) {
      initChat();
    }
  }, [sessionId, messages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const addAssistantMessage = (response: ChatResponse, showOptions: boolean = false) => {
    // Check if we should show loan options
    const shouldShowOptions = showOptions || 
      response.reply.includes('Which type of loan') || 
      response.reply.includes('Please select one of our loan products');
    
    const message: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: response.reply,
      timestamp: new Date(),
      pdfUrl: response.pdfUrl,
      status: response.status,
      showLoanOptions: shouldShowOptions,
    };
    setMessages(prev => [...prev, message]);
    setApplicationStatus(response.status);
    setShowLoanButtons(shouldShowOptions);
  };

  // Handle loan option button click
  const handleLoanSelect = async (loanName: string) => {
    if (isLoading) return;
    
    setShowLoanButtons(false);
    setError(null);
    addUserMessage(loanName);
    setIsLoading(true);

    try {
      const response = await sendMessage(loanName, sessionId);
      addAssistantMessage(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);
    setShowLoanButtons(false);
    
    addUserMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessage, sessionId);
      addAssistantMessage(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleNewApplication = () => {
    sessionStorage.removeItem('loanAssistantSessionId');
    window.location.reload();
  };

  const formatMessage = (content: string) => {
    // Convert markdown-like formatting to HTML
    return content
      .split('\n')
      .map((line) => {
        // Bold text
        let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Bullet points
        if (formattedLine.startsWith('• ') || formattedLine.startsWith('- ')) {
          formattedLine = `<li>${formattedLine.substring(2)}</li>`;
        } else if (formattedLine.match(/^\d+\. /)) {
          formattedLine = `<li>${formattedLine.substring(formattedLine.indexOf(' ') + 1)}</li>`;
        }
        
        return formattedLine;
      })
      .join('<br />');
  };

  // Check if message contains decision info
  const isApprovalMessage = (content: string) => {
    return content.includes('APPROVED') || content.includes('sanctioned') || content.includes('Congratulations');
  };

  const isRejectionMessage = (content: string) => {
    return content.includes('not approved') || content.includes('NOT APPROVED') || content.includes('rejected');
  };

  return (
    <div className="chat-wrapper">
      {/* Main Heading */}
      <div className="main-heading">
        <span className="heading-title">TechBank</span>
        <span className="heading-subtitle">AI Loan Assistant</span>
      </div>

      <div className="main-layout">
        {/* Static Robot Image on Left */}
        <div className="robot-sidebar">
          <img src="/robot.png" alt="AI Assistant" className="robot-static" />
          <div className="robot-speech-bubble">
            <p>Hello! How can I assist you with your loan today?</p>
          </div>
        </div>

        <div className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <div className="header-status">
            <span className={`status-badge status-${applicationStatus.toLowerCase()}`}>
              {applicationStatus === 'IN_PROGRESS' && '⏳ In Progress'}
              {applicationStatus === 'APPROVED' && '✅ Approved'}
              {applicationStatus === 'REJECTED' && '❌ Not Approved'}
            </span>
            {applicationStatus !== 'IN_PROGRESS' && (
              <button className="new-app-btn" onClick={handleNewApplication}>
                New Application
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="messages-container">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={message.id} className="message-wrapper">
                <div className={`message message-${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    
                    {/* Loan Options Buttons */}
                    {message.showLoanOptions && showLoanButtons && index === messages.length - 1 && (
                      <div className="loan-options">
                        <p className="loan-options-label">Select a loan type:</p>
                        <div className="loan-options-grid">
                          {LOAN_OPTIONS.map((loan) => (
                            <button
                              key={loan.id}
                              className="loan-option-btn"
                              onClick={() => handleLoanSelect(loan.name)}
                              disabled={isLoading}
                            >
                              <span className="loan-icon">{loan.icon}</span>
                              <span className="loan-name">{loan.name}</span>
                              <span className="loan-rate">{loan.rate}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {message.pdfUrl && (
                      <a 
                        href={getPdfDownloadUrl(message.pdfUrl)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="pdf-download-btn"
                      >
                        📄 Download Sanction Letter
                      </a>
                    )}
                    <span className="message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {/* Decision Explanation Box */}
                {message.role === 'assistant' && isApprovalMessage(message.content) && (
                  <div className="decision-explanation approved">
                    <span className="decision-icon">✅</span>
                    <span>Approved because salary and credit score meet eligibility criteria.</span>
                  </div>
                )}
                {message.role === 'assistant' && isRejectionMessage(message.content) && (
                  <div className="decision-explanation rejected">
                    <span className="decision-icon">❌</span>
                    <span>Rejected due to insufficient credit score or income below ₹25,000.</span>
                  </div>
                )}
              </div>
            ))}
          
            {isLoading && (
              <div className="message message-assistant">
                <div className="message-avatar">
                  🤖
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          
            {error && (
              <div className="error-message">
                ⚠️ {error}
                <button onClick={() => setError(null)}>Dismiss</button>
              </div>
            )}
          
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="send-btn"
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer className="chat-footer">
          <p className="disclaimer">⚠️ This prototype uses mock data and rule-based eligibility for demonstration.</p>
        </footer>
        </div>
      </div>
    </div>
  );
}
