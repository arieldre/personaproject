import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionnairesAPI } from '../services/api';
import { Loader2, CheckCircle, AlertCircle, Sparkles, ChevronLeft, ChevronRight, User, Mail, Briefcase, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

// VCPQ Likert scale mapping - labels to numeric values for vector processing
const LIKERT_SCALE = {
  'Strongly Disagree': 1,
  'Disagree': 2,
  'Neutral': 3,
  'Agree': 4,
  'Strongly Agree': 5,
};

const QuestionnaireResponsePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentModule, setCurrentModule] = useState(0);
  const [respondentInfo, setRespondentInfo] = useState({ email: '', name: '', role: '', department: '' });

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await questionnairesAPI.getByAccessCode(code);
        setQuestionnaire(response.data);
      } catch (error) {
        console.error('Failed to fetch questionnaire:', error);
        toast.error(error.response?.data?.error || 'Questionnaire not found');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionnaire();
  }, [code]);

  // Handle Likert scale answer - store numeric value for VCPQ processing
  const handleLikertAnswer = (questionId, labelOrValue) => {
    // If it's already a number, use it; otherwise convert from label
    const numericValue = typeof labelOrValue === 'number'
      ? labelOrValue
      : (LIKERT_SCALE[labelOrValue] || 3);
    setAnswers(prev => ({ ...prev, [questionId]: numericValue }));
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelect = (questionId, option) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter(o => o !== option) };
      }
      return { ...prev, [questionId]: [...current, option] };
    });
  };

  const handleSubmit = async () => {
    const questions = questionnaire.questions || [];
    const unanswered = questions.filter(q => q.required && answers[q.id] === undefined).map(q => q.id);

    if (unanswered.length > 0) {
      toast.error(`Please answer all required questions. Missing: ${unanswered.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      // Submit with numeric answers for VCPQ vector processing
      await questionnairesAPI.submitResponse(questionnaire.id, {
        answers,  // Already numeric for Likert questions
        demographics: {
          email: respondentInfo.email || undefined,
          name: respondentInfo.name || undefined,
          role: respondentInfo.role || undefined,
          department: respondentInfo.department || undefined,
        },
      });
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Questionnaire Not Found</h1>
          <p className="text-gray-600">This questionnaire may have been closed or doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h1>
          <p className="text-gray-600 mb-8">Your response has been submitted successfully.</p>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100">
            <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-700">Your answers will be processed using VCPQ vector analysis to generate accurate AI personas.</p>
          </div>
        </div>
      </div>
    );
  }

  const questions = questionnaire.questions || [];

  // Group questions by module for VCPQ
  const modules = [...new Set(questions.map(q => q.category))].filter(Boolean);
  const hasModules = modules.length > 0;
  const currentModuleQuestions = hasModules
    ? questions.filter(q => q.category === modules[currentModule])
    : questions;

  const totalAnswered = Object.keys(answers).length;
  const progress = (totalAnswered / questions.length) * 100;

  const LikertQuestion = ({ question }) => {
    const options = question.options || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
    const currentValue = answers[question.id];

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4 mb-5">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-md">
            A{question.id}
          </span>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-lg leading-relaxed">{question.question}</p>
            {question.required && <span className="text-red-500 text-sm font-medium">* Required</span>}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mt-4">
          {options.map((option, idx) => {
            const numericValue = idx + 1; // 1-5
            const isSelected = currentValue === numericValue;

            return (
              <button
                key={option}
                type="button"
                onClick={() => handleLikertAnswer(question.id, numericValue)}
                className={`p-4 rounded-xl text-center transition-all duration-200 ${isSelected
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-indigo-300'
                  }`}
              >
                <div className={`text-2xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {numericValue}
                </div>
                <div className="text-xs leading-tight">{option}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const GenericQuestion = ({ question }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium flex items-center justify-center">
          {question.id}
        </span>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{question.question}</p>
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </div>
      </div>

      {question.type === 'single_choice' && (
        <div className="space-y-2">
          {question.options?.map(option => (
            <label
              key={option}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[question.id] === option
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}
            >
              <input type="radio" name={question.id} value={option} checked={answers[question.id] === option}
                onChange={() => handleAnswer(question.id, option)} className="sr-only" />
              <span className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${answers[question.id] === option ? 'border-indigo-500' : 'border-gray-300'
                }`}>
                {answers[question.id] === option && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
              </span>
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.options?.map(option => {
            const selected = (answers[question.id] || []).includes(option);
            return (
              <label key={option} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}>
                <input type="checkbox" checked={selected} onChange={() => handleMultiSelect(question.id, option)} className="sr-only" />
                <span className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                  }`}>
                  {selected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>}
                </span>
                <span className="text-gray-700">{option}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'text' && (
        <textarea value={answers[question.id] || ''} onChange={(e) => handleAnswer(question.id, e.target.value)}
          placeholder="Type your answer here..." rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-50" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">VCPQ Assessment</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{questionnaire.name}</h1>
          {questionnaire.description && <p className="text-gray-600 mt-2 max-w-xl mx-auto">{questionnaire.description}</p>}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">{totalAnswered} of {questions.length} answered</span>
            <span className="font-semibold text-indigo-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Module Navigation */}
        {hasModules && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentModule(Math.max(0, currentModule - 1))}
                disabled={currentModule === 0}
                className={`p-2 rounded-xl transition-all ${currentModule === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-lg">Module: {modules[currentModule]}</p>
                <p className="text-sm text-gray-500">{currentModule + 1} of {modules.length}</p>
              </div>
              <button
                onClick={() => setCurrentModule(Math.min(modules.length - 1, currentModule + 1))}
                disabled={currentModule === modules.length - 1}
                className={`p-2 rounded-xl transition-all ${currentModule === modules.length - 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Respondent Info */}
        {!questionnaire.is_anonymous && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Your Information (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={respondentInfo.name}
                  onChange={(e) => setRespondentInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={respondentInfo.email}
                  onChange={(e) => setRespondentInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role/Title</label>
                <input
                  type="text"
                  value={respondentInfo.role}
                  onChange={(e) => setRespondentInfo(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Product Manager"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <input
                  type="text"
                  value={respondentInfo.department}
                  onChange={(e) => setRespondentInfo(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., Engineering"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {currentModuleQuestions.map(question =>
            question.type === 'likert'
              ? <LikertQuestion key={question.id} question={question} />
              : <GenericQuestion key={question.id} question={question} />
          )}
        </div>

        {/* Submit/Next Button */}
        {hasModules && currentModule < modules.length - 1 ? (
          <div className="mt-8">
            <button
              onClick={() => setCurrentModule(currentModule + 1)}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
            >
              Next Module: {modules[currentModule + 1]} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</> : 'Submit Response'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">Your responses will be used for VCPQ vector analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireResponsePage;