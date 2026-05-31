import { useState, useCallback, useRef } from "react";

export const useVoiceInput = (onCommandRecognized, lang = "en-US") => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);

    const startListening = useCallback(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError("Voice recognition not supported in this browser.");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = lang;
            recognition.continuous = true; // Stay active
            recognition.interimResults = true;

            recognition.onstart = () => {
                setIsListening(true);
                setIsVoiceActive(true);
                setError(null);
            };

            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const result = event.results[current];
                const text = result[0].transcript.toLowerCase().trim();
                setTranscript(text);

                if (result.isFinal) {
                    console.log("Speech Final Result:", text);

                    // Frontend Patterns
                    if (text.includes("close voice command popup")) {
                        setShowPopup(false);
                        setTranscript("");
                        return;
                    }
                    if (text.includes("open voice command popup")) {
                        setShowPopup(true);
                        setTranscript("");
                        return;
                    }
                    if (text.includes("deactivate voice command")) {
                        stopListening();
                        return;
                    }

                    // Otherwise, it's a game move
                    setIsProcessing(true);
                    onCommandRecognized(text);

                    // Reset transcript for next chunk
                    setTimeout(() => {
                        setTranscript("");
                        setIsProcessing(false);
                    }, 1500);
                }
            };

            recognition.onerror = (event) => {
                if (event.error === "aborted") return;
                console.error("Speech Recognition Error:", event.error);
                setError(`Error: ${event.error}`);
            };

            recognition.onend = () => {
                // Auto-restart if we haven't manually stopped it
                if (recognitionRef.current && isVoiceActive) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.log("Restart failed", e);
                    }
                } else {
                    setIsListening(false);
                    setIsVoiceActive(false);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
            setShowPopup(true); // Open popup on first trigger
        } catch (e) {
            setError("Failed to initialize voice recognition.");
            console.error(e);
        }
    }, [onCommandRecognized, isVoiceActive, lang]);

    const stopListening = useCallback(() => {
        setIsVoiceActive(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
        setIsProcessing(false);
        setShowPopup(false);
        setError(null);
    }, []);

    const setProcessingState = (state) => setIsProcessing(state);
    const setExternalError = (err) => {
        setError(err);
        setIsProcessing(false);
        setIsListening(false);
    };

    return {
        isListening,
        isProcessing,
        isVoiceActive,
        showPopup,
        setShowPopup,
        transcript,
        error,
        startListening,
        stopListening,
        setProcessingState,
        setExternalError,
    };
};
