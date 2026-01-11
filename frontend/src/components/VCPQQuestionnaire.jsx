import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Brain,
  MessageCircle,
  Users,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// Module icons and colors
const MODULE_CONFIG = {
  Cognition: { 
    icon: Brain, 
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    description: 'How this person thinks and processes information'
  },
  Communication: { 
    icon: MessageCircle, 
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    description: 'How this person expresses and shares ideas'
  },
  Hierarchy: { 
    icon: Users, 
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    description: 'How this person relates to authority and structure'
  },
  Operational: { 
    icon: Settings, 
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    description: 'How this person handles conflict and decisions'
  }
};

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree', shortLabel: 'SD' },
  { value: 2, label: 'Disagree', shortLabel: 'D' },
  { value: 3, label: 'Neutral', shortLabel: 'N' },
  { value: 4, label: 'Agree', shortLabel: 'A' },
  { value: 5, label: 'Strongly Agree', shortLabel: 'SA' }
];

export default function VCPQQuestionnaire({ 
  onComplete, 
  onCancel,
  initialResponses = {},
  demographics = {},
  domain = 'general'
}) {
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState(initialResponses);
  const [currentModule, setCurrentModule] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/vcpq/questions');
      const data = await res.json();
      
      if (data.success) {
        setQuestions(data.questionnaire.questions);
      } else {
        throw new Error(data.error || 'Failed to load questionnaire');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group questions by module
  const moduleOrder = ['Cognition', 'Communication', 'Hierarchy', 'Operational'];
  const questionsByModule = moduleOrder.map(moduleName => ({
    name: moduleName,
    questions: questions.filter(q => q.module === moduleName)
  }));

  // Current module data
  const currentModuleData = questionsByModule[currentModule];
  const moduleConfig = currentModuleData ? MODULE_CONFIG[currentModuleData.name] : null;
  const ModuleIcon = moduleConfig?.icon || Brain;

  // Progress calculations
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(responses).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const currentModuleAnswered = currentModuleData?.questions.filter(
    q => responses[q.id] !== undefined
  ).length || 0;
  const currentModuleTotal = currentModuleData?.questions.length || 0;
  const isCurrentModuleComplete = currentModuleAnswered === currentModuleTotal;

  // Handle response change
  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Navigation
  const canGoNext = currentModule < moduleOrder.length - 1;
  const canGoPrev = currentModule > 0;
  const canSubmit = answeredQuestions === totalQuestions;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentModule(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentModule(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/vcpq/generate-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          domain,
          demographics,
          save: true
        })
      });

      const data = await res.json();

      if (data.success) {
        onComplete?.(data.persona);
      } else {
        throw new Error(data.error || 'Failed to generate persona');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Loading questionnaire...</span>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchQuestions}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          VCPQ Assessment
        </h1>
        <p className="text-gray-600">
          Answer these 28 questions to generate a psychometrically-grounded persona.
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{answeredQuestions} of {totalQuestions} questions answered</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Module Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {moduleOrder.map((moduleName, idx) => {
          const config = MODULE_CONFIG[moduleName];
          const Icon = config.icon;
          const moduleQuestions = questionsByModule[idx].questions;
          const answered = moduleQuestions.filter(q => responses[q.id] !== undefined).length;
          const isComplete = answered === moduleQuestions.length;
          const isActive = idx === currentModule;

          return (
            <button
              key={moduleName}
              onClick={() => setCurrentModule(idx)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl transition-all
                ${isActive 
                  ? `bg-gradient-to-r ${config.color} text-white shadow-lg` 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium whitespace-nowrap">{moduleName}</span>
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${isActive ? 'bg-white/20' : 'bg-gray-100'}
              `}>
                {answered}/{moduleQuestions.length}
              </span>
              {isComplete && !isActive && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Current Module Header */}
      {moduleConfig && (
        <div className={`${moduleConfig.bgColor} rounded-xl p-6 mb-6`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${moduleConfig.color} text-white`}>
              <ModuleIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Module {currentModule + 1}: {currentModuleData.name}
            </h2>
          </div>
          <p className="text-gray-600 ml-12">
            {moduleConfig.description}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6 mb-8">
        {currentModuleData?.questions.map((question, idx) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={idx}
            value={responses[question.id]}
            onChange={(value) => handleResponse(question.id, value)}
            moduleConfig={moduleConfig}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all
              ${canGoPrev 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {canGoNext ? (
            <button
              onClick={handleNext}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg transition-all
                ${isCurrentModuleComplete
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }
              `}
            >
              Next Module
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg transition-all
                ${canSubmit && !submitting
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Generate Persona
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Skip unanswered hint */}
      {!canSubmit && currentModule === moduleOrder.length - 1 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Please answer all questions to generate a persona.
          {answeredQuestions < totalQuestions && (
            <span className="ml-1">
              ({totalQuestions - answeredQuestions} remaining)
            </span>
          )}
        </p>
      )}
    </div>
  );
}

// Individual Question Card Component
function QuestionCard({ question, index, value, onChange, moduleConfig }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex gap-4 mb-4">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
          ${moduleConfig.bgColor} ${moduleConfig.textColor}
        `}>
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-gray-900 font-medium">
            {question.question}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Measures: {question.meta_vector.replace('_', ' ')}
            {question.reversed && ' (reversed)'}
          </p>
        </div>
      </div>

      {/* Likert Scale */}
      <div className="flex gap-2 justify-center">
        {LIKERT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 max-w-24 py-3 px-2 rounded-lg text-center transition-all
              ${value === option.value
                ? `bg-gradient-to-r ${moduleConfig.color} text-white shadow-md scale-105`
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }
            `}
          >
            <div className="text-lg font-bold">{option.value}</div>
            <div className="text-xs mt-1 leading-tight">
              {option.shortLabel}
            </div>
          </button>
        ))}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2 px-2">
        <span className="text-xs text-gray-400">Strongly Disagree</span>
        <span className="text-xs text-gray-400">Strongly Agree</span>
      </div>
    </div>
  );
}
