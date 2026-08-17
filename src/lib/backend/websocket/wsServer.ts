type EventCallback = (data: unknown) => void;

export class RealTimeEventBus {
  private static subscribers = new Map<string, Set<{ event: string; callback: EventCallback }>>();

  static subscribe(clinicId: string, event: string, callback: EventCallback) {
    if (!this.subscribers.has(clinicId)) {
      this.subscribers.set(clinicId, new Set());
    }
    this.subscribers.get(clinicId)!.add({ event, callback });

    return () => {
      const set = this.subscribers.get(clinicId);
      if (set) {
        set.forEach(sub => {
          if (sub.callback === callback && sub.event === event) {
            set.delete(sub);
          }
        });
      }
    };
  }

  static broadcast(clinicId: string, event: string, payload: unknown) {
    console.log(`[RealTime EventBus] Broadcast on channel "${clinicId}": event="${event}"`, payload);
    const set = this.subscribers.get(clinicId);
    if (set) {
      set.forEach(sub => {
        if (sub.event === event || sub.event === '*') {
          try {
            sub.callback(payload);
          } catch (e) {
            console.error('[EventBus Broadcast Callback Error]:', e);
          }
        }
      });
    }
  }
}
