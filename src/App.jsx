import React, { useState, useEffect } from "react";
import Login from "./Login";
import axios from "axios";
import { jsPDF } from "jspdf";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👩‍⚕️ Hello! I am your Health Assistance Bot. How can I help you today with your health-related concern? I can also book doctor appointments or check bed availability.",
    },
  ]);
  const [input, setInput] = useState("");
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const { transcript, resetTranscript, listening: micListening } = useSpeechRecognition();

  // Dummy data for doctors and bed availability
  const doctors = [
    { id: 1, name: "Dr. John Smith", specialization: "General Physician", availableSlots: ["10:00 AM", "11:00 AM", "2:00 PM"] },
    { id: 2, name: "Dr. Sarah Johnson", specialization: "Cardiologist", availableSlots: ["9:00 AM", "1:00 PM", "3:00 PM"] },
    { id: 3, name: "Dr. Michael Brown", specialization: "Orthopedist", availableSlots: ["11:30 AM", "2:30 PM", "4:00 PM"] },
    { id: 4, name: "Dr. Emily Davis", specialization: "Neurologist", availableSlots: ["10:30 AM", "12:00 PM", "3:30 PM"] },
  ];

  const bedAvailability = {
    generalWard: { total: 50, available: 15 },
    icu: { total: 20, available: 5 },
    privateRoom: { total: 30, available: 8 },
    emergency: { total: 10, available: 3 },
  };

  const [appointments, setAppointments] = useState([]);
  const [bookingStage, setBookingStage] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (!micListening && transcript) {
      setInput(transcript);
    }
  }, [micListening, transcript]);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const speak = (text, index) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingIndex(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingIndex(index);
  };

  const isHealthRelated = (text) => {
    const keywords = [
      "health", "doctor", "medical", "medicine", "treatment", "diagnosis", "hospital", "clinic",
      "fever", "cold", "cough", "headache", "pain", "infection", "symptom", "disease", "flu", "covid",
      "cancer", "asthma", "vomit", "nausea", "diarrhea", "malaria", "dengue", "bp", "blood pressure",
      "diabetes", "tablet", "medication", "antibiotic", "surgery", "injury", "fracture", "strain",
      "stomach", "skin", "rash", "itch", "chest", "body", "wound", "burn", "bone", "muscle", "joint",
      "eye", "ear", "nose", "throat", "leg", "arm", "hand", "back", "neck", "hip", "knee", "shoulder",
      "foot", "feet", "tooth", "teeth", "gum", "spine", "rib", "pelvis", "ankle", "elbow",
      "swelling", "fatigue", "weakness", "urine", "heartbeat", "period", "pregnancy", "mental",
      "stress", "anxiety", "depression", "allergy", "dizzy", "blurred vision", "cramp",
      "appointment", "book", "consult", "bed", "availability", "admission"
    ];
    const lower = text.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword));
  };

  const checkBedAvailability = () => {
    const response = `🏥 Bed Availability Status:
    - General Ward: ${bedAvailability.generalWard.available}/${bedAvailability.generalWard.total} available
    - ICU: ${bedAvailability.icu.available}/${bedAvailability.icu.total} available
    - Private Room: ${bedAvailability.privateRoom.available}/${bedAvailability.privateRoom.total} available
    - Emergency: ${bedAvailability.emergency.available}/${bedAvailability.emergency.total} available`;
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
  };

  const initiateBooking = (symptoms) => {
    // Suggest doctor based on symptoms
    let suggestedDoctor = doctors[0]; // Default to General Physician
    if (symptoms.toLowerCase().includes("heart") || symptoms.toLowerCase().includes("chest")) {
      suggestedDoctor = doctors.find(doc => doc.specialization === "Cardiologist") || doctors[0];
    } else if (symptoms.toLowerCase().includes("bone") || symptoms.toLowerCase().includes("joint")) {
      suggestedDoctor = doctors.find(doc => doc.specialization === "Orthopedist") || doctors[0];
    } else if (symptoms.toLowerCase().includes("headache") || symptoms.toLowerCase().includes("seizure")) {
      suggestedDoctor = doctors.find(doc => doc.specialization === "Neurologist") || doctors[0];
    }

    setSelectedDoctor(suggestedDoctor);
    setBookingStage("selectDoctor");
    const response = `Based on your symptoms, I recommend consulting ${suggestedDoctor.name} (${suggestedDoctor.specialization}). Would you like to:
    1. Book with ${suggestedDoctor.name}
    2. See other available doctors
    3. Cancel booking`;
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
  };

  const handleBookingResponse = (userInput) => {
    if (bookingStage === "selectDoctor") {
      if (userInput.includes("1") || userInput.toLowerCase().includes("book")) {
        setBookingStage("selectSlot");
        const response = `Available slots for ${selectedDoctor.name} today:
        ${selectedDoctor.availableSlots.map((slot, i) => `${i + 1}. ${slot}`).join("\n")}
        Please select a slot number or type "cancel" to abort.`;
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      } else if (userInput.includes("2") || userInput.toLowerCase().includes("other")) {
        const response = `Available doctors:
        ${doctors.map((doc, i) => `${i + 1}. ${doc.name} (${doc.specialization})`).join("\n")}
        Please select a doctor number or type "cancel" to abort.`;
        setBookingStage("chooseOtherDoctor");
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      } else {
        setBookingStage(null);
        setSelectedDoctor(null);
        setMessages((prev) => [...prev, { role: "assistant", content: "Booking cancelled. How else can I assist you?" }]);
      }
    } else if (bookingStage === "chooseOtherDoctor") {
      const choice = parseInt(userInput);
      if (!isNaN(choice) && choice > 0 && choice <= doctors.length) {
        setSelectedDoctor(doctors[choice - 1]);
        setBookingStage("selectSlot");
        const response = `Available slots for ${doctors[choice - 1].name} today:
        ${doctors[choice - 1].availableSlots.map((slot, i) => `${i + 1}. ${slot}`).join("\n")}
        Please select a slot number or type "cancel" to abort.`;
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      } else if (userInput.toLowerCase().includes("cancel")) {
        setBookingStage(null);
        setSelectedDoctor(null);
        setMessages((prev) => [...prev, { role: "assistant", content: "Booking cancelled. How else can I assist you?" }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Invalid choice. Please select a valid doctor number or type 'cancel'." }]);
      }
    } else if (bookingStage === "selectSlot") {
      const choice = parseInt(userInput);
      if (!isNaN(choice) && choice > 0 && choice <= selectedDoctor.availableSlots.length) {
        setSelectedSlot(selectedDoctor.availableSlots[choice - 1]);
        const appointment = {
          id: appointments.length + 1,
          doctor: selectedDoctor.name,
          specialization: selectedDoctor.specialization,
          slot: selectedDoctor.availableSlots[choice - 1],
          date: new Date().toLocaleDateString(),
        };
        setAppointments([...appointments, appointment]);
        setBookingStage(null);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        const response = `✅ Appointment booked successfully!
        Appointment Details:
        - Doctor: ${appointment.doctor}
        - Specialization: ${appointment.specialization}
        - Date: ${appointment.date}
        - Time: ${appointment.slot}
        Please arrive 15 minutes early. How else can I assist you?`;
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      } else if (userInput.toLowerCase().includes("cancel")) {
        setBookingStage(null);
        setSelectedDoctor(null);
        setMessages((prev) => [...prev, { role: "assistant", content: "Booking cancelled. How else can I assist you?" }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Invalid slot choice. Please select a valid slot number or type 'cancel'." }]);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLastUserMessage(input);
    setInput("");

    if (bookingStage) {
      handleBookingResponse(input);
      return;
    }

    if (!isHealthRelated(input)) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ I am only able to help with health-related queries, appointment booking, or bed availability. Please ask a relevant question.",
        },
      ]);
      return;
    }

    if (input.toLowerCase().includes("bed") || input.toLowerCase().includes("availability")) {
      checkBedAvailability();
      return;
    }

    if (input.toLowerCase().includes("appointment") || input.toLowerCase().includes("book") || input.toLowerCase().includes("consult")) {
      initiateBooking(input);
      return;
    }

    const chatHistory = [
      {
        role: "system",
        content:
          "You are a helpful medical assistant. Provide ethical, accurate responses. Do not prescribe medicine. Use bullet points when explaining.",
      },
      ...messages,
      userMessage,
    ];

    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-70b-8192",
          messages: chatHistory,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer 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`,
            "Content-Type": "application/json",
          },
        }
      );

      const reply =
        res.data.choices[0].message.content +
        "\n\n⚠️ This is general information. Consult a licensed doctor for medical advice.\nWould you like to book an appointment for this issue?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Failed to get response. Please try again." },
      ]);
    }
  };

  const handleMicClick = () => {
    resetTranscript();
    setListening(true);
    SpeechRecognition.startListening({ continuous: false, language: "en-US" });
  };

  const handleStopMic = () => {
    SpeechRecognition.stopListening();
    setListening(false);
  };

  const handleRegenerate = () => {
    if (lastUserMessage) {
      setInput(lastUserMessage);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    messages.forEach((msg) => {
      const prefix = msg.role === "user" ? "You: " : "Bot: ";
      doc.text(`${prefix}${msg.content}`, 10, y);
      y += 10;
    });
    if (appointments.length > 0) {
      y += 10;
      doc.text("Appointments:", 10, y);
      y += 10;
      appointments.forEach((appt) => {
        doc.text(`- ${appt.doctor} (${appt.specialization}) on ${appt.date} at ${appt.slot}`, 10, y);
        y += 10;
      });
    }
    doc.save("chat.pdf");
  };

  const handleClear = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "👩‍⚕️ Hello! I am your Health Assistance Bot. How can I help you today with your health-related concern? I can also book doctor appointments or check bed availability.",
      },
    ]);
    setInput("");
    setFeedbackGiven({});
    setLastUserMessage("");
    setBookingStage(null);
    setSelectedDoctor(null);
    setSelectedSlot(null);
  };

  const handleFeedback = (index) => {
    setFeedbackGiven((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className={`chat-container ${darkMode ? "dark" : ""}`}>
      <div className="header">
        <h1 className="chat-title ">👩‍⚕️ MediCare Assistant</h1>
        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      <p className="chat-subtitle">Ask health questions, book appointments, or check bed availability.</p>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <img
              className={`avatar ${msg.role === "user" ? "user-avatar" : "bot-avatar"}`}
              src={msg.role === "user" ? "user-avatar.png" : "bot-avatar.png"}
              alt="avatar"
            />
            <div className="message-content">
              {msg.content}
              {msg.role === "assistant" && index !== 0 && (
                <div className="feedback">
                  {!feedbackGiven[index] ? (
                    <>
                      <button onClick={() => handleFeedback(index)}>👍</button>
                      <button onClick={() => handleFeedback(index)}>👎</button>
                    </>
                  ) : (
                    <div className="thank-you">Thanks for the feedback!</div>
                  )}
                </div>
              )}
              {msg.role === "assistant" && (
                <button
                  className={`speak-btn ${speakingIndex === index ? "speaking" : ""}`}
                  onClick={() => speak(msg.content, index)}
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="input-wrapper">
        <div className="edit-left">
          <button onClick={handleRegenerate}>✏️ Edit</button>
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Ask your medical question or request an appointment..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={handleSend}>➤</button>
          <button
            onClick={listening ? handleStopMic : handleMicClick}
            className={`mic-button ${micListening ? "listening" : ""}`}
          >
            🎤
          </button>
        </div>
      </div>

      <div className="chat-actions">
        <button onClick={handleClear}>🧹 Clear</button>
        <button onClick={handleExportPDF}>📄 Export PDF</button>
      </div>

      <p className="chat-disclaimer">
        Disclaimer: This chatbot provides general information only. Always consult a healthcare professional for medical advice.
      </p>
    </div>
  );
}

export default App;
