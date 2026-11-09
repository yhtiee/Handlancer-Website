import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/app/auth';
import type { EmailPreferences } from '@/lib/app/services/database.types';
import { supabase } from '@/lib/app/services/supabase';

export type EmailSwitch = 'job_alerts' | 'messages' | 'activity';
type Switches = Pick<EmailPreferences, EmailSwitch>;

const key = (userId?: string) => ['email-preferences', userId] as const;
const ALL_ON: Switches = { job_alerts: true, messages: true, activity: true };

export function useEmailPreferences() {
  const userId = useAuth().session?.user.id;
  return useQuery({
    queryKey: key(userId),
    queryFn: async (): Promise<Switches> => {
      const { data, error } = await supabase.from('email_preferences').select('job_alerts, messages, activity').eq('user_id', userId!).maybeSingle();
      if (error) throw error;
      return data ?? ALL_ON;
    },
    enabled: !!userId,
  });
}

export function useUpdateEmailPreferences() {
  const userId = useAuth().session?.user.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (next: Switches) => {
      const { error } = await supabase.from('email_preferences').upsert({ user_id: userId!, ...next, updated_at: new Date().toISOString() });
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => queryClient.setQueryData(key(userId), next),
  });
}

const remindersKey = (userId?: string) => ['application-reminders', userId] as const;

/** Reminders to finish the application. Switched on the application itself: drafts can't reach Settings. */
export function useApplicationReminders() {
  const userId = useAuth().session?.user.id;
  return useQuery({
    queryKey: remindersKey(userId),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.from('email_preferences').select('application_reminders').eq('user_id', userId!).maybeSingle();
      if (error) throw error;
      return data?.application_reminders ?? true;
    },
    enabled: !!userId,
  });
}

export function useSetApplicationReminders() {
  const userId = useAuth().session?.user.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (on: boolean) => {
      const { error } = await supabase.from('email_preferences').upsert({ user_id: userId!, application_reminders: on, updated_at: new Date().toISOString() });
      if (error) throw error;
      return on;
    },
    onSuccess: (on) => queryClient.setQueryData(remindersKey(userId), on),
  });
}
