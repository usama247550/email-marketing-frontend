'use client';

import { useState, useEffect } from 'react';
import { Project, getProjects, createProject, updateProject, deleteProject } from '@/lib/api';
import Topbar from '@/components/dashboard/Topbar';

type FormMode = 'edit' | 'create';

export default function SettingsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('edit');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Single form state
  const [formData, setFormData] = useState({
    name: '',
    senderEmail: '',
    senderName: '',
    niche: '',
    websiteUrl: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: '',
    smtpPassword: '',
  });

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load project data into form when selected project changes or mode changes
  useEffect(() => {
    if (formMode === 'edit' && selectedProject && projects.length > 0) {
      const project = projects.find(p => p._id === selectedProject);
      if (project) {
        setFormData({
          name: project.name,
          senderEmail: project.senderEmail,
          senderName: project.senderName || '',
          niche: project.niche || '',
          websiteUrl: project.websiteUrl || '',
          smtpHost: project.smtpHost,
          smtpPort: project.smtpPort,
          smtpUser: project.smtpUser || '',
          smtpPassword: project.smtpPassword || '',
        });
      }
    }
  }, [selectedProject, formMode, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await getProjects();
      setProjects(projectsData);
      
      // Auto-select first project if available and none selected
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0]._id);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleAddNewProject = () => {
    setFormMode('create');
    setFormData({
      name: '',
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
    if (selectedProject && projects.length > 0) {
      const project = projects.find(p => p._id === selectedProject);
      if (project) {
        setFormData({
          name: project.name,
          senderEmail: project.senderEmail,
          senderName: project.senderName || '',
          niche: project.niche || '',
          websiteUrl: project.websiteUrl || '',
          smtpHost: project.smtpHost,
          smtpPort: project.smtpPort,
          smtpUser: project.smtpUser || '',
          smtpPassword: project.smtpPassword || '',
        });
      }
    }
  };
  const handleCreateProject = async () => {
    if (!formData.name || !formData.senderEmail) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const newProject = await createProject(formData);
      
      // Refresh the projects list
      await loadProjects();
      
      // Switch to the new project and edit mode
      setSelectedProject(newProject._id);
      setFormMode('edit');
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!formData.name || !formData.senderEmail || !selectedProject) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await updateProject(selectedProject, formData);
      
      // Refresh the projects list
      await loadProjects();
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProject = (project: Project) => {
    // Switch to this project and edit mode
    setSelectedProject(project._id);
    setFormMode('edit');
    
    // Load project data
    setFormData({
      name: project.name,
      senderEmail: project.senderEmail,
      senderName: project.senderName || '',
      niche: project.niche || '',
      websiteUrl: project.websiteUrl || '',
      smtpHost: project.smtpHost,
      smtpPort: project.smtpPort,
      smtpUser: project.smtpUser || '',
      smtpPassword: project.smtpPassword || '',
    });
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = async (id: string) => {
    try {
      setError(null);
      await deleteProject(id);
      
      // Refresh the projects list
      await loadProjects();
      
      // If deleting the currently selected project, switch to first remaining project
      if (selectedProject === id && projects.length > 1) {
        const remaining = projects.filter(p => p._id !== id);
        if (remaining.length > 0) {
          setSelectedProject(remaining[0]._id);
        } else {
          setSelectedProject('');
        }
      }
      
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
      setShowDeleteConfirm(null);
    }
  };
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <Topbar selectedProject={selectedProject as any} onProjectChange={(id) => handleProjectChange(id as string)} />
      
      <div className="flex-1 px-7 py-6">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Settings</h1>
            <p className="text-sm text-gray-500">Configure your email and sending preferences.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

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
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                    placeholder="e.g. Restaurant Outreach"
                    disabled={saving}
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
                    disabled={saving}
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
                    disabled={saving}
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
                    disabled={saving}
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
                    disabled={saving}
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
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({...formData, smtpPort: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                    disabled={saving}
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
                    disabled={saving}
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
                      disabled={saving}
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
                  disabled={saving || !formData.name || !formData.senderEmail}
                  className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCreateProject}
                    disabled={saving || !formData.name || !formData.senderEmail}
                    className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    {saving ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects found. Create your first project above.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        <span>Email: {project.senderEmail}</span>
                        {project.niche && <span className="ml-4">Niche: {project.niche}</span>}
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
                        onClick={() => setShowDeleteConfirm(project._id)}
                        className="text-gray-400 hover:text-red-600 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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