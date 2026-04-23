import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Sparkles,
  Check,
  Building2,
  User,
  Briefcase,
  MapPin,
  GraduationCap
} from 'lucide-react';
import VCPQQuestionnaire from '../components/VCPQQuestionnaire';
import PersonaVectorVisualization from '../components/PersonaVectorVisualization';

// Domain options
const DOMAINS = [
  { id: 'general', name: 'General / Cross-Functional', description: 'Standard professional vocabulary' },
  { id: 'engineering', name: 'Engineering / IT', description: 'Technical jargon, data-driven communication' },
  { id: 'legal', name: 'Legal / Compliance', description: 'Risk-averse, formal documentation style' },
  { id: 'executive', name: 'Executive Leadership', description: 'Strategic, high-level communication' },
  { id: 'hr', name: 'HR / Operations', description: 'Supportive, people-focused language' }
];

// Experience levels
const EXPERIENCE_LEVELS = [
  'Entry-level',
  'Junior',
  'Mid-level',
  'Senior',
  'Lead',
  'Director',
  'VP',
  'C-level'
];

export default function VCPQPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionnaireId = searchParams.get('questionnaire');

  const [step, setStep] = useState('demographics'); // demographics, questionnaire, result
  const [domain, setDomain] = useState('general');
  const [demographics, setDemographics] = useState({
    name: '',
    job_title: '',
    department: '',
    region: '',
    experience_level: 'Mid-level'
  });
  const [generatedPersona, setGeneratedPersona] = useState(null);

  const handleDemographicsSubmit = (e) => {
    e.preventDefault();
    setStep('questionnaire');
  };

  const handleQuestionnaireComplete = (persona) => {
    setGeneratedPersona(persona);
    setStep('result');
  };

  const handleStartOver = () => {
    setStep('demographics');
    setGeneratedPersona(null);
    setDemographics({
      name: '',
      job_title: '',
      department: '',
      region: '',
      experience_level: 'Mid-level'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                VCPQ Persona Generator
              </h1>
              <p className="text-sm text-gray-500">
                Vectorizable Corporate Persona Questionnaire
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-4 mb-8">
          {['Demographics', 'Assessment', 'Result'].map((label, idx) => {
            const stepKeys = ['demographics', 'questionnaire', 'result'];
            const currentIdx = stepKeys.indexOf(step);
            const isComplete = idx < currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <React.Fragment key={label}>
                {idx > 0 && (
                  <div className={`w-12 h-0.5 ${isComplete ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                )}
                <div className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isComplete ? 'bg-indigo-600 text-white' :
                      isCurrent ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600' :
                      'bg-gray-100 text-gray-400'}
                  `}>
                    {isComplete ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-sm ${isCurrent ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        {step === 'demographics' && (
          <DemographicsStep
            domain={domain}
            setDomain={setDomain}
            demographics={demographics}
            setDemographics={setDemographics}
            onSubmit={handleDemographicsSubmit}
          />
        )}

        {step === 'questionnaire' && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
            <VCPQQuestionnaire
              demographics={demographics}
              domain={domain}
              onComplete={handleQuestionnaireComplete}
              onCancel={() => setStep('demographics')}
            />
          </div>
        )}

        {step === 'result' && generatedPersona && (
          <ResultStep
            persona={generatedPersona}
            onStartOver={handleStartOver}
            onNavigateToPersona={() => navigate(`/personas/${generatedPersona.id}`)}
          />
        )}
      </div>
    </div>
  );
}

// Demographics Step Component
function DemographicsStep({ domain, setDomain, demographics, setDemographics, onSubmit }) {
  const updateField = (field, value) => {
    setDemographics(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
        {/* Domain Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Building2 className="w-4 h-4 inline-block mr-2" />
            Domain Context
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Select the professional domain for vocabulary and communication style.
          </p>
          <div className="grid gap-3">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDomain(d.id)}
                className={`
                  p-4 rounded-xl text-left transition-all border-2
                  ${domain === d.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'}
                `}
              >
                <div className="font-medium text-gray-900">{d.name}</div>
                <div className="text-sm text-gray-500">{d.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Demographics */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Optional: Pre-fill Demographics
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Leave blank to auto-generate based on assessment results.
          </p>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                <User className="w-4 h-4 inline-block mr-1" />
                Name
              </label>
              <input
                type="text"
                value={demographics.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <Briefcase className="w-4 h-4 inline-block mr-1" />
                  Job Title
                </label>
                <input
                  type="text"
                  value={demographics.job_title}
                  onChange={(e) => updateField('job_title', e.target.value)}
                  placeholder="e.g., Senior Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={demographics.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="e.g., Product Development"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4 inline-block mr-1" />
                  Region
                </label>
                <input
                  type="text"
                  value={demographics.region}
                  onChange={(e) => updateField('region', e.target.value)}
                  placeholder="e.g., North America"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <GraduationCap className="w-4 h-4 inline-block mr-1" />
                  Experience Level
                </label>
                <select
                  value={demographics.experience_level}
                  onChange={(e) => updateField('experience_level', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          Start Assessment
        </button>
      </div>
    </form>
  );
}

// Result Step Component
function ResultStep({ persona, onStartOver, onNavigateToPersona }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Persona Generated Successfully!</h2>
        <p className="text-green-100">
          Your VCPQ-based persona is ready for interaction.
        </p>
      </div>

      {/* Persona Summary */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {persona.name?.charAt(0) || 'P'}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{persona.name}</h3>
            <p className="text-gray-600">{persona.demographics?.job_title}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {persona.demographics?.department}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {persona.domain_context}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {persona.demographics?.experience_level}
              </span>
            </div>
          </div>
        </div>

        {/* Background */}
        {persona.background && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Background</h4>
            <p className="text-gray-600">{persona.background}</p>
          </div>
        )}

        {/* Personality Vectors */}
        <PersonaVectorVisualization
          vectors={persona.personality_vectors}
          profile={persona.vector_profile}
          showDetails={true}
        />

        {/* Applied Rules */}
        {persona.applied_rules?.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Active Behavioral Rules</h4>
            <div className="flex flex-wrap gap-2">
              {persona.applied_rules.map((rule) => (
                <span 
                  key={rule}
                  className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                >
                  {rule.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onStartOver}
          className="flex-1 py-3 px-6 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
        >
          Create Another Persona
        </button>
        {persona.id && (
          <button
            onClick={onNavigateToPersona}
            className="flex-1 py-3 px-6 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all"
          >
            Chat with {persona.name}
          </button>
        )}
      </div>
    </div>
  );
}
