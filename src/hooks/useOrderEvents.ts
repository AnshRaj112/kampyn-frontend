"use client";

import { useEffect, useRef } from "react";

type EventCallback = (data: unknown) => void;

/**
 * Custom hook to listen for vendor-specific order events via SSE.
 * 
 * @param vendorId - The ID of the vendor to listen for.
 * @param eventListeners - A map of event names to callback functions.
 */
export const useOrderEvents = (
  vendorId: string | null | undefined,
  eventListeners: Record<string, EventCallback>
) => {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!vendorId || typeof window === "undefined") return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    // Use the existing vendor notification stream URL
    const url = `${backendUrl}/api/vendor/notifications/stream`;
    
    console.log(`SSE: Connecting to ${backendUrl}/api/vendor/notifications/stream...`);
    const es = new EventSource(url, { withCredentials: true });
    
    es.onopen = () => {
      console.log("SSE: Connection established successfully.");
    };
    eventSourceRef.current = es;

    // Register all provided listeners
    Object.entries(eventListeners).forEach(([eventName, callback]) => {
      // Standard EventSource 'message' event or custom events
      es.addEventListener(eventName, (event: MessageEvent) => {
        try {
          const data = event.data ? JSON.parse(event.data) : null;
          callback(data);
        } catch {
          callback(event.data);
        }
      });
    });

    // Also listen for generic message events if any
    es.onmessage = (event: MessageEvent) => {
      if (eventListeners['message']) {
        try {
          const data = event.data ? JSON.parse(event.data) : null;
          eventListeners['message'](data);
        } catch {
          eventListeners['message'](event.data);
        }
      }
    };

    es.onerror = (err) => {
      console.error("SSE Connection Error:", err);
      // EventSource will automatically attempt to reconnect
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [vendorId, eventListeners]);
};
