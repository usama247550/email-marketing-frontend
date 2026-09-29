'use client';

import { useState, useEffect } from 'react';
import { PROJECTS, type ProjectId } from '@/lib/mockData';
import Topbar from '@/components/dashboard/Topbar';

// Mock settings data for each project
interface ProjectSettings {
  // Project Details
  projectName: string;
  senderEmail: string;
  senderName: string;
  niche: string;
  websiteUrl: string;
  // SMTP Settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
}

const MOCK_SETTINGS: Record<ProjectId, ProjectSettings> = {
  all: {
    projectName: 'All Projects',
    senderEmail: '',
    senderName: '',
    niche: '',
    websiteUrl: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: '',
    smtpPassword: '',
  },
  arswift: {
    projectName: 'Arswift',
    senderEmail: 'hello@arswift.com',
    senderName: 'ArSwift Team',
    niche: 'Email Marketing',
    websiteUrl: 'https://arswift.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: 'hello@arswift.com',
    smtpPassword: '••••••••••••',
  },
  goldsilver: {
    projectName: 'Goldsilver.de',
    senderEmail: 'info@goldsilver.de',
    senderName: 'Goldsilver Team',
    niche: 'Precious Metals',
    websiteUrl: 'https://goldsilver.de',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: 'info@goldsilver.de',
    smtpPassword: '••••••••••••',
  },
  anticellulite: {
    projectName: 'Cellulite-Anticellulite',
    senderEmail: 'support@anticellulite.com',
    senderName: 'AntiCellulite Support',
    niche: 'Health & Beauty',
    websiteUrl: 'https://anticellulite.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: 'support@anticellulite.com',
    smtpPassword: '••••••••••••',
  },
};
// Mock project list for management
interface ProjectListItem {
  id: string;
  name: string;
  senderEmail: string;
}

const INITIAL_PROJECT_LIST: ProjectListItem[] = [
  { id: 'arswift', name: 'Arswift', senderEmail: 'hello@arswift.com' },
  { id: 'goldsilver', name: 'Goldsilver.de', senderEmail: 'info@goldsilver.de' },
  { id: 'anticellulite', name: 'Cellulite-Anticellulite', senderEmail: 'support@anticellulite.com' },
];

type FormMode = 'edit' | 'create';

export default function SettingsPage() {
  const [selectedProject, setSelectedProject] = useState<ProjectId>('arswift');
  const [projectList, setProjectList] = useState<ProjectListItem[]>(INITIAL_PROJECT_LIST);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('edit');
  
  // Single form state
  const [formData, setFormData] = useState<ProjectSettings>({
    projectName: '',
    senderEmail: '',
    senderName: '',
    niche: '',
    websiteUrl: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: '',
    smtpPassword: '',
  });

  // Load project data into form when selected project changes or mode changes
  useEffect(() => {
    if (formMode === 'edit') {
      const currentSettings = MOCK_SETTINGS[selectedProject];
      setFormData(currentSettings);
    }
  }, [selectedProject, formMode]);

  const handleProjectChange = (projectId: ProjectId) => {
    setSelectedProject(projectId);
    if (formMode === 'edit') {
      const settings = MOCK_SETTINGS[projectId];
      setFormData(settings);
    }
  };

  const handleAddNewProject = () => {
    setFormMode('create');
    setFormData({
      projectName: '',
      senderEmail: '',
      senderName: '',
      niche: '',
      websiteUrl: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpUser: '',
      smtpPassword: '',
    });
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormMode('edit');
    const currentSettings = MOCK_SETTINGS[selectedProject];
    setFormData(currentSettings);
  };
  const handleCreateProject = () => {
    if (!formData.projectName || !formData.senderEmail) return;
    
    const id = formData.projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newProject = {
      id,
      name: formData.projectName,
      senderEmail: formData.senderEmail,
    };
    
    // Add to project list
    setProjectList([...projectList, newProject]);
    
    // Add to mock settings (would be API call in real app)
    MOCK_SETTINGS[id as ProjectId] = { ...formData };
    
    // Switch to the new project and edit mode
    setSelectedProject(id as ProjectId);
    setFormMode('edit');
  };

  const handleSaveChanges = () => {
    if (!formData.projectName || !formData.senderEmail) return;
    
    // Update mock settings (would be API call in real app)
    MOCK_SETTINGS[selectedProject] = { ...formData };
    
    // Update project list if name or email changed
    setProjectList(projectList.map(p => 
      p.id === selectedProject 
        ? { ...p, name: formData.projectName, senderEmail: formData.senderEmail }
        : p
    ));
  };

  const handleEditProject = (project: ProjectListItem) => {
    // Switch to this project and edit mode
    setSelectedProject(project.id as ProjectId);
    setFormMode('edit');
    
    // Load project data
    const settings = MOCK_SETTINGS[project.id as ProjectId] || MOCK_SETTINGS.all;
    setFormData(settings);
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = (id: string) => {
    const updatedList = projectList.filter(p => p.id !== id);
    setProjectList(updatedList);
    
    // If deleting the currently selected project, switch to first remaining project
    if (selectedProject === id && updatedList.length > 0) {
      const firstProject = updatedList[0];
      setSelectedProject(firstProject.id as ProjectId);
      setFormMode('edit');
      const settings = MOCK_SETTINGS[firstProject.id as ProjectId] || MOCK_SETTINGS.all;
      setFormData(settings);
    }
    
    setShowDeleteConfirm(null);
  };
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <Topbar selectedProject={selectedProject} onProjectChange={handleProjectChange} />
      
      <div className="flex-1 px-7 py-6">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Settings</h1>
            <p className="text-sm text-gray-500">Configure your email and sending preferences.</p>
          </div>

          {/* Single Unified Form */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {formMode === 'edit' ? 'Edit Project' : 'Create New Project'}
              </h2>
              {formMode === 'edit' && (
                <button
                  onClick={handleAddNewProject}
                  className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add New Project
                </button>
              )}
            </div>

            {/* Project Details Section */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                    placeholder="e.g. Restaurant Outreach"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.senderEmail}
                    onChange={(e) => setFormData({...formData, senderEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                    placeholder="e.g. hello@restaurant.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sender Name</label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({...formData, senderName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
                  <input
                    type="text"
                    value={formData.niche}
                    onChange={(e) => setFormData({...formData, niche: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                    placeholder="e.g. Fine Dining"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
            {/* SMTP Settings Section */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">SMTP Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={formData.smtpHost}
                    onChange={(e) => setFormData({...formData, smtpHost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({...formData, smtpPort: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP User</label>
                  <input
                    type="text"
                    value={formData.smtpUser}
                    onChange={(e) => setFormData({...formData, smtpUser: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                    placeholder="user@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData({...formData, smtpPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                      placeholder="App Password / SMTP Password"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              {formMode === 'edit' ? (
                <button
                  onClick={handleSaveChanges}
                  className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCreateProject}
                    className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Create Project
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          {/* All Projects List */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Projects</h3>
            <div className="space-y-3">
              {projectList.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>Email: {project.senderEmail}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditProject(project)}
                      className="text-gray-400 hover:text-accent text-sm font-medium px-3 py-1 rounded-lg hover:bg-accent-light transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(project.id)}
                      className="text-gray-400 hover:text-red-600 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Are you sure you want to delete this project? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeleteProject(showDeleteConfirm)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}