/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SavedDocument } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured. Cloud sync disabled.');
    return null;
  }

  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Database types
export interface DbDocument {
  id: string;
  name: string;
  content: string;
  original_signout: string | null;
  last_modified: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// Sync documents to Supabase
export const syncDocumentsToCloud = async (
  documents: SavedDocument[],
  userId?: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase not configured' };

  try {
    const dbDocs = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      content: doc.content,
      original_signout: doc.originalSignout || null,
      last_modified: new Date(doc.lastModified).toISOString(),
      user_id: userId || null,
    }));

    const { error } = await client.from('documents').upsert(dbDocs, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Cloud sync failed:', err);
    return { success: false, error: err.message };
  }
};

// Fetch documents from Supabase
export const fetchDocumentsFromCloud = async (
  userId?: string
): Promise<{ documents: SavedDocument[]; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { documents: [], error: 'Supabase not configured' };

  try {
    let query = client.from('documents').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('last_modified', { ascending: false });

    if (error) throw error;

    const documents: SavedDocument[] = (data || []).map((doc: DbDocument) => ({
      id: doc.id,
      name: doc.name,
      content: doc.content,
      originalSignout: doc.original_signout || undefined,
      lastModified: new Date(doc.last_modified).getTime(),
    }));

    return { documents };
  } catch (err: any) {
    console.error('Cloud fetch failed:', err);
    return { documents: [], error: err.message };
  }
};

// Delete a document from Supabase
export const deleteDocumentFromCloud = async (
  documentId: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await client.from('documents').delete().eq('id', documentId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Cloud delete failed:', err);
    return { success: false, error: err.message };
  }
};
