const $ = (id) => document.getElementById(id);
const clock = $("clock");
function tick(){ clock.textContent = new Date().toLocaleTimeString([], {hour12:false}); }
tick(); setInterval(tick, 1000);

const startBtn = $("startVoice");
const stopBtn = $("stopVoice");
const statusText = $("assistantStatus");
const replyText = $("assistantReply");
const transcriptText = $("transcript");
const core = $("assistantCore");
let recognition = null;
let active = false;

function speak(text){
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 0.92;
  utterance.onstart = () => core.classList.add("active");
  utterance.onend = () => core.classList.remove("active");
  window.speechSynthesis.speak(utterance);
}
function respondTo(text){
  const q = text.toLowerCase();
  let answer;
  if (q.includes("project") || q.includes("orca")) answer = "Your featured missions include ORCA for marine ecosystem intelligence, Kala Sarthi for artisan market linkage, and BrandForge for AI brand intelligence. Open the Mission Files section to explore them.";
  else if (q.includes("skill") || q.includes("technology") || q.includes("stack")) answer = "Your current engineering focus includes C plus plus, Python, React, FastAPI, AI agents, and system design. Update the Technology Matrix to reflect your latest skills.";
  else if (q.includes("who are you") || q.includes("your name")) answer = "I am AURA, your portfolio assistant prototype. I can help visitors navigate the profile and explain the information configured on this page.";
  else if (q.includes("github") || q.includes("repository")) answer = "You can inspect Prathmesh's repositories through the GitHub link at the bottom of this command center.";
  else answer = "I heard: " + text + ". This starter uses local browser responses, not a connected large language model yet. Connect the optional realtime backend to enable open-ended AI conversation.";
  replyText.textContent = answer;
  statusText.textContent = "Response ready.";
  speak(answer);
}
function stopVoice(){
  active = false;
  if (recognition) { try { recognition.stop(); } catch (_) {} }
  recognition = null;
  window.speechSynthesis?.cancel();
  core.classList.remove("active");
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusText.textContent = "Voice link stopped.";
}
function startVoice(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusText.textContent = "Speech recognition unavailable.";
    replyText.textContent = "This browser does not expose speech recognition. Try a supported browser or connect the realtime voice backend. You can still browse the page normally.";
    return;
  }
  active = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusText.textContent = "Listening for your command…";
  replyText.textContent = "Speak now. AURA will respond using this prototype's configured intents.";
  core.classList.add("active");
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      else interimText += event.results[i][0].transcript;
    }
    transcriptText.textContent = finalText || interimText || "Listening…";
    if (finalText.trim()) respondTo(finalText.trim());
  };
  recognition.onerror = (event) => {
    statusText.textContent = "Voice input issue: " + event.error;
    core.classList.remove("active");
  };
  recognition.onend = () => {
    active = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    core.classList.remove("active");
    recognition = null;
  };
  try { recognition.start(); }
  catch (err) {
    statusText.textContent = "Could not start microphone.";
    replyText.textContent = "Check browser microphone permission and make sure the site is served over HTTPS or localhost.";
    stopVoice();
  }
}
startBtn.addEventListener("click", startVoice);
stopBtn.addEventListener("click", stopVoice);
$("voiceHero").addEventListener("click", () => {
  $("assistant").scrollIntoView({behavior:"smooth"});
  setTimeout(startVoice, 450);
});
document.querySelectorAll(".nav").forEach(link => link.addEventListener("click", () => {
  document.querySelectorAll(".nav").forEach(item => item.classList.remove("active"));
  link.classList.add("active");
}));

// Optional realtime voice integration:
// Implement a protected server endpoint that creates a short-lived client token.
// Then replace startVoice() with a WebRTC session using that token.
// Never place a permanent provider API key in this public JavaScript file.
