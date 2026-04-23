import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { questionnairesAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const QuestionnaireCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      isAnonymous: false,
    },
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await questionnairesAPI.getTemplates();
        setTemplates(response.data.templates);
        // Select default template
        const defaultTemplate = response.data.templates.find(t => t.is_default);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const addCustomQuestion = () => {
    setCustomQuestions([
      ...customQuestions,
      {
        id: `custom_${Date.now()}`,
        question: '',
        type: 'single_choice',
        options: ['Option 1', 'Option 2'],
        required: true,
        category: 'custom',
      },
    ]);
  };

  const updateCustomQuestion = (index, updates) => {
    setCustomQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, ...updates } : q)
    );
  };

  const removeCustomQuestion = (index) => {
    setCustomQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex) => {
    setCustomQuestions(prev =>
      prev.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] }
          : q
      )
    );
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setCustomQuestions(prev =>
      prev.map((q, i) => 
        i === questionIndex
          ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) }
          : q
      )
    );
  };

  const removeOption = (questionIndex, optionIndex) => {
    setCustomQuestions(prev =>
      prev.map((q, i) => 
        i === questionIndex
          ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
          : q
      )
    );
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await questionnairesAPI.create({
        name: data.name,
        description: data.description,
        templateId: selectedTemplate,
        customQuestions: customQuestions.filter(q => q.question.trim()),
        isAnonymous: data.isAnonymous,
        companyId: user?.company?.id,
      });

      toast.success('Questionnaire created!');
      navigate(`/questionnaires/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create questionnaire');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/questionnaires"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Questionnaire</h1>
          <p className="text-gray-600 mt-1">
            Set up a new questionnaire to gather team insights
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="label">Questionnaire Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g., Team Communication Survey"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...register('description')}
              className="input"
              rows={3}
              placeholder="Describe the purpose of this questionnaire..."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register('isAnonymous')}
              id="isAnonymous"
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="isAnonymous" className="text-sm text-gray-700">
              Make responses anonymous (respondent info won't be collected)
            </label>
          </div>
        </div>

        {/* Template selection */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Question Template</h2>
          <p className="text-sm text-gray-500">
            Choose a template to start with pre-defined questions
          </p>

          <div className="space-y-2">
            {templates.map((template) => (
              <label
                key={template.id}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={selectedTemplate === template.id}
                  onChange={() => setSelectedTemplate(template.id)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {template.name}
                    {template.is_default && (
                      <span className="ml-2 badge-primary">Default</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {template.description} • {template.question_count} questions
                  </p>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedTemplate === template.id
                      ? 'border-primary-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedTemplate === template.id && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                  )}
                </span>
              </label>
            ))}

            <label
              className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                selectedTemplate === null
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="template"
                value=""
                checked={selectedTemplate === null}
                onChange={() => setSelectedTemplate(null)}
                className="sr-only"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">No template</p>
                <p className="text-sm text-gray-500">
                  Start from scratch with only your custom questions
                </p>
              </div>
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTemplate === null
                    ? 'border-primary-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedTemplate === null && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                )}
              </span>
            </label>
          </div>
        </div>

        {/* Custom questions */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Custom Questions</h2>
              <p className="text-sm text-gray-500">
                Add additional questions specific to your needs
              </p>
            </div>
            <button
              type="button"
              onClick={addCustomQuestion}
              className="btn-outline btn-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Question
            </button>
          </div>

          {customQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No custom questions added yet
            </div>
          ) : (
            <div className="space-y-4">
              {customQuestions.map((question, qIndex) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-medium flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCustomQuestion(qIndex)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="label">Question *</label>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateCustomQuestion(qIndex, { question: e.target.value })}
                      className="input"
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Type</label>
                      <select
                        value={question.type}
                        onChange={(e) => updateCustomQuestion(qIndex, { type: e.target.value })}
                        className="input"
                      >
                        <option value="single_choice">Single Choice</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="text">Text</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateCustomQuestion(qIndex, { required: e.target.checked })}
                          className="w-4 h-4 text-primary-600 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Required</span>
                      </label>
                    </div>
                  </div>

                  {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                    <div>
                      <label className="label">Options</label>
                      <div className="space-y-2">
                        {question.options?.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              className="input flex-1"
                              placeholder={`Option ${oIndex + 1}`}
                            />
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIndex, oIndex)}
                                className="p-2 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(qIndex)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          + Add option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/questionnaires" className="btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Questionnaire'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireCreatePage;
