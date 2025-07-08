import React, { useState, useEffect, useRef } from "react"; // ✅ useRef added
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

  const messagesEndRef = useRef(null); // ✅ ref to auto-scroll

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

  const specializations = [...new Set(doctors.map(doc => doc.specialization))];

  useEffect(() => {
    if (!micListening && transcript) {
      setInput(transcript);
    }
  }, [micListening, transcript]);

  useEffect(() => {
    // ✅ Auto-scroll when messages update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    const keywords = ["health", "doctor", "medical", "medicine", "treatment", "diagnosis", "hospital", "clinic", "fever", "cold", "cough", "headache", "pain", "infection", "symptom", "disease", "flu", "covid", "cancer", "asthma", "vomit", "nausea", "diarrhea", "malaria", "dengue", "bp", "blood pressure", "diabetes", "tablet", "medication", "antibiotic", "surgery", "injury", "fracture", "strain", "stomach", "skin", "rash", "itch", "chest", "body", "wound", "burn", "bone", "muscle", "joint", "eye", "ear", "nose", "throat", "leg", "arm", "hand", "back", "neck", "hip", "knee", "shoulder", "foot", "feet", "tooth", "teeth", "gum", "spine", "rib", "pelvis", "ankle", "elbow", "swelling", "fatigue", "weakness", "urine", "heartbeat", "period", "pregnancy", "mental", "stress", "anxiety", "depression", "allergy", "dizzy", "blurred vision", "cramp", "appointment", "book", "consult", "bed", "availability", "admission"];
    return keywords.some((kw) => text.toLowerCase().includes(kw));
  };

  const handleBookingResponse = (userInput) => {
    if (bookingStage === "selectCategory") {
      const choice = parseInt(userInput);
      if (!isNaN(choice) && choice > 0 && choice <= specializations.length) {
        const category = specializations[choice - 1];
        const availableDoctors = doctors.filter(doc => doc.specialization === category);
        setBookingStage("selectDoctorFromCategory");
        setSelectedDoctor({ category, list: availableDoctors });

        const response = `Available doctors in ${category}:\n${availableDoctors
          .map((doc, i) => `${i + 1}. ${doc.name}`)
          .join("\n")}\nPlease select a doctor number or type "cancel" to abort.`;
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Invalid category. Please choose a valid number." }]);
      }
    } else if (bookingStage === "selectDoctorFromCategory") {
      const choice = parseInt(userInput);
      const doctorList = selectedDoctor.list;
      if (!isNaN(choice) && choice > 0 && choice <= doctorList.length) {
        const chosen = doctorList[choice - 1];
        setSelectedDoctor(chosen);
        setBookingStage("selectSlot");

        const response = `Available slots for ${chosen.name}:\n${chosen.availableSlots
          .map((slot, i) => `${i + 1}. ${slot}`)
          .join("\n")}\nPlease choose a slot or type "cancel".`;
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Invalid doctor. Please pick a valid number." }]);
      }
    } else if (bookingStage === "selectSlot") {
      const choice = parseInt(userInput);
      if (!isNaN(choice) && selectedDoctor?.availableSlots?.[choice - 1]) {
        const slot = selectedDoctor.availableSlots[choice - 1];
        const appointment = {
          id: appointments.length + 1,
          doctor: selectedDoctor.name,
          specialization: selectedDoctor.specialization,
          slot,
          date: new Date().toLocaleDateString(),
        };
        setAppointments([...appointments, appointment]);
        setBookingStage(null);
        setSelectedDoctor(null);
        setSelectedSlot(null);

        const response = `✅ Appointment booked successfully!\n\n📋 Appointment Details:\n- Doctor: ${appointment.doctor}\n- Specialization: ${appointment.specialization}\n- Date: ${appointment.date}\n- Time: ${appointment.slot}\n\nPlease arrive 15 minutes early. Anything else I can help you with?`;
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
      } else if (userInput.toLowerCase().includes("cancel")) {
        setBookingStage(null);
        setSelectedDoctor(null);
        setMessages(prev => [...prev, { role: "assistant", content: "Booking cancelled. How else can I assist you?" }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Invalid slot. Please choose a valid number or type 'cancel'." }]);
      }
    }
  };

  const initiateBooking = () => {
    setBookingStage("selectCategory");
    const response = `Please choose a medical category:\n${specializations
      .map((cat, i) => `${i + 1}. ${cat}`)
      .join("\n")}\n(Type the category number to continue)`;
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
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
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "⚠️ I am only able to help with health-related queries, appointment booking, or bed availability. Please ask a relevant question."
      }]);
      return;
    }

    if (input.toLowerCase().includes("bed") || input.toLowerCase().includes("availability")) {
      const response = `🏥 Bed Availability Status:
- General Ward: ${bedAvailability.generalWard.available}/${bedAvailability.generalWard.total} available
- ICU: ${bedAvailability.icu.available}/${bedAvailability.icu.total} available
- Private Room: ${bedAvailability.privateRoom.available}/${bedAvailability.privateRoom.total} available
- Emergency: ${bedAvailability.emergency.available}/${bedAvailability.emergency.total} available`;
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      return;
    }

    if (input.toLowerCase().includes("appointment") || input.toLowerCase().includes("book") || input.toLowerCase().includes("consult")) {
      initiateBooking();
      return;
    }

    const chatHistory = [
      {
        role: "system",
        content: "You are a helpful medical assistant. Provide ethical, accurate responses. Do not prescribe medicine. Use bullet points when explaining.",
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

      const reply = res.data.choices[0].message.content +
        "\n\n⚠️ This is general information. Consult a licensed doctor for medical advice.\nWould you like to book an appointment for this issue?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Failed to get response. Please try again." }]);
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
        <h1 className="chat-title">👩‍⚕️ MediCare Assistant</h1>
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
        <div ref={messagesEndRef} /> {/* ✅ Auto-scroll anchor */}
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
