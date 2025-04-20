// src/components/ai/MallyAI.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  Send,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Brain,
  Mic,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEventType } from "@/lib/stores/types";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import dayjs from "dayjs";
import "../../styles/ai-animations.css";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  attachments?: {
    type: "event" | "events" | "conflict";
    data: any;
  }[];
}

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Hi, I'm Mally AI! I can help you schedule and manage events. How can I assist you today?",
    sender: "ai",
    timestamp: new Date(),
  },
];

interface MallyAIProps {
  onScheduleEvent?: (event: any) => Promise<any>;
  initialPrompt?: string;
  preventOpenOnClick?: boolean;
}

// Helper functions
const formatDateForDisplay = (dateStr: string, includeYear = false) => {
  const date = dayjs(dateStr);
  if (date.isSame(dayjs(), "day")) {
    return "Today";
  } else if (date.isSame(dayjs().add(1, "day"), "day")) {
    return "Tomorrow";
  } else {
    return includeYear
      ? date.format("ddd, MMM D, YYYY")
      : date.format("ddd, MMM D");
  }
};

const formatTimeRange = (startTime: string, endTime: string) => {
  return `${dayjs(startTime).format("h:mm A")} - ${dayjs(endTime).format(
    "h:mm A"
  )}`;
};

const MallyAI: React.FC<MallyAIProps> = ({
  onScheduleEvent,
  initialPrompt,
  preventOpenOnClick = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState(initialPrompt || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarView, setIsSidebarView] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [particles, setParticles] = useState<
    { x: number; y: number; size: number; life: number }[]
  >([]);
  const [showEntranceAnimation, setShowEntranceAnimation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isButtonRecording, setIsButtonRecording] = useState(false);
  const [showEventConfirmation, setShowEventConfirmation] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<CalendarEventType[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { addEvent, updateEvent, removeEvent } = useCalendarEvents();
  const { user } = useAuth();
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  // Create particles at random intervals
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (chatContainerRef.current) {
        const containerRect = chatContainerRef.current.getBoundingClientRect();
        const x = Math.random() * containerRect.width;
        const y = Math.random() * containerRect.height;
        const size = Math.random() * 8 + 2;
        const life = Math.random() * 2000 + 1000;

        setParticles((prev) => [...prev, { x, y, size, life }]);

        // Clean up old particles
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.x !== x || p.y !== y));
        }, life);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (initialPrompt) {
      setIsOpen(true);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleAI = () => {
    // Don't toggle if we're coming from a drag operation
    if (preventOpenOnClick) return;

    setShowEntranceAnimation(true);
    setIsOpen(!isOpen);

    // Reset entrance animation flag after animation completes
    if (!isOpen) {
      setTimeout(() => {
        setShowEntranceAnimation(false);
      }, 500);
    }
  };

  // Start recording when holding the button
  const startButtonRecording = () => {
    buttonPressTimerRef.current = setTimeout(() => {
      setIsButtonRecording(true);
      startRecording();
    }, 500); // Start recording after 500ms hold
  };

  // Stop recording when releasing the button
  const stopButtonRecording = () => {
    if (buttonPressTimerRef.current) {
      clearTimeout(buttonPressTimerRef.current);
      buttonPressTimerRef.current = null;
    }

    if (isButtonRecording) {
      stopRecording();
      setIsButtonRecording(false);

      // Open the chat if it's not already open
      if (!isOpen) {
        setShowEntranceAnimation(true);
        setIsOpen(true);
        setTimeout(() => {
          setShowEntranceAnimation(false);
        }, 500);
      }
    } else {
      // If it was a quick click, just toggle the AI
      toggleAI();
    }
  };

  const addUserMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    return userMessage.id;
  };

  const addAIMessage = (
    text: string,
    isLoading = false,
    isError = false,
    attachments?: Message["attachments"]
  ) => {
    const aiMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "ai",
      timestamp: new Date(),
      isLoading,
      isError,
      attachments,
    };

    setMessages((prev) => [...prev, aiMessage]);
    return aiMessage.id;
  };

  const updateAIMessage = (
    id: string,
    text: string,
    isLoading = false,
    isError = false,
    attachments?: Message["attachments"]
  ) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id
          ? { ...message, text, isLoading, isError, attachments }
          : message
      )
    );
  };

  const createSendRipple = (x: number, y: number) => {
    const ripple = document.createElement("div");
    ripple.className = "send-ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);

    // Remove the ripple after animation completes
    setTimeout(() => {
      ripple.remove();
    }, 1000);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessageId = addUserMessage(messageText);
    setInput("");
    const aiMessageId = addAIMessage("Thinking...", true);
    setIsProcessing(true);

    try {
      console.log("Calling Supabase edge function: process-scheduling");

      const currentEvents = await fetchEvents();

      // Get chat history for context (last 10 messages, excluding the "Thinking..." message)
      const chatHistory = messages
        .filter((m) => !m.isLoading)
        .slice(-10)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const response = await supabase.functions.invoke("process-scheduling", {
        body: {
          text: messageText,
          messages: chatHistory,
          events: currentEvents,
          userId: user?.id,
        },
      });

      console.log("Edge function response:", response);

      if (response.error) {
        console.error("Edge function error:", response.error);
        throw Error(response.error.message || "Failed to get AI response");
      }

      const data = response.data;

      if (
        !data ||
        (!data.response && !data.error && !data.message && !data.event)
      ) {
        console.error("Invalid response from edge function:", data);
        throw Error("Received an invalid response from the AI service");
      }

      if (data.error) {
        console.error("AI processing error:", data.error);
        throw Error(data.error);
      }

      // Process the response from the LLM
      const aiResponse =
        data.response || data.message || "I processed your request.";

      // Check for event attachments
      let attachments: Message["attachments"] = undefined;

      // Add event to attachments if present
      if (data.event) {
        attachments = [{ type: "event", data: data.event }];
        if (!data.events) {
          data.events = [data.event];
        }
      }

      // Add multiple events to attachments if present
      if (data.events && data.events.length > 0) {
        attachments = [{ type: "events", data: data.events }];
        setPendingEvents(data.events);
        setShowEventConfirmation(true);
      }

      // Add conflicts to attachments if present
      if (data.conflicts) {
        attachments = [
          {
            type: "conflict",
            data: { conflicts: data.conflicts, suggestions: data.suggestions },
          },
        ];
        setConflictData({
          conflicts: data.conflicts,
          suggestions: data.suggestions,
        });
        setShowConflicts(true);
      }

      // Update the AI message with the response and attachments
      updateAIMessage(aiMessageId, aiResponse, false, false, attachments);

      // If there's a direct event update or deletion, process it immediately
      if (data.processedEvent) {
        await processEventUpdate(data.processedEvent);
      }

      // Reset retry count on successful request
      retryCountRef.current = 0;
    } catch (error: any) {
      console.error("Error processing AI request:", error);

      // Retry logic for edge function failures
      if (retryCountRef.current < 2) {
        retryCountRef.current += 1;
        updateAIMessage(
          aiMessageId,
          `I'm having trouble connecting. Retrying... (${retryCountRef.current}/2)`,
          true,
          false
        );

        setTimeout(() => {
          handleSendMessage(messageText);
        }, 1500);
        return;
      }

      updateAIMessage(
        aiMessageId,
        `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again later.`,
        false,
        true
      );

      // Reset retry count after failing all retries
      retryCountRef.current = 0;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle event updates or deletion
  const processEventUpdate = async (eventData: any) => {
    try {
      if (eventData._action === "delete") {
        const response = await removeEvent(eventData.id);
        if (response.success) {
          toast.success(
            `Event "${eventData.title || "Unnamed event"}" has been deleted`
          );
        } else {
          toast.error(
            `Failed to delete event: ${response.error || "Unknown error"}`
          );
        }
      } else if (eventData.id) {
        const startTime = dayjs(eventData.startsAt).format("HH:mm");
        const endTime = dayjs(eventData.endsAt).format("HH:mm");
        const eventDescription =
          eventData.description ||
          `${startTime} - ${endTime} | ${eventData.title || ""}`;

        const eventToUpdate: CalendarEventType = {
          id: eventData.id,
          title: eventData.title,
          description: eventDescription,
          startsAt: eventData.startsAt,
          endsAt: eventData.endsAt,
          date: dayjs(eventData.startsAt).format("YYYY-MM-DD"),
          color: eventData.color || "bg-purple-500/70",
          isLocked: eventData.isLocked || false,
          isTodo: eventData.isTodo || false,
          hasAlarm: eventData.hasAlarm || false,
          hasReminder: eventData.hasReminder || false,
        };

        const response = await updateEvent(eventToUpdate);
        if (response.success) {
          toast.success(`Event "${eventToUpdate.title}" has been updated`);
        } else {
          toast.error(
            `Failed to update event: ${response.error || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      console.error("Error processing event update:", error);
      toast.error("Failed to process calendar update");
    }
  };

  // Process event creation from AI response
  const processEventCreation = async (events: CalendarEventType[]) => {
    console.log("Processing events:", events);

    let successCount = 0;
    let errorCount = 0;

    for (const eventData of events) {
      try {
        // Ensure required fields are present
        const startsAt = eventData.startsAt || dayjs().toISOString();
        const endsAt =
          eventData.endsAt || dayjs(startsAt).add(1, "hour").toISOString();
        const eventDate = dayjs(startsAt).format("YYYY-MM-DD");

        // Format time strings
        const startTime = dayjs(startsAt).format("HH:mm");
        const endTime = dayjs(endsAt).format("HH:mm");
        const description =
          eventData.description ||
          `${startTime} - ${endTime} | ${eventData.title}`;

        // Create the event object
        const formattedEvent: CalendarEventType = {
          id: eventData.id || crypto.randomUUID(),
          title: eventData.title,
          description: description,
          startsAt: startsAt,
          endsAt: endsAt,
          date: eventDate,
          color: eventData.color || "bg-purple-500/70",
          isLocked: eventData.isLocked || false,
          isTodo: eventData.isTodo || false,
          hasAlarm: eventData.hasAlarm || false,
          hasReminder: eventData.hasReminder || false,
          todoId: eventData.todoId,
        };

        // Add the event
        let result;
        if (onScheduleEvent) {
          console.log(
            "Using onScheduleEvent callback for event:",
            formattedEvent
          );
          result = await onScheduleEvent(formattedEvent);
        } else {
          console.log("Using addEvent hook directly");
          result = await addEvent(formattedEvent);
        }

        console.log("Result from event creation:", result);

        if (result && result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(
            "Failed to schedule event:",
            result?.error || "unknown error"
          );
        }
      } catch (err) {
        errorCount++;
        console.error("Error processing AI-created event:", err);
      }
    }

    // Show toast based on results
    if (successCount > 0 && errorCount === 0) {
      toast.success(
        `Successfully scheduled ${successCount} ${
          successCount === 1 ? "event" : "events"
        }`
      );
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(
        `Scheduled ${successCount} ${
          successCount === 1 ? "event" : "events"
        }, but failed to schedule ${errorCount}`
      );
    } else if (errorCount > 0) {
      toast.error(
        `Failed to schedule ${errorCount} ${
          errorCount === 1 ? "event" : "events"
        }`
      );
    }

    // Reset UI state
    setShowEventConfirmation(false);
    setPendingEvents([]);
  };

  const fetchEvents = async () => {
    try {
      if (!user) return [];

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching events for AI context:", error);
      return [];
    }
  };

  const sendMessage = () => {
    if (isProcessing) return;

    const messageToSend = input.trim();

    if (messageToSend) {
      // Create send ripple effect
      if (chatContainerRef.current) {
        const rect = chatContainerRef.current.getBoundingClientRect();
        createSendRipple(rect.right - 30, rect.bottom - 30);
      }

      handleSendMessage(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSidebarView = () => {
    setIsSidebarView(!isSidebarView);
  };

  // Speech to text functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          await transcribeAudio(audioBlob);
        }
      });

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 10 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 10000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];

        if (!base64Audio) {
          throw new Error("Failed to convert audio to base64");
        }

        const response = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const { text } = response.data;

        if (text && text.trim()) {
          setInput(text);
          // Don't automatically send - let the user review first
          toast.success("Speech transcribed!");
        } else {
          toast.error("No speech detected");
        }
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error(
        `Transcription error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Event Confirmation Component
  const EventConfirmation = () => {
    if (!showEventConfirmation || pendingEvents.length === 0) return null;

    return (
      <div className="absolute inset-x-4 bottom-16 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-primary/30 shadow-lg z-50">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <Calendar className="h-4 w-4 mr-1 text-primary" />
          Confirm{" "}
          {pendingEvents.length > 1
            ? `${pendingEvents.length} Events`
            : "Event"}
        </h4>

        <div className="max-h-40 overflow-y-auto mb-2">
          {pendingEvents.map((event, index) => (
            <div
              key={index}
              className="bg-white/10 p-2 rounded-md mb-1 text-xs"
            >
              <div className="font-medium">{event.title}</div>
              <div className="flex items-center text-white/70">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDateForDisplay(event.startsAt)}
              </div>
              <div className="flex items-center text-white/70">
                <Clock className="h-3 w-3 mr-1" />
                {formatTimeRange(event.startsAt, event.endsAt)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => {
              setShowEventConfirmation(false);
              setPendingEvents([]);
            }}
            className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() => processEventCreation(pendingEvents)}
            className="px-3 py-1 rounded-md bg-primary hover:bg-primary/80 text-xs"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  };

  // Conflict Resolution Component
  const ConflictResolution = () => {
    if (!showConflicts || !conflictData) return null;

    return (
      <div className="absolute inset-x-4 bottom-16 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-red-500/30 shadow-lg z-50">
        <h4 className="text-sm font-medium mb-2 flex items-center text-red-400">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Scheduling Conflict
        </h4>

        <div className="max-h-40 overflow-y-auto mb-2">
          <div className="bg-red-500/20 p-2 rounded-md mb-2 text-xs">
            <h5 className="font-medium mb-1">Conflicts Found:</h5>
            {conflictData.conflicts.map((conflict: any, index: number) => (
              <div key={index} className="mb-1 text-white/80">
                <div>{conflict.title}</div>
                <div className="text-white/60">
                  {formatDateForDisplay(conflict.startsAt)}{" "}
                  {formatTimeRange(conflict.startsAt, conflict.endsAt)}
                </div>
              </div>
            ))}
          </div>

          {conflictData.suggestions && conflictData.suggestions.length > 0 && (
            <div className="bg-green-500/20 p-2 rounded-md text-xs">
              <h5 className="font-medium mb-1">Suggested Alternatives:</h5>
              {conflictData.suggestions.map(
                (suggestion: any, index: number) => (
                  <div key={index} className="mb-1 text-white/80">
                    <button
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-left w-full"
                      onClick={() => {
                        if (suggestion.time) {
                          const date = dayjs(suggestion.time).format(
                            "YYYY-MM-DD"
                          );
                          const startTime = dayjs(suggestion.time).format(
                            "h:mm A"
                          );
                          handleSendMessage(
                            `Schedule for ${date} at ${startTime}`
                          );
                          setShowConflicts(false);
                          setConflictData(null);
                        }
                      }}
                    >
                      {suggestion.day
                        ? `${suggestion.day} at ${suggestion.time}`
                        : `${formatDateForDisplay(suggestion.time)} at ${dayjs(
                            suggestion.time
                          ).format("h:mm A")}`}
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setShowConflicts(false);
            setConflictData(null);
          }}
          className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs w-full"
        >
          Dismiss
        </button>
      </div>
    );
  };

  // Event Attachment Component
  const EventAttachment = ({
    event,
    showDetails = true,
  }: {
    event: any;
    showDetails?: boolean;
  }) => {
    return (
      <div className="bg-primary/20 p-2 rounded-md mt-1 text-xs flex items-start">
        <Calendar className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-primary" />
        <div className="flex-1">
          <div className="font-medium">{event.title}</div>
          {showDetails && (
            <>
              <div className="text-white/70">
                {formatDateForDisplay(event.startsAt, true)}
              </div>
              <div className="text-white/70">
                {formatTimeRange(event.startsAt, event.endsAt)}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render message attachments
  const renderAttachments = (attachments?: Message["attachments"]) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-2">
        {attachments.map((attachment, index) => {
          if (attachment.type === "event") {
            return <EventAttachment key={index} event={attachment.data} />;
          } else if (
            attachment.type === "events" &&
            Array.isArray(attachment.data)
          ) {
            return (
              <div key={index}>
                <div className="mb-1 text-xs font-medium text-white/70 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  {attachment.data.length > 1
                    ? `${attachment.data.length} events proposed`
                    : "1 event proposed"}
                </div>
                {attachment.data.slice(0, 3).map((event, idx) => (
                  <EventAttachment key={`event-${idx}`} event={event} />
                ))}
                {attachment.data.length > 3 && (
                  <div className="text-xs text-white/50 mt-1 text-center">
                    +{attachment.data.length - 3} more events
                  </div>
                )}
              </div>
            );
          } else if (attachment.type === "conflict") {
            return (
              <div
                key={index}
                className="bg-red-500/20 p-2 rounded-md mt-1 text-xs"
              >
                <div className="font-medium flex items-center text-red-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Scheduling Conflict Detected
                </div>
                <div className="mt-1 text-white/70">
                  Found {attachment.data.conflicts.length} conflicting{" "}
                  {attachment.data.conflicts.length === 1 ? "event" : "events"}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="typing-indicator">
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
    </div>
  );

  // Handle edge cases
  if (!isOpen) {
    return (
      <div
        className="fixed z-50 flex items-center justify-center shadow-lg hover:shadow-xl transition-all ai-button"
        style={{
          bottom: "6rem",
          right: "2rem",
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          backgroundColor: "rgba(139, 92, 246, 0.8)",
          animation: "floatButton 2s ease-in-out infinite",
        }}
        onClick={toggleAI}
        onMouseDown={startButtonRecording}
        onMouseUp={stopButtonRecording}
        onTouchStart={startButtonRecording}
        onTouchEnd={stopButtonRecording}
      >
        <Sparkles
          size={16}
          className="absolute text-white/50 animate-sparkle"
          style={{ top: "8px", right: "8px" }}
        />
        {isButtonRecording ? (
          <div className="relative">
            <Mic size={24} className="text-white animate-pulse" />
            <div className="mic-wave absolute -inset-4"></div>
          </div>
        ) : (
          <Bot size={24} className="text-white" />
        )}
      </div>
    );
  }

  return (
    <>
      <div
        ref={chatContainerRef}
        className={`ai-chat-container ${
          isExpanded ? "w-96 h-[500px]" : "w-80 h-[400px]"
        } 
                  ${
                    isSidebarView
                      ? "fixed left-[400px] bottom-0 rounded-none h-[calc(100vh-64px)] w-96"
                      : "fixed bottom-20 right-8 z-50 rounded-lg shadow-xl"
                  } 
                  flex flex-col transition-all duration-300 bg-gradient-to-br from-purple-900/90 to-indigo-900/90 text-white border border-purple-500/20
                  ${showEntranceAnimation ? "ai-chat-enter" : ""} glow-border`}
      >
        {/* Floating particles */}
        {particles.map((particle, index) => (
          <div
            key={index}
            className="particle"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: 0.6,
            }}
          />
        ))}

        <div className="flex justify-between items-center p-3 border-b border-white/10 backdrop-blur-sm">
          <div className="flex items-center">
            <Bot size={20} className="text-primary animate-pulse mr-2" />
            <h3 className="font-semibold">Mally AI</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleSidebarView}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              {isSidebarView ? (
                <ArrowRight size={14} />
              ) : (
                <ArrowLeft size={14} />
              )}
            </button>
            <button
              onClick={toggleExpand}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              {isExpanded ? <ArrowUpRight size={14} /> : <Plus size={14} />}
            </button>
            <button
              onClick={toggleAI}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mb-3 p-3">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`mb-3 ${
                message.sender === "user" ? "ml-auto" : "mr-auto"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`p-2 rounded-lg max-w-[85%] message-in ${
                  message.sender === "user"
                    ? "bg-primary/30 ml-auto"
                    : message.isError
                    ? "bg-red-500/30 mr-auto"
                    : "bg-secondary mr-auto"
                } ${message.isLoading ? "animate-pulse" : ""}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-sm">{message.text}</p>
                {message.isLoading && (
                  <div className="flex justify-center mt-1">
                    {isProcessing ? (
                      <TypingIndicator />
                    ) : (
                      <Loader2
                        size={16}
                        className="animate-spin text-white/70"
                      />
                    )}
                  </div>
                )}

                {/* Render any attachments */}
                {renderAttachments(message.attachments)}
              </div>
              <div
                className={`text-xs opacity-70 mt-1 ${
                  message.sender === "user" ? "text-right" : ""
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {isProcessing && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <Brain size={80} className="text-purple-400/10 brain-pulse" />
          </div>
        )}

        {/* Event Confirmation UI */}
        <EventConfirmation />

        {/* Conflict Resolution UI */}
        <ConflictResolution />

        <div className="flex items-center p-3 border-t border-white/10 backdrop-blur-sm relative z-10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Mally AI..."
            className="glass-input w-full resize-none bg-white/10 transition-all focus:bg-white/20 rounded-md p-2"
            rows={1}
            disabled={isProcessing}
          />
          <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`ml-2 p-2 rounded-full ${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-white/10 hover:bg-white/20"
            } transition-all`}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            <Mic
              size={16}
              className={`${isRecording ? "animate-pulse" : ""}`}
            />
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isProcessing}
            className="ml-2 p-2 rounded-full bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default MallyAI;
