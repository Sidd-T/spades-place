import { loadProfile } from "./signup.js";

const SUPABASE_URL = "https://hpmafvcceagrsuiabjgl.supabase.co";
const SUPABASE_KEY = "sb_publishable_VJuwHZm8vXXMb4ygZv4jrw_V5DgaEwA";

const TIME_LIMIT = 12 * 60 * 1000;
const COOLDOWN = 30000;

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let synth = null;
let channel = null;

let myName = null;
let currentPlayer = null;

const currentPlayerEl = document.getElementById("currentPlayer");
const joinBtn = document.getElementById("joinBtn");
const leaveBtn = document.getElementById("leaveBtn");

async function initAudio() {
  if (!synth) {
    await Tone.start();
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    console.log("Audio ready");
  }
}

async function fetchCurrentPlayer() {
  const { data, error } = await sb.from("room_state").select("current_player");

  if (error) {
    console.error(error);
    return;
  }

  currentPlayer = data[0]?.current_player;
  currentPlayerEl.innerText = currentPlayer || "None";
}

document.getElementById("joinBtn").addEventListener("click", async () => {
  const { username, avatar_url } = await loadProfile();
  if (!username) return;

  console.log("Attempting to join as", username);
  await initAudio();

  const { error } = await sb
    .from("room_state")
    .update({ current_player: username })
    .eq("id", 1)
    .select();

  if (error) {
    console.error(error);
    return;
  }

  myName = username;
  joinBtn.disabled = true;
  leaveBtn.disabled = false;
  fetchCurrentPlayer();
});

document.getElementById("leaveBtn").addEventListener("click", async () => {
  stopPlaying();
});

export async function stopPlaying() {
  await sb.from("room_state").update({ current_player: null }).eq("id", 1);

  joinBtn.disabled = false;
  leaveBtn.disabled = true;

  fetchCurrentPlayer();
}

function setupRealtime() {
  channel = sb.channel("midi-room");

  channel.on("broadcast", { event: "note" }, ({ payload }) => {
    if (payload.type === "noteOn") {
      playNote(payload.note, payload.velocity, false);
    } else if (payload.type === "noteOff") {
      stopNote(payload.note, false);
    }
  });

  channel.subscribe();

  // Listen for DB changes
  sb.channel("room-state-listener")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "room_state",
      },
      (payload) => {
        currentPlayer = payload.new.current_player;
        updateUI();
      },
    )
    .subscribe();
}

function setupMIDI() {
  if (!navigator.requestMIDIAccess) {
    alert("Web MIDI not supported");
    return;
  }

  navigator.requestMIDIAccess().then((access) => {
    for (let input of access.inputs.values()) {
      input.onmidimessage = handleMIDI;
    }
  });
}

function handleMIDI(event) {
  if (myName !== currentPlayer) return;

  const [status, note, velocity] = event.data;
  const command = status & 0xf0;

  if (command === 0x90 && velocity > 0) {
    playNote(note, velocity, true);
  } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
    stopNote(note, true);
  }
}

function midiToNote(note) {
  return Tone.Frequency(note, "midi").toNote();
}

function playNote(note, velocity, send) {
  if (!synth) return;

  const noteName = midiToNote(note);
  synth.triggerAttack(noteName, undefined, velocity / 127);

  if (send && channel) {
    channel.send({
      type: "broadcast",
      event: "note",
      payload: {
        type: "noteOn",
        note,
        velocity,
      },
    });
  }
}

function stopNote(note, send) {
  if (!synth) return;

  const noteName = midiToNote(note);
  synth.triggerRelease(noteName);

  if (send && channel) {
    channel.send({
      type: "broadcast",
      event: "note",
      payload: {
        type: "noteOff",
        note,
      },
    });
  }
}

function disableJoin() {
  if (currentPlayer !== null && currentPlayer !== myName) {
    joinBtn.disabled = true;
    leaveBtn.disabled = true;
  }
}

// INIT
fetchCurrentPlayer();
disableJoin();
setupRealtime();
setupMIDI();
