import { createClient } from '@supabase/supabase-js';

// Fallback values for local client-side preview without breaking the build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Custom hook or helper to simulate real-time subscriptions in our prototype.
 * Uses a simple event bus mechanism to emulate real-time queue updates.
 */
type ChannelCallback = (payload: any) => void;

class RealtimeMockBus {
  private listeners: Record<string, ChannelCallback[]> = {};

  subscribe(channel: string, callback: ChannelCallback) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);
    
    return {
      unsubscribe: () => {
        this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
      }
    };
  }

  broadcast(channel: string, payload: any) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach(callback => {
        try {
          callback(payload);
        } catch (e) {
          console.error('Error executing real-time listener:', e);
        }
      });
    }
  }
}

export const mockRealtimeBus = new RealtimeMockBus();
export const QUEUE_CHANNEL = 'clinic-queue-channel';
export const NOTIFICATION_CHANNEL = 'clinic-notification-channel';
