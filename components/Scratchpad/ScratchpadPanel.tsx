import React, { useState, useContext } from 'react';
import {
  Users,
  StickyNote,
  Plus,
  Trash2,
  User,
  GraduationCap,
  Stethoscope,
  X,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
} from 'lucide-react';
import { useTeam, TeamMember, TeamRole } from '../../contexts/TeamContext';
import { ThemeContext } from '../../contexts/ThemeContext';

interface ScratchpadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; darkColor: string }
> = {
  attending: {
    label: 'Attending',
    icon: Stethoscope,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    darkColor: 'bg-blue-900/40 text-blue-300 border-blue-800',
  },
  senior_resident: {
    label: 'Senior (PGY2/3)',
    icon: User,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    darkColor: 'bg-purple-900/40 text-purple-300 border-purple-800',
  },
  intern: {
    label: 'Intern (PGY1)',
    icon: User,
    color: 'bg-green-100 text-green-700 border-green-200',
    darkColor: 'bg-green-900/40 text-green-300 border-green-800',
  },
  medical_student: {
    label: 'Medical Student',
    icon: GraduationCap,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    darkColor: 'bg-amber-900/40 text-amber-300 border-amber-800',
  },
};

export const ScratchpadPanel: React.FC<ScratchpadPanelProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const {
    currentRoster,
    createRoster,
    updateRoster,
    addTeamMember,
    updateTeamMember,
    scratchpadNotes,
    addNote,
    deleteNote,
  } = useTeam();

  const [isTeamExpanded, setIsTeamExpanded] = useState(true);
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [newNoteDraft, setNewNoteDraft] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Initialize roster if needed
  React.useEffect(() => {
    if (!currentRoster) {
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekOf =
        weekStart.toISOString().split('T')[0] || new Date().toISOString().split('T')[0] || '';
      createRoster(weekOf);
    }
  }, [currentRoster, createRoster]);

  const handleAddTeamMember = (role: TeamRole) => {
    const newMember = addTeamMember({
      name: '',
      role,
      isActive: true,
    });

    // Add to roster
    if (currentRoster) {
      if (role === 'attending') {
        updateRoster({ attending: newMember });
      } else if (role === 'senior_resident') {
        updateRoster({ seniorResident: newMember });
      } else if (role === 'intern') {
        const interns = [...(currentRoster.interns || [])];
        if (interns.length < 2) {
          interns.push(newMember);
          updateRoster({ interns });
        }
      } else if (role === 'medical_student') {
        const students = [...(currentRoster.medicalStudents || [])];
        if (students.length < 4) {
          students.push(newMember);
          updateRoster({ medicalStudents: students });
        }
      }
    }

    setEditingMember(newMember.id);
    setEditingName('');
  };

  const handleSaveMemberName = (member: TeamMember) => {
    updateTeamMember(member.id, { name: editingName });
    setEditingMember(null);
  };

  const handleAddNote = () => {
    if (newNoteDraft.trim()) {
      addNote({
        content: newNoteDraft.trim(),
        category: 'note',
        priority: 'medium',
      });
      setNewNoteDraft('');
    }
  };

  const renderTeamMember = (member: TeamMember | null, role: TeamRole, _index?: number) => {
    if (!member) {
      return (
        <button
          onClick={() => handleAddTeamMember(role)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-colors ${
            isDarkMode
              ? 'border-gray-700 hover:border-gray-600 text-gray-500'
              : 'border-gray-300 hover:border-gray-400 text-gray-400'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add {ROLE_CONFIG[role]?.label || role}</span>
        </button>
      );
    }

    const config = ROLE_CONFIG[role];
    const Icon = config?.icon || User;
    const isEditing = editingMember === member.id;

    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          isDarkMode ? config?.darkColor : config?.color
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              placeholder="Enter name..."
              className={`flex-1 px-2 py-1 rounded text-sm ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveMemberName(member);
                if (e.key === 'Escape') setEditingMember(null);
              }}
            />
            <button onClick={() => handleSaveMemberName(member)} className="p-1 hover:opacity-70">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium truncate">
              {member.name || <span className="italic opacity-50">Unnamed</span>}
            </span>
            <button
              onClick={() => {
                setEditingMember(member.id);
                setEditingName(member.name);
              }}
              className="p-1 hover:opacity-70"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const bgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full max-w-md h-[calc(100vh-2rem)] rounded-xl border shadow-2xl overflow-hidden flex flex-col ${bgClass}`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-[#d97757]" />
            <h2 className={`font-bold ${textClass}`}>Scratchpad</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Team Roster Section */}
          <div
            className={`rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <button
              onClick={() => setIsTeamExpanded(!isTeamExpanded)}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className={`font-semibold ${textClass}`}>My Team This Week</span>
              </div>
              {isTeamExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isTeamExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Attending */}
                <div>
                  <label className={`text-xs font-medium mb-1 block ${mutedClass}`}>
                    Attending
                  </label>
                  {renderTeamMember(currentRoster?.attending || null, 'attending')}
                </div>

                {/* Senior Resident */}
                <div>
                  <label className={`text-xs font-medium mb-1 block ${mutedClass}`}>
                    Senior Resident (PGY-2/3)
                  </label>
                  {renderTeamMember(currentRoster?.seniorResident || null, 'senior_resident')}
                </div>

                {/* Interns */}
                <div>
                  <label className={`text-xs font-medium mb-1 block ${mutedClass}`}>
                    Interns (PGY-1) — up to 2
                  </label>
                  <div className="space-y-2">
                    {(currentRoster?.interns || []).map((intern, i) =>
                      renderTeamMember(intern, 'intern', i)
                    )}
                    {(currentRoster?.interns?.length || 0) < 2 && renderTeamMember(null, 'intern')}
                  </div>
                </div>

                {/* Medical Students */}
                <div>
                  <label className={`text-xs font-medium mb-1 block ${mutedClass}`}>
                    Medical Students — up to 4
                  </label>
                  <div className="space-y-2">
                    {(currentRoster?.medicalStudents || []).map((student, i) =>
                      renderTeamMember(student, 'medical_student', i)
                    )}
                    {(currentRoster?.medicalStudents?.length || 0) < 4 &&
                      renderTeamMember(null, 'medical_student')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div
            className={`rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <button
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-500" />
                <span className={`font-semibold ${textClass}`}>Weekly Notes & Reminders</span>
              </div>
              {isNotesExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isNotesExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Add Note */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteDraft}
                    onChange={e => setNewNoteDraft(e.target.value)}
                    placeholder="Add a note or reminder..."
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    }`}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddNote();
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNoteDraft.trim()}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      newNoteDraft.trim()
                        ? 'bg-[#d97757] text-white hover:bg-[#c66a4d]'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-600'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scratchpadNotes.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${mutedClass}`}>
                      No notes yet. Add reminders, student feedback, or weekly tasks.
                    </p>
                  ) : (
                    scratchpadNotes.map(note => (
                      <div
                        key={note.id}
                        className={`group flex items-start gap-2 px-3 py-2 rounded-lg ${
                          isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                        }`}
                      >
                        <p className={`flex-1 text-sm ${textClass}`}>{note.content}</p>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-600 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
