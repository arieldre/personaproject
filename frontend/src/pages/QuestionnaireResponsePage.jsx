import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionnairesAPI } from '../services/api';
import { Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const QuestionnaireResponsePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [respondentInfo, setRespondentInfo] = useState({ email: '', name: '' });

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

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelect = (questionId, option) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter((o) => o !== option) };
      }
      return { ...prev, [questionId]: [...current, option] };
    });
  };

  const handleSubmit = async () => {
    // Validate required questions
    const unanswered = questionnaire.questions
      .filter((q) => q.required && !answers[q.id])
      .map((q) => q.question);

    if (unanswered.length > 0) {
      toast.error(`Please answer all required questions`);
      return;
    }

    setSubmitting(true);
    try {
      await questionnairesAPI.submitResponse(questionnaire.id, {
        answers,
        respondentEmail: respondentInfo.email || undefined,
        respondentName: respondentInfo.name || undefined,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Questionnaire Not Found
          </h1>
          <p className="text-gray-600">
            This questionnaire may have been closed or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You!
          </h1>
          <p className="text-gray-600 mb-6">
            Your response has been submitted successfully. Your input will help us
            understand your team better.
          </p>
          <div className="card p-6 bg-primary-50 border-primary-100">
            <Sparkles className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <p className="text-primary-800">
              Your answers will be used to generate AI personas that help improve
              team communication and understanding.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const questions = questionnaire.questions || [];
  const progress = (Object.keys(answers).length / questions.length) * 100;

  const QuestionCard = ({ question, index }) => {
    const isActive = currentQuestion === index;

    return (
      <div
        className={`card p-6 transition-all ${
          isActive ? 'ring-2 ring-primary-500' : ''
        }`}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-medium flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            {question.category && (
              <span className="text-xs text-gray-500 mt-1 block">
                Category: {question.category}
              </span>
            )}
          </div>
        </div>

        {/* Single choice */}
        {question.type === 'single_choice' && (
          <div className="space-y-2 ml-11">
            {question.options?.map((option) => (
              <label
                key={option}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  answers[question.id] === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => handleAnswer(question.id, option)}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    answers[question.id] === option
                      ? 'border-primary-500'
                      : 'border-gray-300'
                  }`}
                >
                  {answers[question.id] === option && (
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </span>
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Multiple choice */}
        {question.type === 'multiple_choice' && (
          <div className="space-y-2 ml-11">
            {question.options?.map((option) => {
              const selected = (answers[question.id] || []).includes(option);
              return (
                <label
                  key={option}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    selected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleMultiSelect(question.id, option)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                      selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}
                  >
                    {selected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Text input */}
        {question.type === 'text' && (
          <div className="ml-11">
            <textarea
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder="Type your answer here..."
              rows={4}
              className="input resize-none"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Persona</span>
          </div>
          <p className="text-sm text-gray-500 mb-2">{questionnaire.companyName}</p>
          <h1 className="text-2xl font-bold text-gray-900">{questionnaire.name}</h1>
          {questionnaire.description && (
            <p className="text-gray-600 mt-2">{questionnaire.description}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Respondent info (if not anonymous) */}
        {!questionnaire.isAnonymous && (
          <div className="card p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Your Information (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={respondentInfo.name}
                  onChange={(e) =>
                    setRespondentInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Your name"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={respondentInfo.email}
                  onChange={(e) =>
                    setRespondentInfo((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="your@email.com"
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </div>

        {/* Submit button */}
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full py-4 text-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Response'
            )}
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            Your responses will be kept confidential and used only for creating team personas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireResponsePage;
