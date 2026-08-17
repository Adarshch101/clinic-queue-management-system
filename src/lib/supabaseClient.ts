import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Fallback values for local client-side preview without breaking the build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const QUEUE_CHANNEL = 'clinic-queue-channel';
export const NOTIFICATION_CHANNEL = 'clinic-notification-channel';

type ChannelCallback = (payload: Record<string, unknown>) => void;

/**
 * Real-time wrapper over Supabase Realtime broadcast channels.
 * (Replaces the previous in-memory event-bus mock.)
 */
export const realtimeBus = {
  subscribe(channel: string, callback: ChannelCallback) {
    const realChannel: RealtimeChannel = supabase.channel(channel);

    realChannel
      .on('broadcast', { event: 'message' }, (payload) => {
        try {
          callback(payload.payload);
        } catch (e) {
          console.error('Error executing real-time listener:', e);
        }
      })
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(realChannel);
      }
    };
  },

  async broadcast(channel: string, payload: Record<string, unknown>) {
    await supabase.channel(channel).send({
      type: 'broadcast',
      event: 'message',
      payload,
    });
  }
};