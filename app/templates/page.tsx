'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Topbar from '@/components/dashboard/Topbar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string; // stored as HTML from contentEditable
  lastEdited: string; // ISO date string
}

interface Variable {
  id: string;
  tag: string;       // e.g. {{companyName}}
  label: string;     // e.g. Company Name
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Wellness Outreach',
    subject: 'Website Anfrage für {{companyName}}',
    body: '<p>Hallo {{firstName}},</p><p>Ich habe Ihre Website gefunden und finde Ihr Angebot sehr interessant. Wir würden gerne mehr über Ihre Dienstleistungen erfahren.</p><p>Mit freundlichen Grüßen,<br>{{senderName}}</p>',
    lastEdited: '2024-03-15',
  },
  {
    id: '2',
    name: 'Cold Intro – Tech',
    subject: 'Quick question about {{companyName}}',
    body: '<p>Hi {{firstName}},</p><p>I came across {{companyName}} while researching companies in {{city}} and I\'d love to connect. We help businesses like yours grow their customer base through targeted outreach.</p><p>Would you be open to a quick 15-minute call?</p><p>Best,<br>{{senderName}}</p>',
    lastEdited: '2024-03-13',
  },
  {
    id: '3',
    name: 'Follow-Up #1',
    subject: 'Following up — {{companyName}}',
    body: '<p>Hi {{firstName}},</p><p>I wanted to follow up on my previous email. I noticed you visited our website at {{website}} — happy to answer any questions you might have.</p><p>Looking forward to hearing from you,<br>{{senderName}}</p>',
    lastEdited: '2024-03-10',
  },
  {
    id: '4',
    name: 'Restaurant Partnership',
    subject: 'Partnering with {{companyName}} 🍽️',
    body: '<p>Hallo {{firstName}},</p><p>Ihr Restaurant in {{city}} hat mich wirklich beeindruckt. Ich würde gerne eine mögliche Zusammenarbeit besprechen.</p><p>Können wir kurz telefonieren?</p><p>Viele Grüße,<br>{{senderName}}</p>',
    lastEdited: '2024-03-08',
  },
  {
    id: '5',
    name: 'Re-engagement',
    subject: "It's been a while, {{firstName}}",
    body: "<p>Hey {{firstName}},</p><p>It's been a few weeks since we last spoke about {{companyName}}. I wanted to check in and see if now might be a better time to connect.</p><p>We've helped dozens of companies in {{city}} achieve real results — I'd love to share some case studies.</p><p>Cheers,<br>{{senderName}}</p>",
    lastEdited: '2024-03-05',
  },
  {
    id: '6',
    name: 'Agency Pitch',
    subject: 'Growing {{companyName}} with better email marketing',
    body: '<p>Hi {{firstName}},</p><p>I\'m reaching out because I believe we can help {{companyName}} generate more leads and revenue through targeted email campaigns.</p><p>Feel free to check us out at {{website}}. Let me know if you\'d like a free audit!</p><p>Best regards,<br>{{senderName}}</p>',
    lastEdited: '2024-03-01',
  },
];

const INITIAL_VARIABLES: Variable[] = [
  { id: 'v1', tag: '{{companyName}}', label: 'Company Name' },
  { id: 'v2', tag: '{{firstName}}',   label: 'First Name'   },
  { id: 'v3', tag: '{{city}}',        label: 'City'         },
  { id: 'v4', tag: '{{website}}',     label: 'Website'      },
  { id: 'v5', tag: '{{email}}',       label: 'Email'        },
  { id: 'v6', tag: '{{senderName}}',  label: 'Your Name'    },
];

// ─── Small shared components ──────────────────────────────────────────────────

function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // prevent editor losing focus
        onClick();
      }}
      className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors text-xs font-medium"
    >
      {children}
    </button>
  );
}

// ─── Rich-text editor ─────────────────────────────────────────────────────────

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

function RichEditor({ value, onChange, editorRef }: RichEditorProps) {
  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // Seed initial HTML only on first mount
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current && editorRef.current) {
      editorRef.current.innerHTML = value;
      seeded.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolbarBtn title="Bold" onClick={() => exec('bold')}>
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn title="Italic" onClick={() => exec('italic')}>
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn title="Underline" onClick={() => exec('underline')}>
          <span style={{ textDecoration: 'underline' }}>U</span>
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn title="Unordered list" onClick={() => exec('insertUnorderedList')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Ordered list" onClick={() => exec('insertOrderedList')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" stroke="currentColor" strokeWidth="1.5" /><path d="M4 10h2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn title="Align left" onClick={() => exec('justifyLeft')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Align center" onClick={() => exec('justifyCenter')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn title="Remove formatting" onClick={() => exec('removeFormat')}>
          <span className="text-[10px] font-bold tracking-tighter">A/</span>
        </ToolbarBtn>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        className="min-h-[200px] px-3 py-2.5 text-sm text-gray-800 leading-relaxed focus:outline-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
      />
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  templateName,
  onConfirm,
  onCancel,
}: {
  templateName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <IconTrash />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Delete template?</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-700">"{templateName}"</span> will be permanently deleted. This action cannot be undone.
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({
  subject,
  body,
  onClose,
}: {
  subject: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-700">
            <IconEye />
            <span className="text-sm font-semibold">Email Preview</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Email chrome */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Email header bar */}
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 space-y-1.5">
              <div className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 w-14 shrink-0">From:</span>
                <span className="text-gray-700">ArSwift &lt;noreply@arswift.com&gt;</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 w-14 shrink-0">Subject:</span>
                <span className="font-medium text-gray-900">{subject || <span className="text-gray-400 italic">No subject</span>}</span>
              </div>
            </div>
            {/* Email body */}
            <div
              className="p-5 text-sm text-gray-800 leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3"
              dangerouslySetInnerHTML={{ __html: body || '<p class="text-gray-400 italic">No body content.</p>' }}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function TemplatesPage() {
  // ── view state
  const [view, setView] = useState<'list' | 'composer'>('list');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null); // null = new

  // ── templates list state
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  // ── composer form state
  const [formName,    setFormName]    = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody,    setFormBody]    = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // ── variables state
  const [variables,        setVariables]        = useState<Variable[]>(INITIAL_VARIABLES);
  const [showNewVarInput,  setShowNewVarInput]  = useState(false);
  const [newVarName,       setNewVarName]       = useState('');

  // ── preview state
  const [showPreview, setShowPreview] = useState(false);

  // ── helpers ────────────────────────────────────────────────────────────────

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const openComposer = useCallback((template: Template | null) => {
    setEditingTemplate(template);
    const name    = template?.name    ?? '';
    const subject = template?.subject ?? '';
    const body    = template?.body    ?? '';
    setFormName(name);
    setFormSubject(subject);
    setFormBody(body);
    // Reset editor seed flag so the new body is injected on mount
    if (editorRef.current) {
      editorRef.current.innerHTML = body;
    }
    setView('composer');
  }, []);

  const handleSave = () => {
    if (!formName.trim()) return;

    const now = new Date().toISOString().split('T')[0];

    if (editingTemplate) {
      // Update existing
      setTemplates(prev =>
        prev.map(t =>
          t.id === editingTemplate.id
            ? { ...t, name: formName, subject: formSubject, body: formBody, lastEdited: now }
            : t
        )
      );
    } else {
      // Create new
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: formName,
        subject: formSubject,
        body: formBody,
        lastEdited: now,
      };
      setTemplates(prev => [newTemplate, ...prev]);
    }

    setView('list');
  };

  const handleDelete = (template: Template) => setDeleteTarget(template);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // ── variable insertion ─────────────────────────────────────────────────────

  const insertVariable = (tag: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Check the selected range is inside the editor
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(document.createTextNode(tag));
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        // Cursor outside editor — append to end
        editor.innerHTML += tag;
      }
    } else {
      editor.innerHTML += tag;
    }
    setFormBody(editor.innerHTML);
  };

  const handleAddVariable = () => {
    const raw = newVarName.trim();
    if (!raw) return;
    // Sanitise: letters + digits only, camelCase-ish
    const sanitised = raw.replace(/[^a-zA-Z0-9]/g, '');
    if (!sanitised) return;
    const tag = `{{${sanitised}}}`;
    // Avoid duplicates
    if (variables.some(v => v.tag === tag)) {
      setNewVarName('');
      setShowNewVarInput(false);
      return;
    }
    setVariables(prev => [
      ...prev,
      { id: Date.now().toString(), tag, label: raw },
    ]);
    setNewVarName('');
    setShowNewVarInput(false);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      {/* Modals */}
      {deleteTarget && (
        <DeleteConfirmModal
          templateName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {showPreview && (
        <PreviewModal
          subject={formSubject}
          body={formBody}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Top bar */}
      <Topbar selectedProject="all" onProjectChange={() => {}} />

      {/* ── VIEW 1: Templates List ── */}
      {view === 'list' && (
        <div className="flex-1 px-7 py-6 max-w-[1400px] w-full mx-auto space-y-6">
          {/* Heading row */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-sm text-gray-400 mt-0.5">Create and manage your email templates.</p>
            </div>
            <button
              onClick={() => openComposer(null)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0"
            >
              <IconPlus />
              Create New Template
            </button>
          </div>

          {/* Table card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No templates yet</p>
                <p className="text-xs text-gray-400">Click "Create New Template" to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Edited
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {templates.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{tpl.name}</span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <span className="text-sm text-gray-500 truncate block">{tpl.subject}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tpl.lastEdited)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openComposer(tpl)}
                              title="Edit template"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-accent transition-colors"
                            >
                              <IconEdit />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(tpl)}
                              title="Delete template"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            >
                              <IconTrash />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: Template Composer ── */}
      {view === 'composer' && (
        <div className="flex-1 px-7 py-6 max-w-[1400px] w-full mx-auto space-y-5">
          {/* Back + heading */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <IconBack />
              Back
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h1>
              {editingTemplate && (
                <p className="text-sm text-gray-400 mt-0.5">{editingTemplate.name}</p>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
            {/* ── Left: Template Details card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-900">Template Details</h2>

              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wellness Outreach"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Website Anfrage für {{companyName}}"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Body
                </label>
                <RichEditor
                  value={formBody}
                  onChange={setFormBody}
                  editorRef={editorRef}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!formName.trim()}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Template
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg border border-gray-200 transition-colors"
                >
                  <IconEye />
                  Preview
                </button>
              </div>
            </div>

            {/* ── Right: Variables card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Variables</h2>
              <p className="text-xs text-gray-400 -mt-2">
                Click a variable to insert it at your cursor position.
              </p>

              {/* Variable pills */}
              <div className="space-y-1.5">
                {variables.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:border-accent hover:bg-accent/5 transition-all group"
                  >
                    <span className="text-xs font-mono font-medium text-accent group-hover:text-accent">
                      {v.tag}
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Add new variable */}
              {showNewVarInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddVariable();
                      if (e.key === 'Escape') { setShowNewVarInput(false); setNewVarName(''); }
                    }}
                    placeholder="e.g. phoneNumber"
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleAddVariable}
                      className="flex-1 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowNewVarInput(false); setNewVarName(''); }}
                      className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewVarInput(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-accent hover:text-accent transition-colors"
                >
                  <IconPlus />
                  Create New Variable
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
