const SUPABASE_URL = "https://hpmafvcceagrsuiabjgl.supabase.co";
const SUPABASE_KEY = "sb_publishable_VJuwHZm8vXXMb4ygZv4jrw_V5DgaEwA";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function setError(message) {
  const errorEl = document.querySelector(".error-message");
  errorEl.textContent = message;
}

async function signOut() {
  const { error } = await sb.auth.signOut();

  if (error) {
    console.error("Sign out error:", error.message);
    setError(error.message);
    return;
  }
}

async function login(username, password) {
  // Step 1: Get email from username
  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    setError("Invalid username or password");
    return;
  }

  // Step 2: Get user email
  const { data: userProfile, error: emailError } = await sb
    .from("profiles")
    .select("email")
    .eq("username", username)
    .single();

  if (emailError || !userProfile) {
    setError("User not found");
    return;
  }

  // Step 3: Sign in
  const { error } = await sb.auth.signInWithPassword({
    email: userProfile.email,
    password: password,
  });

  if (error) {
    console.error("Login error:", error.message);
    setError(error.message);
    return;
  }

  console.log("Logged in!");
}

async function signUp(email, username, password) {
  // Step 1: Create auth user
  const { data, error } = await sb.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error("Signup error:", error.message);
    setError(error.message);
    return;
  }

  if (!data || !data?.user) return;

  const user = data.user;

  // Step 2: Create profile
  const { error: profileError } = await sb.from("profiles").insert([
    {
      id: user.id,
      username: username,
      email: email,
      avatar_url: null,
    },
  ]);

  if (profileError) {
    console.error("Profile error:", profileError.message);
    setError(profileError.message);
  }

  console.log("User signed up!");
}

export async function loadProfile() {
  const {
    data: { user },
    error: userError,
  } = await sb.auth.getUser();

  if (userError || !user) {
    console.error("User error:", userError?.message);
    return;
  }

  const { data, error } = await sb
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Load profile error:", error.message);
    document.getElementById("profile-error").textContent = error.message;
    return;
  }

  // Update UI
  document.getElementById("profile-username").textContent = data.username;
  document.getElementById("profile-avatar").src = data.avatar_url;

  return { username: data.username, avatar_url: data.avatar_url };
}

async function updateProfile(username, avatarUrl) {
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { error } = await sb
    .from("profiles")
    .update({
      username: username,
      avatar_url: avatarUrl,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile error:", error.message);
    document.getElementById("profile-error").textContent = error.message;
  } else {
    await loadProfile();
  }
}

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  await login(username, password);

  loginForm.reset();
});

const signupForm = document.getElementById("signup-form");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signup-email").value;
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  await signUp(email, username, password);

  signupForm.reset();
});

document.getElementById("signoutBtn").addEventListener("click", async () => {
  await signOut();
});

sb.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    console.log("User is signed in:", session?.user);
    document.body.setAttribute("data-auth", "logged-in");
    loadProfile();
  } else if (event === "SIGNED_OUT") {
    console.log("User signed out:", session?.user);
    document.body.setAttribute("data-auth", "logged-out");
  }
});

const profileForm = document.getElementById("profile-form");

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("update-username").value;
  const avatarUrl = document.getElementById("update-avatar").value;
  await updateProfile(username, avatarUrl);

  profileForm.reset();
});