import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';

// Team member roles based on medical hierarchy
export type TeamRole =
  | 'attending'
  | 'senior_resident' // PGY-2/3
  | 'intern' // PGY-1
  | 'medical_student';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  pagerNumber?: string;
  email?: string;
  isActive: boolean;
  color?: string; // For badge color coding
}

export interface TeamRoster {
  id: string;
  weekOf: string; // ISO date string for week start
  attending: TeamMember | null;
  seniorResident: TeamMember | null;
  interns: TeamMember[]; // Up to 2
  medicalStudents: TeamMember[]; // Up to 4
  createdAt: number;
  updatedAt: number;
}

export interface ScratchpadNote {
  id: string;
  content: string;
  category: 'reminder' | 'task' | 'note';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  expiresAt?: number; // Optional expiry for weekly reminders
}

interface TeamContextType {
  // Current team roster
  currentRoster: TeamRoster | null;
  allRosters: TeamRoster[];

  // Team member management
  addTeamMember: (member: Omit<TeamMember, 'id'>) => TeamMember;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;

  // Roster management
  createRoster: (weekOf: string) => TeamRoster;
  updateRoster: (updates: Partial<TeamRoster>) => void;
  switchRoster: (id: string) => void;

  // Team assignment helpers
  getTeamMembersByRole: (role: TeamRole) => TeamMember[];
  getAllActiveMembers: () => TeamMember[];
  assignMemberToRoster: (memberId: string, role: TeamRole) => void;

  // Scratchpad
  scratchpadNotes: ScratchpadNote[];
  addNote: (note: Omit<ScratchpadNote, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, updates: Partial<ScratchpadNote>) => void;
  deleteNote: (id: string) => void;

  // All known team members (for autocomplete)
  teamMemberDirectory: TeamMember[];
}

const ROLE_COLORS: Record<TeamRole, string> = {
  attending: '#3B82F6', // Blue
  senior_resident: '#8B5CF6', // Purple
  intern: '#10B981', // Green
  medical_student: '#F59E0B', // Amber
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const TeamContext = createContext<TeamContextType>({} as TeamContextType);

export const useTeam = () => useContext(TeamContext);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load team member directory from localStorage
  const [teamMemberDirectory, setTeamMemberDirectory] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('superscribe_team_directory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load rosters from localStorage
  const [allRosters, setAllRosters] = useState<TeamRoster[]>(() => {
    try {
      const saved = localStorage.getItem('superscribe_rosters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentRosterId, setCurrentRosterId] = useState<string | null>(() => {
    return localStorage.getItem('superscribe_current_roster_id') || null;
  });

  // Load scratchpad notes
  const [scratchpadNotes, setScratchpadNotes] = useState<ScratchpadNote[]>(() => {
    try {
      const saved = localStorage.getItem('superscribe_scratchpad');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('superscribe_team_directory', JSON.stringify(teamMemberDirectory));
  }, [teamMemberDirectory]);

  useEffect(() => {
    localStorage.setItem('superscribe_rosters', JSON.stringify(allRosters));
  }, [allRosters]);

  useEffect(() => {
    if (currentRosterId) {
      localStorage.setItem('superscribe_current_roster_id', currentRosterId);
    }
  }, [currentRosterId]);

  useEffect(() => {
    localStorage.setItem('superscribe_scratchpad', JSON.stringify(scratchpadNotes));
  }, [scratchpadNotes]);

  // Current roster derived state
  const currentRoster = useMemo(() => {
    if (!currentRosterId) return null;
    return allRosters.find(r => r.id === currentRosterId) || null;
  }, [allRosters, currentRosterId]);

  // Team member management
  const addTeamMember = useCallback((member: Omit<TeamMember, 'id'>): TeamMember => {
    const newMember: TeamMember = {
      ...member,
      id: generateId(),
      color: member.color || ROLE_COLORS[member.role],
    };
    setTeamMemberDirectory(prev => [...prev, newMember]);
    return newMember;
  }, []);

  const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    setTeamMemberDirectory(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
    // Also update in current roster if present
    setAllRosters(prev =>
      prev.map(roster => {
        const updated = { ...roster };
        if (updated.attending?.id === id) {
          updated.attending = { ...updated.attending, ...updates };
        }
        if (updated.seniorResident?.id === id) {
          updated.seniorResident = { ...updated.seniorResident, ...updates };
        }
        updated.interns = updated.interns.map(i => (i.id === id ? { ...i, ...updates } : i));
        updated.medicalStudents = updated.medicalStudents.map(s =>
          s.id === id ? { ...s, ...updates } : s
        );
        return updated;
      })
    );
  }, []);

  const removeTeamMember = useCallback((id: string) => {
    setTeamMemberDirectory(prev => prev.filter(m => m.id !== id));
  }, []);

  // Roster management
  const createRoster = useCallback((weekOf: string): TeamRoster => {
    const newRoster: TeamRoster = {
      id: generateId(),
      weekOf,
      attending: null,
      seniorResident: null,
      interns: [],
      medicalStudents: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setAllRosters(prev => [...prev, newRoster]);
    setCurrentRosterId(newRoster.id);
    return newRoster;
  }, []);

  const updateRoster = useCallback(
    (updates: Partial<TeamRoster>) => {
      if (!currentRosterId) return;
      setAllRosters(prev =>
        prev.map(r => (r.id === currentRosterId ? { ...r, ...updates, updatedAt: Date.now() } : r))
      );
    },
    [currentRosterId]
  );

  const switchRoster = useCallback((id: string) => {
    setCurrentRosterId(id);
  }, []);

  // Team assignment helpers
  const getTeamMembersByRole = useCallback(
    (role: TeamRole): TeamMember[] => {
      return teamMemberDirectory.filter(m => m.role === role && m.isActive);
    },
    [teamMemberDirectory]
  );

  const getAllActiveMembers = useCallback((): TeamMember[] => {
    return teamMemberDirectory.filter(m => m.isActive);
  }, [teamMemberDirectory]);

  const assignMemberToRoster = useCallback(
    (memberId: string, role: TeamRole) => {
      const member = teamMemberDirectory.find(m => m.id === memberId);
      if (!member || !currentRosterId) return;

      setAllRosters(prev =>
        prev.map(r => {
          if (r.id !== currentRosterId) return r;
          const updated = { ...r, updatedAt: Date.now() };

          switch (role) {
            case 'attending':
              updated.attending = member;
              break;
            case 'senior_resident':
              updated.seniorResident = member;
              break;
            case 'intern':
              if (updated.interns.length < 2) {
                updated.interns = [...updated.interns, member];
              }
              break;
            case 'medical_student':
              if (updated.medicalStudents.length < 4) {
                updated.medicalStudents = [...updated.medicalStudents, member];
              }
              break;
          }
          return updated;
        })
      );
    },
    [teamMemberDirectory, currentRosterId]
  );

  // Scratchpad management
  const addNote = useCallback((note: Omit<ScratchpadNote, 'id' | 'createdAt'>) => {
    const newNote: ScratchpadNote = {
      ...note,
      id: generateId(),
      createdAt: Date.now(),
    };
    setScratchpadNotes(prev => [...prev, newNote]);
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<ScratchpadNote>) => {
    setScratchpadNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setScratchpadNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      currentRoster,
      allRosters,
      addTeamMember,
      updateTeamMember,
      removeTeamMember,
      createRoster,
      updateRoster,
      switchRoster,
      getTeamMembersByRole,
      getAllActiveMembers,
      assignMemberToRoster,
      scratchpadNotes,
      addNote,
      updateNote,
      deleteNote,
      teamMemberDirectory,
    }),
    [
      currentRoster,
      allRosters,
      addTeamMember,
      updateTeamMember,
      removeTeamMember,
      createRoster,
      updateRoster,
      switchRoster,
      getTeamMembersByRole,
      getAllActiveMembers,
      assignMemberToRoster,
      scratchpadNotes,
      addNote,
      updateNote,
      deleteNote,
      teamMemberDirectory,
    ]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};
